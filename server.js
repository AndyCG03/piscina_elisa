const express = require("express");
const fs = require("fs");
const fsp = require("fs").promises;
const path = require("path");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");

const config = require("./config");
const store = require("./lib/store");
const auth = require("./lib/auth");
const { upload, processImage } = require("./lib/images");

const app = express();
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));

const PUBLIC_DIR = path.join(__dirname, "public");
const GALLERY_DIR = path.join(PUBLIC_DIR, "images", "gallery");

// ===== Servir archivos estáticos (CSS, JS, imágenes) con caché controlada =====
app.use(
  express.static(PUBLIC_DIR, {
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      if (/\.(html|css|js)$/i.test(filePath)) {
        res.setHeader("Cache-Control", "no-cache");
      } else {
        res.setHeader("Cache-Control", "public, max-age=604800"); // 7 días
      }
    },
  })
);

// Ruta amigable del panel de administración
app.get("/admin", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "admin.html"));
});

// ===== Helpers de fechas =====
function pad(n) {
  return String(n).padStart(2, "0");
}
function toISO(y, m, d) {
  return `${y}-${pad(m)}-${pad(d)}`;
}
function todayISO() {
  const d = new Date();
  return toISO(d.getFullYear(), d.getMonth() + 1, d.getDate());
}
function daysInMonth(y, m) {
  return new Date(y, m, 0).getDate();
}
function parseMonth(value) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value || "")) return null;
  return value.split("-").map(Number);
}

// ===== ENDPOINTS PÚBLICOS =====

// Precios del sitio (lo que muestra la sección #info)
app.get("/api/prices", (req, res) => {
  res.json(store.getPrices());
});

// Galería en el orden configurado (data/gallery.json), no alfabético
app.get("/api/gallery", (req, res) => {
  const gallery = store.getGallery();
  const photos = [...gallery.photos]
    .sort((a, b) => a.order - b.order)
    .map((p) => ({
      id: p.id,
      src: "/images/gallery/" + encodeURIComponent(p.file),
      featured: !!p.featured,
      order: p.order,
      uploadedAt: p.uploadedAt,
    }));
  res.json({ images: photos.map((p) => p.src), photos });
});

// Disponibilidad por mes. NUNCA expone datos privados del cliente.
app.get("/api/availability", (req, res) => {
  const parsed = parseMonth(req.query.month);
  if (!parsed) return res.status(400).json({ error: "Mes inválido" });
  const [y, m] = parsed;
  const today = todayISO();
  const reservations = store.getReservations().reservations;
  const statuses = {};
  for (let d = 1; d <= daysInMonth(y, m); d++) {
    const key = toISO(y, m, d);
    if (key < today) statuses[key] = "past";
    else if (reservations[key]) statuses[key] = reservations[key].type; // "reserved" | "blocked"
    else statuses[key] = "available";
  }
  res.json({ month: `${y}-${pad(m)}`, statuses });
});

// ===== AUTENTICACIÓN DEL ADMIN =====
app.post("/api/admin/login", (req, res) => {
  const { user, pass } = req.body || {};
  // Comparación segura: mira longitud antes de timingSafeEqual (que lanza con tamaños distintos)
  const uA = Buffer.from(config.adminUser);
  const pA = Buffer.from(config.adminPass);
  const uB = Buffer.from(String(user || ""));
  const pB = Buffer.from(String(pass || ""));
  const userOk = uB.length === uA.length && crypto.timingSafeEqual(uB, uA);
  const passOk = pB.length === pA.length && crypto.timingSafeEqual(pB, pA);
  if (!userOk || !passOk) {
    return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
  }
  const secure = req.secure || req.get("x-forwarded-proto") === "https";
  res.cookie(config.cookieName, auth.signSession(), {
    httpOnly: true,
    sameSite: "lax",
    secure,
    maxAge: 8 * 60 * 60 * 1000,
    path: "/",
  });
  res.json({ ok: true });
});

app.post("/api/admin/logout", (req, res) => {
  res.clearCookie(config.cookieName, { path: "/" });
  res.json({ ok: true });
});

app.get("/api/admin/session", auth.requireAuth, (req, res) => {
  res.json({ ok: true });
});

// ===== ADMIN: PRECIOS =====
app.put("/api/admin/prices", auth.requireAuth, (req, res) => {
  const body = req.body || {};
  const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
  const prices = {
    currency: body.currency || "CUP",
    basePrice: num(body.basePrice),
    includedPeople: num(body.includedPeople),
    extraPerPerson: num(body.extraPerPerson),
    maxPeople: num(body.maxPeople),
    deposit: num(body.deposit),
    addons: {},
  };
  const keys = ["basePrice", "includedPeople", "extraPerPerson", "maxPeople", "deposit"];
  if (keys.some((k) => prices[k] === null || prices[k] < 0)) {
    return res.status(400).json({ error: "Valores de precios inválidos" });
  }
  for (const key of ["horno", "nevera", "wifi"]) {
    const a = body.addons && body.addons[key];
    const p = num(a && a.price);
    if (p === null || p < 0) return res.status(400).json({ error: `Precio de ${key} inválido` });
    prices.addons[key] = { name: (a && a.name) || key, price: p };
  }
  store.savePrices(prices);
  res.json(prices);
});

// ===== ADMIN: RESERVACIONES =====
app.get("/api/admin/reservations", auth.requireAuth, (req, res) => {
  const parsed = parseMonth(req.query.month);
  if (!parsed) return res.status(400).json({ error: "Mes inválido" });
  const [y, m] = parsed;
  const all = store.getReservations().reservations;
  const entries = {};
  for (let d = 1; d <= daysInMonth(y, m); d++) {
    const key = toISO(y, m, d);
    if (all[key]) entries[key] = all[key];
  }
  res.json({ month: `${y}-${pad(m)}`, entries });
});

function validateReservationBody(body) {
  const date = body && body.date;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) return { error: "Fecha inválida" };
  const type = body.type === "blocked" ? "blocked" : body.type === "reserved" ? "reserved" : null;
  if (!type) return { error: "Tipo inválido" };
  if (type === "reserved" && !(body.name || "").trim()) return { error: "El nombre es obligatorio" };
  return { date, type };
}

app.post("/api/admin/reservations", auth.requireAuth, (req, res) => {
  const v = validateReservationBody(req.body);
  if (v.error) return res.status(400).json({ error: v.error });
  const { date, type } = v;
  if (date < todayISO()) return res.status(400).json({ error: "No se puede reservar un día pasado" });

  const all = store.getReservations().reservations;
  if (all[date]) return res.status(409).json({ error: "Ese día ya está reservado o bloqueado" });

  const entry = {
    type,
    name: type === "reserved" ? req.body.name.trim() : undefined,
    phone: type === "reserved" ? (req.body.phone || "").trim() || undefined : undefined,
    notes: (req.body.notes || "").trim() || undefined,
    createdAt: new Date().toISOString(),
  };
  store.setReservation(date, entry);
  res.json({ date, entry });
});

app.put("/api/admin/reservations/:date", auth.requireAuth, (req, res) => {
  const { date } = req.params;
  const all = store.getReservations().reservations;
  if (!all[date]) return res.status(404).json({ error: "No existe reserva para esa fecha" });

  const type = req.body.type === "blocked" ? "blocked" : req.body.type === "reserved" ? "reserved" : null;
  if (!type) return res.status(400).json({ error: "Tipo inválido" });
  if (type === "reserved" && !(req.body.name || "").trim()) {
    return res.status(400).json({ error: "El nombre es obligatorio" });
  }

  const existing = all[date];
  const entry = {
    type,
    name: type === "reserved" ? req.body.name.trim() : undefined,
    phone: type === "reserved" ? (req.body.phone || "").trim() || existing.phone || undefined : undefined,
    notes: (req.body.notes || "").trim() || undefined,
    createdAt: existing.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.setReservation(date, entry);
  res.json({ date, entry });
});

app.delete("/api/admin/reservations/:date", auth.requireAuth, (req, res) => {
  const { date } = req.params;
  const all = store.getReservations().reservations;
  if (!all[date]) return res.status(404).json({ error: "No existe reserva para esa fecha" });
  store.setReservation(date, null);
  res.json({ ok: true });
});

// ===== ADMIN: GALERÍA =====
app.get("/api/admin/gallery", auth.requireAuth, (req, res) => {
  res.json(store.getGallery());
});

// Subir una o varias fotos (multipart, campo "photos"). Se convierten a .webp.
app.post("/api/admin/gallery", auth.requireAuth, upload.array("photos", 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No se recibieron archivos" });
    }
    const gallery = store.getGallery();
    let maxOrder = gallery.photos.reduce((mx, p) => Math.max(mx, p.order), -1);
    const added = [];

    for (const file of req.files) {
      const { buffer, filename } = await processImage(file.buffer);
      await fsp.writeFile(path.join(GALLERY_DIR, filename), buffer);
      maxOrder += 1;
      const photo = {
        id: `p${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        file: filename,
        order: maxOrder,
        featured: false,
        uploadedAt: new Date().toISOString(),
      };
      gallery.photos.push(photo);
      added.push(photo);
    }

    store.saveGallery(gallery);
    res.json({ ok: true, added });
  } catch (err) {
    res.status(500).json({ error: "Error al procesar las imágenes: " + err.message });
  }
});

// Reordenar y/o marcar portada. Body: { order: [id...], featured: id|null }
app.put("/api/admin/gallery/order", auth.requireAuth, (req, res) => {
  const { order, featured } = req.body || {};
  const gallery = store.getGallery();
  if (!Array.isArray(order) || order.length !== gallery.photos.length) {
    return res.status(400).json({ error: "Orden inválido" });
  }
  const byId = new Map(gallery.photos.map((p) => [p.id, p]));
  const ordered = order.map((id, idx) => {
    const photo = byId.get(id);
    if (!photo) throw null;
    return { ...photo, order: idx };
  });
  if (featured != null) {
    if (!byId.has(featured)) return res.status(400).json({ error: "Portada inválida" });
    for (const p of ordered) p.featured = p.id === featured;
  }
  try {
    store.saveGallery({ photos: ordered });
    res.json({ ok: true });
  } catch {
    res.status(400).json({ error: "Orden inválido" });
  }
});

// Eliminar una foto (borra también su archivo del disco)
app.delete("/api/admin/gallery/:id", auth.requireAuth, async (req, res) => {
  const gallery = store.getGallery();
  const idx = gallery.photos.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Foto no encontrada" });

  const [photo] = gallery.photos.splice(idx, 1);
  gallery.photos.forEach((p, i) => (p.order = i));
  store.saveGallery(gallery);

  try {
    await fsp.unlink(path.join(GALLERY_DIR, photo.file));
  } catch {
    // El archivo ya no existía; la metadata ya quedó limpia.
  }
  res.json({ ok: true });
});

app.listen(config.port, () => {
  console.log(`\n  🏖️  Piscina "La Elisa" corriendo en: http://localhost:${config.port}`);
  console.log(`  🔐  Panel admin: http://localhost:${config.port}/admin`);
  console.log(`  📷  Fotos en: ${GALLERY_DIR}`);
  console.log(`  📊  Datos en: ${path.join(__dirname, "data")}\n`);
});

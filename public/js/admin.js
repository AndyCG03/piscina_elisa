// ===== Panel de administración de Piscina La Elisa =====
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const esc = (s) =>
  String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const loginView = $("#loginView");
const appView = $("#appView");
const sheet = $("#adminSheet");
const sheetPanel = $("#adminSheetPanel");

let calendar = null;
let calendarInitialized = false;
let photos = [];

function showMsg(el, text, type) {
  el.textContent = text;
  el.hidden = false;
  el.className = "form__msg " + (type === "ok" ? "form__msg--ok" : type === "err" ? "form__msg--err" : "");
}

async function api(path, opts) {
  opts = opts || {};
  const res = await fetch(path, opts);
  if (res.status === 401) {
    showLogin();
    const e = new Error("Sesión expirada. Vuelve a iniciar sesión.");
    throw e;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Error del servidor");
  return data;
}

// ===== Login / Logout =====
function showLogin() {
  appView.hidden = true;
  loginView.hidden = false;
}
async function initApp() {
  appView.hidden = false;
  loginView.hidden = true;
  if (!calendarInitialized) {
    calendarInitialized = true;
    await initCalendarAdmin();
  }
  loadPricesForm();
  loadGalleryAdmin();
  await calendar.refresh();
}

async function checkSession() {
  try {
    await api("/api/admin/session");
    initApp();
  } catch {
    /* sin sesión: se muestra el login */
  }
}

$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    await api("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: fd.get("user"), pass: fd.get("pass") }),
    });
    $("#loginError").hidden = true;
    initApp();
  } catch (err) {
    $("#loginError").textContent = err.message;
    $("#loginError").hidden = false;
  }
});

$("#logoutBtn").addEventListener("click", async () => {
  try {
    await fetch("/api/admin/logout", { method: "POST" });
  } catch {}
  showLogin();
});

// ===== Tabs =====
$$(".tab").forEach((btn) =>
  btn.addEventListener("click", () => {
    $$(".tab").forEach((b) => b.classList.toggle("is-active", b === btn));
    $$(".tab-pane").forEach((p) => p.classList.toggle("is-active", p.id === "tab-" + btn.dataset.tab));
    if (btn.dataset.tab === "calendar" && calendar) calendar.refresh();
  })
);

// ===== Precios =====
async function loadPricesForm() {
  try {
    const p = await api("/api/prices");
    const f = $("#pricesForm");
    f.basePrice.value = p.basePrice;
    f.includedPeople.value = p.includedPeople;
    f.extraPerPerson.value = p.extraPerPerson;
    f.maxPeople.value = p.maxPeople;
    f.deposit.value = p.deposit;
    f.horno.value = p.addons.horno.price;
    f.nevera.value = p.addons.nevera.price;
    f.wifi.value = p.addons.wifi.price;
  } catch {}
}

$("#pricesForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target;
  const payload = {
    currency: "CUP",
    basePrice: +f.basePrice.value,
    includedPeople: +f.includedPeople.value,
    extraPerPerson: +f.extraPerPerson.value,
    maxPeople: +f.maxPeople.value,
    deposit: +f.deposit.value,
    addons: {
      horno: { price: +f.horno.value },
      nevera: { price: +f.nevera.value },
      wifi: { price: +f.wifi.value },
    },
  };
  try {
    await api("/api/admin/prices", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    showMsg($("#pricesMsg"), "Precios actualizados y visibles en la web.", "ok");
  } catch (err) {
    showMsg($("#pricesMsg"), err.message, "err");
  }
});

// ===== Calendario admin =====
function initCalendarAdmin() {
  const container = $("#adminCalendar");
  calendar = window.PoolCalendar.create(container, {
    defaultMonth: window.PoolCalendar.todayKey(),
    minMonth: window.PoolCalendar.todayKey(),
    async onMonth(month) {
      const data = await api(`/api/admin/reservations?month=${month}`);
      const statuses = {};
      for (const [k, v] of Object.entries(data.entries || {})) statuses[k] = v.type;
      return { statuses };
    },
    onDayClick: adminDayClick,
  });
  return calendar.init();
}

function toMonthOf(dateKey) {
  return dateKey.slice(0, 7);
}

async function adminDayClick(date, status) {
  if (status === "past") return;
  if (status === "available") showCreateSheet(date);
  else showDetailSheet(date); // reserved | blocked
}

function showCreateSheet(date) {
  const label = window.PoolCalendar.formatLabel(date);
  sheetPanel.innerHTML = `
    <div class="sheet__handle"></div>
    <h3 class="sheet__title" style="text-transform:capitalize">${label}</h3>
    <p class="sheet__subtitle">Crear una reserva o bloquear el día.</p>
    <form id="createForm" class="form" style="margin-top:16px">
      <label class="field"><span class="field__label">Nombre</span>
        <input name="name" class="field__input" placeholder="Nombre de la persona" /></label>
      <label class="field"><span class="field__label">Teléfono</span>
        <input name="phone" class="field__input" inputmode="tel" placeholder="Ej: 55555555" /></label>
      <label class="field"><span class="field__label">Notas</span>
        <textarea name="notes" class="field__input" rows="2" placeholder="Opcional"></textarea></label>
      <p class="form__msg" id="createMsg" hidden></p>
      <button type="submit" class="btn btn--blue">Guardar reserva</button>
    </form>
    <div class="sheet__actions" style="margin-top:12px">
      <button type="button" class="btn btn--soft" id="blockDay">Bloquear (mantenimiento)</button>
      <button type="button" class="btn btn--soft" id="cancelCreate">Cancelar</button>
    </div>`;
  openSheet();

  const save = async (body) => {
    try {
      await api("/api/admin/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, ...body }),
      });
      closeSheet();
      calendar.refresh();
    } catch (err) {
      showMsg($("#createMsg"), err.message, "err");
    }
  };

  $("#createForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    save({ type: "reserved", name: fd.get("name"), phone: fd.get("phone"), notes: fd.get("notes") });
  });
  $("#blockDay").addEventListener("click", () => save({ type: "blocked" }));
  $("#cancelCreate").addEventListener("click", closeSheet);
}

async function showDetailSheet(date) {
  const data = await api(`/api/admin/reservations?month=${toMonthOf(date)}`);
  const entry = (data.entries || {})[date];
  if (!entry) {
    calendar.refresh();
    return;
  }
  const label = window.PoolCalendar.formatLabel(date);
  const isRes = entry.type === "reserved";
  sheetPanel.innerHTML = `
    <div class="sheet__handle"></div>
    <h3 class="sheet__title" style="text-transform:capitalize">${label}</h3>
    <span class="sheet__pill ${isRes ? "sheet__pill--reserved" : "sheet__pill--blocked"}">${isRes ? "Reservado" : "Bloqueado"}</span>
    <div class="sheet__rows">
      <div class="sheet__row"><span class="sheet__rowlabel">Nombre</span><span class="sheet__rowvalue">${esc(entry.name) || "—"}</span></div>
      <div class="sheet__row"><span class="sheet__rowlabel">Teléfono</span><span class="sheet__rowvalue">${esc(entry.phone) || "—"}</span></div>
      <div class="sheet__row"><span class="sheet__rowlabel">Notas</span><span class="sheet__rowvalue">${esc(entry.notes) || "—"}</span></div>
    </div>
    <div class="sheet__actions">
      <button type="button" class="btn btn--blue" id="actEdit">Editar</button>
      <button type="button" class="btn btn--danger" id="actDelete">Eliminar / liberar día</button>
      <button type="button" class="btn btn--soft" id="actClose">Cerrar</button>
    </div>`;
  openSheet();

  $("#actEdit").addEventListener("click", () => showEditSheet(date, entry));
  $("#actDelete").addEventListener("click", async () => {
    if (!confirm("¿Liberar este día? Se eliminará la reserva.")) return;
    try {
      await api(`/api/admin/reservations/${date}`, { method: "DELETE" });
      closeSheet();
      calendar.refresh();
    } catch (err) {
      alert(err.message);
    }
  });
  $("#actClose").addEventListener("click", closeSheet);
}

function showEditSheet(date, entry) {
  const label = window.PoolCalendar.formatLabel(date);
  const isRes = entry.type === "reserved";
  sheetPanel.innerHTML = `
    <div class="sheet__handle"></div>
    <h3 class="sheet__title" style="text-transform:capitalize">${label}</h3>
    <p class="sheet__subtitle">Editar la reserva.</p>
    <form id="editForm" class="form" style="margin-top:16px">
      <label class="field"><span class="field__label">Nombre</span>
        <input name="name" class="field__input" value="${esc(entry.name) || ""}" /></label>
      <label class="field"><span class="field__label">Teléfono</span>
        <input name="phone" class="field__input" inputmode="tel" value="${esc(entry.phone) || ""}" /></label>
      <label class="field"><span class="field__label">Notas</span>
        <textarea name="notes" class="field__input" rows="2">${esc(entry.notes) || ""}</textarea></label>
      <label class="field"><input type="checkbox" name="blocked" id="editBlocked" ${isRes ? "" : "checked"} />
        Bloquear día (mantenimiento, sin datos)</label>
      <p class="form__msg" id="editMsg" hidden></p>
      <button type="submit" class="btn btn--blue">Guardar cambios</button>
    </form>
    <div class="sheet__actions" style="margin-top:12px">
      <button type="button" class="btn btn--soft" id="closeEdit">Cerrar</button>
    </div>`;
  openSheet();

  $("#editForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const type = $("#editBlocked").checked ? "blocked" : "reserved";
    if (type === "reserved" && !(fd.get("name") || "").trim()) {
      showMsg($("#editMsg"), "El nombre es obligatorio para una reserva.", "err");
      return;
    }
    try {
      await api(`/api/admin/reservations/${date}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, name: fd.get("name"), phone: fd.get("phone"), notes: fd.get("notes") }),
      });
      closeSheet();
      calendar.refresh();
    } catch (err) {
      showMsg($("#editMsg"), err.message, "err");
    }
  });
  $("#closeEdit").addEventListener("click", closeSheet);
}

// ===== Galería admin =====
async function loadGalleryAdmin() {
  try {
    const g = await api("/api/admin/gallery");
    photos = g.photos || [];
  } catch {}
  renderGallery();
}

function renderGallery() {
  const grid = $("#galleryAdmin");
  if (!photos.length) {
    grid.innerHTML = '<p class="admin__hint">Todavía no hay fotos. Sube la primera.</p>';
    return;
  }
  grid.innerHTML = photos
    .map((p) => {
      const src = "/images/gallery/" + encodeURIComponent(p.file);
      return `
        <div class="admgrid__item ${p.featured ? "is-featured" : ""}">
          ${p.featured ? '<span class="admgrid__badge">Portada</span>' : ""}
          <img class="admgrid__img" src="${src}" alt="Foto ${p.order + 1}" loading="lazy" />
          <div class="admgrid__tools">
            <div class="admgrid__btns">
              <button type="button" class="admgrid__icon" data-act="up" data-id="${p.id}" ${p.order === 0 ? "disabled" : ""} aria-label="Subir">&#9650;</button>
              <button type="button" class="admgrid__icon" data-act="down" data-id="${p.id}" ${p.order === photos.length - 1 ? "disabled" : ""} aria-label="Bajar">&#9660;</button>
            </div>
            <div class="admgrid__btns">
              <button type="button" class="admgrid__icon ${p.featured ? "is-featured" : ""}" data-act="star" data-id="${p.id}" aria-label="Portada">&#9733;</button>
              <button type="button" class="admgrid__icon admgrid__icon--del" data-act="del" data-id="${p.id}" aria-label="Eliminar">&#10005;</button>
            </div>
          </div>
        </div>`;
    })
    .join("");
}

$("#galleryAdmin").addEventListener("click", async (e) => {
  const btn = e.target.closest(".admgrid__icon");
  if (!btn) return;
  const { act, id } = btn.dataset;
  const idx = photos.findIndex((p) => p.id === id);
  const done = () => {
    showMsg($("#galleryMsg"), "Galería actualizada. Ya se ve en la web.", "ok");
    renderGallery();
  };

  try {
    if (act === "del") {
      if (!confirm("¿Eliminar esta foto de la galería?")) return;
      await api(`/api/admin/gallery/${id}`, { method: "DELETE" });
      photos.splice(idx, 1);
      photos.forEach((p, i) => (p.order = i));
      done();
    } else if (act === "up") {
      if (idx < 1) return;
      [photos[idx - 1], photos[idx]] = [photos[idx], photos[idx - 1]];
      await pushOrder();
      done();
    } else if (act === "down") {
      if (idx > photos.length - 2) return;
      [photos[idx + 1], photos[idx]] = [photos[idx], photos[idx + 1]];
      await pushOrder();
      done();
    } else if (act === "star") {
      photos.forEach((p) => (p.featured = p.id === id));
      await pushOrder();
      done();
    }
  } catch (err) {
    showMsg($("#galleryMsg"), err.message, "err");
  }
});

async function pushOrder() {
  photos.forEach((p, i) => (p.order = i));
  const featured = photos.find((p) => p.featured);
  await api("/api/admin/gallery/order", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ order: photos.map((p) => p.id), featured: featured ? featured.id : null }),
  });
}

$("#photoInput").addEventListener("change", async (e) => {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;
  showMsg($("#galleryMsg"), "Subiendo y optimizando fotos…");
  const fd = new FormData();
  files.forEach((f) => fd.append("photos", f));
  try {
    await api("/api/admin/gallery", { method: "POST", body: fd });
    showMsg($("#galleryMsg"), "Fotos subidas y optimizadas a webp.", "ok");
    await loadGalleryAdmin();
  } catch (err) {
    showMsg($("#galleryMsg"), err.message, "err");
  }
  e.target.value = "";
});

// ===== Bottom sheet =====
function openSheet() {
  sheet.hidden = false;
}
function closeSheet() {
  sheet.hidden = true;
}
sheet.addEventListener("click", (e) => {
  if (e.target === sheet) closeSheet();
});

checkSession();
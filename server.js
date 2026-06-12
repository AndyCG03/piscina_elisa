const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const PUBLIC_DIR = path.join(__dirname, "public");
const GALLERY_DIR = path.join(PUBLIC_DIR, "images", "gallery");

// Servir archivos estáticos (CSS, JS, imágenes) con caché controlada.
// - HTML, CSS y JS: "no-cache" => el navegador SIEMPRE revalida con el servidor.
//   Gracias al ETag/Last-Modified responde 304 si no cambió (rápido) o 200 con
//   la versión nueva si la editaste. Así nunca se queda CSS viejo cacheado.
// - Imágenes/íconos: se pueden cachear bastante tiempo (cambian poco).
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

// Extensiones de imagen aceptadas en la galería
const IMG_EXTS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".bmp"]);

/**
 * Devuelve la lista de imágenes que existan dentro de /public/images/gallery.
 * Basta con copiar fotos a esa carpeta para que aparezcan en la web.
 */
app.get("/api/gallery", (req, res) => {
  fs.readdir(GALLERY_DIR, (err, files) => {
    if (err) {
      // Si la carpeta no existe todavía, devolvemos lista vacía sin romper la web
      return res.json({ images: [] });
    }
    const images = files
      .filter((f) => IMG_EXTS.has(path.extname(f).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, "es", { numeric: true }))
      .map((f) => "/images/gallery/" + encodeURIComponent(f));
    res.json({ images });
  });
});

app.listen(PORT, () => {
  console.log(`\n  🏖️  Piscina "La Elisa" corriendo en: http://localhost:${PORT}\n`);
  console.log(`  📷  Coloca tus fotos en: ${GALLERY_DIR}\n`);
});

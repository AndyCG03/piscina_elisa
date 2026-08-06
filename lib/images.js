const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const sharp = require("sharp");

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB por imagen
const ALLOWED = new Set([".jpg", ".jpeg", ".png", ".webp"]);

// Configuración de multer: memoria, tipos permitidos y tamaño máximo.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE, files: 20 },
  fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (ALLOWED.has(ext)) cb(null, true);
    else cb(new Error("Tipo de archivo no permitido"));
  },
});

const TARGET_WIDTH = 1600;

/**
 * Procesa un buffer de imagen: redimensiona y convierte a .webp.
 * Devuelve { buffer, filename } listo para guardar en la galería.
 */
async function processImage(buffer) {
  const img = sharp(buffer).rotate(); // respeta EXIF de rotación del móvil
  const meta = await img.metadata();

  let resized = img;
  if (meta.width > TARGET_WIDTH) {
    resized = img.resize({ width: TARGET_WIDTH, withoutEnlargement: true });
  }

  const out = await resized.webp({ quality: 82 }).toBuffer();
  const filename = `la-elisa-${Date.now()}-${crypto.randomBytes(3).toString("hex")}.webp`;
  return { buffer: out, filename, width: Math.min(meta.width || 0, TARGET_WIDTH) };
}

module.exports = { upload, processImage, MAX_SIZE };
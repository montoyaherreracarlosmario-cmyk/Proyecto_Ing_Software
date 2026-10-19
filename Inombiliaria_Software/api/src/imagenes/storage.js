const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const sharp = require('sharp');

const UPLOAD_DIR = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads/imagenes');
const MAX = Number(process.env.MAX_IMAGEN_BYTES || 10485760); // 10 MB
const TIPOS = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Guarda en memoria; sharp valida de verdad que sea una imagen (magic bytes)
const subir = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX },
  fileFilter: (req, file, cb) => {
    if (!TIPOS[file.mimetype]) return cb(new Error('Formato no permitido (solo PNG, JPG o WEBP)'));
    cb(null, true);
  },
});

// Valida, redimensiona (≤2048 px) y escribe en disco. Devuelve el nombre de archivo.
async function procesar(buffer, tipoCampo) {
  const meta = await sharp(buffer).metadata(); // lanza si no es imagen real
  if (!meta.width || !meta.height) throw new Error('Archivo corrupto');

  const ext = meta.format === 'jpeg' ? 'jpg' : meta.format === 'png' ? 'png' : meta.format === 'webp' ? 'webp' : null;
  if (!ext) throw new Error('Formato no soportado');

  const tipo = String(tipoCampo || 'otro').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 20) || 'otro';
  const nombre = `${tipo}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;

  const redim = await sharp(buffer)
    .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
    .toFile(path.join(UPLOAD_DIR, nombre));

  return { nombre, width: redim.width, height: redim.height };
}

function listar(tipo) {
  const archivos = fs.readdirSync(UPLOAD_DIR).filter((f) => !f.startsWith('.'));
  const filtrados = tipo ? archivos.filter((f) => f.startsWith(`${tipo}-`)) : archivos;
  return filtrados.sort().reverse().map((f) => ({
    nombre: f,
    url: `/archivos/${f}`,
    tipo: f.split('-')[0],
  }));
}

module.exports = { subir, procesar, listar, UPLOAD_DIR };

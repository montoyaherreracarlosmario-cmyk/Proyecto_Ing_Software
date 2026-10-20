import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import crypto from 'crypto';
import multer from 'multer';
import sharp from 'sharp';

// Carpeta destino: UPLOAD_DIR (env) o, si no existe/es de solo lectura, la temporal del SO
// (Render free solo permite escribir en /tmp; en local queda en uploads/imagenes).
function dirDefecto() {
  const local = path.resolve(process.cwd(), 'uploads/imagenes');
  try {
    fs.mkdirSync(local, { recursive: true });
    return local;
  } catch {
    return path.join(os.tmpdir(), 'habitat-uploads');
  }
}

export const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.cwd(), process.env.UPLOAD_DIR)
  : dirDefecto();

const MAX = Number(process.env.MAX_IMAGEN_BYTES || 10485760); // 10 MB
const TIPOS: any = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Guarda en memoria; sharp valida de verdad que sea una imagen (magic bytes)
export const subirOpciones = {
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX },
  fileFilter: (req: any, file: any, cb: any) => {
    if (!TIPOS[file.mimetype]) {
      const e: any = new Error('Formato no permitido (solo PNG, JPG o WEBP)');
      e.status = 400;
      return cb(e);
    }
    cb(null, true);
  },
};

// Valida, redimensiona (≤2048 px) y escribe en disco. Devuelve el nombre de archivo.
export async function procesar(buffer: Buffer, tipoCampo: any) {
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

export function listar(tipo?: string) {
  const archivos = fs.readdirSync(UPLOAD_DIR).filter((f) => !f.startsWith('.'));
  const filtrados = tipo ? archivos.filter((f) => f.startsWith(`${tipo}-`)) : archivos;
  return filtrados.sort().reverse().map((f) => ({
    nombre: f,
    url: `/archivos/${f}`,
    tipo: f.split('-')[0],
  }));
}

const { Router } = require('express');
const { subir, procesar, listar } = require('./storage');

const r = Router();

// Subida genérica de imágenes (fotos de casas, hoteles, etc.)
// multipart/form-data: campo "imagen" (obligatorio) + campo "tipo" (casa | hotel | otro, opcional)
r.post('/subir', subir.single('imagen'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Falta la imagen (campo "imagen")' });
    const { nombre, width, height } = await procesar(req.file.buffer, req.body?.tipo);
    res.json({ nombre, url: `/archivos/${nombre}`, tipo: String(req.body?.tipo || 'otro') });
  } catch (e) {
    res.status(400).json({ error: e.message || 'No se pudo procesar la imagen' });
  }
});

// Listado (filtro opcional ?tipo=casa|hotel|otro)
r.get('/', (req, res) => {
  res.json(listar(req.query.tipo));
});

module.exports = r;

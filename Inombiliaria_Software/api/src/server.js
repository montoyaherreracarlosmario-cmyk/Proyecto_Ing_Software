require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const conectar = require('./db');
const firmas = require('./firmas/routes');
const imagenes = require('./imagenes/routes');
const { ErrorFirma } = require('./firmas/service');
const { UPLOAD_DIR } = require('./imagenes/storage');

const app = express();

const origenes = process.env.FRONTEND_URL?.split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({ origin: origenes?.length ? origenes : true }));
app.use(express.json({ limit: '10mb' })); // las firmas viajan como base64

// Sub-api genérica de imágenes (sin conexión con firmas)
app.use('/api/imagenes', imagenes);
app.use('/archivos', express.static(UPLOAD_DIR));

// Módulo de firmas electrónicas
app.use('/api/firmas', firmas);

app.get('/api/salud', (req, res) => res.json({ ok: true, servicio: 'habitat-capital-api' }));

// Manejador de errores de negocio (ErrorFirma u otros)
app.use((err, req, res, next) => {
  if (err instanceof ErrorFirma) return res.status(err.status).json({ error: err.message });
  if (err?.name === 'MulterError') return res.status(413).json({ error: 'Imagen demasiado grande' });
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 4100;

conectar()
  .then(() => app.listen(PORT, '0.0.0.0', () => console.log(`API escuchando en el puerto ${PORT}`)))
  .catch((e) => { console.error('No se pudo conectar a MongoDB:', e.message); process.exit(1); });

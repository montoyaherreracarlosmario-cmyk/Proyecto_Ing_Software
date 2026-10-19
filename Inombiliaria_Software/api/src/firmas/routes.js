const { Router } = require('express');
const service = require('./service');

const r = Router();

// Envuelve errores de negocio con su status
const manejado = (fn) => (req, res, next) => fn(req, res).catch(next);

// Crear acuerdo (desde el formulario de contrato del frontend)
r.post('/acuerdos', manejado(async (req, res) => {
  const { inmueble, tipo, datos, firmantes } = req.body || {};
  res.json(await service.crearAcuerdo({ inmueble, tipo, datos, firmantes }));
}));

// Estado del acuerdo (panel administrativo)
r.get('/acuerdos/:id', manejado(async (req, res) => {
  res.json(await service.obtenerAcuerdo(req.params.id));
}));

// Datos públicos para la pantalla de firma (contrato, turno, rol)
r.get('/t/:token', manejado(async (req, res) => {
  res.json(await service.obtenerPorToken(req.params.token));
}));

// Registrar firma (valida el turno en el servidor)
r.post('/t/:token/firmar', manejado(async (req, res) => {
  res.json(await service.firmar(req.params.token, { ...(req.body || {}), req }));
}));

// Rechazo del administrativo con observaciones
r.post('/t/:token/rechazar', manejado(async (req, res) => {
  res.json(await service.rechazar(req.params.token, { ...(req.body || {}), req }));
}));

// Verificación de integridad (recomputa hashes — validez Ley 527)
r.get('/acuerdos/:id/verificar', manejado(async (req, res) => {
  res.json(await service.verificar(req.params.id));
}));

// PDF final (contrato + firmas + anexo de evidencia)
r.get('/acuerdos/:id/pdf', manejado(async (req, res) => {
  const buffer = await service.pdfDe(req.params.id);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="contrato-${req.params.id}.pdf"`);
  res.send(buffer);
}));

module.exports = r;

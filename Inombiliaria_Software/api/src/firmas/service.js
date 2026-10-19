const { AcuerdoFirma } = require('./model');
const { hashContrato, hashCadena, generarToken, ipDe, tokenSeguro } = require('./hash');
const { generarPdf, guardarEnGridFS, leerDeGridFS } = require('./pdf');

const METODOS = ['tipografica', 'canvas', 'imagen'];
const MAX_FIRMA = Number(process.env.MAX_FIRMA_BYTES || 1000000);

class ErrorFirma extends Error {
  constructor(status, mensaje) { super(mensaje); this.status = status; }
}

const fechaTexto = () => new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

function validarImagen(imagen) {
  if (typeof imagen !== 'string' || !imagen.startsWith('data:image/png;base64,')) {
    throw new ErrorFirma(400, 'La firma debe ser una imagen PNG (dataURL) normalizada');
  }
  if (imagen.length > MAX_FIRMA * 1.4) {
    throw new ErrorFirma(413, 'La imagen de firma supera el tamaño permitido');
  }
}

function buscarPorToken(acuerdo, token) {
  return acuerdo?.firmantes?.find((f) => tokenSeguro(f.token, token));
}

// ===== Crear acuerdo: genera los 3 tokens y el hash del contrato =====
async function crearAcuerdo({ inmueble, tipo, datos, firmantes }) {
  if (!['arriendo', 'venta'].includes(tipo)) throw new ErrorFirma(400, 'Tipo de contrato inválido');
  if (!datos || typeof datos !== 'object') throw new ErrorFirma(400, 'Faltan los datos del contrato');
  if (!Array.isArray(firmantes) || firmantes.length !== 3) {
    throw new ErrorFirma(400, 'Se requieren exactamente 3 firmantes (comprador, vendedor y administrador)');
  }
  const ordenEsperado = [1, 2, 3];
  const conOrden = firmantes.map((f, i) => {
    if (!f.rol || typeof f.rol !== 'string') throw new ErrorFirma(400, 'Cada firmante necesita un rol');
    return {
      rol: f.rol,
      orden: ordenEsperado[i],
      estado: 'pendiente',
      token: generarToken(),
      nombre: f.nombre || '',
      datos: null,
      imagen: null,
      evidencia: null,
    };
  });

  // El snapshot congela la fecha del contrato: pantalla, PDF y hash coinciden siempre
  const snapshot = { ...datos, fecha: datos.fecha || fechaTexto() };
  const acuerdo = await AcuerdoFirma.create({
    inmueble: inmueble || undefined,
    tipo,
    datos: snapshot,
    fechaContrato: snapshot.fecha,
    contratoHash: hashContrato(snapshot),
    firmantes: conOrden,
  });

  return pactoPublico(acuerdo);
}

// Vista "pública" del acuerdo: sin tokens ni imágenes, con los links por separado
function pactoPublico(acuerdo) {
  const links = acuerdo.firmantes.map((f) => ({
    rol: f.rol,
    orden: f.orden,
    token: f.token,
    url: `/firma/${f.token}`,
    estado: f.estado,
  }));
  return {
    id: acuerdo._id,
    tipo: acuerdo.tipo,
    estado: acuerdo.estado,
    inmueble: acuerdo.inmueble,
    links,
    firmantes: acuerdo.firmantes.map((f) => ({
      rol: f.rol, orden: f.orden, estado: f.estado,
      nombre: f.nombre || f.datos?.nombre || '',
      tieneImagen: !!f.imagen,
      rechazo: f.rechazo || null,
    })),
    creadoEn: acuerdo.creadoEn,
    cerradoEn: acuerdo.cerradoEn,
    rechazadoEn: acuerdo.rechazadoEn,
  };
}

// Vista para un firmante con su token: contrato + estado + evidencias (sin tokens de otros)
function vistaToken(acuerdo, propia) {
  const turno = acuerdo.firmantes.find((f) => f.estado === 'pendiente');
  return {
    id: acuerdo._id,
    tipo: acuerdo.tipo,
    estado: acuerdo.estado,
    datos: acuerdo.datos,
    fechaContrato: acuerdo.fechaContrato,
    contratoHash: acuerdo.contratoHash,
    miRol: propia.rol,
    miOrden: propia.orden,
    miEstado: propia.estado,
    miNombre: propia.datos?.nombre || propia.nombre || '',
    turno: turno ? { rol: turno.rol, orden: turno.orden } : null,
    firmantes: acuerdo.firmantes.map((f) => ({
      rol: f.rol, orden: f.orden, estado: f.estado,
      nombre: f.datos?.nombre || f.nombre || '',
      imagen: f.imagen || null, // solo visible una vez firmada
      evidencia: f.estado === 'firmada' ? {
        metodo: f.evidencia.metodo,
        fecha: f.evidencia.fecha,
        ip: f.evidencia.ip,
        hashDocumento: f.evidencia.hashDocumento,
        hashCadena: f.evidencia.hashCadena,
        usuario: f.evidencia.usuario,
      } : null,
      rechazo: f.rechazo || null,
    })),
    pdfDisponible: acuerdo.estado === 'firmado' || acuerdo.estado === 'rechazado',
    cerradoEn: acuerdo.cerradoEn,
    rechazadoEn: acuerdo.rechazadoEn,
  };
}

async function obtenerPorToken(token) {
  if (!token || token.length < 10) throw new ErrorFirma(404, 'Enlace inválido');
  const acuerdo = await AcuerdoFirma.findOne({ 'firmantes.token': token });
  if (!acuerdo) throw new ErrorFirma(404, 'Enlace inválido o expirado');
  const propia = buscarPorToken(acuerdo, token);
  if (!propia) throw new ErrorFirma(404, 'Enlace inválido');
  return vistaToken(acuerdo, propia);
}

async function obtenerAcuerdo(id) {
  const acuerdo = await AcuerdoFirma.findById(id);
  if (!acuerdo) throw new ErrorFirma(404, 'Acuerdo no encontrado');
  return pactoPublico(acuerdo);
}

// ===== Firmar: valida el TURNO en servidor, registra evidencia y encadena hashes =====
async function firmar(token, { datos, metodo, imagen, condiciones, req }) {
  const acuerdo = await AcuerdoFirma.findOne({ 'firmantes.token': token });
  const propia = buscarPorToken(acuerdo, token);
  if (!acuerdo || !propia) throw new ErrorFirma(404, 'Enlace inválido o expirado');

  if (acuerdo.estado === 'firmado') throw new ErrorFirma(409, 'El acuerdo ya está cerrado; las firmas quedaron bloqueadas');
  if (acuerdo.estado === 'rechazado') throw new ErrorFirma(409, 'El acuerdo fue rechazado y no puede firmarse');
  if (propia.estado !== 'pendiente') throw new ErrorFirma(409, 'Tu firma ya fue registrada');

  const turno = acuerdo.firmantes.find((f) => f.estado === 'pendiente');
  if (!turno || turno.orden !== propia.orden) {
    throw new ErrorFirma(409, `Ahora le corresponde firmar a: ${turno?.rol || '—'}`);
  }

  if (condiciones !== true) throw new ErrorFirma(400, 'Debes aceptar las condiciones de firma electrónica');
  if (!METODOS.includes(metodo)) throw new ErrorFirma(400, 'Método de firma inválido');
  validarImagen(imagen);

  const cedula = String(datos?.cedula || '').trim();
  const nombre = String(datos?.nombre || '').trim();
  if (nombre.length < 3) throw new ErrorFirma(400, 'Escribe tu nombre completo');
  if (cedula.length < 5) throw new ErrorFirma(400, 'Escribe tu número de cédula');

  // Integridad: el hash guardado debe seguir coincidiendo con el snapshot
  const recomputado = hashContrato(acuerdo.datos);
  if (recomputado !== acuerdo.contratoHash) {
    throw new ErrorFirma(409, 'El contrato fue alterado después de crear el acuerdo');
  }

  // Evidencia técnica — Ley 527 de 1999
  const anterior = [...acuerdo.firmantes]
    .filter((f) => f.estado === 'firmada' && f.evidencia)
    .sort((a, b) => a.orden - b.orden)
    .pop();
  const hashAnterior = anterior?.evidencia?.hashCadena || null;
  const hashDoc = acuerdo.contratoHash;
  const cadena = hashCadena(hashDoc, hashAnterior, propia.rol, cedula);

  propia.datos = { nombre, cedula, email: String(datos?.email || '').trim() };
  propia.imagen = imagen;
  propia.estado = 'firmada';
  propia.evidencia = {
    usuario: propia.datos,
    metodo,
    fecha: new Date(),
    ip: ipDe(req),
    userAgent: String(req.headers['user-agent'] || '').slice(0, 200),
    hashDocumento: hashDoc,
    hashAnterior,
    hashCadena: cadena,
  };

  // ¿Cerramos el acuerdo? (la última firma es el administrador)
  const quedan = acuerdo.firmantes.filter((f) => f.estado === 'pendiente');
  if (quedan.length === 0) {
    acuerdo.estado = 'firmado';
    acuerdo.cerradoEn = new Date();
    await acuerdo.save();
    // Congela el PDF final en GridFS
    try {
      const buffer = await generarPdf(acuerdo);
      acuerdo.pdfGridId = await guardarEnGridFS(buffer, `acuerdo-${acuerdo._id}.pdf`);
      await acuerdo.save();
    } catch (e) {
      console.error('No se pudo archivar el PDF en GridFS:', e.message);
    }
  } else {
    await acuerdo.save();
  }

  return vistaToken(acuerdo, propia);
}

// ===== Rechazo: solo el administrador (orden 3) en su turno =====
async function rechazar(token, { observaciones, req }) {
  const acuerdo = await AcuerdoFirma.findOne({ 'firmantes.token': token });
  const propia = buscarPorToken(acuerdo, token);
  if (!acuerdo || !propia) throw new ErrorFirma(404, 'Enlace inválido o expirado');

  if (acuerdo.estado === 'firmado') throw new ErrorFirma(409, 'El acuerdo ya está cerrado');
  if (acuerdo.estado === 'rechazado') throw new ErrorFirma(409, 'El acuerdo ya fue rechazado');
  if (propia.orden !== 3) throw new ErrorFirma(403, 'Solo el administrativo puede rechazar el acuerdo');
  if (propia.estado !== 'pendiente') throw new ErrorFirma(409, 'Tu respuesta ya fue registrada');

  const txt = String(observaciones || '').trim();
  if (txt.length < 5) throw new ErrorFirma(400, 'Escribe las observaciones del rechazo');

  propia.estado = 'rechazada';
  propia.rechazo = { observaciones: txt.slice(0, 2000), fecha: new Date(), ip: ipDe(req) };
  acuerdo.estado = 'rechazado';
  acuerdo.rechazadoEn = new Date();
  await acuerdo.save();

  // El PDF del acuerdo rechazado conserva firmas previas + anexo con el rechazo
  try {
    const buffer = await generarPdf(acuerdo);
    acuerdo.pdfGridId = await guardarEnGridFS(buffer, `acuerdo-${acuerdo._id}-rechazado.pdf`);
    await acuerdo.save();
  } catch (e) {
    console.error('No se pudo archivar el PDF (rechazado) en GridFS:', e.message);
  }

  return vistaToken(acuerdo, propia);
}

// ===== Verificación de integridad (recomputa todos los hashes) =====
async function verificar(id) {
  const acuerdo = await AcuerdoFirma.findById(id);
  if (!acuerdo) throw new ErrorFirma(404, 'Acuerdo no encontrado');

  const contratoIntegro = hashContrato(acuerdo.datos) === acuerdo.contratoHash;
  let anterior = null;
  const firmas = [];
  let cadenaIntegra = true;

  for (const f of [...acuerdo.firmantes].sort((a, b) => a.orden - b.orden)) {
    if (f.estado !== 'firmada' || !f.evidencia) {
      firmas.push({ rol: f.rol, orden: f.orden, estado: f.estado, verificada: null });
      continue;
    }
    const docOk = f.evidencia.hashDocumento === acuerdo.contratoHash;
    const esperado = hashCadena(acuerdo.contratoHash, anterior, f.rol, f.evidencia.usuario?.cedula);
    const cadenaOk = esperado === f.evidencia.hashCadena;
    if (!docOk || !cadenaOk) cadenaIntegra = false;
    anterior = f.evidencia.hashCadena;
    firmas.push({
      rol: f.rol, orden: f.orden, estado: f.estado,
      fecha: f.evidencia.fecha, ip: f.evidencia.ip, metodo: f.evidencia.metodo,
      hashDocumento: f.evidencia.hashDocumento,
      hashCadena: f.evidencia.hashCadena,
      verificada: docOk && cadenaOk,
    });
  }

  return {
    id: acuerdo._id,
    estado: acuerdo.estado,
    contratoHash: acuerdo.contratoHash,
    contratoIntegro,
    cadenaIntegra,
    integro: contratoIntegro && cadenaIntegra,
    firmas,
  };
}

// ===== PDF (desde GridFS si está congelado; si no, se genera al vuelo) =====
async function pdfDe(id) {
  const acuerdo = await AcuerdoFirma.findById(id);
  if (!acuerdo) throw new ErrorFirma(404, 'Acuerdo no encontrado');
  if (acuerdo.pdfGridId) {
    try { return await leerDeGridFS(acuerdo.pdfGridId); } catch { /* si falla, regenera */ }
  }
  return generarPdf(acuerdo);
}

module.exports = { ErrorFirma, crearAcuerdo, obtenerPorToken, obtenerAcuerdo, firmar, rechazar, verificar, pdfDe };

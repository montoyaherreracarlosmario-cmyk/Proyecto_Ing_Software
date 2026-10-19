const crypto = require('crypto');

// JSON canónico: mismo objeto => mismo string, con claves ordenadas recursivamente.
// Base del hash del contrato para que la verificación sea determinista.
function canonico(valor) {
  if (Array.isArray(valor)) return valor.map(canonico);
  if (valor && typeof valor === 'object') {
    return Object.keys(valor).sort().reduce((acc, k) => {
      acc[k] = canonico(valor[k]);
      return acc;
    }, {});
  }
  return valor;
}

function sha256(texto) {
  return crypto.createHash('sha256').update(texto, 'utf8').digest('hex');
}

// Hash del contrato completo en el momento de crear el acuerdo
function hashContrato(datos) {
  return sha256(JSON.stringify(canonico(datos)));
}

// Cadena de integridad encadenada:
// cada firma incluye el hash de la anterior; alterar una rompe toda la cadena posterior.
function hashCadena(hashDocumento, hashAnterior, rol, cedula) {
  return sha256(`${hashDocumento}|${hashAnterior || ''}|${rol}|${cedula || ''}`);
}

// Token único e intransferible por firmante (32 bytes aleatorios, URL-safe)
function generarToken() {
  return crypto.randomBytes(32).toString('base64url');
}

// IP real detrás del proxy (Render entrega X-Forwarded-For)
function ipDe(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.socket?.remoteAddress || req.connection?.remoteAddress || 'desconocida';
}

// Comparación sin fugas de timing para tokens
function tokenSeguro(a, b) {
  const ba = Buffer.from(String(a || ''));
  const bb = Buffer.from(String(b || ''));
  if (ba.length !== bb.length || ba.length === 0) return false;
  return crypto.timingSafeEqual(ba, bb);
}

module.exports = { canonico, sha256, hashContrato, hashCadena, generarToken, ipDe, tokenSeguro };

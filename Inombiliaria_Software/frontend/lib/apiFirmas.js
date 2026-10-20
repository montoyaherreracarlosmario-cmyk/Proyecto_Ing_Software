// Cliente HTTP del módulo de firmas (vive en el backend NestJS, raíz /api/firmas).
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
import { conAuth, getToken, sesionExpirada } from './auth';

async function j(r) {
  sesionExpirada(r);
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.error || 'Error en la API de firmas');
  }
  return r.json();
}

// Administrativo: requiere sesión.
export async function crearAcuerdo(datos) {
  const r = await fetch(`${API}/api/firmas/acuerdos`, {
    method: 'POST', headers: conAuth({ 'Content-Type': 'application/json' }), body: JSON.stringify(datos),
  });
  return j(r);
}

// Público: el firmante externo abre su enlace sin sesión.
export async function porToken(token) {
  const r = await fetch(`${API}/api/firmas/t/${token}`, { cache: 'no-store' });
  return j(r);
}

// Público: firma por enlace privado.
export async function firmar(token, cuerpo) {
  const r = await fetch(`${API}/api/firmas/t/${token}/firmar`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo),
  });
  return j(r);
}

// Público: rechazo por enlace privado (rol administrador dentro del acuerdo).
export async function rechazar(token, observaciones) {
  const r = await fetch(`${API}/api/firmas/t/${token}/rechazar`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ observaciones }),
  });
  return j(r);
}

// Administrativo: requiere sesión.
export async function verificar(id) {
  const r = await fetch(`${API}/api/firmas/acuerdos/${id}/verificar`, { cache: 'no-store', headers: conAuth() });
  return j(r);
}

// El PDF del acuerdo es administrativo: incluye el token en la URL para que el
// navegador lo descargue autenticado (se abre en pestaña con ?token=…).
export const urlPdf = (id) => {
  const t = getToken();
  return `${API}/api/firmas/acuerdos/${id}/pdf${t ? `?token=${encodeURIComponent(t)}` : ''}`;
};

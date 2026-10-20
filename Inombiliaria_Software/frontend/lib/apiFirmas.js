// Cliente HTTP del módulo de firmas (vive en el backend NestJS, raíz /api/firmas).
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function j(r) {
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.error || 'Error en la API de firmas');
  }
  return r.json();
}

export async function crearAcuerdo(datos) {
  const r = await fetch(`${API}/api/firmas/acuerdos`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos),
  });
  return j(r);
}

export async function porToken(token) {
  const r = await fetch(`${API}/api/firmas/t/${token}`, { cache: 'no-store' });
  return j(r);
}

export async function firmar(token, cuerpo) {
  const r = await fetch(`${API}/api/firmas/t/${token}/firmar`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo),
  });
  return j(r);
}

export async function rechazar(token, observaciones) {
  const r = await fetch(`${API}/api/firmas/t/${token}/rechazar`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ observaciones }),
  });
  return j(r);
}

export async function verificar(id) {
  const r = await fetch(`${API}/api/firmas/acuerdos/${id}/verificar`, { cache: 'no-store' });
  return j(r);
}

export const urlPdf = (id) => `${API}/api/firmas/acuerdos/${id}/pdf`;

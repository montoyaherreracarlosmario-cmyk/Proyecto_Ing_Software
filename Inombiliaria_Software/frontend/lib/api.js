// URL del backend NestJS (en Vercel se define NEXT_PUBLIC_API_URL)
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function getInmuebles() {
  const r = await fetch(`${API}/inmuebles`, { cache: 'no-store' });
  if (!r.ok) throw new Error('Error al cargar inmuebles');
  return r.json();
}

export async function crearContrato(id, datos) {
  const r = await fetch(`${API}/inmuebles/${id}/contratos`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos),
  });
  if (!r.ok) throw new Error('Error al guardar el contrato');
  return r.json();
}

export async function crearInmueble(datos) {
  const r = await fetch(`${API}/inmuebles`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos),
  });
  if (!r.ok) throw new Error('Error al guardar el inmueble');
  return r.json();
}

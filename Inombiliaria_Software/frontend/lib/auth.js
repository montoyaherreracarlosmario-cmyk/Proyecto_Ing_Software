// ===== Sesión del administrador (login con Google) =====
// El token de sesión se guarda en localStorage; el backend lo emite tras
// verificar el ID token de Google contra la lista blanca de administradores.
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const CLAVE = 'habitat_sesion';
const CLAVE_GOOGLE = 'habitat_google_client_id';

// Client ID de Google (público). Se puede cambiar con NEXT_PUBLIC_GOOGLE_CLIENT_ID.
export const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  '305367642614-imcnroh46epfbp8cmr3bbhqu230aa0jf.apps.googleusercontent.com';

export function getSesion() {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(CLAVE) || 'null'); } catch { return null; }
}

export function getToken() {
  return getSesion()?.token || '';
}

export function guardarSesion(sesion) {
  try { localStorage.setItem(CLAVE, JSON.stringify(sesion)); } catch { /* almacenamiento no disponible */ }
  window.dispatchEvent(new Event('habitat-sesion'));
}

export function limpiarSesion() {
  try { localStorage.removeItem(CLAVE); } catch { /* nada */ }
  window.dispatchEvent(new Event('habitat-sesion'));
}

// Cabeceras con la sesión (para fetch autenticados)
export function conAuth(extra = {}) {
  const token = getToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : { ...extra };
}

// Si el backend responde 401, la sesión ya no sirve: se limpia y se avisa.
export function sesionExpirada(r) {
  if (r && r.status === 401) {
    limpiarSesion();
    return true;
  }
  return false;
}

// ---- Llamadas a la API de autenticación ----
export async function loginGoogle(credential) {
  const r = await fetch(`${API}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'No se pudo iniciar sesión');
  guardarSesion(j);
  return j;
}

export async function salir() {
  try {
    await fetch(`${API}/api/auth/salir`, { method: 'POST', headers: conAuth() });
  } catch { /* si falla la red, igual cerramos localmente */ }
  limpiarSesion();
}

export async function yo() {
  const r = await fetch(`${API}/api/auth/me`, { headers: conAuth(), cache: 'no-store' });
  if (sesionExpirada(r)) return null;
  const j = await r.json().catch(() => ({}));
  return j.usuario || null;
}

// Carga el script de Google Identity Services una sola vez.
export function cargarGoogle(scriptId = 'gsi-client') {
  if (typeof document === 'undefined') return Promise.resolve();
  if (document.getElementById(scriptId)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.id = scriptId;
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = resolve;
    s.onerror = () => reject(new Error('No se pudo cargar Google'));
    document.head.appendChild(s);
  });
}

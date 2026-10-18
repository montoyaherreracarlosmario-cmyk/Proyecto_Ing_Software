// Iconos de línea (SVG en línea, heredan el color del texto)
const base = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };

export const IcoCama = () => (<svg {...base}><path d="M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7M3 15h18M7 9V7a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2" /></svg>);
export const IcoBano = () => (<svg {...base}><path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3zM6 12V6a2 2 0 0 1 3.4-1.4M7 19l-1 2M17 19l1 2" /></svg>);
export const IcoArea = () => (<svg {...base}><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>);
export const IcoBuscar = () => (<svg {...base}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>);
export const IcoCasa = () => (<svg {...base}><path d="M3 11.5 12 4l9 7.5M5 10v10h14V10M10 20v-6h4v6" /></svg>);
export const IcoEdificio = () => (<svg {...base}><path d="M5 21V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v17M15 9h3a1 1 0 0 1 1 1v11M3 21h18M9 7h2M9 11h2M9 15h2" /></svg>);

export const Logo = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
    <rect width="36" height="36" rx="10" fill="#E7A41F" />
    <path d="M7 18.5 18 9l11 9.5V28a1 1 0 0 1-1 1h-6v-7h-8v7H8a1 1 0 0 1-1-1z" fill="#0F4C43" />
  </svg>
);

'use client';

import { useEffect, useRef, useState } from 'react';
import { FILTROS0, hayFiltros } from '../lib/utils';
import { IcoBuscar } from './Iconos';

const MIN = [['', 'Cualquiera'], ['1', '1+'], ['2', '2+'], ['3', '3+'], ['4', '4+'], ['5', '5+']];

const OTRO = '__otro';
const ESTADOS = [['', 'Todos'], ['Arrendada', 'Arrendada'], ['Sin arrendar', 'Sin arrendar'], ['Para la venta', 'Para la venta'], ['Vendida', 'Vendida']];

// Selector desplegable: botón que, al pulsarlo, abre un panel animado con las opciones.
function Desplegable({ valor, opciones, onChange, etiqueta }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);
  const actual = opciones.find(([v]) => v === valor) || opciones[0];

  // Se cierra al hacer clic fuera o al pulsar Escape
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e) => { if (ref.current && !ref.current.contains(e.target)) setAbierto(false); };
    const tecla = (e) => { if (e.key === 'Escape') { setAbierto(false); ref.current?.querySelector('.dd-btn')?.focus(); } };
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', tecla);
    return () => { document.removeEventListener('mousedown', fuera); document.removeEventListener('keydown', tecla); };
  }, [abierto]);

  // Flechas arriba/abajo para moverse entre las opciones
  const mover = (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    if (!abierto) { setAbierto(true); return; }
    const ops = [...ref.current.querySelectorAll('.dd-op')];
    const i = ops.indexOf(document.activeElement);
    const sig = e.key === 'ArrowDown' ? Math.min(i + 1, ops.length - 1) : Math.max(i - 1, 0);
    ops[sig]?.focus();
  };

  return (
    <div className={`dd ${abierto ? 'abierto' : ''}`} ref={ref} onKeyDown={mover}>
      <button type="button" className="dd-btn" aria-haspopup="listbox" aria-expanded={abierto} aria-label={etiqueta} onClick={() => setAbierto(!abierto)}>
        <span>{actual[1]}</span>
        <svg className="dd-flecha" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {abierto && (
        <ul className="dd-panel" role="listbox" aria-label={etiqueta}>
          {opciones.map(([v, t], n) => (
            <li key={v} role="option" aria-selected={v === valor} style={{ '--n': n }}>
              <button type="button" className={`dd-op ${v === valor ? 'on' : ''}`} onClick={() => { onChange(v); setAbierto(false); }}>{t}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Filtros({ f, setF, total, mostrados }) {
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const rango = (a, b, u) => (
    <div className="rango">
      <input type="number" min="0" placeholder="Mín." value={f[a]} onChange={set(a)} aria-label={`${u} mínimo`} />
      <input type="number" min="0" placeholder="Máx." value={f[b]} onChange={set(b)} aria-label={`${u}

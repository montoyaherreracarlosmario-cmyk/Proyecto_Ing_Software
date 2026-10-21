'use client';

import { useEffect, useRef, useState } from 'react';

import { useState } from 'react';
mainimport { FILTROS0, hayFiltros } from '../lib/utils';
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


const ESTADOS = [['', 'Todos'], ['Arrendada', 'Arrendada'], ['Sin arrendar', 'Sin arrendar'], ['Para la venta', 'Para la venta'], ['Vendida', 'Vendida']];

export default function Filtros({ f, setF, total, mostrados }) {
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const rango = (a, b, u) => (
    <div className="rango">
      <input type="number" min="0" placeholder="Mín." value={f[a]} onChange={set(a)} aria-label={`${u} mínimo`} />
      <input type="number" min="0" placeholder="Máx." value={f[b]} onChange={set(b)} aria-label={`${u} máximo`} />
    </div>
  );

  // Lista desplegable propia: al hacer clic se despliegan las opciones disponibles.
  const lista = (k, opciones, etiqueta) => (
    <Desplegable valor={f[k]} opciones={opciones} etiqueta={etiqueta} onChange={(v) => setF({ ...f, [k]: v })} />
  );
  // Lista desplegable con opción "Otro…": muestra un campo numérico libre.
  const listaNum = (k, etiqueta) => {
    const esOtro = f[k] !== '' && !MIN.some(([v]) => v === f[k]);
    return (
      <div className="dd-fila">
        <Desplegable
          valor={esOtro ? OTRO : f[k]}
          opciones={[...MIN, [OTRO, 'Otro…']]}
          etiqueta={etiqueta}
          onChange={(v) => setF({ ...f, [k]: v === OTRO ? '6' : v })}
        />
        {esOtro && (
          <input
            type="number" min="0" autoFocus
            className="dd-num" value={f[k]}

  // Grupo de píldoras: reemplaza el <select> nativo por botones estilizados.
  const chips = (k, opciones, etiqueta) => (
    <div className="chips" role="group" aria-label={etiqueta}>
      {opciones.map(([v, t]) => (
        <button key={v} type="button" className={`chip ${f[k] === v ? 'on' : ''}`} aria-pressed={f[k] === v} onClick={() => setF({ ...f, [k]: v })}>{t}</button>
      ))}
    </div>
  );
  // Grupo de píldoras con opción "Otro": muestra un campo numérico libre.
  const chipsNum = (k, etiqueta) => {
    const esOtro = f[k] !== '' && !MIN.some(([v]) => v === f[k]);
    return (
      <div className="chips" role="group" aria-label={etiqueta}>
        {MIN.map(([v, t]) => (
          <button key={v} type="button" className={`chip ${f[k] === v ? 'on' : ''}`} aria-pressed={f[k] === v} onClick={() => setF({ ...f, [k]: v })}>{t}</button>
        ))}
        <button type="button" className={`chip ${esOtro ? 'on' : ''}`} aria-pressed={esOtro} onClick={() => setF({ ...f, [k]: esOtro ? '' : '6' })}>Otro…</button>
        {esOtro && (
          <input
            type="number" min="0" autoFocus
            className="chip-num" value={f[k]}

            onChange={set(k)}
            aria-label={`${etiqueta}: número exacto o más`}
            placeholder="N°"
          />
        )}
      </div>
    );
  };
  return (
    <div className="card filtros noprint">
      <div className="filtros-top"><b className="ft"><IcoBuscar /> Filtrar inmuebles</b><span className="mut">Mostrando {mostrados} de {total}</span></div>
      <div className="filtros-grid">

        <div><label className="filtro-lbl">Habitaciones<span className="chips-hint"> (o más)</span></label>{listaNum('hab', 'Habitaciones')}</div>
        <div><label className="filtro-lbl">Baños<span className="chips-hint"> (o más)</span></label>{listaNum('ban', 'Baños')}</div>
        <div><label className="filtro-lbl">Tamaño (m²)</label>{rango('areaMin', 'areaMax', 'Área')}</div>
        <div><label className="filtro-lbl">Rango de precio ($)</label>{rango('pMin', 'pMax', 'Precio')}</div>
        <div><label className="filtro-lbl">Estado</label>{lista('estado', ESTADOS, 'Estado')}</div>

        <div><label className="filtro-lbl">Habitaciones<span className="chips-hint"> (o más)</span></label>{chipsNum('hab', 'Habitaciones')}</div>
        <div><label className="filtro-lbl">Baños<span className="chips-hint"> (o más)</span></label>{chipsNum('ban', 'Baños')}</div>
        <div><label className="filtro-lbl">Tamaño (m²)</label>{rango('areaMin', 'areaMax', 'Área')}</div>
        <div><label className="filtro-lbl">Rango de precio ($)</label>{rango('pMin', 'pMax', 'Precio')}</div>
        <div><label className="filtro-lbl">Estado</label>{chips('estado', ESTADOS, 'Estado')}</div>

      </div>
      {hayFiltros(f) && <div className="row"><button className="l" onClick={() => setF(FILTROS0)}>Limpiar filtros</button></div>}
    </div>
  );
}

'use client';
import { useState } from 'react';
import { FILTROS0, hayFiltros } from '../lib/utils';
import { IcoBuscar } from './Iconos';

const MIN = [['', 'Cualquiera'], ['1', '1+'], ['2', '2+'], ['3', '3+'], ['4', '4+'], ['5', '5+']];
const ESTADOS = [['', 'Todos'], ['Arrendada', 'Arrendada'], ['Sin arrendar', 'Sin arrendar'], ['Para la venta', 'Para la venta'], ['Vendida', 'Vendida']];

export default function Filtros({ f, setF, total, mostrados }) {
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const rango = (a, b, u) => (
    <div className="rango">
      <input type="number" min="0" placeholder="Mín." value={f[a]} onChange={set(a)} aria-label={`${u} mínimo`} />
      <input type="number" min="0" placeholder="Máx." value={f[b]} onChange={set(b)} aria-label={`${u} máximo`} />
    </div>
  );
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

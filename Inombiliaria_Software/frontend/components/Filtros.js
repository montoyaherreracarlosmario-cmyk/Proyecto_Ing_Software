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
  return (
    <div className="card filtros noprint">
      <div className="filtros-top"><b className="ft"><IcoBuscar /> Filtrar inmuebles</b><span className="mut">Mostrando {mostrados} de {total}</span></div>
      <div className="filtros-grid">
        <div><label>Habitaciones<span className="chips-hint"> (o más)</span></label>{chips('hab', MIN, 'Habitaciones')}</div>
        <div><label>Baños<span className="chips-hint"> (o más)</span></label>{chips('ban', MIN, 'Baños')}</div>
        <div><label>Tamaño (m²)</label>{rango('areaMin', 'areaMax', 'Área')}</div>
        <div><label>Rango de precio ($)</label>{rango('pMin', 'pMax', 'Precio')}</div>
        <div><label>Estado</label>{chips('estado', ESTADOS, 'Estado')}</div>
      </div>
      {hayFiltros(f) && <div className="row"><button className="l" onClick={() => setF(FILTROS0)}>Limpiar filtros</button></div>}
    </div>
  );
}


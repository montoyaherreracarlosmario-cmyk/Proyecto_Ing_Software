import { FILTROS0, hayFiltros } from '../lib/utils';
import { IcoBuscar } from './Iconos';

const MIN = [['', 'Cualquiera'], ['1', '1 o más'], ['2', '2 o más'], ['3', '3 o más'], ['4', '4 o más'], ['5', '5 o más']];
const ESTADOS = ['Arrendada', 'Sin arrendar', 'Para la venta', 'Vendida'];

export default function Filtros({ f, setF, total, mostrados }) {
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const rango = (a, b, u) => (
    <div className="rango">
      <input type="number" min="0" placeholder="Mín." value={f[a]} onChange={set(a)} aria-label={`${u} mínimo`} />
      <input type="number" min="0" placeholder="Máx." value={f[b]} onChange={set(b)} aria-label={`${u} máximo`} />
    </div>
  );
  return (
    <div className="card filtros noprint">
      <div className="filtros-top"><b className="ft"><IcoBuscar /> Filtrar inmuebles</b><span className="mut">Mostrando {mostrados} de {total}</span></div>
      <div className="filtros-grid">
        <div><label>Habitaciones</label>
          <select value={f.hab} onChange={set('hab')}>{MIN.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></div>
        <div><label>Baños</label>
          <select value={f.ban} onChange={set('ban')}>{MIN.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></div>
        <div><label>Tamaño (m²)</label>{rango('areaMin', 'areaMax', 'Área')}</div>
        <div><label>Rango de precio ($)</label>{rango('pMin', 'pMax', 'Precio')}</div>
        <div><label>Estado</label>
          <select value={f.estado} onChange={set('estado')}><option value="">Todos</option>{ESTADOS.map((e) => <option key={e}>{e}</option>)}</select></div>
      </div>
      {hayFiltros(f) && <div className="row"><button className="l" onClick={() => setF(FILTROS0)}>Limpiar filtros</button></div>}
    </div>
  );
}

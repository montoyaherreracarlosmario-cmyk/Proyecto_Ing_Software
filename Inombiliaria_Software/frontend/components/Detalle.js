import Caract from './Caract';
import Ilustra from './Ilustra';
import { fd, fmt, cls, porVencer, sufijo } from '../lib/utils';

const Pdf = ({ c }) => (
  <div className="pdf"><div className="pdfico">PDF</div>
    <div><b>{c.tipo}</b><div className="mut">Firmado el {fd(c.fecha)} · Firmantes: {c.firm.join(', ')}</div></div>
  </div>
);

export default function Detalle({ inm: i, volver, crear }) {
  const vig = i.contratos.find((c) => c.vig);
  const ven = i.contratos.filter((c) => !c.vig);
  return (
    <div className="view">
      <button className="l" onClick={volver}>← Volver a {i.tipo === 'Casa' ? 'casas' : 'apartamentos'}</button>
      <div className="card ficha">
        <div className={`thumb grande ${i.tipo}`}>
          <Ilustra tipo={i.tipo} />
          <span className={`tag ${cls(i.estado)}`}>{i.estado}</span>
        </div>
        <div className="ficha-body">
          <h2 className="titulo">{i.nombre}</h2>
          <p className="dir">{i.dir} · {i.barrio}</p>
          <Caract i={i} />
          <div className="datos">
            <div className="dato"><span>{i.estado === 'Para la venta' || i.estado === 'Vendida' ? 'Precio de venta' : 'Valor mensual'}</span><b>{fmt(i.valor)}</b></div>
            {i.venc && <div className="dato"><span>Vencimiento del contrato</span><b>{fd(i.venc)}</b></div>}
            {i.venc && <div className="dato"><span>Día de pago</span><b>El {i.diaPago} de cada mes</b></div>}
          </div>
          {i.estado !== 'Arrendada' && (
            <div className="row">
              <button className="g" onClick={() => crear(i.estado === 'Para la venta' ? 'venta' : 'arriendo')}>Crear contrato</button>
              <button onClick={() => crear('venta')}>Descargar formato de compraventa</button>
            </div>
          )}
          {vig && <>
            <h3>Contrato vigente</h3><Pdf c={vig} />
            <div className="row">{porVencer(i) && <span className="tag pulse">Por vencer</span>}<button className="o" onClick={() => crear('arriendo')}>Renovar contrato</button></div>
          </>}
          <h3>Contratos vencidos</h3>
          {ven.length ? ven.map((c, k) => <Pdf key={k} c={c} />) : <p className="mut">Sin contratos vencidos.</p>}
        </div>
      </div>
    </div>
  );
}

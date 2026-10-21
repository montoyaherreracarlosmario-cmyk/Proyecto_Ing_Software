import { fmt } from '../lib/utils';

const V = ({ x, d }) => (x && String(x).trim() ? <b>{x}</b> : <b className="bl">{d || '__________'}</b>);

// Plantilla del contrato (vista previa en vivo, se imprime como PDF)
export default function Hoja({ modo, S }) {
  const f = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
  const cs = S.cods.filter(Boolean);
  const inm = <>{<V x={S.dir} />}, barrio <V x={S.bar} />, de la ciudad de <V x={S.ciu} />, cuyos linderos son: <V x={S.lin} d="____________________" /></>;
  if (modo === 'arriendo') return (
    <div className="hoja">
      <h3>CONTRATO DE ARRENDAMIENTO DE VIVIENDA URBANA</h3>
      <p>En <V x={S.ciu} />, a {f}, entre <b>{S.arr || 'EL ARRENDADOR'}</b>, en adelante EL ARRENDADOR, y <V x={S.ate} d="EL ARRENDATARIO" />, en adelante EL ARRENDATARIO{cs.length ? `, con la coarrendación/codeudoría de ${cs.join(', ')}` : ''}, se celebra el presente contrato:</p>
      <p><b>PRIMERA – Objeto.</b> EL ARRENDADOR entrega a título de arrendamiento el inmueble ubicado en {inm}.</p>
      <p><b>SEGUNDA – Canon.</b> El canon mensual es de <V x={S.val ? fmt(S.val) : ''} />, pagadero dentro de los primeros <V x={S.dia} d="__" /> días de cada mes.</p>
      <p><b>TERCERA – Duración.</b> El contrato tendrá una duración de <V x={S.dur} d="__" /> meses, contados desde la fecha de firma, prorrogable por acuerdo escrito.</p>
      <p><b>CUARTA – Destinación.</b> El inmueble se destinará exclusivamente a vivienda. No podrá subarrendarse ni cederse sin autorización escrita del ARRENDADOR.</p>
      <p><b>QUINTA – Servicios y reparaciones.</b> Los servicios públicos y las reparaciones locativas estarán a cargo del ARRENDATARIO.</p>
      <p><b>SEXTA – Restitución.</b> Al terminar, EL ARRENDATARIO restituirá el inmueble en el estado en que lo recibió, salvo el desgaste natural.</p>
      <p><b>SÉPTIMA – Terminación.</b> El incumplimiento de cualquier obligación faculta a la parte cumplida para terminar el contrato conforme a la ley.</p>
      <p>Para constancia, se firma en dos ejemplares del mismo tenor.</p>
      <div className="sig"><div>{S.arr || 'Arrendador'}<br /><small>Arrendador</small></div><div>{S.ate || 'Arrendatario'}<br /><small>Arrendatario</small></div>{cs.map((c, k) => <div key={k}>{c}<br /><small>Codeudor</small></div>)}</div>
    </div>
  );
  return (
    <div className="hoja">
      <h3>CONTRATO DE COMPRAVENTA DE INMUEBLE</h3>
      <p>En <V x={S.ciu} />, a {f}, entre <V x={S.vend} d="EL VENDEDOR" />, en adelante EL VENDEDOR, y <V x={S.comp} d="EL COMPRADOR" />, en adelante EL COMPRADOR, se celebra el presente contrato:</p>
      <p><b>PRIMERA – Objeto.</b> EL VENDEDOR transfiere a título de venta el inmueble ubicado en {inm}.</p>
      <p><b>SEGUNDA – Precio.</b> El precio de la venta es de <V x={S.val ? fmt(S.val) : ''} />.</p>
      <p><b>TERCERA – Forma de pago.</b> EL COMPRADOR pagará el precio así: <V x={S.pago} d="____________" />.</p>
      <p><b>CUARTA – Tradición y libertad.</b> EL VENDEDOR garantiza que el inmueble es de su propiedad y se encuentra libre de gravámenes, embargos y limitaciones de dominio.</p>
      <p><b>QUINTA – Entrega.</b> El inmueble se entregará a paz y salvo por impuestos y servicios públicos a la fecha de la escritura pública.</p>
      <p><b>SEXTA – Gastos.</b> Los gastos notariales y de registro serán asumidos por las partes en la proporción que la ley establece.</p>
      <p>Para constancia, se firma en dos ejemplares del mismo tenor.</p>
      <div className="sig"><div>{S.vend || 'Vendedor'}<br /><small>Vendedor</small></div><div>{S.comp || 'Comprador'}<br /><small>Comprador</small></div></div>
    </div>
  );
}

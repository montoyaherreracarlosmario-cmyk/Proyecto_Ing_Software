import Caract from './Caract';
import Ilustra from './Ilustra';
import { fd, fmt, cls, sufijo } from '../lib/utils';

// Tarjeta de un inmueble (la usan la lista y la vista previa del formulario)
export default function Tarjeta({ i, abrir }) {
  const ir = abrir ? { role: 'button', tabIndex: 0, onClick: abrir, onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); } } } : { style: { cursor: 'default' } };
  return (
    <article className={`card item${abrir ? '' : ' estatica'}`} {...ir}>
      <div className={`thumb ${i.tipo}`}>
        <Ilustra tipo={i.tipo} />
        <span className={`tag ${cls(i.estado)}`}>{i.estado}</span>
      </div>
      <div className="info">
        <h3 className="nom">{i.nombre}</h3>
        {(i.dir || i.barrio) && <p className="dir">{[i.dir, i.barrio].filter(Boolean).join(' · ')}</p>}
        <Caract i={i} />
        {i.venc && <p className="meta">Contrato vence el {fd(i.venc)} · pago el día {i.diaPago}</p>}
        <p className="precio">{fmt(i.valor)}<small>{sufijo(i)}</small></p>
      </div>
    </article>
  );
}

'use client';
import { useRef, useState } from 'react';
import Caract from './Caract';
import Ilustra from './Ilustra';
import { fd, fmt, cls, porVencer, sufijo } from '../lib/utils';
import { subirImagen, urlImagen } from '../lib/apiImagenes';
import { setFotoInmueble } from '../lib/api';

const Pdf = ({ c }) => (
  <div className="pdf"><div className="pdfico">PDF</div>
    <div><b>{c.tipo}</b><div className="mut">Firmado el {fd(c.fecha)} · Firmantes: {c.firm.join(', ')}</div></div>
  </div>
);

export default function Detalle({ inm: i, volver, crear, actualizar, avisar }) {
  const vig = i.contratos.find((c) => c.vig);
  const ven = i.contratos.filter((c) => !c.vig);
  const fileRef = useRef(null);
  const [subiendo, setSubiendo] = useState(false);

  const elegirFoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setSubiendo(true);
    try {
      const { url } = await subirImagen(file, i.tipo === 'Casa' ? 'casa' : 'apartamento');
      const act = await setFotoInmueble(i._id, url);
      actualizar?.(act);
      avisar?.('Foto actualizada');
    } catch (er) {
      avisar?.(er.message || 'No se pudo subir la foto');
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="view">
      <button className="l" onClick={volver}>← Volver a {i.tipo === 'Casa' ? 'casas' : 'apartamentos'}</button>
      <div className="card ficha">
        <div className={`thumb grande ${i.tipo}`}>
          {i.foto ? <img className="foto-thumb" src={urlImagen(i.foto)} alt={i.nombre} /> : <Ilustra tipo={i.tipo} />}
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
          <div className="row">
            <button className="o" disabled={subiendo} onClick={() => fileRef.current?.click()}>
              {subiendo ? 'Subiendo…' : i.foto ? 'Cambiar foto' : 'Agregar foto'}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }} onChange={elegirFoto} />
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

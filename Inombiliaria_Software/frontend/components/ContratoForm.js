'use client';
import { useState } from 'react';
import Hoja from './Hoja';
import { crearContrato } from '../lib/api';

export default function ContratoForm({ inm, modo0, volver, terminado, avisar }) {
  const [modo, setModo] = useState(modo0);
  const [link, setLink] = useState('');
  const [S, setS] = useState({ arr: 'Inmobiliaria', ate: '', vend: '', comp: '', ciu: 'Ibagué', dir: inm.dir || '', bar: inm.barrio || '', lin: inm.lind || '', val: inm.valor || '', dur: 12, dia: 5, pago: 'De contado', cods: [''] });
  const set = (k) => (e) => setS({ ...S, [k]: e.target.value });
  // OJO: es una función (no un componente) para que el input no pierda el foco al escribir
  const campo = (k, l, t, p) => (<><label>{l}</label><input type={t || 'text'} placeholder={p} value={S[k]} onChange={set(k)} /></>);

  const enviar = () => {
    if (!(modo === 'arriendo' ? S.ate : S.comp)) return avisar('Escribe el nombre de la contraparte');
    setLink(`${location.origin}/firma/${Math.random().toString(36).slice(2, 10)}`);
  };
  const firmar = async () => {
    const firmantes = modo === 'arriendo' ? [S.arr, S.ate, ...S.cods] : [S.vend, S.comp];
    try {
      await crearContrato(inm._id, { modo, firmantes, val: S.val, dur: S.dur, dia: S.dia, dir: S.dir, bar: S.bar, lin: S.lin });
      avisar('Contrato firmado y guardado');
      terminado();
    } catch { avisar('No se pudo guardar el contrato'); }
  };

  return (
    <div className="view">
      <div className="noprint"><button className="l" onClick={volver}>← Volver</button></div>
      <div className="grid">
        <div className="card noprint">
          <div className="modo">
            <button className={modo === 'arriendo' ? 'on' : ''} onClick={() => setModo('arriendo')}>Arriendo</button>
            <button className={modo === 'venta' ? 'on' : ''} onClick={() => setModo('venta')}>Compraventa</button>
          </div>
          {modo === 'arriendo' ? <>
            {campo('arr', 'Arrendador')}{campo('ate', 'Arrendatario', 'text', 'Ej: Pepito Perez')}
            <label>Coarrendatario / Codeudor</label>
            {S.cods.map((c, k) => <input key={k} style={{ marginTop: 6 }} placeholder={`Codeudor ${k + 1}`} value={c} onChange={(e) => setS({ ...S, cods: S.cods.map((x, j) => (j === k ? e.target.value : x)) })} />)}
            <button style={{ marginTop: 10 }} onClick={() => setS({ ...S, cods: [...S.cods, ''] })}>Agregar codeudor</button>
          </> : <>{campo('vend', 'Vendedor', 'text', 'Nombre completo')}{campo('comp', 'Comprador', 'text', 'Nombre completo')}</>}
          {campo('ciu', 'Ciudad')}{campo('dir', 'Dirección del inmueble')}{campo('bar', 'Barrio')}
          <label>Linderos</label><textarea rows="3" value={S.lin} onChange={set('lin')} />
          {campo('val', modo === 'arriendo' ? 'Valor mensual' : 'Precio de venta', 'number')}
          {modo === 'arriendo' ? <>{campo('dur', 'Duración (meses)', 'number')}{campo('dia', 'Día de pago de cada mes', 'number')}</> : campo('pago', 'Forma de pago')}
        </div>
        <div>
          <div className="visor noprint"><span className="tag pulse" style={{ margin: 0 }}>En vivo</span> Vista previa del PDF</div>
          <Hoja modo={modo} S={S} />
          <div className="row noprint" style={{ justifyContent: 'center' }}>
            <button className="g" onClick={enviar}>Enviar link para firma</button>
            <button onClick={() => window.print()}>Descargar PDF</button>
          </div>
          {link && <div className="card view noprint"><b>Link de firma generado</b><div className="link">{link}</div>
            <div className="row"><button onClick={() => { navigator.clipboard?.writeText(link); avisar('Link copiado'); }}>Copiar link</button><button className="g" onClick={firmar}>Simular firma</button></div></div>}
        </div>
      </div>
    </div>
  );
}

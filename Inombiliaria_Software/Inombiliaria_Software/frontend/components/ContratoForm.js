'use client';
import { useState } from 'react';
import Hoja from './Hoja';
import { crearAcuerdo, descargarPdfBorrador } from '../lib/apiFirmas';

export default function ContratoForm({ inm, modo0, volver, terminado, avisar }) {
  const [modo, setModo] = useState(modo0);
  const [links, setLinks] = useState([]);
  const [creando, setCreando] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [S, setS] = useState({ arr: 'Inmobiliaria', ate: '', vend: '', comp: '', ciu: 'Ibagué', dir: inm.dir || '', bar: inm.barrio || '', lin: inm.lind || '', val: inm.valor || '', dur: 12, dia: 5, pago: 'De contado', cods: [''] });
  const set = (k) => (e) => setS({ ...S, [k]: e.target.value });
  // OJO: es una función (no un componente) para que el input no pierda el foco al escribir
  const campo = (k, l, t, p) => (<><label>{l}</label><input type={t || 'text'} placeholder={p} value={S[k]} onChange={set(k)} /></>);

  // Crea el acuerdo de firma en la API y genera el enlace privado de cada parte
  const enviar = async () => {
    if (!(modo === 'arriendo' ? S.ate : S.comp)) return avisar('Escribe el nombre de la contraparte');
    setCreando(true);
    try {
      const firmantes = modo === 'arriendo'
        ? [{ rol: 'arrendador', nombre: S.arr }, { rol: 'arrendatario', nombre: S.ate }, { rol: 'administrador', nombre: 'Administrativo' }]
        : [{ rol: 'comprador', nombre: S.comp }, { rol: 'vendedor', nombre: S.vend }, { rol: 'administrador', nombre: 'Administrativo' }];
      const r = await crearAcuerdo({ inmueble: inm._id, tipo: modo, datos: S, firmantes });
      setLinks(r.links.map((l) => ({ ...l, full: `${window.location.origin}${l.url}` })));
      avisar('Enlaces de firma generados (comprador → vendedor → administrador)');
    } catch { avisar('No se pudo crear el acuerdo de firma'); }
    setCreando(false);
  };

  // Descarga directa del PDF del borrador (generado en el servidor, sin firmas)
  const descargar = async () => {
    setDescargando(true);
    try {
      await descargarPdfBorrador(modo, S);
    } catch (e) {
      avisar(e.message || 'No se pudo descargar el PDF');
    }
    setDescargando(false);
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
            <button className="g" onClick={enviar} disabled={creando}>{creando ? 'Generando…' : 'Enviar link para firma'}</button>
            <button type="button" onClick={() => window.print()}>Imprimir</button>
            <button type="button" onClick={descargar} disabled={descargando}>{descargando ? 'Generando PDF…' : 'Descargar PDF'}</button>
          </div>
          {links.length > 0 && (
            <div className="card view noprint">
              <b>Enlaces de firma (secuencia: comprador → vendedor → administrador)</b>
              {links.map((l) => (
                <div key={l.token} className="row" style={{ margin: '10px 0' }}>
                  <span style={{ minWidth: 120, textTransform: 'capitalize' }}>{l.rol}</span>
                  <span className="link" style={{ flex: 1 }}>{l.full}</span>
                  <button onClick={() => { navigator.clipboard?.writeText(l.full); avisar('Link copiado'); }}>Copiar</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

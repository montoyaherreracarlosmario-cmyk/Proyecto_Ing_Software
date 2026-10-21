'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Hoja from '../../../components/Hoja';
import FirmaFlujo from '../../../components/firmas/FirmaFlujo';
import EvidenciaTabla from '../../../components/firmas/EvidenciaTabla';
import { porToken, rechazar, verificar, urlPdf } from '../../../lib/apiFirmas';
import './firma.css';

export default function PaginaFirma() {
  const { token } = useParams();
  const [vista, setVista] = useState(null);
  const [err, setErr] = useState('');
  const [toast, setToast] = useState('');
  const [obs, setObs] = useState('');
  const [verif, setVerif] = useState(null);

  const avisar = (t) => { setToast(t); setTimeout(() => setToast(''), 2600); };
  const cargar = useCallback(() => porToken(token).then(setVista).catch((e) => setErr(e.message)), [token]);
  useEffect(() => { cargar(); }, [cargar]);

  const firmado = (v) => { setVista(v); setVerif(null); };
  const miTurno = vista && vista.estado === 'en_firma' && vista.miEstado === 'pendiente' && vista.turno?.rol === vista.miRol;
  const cerrado = vista && (vista.estado === 'firmado' || vista.estado === 'rechazado');

  // Imágenes de las firmas ya registradas, para pintarlas dentro del contrato
  const firmasEnHoja = {};
  (vista?.firmantes || []).forEach((f) => {
    if (f.imagen) firmasEnHoja[f.rol] = f.imagen;
  });
  firmasEnHoja.administrador = firmasEnHoja.administrador || firmasEnHoja.administrativo;

  const hacerRechazo = async () => {
    try {
      const v = await rechazar(token, obs);
      setVista(v);
      avisar('Acuerdo rechazado con observaciones');
    } catch (e) { avisar(e.message); }
  };

  const comprobar = async () => {
    try { setVerif(await verificar(vista.id)); } catch (e) { avisar(e.message); }
  };

  if (err) return (
    <main><div className="card fm-error">
      <h2>No se pudo abrir el enlace</h2>
      <p className="mut">{err}</p>
    </div></main>
  );

  if (!vista) return <main><p className="mut">Cargando acuerdo de firma…</p></main>;

  return (
    <main className="fm-main">
      <div className="fm-cab noprint">
        <div>
          <h2 style={{ marginBottom: 4 }}>Firma electrónica</h2>
          <p className="mut">
            Contrato de {vista.tipo === 'venta' ? 'compraventa' : 'arriendo'} — estado:{' '}
            <span className={`tag ${vista.estado === 'firmado' ? 'Arrendada' : vista.estado === 'rechazado' ? 'Vendida' : 'pulse'}`}>
              {vista.estado === 'en_firma' ? 'En firma' : vista.estado === 'firmado' ? 'Firmado' : 'Rechazado'}
            </span>
          </p>
        </div>
        <div className="row" style={{ margin: 0 }}>
          <button type="button" onClick={() => window.print()}>Imprimir / PDF</button>
          {vista.pdfDisponible && <a className="btn-pdf" href={urlPdf(vista.id)}>Descargar PDF final</a>}
          <button type="button" onClick={comprobar}>Verificar integridad</button>
        </div>
      </div>

      {verif && (
        <div className={`card noprint fm-verif ${verif.integro ? 'ok' : 'mal'}`}>
          <b>{verif.integro ? 'Documento íntegro' : 'ADVERTENCIA: documento alterado'}</b>
          <p className="mut">
            Hash del contrato recomputado {verif.contratoIntegro ? 'coincide' : 'NO coincide'}; cadena de firmas{' '}
            {verif.cadenaIntegra ? 'válida' : 'inválida'}.
          </p>
        </div>
      )}

      {vista.estado === 'en_firma' && !miTurno && (
        <div className="card noprint fm-espera">
          {vista.turno
            ? <>Ahora le corresponde firmar a: <b>{vista.turno.rol}</b>. Recibirá su enlace privado.</>
            : <>Todas las firmas fueron registradas; el acuerdo está cerrando.</>}
          <ul className="fm-estados">
            {vista.firmantes.map((f) => (
              <li key={f.rol}>
                <span className={`tag ${f.estado === 'firmada' ? 'Arrendada' : f.estado === 'rechazada' ? 'Vendida' : 'Sin'}`}>{f.estado}</span>
                {f.rol} {f.nombre ? `— ${f.nombre}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      {miTurno && vista.miRol !== 'administrador' && (
        <FirmaFlujo vista={vista} token={token} avisar={avisar} firmado={firmado} />
      )}

      {miTurno && vista.miRol === 'administrador' && (
        <>
          <FirmaFlujo vista={vista} token={token} avisar={avisar} firmado={firmado} />
          <div className="card noprint fm-rechazo">
            <h3 style={{ marginTop: 0 }}>¿No apruebas el acuerdo?</h3>
            <p className="mut">Puedes rechazarlo dejando observaciones; las firmas de comprador y vendedor quedan como evidencia.</p>
            <textarea rows="3" value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Motivo del rechazo" />
            <div className="row"><button type="button" className="o" onClick={hacerRechazo} disabled={obs.trim().length < 5}>Rechazar acuerdo</button></div>
          </div>
        </>
      )}

      {vista.miEstado === 'firmada' && vista.estado === 'en_firma' && (
        <div className="card noprint">
          <b>Firmaste correctamente.</b>
          <p className="mut">Tu firma quedó registrada con evidencia técnica. Espera las firmas pendientes; el PDF final quedará disponible al cerrar el acuerdo.</p>
        </div>
      )}

      {vista.estado === 'rechazado' && (
        <div className="card noprint fm-rechazado">
          <b>Acuerdo rechazado</b>
          {vista.firmantes.filter((f) => f.rechazo).map((f) => (
            <p key={f.rol} className="mut">Observaciones de {f.rol}: “{f.rechazo.observaciones}”</p>
          ))}
          <p className="mut">Las firmas ya registradas se conservan como evidencia. Puedes descargar el PDF del estado final.</p>
        </div>
      )}

      <div className="fm-contrato">
        <Hoja modo={vista.tipo} S={vista.datos} firmas={firmasEnHoja} />
      </div>

      <EvidenciaTabla firmantes={vista.firmantes} contratoHash={vista.contratoHash} />

      <p className="mut noprint fm-nota">
        Documento conforme a la Ley 527 de 1999 (mensajes de datos). La integridad de las firmas
        es verificable con el botón “Verificar integridad” y el PDF final incluye el anexo de evidencia.
      </p>

      {toast && <div id="toast">{toast}</div>}
    </main>
  );
}

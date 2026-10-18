'use client';
import { useEffect, useState } from 'react';
import { getInmuebles } from '../../../../frontend/lib/api';
import Lista from '../../../../frontend/components/Lista';
import Detalle from '../../../../frontend/components/Detalle';
import ContratoForm from '../../../../frontend/components/ContratoForm';
import InmuebleForm from '../../../../frontend/components/InmuebleForm';
import { FILTROS0 } from '../../../../frontend/lib/utils';
import { Logo } from '../../../../frontend/components/Iconos';

export default function Home() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [tab, setTab] = useState('Casa');
  const [filtros, setFiltros] = useState(FILTROS0);
  const [vista, setVista] = useState({ n: 'lista' });
  const [oculto, setOculto] = useState(false);
  const [toast, setToast] = useState('');

  const cargar = () => getInmuebles().then(setData).catch(() => setErr('No se pudo conectar con el backend. Revisa que NestJS esté corriendo y que NEXT_PUBLIC_API_URL sea correcta.'));
  useEffect(() => { cargar(); }, []);

  // La cabecera se esconde al bajar y reaparece al subir
  useEffect(() => {
    let u = 0;
    const f = () => { const y = scrollY; if (y > u && y > 80) setOculto(true); else if (y < u) setOculto(false); u = Math.max(y, 0); };
    addEventListener('scroll', f, { passive: true });
    return () => removeEventListener('scroll', f);
  }, []);

  const avisar = (t) => { setToast(t); setTimeout(() => setToast(''), 2200); };
  const sel = data?.find((i) => i._id === vista.id);

  return (
    <>
      <header className={oculto ? 'oculto' : ''}><div className="marca"><Logo /><h1>Habitat Capital</h1></div><p>Gestión de inmuebles y contratos</p></header>
      <main>
        {err && <div className="card">{err}</div>}
        {!data && !err && <p className="mut">Cargando inmuebles…</p>}
        {data && vista.n === 'lista' && <Lista data={data} tab={tab} setTab={setTab} filtros={filtros} setFiltros={setFiltros} nuevo={() => { scrollTo(0, 0); setVista({ n: 'nuevo' }); }} abrir={(id) => setVista({ n: 'detalle', id })} />}
        {data && vista.n === 'nuevo' && <InmuebleForm tipo0={tab} avisar={avisar} volver={() => setVista({ n: 'lista' })} creado={(nuevo) => { avisar('Inmueble agregado'); cargar(); setTab(nuevo.tipo); setFiltros(FILTROS0); setVista({ n: 'lista' }); }} />}
        {data && vista.n === 'detalle' && sel && <Detalle inm={sel} volver={() => setVista({ n: 'lista' })} crear={(modo) => { scrollTo(0, 0); setVista({ n: 'form', id: sel._id, modo }); }} />}
        {data && vista.n === 'form' && sel && <ContratoForm inm={sel} modo0={vista.modo} avisar={avisar} volver={() => setVista({ n: 'detalle', id: sel._id })} terminado={() => { cargar(); setVista({ n: 'detalle', id: sel._id }); }} />}
      </main>
      {toast && <div id="toast">{toast}</div>}
    </>
  );
}

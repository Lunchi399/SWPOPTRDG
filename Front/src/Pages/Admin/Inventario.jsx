import { useCallback, useEffect, useState } from 'react';
import Layout from '../../components/Admin/Layout';
import { getTurno, getInsumos } from '../../services/inventarioService';
import ModalTurno     from './inventario/ModalTurno';
import TabDashboard   from './inventario/TabDashboard';
import TabEstado      from './inventario/TabEstado';
import TabInsumos     from './inventario/TabInsumos';
import TabPedidos     from './inventario/TabPedidos';
import TabMovimientos from './inventario/TabMovimientos';
import TabRecetas     from './inventario/TabRecetas';
import TabMerma       from './inventario/TabMerma';

const TABS = [
  { id:'dashboard',   label:'📊 Dashboard'  },
  { id:'estado',      label:'🧭 Estado'      },
  { id:'insumos',     label:'📦 Insumos'     },
  { id:'pedidos',     label:'🛒 Pedidos'     },
  { id:'movimientos', label:'🔄 Movimientos' },
  { id:'recetas',     label:'📋 Recetas'     },
  { id:'merma',       label:'🗑️ Merma'       },
];

export default function Inventario() {
  const [tab,     setTab]     = useState('dashboard');
  const [turno,   setTurno]   = useState(null);
  const [insumos, setInsumos] = useState([]);
  const [modal,   setModal]   = useState(null);     // 'abrir' | 'cerrar' | null
  const [toast,   setToast]   = useState('');

  const cargarTurno = useCallback(() => {
    getTurno().then(r => setTurno(r.data)).catch(() => setTurno(null));
  }, []);
  const cargarInsumos = useCallback(() => {
    getInsumos().then(r => setInsumos(r.data)).catch(() => {});
  }, []);

  useEffect(() => { cargarTurno(); }, [cargarTurno]);
  useEffect(() => { cargarInsumos(); }, [tab, cargarInsumos]);

  const turnoAbierto = turno?.estado === 'abierto';
  const total     = insumos.length;
  const enAlmacen = insumos.filter(i => parseFloat(i.stock_almacen) > 0).length;
  const enUso     = insumos.filter(i => parseFloat(i.stock_utilizacion) > 0).length;
  const enAlerta  = insumos.filter(i => i.en_alerta).length;

  const metricas = [
    { icono:'📦', valor:total,     label:'Total',          bg:'#EAF1FF', fg:'#1D4ED8' },
    { icono:'🏬', valor:enAlmacen, label:'En almacén',     bg:'#E8FAF1', fg:'#059669' },
    { icono:'🍳', valor:enUso,     label:'En utilización', bg:'#EEF0FF', fg:'#4338CA' },
    { icono:'⚠️', valor:enAlerta,  label:'En alerta',      bg:'#FEF3D0', fg:'#92400E' },
  ];

  const turnoListo = (mensaje) => {
    setModal(null);
    setToast(mensaje);
    cargarTurno();
    cargarInsumos();
    setTimeout(() => setToast(''), 3500);
  };

  return (
    <Layout>
      <div style={s.pagina}>
        {toast && <div style={s.toast}>✅ {toast}</div>}

        {/* Encabezado */}
        <div style={s.header}>
          <div style={s.headerLeft}>
            <span style={s.icono}>📦</span>
            <div>
              <h1 style={s.titulo}>Gestión de Inventario</h1>
              <p style={s.subtitulo}>{total} insumos · {enAlerta} en alerta</p>
            </div>
          </div>

          <div style={s.headerRight}>
            <span style={{ ...s.estadoPill,
              background: turnoAbierto ? '#DCFCE7' : '#F3F4F6',
              color:      turnoAbierto ? '#166534' : '#6B7280' }}>
              <span style={{ ...s.punto,
                background: turnoAbierto ? '#10B981' : '#9CA3AF' }} />
              {turnoAbierto
                ? `Turno abierto desde ${new Date(turno.hora_inicio)
                    .toLocaleTimeString('es-PE', { hour:'2-digit', minute:'2-digit' })}`
                : 'Sin turno activo'}
            </span>
            <button
              style={turnoAbierto ? s.btnCerrar : s.btnIniciar}
              onClick={() => setModal(turnoAbierto ? 'cerrar' : 'abrir')}>
              {turnoAbierto ? '⏹ Cerrar día' : '▶ Iniciar día'}
            </button>
          </div>
        </div>

        {/* Métricas */}
        <div style={s.metricas}>
          {metricas.map(m => (
            <div key={m.label} style={{ ...s.metrica, background:m.bg }}>
              <span style={s.metricaIcono}>{m.icono}</span>
              <span style={{ ...s.metricaValor, color:m.fg }}>{m.valor}</span>
              <span style={{ ...s.metricaLabel, color:m.fg }}>{m.label}</span>
            </div>
          ))}
        </div>

        {/* Pestañas */}
        <div style={s.tabs}>
          {TABS.map(t => (
            <button key={t.id}
              style={{ ...s.tab, ...(tab === t.id ? s.tabActiva : {}) }}
              onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'dashboard'   && <TabDashboard onAlertas={() => {}} />}
        {tab === 'estado'      && <TabEstado />}
        {tab === 'insumos'     && <TabInsumos />}
        {tab === 'pedidos'     && <TabPedidos />}
        {tab === 'movimientos' && <TabMovimientos />}
        {tab === 'recetas'     && <TabRecetas />}
        {tab === 'merma'       && <TabMerma />}
      </div>

      {modal && (
        <ModalTurno tipo={modal} turno={turno}
          onClose={() => setModal(null)} onListo={turnoListo} />
      )}
    </Layout>
  );
}

const s = {
  pagina:     { padding:'2.5rem 2.75rem', minHeight:'100vh', background:'#F8F9FC', boxSizing:'border-box' },
  btnIniciar: { display:'inline-flex', alignItems:'center', gap:8, padding:'12px 22px', borderRadius:12, border:'none', background:'#059669', color:'#fff', cursor:'pointer', fontSize:14, fontWeight:700, boxShadow:'0 6px 16px rgba(5,150,105,0.30)' },
  btnCerrar:  { display:'inline-flex', alignItems:'center', gap:8, padding:'12px 22px', borderRadius:12, border:'none', background:'#DC2626', color:'#fff', cursor:'pointer', fontSize:14, fontWeight:700, boxShadow:'0 6px 16px rgba(220,38,38,0.28)' },
  toast:      { background:'#ECFDF5', color:'#059669', padding:'10px 16px', borderRadius:10, marginBottom:14, fontSize:13, fontWeight:600 },
  header:     { display:'flex', justifyContent:'space-between', alignItems:'center', gap:16, flexWrap:'wrap', marginBottom:'1.5rem' },
  headerLeft: { display:'flex', alignItems:'center', gap:14 },
  icono:      { fontSize:34 },
  titulo:     { fontSize:28, fontWeight:800, color:'#0F1628', margin:0, letterSpacing:'-0.02em' },
  subtitulo:  { fontSize:14, color:'#6B7280', margin:'2px 0 0' },
  headerRight:{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' },
  estadoPill: { display:'flex', alignItems:'center', gap:8, padding:'8px 14px', borderRadius:20, fontSize:12, fontWeight:600 },
  punto:      { width:8, height:8, borderRadius:'50%' },
  btnIniciar: { padding:'12px 22px', borderRadius:12, border:'none', background:'#059669', color:'#fff', cursor:'pointer', fontSize:14, fontWeight:700, boxShadow:'0 6px 16px rgba(5,150,105,0.30)' },
  btnCerrar:  { padding:'12px 22px', borderRadius:12, border:'none', background:'#DC2626', color:'#fff', cursor:'pointer', fontSize:14, fontWeight:700, boxShadow:'0 6px 16px rgba(220,38,38,0.28)' },
  metricas:   { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14, marginBottom:'1.5rem' },
  metrica:    { display:'flex', alignItems:'center', gap:14, padding:'18px 22px', borderRadius:18 },
  metricaIcono:{ fontSize:32 },
  metricaValor:{ fontSize:32, fontWeight:800, lineHeight:1 },
  metricaLabel:{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em' },
  tabs:       { display:'flex', background:'#fff', borderBottom:'2px solid #E8EAF0', marginBottom:'1.25rem', overflowX:'auto', borderRadius:'12px 12px 0 0' },
  tab:        { padding:'12px 18px', border:'none', background:'transparent', color:'#6B7280', cursor:'pointer', fontSize:13, fontWeight:500, borderBottom:'2px solid transparent', marginBottom:-2, whiteSpace:'nowrap' },
  tabActiva:  { color:'#0F1628', borderBottomColor:'#6366F1', fontWeight:700 },
};
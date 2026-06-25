import { useState } from 'react';
import { logoutService, getUsuario } from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import TabCobro    from './tabs/TabCobro';
import TabHistorial from './tabs/TabHistorial';
import TabCuadre   from './tabs/TabCuadre';
import TabReclamos from './tabs/TabReclamos';

const TABS = [
  { id:'cobro',     label:'💳 Cobro'    },
  { id:'historial', label:'📜 Historial' },
  { id:'cuadre',    label:'🧾 Cuadre'   },
  { id:'reclamos',  label:'📝 Reclamos' },
];

export default function CajaIndex() {
  const [tabActiva, setTabActiva] = useState('cobro');
  const [pedientesCobro, setPendientesCobro] = useState(0);
  const navigate = useNavigate();
  const usuario  = getUsuario();

  const handleLogout = async () => {
    await logoutService();
    navigate('/login');
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.logo}>💰</div>
          <div>
            <div style={s.titulo}>Don George</div>
            <div style={s.subtitulo}>Módulo Caja</div>
          </div>
        </div>
        <div style={s.headerRight}>
          <span style={s.usuario}>
            👤 {usuario?.Nombre} {usuario?.Apellido}
          </span>
          <button style={s.logoutBtn} onClick={handleLogout}>
            Salir
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {TABS.map(t => (
          <button key={t.id}
            style={{
              ...s.tab,
              ...(tabActiva === t.id ? s.tabActiva : {})
            }}
            onClick={() => setTabActiva(t.id)}>
            {t.label}
            {t.id === 'cobro' && pedientesCobro > 0 && (
              <span style={s.badge}>{pedientesCobro}</span>
            )}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div style={s.contenido}>
        {tabActiva === 'cobro'     && (
          <TabCobro onContarPendientes={setPendientesCobro} />
        )}
        {tabActiva === 'historial' && <TabHistorial />}
        {tabActiva === 'cuadre'    && <TabCuadre />}
        {tabActiva === 'reclamos'  && <TabReclamos />}
      </div>
    </div>
  );
}

const s = {
  page:       { minHeight:'100vh', background:'#F8F7F2',
                fontFamily:'Arial, sans-serif' },
  header:     { background:'#1E2D40', padding:'1rem 1.5rem',
                display:'flex', justifyContent:'space-between',
                alignItems:'center' },
  headerLeft: { display:'flex', alignItems:'center', gap:12 },
  logo:       { fontSize:28 },
  titulo:     { color:'#fff', fontWeight:700, fontSize:16 },
  subtitulo:  { color:'#8AADCA', fontSize:11 },
  headerRight:{ display:'flex', alignItems:'center', gap:12 },
  usuario:    { color:'#8AADCA', fontSize:13 },
  logoutBtn:  { padding:'6px 14px', borderRadius:7, background:'#993C1D',
                color:'#fff', border:'none', cursor:'pointer', fontSize:12 },
  tabs:       { display:'flex', background:'#fff',
                borderBottom:'2px solid #E8E6DF', padding:'0 1.5rem' },
  tab:        { padding:'12px 20px', border:'none', background:'transparent',
                color:'#888', cursor:'pointer', fontSize:13, fontWeight:500,
                borderBottom:'2px solid transparent', marginBottom:'-2px',
                transition:'all .15s', display:'flex',
                alignItems:'center', gap:8 },
  tabActiva:  { color:'#1E2D40', borderBottomColor:'#2E5F8A', fontWeight:700 },
  badge:      { background:'#993C1D', color:'#fff', fontSize:11,
                fontWeight:700, padding:'2px 7px', borderRadius:20 },
  contenido:  { padding:'1.5rem' },
};
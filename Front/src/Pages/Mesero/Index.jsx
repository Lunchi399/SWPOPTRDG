import { useState } from 'react';
import { logoutService, getUsuario } from '../../Services/authService';
import { useNavigate } from 'react-router-dom';
import TabMesas    from './Tabs/TabMesas';
import TabPedidos  from './Tabs/TabPedidos.jsx';
import TabReclamos from './Tabs/TabReclamos.jsx';
import TabHistorial from './Tabs/TabHistorial.jsx';

const TABS = [
  { id: 'mesas',    label: '🪑 Mesas',    },
  { id: 'pedidos',  label: '📋 Pedidos',  },
  { id: 'reclamos', label: '📝 Reclamos', },
  { id: 'historial',label: '📜 Historial',},
];

export default function MeseroIndex() {
  const [tabActiva, setTabActiva] = useState('mesas');
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
  const navigate  = useNavigate();
  const usuario   = getUsuario();

  const handleLogout = async () => {
    await logoutService();
    navigate('/login');
  };

  const irAPedido = (mesa) => {
    setMesaSeleccionada(mesa);
    setTabActiva('pedidos');
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.logo}>DG</div>
          <div>
            <div style={s.titulo}>Don George</div>
            <div style={s.subtitulo}>Módulo Mesero</div>
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
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div style={s.contenido}>
        {tabActiva === 'mesas'     && <TabMesas onVerPedido={irAPedido} />}
        {tabActiva === 'pedidos'   && <TabPedidos mesaInicial={mesaSeleccionada} />}
        {tabActiva === 'reclamos'  && <TabReclamos />}
        {tabActiva === 'historial' && <TabHistorial />}
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
  logo:       { width:36, height:36, borderRadius:8, background:'#2E5F8A',
                display:'flex', alignItems:'center', justifyContent:'center',
                color:'#fff', fontWeight:700, fontSize:14 },
  titulo:     { color:'#fff', fontWeight:700, fontSize:15 },
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
                transition:'all .15s' },
  tabActiva:  { color:'#1E2D40', borderBottomColor:'#2E5F8A', fontWeight:700 },
  contenido:  { padding:'1.5rem' },
};
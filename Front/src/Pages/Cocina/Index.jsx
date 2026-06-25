import { useState } from 'react';
import { logoutService, getUsuario } from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import TabCola     from './tabs/TabCola';
import TabHistorial from './tabs/TabHistorial';

const TABS = [
  { id: 'cola',     label: '👨‍🍳 Cola de pedidos' },
  { id: 'historial',label: '📜 Historial'        },
];

export default function CocinaIndex() {
  const [tabActiva, setTabActiva] = useState('cola');
  const [pedidosPendientes, setPedidosPendientes] = useState(0);
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
          <div style={s.logo}>🍳</div>
          <div>
            <div style={s.titulo}>Don George</div>
            <div style={s.subtitulo}>Módulo Cocina (KDS)</div>
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
            {t.id === 'cola' && pedidosPendientes > 0 && (
              <span style={s.badge}>{pedidosPendientes}</span>
            )}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div style={s.contenido}>
        {tabActiva === 'cola' && (
          <TabCola onContarPendientes={setPedidosPendientes} />
        )}
        {tabActiva === 'historial' && <TabHistorial />}
      </div>
    </div>
  );
}

const s = {
  page:       { minHeight:'100vh', background:'#1A1A2E',
                fontFamily:'Arial, sans-serif' },
  header:     { background:'#16213E', padding:'1rem 1.5rem',
                display:'flex', justifyContent:'space-between',
                alignItems:'center',
                borderBottom:'2px solid #0F3460' },
  headerLeft: { display:'flex', alignItems:'center', gap:12 },
  logo:       { fontSize:28 },
  titulo:     { color:'#fff', fontWeight:700, fontSize:16 },
  subtitulo:  { color:'#8AADCA', fontSize:11 },
  headerRight:{ display:'flex', alignItems:'center', gap:12 },
  usuario:    { color:'#8AADCA', fontSize:13 },
  logoutBtn:  { padding:'6px 14px', borderRadius:7, background:'#993C1D',
                color:'#fff', border:'none', cursor:'pointer', fontSize:12 },
  tabs:       { display:'flex', background:'#16213E',
                borderBottom:'2px solid #0F3460',
                padding:'0 1.5rem' },
  tab:        { padding:'12px 24px', border:'none',
                background:'transparent', color:'#8AADCA',
                cursor:'pointer', fontSize:13, fontWeight:500,
                borderBottom:'3px solid transparent',
                marginBottom:'-2px', transition:'all .15s',
                display:'flex', alignItems:'center', gap:8 },
  tabActiva:  { color:'#fff', borderBottomColor:'#E94560' },
  badge:      { background:'#E94560', color:'#fff', fontSize:11,
                fontWeight:700, padding:'2px 7px', borderRadius:20,
                minWidth:20, textAlign:'center' },
  contenido:  { padding:'1.5rem' },
};
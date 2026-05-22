import { useNavigate, useLocation } from 'react-router-dom';
import { logoutService, getUsuario } from '../../services/authService';

const MENU = [
  { path: '/admin/dashboard', icon: '📊', label: 'Dashboard'  },
  { path: '/admin/usuarios',  icon: '👥', label: 'Usuarios'   },
  { path: '/admin/productos', icon: '🍽️', label: 'Productos'  },
  { path: '/admin/mesas',     icon: '🪑', label: 'Mesas'      },
  { path: '/admin/reclamos',  icon: '📋', label: 'Reclamos'   },
];

export default function Layout({ children }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const usuario   = getUsuario();

  const handleLogout = async () => {
    await logoutService();
    navigate('/login');
  };

  return (
    <div style={s.root}>
      {/* Sidebar */}
      <aside style={s.sidebar}>
        <div style={s.brand}>
          <div style={s.brandIcon}>DG</div>
          <div>
            <div style={s.brandName}>Don George</div>
            <div style={s.brandRole}>Administrador</div>
          </div>
        </div>

        <nav style={s.nav}>
          {MENU.map(item => {
            const active = location.pathname === item.path;
            return (
              <button key={item.path}
                style={{ ...s.navItem, ...(active ? s.navActive : {}) }}
                onClick={() => navigate(item.path)}>
                <span style={s.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div style={s.sidebarFooter}>
          <div style={s.userInfo}>
            <div style={s.userAvatar}>
              {usuario?.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={s.userName}>{usuario?.username}</div>
              <div style={s.userRol}>{usuario?.rol}</div>
            </div>
          </div>
          <button style={s.logoutBtn} onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <main style={s.main}>
        {children}
      </main>
    </div>
  );
}

const s = {
  root:        { display:'flex', minHeight:'100vh', fontFamily:'Arial,sans-serif' },
  sidebar:     { width:220, background:'#1E2D40', display:'flex',
                 flexDirection:'column', padding:'1.25rem 0', flexShrink:0 },
  brand:       { display:'flex', alignItems:'center', gap:10,
                 padding:'0 1.25rem 1.25rem', borderBottom:'1px solid #2E3F52' },
  brandIcon:   { width:36, height:36, borderRadius:8, background:'#2E5F8A',
                 display:'flex', alignItems:'center', justifyContent:'center',
                 color:'#fff', fontWeight:700, fontSize:14 },
  brandName:   { color:'#fff', fontWeight:700, fontSize:14 },
  brandRole:   { color:'#8AADCA', fontSize:11 },
  nav:         { flex:1, padding:'1rem 0.75rem', display:'flex',
                 flexDirection:'column', gap:4 },
  navItem:     { display:'flex', alignItems:'center', gap:10, padding:'9px 12px',
                 borderRadius:8, border:'none', background:'transparent',
                 color:'#8AADCA', cursor:'pointer', fontSize:13,
                 textAlign:'left', width:'100%', transition:'all .15s' },
  navActive:   { background:'#2E5F8A', color:'#fff' },
  navIcon:     { fontSize:16, width:20, textAlign:'center' },
  sidebarFooter:{ padding:'1rem 1.25rem', borderTop:'1px solid #2E3F52' },
  userInfo:    { display:'flex', alignItems:'center', gap:8, marginBottom:10 },
  userAvatar:  { width:32, height:32, borderRadius:'50%', background:'#2E5F8A',
                 display:'flex', alignItems:'center', justifyContent:'center',
                 color:'#fff', fontWeight:700, fontSize:13 },
  userName:    { color:'#fff', fontSize:12, fontWeight:600 },
  userRol:     { color:'#8AADCA', fontSize:10 },
  logoutBtn:   { width:'100%', padding:'7px', borderRadius:7,
                 background:'#993C1D', color:'#fff', border:'none',
                 cursor:'pointer', fontSize:12 },
  main:        { flex:1, background:'#F8F7F2', padding:'1.5rem',
                 overflowY:'auto' },
};
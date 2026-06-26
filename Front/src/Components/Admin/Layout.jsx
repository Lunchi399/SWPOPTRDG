import { useNavigate, useLocation } from 'react-router-dom';
import { logoutService, getUsuario } from '../../services/authService';
import { COLORS, SHADOW, RADIUS } from '../../token';

const MENU = [
  { path:'/admin/dashboard', icon:'⊞',  label:'Dashboard'  },
  { path:'/admin/usuarios',  icon:'👥', label:'Usuarios'   },
  { path:'/admin/productos', icon:'🍽️', label:'Productos'  },
  { path:'/admin/mesas',     icon:'🪑', label:'Mesas'      },
  { path:'/admin/reclamos',  icon:'📋', label:'Reclamos'   },
];

export default function Layout({ children }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const usuario   = getUsuario();

  const handleLogout = async () => {
    await logoutService();
    navigate('/login');
  };

  const initials = `${usuario?.Nombre?.[0] || ''}${usuario?.Apellido?.[0] || ''}`.toUpperCase();

  return (
    <div style={s.root}>
      {/* Sidebar */}
      <aside style={s.sidebar}>
        {/* Logo */}
        <div style={s.logoWrap}>
          <div style={s.logoIcon}>DG</div>
          <div>
            <div style={s.logoName}>Don George</div>
            <div style={s.logoSub}>Sistema de gestión</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={s.nav}>
          <div style={s.navLabel}>MENÚ PRINCIPAL</div>
          {MENU.map(item => {
            const active = location.pathname === item.path;
            return (
              <button key={item.path}
                style={{ ...s.navItem, ...(active ? s.navActive : {}) }}
                onClick={() => navigate(item.path)}>
                <span style={s.navIcon}>{item.icon}</span>
                <span style={s.navText}>{item.label}</span>
                {active && <div style={s.navIndicator} />}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={s.sidebarFooter}>
          <div style={s.userCard}>
            <div style={s.userAvatar}>{initials || '?'}</div>
            <div style={s.userInfo}>
              <div style={s.userName}>
                {usuario?.Nombre} {usuario?.Apellido}
              </div>
              <div style={s.userRole}>Administrador</div>
            </div>
          </div>
          <button style={s.logoutBtn} onClick={handleLogout}>
            ⏻ Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={s.main}>
        {children}
      </main>
    </div>
  );
}

const C = COLORS;
const s = {
  root:        { display:'flex', minHeight:'100vh',
                 background:C.bg, fontFamily:'"Inter",Arial,sans-serif' },
  sidebar:     { width:240, background:'#0F1628', display:'flex',
                 flexDirection:'column', flexShrink:0,
                 position:'sticky', top:0, height:'100vh',
                 overflowY:'auto' },
  logoWrap:    { display:'flex', alignItems:'center', gap:12,
                 padding:'1.5rem 1.25rem 1.25rem',
                 borderBottom:'1px solid rgba(255,255,255,0.06)' },
  logoIcon:    { width:38, height:38, borderRadius:RADIUS.sm,
                 background:'linear-gradient(135deg,#6366F1,#8B5CF6)',
                 display:'flex', alignItems:'center',
                 justifyContent:'center', color:'#fff',
                 fontWeight:800, fontSize:13, flexShrink:0 },
  logoName:    { color:'#fff', fontWeight:700, fontSize:14,
                 letterSpacing:'-0.02em' },
  logoSub:     { color:'rgba(255,255,255,0.35)', fontSize:10,
                 marginTop:1 },
  nav:         { flex:1, padding:'1.25rem 0.875rem',
                 display:'flex', flexDirection:'column', gap:2 },
  navLabel:    { fontSize:9.5, fontWeight:600, color:'rgba(255,255,255,0.25)',
                 letterSpacing:'.1em', padding:'0 0.5rem',
                 marginBottom:8, marginTop:4 },
  navItem:     { display:'flex', alignItems:'center', gap:10,
                 padding:'9px 12px', borderRadius:RADIUS.sm,
                 border:'none', background:'transparent',
                 color:'rgba(255,255,255,0.5)', cursor:'pointer',
                 fontSize:13, fontWeight:500, textAlign:'left',
                 width:'100%', position:'relative',
                 transition:'all .15s' },
  navActive:   { background:'rgba(99,102,241,0.15)',
                 color:'#A5B4FC' },
  navIcon:     { fontSize:16, width:20, textAlign:'center', flexShrink:0 },
  navText:     { flex:1 },
  navIndicator:{ position:'absolute', right:0, top:'25%', bottom:'25%',
                 width:3, borderRadius:RADIUS.full,
                 background:'#6366F1' },
  sidebarFooter:{ padding:'1rem 0.875rem',
                  borderTop:'1px solid rgba(255,255,255,0.06)' },
  userCard:    { display:'flex', alignItems:'center', gap:10,
                 padding:'10px 12px', borderRadius:RADIUS.sm,
                 background:'rgba(255,255,255,0.04)',
                 marginBottom:8 },
  userAvatar:  { width:32, height:32, borderRadius:RADIUS.full,
                 background:'linear-gradient(135deg,#6366F1,#8B5CF6)',
                 display:'flex', alignItems:'center',
                 justifyContent:'center', color:'#fff',
                 fontWeight:700, fontSize:12, flexShrink:0 },
  userInfo:    { flex:1, minWidth:0 },
  userName:    { color:'#fff', fontSize:12, fontWeight:600,
                 whiteSpace:'nowrap', overflow:'hidden',
                 textOverflow:'ellipsis' },
  userRole:    { color:'rgba(255,255,255,0.35)', fontSize:10, marginTop:1 },
  logoutBtn:   { width:'100%', padding:'8px', borderRadius:RADIUS.sm,
                 background:'rgba(239,68,68,0.1)',
                 border:'1px solid rgba(239,68,68,0.2)',
                 color:'#FCA5A5', cursor:'pointer', fontSize:12,
                 fontWeight:500, transition:'all .15s' },
  main:        { flex:1, padding:'2rem', overflowY:'auto',
                 minHeight:'100vh' },
};
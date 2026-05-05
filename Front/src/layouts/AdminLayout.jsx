import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { logoutService, getUsuario } from "../services/authService";

const NAV_ITEMS = [
  {
    path: '/admin/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    path: '/admin/usuarios',
    label: 'Usuarios',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    path: '/admin/carta',
    label: 'Carta',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
  {
    path: '/admin/mesas',
    label: 'Mesas',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="8" width="18" height="4" rx="1"/>
        <line x1="7" y1="12" x2="7" y2="20"/><line x1="17" y1="12" x2="17" y2="20"/>
        <line x1="5" y1="20" x2="9" y2="20"/><line x1="15" y1="20" x2="19" y2="20"/>
      </svg>
    ),
  },
  {
    path: '/admin/pedidos',
    label: 'Pedidos',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    ),
  },
];

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const usuario = getUsuario();

  const handleLogout = async () => {
  setLoggingOut(true);
  try {
    await logoutService();
  } catch (error) {
    console.error(error);
  } finally {
    navigate('/login');
  }
};

  return (
    <div style={s.root}>
      <aside style={{ ...s.sidebar, width: collapsed ? 70 : 240 }}>

        {/* Brand */}
        <div style={s.brand}>
          <div style={s.brandIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <path d="M3 2h18l-2 7H5L3 2z"/><path d="M5 9c0 7 14 7 14 0"/>
              <line x1="12" y1="9" x2="12" y2="22"/>
            </svg>
          </div>
          {!collapsed && (
            <div>
              <div style={s.brandName}>Don George</div>
              <div style={s.brandSub}>Panel Administrativo</div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={s.divider} />

        {/* Nav */}
        <nav style={s.nav}>
          {!collapsed && <div style={s.navSection}>MENÚ PRINCIPAL</div>}
          {NAV_ITEMS.map(item => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                style={{ ...s.navItem, ...(active ? s.navItemActive : {}) }}
                onClick={() => navigate(item.path)}
                title={collapsed ? item.label : ''}
              >
                <span style={{ ...s.navIcon, ...(active ? s.navIconActive : {}) }}>
                  {item.icon}
                </span>
                {!collapsed && (
                  <span style={{ ...s.navLabel, ...(active ? s.navLabelActive : {}) }}>
                    {item.label}
                  </span>
                )}
                {active && <span style={s.activePill} />}
              </button>
            );
          })}
        </nav>

        {/* Collapse btn */}
        <button style={s.collapseBtn} onClick={() => setCollapsed(c => !c)} title="Colapsar menú">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    {collapsed ? <polyline points="9 18 15 12 9 6"/> : <polyline points="15 18 9 12 15 6"/>}
  </svg>
</button>

        <div style={s.divider} />

        {/* User area */}
        <div style={s.userArea}>
          <div style={s.avatar}>
            {usuario?.username?.[0]?.toUpperCase() ?? 'A'}
          </div>
          {!collapsed && (
            <div style={s.userMeta}>
              <span style={s.userName}>{usuario?.username ?? 'Admin'}</span>
              <span style={s.userRole}>Administrador</span>
            </div>
          )}
          {!collapsed && (
            <button style={s.logoutBtn} onClick={handleLogout} disabled={loggingOut} title="Cerrar sesión">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          )}
        </div>
        {collapsed && (
          <button style={{ ...s.logoutBtn, margin: '0 10px 16px', width: 'calc(100% - 20px)' }}
            onClick={handleLogout} disabled={loggingOut} title="Cerrar sesión">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        )}
      </aside>

      <main style={s.main}>{children}</main>
    </div>
  );
}

const s = {
  root: {
    display: 'flex', minHeight: '100vh', background: '#F0F4F8',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  sidebar: {
    background: 'linear-gradient(180deg, #162032 0%, #1E2D40 60%, #1a2a3a 100%)',
    display: 'flex', flexDirection: 'column',
    position: 'sticky', top: 0, height: '100vh',
    transition: 'width 0.25s ease', overflow: 'hidden',
    flexShrink: 0, zIndex: 10,
    boxShadow: '4px 0 20px rgba(0,0,0,0.15)',
  },
  brand: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '24px 16px 20px',
  },
  brandIcon: {
    width: 38, height: 38, borderRadius: 10,
    background: 'linear-gradient(135deg, #2E5F8A, #3a7ab5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, boxShadow: '0 4px 12px rgba(46,95,138,0.4)',
  },
  brandName: {
    color: '#fff', fontWeight: 700, fontSize: 15,
    lineHeight: 1.2, whiteSpace: 'nowrap', letterSpacing: 0.3,
  },
  brandSub: {
    color: '#5A8AAD', fontSize: 10, fontWeight: 500,
    whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: 0.8,
  },
  divider: { height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 16px' },
  navSection: {
    color: '#3D6480', fontSize: 10, fontWeight: 700,
    letterSpacing: 1.2, textTransform: 'uppercase',
    padding: '16px 12px 8px', whiteSpace: 'nowrap',
  },
  nav: {
    display: 'flex', flexDirection: 'column', gap: 2,
    padding: '8px 10px', flex: 1, overflowY: 'auto',
  },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 12px', borderRadius: 8,
    background: 'transparent', border: 'none', cursor: 'pointer',
    color: '#6A93B0', width: '100%', textAlign: 'left',
    transition: 'all 0.15s', position: 'relative',
  },
  navItemActive: {
    background: 'rgba(46,95,138,0.25)',
    color: '#fff',
    boxShadow: 'inset 0 0 0 1px rgba(46,95,138,0.3)',
  },
  navIcon: { flexShrink: 0, opacity: 0.65, transition: 'opacity 0.15s' },
  navIconActive: { opacity: 1 },
  navLabel: { fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap' },
  navLabelActive: { fontWeight: 600 },
  activePill: {
    position: 'absolute', right: 0, top: '50%',
    transform: 'translateY(-50%)',
    width: 3, height: 22, borderRadius: '3px 0 0 3px',
    background: 'linear-gradient(180deg, #4A9FD4, #2E5F8A)',
  },
  collapseBtn: {
  margin: '8px 10px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 8, color: '#5A8AAD', cursor: 'pointer',
  padding: '6px 8px', display: 'flex', alignItems: 'center',
  justifyContent: 'center', transition: 'background 0.2s',
  alignSelf: 'flex-end',
},
  userArea: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '14px 16px', background: 'rgba(0,0,0,0.15)',
  },
  avatar: {
    width: 34, height: 34, borderRadius: '50%',
    background: 'linear-gradient(135deg, #2E5F8A, #4A9FD4)',
    color: '#fff', fontWeight: 700, fontSize: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, boxShadow: '0 2px 8px rgba(46,95,138,0.4)',
  },
  userMeta: { display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 },
  userName: {
    color: '#E0ECF7', fontSize: 13, fontWeight: 600,
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  userRole: { color: '#5A8AAD', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.6 },
  logoutBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '7px', borderRadius: 8,
    background: 'rgba(220,38,38,0.1)',
    border: '1px solid rgba(220,38,38,0.2)',
    color: '#F87171', cursor: 'pointer', flexShrink: 0,
    transition: 'background 0.2s',
  },
  main: { flex: 1, overflow: 'auto', minWidth: 0, background: '#F0F4F8' },
};
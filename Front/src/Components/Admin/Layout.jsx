// src/components/admin/Layout.jsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { logoutService, getUsuario } from '../../services/authService';

// ── Iconos SVG ──
const ICONS = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  usuarios: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  productos: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  mesas: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="4" rx="1"/>
      <line x1="7" y1="12" x2="7" y2="20"/>
      <line x1="17" y1="12" x2="17" y2="20"/>
      <line x1="5" y1="20" x2="9" y2="20"/>
      <line x1="15" y1="20" x2="19" y2="20"/>
    </svg>
  ),
  reclamos: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      <line x1="9" y1="10" x2="15" y2="10"/>
      <line x1="9" y1="14" x2="13" y2="14"/>
    </svg>
  ),
  logout: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
};

const MENU = [
  { path: '/admin/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { path: '/admin/usuarios',  icon: 'usuarios',  label: 'Usuarios'  },
  { path: '/admin/productos', icon: 'productos', label: 'Productos' },
  { path: '/admin/mesas',     icon: 'mesas',     label: 'Mesas'     },
  { path: '/admin/reclamos',  icon: 'reclamos',  label: 'Reclamos'  },
];

export default function Layout({ children }) {
  const navigate   = useNavigate();
  const location   = useLocation();
  const usuario    = getUsuario();
  const [collapsed, setCollapsed]   = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await logoutService(); } catch (e) { console.error(e); }
    finally { navigate('/login'); }
  };

  const initials = usuario?.username?.[0]?.toUpperCase() ?? 'A';
  const rolLabel = usuario?.Rol || usuario?.rol || 'Usuario';

  return (
    <div style={s.root}>
      {/* ── SIDEBAR ── */}
      <aside style={{ ...s.sidebar, width: collapsed ? 70 : 244 }}>

        {/* Brand */}
        <div style={{ ...s.brand, justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <div style={s.brandIcon}>
            <span style={s.brandInitials}>DG</span>
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div style={s.brandName}>Don George</div>
              <div style={s.brandSub}>Panel Administrativo</div>
            </div>
          )}
        </div>

        {/* Sección label */}
        {!collapsed && <div style={s.navSection}>MENÚ PRINCIPAL</div>}

        {/* Nav */}
        <nav style={s.nav}>
          {MENU.map(item => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                className="sidebar-nav-item"
                style={{
                  ...s.navItem,
                  ...(active ? s.navItemActive : {}),
                  justifyContent: collapsed ? 'center' : 'flex-start',
                }}
                onClick={() => navigate(item.path)}
                title={collapsed ? item.label : ''}
              >
                {active && <span style={s.activePill} />}
                <span style={{ ...s.navIcon, opacity: active ? 1 : 0.5 }}>
                  {ICONS[item.icon]}
                </span>
                {!collapsed && (
                  <span style={{ ...s.navLabel, fontWeight: active ? 700 : 500 }}>
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div style={{ flex: 1 }} />

        {/* Collapse btn */}
        <button
          className="sidebar-collapse-btn"
          style={{ ...s.collapseBtn, justifyContent: collapsed ? 'center' : 'flex-start' }}
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            {collapsed
              ? <polyline points="9 18 15 12 9 6"/>
              : <polyline points="15 18 9 12 15 6"/>}
          </svg>
          {!collapsed && <span style={{ marginLeft: 8, fontSize: 12 }}>Colapsar menú</span>}
        </button>

        <div style={s.divider} />

        {/* User area */}
        <div style={{ padding: '12px 10px 20px' }}>
          {/* Info usuario */}
          <div style={{ ...s.userRow, justifyContent: collapsed ? 'center' : 'flex-start' }}>
            <div style={s.avatar}>{initials}</div>
            {!collapsed && (
              <div style={s.userMeta}>
                <span style={s.userName}>{usuario?.username ?? 'Admin'}</span>
                <span style={s.userRole}>{rolLabel}</span>
              </div>
            )}
          </div>

          {/* Cerrar sesión */}
          <button
            className="sidebar-logout-btn"
            style={{ ...s.logoutBtn, justifyContent: collapsed ? 'center' : 'flex-start' }}
            onClick={handleLogout}
            disabled={loggingOut}
            title="Cerrar sesión"
          >
            {ICONS.logout}
            {!collapsed && (
              <span style={{ marginLeft: 8 }}>
                {loggingOut ? 'Saliendo...' : 'Cerrar sesión'}
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main style={s.main}>{children}</main>
    </div>
  );
}

// ── ESTILOS ────────────────────────────────────────────────────────
const s = {
  root: {
    display: 'flex',
    minHeight: '100vh',
    background: '#EEF2F7',
    fontFamily: "'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif",
  },

  sidebar: {
    background: 'linear-gradient(175deg, #0D1B2A 0%, #152234 55%, #1A2E44 100%)',
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky',
    top: 0,
    height: '100vh',
    transition: 'width 0.22s cubic-bezier(.4,0,.2,1)',
    overflow: 'hidden',
    flexShrink: 0,
    boxShadow: '4px 0 28px rgba(0,0,0,0.22)',
    zIndex: 10,
  },

  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '22px 16px 18px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  brandIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    background: 'linear-gradient(135deg, #2563EB, #3B82F6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 4px 14px rgba(37,99,235,0.45)',
  },
  brandInitials: {
    color: '#fff',
    fontWeight: 800,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  brandName: {
    color: '#F0F6FF',
    fontWeight: 800,
    fontSize: 15,
    whiteSpace: 'nowrap',
    letterSpacing: -0.3,
  },
  brandSub: {
    color: '#2E4D66',
    fontSize: 9.5,
    fontWeight: 700,
    whiteSpace: 'nowrap',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  navSection: {
    color: '#1E3D55',
    fontSize: 9.5,
    fontWeight: 700,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    padding: '16px 20px 6px',
  },

  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    padding: '4px 10px',
  },

  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 10,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#6A93B0',
    width: '100%',
    textAlign: 'left',
    transition: 'all 0.15s ease',
    position: 'relative',
    fontFamily: "'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif",
  },
  navItemActive: {
    background: 'rgba(37,99,235,0.18)',
    color: '#E8F3FF',
    boxShadow: 'inset 0 0 0 1px rgba(59,130,246,0.2)',
  },
  activePill: {
    position: 'absolute',
    left: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 3,
    height: 20,
    borderRadius: '0 3px 3px 0',
    background: 'linear-gradient(180deg, #60A5FA, #2563EB)',
  },
  navIcon: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    transition: 'opacity 0.15s',
  },
  navLabel: {
    fontSize: 13.5,
    whiteSpace: 'nowrap',
    letterSpacing: -0.1,
  },

  divider: {
    height: 1,
    background: 'rgba(255,255,255,0.05)',
    margin: '0 12px',
  },

  collapseBtn: {
    display: 'flex',
    alignItems: 'center',
    margin: '4px 10px 10px',
    padding: '8px 12px',
    borderRadius: 10,
    background: 'transparent',
    border: 'none',
    color: '#1E3D55',
    cursor: 'pointer',
    fontWeight: 600,
    transition: 'all 0.15s',
    width: 'calc(100% - 20px)',
    fontFamily: "'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif",
  },

  userRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '2px 4px 10px',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #2563EB, #3B82F6)',
    color: '#fff',
    fontWeight: 800,
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 2px 10px rgba(37,99,235,0.35)',
  },
  userMeta: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
  },
  userName: {
    color: '#C8DFF0',
    fontSize: 13,
    fontWeight: 700,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    letterSpacing: -0.2,
  },
  userRole: {
    color: '#1E3D55',
    fontSize: 9.5,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '9px 12px',
    borderRadius: 10,
    background: 'rgba(220,38,38,0.09)',
    border: '1px solid rgba(220,38,38,0.14)',
    color: '#F87171',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    width: '100%',
    transition: 'background 0.15s',
    letterSpacing: -0.1,
    fontFamily: "'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif",
  },

  main: {
    flex: 1,
    overflow: 'auto',
    minWidth: 0,
    background: '#EEF2F7',
  },
};
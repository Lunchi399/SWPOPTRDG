import { useEffect, useState } from 'react';
import Layout from '../../components/admin/Layout';
import { getDashboard } from '../../services/adminService';

// ── ÍCONOS ─────────────────────────────────────────────────────────
const ICONS = {
  usuarios: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  productos: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  mesas: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="4" rx="1"/>
      <line x1="7" y1="12" x2="7" y2="20"/><line x1="17" y1="12" x2="17" y2="20"/>
      <line x1="5" y1="20" x2="9" y2="20"/><line x1="15" y1="20" x2="19" y2="20"/>
    </svg>
  ),
  pedidos: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  ),
  caja: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  reclamos: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      <line x1="9" y1="10" x2="15" y2="10"/><line x1="9" y1="14" x2="13" y2="14"/>
    </svg>
  ),
  calendario: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
};

// ── TARJETA PRINCIPAL ──────────────────────────────────────────────
function StatCard({ titulo, icono, acento, bgIcono, children }) {
  return (
    <div style={{ ...s.card, borderTop: `3px solid ${acento}` }}>
      <div style={s.cardHeader}>
        <div style={{ ...s.cardIcono, background: bgIcono, color: acento }}>
          {icono}
        </div>
        <h3 style={{ ...s.cardTitulo, color: acento }}>{titulo}</h3>
      </div>
      <div style={s.cardRows}>{children}</div>
    </div>
  );
}

// ── FILA DE DATO ───────────────────────────────────────────────────
function DataRow({ label, value, highlight = false }) {
  return (
    <div style={s.dataRow}>
      <span style={s.dataLabel}>{label}</span>
      <span style={{ ...s.dataValue, ...(highlight ? s.dataValueHL : {}) }}>
        {value ?? '—'}
      </span>
    </div>
  );
}

// ── LOADING SKELETON ───────────────────────────────────────────────
function Skeleton() {
  return (
    <Layout>
      <div style={s.page}>
        <div style={s.pageHeader}>
          <div style={{ ...s.skel, width: 160, height: 32, borderRadius: 8 }} />
          <div style={{ ...s.skel, width: 120, height: 24, borderRadius: 6 }} />
        </div>
        <div style={s.grid}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ ...s.card, borderTop: '3px solid #E2E8F0', padding: '20px' }}>
              <div style={{ ...s.skel, width: '60%', height: 16, borderRadius: 4, marginBottom: 16 }} />
              {[...Array(3)].map((_, j) => (
                <div key={j} style={{ ...s.skel, width: '100%', height: 12, borderRadius: 4, marginBottom: 10 }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

// ── PÁGINA PRINCIPAL ───────────────────────────────────────────────
export default function Dashboard() {
  const [data, setData]   = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboard()
      .then(r => setData(r.data))
      .catch(() => setError('No se pudo conectar con el servidor. Verifica que el backend esté activo.'));
  }, []);

  if (!data && !error) return <Skeleton />;

  return (
    <Layout>
      <div style={s.page}>

        {/* HEADER */}
        <div style={s.pageHeader}>
          <div>
            <h1 style={s.titulo}>Dashboard</h1>
            <p style={s.subtitulo}>Resumen general del sistema</p>
          </div>
          {data?.fecha && (
            <div style={s.fechaBadge}>
              {ICONS.calendario}
              <span>{data.fecha}</span>
            </div>
          )}
        </div>

        {/* ERROR */}
        {error && (
          <div style={s.errorBanner}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {/* GRID DE TARJETAS */}
        {data && (
          <div style={s.grid}>

            {/* Usuarios */}
            <StatCard titulo="Usuarios" icono={ICONS.usuarios} acento="#5B21B6" bgIcono="#EDE9FE">
              <DataRow label="Total"           value={data.usuarios?.total}           highlight />
              <DataRow label="Administradores" value={data.usuarios?.administradores} />
              <DataRow label="Meseros"         value={data.usuarios?.meseros}         />
              <DataRow label="Cocineros"       value={data.usuarios?.cocineros}       />
              <DataRow label="Cajeros"         value={data.usuarios?.cajeros}         />
            </StatCard>

            {/* Productos */}
            <StatCard titulo="Productos" icono={ICONS.productos} acento="#0F6E56" bgIcono="#D1FAE5">
              <DataRow label="Total"        value={data.productos?.total}                        highlight />
              <DataRow label="Disponibles"  value={data.productos?.disponibles}                  />
              <DataRow label="Entradas"     value={data.productos?.por_categoria?.entradas}      />
              <DataRow label="Segundos"     value={data.productos?.por_categoria?.segundos}      />
              <DataRow label="Bebidas"      value={data.productos?.por_categoria?.bebidas}       />
            </StatCard>

            {/* Mesas */}
            <StatCard titulo="Mesas" icono={ICONS.mesas} acento="#92400E" bgIcono="#FEF3C7">
              <DataRow label="Total"    value={data.mesas?.total}    highlight />
              <DataRow label="Libres"   value={data.mesas?.libres}   />
              <DataRow label="Ocupadas" value={data.mesas?.ocupadas} />
            </StatCard>

            {/* Pedidos */}
            <StatCard titulo="Pedidos activos" icono={ICONS.pedidos} acento="#1D4ED8" bgIcono="#DBEAFE">
              <DataRow label="Total"       value={data.pedidos?.total}       highlight />
              <DataRow label="En cocina"   value={data.pedidos?.en_cocina}   />
              <DataRow label="Listos"      value={data.pedidos?.listos}      />
              <DataRow label="Despachados" value={data.pedidos?.despachados} />
            </StatCard>

            {/* Caja */}
            <StatCard titulo="Caja hoy" icono={ICONS.caja} acento="#993C1D" bgIcono="#FEE2E2">
              <DataRow label="Transacciones" value={data.pagos?.total_hoy} highlight />
            </StatCard>

            {/* Reclamos */}
            <StatCard titulo="Reclamos" icono={ICONS.reclamos} acento="#3B6D11" bgIcono="#DCFCE7">
              <DataRow label="Pendientes" value={data.reclamos?.pendientes} highlight />
            </StatCard>

          </div>
        )}
      </div>
    </Layout>
  );
}

// ── ESTILOS ────────────────────────────────────────────────────────
const s = {
  page: {
    padding: '28px 32px',
    maxWidth: 1100,
    margin: '0 auto',
    fontFamily: "'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif",
  },
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  titulo: {
    fontSize: 26,
    fontWeight: 800,
    color: '#0F1E2E',
    margin: 0,
    letterSpacing: -0.5,
  },
  subtitulo: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 4,
  },
  fechaBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    background: '#fff',
    border: '1px solid #E2E8F0',
    borderRadius: 20,
    padding: '6px 14px',
    fontSize: 13,
    fontWeight: 600,
    color: '#475569',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    color: '#991B1B',
    borderRadius: 10,
    padding: '12px 16px',
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 24,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 16,
  },
  card: {
    background: '#fff',
    borderRadius: 12,
    padding: '18px 20px',
    boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
    transition: 'box-shadow 0.2s',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  cardIcono: {
    width: 38,
    height: 38,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardTitulo: {
    margin: 0,
    fontSize: 13,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  cardRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
  dataRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '7px 0',
    borderBottom: '1px solid #F8FAFC',
  },
  dataLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: 500,
  },
  dataValue: {
    fontSize: 15,
    fontWeight: 700,
    color: '#1E293B',
  },
  dataValueHL: {
    fontSize: 20,
    fontWeight: 800,
    color: '#0F1E2E',
  },
  // Skeleton
  skel: {
    background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.4s infinite',
  },
};
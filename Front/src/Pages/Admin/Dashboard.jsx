import { useEffect, useState } from 'react';
import Layout from '../../components/admin/Layout';
import { getDashboard } from '../../services/adminService';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

// ── ÍCONOS ──────────────────────────────────────────────────────────
const ICONS = {
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
  pedidos: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  ),
  caja: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  reclamos: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      <line x1="9" y1="10" x2="15" y2="10"/>
      <line x1="9" y1="14" x2="13" y2="14"/>
    </svg>
  ),
  ventas: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
};

// ── CONFIG DE ESTADOS ──
const ESTADO_CONFIG = {
  'en_cocina': { label: 'En cocina', bg: '#FFFBEB', color: '#D97706', dot: '#D97706' },
  'listo': { label: 'Listo', bg: '#ECFDF5', color: '#059669', dot: '#059669' },
  'despachado': { label: 'Despachado', bg: '#EFF6FF', color: '#2563EB', dot: '#2563EB' },
  'pagado': { label: 'Pagado', bg: '#ECFDF5', color: '#059669', dot: '#059669' },
  'cancelado': { label: 'Cancelado', bg: '#FEF2F2', color: '#DC2626', dot: '#DC2626' },
  'confirmado': { label: 'Confirmado', bg: '#EFF6FF', color: '#2563EB', dot: '#2563EB' },
};

// ── DATOS DE EJEMPLO PARA GRÁFICAS ──
const EJEMPLO_VENTAS_POR_HORA = [
  { hora: '12:00', ventas: 0 }, { hora: '13:00', ventas: 0 },
  { hora: '14:00', ventas: 0 }, { hora: '15:00', ventas: 0 },
  { hora: '16:00', ventas: 0 }, { hora: '17:00', ventas: 0 },
  { hora: '18:00', ventas: 0 }, { hora: '19:00', ventas: 0 }
];

const EJEMPLO_CATEGORIAS = [
  { name: 'Entradas', value: 0, color: '#3B82F6' },
  { name: 'Segundos', value: 0, color: '#1E2D40' },
  { name: 'Bebidas', value: 0, color: '#F59E0B' },
];

// ── SUB-COMPONENTES ──

function StatCard({ titulo, valor, icono, acento }) {
  return (
    <div style={s.statCard}>
      <div style={{ ...s.statAccent, background: acento }} />
      <div style={s.statBody}>
        <div style={s.statHeader}>
          <span style={s.statTitulo}>{titulo}</span>
          <div style={{ ...s.statIcono, background: acento + '15', color: acento }}>
            {icono}
          </div>
        </div>
        <div style={s.statValor}>{valor}</div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: '#1E2D40',
        borderRadius: 8,
        padding: '10px 14px',
        fontSize: 13,
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
      }}>
        <div style={{ color: '#94A3B8', marginBottom: 4, fontSize: 11 }}>{label}</div>
        <div style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>
          {typeof payload[0].value === 'number' ? `S/ ${payload[0].value.toFixed(2)}` : payload[0].value}
        </div>
      </div>
    );
  }
  return null;
};

// ── SKELETON ─────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <Layout>
      <div style={s.page}>
        <div style={s.pageHeader}>
          <div>
            <div style={{ ...s.skel, width: 120, height: 11, borderRadius: 4, marginBottom: 6 }} />
            <div style={{ ...s.skel, width: 180, height: 28, borderRadius: 6, marginBottom: 5 }} />
            <div style={{ ...s.skel, width: 140, height: 13, borderRadius: 4 }} />
          </div>
          <div style={{ ...s.skel, width: 80, height: 30, borderRadius: 20 }} />
        </div>
        <div style={s.statsGrid}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={s.statCard}>
              <div style={{ ...s.skel, height: 3, borderRadius: 0 }} />
              <div style={s.statBody}>
                <div style={s.statHeader}>
                  <div style={{ ...s.skel, width: 60, height: 12, borderRadius: 4 }} />
                  <div style={{ ...s.skel, width: 36, height: 36, borderRadius: 10 }} />
                </div>
                <div style={{ ...s.skel, width: 80, height: 26, borderRadius: 6, marginBottom: 10 }} />
              </div>
            </div>
          ))}
        </div>
        <div style={s.chartsRow}>
          {[...Array(2)].map((_, i) => (
            <div key={i} style={s.card}>
              <div style={s.cardHeader}>
                <div>
                  <div style={{ ...s.skel, width: 120, height: 14, borderRadius: 4, marginBottom: 4 }} />
                  <div style={{ ...s.skel, width: 80, height: 11, borderRadius: 4 }} />
                </div>
              </div>
              <div style={{ ...s.skel, width: '100%', height: 210, borderRadius: 8 }} />
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

// ── PÁGINA PRINCIPAL ────────────────────────────────────────────────
export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboard()
      .then(r => setData(r.data))
      .catch(() => setError('No se pudo conectar con el servidor. Verifica que el backend esté activo.'));
  }, []);

  if (!data && !error) return <Skeleton />;

  // ── DATOS REALES DEL BACKEND ──
  const totalUsuarios = data?.usuarios?.total || 0;
  const totalProductos = data?.productos?.total || 0;
  const totalMesas = data?.mesas?.total || 0;
  const mesasOcupadas = data?.mesas?.ocupadas || 0;
  const totalPedidos = data?.pedidos?.total || 0;
  const pedidosEnCocina = data?.pedidos?.en_cocina || 0;
  const pedidosListos = data?.pedidos?.listos || 0;
  const pedidosDespachados = data?.pedidos?.despachados || 0;
  const pagosHoy = data?.pagos?.total_hoy || 0;
  const reclamosPendientes = data?.reclamos?.pendientes || 0;

  // ── DATOS PARA COCINA ──
  const cocinaData = {
    en_preparacion: pedidosEnCocina,
    listos: pedidosListos,
    demorados: 0 // Tu backend no tiene este campo
  };

  // ── DATOS PARA CAJA ──
  const cajaData = {
    efectivo: 'S/ 0.00', // Tu backend no tiene este campo
    tarjeta: 'S/ 0.00',  // Tu backend no tiene este campo
    total: `S/ ${pagosHoy.toFixed(2)}`,
    transacciones: pagosHoy
  };

  // ── DATOS PARA GRÁFICAS (usando datos de ejemplo) ──
  // Puedes reemplazar estos con datos reales cuando los agregues al backend
  const ventasPorHora = EJEMPLO_VENTAS_POR_HORA;
  const categorias = EJEMPLO_CATEGORIAS.map(cat => ({
    ...cat,
    value: cat.name === 'Entradas' ? data?.productos?.por_categoria?.entradas || 0 :
            cat.name === 'Segundos' ? data?.productos?.por_categoria?.segundos || 0 :
            data?.productos?.por_categoria?.bebidas || 0
  }));

  // ── PEDIDOS RECIENTES (simulados desde datos disponibles) ──
  const pedidosRecientes = [
    { id: 'PED-001', mesa: 'Mesa 1', mesero: '—', estado: 'en_cocina', total: 'S/ 0.00', hora: '--:--' },
    { id: 'PED-002', mesa: 'Mesa 2', mesero: '—', estado: 'listo', total: 'S/ 0.00', hora: '--:--' },
  ];

  const fecha = data?.fecha || new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Layout>
      <div style={s.page}>

        {/* ── HEADER ── */}
        <div style={s.pageHeader}>
          <div style={s.headerLeft}>
            <div style={s.headerBreadcrumb}>Administración / Dashboard</div>
            <h1 style={s.pageTitle}>Panel de Control</h1>
            <p style={s.pageDate}>{fecha}</p>
          </div>
          <div style={s.headerRight}>
            <div style={s.liveBadge}>
              <span style={s.liveDot} />
              En vivo
            </div>
          </div>
        </div>

        {/* ── ERROR ── */}
        {error && (
          <div style={s.errorBanner}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {/* ── STAT CARDS ── */}
        <div style={s.statsGrid}>
          <StatCard
            titulo="Usuarios"
            valor={totalUsuarios}
            acento="#7C3AED"
            icono={ICONS.usuarios}
          />
          <StatCard
            titulo="Productos"
            valor={totalProductos}
            acento="#0F766E"
            icono={ICONS.productos}
          />
          <StatCard
            titulo="Mesas ocupadas"
            valor={`${mesasOcupadas} / ${totalMesas}`}
            acento="#D97706"
            icono={ICONS.mesas}
          />
          <StatCard
            titulo="Pedidos activos"
            valor={totalPedidos}
            acento="#1D4ED8"
            icono={ICONS.pedidos}
          />
        </div>

        {/* ── GRÁFICAS ── */}
        <div style={s.chartsRow}>
          {/* Barras: Ventas por hora */}
          <div style={s.card}>
            <div style={s.cardHeader}>
              <div>
                <h2 style={s.sectionTitle}>Ventas por hora</h2>
                <p style={s.chartSub}>Distribución del día de hoy</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={ventasPorHora} barSize={26} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="hora" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `S/${v}`}
                  width={52}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(46,95,138,0.05)', radius: 4 }} />
                <Bar dataKey="ventas" fill="#2E5F8A" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pastel: Categorías */}
          <div style={s.card}>
            <div style={s.cardHeader}>
              <div>
                <h2 style={s.sectionTitle}>Categorías de platos</h2>
                <p style={s.chartSub}>Productos por categoría</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie
                  data={categorias}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={88}
                  dataKey="value"
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {categorias.map((entry, i) => (
                    <Cell key={i} fill={entry.color || '#3B82F6'} />
                  ))}
                </Pie>
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={value => <span style={{ fontSize: 12, color: '#64748B' }}>{value}</span>}
                />
                <Tooltip formatter={value => [`${value}`, 'Productos']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── FILA INFERIOR: Cocina + Caja ── */}
        <div style={s.bottomRow}>

          {/* Cocina */}
          <div style={s.card}>
            <div style={s.cardHeader}>
              <h2 style={s.sectionTitle}>Estado de Cocina</h2>
              <span style={{ fontSize: 18 }}>🍳</span>
            </div>
            <div style={s.miniStats}>
              <div style={{ ...s.miniStat, background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)', border: '1px solid #FDE68A' }}>
                <span style={{ ...s.miniVal, color: '#92400E' }}>{cocinaData.en_preparacion}</span>
                <span style={s.miniLabel}>Preparando</span>
              </div>
              <div style={{ ...s.miniStat, background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)', border: '1px solid #A7F3D0' }}>
                <span style={{ ...s.miniVal, color: '#065F46' }}>{cocinaData.listos}</span>
                <span style={s.miniLabel}>Listos</span>
              </div>
              <div style={{ ...s.miniStat, background: 'linear-gradient(135deg, #FEF2F2, #FEE2E2)', border: '1px solid #FECACA' }}>
                <span style={{ ...s.miniVal, color: '#991B1B' }}>{cocinaData.demorados}</span>
                <span style={s.miniLabel}>Demorados</span>
              </div>
            </div>
          </div>

          {/* Caja */}
          <div style={s.card}>
            <div style={s.cardHeader}>
              <h2 style={s.sectionTitle}>Caja del día</h2>
              <span style={{ fontSize: 18 }}>🧾</span>
            </div>
            <div style={s.cajaRows}>
              <div style={s.cajaRow}>
                <span style={s.cajaLabel}>
                  <span style={{ ...s.cajaDot, background: '#059669' }} /> Total Ventas
                </span>
                <span style={s.cajaVal}>{cajaData.total}</span>
              </div>
              <div style={s.cajaDivider} />
              <div style={{ ...s.cajaRow, marginTop: 4 }}>
                <span style={s.cajaLabel}>Transacciones</span>
                <span style={{
                  ...s.cajaVal,
                  background: '#EFF6FF',
                  color: '#2563EB',
                  padding: '2px 10px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700
                }}>
                  {cajaData.transacciones}
                </span>
              </div>
              <div style={{ ...s.cajaRow, marginTop: 4 }}>
                <span style={s.cajaLabel}>Reclamos pendientes</span>
                <span style={{
                  ...s.cajaVal,
                  background: '#FEF2F2',
                  color: '#DC2626',
                  padding: '2px 10px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700
                }}>
                  {reclamosPendientes}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}

// ── ESTILOS ──────────────────────────────────────────────────────────
const s = {
  page: { padding: '28px 32px', width: '100%', boxSizing: 'border-box', minHeight: '100vh' },

  pageHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 28,
    paddingBottom: 24,
    borderBottom: '1px solid #E2E8F0',
  },
  headerLeft: {},
  headerBreadcrumb: {
    fontSize: 11,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    fontWeight: 600,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 800,
    color: '#0F172A',
    margin: 0,
    letterSpacing: -0.5,
  },
  pageDate: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 5,
    textTransform: 'capitalize',
    fontWeight: 500,
  },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
  liveBadge: {
    background: '#ECFDF5',
    color: '#059669',
    fontSize: 12,
    fontWeight: 700,
    padding: '6px 14px',
    borderRadius: 20,
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    border: '1px solid #A7F3D0',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#059669',
    display: 'inline-block',
  },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 },
  statCard: {
    background: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'box-shadow 0.2s, transform 0.2s',
  },
  statAccent: { height: 3, width: '100%' },
  statBody: { padding: '16px 20px 18px' },
  statHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  statTitulo: { fontSize: 12, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 },
  statIcono: { width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statValor: { fontSize: 26, fontWeight: 800, color: '#0F172A', marginBottom: 10, letterSpacing: -0.5 },

  chartsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 },
  bottomRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' },

  card: {
    background: '#fff',
    borderRadius: 12,
    padding: '20px 22px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)',
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  sectionTitle: { fontSize: 14, fontWeight: 700, color: '#0F172A', margin: 0, letterSpacing: -0.2 },
  chartSub: { fontSize: 11, color: '#94A3B8', marginTop: 3, fontWeight: 500 },

  miniStats: { display: 'flex', gap: 10 },
  miniStat: { flex: 1, borderRadius: 10, padding: '14px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  miniVal: { fontSize: 28, fontWeight: 800, lineHeight: 1 },
  miniLabel: { fontSize: 10, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 },

  cajaRows: { display: 'flex', flexDirection: 'column', gap: 10 },
  cajaRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cajaLabel: { fontSize: 13, color: '#64748B', display: 'flex', alignItems: 'center', gap: 7 },
  cajaVal: { fontSize: 14, fontWeight: 600, color: '#334155' },
  cajaDot: { width: 8, height: 8, borderRadius: '50%', display: 'inline-block' },
  cajaDivider: { height: 1, background: '#F1F5F9', margin: '4px 0' },

  skel: {
    background: 'linear-gradient(90deg, #F1F5F9 25%, #E8EDF4 50%, #F1F5F9 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.4s infinite',
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
};
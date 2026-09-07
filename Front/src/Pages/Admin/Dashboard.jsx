import { useEffect, useState } from 'react';
import Layout from '../../Components/Admin/Layout';
import { getDashboard, getEstadisticas } from '../../Services/adminService';
import { COLORS, SHADOW, RADIUS } from '../../token';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend
} from 'recharts';

const C = COLORS;

// ── Componentes reutilizables ──────────────────────────────────
function MetricCard({ icon, label, value, sub, color, trend }) {
  return (
    <div style={{
      ...s.metricCard,
      borderTop: `3px solid ${color}`,
    }}>
      <div style={s.metricTop}>
        <div style={{ ...s.metricIcon, background: color + '18',
                       color }}>
          {icon}
        </div>
        {trend !== undefined && (
          <span style={{
            fontSize:11, fontWeight:600, padding:'2px 8px',
            borderRadius:RADIUS.full,
            background: trend >= 0 ? '#ECFDF5' : '#FEF2F2',
            color:      trend >= 0 ? '#059669' : '#DC2626',
          }}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div style={s.metricValue}>{value}</div>
      <div style={s.metricLabel}>{label}</div>
      {sub && <div style={s.metricSub}>{sub}</div>}
    </div>
  );
}

function SectionCard({ titulo, children, action }) {
  return (
    <div style={s.sectionCard}>
      <div style={s.sectionHeader}>
        <h3 style={s.sectionTitle}>{titulo}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

// Tooltip personalizado para gráficos
function CustomTooltip({ active, payload, label, prefix = 'S/.' }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={s.tooltip}>
      <div style={s.tooltipLabel}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontSize:13,
                               fontWeight:600 }}>
          {prefix} {typeof p.value === 'number'
            ? p.value.toFixed(2) : p.value}
        </div>
      ))}
    </div>
  );
}

// ── Dashboard principal ────────────────────────────────────────
export default function Dashboard() {
  const [data,   setData]   = useState(null);
  const [stats,  setStats]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [hora,   setHora]   = useState(new Date().toLocaleTimeString('es-PE'));

  useEffect(() => {
    Promise.all([getDashboard(), getEstadisticas()])
      .then(([d, e]) => {
        setData(d.data);
        setStats(e.data);
      })
      .finally(() => setLoading(false));

    // Actualizar hora
    const iv = setInterval(() => {
      setHora(new Date().toLocaleTimeString('es-PE'));
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const recargar = () => {
    setLoading(true);
    Promise.all([getDashboard(), getEstadisticas()])
      .then(([d, e]) => { setData(d.data); setStats(e.data); })
      .finally(() => setLoading(false));
  };

  if (loading) return (
    <Layout>
      <div style={s.loadingWrap}>
        <div style={s.loadingSpinner} />
        <div style={s.loadingText}>Cargando dashboard...</div>
      </div>
    </Layout>
  );

  // Colores para gráfico de métodos de pago
  const METODO_COLORS = {
    efectivo: '#10B981',
    yape:     '#6366F1',
    plin:     '#3B82F6',
    tarjeta:  '#F59E0B',
  };

  // Colores para estados de pedidos
  const ESTADO_COLORS = {
    confirmado: '#6366F1',
    en_cocina:  '#F59E0B',
    listo:      '#10B981',
    despachado: '#3B82F6',
    pagado:     '#059669',
    cancelado:  '#EF4444',
  };

  const m = stats?.metricas || {};

  return (
    <Layout>
      <div style={s.page}>

        {/* ── Header ── */}
        <div style={s.pageHeader}>
          <div>
            <h1 style={s.pageTitle}>Dashboard</h1>
            <p style={s.pageSubtitle}>
              {new Date().toLocaleDateString('es-PE', {
                weekday:'long', day:'numeric',
                month:'long', year:'numeric'
              })} · {hora}
            </p>
          </div>
          <button style={s.recargarBtn} onClick={recargar}>
            ↻ Actualizar
          </button>
        </div>

        {/* ── Métricas rápidas ── */}
        <div style={s.metricsGrid}>
          <MetricCard
            icon="💰" label="Ventas hoy"
            value={`S/. ${m.total_ventas_hoy?.toFixed(2) || '0.00'}`}
            sub={`${m.transacciones_hoy || 0} transacciones`}
            color={C.caja.primary}
          />
          <MetricCard
            icon="📋" label="Pedidos hoy"
            value={m.pedidos_hoy || 0}
            sub="Total del día"
            color={C.admin.primary}
          />
          <MetricCard
            icon="🪑" label="Mesas ocupadas"
            value={`${m.mesas_ocupadas || 0} / ${data?.mesas?.total || 0}`}
            sub="En este momento"
            color={C.mesero.primary}
          />
          <MetricCard
            icon="⚠️" label="Reclamos pendientes"
            value={m.reclamos_pendientes || 0}
            sub="Por revisar"
            color={C.cocina.primary}
          />
        </div>

        {/* ── Gráficos fila 1 ── */}
        <div style={s.chartsRow}>

          {/* Ventas últimos 7 días */}
          <SectionCard titulo="📈 Ventas — últimos 7 días"
            action={
              <span style={s.chartBadge}>
                S/. {stats?.ventas_7dias?.reduce(
                  (s, d) => s + d.total, 0
                ).toFixed(2)}
              </span>
            }>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={stats?.ventas_7dias || []}
                margin={{ top:10, right:10, left:0, bottom:0 }}>
                <defs>
                  <linearGradient id="gradVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366F1" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3"
                  stroke="#F0F0F5" vertical={false} />
                <XAxis dataKey="dia" tick={s.axisTick}
                  axisLine={false} tickLine={false} />
                <YAxis tick={s.axisTick} axisLine={false}
                  tickLine={false} width={55}
                  tickFormatter={v => `S/.${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="total"
                  stroke="#6366F1" strokeWidth={2.5}
                  fill="url(#gradVentas)" dot={{ fill:'#6366F1', r:4 }}
                  activeDot={{ r:6, strokeWidth:0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </SectionCard>

          {/* Ventas por método de pago */}
          <SectionCard titulo="💳 Métodos de pago hoy">
            {stats?.ventas_metodo?.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={stats.ventas_metodo}
                      dataKey="total" nameKey="metodo"
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={80}
                      paddingAngle={3}>
                      {stats.ventas_metodo.map((e, i) => (
                        <Cell key={i}
                          fill={METODO_COLORS[e.metodo] || '#6366F1'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={v => `S/. ${v.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={s.pieleyenda}>
                  {stats.ventas_metodo.map((m, i) => (
                    <div key={i} style={s.pieItem}>
                      <div style={{
                        ...s.pieDot,
                        background: METODO_COLORS[m.metodo] || '#6366F1'
                      }} />
                      <span style={s.pieLabel}>
                        {m.metodo.charAt(0).toUpperCase() + m.metodo.slice(1)}
                      </span>
                      <span style={s.pieVal}>S/. {m.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={s.emptyChart}>
                Sin ventas registradas hoy
              </div>
            )}
          </SectionCard>
        </div>

        {/* ── Gráficos fila 2 ── */}
        <div style={s.chartsRow}>

          {/* Pedidos por estado hoy */}
          <SectionCard titulo="📦 Pedidos por estado hoy">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={stats?.estados_pedidos?.filter(
                  e => e.cantidad > 0
                ) || []}
                margin={{ top:10, right:10, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3"
                  stroke="#F0F0F5" vertical={false} />
                <XAxis dataKey="estado" tick={s.axisTick}
                  axisLine={false} tickLine={false}
                  tickFormatter={v => v.replace('_',' ')} />
                <YAxis tick={s.axisTick} axisLine={false}
                  tickLine={false} width={30} allowDecimals={false} />
                <Tooltip
                  content={<CustomTooltip prefix="" />}
                  formatter={v => [v, 'Pedidos']} />
                <Bar dataKey="cantidad" radius={[6,6,0,0]}
                  maxBarSize={48}>
                  {(stats?.estados_pedidos || []).map((e, i) => (
                    <Cell key={i}
                      fill={ESTADO_COLORS[e.estado] || '#6366F1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>

          {/* Top productos */}
          <SectionCard titulo="🏆 Top 5 productos más vendidos hoy">
            {stats?.top_productos?.length > 0 ? (
              <div style={s.topLista}>
                {stats.top_productos.map((p, i) => {
                  const maxQ = stats.top_productos[0].cantidad;
                  const pct  = Math.round((p.cantidad / maxQ) * 100);
                  const colores = ['#6366F1','#10B981',
                                   '#F59E0B','#3B82F6','#EF4444'];
                  return (
                    <div key={i} style={s.topItem}>
                      <div style={s.topRank}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈'
                          : i === 2 ? '🥉' : `#${i+1}`}
                      </div>
                      <div style={s.topInfo}>
                        <div style={s.topNombre}>{p.nombre}</div>
                        <div style={s.topBarWrap}>
                          <div style={{
                            ...s.topBar,
                            width: `${pct}%`,
                            background: colores[i],
                          }} />
                        </div>
                      </div>
                      <div style={{ ...s.topQty,
                                     color: colores[i] }}>
                        {p.cantidad}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={s.emptyChart}>
                Sin ventas registradas hoy
              </div>
            )}
          </SectionCard>
        </div>

        {/* ── Fila 3: Estado general ── */}
        <div style={s.chartsRow3}>

          {/* Estado de mesas */}
          <SectionCard titulo="🪑 Estado de mesas">
            <div style={s.estadoGrid}>
              {[
                { label:'Libres',   val: data?.mesas?.libres   || 0,
                  color:'#10B981', bg:'#ECFDF5' },
                { label:'Ocupadas', val: data?.mesas?.ocupadas || 0,
                  color:'#EF4444', bg:'#FEF2F2' },
                { label:'Total',    val: data?.mesas?.total    || 0,
                  color:'#6366F1', bg:'#EEF2FF' },
              ].map((item, i) => (
                <div key={i} style={{ ...s.estadoCard,
                                       background:item.bg,
                                       borderColor:item.color+'30' }}>
                  <div style={{ fontSize:26, fontWeight:800,
                                 color:item.color }}>
                    {item.val}
                  </div>
                  <div style={{ fontSize:12, color:item.color,
                                 fontWeight:500 }}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Estado carta */}
          <SectionCard titulo="🍽️ Carta del día">
            <div style={s.estadoGrid}>
              {[
                { label:'Disponibles', val: data?.productos?.disponibles || 0,
                  color:'#10B981', bg:'#ECFDF5' },
                { label:'Entradas',    val: data?.productos?.por_categoria?.entradas || 0,
                  color:'#6366F1', bg:'#EEF2FF' },
                { label:'Segundos',    val: data?.productos?.por_categoria?.segundos || 0,
                  color:'#F59E0B', bg:'#FFFBEB' },
                { label:'Bebidas',     val: data?.productos?.por_categoria?.bebidas  || 0,
                  color:'#3B82F6', bg:'#EFF6FF' },
              ].map((item, i) => (
                <div key={i} style={{ ...s.estadoCard,
                                       background:item.bg,
                                       borderColor:item.color+'30' }}>
                  <div style={{ fontSize:24, fontWeight:800,
                                 color:item.color }}>
                    {item.val}
                  </div>
                  <div style={{ fontSize:12, color:item.color,
                                 fontWeight:500 }}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Accesos rápidos */}
          <SectionCard titulo="⚡ Accesos rápidos">
            <div style={s.accesosGrid}>
              {[
                { label:'Usuarios',  icon:'👥', path:'/admin/usuarios',
                  color:'#6366F1', bg:'#EEF2FF' },
                { label:'Productos', icon:'🍽️', path:'/admin/productos',
                  color:'#10B981', bg:'#ECFDF5' },
                { label:'Mesas',     icon:'🪑', path:'/admin/mesas',
                  color:'#F59E0B', bg:'#FFFBEB' },
                { label:'Reclamos',  icon:'📋', path:'/admin/reclamos',
                  color:'#EF4444', bg:'#FEF2F2' },
              ].map((a, i) => {
                const { useNavigate: _ } = { useNavigate: null };
                return (
                  <AccesoBtn key={i} {...a} />
                );
              })}
            </div>
          </SectionCard>
        </div>

      </div>
    </Layout>
  );
}

function AccesoBtn({ label, icon, path, color, bg }) {
  const navigate = useNavigate();
  return (
    <button style={{ ...s.accesoBtn, background:bg,
                      border:`1px solid ${color}20` }}
      onClick={() => navigate(path)}>
      <span style={{ fontSize:22 }}>{icon}</span>
      <span style={{ fontSize:12, fontWeight:600, color }}>
        {label}
      </span>
    </button>
  );
}

import { useNavigate } from 'react-router-dom';

const s = {
  page:        { maxWidth:1280, margin:'0 auto' },
  pageHeader:  { display:'flex', justifyContent:'space-between',
                 alignItems:'flex-start', marginBottom:'1.5rem' },
  pageTitle:   { fontSize:26, fontWeight:800, color:'#0F1628',
                 margin:0, letterSpacing:'-0.03em' },
  pageSubtitle:{ fontSize:13, color:C.textSecondary, marginTop:4,
                 textTransform:'capitalize' },
  recargarBtn: { padding:'8px 16px', borderRadius:RADIUS.md,
                 background:'#fff', border:'1px solid #E8EAF0',
                 color:'#6366F1', cursor:'pointer', fontSize:13,
                 fontWeight:600, boxShadow:SHADOW.sm,
                 transition:'all .15s' },
  loadingWrap: { display:'flex', flexDirection:'column',
                 alignItems:'center', justifyContent:'center',
                 height:'60vh', gap:16 },
  loadingSpinner:{ width:36, height:36, borderRadius:'50%',
                   border:'3px solid #EEF2FF',
                   borderTopColor:'#6366F1',
                   animation:'spin 0.8s linear infinite' },
  loadingText: { fontSize:14, color:C.textSecondary },

  // Métricas
  metricsGrid: { display:'grid',
                 gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',
                 gap:12, marginBottom:'1.25rem' },
  metricCard:  { background:'#fff', borderRadius:RADIUS.md,
                 padding:'1.125rem 1.25rem',
                 boxShadow:SHADOW.sm,
                 border:'1px solid #E8EAF0' },
  metricTop:   { display:'flex', justifyContent:'space-between',
                 alignItems:'center', marginBottom:12 },
  metricIcon:  { width:38, height:38, borderRadius:RADIUS.sm,
                 display:'flex', alignItems:'center',
                 justifyContent:'center', fontSize:18 },
  metricValue: { fontSize:28, fontWeight:800, color:'#0F1628',
                 letterSpacing:'-0.03em', lineHeight:1 },
  metricLabel: { fontSize:13, color:C.textSecondary,
                 fontWeight:500, marginTop:4 },
  metricSub:   { fontSize:11, color:C.textTertiary, marginTop:2 },

  // Sección cards
  chartsRow:   { display:'grid', gridTemplateColumns:'1.6fr 1fr',
                 gap:12, marginBottom:'1.25rem' },
  chartsRow3:  { display:'grid', gridTemplateColumns:'1fr 1fr 1fr',
                 gap:12, marginBottom:'1.25rem' },
  sectionCard: { background:'#fff', borderRadius:RADIUS.md,
                 padding:'1.125rem 1.25rem',
                 boxShadow:SHADOW.sm, border:'1px solid #E8EAF0' },
  sectionHeader:{ display:'flex', justifyContent:'space-between',
                  alignItems:'center', marginBottom:'1rem' },
  sectionTitle:{ fontSize:14, fontWeight:700, color:'#0F1628', margin:0 },
  chartBadge:  { fontSize:12, fontWeight:600, padding:'3px 10px',
                 borderRadius:RADIUS.full, background:'#EEF2FF',
                 color:'#6366F1' },

  // Tooltip
  tooltip:     { background:'#0F1628', borderRadius:RADIUS.sm,
                 padding:'8px 12px', border:'none',
                 boxShadow:SHADOW.lg },
  tooltipLabel:{ fontSize:11, color:'rgba(255,255,255,0.5)',
                 marginBottom:4 },

  // Axis
  axisTick:    { fontSize:11, fill:'#9CA3AF' },

  // Pie chart
  pieleyenda:  { display:'flex', flexDirection:'column',
                 gap:6, marginTop:8 },
  pieItem:     { display:'flex', alignItems:'center', gap:8 },
  pieDot:      { width:8, height:8, borderRadius:'50%', flexShrink:0 },
  pieLabel:    { fontSize:12, color:C.textSecondary, flex:1 },
  pieVal:      { fontSize:12, fontWeight:600, color:'#0F1628' },

  // Top productos
  topLista:    { display:'flex', flexDirection:'column', gap:10 },
  topItem:     { display:'flex', alignItems:'center', gap:10 },
  topRank:     { fontSize:14, width:28, textAlign:'center', flexShrink:0 },
  topInfo:     { flex:1 },
  topNombre:   { fontSize:13, fontWeight:500, color:'#0F1628',
                 marginBottom:4 },
  topBarWrap:  { height:6, background:'#F3F4F6', borderRadius:RADIUS.full,
                 overflow:'hidden' },
  topBar:      { height:'100%', borderRadius:RADIUS.full,
                 transition:'width .5s ease' },
  topQty:      { fontSize:14, fontWeight:700, minWidth:28,
                 textAlign:'right' },

  // Estado y carta
  estadoGrid:  { display:'grid',
                 gridTemplateColumns:'repeat(auto-fit,minmax(70px,1fr))',
                 gap:8 },
  estadoCard:  { borderRadius:RADIUS.md, padding:'14px 10px',
                 textAlign:'center', border:'1px solid' },

  // Accesos
  accesosGrid: { display:'grid', gridTemplateColumns:'1fr 1fr',
                 gap:8 },
  accesoBtn:   { padding:'14px 10px', borderRadius:RADIUS.md,
                 cursor:'pointer', display:'flex',
                 flexDirection:'column', alignItems:'center',
                 gap:6, transition:'all .15s' },

  // Empty
  emptyChart:  { textAlign:'center', color:C.textTertiary,
                 padding:'2rem', fontSize:13 },
};
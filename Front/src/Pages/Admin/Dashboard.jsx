import { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

// ── MOCK DATA ──
const MOCK_STATS = {
  ventas_hoy:       { valor: 'S/ 1,300.50', cambio: '+12% vs ayer', positivo: true },
  pedidos_hoy:      { valor: '34',           cambio: '+5 vs ayer',   positivo: true },
  mesas_ocupadas:   { valor: '6 / 12',       cambio: '50% ocupación', positivo: null },
  pedidos_anulados: { valor: '2',            cambio: '-1 vs ayer',   positivo: true },
};

const MOCK_PEDIDOS_RECIENTES = [
  { id:'PED-091', mesa:'Mesa 4', mesero:'Carlos R.', estado:'listo',       total:'S/ 68.00',  hora:'13:42' },
  { id:'PED-090', mesa:'Mesa 7', mesero:'Ana P.',    estado:'preparacion', total:'S/ 45.50',  hora:'13:38' },
  { id:'PED-089', mesa:'Mesa 2', mesero:'Luis M.',   estado:'pagado',      total:'S/ 112.00', hora:'13:10' },
  { id:'PED-088', mesa:'Mesa 9', mesero:'Carlos R.', estado:'anulado',     total:'S/ 32.00',  hora:'12:55' },
  { id:'PED-087', mesa:'Mesa 1', mesero:'Ana P.',    estado:'pagado',      total:'S/ 89.50',  hora:'12:30' },
];

const MOCK_COCINA = { en_preparacion: 3, listos: 5, demorados: 1 };
const MOCK_CAJA   = { efectivo:'S/ 780.00', tarjeta:'S/ 468.50', total:'S/ 1,248.50', transacciones: 18 };

const VENTAS_POR_HORA = [
  { hora:'12:00', ventas:0 }, { hora:'13:00', ventas:680 },
  { hora:'14:00', ventas:870 }, { hora:'15:00', ventas:590 },
  { hora:'16:00', ventas:510 }, { hora:'17:00', ventas:730 },
  { hora:'18:00', ventas:890 }, { hora:'19:00', ventas:980 },
];

const CATEGORIAS = [
  { name:'Entradas',       value:35, color:'#3B82F6' },
  { name:'Platos fuertes', value:40, color:'#1E2D40' },
  { name:'Postres',        value:12, color:'#F59E0B' },
  { name:'Bebidas',        value:13, color:'#94A3B8' },
];

const ESTADO_CONFIG = {
  listo:       { label:'Listo',     bg:'#ECFDF5', color:'#059669', dot:'#059669' },
  preparacion: { label:'En cocina', bg:'#FFFBEB', color:'#D97706', dot:'#D97706' },
  pagado:      { label:'Pagado',    bg:'#EFF6FF', color:'#2563EB', dot:'#2563EB' },
  anulado:     { label:'Anulado',   bg:'#FEF2F2', color:'#DC2626', dot:'#DC2626' },
};

// ── SUB-COMPONENTES ──

function StatCard({ titulo, valor, cambio, positivo, icono, acento }) {
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
        <div style={s.statFooter}>
          {cambio && (
            <span style={{ ...s.statCambio, color: positivo === true ? '#059669' : positivo === false ? '#DC2626' : '#94A3B8',
              background: positivo === true ? '#ECFDF5' : positivo === false ? '#FEF2F2' : '#F1F5F9' }}>
              {positivo === true ? '↑' : positivo === false ? '↓' : '—'} {cambio}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background:'#1E2D40', borderRadius:8, padding:'10px 14px', fontSize:13, boxShadow:'0 8px 24px rgba(0,0,0,0.2)' }}>
        <div style={{ color:'#94A3B8', marginBottom:4, fontSize:11 }}>{label}</div>
        <div style={{ fontWeight:700, color:'#fff', fontSize:15 }}>S/ {payload[0].value.toFixed(2)}</div>
      </div>
    );
  }
  return null;
};

// ── PÁGINA PRINCIPAL ──

export default function Dashboard() {
  const [fecha] = useState(() => {
    const d = new Date();
    return d.toLocaleDateString('es-PE', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  });

  return (
    <AdminLayout>
      <div style={s.page}>

        {/* HEADER */}
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

        {/* STAT CARDS */}
        <div style={s.statsGrid}>
          <StatCard titulo="Ventas del día" valor={MOCK_STATS.ventas_hoy.valor}
            cambio={MOCK_STATS.ventas_hoy.cambio} positivo={MOCK_STATS.ventas_hoy.positivo} acento="#2E5F8A"
            icono={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>} />
          <StatCard titulo="Pedidos hoy" valor={MOCK_STATS.pedidos_hoy.valor}
            cambio={MOCK_STATS.pedidos_hoy.cambio} positivo={MOCK_STATS.pedidos_hoy.positivo} acento="#059669"
            icono={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>} />
          <StatCard titulo="Mesas ocupadas" valor={MOCK_STATS.mesas_ocupadas.valor}
            cambio={MOCK_STATS.mesas_ocupadas.cambio} positivo={null} acento="#D97706"
            icono={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="8" width="18" height="4" rx="1"/><line x1="7" y1="12" x2="7" y2="20"/><line x1="17" y1="12" x2="17" y2="20"/></svg>} />
          <StatCard titulo="Pedidos anulados" valor={MOCK_STATS.pedidos_anulados.valor}
            cambio={MOCK_STATS.pedidos_anulados.cambio} positivo={MOCK_STATS.pedidos_anulados.positivo} acento="#DC2626"
            icono={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>} />
        </div>

        {/* GRÁFICAS — arriba */}
        <div style={s.chartsRow}>
          <div style={s.card}>
            <div style={s.cardHeader}>
              <div>
                <h2 style={s.sectionTitle}>Ventas por hora</h2>
                <p style={s.chartSub}>Distribución del día de hoy</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={VENTAS_POR_HORA} barSize={26} margin={{ top:4, right:8, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="hora" tick={{ fontSize:11, fill:'#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:11, fill:'#94A3B8' }} axisLine={false} tickLine={false}
                  tickFormatter={v => `S/${v}`} width={52} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill:'rgba(46,95,138,0.05)', radius:4 }} />
                <Bar dataKey="ventas" fill="#2E5F8A" radius={[5,5,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={s.card}>
            <div style={s.cardHeader}>
              <div>
                <h2 style={s.sectionTitle}>Categorías de platos</h2>
                <p style={s.chartSub}>Ventas por categoría</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={CATEGORIAS} cx="50%" cy="45%" innerRadius={55} outerRadius={88}
                  dataKey="value" paddingAngle={3} strokeWidth={0}>
                  {CATEGORIAS.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Legend iconType="circle" iconSize={8}
                  formatter={value => <span style={{ fontSize:12, color:'#64748B' }}>{value}</span>} />
                <Tooltip formatter={value => [`${value}%`, 'Participación']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* FILA INFERIOR: tabla + cocina/caja */}
        <div style={s.bottomRow}>

          {/* Tabla pedidos */}
          <div style={s.card}>
            <div style={s.cardHeader}>
              <div>
                <h2 style={s.sectionTitle}>Pedidos recientes</h2>
                <p style={s.chartSub}>Últimas transacciones del día</p>
              </div>
              <span style={s.verTodoBtn}>Ver todos →</span>
            </div>
            <table style={s.table}>
              <thead>
                <tr style={{ background:'#F8FAFC' }}>
                  {['ID','Mesa','Mesero','Hora','Total','Estado'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_PEDIDOS_RECIENTES.map((p) => {
                  const est = ESTADO_CONFIG[p.estado];
                  return (
                    <tr key={p.id} style={s.tr}>
                      <td style={s.td}><span style={s.pedidoId}>{p.id}</span></td>
                      <td style={s.td}><span style={s.mesaTag}>{p.mesa}</span></td>
                      <td style={s.td}>{p.mesero}</td>
                      <td style={{ ...s.td, color:'#94A3B8', fontFamily:'monospace', fontSize:12 }}>{p.hora}</td>
                      <td style={{ ...s.td, fontWeight:700, color:'#1E2D40' }}>{p.total}</td>
                      <td style={s.td}>
                        <span style={{ ...s.estadoBadge, background:est.bg, color:est.color }}>
                          <span style={{ width:6, height:6, borderRadius:'50%', background:est.dot, display:'inline-block', marginRight:5 }} />
                          {est.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Panel derecho */}
          <div style={s.rightCol}>

            {/* Cocina */}
            <div style={s.card}>
              <div style={s.cardHeader}>
                <h2 style={s.sectionTitle}>Cocina ahora</h2>
                <span style={{ fontSize:18 }}>🍳</span>
              </div>
              <div style={s.miniStats}>
                <div style={{ ...s.miniStat, background:'linear-gradient(135deg, #FFFBEB, #FEF3C7)', border:'1px solid #FDE68A' }}>
                  <span style={{ ...s.miniVal, color:'#92400E' }}>{MOCK_COCINA.en_preparacion}</span>
                  <span style={s.miniLabel}>Preparando</span>
                </div>
                <div style={{ ...s.miniStat, background:'linear-gradient(135deg, #ECFDF5, #D1FAE5)', border:'1px solid #A7F3D0' }}>
                  <span style={{ ...s.miniVal, color:'#065F46' }}>{MOCK_COCINA.listos}</span>
                  <span style={s.miniLabel}>Listos</span>
                </div>
                <div style={{ ...s.miniStat, background:'linear-gradient(135deg, #FEF2F2, #FEE2E2)', border:'1px solid #FECACA' }}>
                  <span style={{ ...s.miniVal, color:'#991B1B' }}>{MOCK_COCINA.demorados}</span>
                  <span style={s.miniLabel}>Demorados</span>
                </div>
              </div>
            </div>

            {/* Caja */}
            <div style={s.card}>
              <div style={s.cardHeader}>
                <h2 style={s.sectionTitle}>Caja del día</h2>
                <span style={{ fontSize:18 }}>🧾</span>
              </div>
              <div style={s.cajaRows}>
                <div style={s.cajaRow}>
                  <span style={s.cajaLabel}>
                    <span style={{ ...s.cajaDot, background:'#059669' }} /> Efectivo
                  </span>
                  <span style={s.cajaVal}>{MOCK_CAJA.efectivo}</span>
                </div>
                <div style={s.cajaRow}>
                  <span style={s.cajaLabel}>
                    <span style={{ ...s.cajaDot, background:'#2563EB' }} /> Tarjeta
                  </span>
                  <span style={s.cajaVal}>{MOCK_CAJA.tarjeta}</span>
                </div>
                <div style={s.cajaDivider} />
                <div style={{ ...s.cajaRow, padding:'10px 14px', background:'#F8FAFC', borderRadius:8, margin:'0 -2px' }}>
                  <span style={{ fontSize:13, fontWeight:700, color:'#1E2D40' }}>Total del día</span>
                  <span style={{ fontSize:17, fontWeight:800, color:'#1E2D40' }}>{MOCK_CAJA.total}</span>
                </div>
                <div style={{ ...s.cajaRow, marginTop:4 }}>
                  <span style={s.cajaLabel}>Transacciones</span>
                  <span style={{ ...s.cajaVal, background:'#EFF6FF', color:'#2563EB', padding:'2px 10px', borderRadius:20, fontSize:12, fontWeight:700 }}>
                    {MOCK_CAJA.transacciones}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

// ── ESTILOS ──
const s = {
  page: { padding:'28px 32px', width:'100%', boxSizing:'border-box', minHeight:'100vh' },

  pageHeader: {
    display:'flex', alignItems:'flex-start', justifyContent:'space-between',
    marginBottom:28, paddingBottom:24, borderBottom:'1px solid #E2E8F0',
  },
  headerLeft: {},
  headerBreadcrumb: { fontSize:11, color:'#94A3B8', textTransform:'uppercase', letterSpacing:0.8, marginBottom:6, fontWeight:600 },
  pageTitle: { fontSize:28, fontWeight:800, color:'#0F172A', margin:0, letterSpacing:-0.5 },
  pageDate:  { color:'#94A3B8', fontSize:13, marginTop:5, textTransform:'capitalize', fontWeight:500 },
  headerRight: { display:'flex', alignItems:'center', gap:12 },
  liveBadge: {
    background:'#ECFDF5', color:'#059669', fontSize:12, fontWeight:700,
    padding:'6px 14px', borderRadius:20, display:'flex', alignItems:'center', gap:7,
    border:'1px solid #A7F3D0',
  },
  liveDot: {
    width:7, height:7, borderRadius:'50%', background:'#059669', display:'inline-block',
  },

  statsGrid: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:20 },
  statCard: {
    background:'#fff', borderRadius:12, overflow:'hidden',
    boxShadow:'0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)',
    display:'flex', flexDirection:'column',
    transition:'box-shadow 0.2s, transform 0.2s',
  },
  statAccent: { height:3, width:'100%' },
  statBody: { padding:'16px 20px 18px' },
  statHeader: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 },
  statTitulo: { fontSize:12, color:'#64748B', fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 },
  statIcono:  { width:36, height:36, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' },
  statValor:  { fontSize:26, fontWeight:800, color:'#0F172A', marginBottom:10, letterSpacing:-0.5 },
  statFooter: {},
  statCambio: { fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:6, display:'inline-flex', alignItems:'center', gap:3 },

  chartsRow: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 },
  bottomRow:  { display:'grid', gridTemplateColumns:'1fr 300px', gap:20, alignItems:'start' },

  card: {
    background:'#fff', borderRadius:12, padding:'20px 22px',
    boxShadow:'0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)',
  },
  cardHeader: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:18 },
  sectionTitle: { fontSize:14, fontWeight:700, color:'#0F172A', margin:0, letterSpacing:-0.2 },
  chartSub:     { fontSize:11, color:'#94A3B8', marginTop:3, fontWeight:500 },
  verTodoBtn:   { fontSize:12, color:'#2E5F8A', fontWeight:600, cursor:'pointer' },

  rightCol: { display:'flex', flexDirection:'column', gap:20 },

  table: { width:'100%', borderCollapse:'collapse', fontSize:13 },
  th: {
    textAlign:'left', padding:'10px 14px',
    color:'#64748B', fontWeight:600, fontSize:11,
    textTransform:'uppercase', letterSpacing:0.5,
    borderBottom:'2px solid #F1F5F9',
  },
  tr: { borderBottom:'1px solid #F8FAFC', transition:'background 0.15s' },
  td: { padding:'12px 14px', color:'#334155', verticalAlign:'middle' },
  pedidoId: { fontWeight:700, color:'#2E5F8A', fontFamily:'monospace', fontSize:12, letterSpacing:0.5 },
  mesaTag: {
    background:'#F1F5F9', color:'#475569', fontSize:12,
    fontWeight:600, padding:'2px 8px', borderRadius:6,
  },
  estadoBadge: {
    padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:600,
    display:'inline-flex', alignItems:'center',
  },

  miniStats: { display:'flex', gap:10 },
  miniStat:  { flex:1, borderRadius:10, padding:'14px 8px', display:'flex', flexDirection:'column', alignItems:'center', gap:4 },
  miniVal:   { fontSize:28, fontWeight:800, lineHeight:1 },
  miniLabel: { fontSize:10, color:'#64748B', fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 },

  cajaRows:   { display:'flex', flexDirection:'column', gap:10 },
  cajaRow:    { display:'flex', justifyContent:'space-between', alignItems:'center' },
  cajaLabel:  { fontSize:13, color:'#64748B', display:'flex', alignItems:'center', gap:7 },
  cajaVal:    { fontSize:14, fontWeight:600, color:'#334155' },
  cajaDot:    { width:8, height:8, borderRadius:'50%', display:'inline-block' },
  cajaDivider:{ height:1, background:'#F1F5F9', margin:'4px 0' },
};
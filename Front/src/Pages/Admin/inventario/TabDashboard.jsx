import { useEffect, useState } from 'react';
import { getDashboardInsumos } from '../../../services/inventarioService';

export default function TabDashboard({ onAlertas }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  const cargar = () => {
    setLoading(true);
    getDashboardInsumos()
      .then(r => {
        setData(r.data);
        onAlertas(r.data.total_alertas || 0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  if (loading) return <div style={s.empty}>Cargando dashboard...</div>;
  if (!data)   return <div style={s.empty}>Error al cargar datos.</div>;

  const metricas = [
    { label:'Ingresado hoy',    val:data.total_ingresado,
      color:'#059669', bg:'#ECFDF5', icon:'📥' },
    { label:'Movido a uso',     val:data.total_movido,
      color:'#2563EB', bg:'#EFF6FF', icon:'🔄' },
    { label:'Utilizado',        val:data.total_utilizado,
      color:'#7C3AED', bg:'#F5F3FF', icon:'✅' },
    { label:'Desperdiciado',    val:data.total_desperdiciado,
      color:'#DC2626', bg:'#FEF2F2', icon:'🗑️' },
    { label:'Total insumos',    val:data.total_insumos,
      color:'#0F1628', bg:'#F9FAFB', icon:'📦' },
    { label:'En alerta',        val:data.total_alertas,
      color:'#B45309', bg:'#FFFBEB', icon:'⚠️' },
  ];

  return (
    <div>
      <div style={s.headerRow}>
        <h2 style={s.secTitle}>Resumen del día — {data.fecha}</h2>
        <button style={s.refreshBtn} onClick={cargar}>↻ Actualizar</button>
      </div>

      {/* Métricas */}
      <div style={s.grid4}>
        {metricas.map((m, i) => (
          <div key={i} style={{ ...s.metCard,
                                 background:m.bg,
                                 borderColor:m.color+'30' }}>
            <div style={{ fontSize:24 }}>{m.icon}</div>
            <div style={{ fontSize:24, fontWeight:800,
                           color:m.color }}>{m.val}</div>
            <div style={{ fontSize:12, color:m.color,
                           fontWeight:500 }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Alertas de stock */}
      {data.alertas_stock?.length > 0 && (
        <div style={s.alertaSection}>
          <h3 style={s.alertaTitle}>
            ⚠️ Insumos con stock bajo o en mínimo
          </h3>
          <div style={s.alertaGrid}>
            {data.alertas_stock.map(ins => (
              <div key={ins.id_insumo} style={s.alertaCard}>
                <div style={s.alertaNombre}>{ins.nombre}</div>
                <div style={s.alertaStock}>
                  Almacén: <strong>{ins.stock_almacen}</strong> {ins.unidad_medida}
                </div>
                <div style={s.alertaMin}>
                  Mínimo: {ins.stock_minimo} {ins.unidad_medida}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mermas del día */}
      {data.mermas_hoy?.length > 0 && (
        <div style={{ marginTop:'1.5rem' }}>
          <h3 style={s.secTitle}>Mermas registradas hoy</h3>
          <div style={s.mermaLista}>
            {data.mermas_hoy.map(m => (
              <div key={m.id_merma} style={s.mermaItem}>
                <span style={{ flex:1, fontSize:13 }}>
                  {m.insumo_nombre}
                </span>
                <span style={{ fontSize:13, color:'#6B7280' }}>
                  {m.cantidad} · {m.tipo_merma}
                </span>
                {m.motivo && (
                  <span style={{ fontSize:12, color:'#9CA3AF',
                                  fontStyle:'italic' }}>
                    — {m.motivo}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  empty:       { textAlign:'center', color:'#9CA3AF', padding:'3rem',
                 fontSize:14 },
  headerRow:   { display:'flex', justifyContent:'space-between',
                 alignItems:'center', marginBottom:'1rem' },
  secTitle:    { fontSize:15, fontWeight:700, color:'#0F1628', margin:0 },
  refreshBtn:  { padding:'7px 14px', borderRadius:'8px',
                 background:'#fff', border:'1px solid #E8EAF0',
                 color:'#6366F1', cursor:'pointer', fontSize:13 },
  grid4:       { display:'grid',
                 gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',
                 gap:10, marginBottom:'1.5rem' },
  metCard:     { borderRadius:'12px', padding:'16px',
                 border:'1px solid', textAlign:'center',
                 display:'flex', flexDirection:'column',
                 alignItems:'center', gap:6 },
  alertaSection:{ background:'#FFFBEB', borderRadius:'12px',
                  padding:'1rem 1.25rem', border:'1px solid #FCD34D',
                  marginBottom:'1rem' },
  alertaTitle: { fontSize:14, fontWeight:700, color:'#B45309',
                 margin:'0 0 10px' },
  alertaGrid:  { display:'grid',
                 gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',
                 gap:8 },
  alertaCard:  { background:'#fff', borderRadius:'8px',
                 padding:'10px 12px',
                 border:'1px solid #FCD34D' },
  alertaNombre:{ fontSize:13, fontWeight:600, color:'#0F1628',
                 marginBottom:4 },
  alertaStock: { fontSize:12, color:'#B45309' },
  alertaMin:   { fontSize:11, color:'#9CA3AF' },
  mermaLista:  { background:'#fff', borderRadius:'10px',
                 border:'1px solid #E8EAF0', overflow:'hidden' },
  mermaItem:   { display:'flex', alignItems:'center', gap:12,
                 padding:'10px 14px',
                 borderBottom:'1px solid #F3F4F6' },
};
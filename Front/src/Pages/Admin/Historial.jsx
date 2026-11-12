import { Fragment, useCallback, useEffect, useState } from 'react';
import Layout from '../../components/admin/Layout';
import { getHistorialGlobal } from '../../services/historialService';

const PAGE = 50;

const MODULOS = {
  todos:          { label:'Todos',              color:'#6366F1' },
  pedidos:        { label:'Pedidos',            color:'#D97706' },
  cocina:         { label:'Cocina',             color:'#EF4444' },
  pagos:          { label:'Pagos',              color:'#059669' },
  reclamos:       { label:'Reclamos',           color:'#DC2626' },
  movimientos:    { label:'Mov. de insumos',    color:'#2563EB' },
  pedidos_insumo: { label:'Compras de insumos', color:'#B45309' },
  mermas:         { label:'Mermas',             color:'#7C3AED' },
  turnos:         { label:'Turnos',             color:'#475569' },
};

const ETIQUETA = {
  almacen_a_utilizacion:'Almacén → uso', en_cocina:'En cocina',
  entrada:'Entrada', utilizado:'Utilizado', desperdiciado:'Desperdiciado',
};
const etiqueta = (e) =>
  ETIQUETA[e] || (e ? e.charAt(0).toUpperCase() + e.slice(1) : '');

const VERDE = ['pagado','completado','entregado','listo','despachado','resuelto','cerrado','entrada','utilizado'];
const AMBAR = ['pendiente','abierto','confirmado','en_cocina','revisado','sobrante','almacen_a_utilizacion'];
const ROJO  = ['cancelado','anulado','desperdicio','desperdiciado'];
const tonoEstado = (e) =>
  VERDE.includes(e) ? ['#DCFCE7', '#166534', '#10B981']
  : AMBAR.includes(e) ? ['#FEF3C7', '#92400E', '#F59E0B']
  : ROJO.includes(e)  ? ['#FEE2E2', '#B91C1C', '#EF4444']
  : ['#F3F4F6', '#4B5563', '#9CA3AF'];

const RAPIDOS = [['Hoy', 0], ['7 días', 6], ['30 días', 29], ['Todo', null]];
const fmt = (d) => d.toLocaleDateString('en-CA');       // YYYY-MM-DD en hora local

const svg = { width:18, height:18, viewBox:'0 0 24 24', fill:'none', stroke:'currentColor',
              strokeWidth:2, strokeLinecap:'round', strokeLinejoin:'round' };
const IconBuscar    = () => (<svg {...svg}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>);
const IconDescargar = () => (<svg {...svg}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>);

export default function Historial() {
  const [f, setF]             = useState({ modulo:'todos', desde:'', hasta:'', buscar:'' });
  const [page, setPage]       = useState(1);
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  const cambiar = (patch) => { setPage(1); setF(prev => ({ ...prev, ...patch })); };

  const armarParams = (extra = {}) => {
    const p = { modulo:f.modulo, ...extra };
    if (f.desde)  p.desde  = f.desde;
    if (f.hasta)  p.hasta  = f.hasta;
    if (f.buscar) p.buscar = f.buscar;
    return p;
  };

  const cargar = useCallback(() => {
    setLoading(true);
    getHistorialGlobal(armarParams({ page, page_size:PAGE }))
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
    // eslint-disable-next-line
  }, [f, page]);

  useEffect(() => {
    const t = setTimeout(cargar, 300);                  // debounce de la búsqueda
    return () => clearTimeout(t);
  }, [cargar]);

  const rapido = (dias) => {
    if (dias === null) return cambiar({ desde:'', hasta:'' });
    const hoy = new Date(), ini = new Date();
    ini.setDate(hoy.getDate() - dias);
    cambiar({ desde:fmt(ini), hasta:fmt(hoy) });
  };
  const rapidoActivo = (dias) => {
    if (dias === null) return !f.desde && !f.hasta;
    const hoy = new Date(), ini = new Date();
    ini.setDate(hoy.getDate() - dias);
    return f.desde === fmt(ini) && f.hasta === fmt(hoy);
  };

  const exportar = async () => {
    const r = await getHistorialGlobal(armarParams({ page:1, page_size:5000 }));
    const filas = [
      ['Fecha','Módulo','Título','Detalle','Usuario','Estado','Monto'],
      ...r.data.resultados.map(e => [
        new Date(e.fecha).toLocaleString('es-PE'),
        MODULOS[e.modulo]?.label || e.modulo,
        e.titulo, e.detalle, e.usuario, etiqueta(e.estado), e.monto ?? '',
      ]),
    ];
    const csv = '\uFEFF' + filas
      .map(fila => fila.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type:'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url; a.download = `historial_dongeorge_${fmt(new Date())}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  // Agrupar por día
  const grupos = [];
  (data?.resultados || []).forEach(e => {
    const dia = new Date(e.fecha).toLocaleDateString('es-PE',
      { weekday:'long', day:'numeric', month:'long', year:'numeric' });
    const ult = grupos[grupos.length - 1];
    if (ult && ult.dia === dia) ult.items.push(e);
    else grupos.push({ dia, items:[e] });
  });

  const resumen   = data?.resumen || {};
  const suma      = (...ks) => ks.reduce((a, k) => a + (resumen[k] || 0), 0);
  // 'cocina' es un subconjunto de 'pedidos': no se suma dos veces
  const totalTodo = Object.entries(resumen)
    .filter(([k]) => k !== 'cocina').reduce((a, [, v]) => a + v, 0);
  const truncado  = Object.values(resumen).some(n => n > (data?.limite_por_modulo || 1000));
  const hayErrores = data?.errores && Object.keys(data.errores).length > 0;

  const tarjetas = [
    { icono:'📊', valor:totalTodo,                                     label:'Total',      bg:'#EAF1FF', fg:'#1D4ED8' },
    { icono:'🍽️', valor:resumen.pedidos || 0,                          label:'Pedidos',    bg:'#FEF3D0', fg:'#92400E' },
    { icono:'💳', valor:resumen.pagos || 0,                            label:'Pagos',      bg:'#E8FAF1', fg:'#059669' },
    { icono:'📦', valor:suma('movimientos','pedidos_insumo','mermas'), label:'Inventario', bg:'#EEF0FF', fg:'#4338CA' },
  ];

  const ini = data ? (data.page - 1) * PAGE + 1 : 0;
  const fin = data ? Math.min(data.page * PAGE, data.total) : 0;

  return (
    <Layout>
      <div style={s.pagina}>

        {/* Encabezado */}
        <div style={s.header}>
          <div style={s.headerLeft}>
            <span style={s.icono}>🕘</span>
            <div>
              <h1 style={s.titulo}>Historial Global</h1>
              <p style={s.subtitulo}>{totalTodo} registros · todos los días y todos los módulos</p>
            </div>
          </div>
          <button style={s.btnPrimario} onClick={exportar}>
            <IconDescargar /> Exportar CSV
          </button>
        </div>

        {/* Tarjetas */}
        <div style={s.metricas}>
          {tarjetas.map(m => (
            <div key={m.label} style={{ ...s.metrica, background:m.bg }}>
              <span style={s.metricaIcono}>{m.icono}</span>
              <span style={{ ...s.metricaValor, color:m.fg }}>{m.valor}</span>
              <span style={{ ...s.metricaLabel, color:m.fg }}>{m.label}</span>
            </div>
          ))}
        </div>

        {/* Buscador */}
        <div style={s.barra}>
          <div style={s.buscador}>
            <IconBuscar />
            <input style={s.inputBuscar}
              placeholder="Buscar por mesa, usuario, insumo, motivo…"
              value={f.buscar} onChange={e => cambiar({ buscar:e.target.value })} />
          </div>
          <span style={s.contador}>{data?.total ?? 0} registros</span>
        </div>

        {/* Módulos */}
        <div style={s.chips}>
          {Object.entries(MODULOS).map(([id, m]) => {
            const activo = f.modulo === id;
            const n = id === 'todos' ? totalTodo : resumen[id];
            return (
              <button key={id} onClick={() => cambiar({ modulo:id })}
                style={{ ...s.chip,
                  background:  activo ? '#0F1628' : '#fff',
                  color:       activo ? '#fff'    : '#374151',
                  borderColor: activo ? '#0F1628' : '#E6E9F2' }}>
                {id !== 'todos' && <span style={{ ...s.chipDot, background:m.color }} />}
                {m.label}
                {n !== undefined && <span style={{ opacity:0.65, marginLeft:2 }}>{n}</span>}
              </button>
            );
          })}
        </div>

        {/* Fechas */}
        <div style={s.fechas}>
          <label style={s.fechaLabel}>Desde</label>
          <input style={s.fecha} type="date" value={f.desde}
            onChange={e => cambiar({ desde:e.target.value })} />
          <label style={s.fechaLabel}>Hasta</label>
          <input style={s.fecha} type="date" value={f.hasta}
            onChange={e => cambiar({ hasta:e.target.value })} />
          <div style={{ display:'flex', gap:6, marginLeft:6 }}>
            {RAPIDOS.map(([l, d]) => (
              <button key={l} onClick={() => rapido(d)}
                style={{ ...s.rapido,
                  background: rapidoActivo(d) ? '#2563EB' : '#EFF6FF',
                  color:      rapidoActivo(d) ? '#fff'    : '#2563EB' }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {truncado && (
          <div style={s.aviso}>
            Se muestran los {data.limite_por_modulo} registros más recientes por módulo.
            Acota el rango de fechas para ver los anteriores.
          </div>
        )}
        {hayErrores && (
          <div style={{ ...s.aviso, background:'#FEF2F2', color:'#B91C1C', borderColor:'#FECACA' }}>
            ⚠️ No se pudieron cargar: {Object.keys(data.errores)
              .map(k => MODULOS[k]?.label || k).join(', ')}.
            Revisa la terminal de Django para ver el detalle.
          </div>
        )}

        {/* Tabla */}
        <div style={s.tablaCard}>
          <div style={{ overflowX:'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['Hora','Módulo','Descripción','Usuario','Estado','Monto']
                    .map((h, i) => (
                      <th key={h} style={{ ...s.th, textAlign: i === 5 ? 'right' : 'left' }}>{h}</th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={6} style={s.vacio}>Cargando historial…</td></tr>
                )}
                {!loading && !data && (
                  <tr><td colSpan={6} style={s.vacio}>No se pudo cargar el historial.</td></tr>
                )}
                {!loading && data && grupos.length === 0 && (
                  <tr><td colSpan={6} style={s.vacio}>No hay registros con estos filtros.</td></tr>
                )}

                {!loading && grupos.map(g => (
                  <Fragment key={g.dia}>
                    <tr>
                      <td colSpan={6} style={s.diaRow}>
                        {g.dia} <span style={s.diaN}>{g.items.length}</span>
                      </td>
                    </tr>
                    {g.items.map((e, i) => {
                      const m = MODULOS[e.modulo] || MODULOS.todos;
                      const [tbg, tfg, tdot] = tonoEstado(e.estado);
                      const sinUsuario = !e.usuario || e.usuario === '—';
                      return (
                        <tr key={e.key} style={{ background: i % 2 === 0 ? '#fff' : '#FAFBFD' }}>
                          <td style={{ ...s.td, color:'#6B7280', whiteSpace:'nowrap' }}>
                            {new Date(e.fecha).toLocaleTimeString('es-PE',
                              { hour:'2-digit', minute:'2-digit' })}
                          </td>
                          <td style={s.td}>
                            <span style={{ ...s.pill, background:m.color + '18', color:m.color }}>
                              {m.label}
                            </span>
                          </td>
                          <td style={{ ...s.td, maxWidth:380 }}>
                            <div style={s.desTitulo}>{e.titulo}</div>
                            {e.detalle && (
                              <div style={s.desDetalle} title={e.detalle}>{e.detalle}</div>
                            )}
                          </td>
                          <td style={s.td}>
                            {sinUsuario ? '—' : (
                              <div style={s.celdaUsuario}>
                                <span style={s.avatar}>{e.usuario[0].toUpperCase()}</span>
                                <span style={{ fontWeight:600, color:'#0F1628' }}>{e.usuario}</span>
                              </div>
                            )}
                          </td>
                          <td style={s.td}>
                            {e.estado && (
                              <span style={{ ...s.estado, background:tbg, color:tfg }}>
                                <span style={{ ...s.punto, background:tdot }} />
                                {etiqueta(e.estado)}
                              </span>
                            )}
                          </td>
                          <td style={{ ...s.td, textAlign:'right', whiteSpace:'nowrap' }}>
                            {e.monto !== null
                              ? <strong style={{ color:'#059669' }}>S/. {e.monto.toFixed(2)}</strong>
                              : <span style={{ color:'#D1D5DB' }}>—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {data && data.total > 0 && (
            <div style={s.pie}>
              <span style={{ fontSize:13, color:'#6B7280' }}>
                Mostrando {ini}–{fin} de {data.total} registros
              </span>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <button style={s.pagBtn} disabled={page <= 1}
                  onClick={() => setPage(page - 1)}>← Anterior</button>
                <span style={{ fontSize:13, fontWeight:600, color:'#374151' }}>
                  {data.page} / {data.paginas}
                </span>
                <button style={s.pagBtn} disabled={page >= data.paginas}
                  onClick={() => setPage(page + 1)}>Siguiente →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

const s = {
  pagina:     { padding:'2.5rem 2.75rem', minHeight:'100vh', background:'#F8F9FC', boxSizing:'border-box' },
  header:     { display:'flex', justifyContent:'space-between', alignItems:'center', gap:16, flexWrap:'wrap', marginBottom:'1.5rem' },
  headerLeft: { display:'flex', alignItems:'center', gap:14 },
  icono:      { fontSize:34 },
  titulo:     { fontSize:28, fontWeight:800, color:'#0F1628', margin:0, letterSpacing:'-0.02em' },
  subtitulo:  { fontSize:14, color:'#6B7280', margin:'2px 0 0' },
  btnPrimario:{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 22px', borderRadius:12, background:'#2563EB', color:'#fff', border:'none', cursor:'pointer', fontSize:14, fontWeight:700, boxShadow:'0 6px 16px rgba(37,99,235,0.28)' },

  metricas:   { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14, marginBottom:'1.5rem' },
  metrica:    { display:'flex', alignItems:'center', gap:14, padding:'18px 22px', borderRadius:18 },
  metricaIcono:{ fontSize:32 },
  metricaValor:{ fontSize:32, fontWeight:800, lineHeight:1 },
  metricaLabel:{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em' },

  barra:      { display:'flex', alignItems:'center', gap:14, marginBottom:'1rem' },
  buscador:   { flex:1, display:'flex', alignItems:'center', gap:12, background:'#fff', border:'1px solid #E6E9F2', borderRadius:14, padding:'0 18px', height:52, color:'#6B7280' },
  inputBuscar:{ flex:1, border:'none', outline:'none', background:'transparent', fontSize:14, color:'#0F1628' },
  contador:   { fontSize:13, fontWeight:600, color:'#6B7280', whiteSpace:'nowrap' },

  chips:      { display:'flex', gap:8, flexWrap:'wrap', marginBottom:'1rem' },
  chip:       { display:'inline-flex', alignItems:'center', gap:7, padding:'8px 15px', borderRadius:20, border:'1px solid', cursor:'pointer', fontSize:12.5, fontWeight:600 },
  chipDot:    { width:8, height:8, borderRadius:'50%' },

  fechas:     { display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:'1.25rem' },
  fechaLabel: { fontSize:12, fontWeight:600, color:'#6B7280' },
  fecha:      { height:40, padding:'0 12px', borderRadius:10, border:'1px solid #E6E9F2', background:'#fff', fontSize:13, color:'#374151' },
  rapido:     { padding:'9px 14px', borderRadius:10, border:'none', cursor:'pointer', fontSize:12.5, fontWeight:700 },

  aviso:      { background:'#FFFBEB', color:'#92400E', border:'1px solid #FCD34D', borderRadius:10, padding:'10px 14px', fontSize:12.5, marginBottom:'1rem' },

  tablaCard:  { background:'#fff', borderRadius:18, border:'1px solid #E6E9F2', overflow:'hidden', boxShadow:'0 1px 3px rgba(15,23,42,0.05)' },
  table:      { width:'100%', borderCollapse:'collapse' },
  th:         { background:'#0F172A', color:'#fff', padding:'16px 20px', fontSize:12.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'.03em', whiteSpace:'nowrap' },
  td:         { padding:'14px 20px', fontSize:14, color:'#374151', borderBottom:'1px solid #F0F2F7', verticalAlign:'middle' },
  vacio:      { textAlign:'center', color:'#9CA3AF', padding:'3rem', fontSize:14 },
  diaRow:     { background:'#F1F3F9', color:'#475569', fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em', padding:'10px 20px', borderBottom:'1px solid #E6E9F2' },
  diaN:       { background:'#fff', borderRadius:10, padding:'1px 9px', marginLeft:8, fontSize:11, color:'#475569' },

  pill:       { display:'inline-block', fontSize:12, fontWeight:700, padding:'5px 12px', borderRadius:20, whiteSpace:'nowrap' },
  desTitulo:  { fontSize:14, fontWeight:700, color:'#0F1628' },
  desDetalle: { fontSize:12.5, color:'#6B7280', marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  celdaUsuario:{ display:'flex', alignItems:'center', gap:10 },
  avatar:     { width:32, height:32, borderRadius:'50%', background:'#FDF1C8', color:'#92400E', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, flexShrink:0 },
  estado:     { display:'inline-flex', alignItems:'center', gap:7, fontSize:12, fontWeight:600, padding:'5px 12px', borderRadius:20, whiteSpace:'nowrap' },
  punto:      { width:7, height:7, borderRadius:'50%', display:'inline-block' },

  pie:        { display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap', padding:'14px 20px', background:'#FAFBFD' },
  pagBtn:     { padding:'8px 16px', borderRadius:9, background:'#fff', border:'1px solid #E6E9F2', cursor:'pointer', fontSize:13, fontWeight:600, color:'#374151' },
};
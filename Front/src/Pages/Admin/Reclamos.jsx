import { useEffect, useState } from 'react';
import Layout from '../../Components/Admin/Layout';
import { getReclamos,
         cambiarEstadoReclamo } from '../../Services/adminService';

const TIPO_COLOR = {
  reclamo:    { bg:'#FEF2F2', color:'#DC2626' },
  sugerencia: { bg:'#EFF6FF', color:'#2563EB' },
};

const ESTADO_COLOR = {
  pendiente: { bg:'#FFFBEB', color:'#D97706' },
  revisado:  { bg:'#EFF6FF', color:'#2563EB' },
  resuelto:  { bg:'#ECFDF5', color:'#059669' },
};

export default function Reclamos() {
  const [lista,   setLista]   = useState([]);
  const [filtro,  setFiltro]  = useState('todos');
  const [mensaje, setMensaje] = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(true);

  const cargar = () => {
    setLoading(true);
    getReclamos()
      .then(r => setLista(r.data))
      .catch(e => mostrar(
        e.response?.data?.error || 'Error al cargar reclamos', true
      ))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const mostrar = (msg, err = false) => {
    err ? setError(msg) : setMensaje(msg);
    setTimeout(() => { setMensaje(''); setError(''); }, 3000);
  };

  const handleCambiarEstado = async (id, nuevoEstado) => {
    try {
      await cambiarEstadoReclamo(id, nuevoEstado);
      mostrar('Estado actualizado correctamente');
      cargar();
    } catch (e) {
      mostrar(e.response?.data?.error || 'Error al actualizar', true);
    }
  };

  const FILTROS = [
    { id:'todos',     label:'Todos'       },
    { id:'pendiente', label:'Pendientes'  },
    { id:'revisado',  label:'Revisados'   },
    { id:'resuelto',  label:'Resueltos'   },
    { id:'reclamo',   label:'Reclamos'    },
    { id:'sugerencia',label:'Sugerencias' },
  ];

  const listaFiltrada = filtro === 'todos'
    ? lista
    : lista.filter(r =>
        r.estado === filtro || r.tipo === filtro
      );

  // Contadores
  const pendientes  = lista.filter(r => r.estado === 'pendiente').length;
  const resueltos   = lista.filter(r => r.estado === 'resuelto').length;
  const reclamos    = lista.filter(r => r.tipo === 'reclamo').length;
  const sugerencias = lista.filter(r => r.tipo === 'sugerencia').length;

  return (
    <Layout>
      <div style={s.page}>

        {/* Header */}
        <div style={s.pageHeader}>
          <div>
            <h1 style={s.titulo}>Reclamos y sugerencias</h1>
            <p style={s.subtitulo}>
              Gestiona los reclamos del personal y clientes
            </p>
          </div>
          <button style={s.recargarBtn} onClick={cargar}>
            ↻ Actualizar
          </button>
        </div>

        {mensaje && <div style={s.toast}>{mensaje}</div>}
        {error   && <div style={s.toastErr}>{error}</div>}

        {/* Métricas */}
        <div style={s.metricas}>
          {[
            { label:'Total',       val:lista.length,  color:'#6366F1', bg:'#EEF2FF' },
            { label:'Pendientes',  val:pendientes,    color:'#D97706', bg:'#FFFBEB' },
            { label:'Resueltos',   val:resueltos,     color:'#059669', bg:'#ECFDF5' },
            { label:'Reclamos',    val:reclamos,      color:'#DC2626', bg:'#FEF2F2' },
            { label:'Sugerencias', val:sugerencias,   color:'#2563EB', bg:'#EFF6FF' },
          ].map((m, i) => (
            <div key={i} style={{ ...s.metricCard,
                                   background:m.bg,
                                   borderColor:m.color+'30' }}>
              <div style={{ fontSize:24, fontWeight:800,
                             color:m.color }}>
                {m.val}
              </div>
              <div style={{ fontSize:12, color:m.color,
                             fontWeight:500 }}>
                {m.label}
              </div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div style={s.filtros}>
          {FILTROS.map(f => (
            <button key={f.id} style={{
              ...s.filtroBtn,
              background: filtro === f.id ? '#0F1628' : '#fff',
              color:      filtro === f.id ? '#fff'    : '#6B7280',
              borderColor: filtro === f.id ? '#0F1628' : '#E8EAF0',
            }} onClick={() => setFiltro(f.id)}>
              {f.label}
              {f.id === 'pendiente' && pendientes > 0 && (
                <span style={s.badge}>{pendientes}</span>
              )}
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div style={s.empty}>Cargando reclamos...</div>
        ) : listaFiltrada.length === 0 ? (
          <div style={s.empty}>
            No hay registros para mostrar.
          </div>
        ) : (
          <div style={s.lista}>
            {listaFiltrada.map(r => {
              const tc = TIPO_COLOR[r.tipo]    || TIPO_COLOR.reclamo;
              const ec = ESTADO_COLOR[r.estado] || ESTADO_COLOR.pendiente;
              return (
                <div key={r.id_reclamo} style={s.card}>
                  <div style={s.cardHeader}>
                    <div style={s.cardLeft}>
                      <span style={{ ...s.pill,
                                      background:tc.bg,
                                      color:tc.color }}>
                        {r.tipo === 'reclamo' ? '🚨' : '💡'} {r.tipo}
                      </span>
                      <span style={{ ...s.pill,
                                      background:ec.bg,
                                      color:ec.color }}>
                        {r.estado}
                      </span>
                      <span style={s.meta}>
                        #{r.id_reclamo} · {r.registrado_por || '—'}
                      </span>
                    </div>
                    <span style={s.fecha}>
                      {new Date(r.tiempo_creacion).toLocaleString('es-PE', {
                        day:'2-digit', month:'2-digit', year:'numeric',
                        hour:'2-digit', minute:'2-digit'
                      })}
                    </span>
                  </div>

                  <p style={s.descripcion}>{r.descripcion}</p>

                  {/* Acciones */}
                  {r.estado !== 'resuelto' && (
                    <div style={s.acciones}>
                      {r.estado === 'pendiente' && (
                        <button style={s.btnRevisar}
                          onClick={() => handleCambiarEstado(
                            r.id_reclamo, 'revisado'
                          )}>
                          👁 Marcar revisado
                        </button>
                      )}
                      <button style={s.btnResolver}
                        onClick={() => handleCambiarEstado(
                          r.id_reclamo, 'resuelto'
                        )}>
                        ✅ Marcar resuelto
                      </button>
                    </div>
                  )}
                  {r.estado === 'resuelto' && (
                    <div style={s.resueltoBadge}>
                      ✅ Resuelto
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

const s = {
  page:       { maxWidth:900 },
  pageHeader: { display:'flex', justifyContent:'space-between',
                alignItems:'flex-start', marginBottom:'1.25rem' },
  titulo:     { fontSize:22, fontWeight:800, color:'#0F1628',
                margin:0, letterSpacing:'-0.02em' },
  subtitulo:  { fontSize:13, color:'#6B7280', marginTop:4 },
  recargarBtn:{ padding:'8px 16px', borderRadius:'8px',
                background:'#fff', border:'1px solid #E8EAF0',
                color:'#6366F1', cursor:'pointer', fontSize:13,
                fontWeight:600 },
  toast:      { background:'#ECFDF5', color:'#059669',
                padding:'10px 14px', borderRadius:'8px',
                marginBottom:12, fontSize:13 },
  toastErr:   { background:'#FEF2F2', color:'#DC2626',
                padding:'10px 14px', borderRadius:'8px',
                marginBottom:12, fontSize:13 },
  metricas:   { display:'grid',
                gridTemplateColumns:'repeat(auto-fit,minmax(100px,1fr))',
                gap:10, marginBottom:'1.25rem' },
  metricCard: { borderRadius:'10px', padding:'12px',
                textAlign:'center', border:'1px solid' },
  filtros:    { display:'flex', gap:6, flexWrap:'wrap',
                marginBottom:'1rem' },
  filtroBtn:  { padding:'6px 14px', borderRadius:'20px',
                border:'1px solid', cursor:'pointer',
                fontSize:12, fontWeight:500,
                display:'flex', alignItems:'center', gap:6 },
  badge:      { background:'#EF4444', color:'#fff',
                fontSize:10, fontWeight:700,
                padding:'1px 6px', borderRadius:'20px' },
  empty:      { textAlign:'center', color:'#9CA3AF',
                padding:'3rem', background:'#fff',
                borderRadius:'12px', fontSize:14,
                border:'1px solid #E8EAF0' },
  lista:      { display:'flex', flexDirection:'column', gap:8 },
  card:       { background:'#fff', borderRadius:'12px',
                padding:'1rem 1.25rem',
                border:'1px solid #E8EAF0',
                boxShadow:'0 1px 3px rgba(0,0,0,0.04)' },
  cardHeader: { display:'flex', justifyContent:'space-between',
                alignItems:'center', marginBottom:10,
                flexWrap:'wrap', gap:8 },
  cardLeft:   { display:'flex', alignItems:'center',
                gap:6, flexWrap:'wrap' },
  pill:       { fontSize:11, fontWeight:500, padding:'3px 10px',
                borderRadius:'20px' },
  meta:       { fontSize:11, color:'#9CA3AF' },
  fecha:      { fontSize:11, color:'#9CA3AF', flexShrink:0 },
  descripcion:{ fontSize:13, color:'#374151', lineHeight:1.6,
                margin:'0 0 10px' },
  acciones:   { display:'flex', gap:6 },
  btnRevisar: { padding:'6px 14px', borderRadius:'8px',
                background:'#EFF6FF', color:'#2563EB',
                border:'none', cursor:'pointer', fontSize:12,
                fontWeight:500 },
  btnResolver:{ padding:'6px 14px', borderRadius:'8px',
                background:'#ECFDF5', color:'#059669',
                border:'none', cursor:'pointer', fontSize:12,
                fontWeight:500 },
  resueltoBadge:{ fontSize:12, color:'#059669', fontWeight:500 },
};
import { useEffect, useState } from 'react';
import Layout from '../../components/admin/Layout';
import api    from '../../services/api';

const ESTADO_COLOR = {
  pendiente: { bg:'#FAEEDA', color:'#633806' },
  revisado:  { bg:'#E6F1FB', color:'#0C447C' },
  resuelto:  { bg:'#E1F5EE', color:'#085041' },
};

export default function Reclamos() {
  const [lista, setLista]   = useState([]);
  const [filtro, setFiltro] = useState('todos');

  const cargar = () => {
    api.get('/reclamos/', {
      headers: { Authorization: `Bearer ${localStorage.getItem('access')}` }
    }).then(r => setLista(r.data));
  };

  useEffect(() => { cargar(); }, []);

  const cambiarEstado = async (id, nuevoEstado) => {
    await api.patch(`/reclamos/${id}/`, { estado: nuevoEstado }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access')}` }
    });
    cargar();
  };

  const listaFiltrada = filtro === 'todos'
    ? lista
    : lista.filter(r => r.tipo === filtro);

  return (
    <Layout>
      <div style={s.page}>
        <div style={s.pageHeader}>
          <h1 style={s.titulo}>Reclamos y sugerencias</h1>
          <div style={s.resumen}>
            <span style={{ ...s.badge, background:'#FAEEDA', color:'#633806' }}>
              {lista.filter(r => r.estado === 'pendiente').length} pendientes
            </span>
            <span style={{ ...s.badge, background:'#E1F5EE', color:'#085041' }}>
              {lista.filter(r => r.estado === 'resuelto').length} resueltos
            </span>
          </div>
        </div>

        {/* Filtros */}
        <div style={s.filtros}>
          {['todos','reclamo','sugerencia'].map(f => (
            <button key={f} style={{
              ...s.filtroBtn,
              background: filtro === f ? '#1E2D40' : '#fff',
              color:      filtro === f ? '#fff'    : '#555',
            }} onClick={() => setFiltro(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}s
            </button>
          ))}
        </div>

        {/* Lista */}
        <div style={s.lista}>
          {listaFiltrada.length === 0 && (
            <p style={{ color:'#888', fontSize:13 }}>
              No hay registros para mostrar.
            </p>
          )}
          {listaFiltrada.map(r => {
            const ec = ESTADO_COLOR[r.estado] || ESTADO_COLOR.pendiente;
            return (
              <div key={r.id_reclamo} style={s.card}>
                <div style={s.cardHeader}>
                  <div style={s.cardLeft}>
                    <span style={{
                      ...s.tipoPill,
                      background: r.tipo === 'reclamo' ? '#FAECE7' : '#E6F1FB',
                      color:      r.tipo === 'reclamo' ? '#712B13' : '#0C447C',
                    }}>
                      {r.tipo}
                    </span>
                    <span style={{ fontSize:12, color:'#888' }}>
                      #{r.id_reclamo} · {r.registrado_por}
                    </span>
                    <span style={{ fontSize:11, color:'#aaa' }}>
                      {new Date(r.tiempo_creacion).toLocaleString('es-PE')}
                    </span>
                  </div>
                  <span style={{ ...s.estadoPill,
                                  background:ec.bg, color:ec.color }}>
                    {r.estado}
                  </span>
                </div>
                <p style={s.desc}>{r.descripcion}</p>
                {r.estado !== 'resuelto' && (
                  <div style={s.cardBtns}>
                    {r.estado === 'pendiente' && (
                      <button style={s.btnRevisar}
                        onClick={() => cambiarEstado(r.id_reclamo, 'revisado')}>
                        Marcar revisado
                      </button>
                    )}
                    <button style={s.btnResolver}
                      onClick={() => cambiarEstado(r.id_reclamo, 'resuelto')}>
                      Marcar resuelto
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}

const s = {
  page:       { maxWidth:900 },
  pageHeader: { display:'flex', justifyContent:'space-between',
                alignItems:'center', marginBottom:'1.25rem', flexWrap:'wrap', gap:10 },
  titulo:     { fontSize:20, fontWeight:700, color:'#1E2D40', margin:0 },
  resumen:    { display:'flex', gap:8 },
  badge:      { fontSize:12, fontWeight:500, padding:'4px 12px', borderRadius:20 },
  filtros:    { display:'flex', gap:6, marginBottom:'1.25rem' },
  filtroBtn:  { padding:'6px 14px', borderRadius:20, border:'1px solid #ddd',
                cursor:'pointer', fontSize:12 },
  lista:      { display:'flex', flexDirection:'column', gap:10 },
  card:       { background:'#fff', borderRadius:10, padding:'1rem 1.25rem',
                border:'1px solid #E8E6DF' },
  cardHeader: { display:'flex', justifyContent:'space-between',
                alignItems:'flex-start', marginBottom:8 },
  cardLeft:   { display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' },
  tipoPill:   { fontSize:11, fontWeight:500, padding:'2px 8px', borderRadius:20 },
  estadoPill: { fontSize:11, fontWeight:500, padding:'3px 10px',
                borderRadius:20, flexShrink:0 },
  desc:       { fontSize:13, color:'#333', lineHeight:1.5, margin:'0 0 10px' },
  cardBtns:   { display:'flex', gap:6 },
  btnRevisar: { padding:'5px 12px', borderRadius:6, background:'#E6F1FB',
                color:'#0C447C', border:'none', cursor:'pointer', fontSize:12 },
  btnResolver:{ padding:'5px 12px', borderRadius:6, background:'#E1F5EE',
                color:'#085041', border:'none', cursor:'pointer', fontSize:12 },
};
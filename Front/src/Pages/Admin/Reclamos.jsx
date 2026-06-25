import { useEffect, useState } from 'react';
import Layout from '../../components/admin/Layout';
import api from '../../services/api';

const ESTADO_CONFIG = {
  pendiente: { bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B', label: 'Pendiente' },
  revisado:  { bg: '#DBEAFE', color: '#1E40AF', dot: '#3B82F6', label: 'Revisado' },
  resuelto:  { bg: '#D1FAE5', color: '#065F46', dot: '#10B981', label: 'Resuelto' },
};

export default function Reclamos() {
  const [lista, setLista] = useState([]);
  const [filtro, setFiltro] = useState('todos');
  const [loading, setLoading] = useState(true);

  const cargar = () => {
    setLoading(true);
    api.get('/reclamos/', {
      headers: { Authorization: `Bearer ${localStorage.getItem('access')}` }
    }).then(r => {
      setLista(r.data);
      setLoading(false);
    });
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

  const stats = {
    total: lista.length,
    pendiente: lista.filter(r => r.estado === 'pendiente').length,
    resuelto: lista.filter(r => r.estado === 'resuelto').length,
  };

  return (
    <Layout>
      <div style={s.page}>
        {/* HEADER */}
        <div style={s.pageHeader}>
          <div>
            <h1 style={s.titulo}>Reclamos y Sugerencias</h1>
            <p style={s.subtitulo}>{stats.total} total · {stats.pendiente} pendientes</p>
          </div>
        </div>

        {/* STATS */}
        <div style={s.statsRow}>
          <div style={{ ...s.statCard, background: '#EFF6FF', borderColor: '#BFDBFE' }}>
            <span style={{ ...s.statValor, color: '#1D4ED8' }}>{stats.total}</span>
            <span style={s.statLabel}>Total</span>
          </div>
          <div style={{ ...s.statCard, background: '#FEF3C7', borderColor: '#FDE68A' }}>
            <span style={{ ...s.statValor, color: '#92400E' }}>{stats.pendiente}</span>
            <span style={s.statLabel}>Pendientes</span>
          </div>
          <div style={{ ...s.statCard, background: '#D1FAE5', borderColor: '#6EE7B7' }}>
            <span style={{ ...s.statValor, color: '#065F46' }}>{stats.resuelto}</span>
            <span style={s.statLabel}>Resueltos</span>
          </div>
        </div>

        {/* FILTROS */}
        <div style={s.filtros}>
          {['todos', 'reclamo', 'sugerencia'].map(f => (
            <button
              key={f}
              style={{
                ...s.filtroBtn,
                background: filtro === f ? '#0F172A' : '#fff',
                color: filtro === f ? '#fff' : '#64748B',
                borderColor: filtro === f ? '#0F172A' : '#E2E8F0',
              }}
              onClick={() => setFiltro(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}s
            </button>
          ))}
        </div>

        {/* LISTA */}
        {loading ? (
          <div style={s.loading}>Cargando...</div>
        ) : listaFiltrada.length === 0 ? (
          <div style={s.empty}>No hay registros</div>
        ) : (
          <div style={s.lista}>
            {listaFiltrada.map(r => {
              const ec = ESTADO_CONFIG[r.estado] || ESTADO_CONFIG.pendiente;
              return (
                <div key={r.id_reclamo} style={{ ...s.card, borderLeftColor: ec.dot }}>
                  <div style={s.cardHeader}>
                    <div style={s.cardLeft}>
                      <span style={{
                        ...s.tipoPill,
                        background: r.tipo === 'reclamo' ? '#FEE2E2' : '#DBEAFE',
                        color: r.tipo === 'reclamo' ? '#991B1B' : '#1E40AF',
                      }}>
                        {r.tipo}
                      </span>
                      <span style={s.cardUser}>{r.registrado_por}</span>
                      <span style={s.cardDate}>
                        {new Date(r.tiempo_creacion).toLocaleString('es-PE')}
                      </span>
                    </div>
                    <span style={{ ...s.estadoPill, background: ec.bg, color: ec.color }}>
                      <span style={{ ...s.dot, background: ec.dot }} />
                      {ec.label}
                    </span>
                  </div>
                  <p style={s.desc}>{r.descripcion}</p>
                  {r.estado !== 'resuelto' && (
                    <div style={s.cardBtns}>
                      {r.estado === 'pendiente' && (
                        <button style={s.btnRevisar}
                          onClick={() => cambiarEstado(r.id_reclamo, 'revisado')}>
                          Revisar
                        </button>
                      )}
                      <button style={s.btnResolver}
                        onClick={() => cambiarEstado(r.id_reclamo, 'resuelto')}>
                        Resolver
                      </button>
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

// ── ESTILOS MEJORADOS ──────────────────────────────────────────────
const s = {
  page: { 
    padding: '28px 32px', 
    maxWidth: 1100, 
    margin: '0 auto',
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif"
  },
  pageHeader: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 28 
  },
  titulo: { 
    fontSize: 26, 
    fontWeight: 700, 
    color: '#0F172A', 
    margin: 0,
    letterSpacing: '-0.5px'
  },
  subtitulo: { 
    color: '#64748B', 
    fontSize: 14, 
    marginTop: 4 
  },
  statsRow: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(3, 1fr)', 
    gap: 14, 
    marginBottom: 24 
  },
  statCard: { 
    borderRadius: 12, 
    padding: '16px 20px', 
    border: '1px solid',
    display: 'flex',
    flexDirection: 'column',
    gap: 2
  },
  statValor: { 
    fontSize: 32, 
    fontWeight: 800, 
    letterSpacing: '-1px' 
  },
  statLabel: { 
    fontSize: 12, 
    fontWeight: 600, 
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  filtros: { 
    display: 'flex', 
    gap: 8, 
    marginBottom: 20 
  },
  filtroBtn: { 
    padding: '8px 18px', 
    borderRadius: 10, 
    border: '1.5px solid',
    cursor: 'pointer', 
    fontSize: 13, 
    fontWeight: 600,
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    transition: 'all 0.2s ease'
  },
  loading: { 
    textAlign: 'center', 
    color: '#94A3B8', 
    padding: '40px 0' 
  },
  empty: { 
    textAlign: 'center', 
    color: '#94A3B8', 
    padding: '40px 0' 
  },
  lista: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: 12 
  },
  card: { 
    background: '#fff', 
    borderRadius: 14, 
    padding: '20px 24px',
    border: '1px solid #E2E8F0',
    borderLeftWidth: 6,
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    transition: 'all 0.2s ease'
  },
  cardHeader: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 10,
    gap: 12
  },
  cardLeft: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: 10, 
    flexWrap: 'wrap' 
  },
  tipoPill: { 
    fontSize: 11, 
    fontWeight: 600, 
    padding: '3px 12px', 
    borderRadius: 20 
  },
  cardUser: { 
    fontSize: 12, 
    color: '#64748B' 
  },
  cardDate: { 
    fontSize: 11, 
    color: '#94A3B8' 
  },
  estadoPill: { 
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12, 
    fontWeight: 600, 
    padding: '4px 14px', 
    borderRadius: 20,
    whiteSpace: 'nowrap',
    flexShrink: 0
  },
  dot: { 
    width: 7, 
    height: 7, 
    borderRadius: '50%', 
    display: 'inline-block' 
  },
  desc: { 
    fontSize: 14, 
    color: '#1E293B', 
    lineHeight: 1.6, 
    margin: '0 0 14px' 
  },
  cardBtns: { 
    display: 'flex', 
    gap: 8 
  },
  btnRevisar: { 
    padding: '6px 16px', 
    borderRadius: 8, 
    background: '#DBEAFE', 
    color: '#1E40AF', 
    border: '1px solid #93C5FD',
    cursor: 'pointer', 
    fontSize: 12, 
    fontWeight: 600,
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    transition: 'all 0.15s ease'
  },
  btnResolver: { 
    padding: '6px 16px', 
    borderRadius: 8, 
    background: '#D1FAE5', 
    color: '#065F46', 
    border: '1px solid #6EE7B7',
    cursor: 'pointer', 
    fontSize: 12, 
    fontWeight: 600,
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    transition: 'all 0.15s ease'
  },
};
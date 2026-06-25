import { useEffect, useState } from 'react';
import Layout from '../../components/admin/Layout';
import Modal from '../../components/admin/Modal';
import { getMesas, crearMesa, editarMesa, eliminarMesa } from '../../services/adminService';

// ── ESTADOS ────────────────────────────────────────────────────────
const ESTADO_CONFIG = {
  libre: { 
    bg: '#ECFDF5', 
    color: '#065F46', 
    dot: '#10B981', 
    border: '#A7F3D0', 
    label: 'Libre',
    icon: '🟢'
  },
  ocupada: { 
    bg: '#FEF2F2', 
    color: '#991B1B', 
    dot: '#EF4444', 
    border: '#FCA5A5', 
    label: 'Ocupada',
    icon: '🔴'
  },
  reservada: { 
    bg: '#FFFBEB', 
    color: '#92400E', 
    dot: '#F59E0B', 
    border: '#FDE68A', 
    label: 'Reservada',
    icon: '🟡'
  },
  unida: { 
    bg: '#F5F3FF', 
    color: '#5B21B6', 
    dot: '#8B5CF6', 
    border: '#C4B5FD', 
    label: 'Unida',
    icon: '🟣'
  },
};

const ESTADOS = ['libre', 'ocupada', 'reservada'];
const FORM_VACIO = { identificador_mesa: '', capacidad: 4, estado: 'libre' };

// ── TOAST ──────────────────────────────────────────────────────────
function Toast({ mensaje, error }) {
  if (!mensaje && !error) return null;
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      background: error ? '#FEF2F2' : '#F0FDF4',
      border: `1px solid ${error ? '#FECACA' : '#86EFAC'}`,
      color: error ? '#991B1B' : '#065F46',
      borderRadius: 12,
      padding: '14px 20px',
      fontSize: 14,
      fontWeight: 500,
      marginBottom: 24,
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: error ? '#FEE2E2' : '#D1FAE5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        {error
          ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
        }
      </div>
      {mensaje || error}
    </div>
  );
}

// ── TARJETA MESA ───────────────────────────────────────────────────
function MesaCard({ mesa, onEditar, onEliminar }) {
  const cc = ESTADO_CONFIG[mesa.estado] || ESTADO_CONFIG.libre;
  
  return (
    <div style={{ ...s.mesaCard, borderColor: cc.border, borderWidth: 2 }}>
      <div style={{ ...s.mesaHeader, background: cc.bg }}>
        <div style={{ ...s.mesaIcono, background: cc.bg }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={cc.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="8" width="18" height="4" rx="1"/>
            <line x1="7" y1="12" x2="7" y2="19"/>
            <line x1="17" y1="12" x2="17" y2="19"/>
            <line x1="5" y1="19" x2="9" y2="19"/>
            <line x1="15" y1="19" x2="19" y2="19"/>
            <line x1="7" y1="8" x2="7" y2="5"/>
            <line x1="17" y1="8" x2="17" y2="5"/>
          </svg>
        </div>
        <div style={s.mesaNombre}>{mesa.identificador_mesa}</div>
      </div>

      <div style={s.mesaBody}>
        <span style={{ ...s.estadoBadge, background: cc.bg, color: cc.color }}>
          <span style={{ ...s.dot, background: cc.dot }} />
          {cc.label}
        </span>

        <div style={s.capacidad}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
          </svg>
          <span>{mesa.capacidad} personas</span>
        </div>
      </div>

      <div style={s.cardBtns}>
        <button style={s.btnEdit} onClick={() => onEditar(mesa)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Editar
        </button>
        <button style={s.btnDel} onClick={() => onEliminar(mesa)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          </svg>
          Eliminar
        </button>
      </div>
    </div>
  );
}

// ── COMPONENTE PRINCIPAL ───────────────────────────────────────────
export default function Mesas() {
  const [lista, setLista] = useState([]);
  const [modal, setModal] = useState(null);
  const [sel, setSel] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos');

  const cargar = () => getMesas().then(r => setLista(r.data));

  useEffect(() => {
    getMesas().then(r => {
      setLista(r.data);
      setLoading(false);
    });
  }, []);

  const mostrar = (msg, esError = false) => {
    esError ? setError(msg) : setMensaje(msg);
    setTimeout(() => { setMensaje(''); setError(''); }, 3000);
  };

  const abrirEditar = (m) => {
    setSel(m);
    setForm({ identificador_mesa: m.identificador_mesa, capacidad: m.capacidad, estado: m.estado });
    setModal('editar');
  };

  const handleCrear = async () => {
    try {
      await crearMesa(form);
      mostrar('Mesa creada correctamente');
      setModal(null); cargar();
    } catch (e) { mostrar(JSON.stringify(e.response?.data), true); }
  };

  const handleEditar = async () => {
    try {
      await editarMesa(sel.id_mesa, form);
      mostrar('Mesa actualizada');
      setModal(null); cargar();
    } catch (e) { mostrar(JSON.stringify(e.response?.data), true); }
  };

  const handleEliminar = async () => {
    try {
      await eliminarMesa(sel.id_mesa);
      mostrar('Mesa eliminada');
      setModal(null); cargar();
    } catch (e) { mostrar(e.response?.data?.error, true); }
  };

  const contadores = Object.keys(ESTADO_CONFIG).reduce((acc, est) => {
    acc[est] = lista.filter(m => m.estado === est).length;
    return acc;
  }, {});

  const listaFiltrada = filtro === 'todos' ? lista : lista.filter(m => m.estado === filtro);

  return (
    <Layout>
      <div style={s.page}>
        {/* HEADER */}
        <div style={s.pageHeader}>
          <div>
            <h1 style={s.titulo}>Gestión de Mesas</h1>
            <p style={s.subtitulo}>
              {lista.length} mesas totales · {contadores.ocupada || 0} ocupadas actualmente
            </p>
          </div>
          <button style={s.btnPrimario} onClick={() => { setForm(FORM_VACIO); setModal('crear'); }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nueva Mesa
          </button>
        </div>

        <Toast mensaje={mensaje} error={error} />

        {/* BANNERS RESUMEN */}
        <div style={s.statsRow}>
          {[
            { label: 'Total', valor: lista.length, bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE', icon: '📊' },
            { label: 'Libres', valor: contadores.libre || 0, bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0', icon: '🟢' },
            { label: 'Ocupadas', valor: contadores.ocupada || 0, bg: '#FEF2F2', color: '#991B1B', border: '#FCA5A5', icon: '🔴' },
            { label: 'Reservadas', valor: contadores.reservada || 0, bg: '#FFFBEB', color: '#92400E', border: '#FDE68A', icon: '🟡' },
          ].map(stat => (
            <div key={stat.label} style={{ ...s.statCard, background: stat.bg, borderColor: stat.border }}>
              <div style={s.statIcon}>{stat.icon}</div>
              <div>
                <span style={{ ...s.statValor, color: stat.color }}>{stat.valor}</span>
                <span style={{ ...s.statLabel, color: stat.color }}>{stat.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* FILTROS */}
        <div style={s.chipsRow}>
          {[
            { key: 'todos', label: 'Todas', count: lista.length, icon: '📋' },
            ...Object.entries(ESTADO_CONFIG).map(([k, v]) => ({ 
              key: k, 
              label: v.label, 
              count: contadores[k] || 0,
              icon: v.icon 
            }))
          ].map(chip => (
            <button 
              key={chip.key} 
              style={{ 
                ...s.chip, 
                ...(filtro === chip.key ? s.chipActive : {}),
                ...(chip.key !== 'todos' && filtro === chip.key ? { 
                  background: ESTADO_CONFIG[chip.key].bg,
                  borderColor: ESTADO_CONFIG[chip.key].border,
                  color: ESTADO_CONFIG[chip.key].color
                } : {})
              }} 
              onClick={() => setFiltro(chip.key)}
            >
              <span style={s.chipIcon}>{chip.icon}</span>
              {chip.label}
              <span style={{ 
                ...s.chipCount, 
                ...(filtro === chip.key ? { 
                  ...s.chipCountActive,
                  ...(chip.key !== 'todos' ? { 
                    background: ESTADO_CONFIG[chip.key].bg,
                    color: ESTADO_CONFIG[chip.key].color
                  } : {})
                } : {})
              }}>{chip.count}</span>
            </button>
          ))}
        </div>

        {/* GRID MESAS */}
        {loading ? (
          <div style={s.loadingGrid}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={s.skelCard} />
            ))}
          </div>
        ) : listaFiltrada.length === 0 ? (
          <div style={s.empty}>
            <div style={s.emptyIcon}>🔍</div>
            <p style={s.emptyText}>No hay mesas con este estado</p>
            <button style={s.btnSecundario} onClick={() => setFiltro('todos')}>
              Ver todas las mesas
            </button>
          </div>
        ) : (
          <div style={s.grid}>
            {listaFiltrada.map(m => (
              <MesaCard key={m.id_mesa} mesa={m} onEditar={abrirEditar} onEliminar={(m) => { setSel(m); setModal('eliminar'); }} />
            ))}
          </div>
        )}
      </div>

      {/* ── MODAL CREAR / EDITAR ── */}
      {(modal === 'crear' || modal === 'editar') && (
        <Modal titulo={modal === 'crear' ? '🪑 Nueva Mesa' : '✏️ Editar Mesa'} onClose={() => setModal(null)}>
          <div style={fs.grid}>
            <div style={fs.campo}>
              <label style={fs.label}>Identificador</label>
              <input 
                style={fs.input} 
                placeholder="Ej. Mesa 5, VIP 1, Terraza 2"
                value={form.identificador_mesa}
                onChange={e => setForm({ ...form, identificador_mesa: e.target.value })} 
              />
            </div>
            <div style={fs.campo}>
              <label style={fs.label}>Capacidad</label>
              <input 
                style={fs.input} 
                type="number" 
                min="1" 
                placeholder="Número de personas"
                value={form.capacidad}
                onChange={e => setForm({ ...form, capacidad: parseInt(e.target.value) })} 
              />
            </div>
            <div style={{ ...fs.campo, gridColumn: '1 / -1' }}>
              <label style={fs.label}>Estado de la Mesa</label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {ESTADOS.map(e => {
                  const cfg = ESTADO_CONFIG[e];
                  const sel = form.estado === e;
                  return (
                    <button key={e} type="button"
                      style={{ 
                        ...fs.estadoOpcion, 
                        background: sel ? cfg.bg : '#F8FAFC', 
                        color: sel ? cfg.color : '#64748B', 
                        borderColor: sel ? cfg.border : '#E2E8F0',
                        fontWeight: sel ? 600 : 400,
                        boxShadow: sel ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
                      }}
                      onClick={() => setForm({ ...form, estado: e })}>
                      <span style={{ ...s.dot, background: sel ? cfg.dot : '#CBD5E1', width: 8, height: 8 }} />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div style={fs.footer}>
            <button style={s.btnSecundario} onClick={() => setModal(null)}>Cancelar</button>
            <button style={s.btnPrimario} onClick={modal === 'crear' ? handleCrear : handleEditar}>
              {modal === 'crear' ? 'Agregar Mesa' : 'Guardar Cambios'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── MODAL ELIMINAR ── */}
      {modal === 'eliminar' && sel && (
        <Modal titulo="Eliminar Mesa" onClose={() => setModal(null)}>
          <div style={{ padding: '8px 0 20px' }}>
            <div style={s.deleteWarning}>
              <div style={s.deleteIcon}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div style={s.deleteContent}>
                <h3 style={s.deleteTitle}>¿Estás seguro?</h3>
                <p style={s.deleteText}>
                  Eliminarás la mesa <strong>"{sel?.identificador_mesa}"</strong> de forma permanente. 
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
          </div>
          <div style={fs.footer}>
            <button style={s.btnSecundario} onClick={() => setModal(null)}>Cancelar</button>
            <button style={{ ...s.btnPrimario, background: '#DC2626', boxShadow: '0 4px 14px rgba(220,38,38,0.35)' }} onClick={handleEliminar}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              </svg>
              Eliminar Mesa
            </button>
          </div>
        </Modal>
      )}
    </Layout>
  );
}

// ── ESTILOS ────────────────────────────────────────────────────────
const s = {
  page: { 
    padding: '32px 40px', 
    maxWidth: 1280, 
    margin: '0 auto', 
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    background: '#F8FAFC',
    minHeight: '100vh'
  },
  pageHeader: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 32,
    padding: '0 4px'
  },
  titulo: { 
    fontSize: 28, 
    fontWeight: 700, 
    color: '#0F172A', 
    margin: 0, 
    letterSpacing: '-0.025em',
    background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  subtitulo: { 
    color: '#64748B', 
    fontSize: 14, 
    marginTop: 6,
    fontWeight: 400,
    letterSpacing: '0.01em'
  },
  btnPrimario: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 24px',
    borderRadius: 12,
    background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    boxShadow: '0 4px 16px rgba(37,99,235,0.3)',
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    transition: 'all 0.2s ease',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 20px rgba(37,99,235,0.4)'
    }
  },
  btnSecundario: {
    padding: '10px 20px',
    borderRadius: 10,
    background: '#F1F5F9',
    color: '#475569',
    border: '1px solid #E2E8F0',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    transition: 'all 0.2s ease',
    ':hover': {
      background: '#E2E8F0'
    }
  },
  statsRow: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(4, 1fr)', 
    gap: 16, 
    marginBottom: 28 
  },
  statCard: { 
    borderRadius: 14, 
    padding: '18px 22px', 
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    transition: 'all 0.2s ease',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
    }
  },
  statIcon: { 
    fontSize: 28,
    opacity: 0.8
  },
  statValor: { 
    fontSize: 28, 
    fontWeight: 700, 
    letterSpacing: '-0.025em',
    lineHeight: 1.2
  },
  statLabel: { 
    fontSize: 12, 
    fontWeight: 600, 
    textTransform: 'uppercase', 
    letterSpacing: 0.5, 
    opacity: 0.7,
    marginLeft: 6
  },
  chipsRow: { 
    display: 'flex', 
    gap: 8, 
    marginBottom: 24, 
    flexWrap: 'wrap',
    padding: '0 4px'
  },
  chip: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: 8, 
    padding: '8px 16px', 
    borderRadius: 24, 
    background: '#fff', 
    border: '1.5px solid #E2E8F0', 
    color: '#64748B', 
    cursor: 'pointer', 
    fontSize: 13, 
    fontWeight: 500, 
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    transition: 'all 0.2s ease',
    ':hover': {
      borderColor: '#94A3B8',
      transform: 'translateY(-1px)'
    }
  },
  chipActive: { 
    background: '#EFF6FF', 
    borderColor: '#60A5FA', 
    color: '#1D4ED8',
    boxShadow: '0 2px 8px rgba(37,99,235,0.12)'
  },
  chipIcon: { 
    fontSize: 14 
  },
  chipCount: { 
    background: '#F1F5F9', 
    color: '#64748B', 
    borderRadius: 20, 
    padding: '2px 10px', 
    fontSize: 11, 
    fontWeight: 600,
    minWidth: 20,
    textAlign: 'center'
  },
  chipCountActive: { 
    background: '#DBEAFE', 
    color: '#1D4ED8' 
  },
  grid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
    gap: 16 
  },
  loadingGrid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
    gap: 16 
  },
  skelCard: { 
    height: 220, 
    borderRadius: 16, 
    background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)', 
    backgroundSize: '200% 100%', 
    animation: 'shimmer 1.4s infinite' 
  },
  empty: { 
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    background: '#fff',
    borderRadius: 16,
    border: '2px dashed #E2E8F0'
  },
  emptyIcon: { 
    fontSize: 48,
    marginBottom: 16
  },
  emptyText: { 
    color: '#64748B', 
    fontSize: 16,
    marginBottom: 20,
    fontWeight: 500
  },
  mesaCard: { 
    background: '#fff', 
    borderRadius: 16, 
    overflow: 'hidden',
    border: '2px solid',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    transition: 'all 0.2s ease',
    ':hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
    }
  },
  mesaHeader: { 
    padding: '16px 16px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    borderBottom: '1px solid rgba(0,0,0,0.04)'
  },
  mesaIcono: { 
    width: 44, 
    height: 44, 
    borderRadius: 10, 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    flexShrink: 0
  },
  mesaNombre: { 
    fontSize: 16, 
    fontWeight: 700, 
    color: '#0F172A', 
    letterSpacing: '-0.02em',
    flex: 1
  },
  mesaBody: { 
    padding: '12px 16px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },
  estadoBadge: { 
    display: 'inline-flex',
    alignItems: 'center', 
    gap: 6, 
    padding: '4px 14px', 
    borderRadius: 20, 
    fontSize: 12, 
    fontWeight: 600,
    width: 'fit-content'
  },
  dot: { 
    width: 7, 
    height: 7, 
    borderRadius: '50%', 
    flexShrink: 0 
  },
  capacidad: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: 6, 
    color: '#64748B', 
    fontSize: 13,
    fontWeight: 500
  },
  cardBtns: { 
    display: 'flex', 
    gap: 8, 
    padding: '0 16px 16px',
    width: '100%'
  },
  btnEdit: { 
    flex: 1, 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 6, 
    padding: '8px 12px', 
    borderRadius: 8, 
    background: '#EFF6FF', 
    color: '#2563EB', 
    border: '1.5px solid #BFDBFE', 
    cursor: 'pointer', 
    fontSize: 12, 
    fontWeight: 600, 
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    transition: 'all 0.15s ease',
    ':hover': {
      background: '#DBEAFE'
    }
  },
  btnDel: { 
    flex: 1, 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 6, 
    padding: '8px 12px', 
    borderRadius: 8, 
    background: '#FEF2F2', 
    color: '#DC2626', 
    border: '1.5px solid #FECACA', 
    cursor: 'pointer', 
    fontSize: 12, 
    fontWeight: 600, 
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    transition: 'all 0.15s ease',
    ':hover': {
      background: '#FEE2E2'
    }
  },
  deleteWarning: { 
    display: 'flex', 
    alignItems: 'flex-start', 
    gap: 16, 
    background: '#FEF2F2', 
    border: '2px solid #FECACA', 
    borderRadius: 12, 
    padding: '20px 24px'
  },
  deleteIcon: { 
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: '#FEE2E2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  deleteContent: { 
    flex: 1 
  },
  deleteTitle: { 
    margin: '0 0 4px 0',
    color: '#991B1B',
    fontSize: 16,
    fontWeight: 700
  },
  deleteText: { 
    margin: 0,
    color: '#7F1D1D', 
    fontSize: 14, 
    lineHeight: 1.6,
    opacity: 0.8
  }
};

const fs = {
  grid: { 
    display: 'grid', 
    gridTemplateColumns: '1fr 1fr', 
    gap: '16px 24px', 
    padding: '4px 0 12px' 
  },
  campo: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: 6 
  },
  label: { 
    fontSize: 12, 
    fontWeight: 600, 
    color: '#475569', 
    textTransform: 'uppercase', 
    letterSpacing: 0.5 
  },
  input: { 
    padding: '10px 14px', 
    borderRadius: 10, 
    border: '1.5px solid #E2E8F0', 
    fontSize: 14, 
    outline: 'none', 
    color: '#0F172A', 
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", 
    background: '#F8FAFC',
    transition: 'all 0.15s ease',
    ':focus': {
      borderColor: '#3B82F6',
      boxShadow: '0 0 0 4px rgba(59,130,246,0.1)',
      background: '#fff'
    }
  },
  estadoOpcion: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 16px',
    borderRadius: 10,
    border: '1.5px solid',
    cursor: 'pointer',
    fontSize: 13,
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    transition: 'all 0.15s ease',
    ':hover': {
      transform: 'translateY(-1px)'
    }
  },
  footer: { 
    display: 'flex', 
    justifyContent: 'flex-end', 
    gap: 12, 
    marginTop: 28, 
    paddingTop: 20, 
    borderTop: '1.5px solid #F1F5F9' 
  },
};

// Agregar keyframes para la animación del skeleton
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;
document.head.appendChild(styleSheet);
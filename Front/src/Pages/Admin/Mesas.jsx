import { useEffect, useState } from 'react';
import Layout from '../../components/admin/Layout';
import Modal  from '../../components/admin/Modal';
import { getMesas, crearMesa, editarMesa, eliminarMesa } from '../../services/adminService';

// ── ESTADOS ────────────────────────────────────────────────────────
const ESTADO_CONFIG = {
  libre:     { bg: '#D1FAE5', color: '#065F46', dot: '#10B981', border: '#6EE7B7', label: 'Libre'     },
  ocupada:   { bg: '#FEE2E2', color: '#991B1B', dot: '#EF4444', border: '#FCA5A5', label: 'Ocupada'   },
  reservada: { bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B', border: '#FCD34D', label: 'Reservada' },
  unida:     { bg: '#EDE9FE', color: '#5B21B6', dot: '#8B5CF6', border: '#C4B5FD', label: 'Unida'     },
};

const ESTADOS = ['libre', 'ocupada', 'reservada'];
const FORM_VACIO = { identificador_mesa: '', capacidad: 4, estado: 'libre' };

// ── TOAST ──────────────────────────────────────────────────────────
function Toast({ mensaje, error }) {
  if (!mensaje && !error) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: error ? '#FEF2F2' : '#F0FDF4',
      border: `1px solid ${error ? '#FECACA' : '#BBF7D0'}`,
      color: error ? '#991B1B' : '#065F46',
      borderRadius: 10, padding: '12px 16px',
      fontSize: 13, fontWeight: 600, marginBottom: 20,
    }}>
      {error
        ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      }
      {mensaje || error}
    </div>
  );
}

// ── TARJETA MESA ───────────────────────────────────────────────────
function MesaCard({ mesa, onEditar, onEliminar }) {
  const cc = ESTADO_CONFIG[mesa.estado] || ESTADO_CONFIG.libre;
  return (
    <div style={{ ...s.mesaCard, borderColor: cc.border }}>
      {/* Ícono */}
      <div style={{ ...s.mesaIcono, background: cc.bg }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={cc.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="8" width="18" height="4" rx="1"/>
          <line x1="7" y1="12" x2="7" y2="19"/><line x1="17" y1="12" x2="17" y2="19"/>
          <line x1="5" y1="19" x2="9" y2="19"/><line x1="15" y1="19" x2="19" y2="19"/>
          <line x1="7" y1="8" x2="7" y2="5"/><line x1="17" y1="8" x2="17" y2="5"/>
        </svg>
      </div>

      {/* Info */}
      <div style={s.mesaNombre}>{mesa.identificador_mesa}</div>

      {/* Estado badge */}
      <span style={{ ...s.estadoBadge, background: cc.bg, color: cc.color }}>
        <span style={{ ...s.dot, background: cc.dot }} />
        {cc.label}
      </span>

      {/* Capacidad */}
      <div style={s.capacidad}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
        </svg>
        {mesa.capacidad} personas
      </div>

      {/* Acciones */}
      <div style={s.cardBtns}>
        <button style={s.btnEdit} onClick={() => onEditar(mesa)}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Editar
        </button>
        <button style={s.btnDel} onClick={() => onEliminar(mesa)}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
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
  const [lista, setLista]     = useState([]);
  const [modal, setModal]     = useState(null);
  const [sel, setSel]         = useState(null);
  const [form, setForm]       = useState(FORM_VACIO);
  const [mensaje, setMensaje] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro]   = useState('todos');

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

  // Contadores
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
            <h1 style={s.titulo}>Planificación de Mesas</h1>
            <p style={s.subtitulo}>{lista.length} mesas en total · {contadores.ocupada || 0} ocupadas ahora</p>
          </div>
          <button style={s.btnPrimario} onClick={() => { setForm(FORM_VACIO); setModal('crear'); }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nueva mesa
          </button>
        </div>

        <Toast mensaje={mensaje} error={error} />

        {/* BANNERS RESUMEN */}
        <div style={s.statsRow}>
          {[
            { label: 'Total', valor: lista.length, bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
            { label: 'Libres',    valor: contadores.libre     || 0, bg: '#D1FAE5', color: '#065F46', border: '#6EE7B7' },
            { label: 'Ocupadas',  valor: contadores.ocupada   || 0, bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5' },
            { label: 'Reservadas',valor: contadores.reservada || 0, bg: '#FEF3C7', color: '#92400E', border: '#FCD34D' },
          ].map(stat => (
            <div key={stat.label} style={{ ...s.statCard, background: stat.bg, borderColor: stat.border }}>
              <span style={{ ...s.statValor, color: stat.color }}>{stat.valor}</span>
              <span style={{ ...s.statLabel, color: stat.color }}>{stat.label}</span>
            </div>
          ))}
        </div>

        {/* FILTROS */}
        <div style={s.chipsRow}>
          {[{ key: 'todos', label: 'Todas', count: lista.length },
            ...Object.entries(ESTADO_CONFIG).map(([k, v]) => ({ key: k, label: v.label, count: contadores[k] || 0 }))
          ].map(chip => (
            <button key={chip.key} style={{ ...s.chip, ...(filtro === chip.key ? s.chipActive : {}) }} onClick={() => setFiltro(chip.key)}>
              {chip.label}
              <span style={{ ...s.chipCount, ...(filtro === chip.key ? s.chipCountActive : {}) }}>{chip.count}</span>
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
          <div style={s.empty}>No hay mesas con ese estado</div>
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
        <Modal titulo={modal === 'crear' ? '🪑 Nueva mesa' : '✏️ Editar mesa'} onClose={() => setModal(null)}>
          <div style={fs.grid}>
            <div style={fs.campo}>
              <label style={fs.label}>Identificador</label>
              <input style={fs.input} placeholder="ej. Mesa 5, VIP 1, Terraza 2"
                value={form.identificador_mesa}
                onChange={e => setForm({ ...form, identificador_mesa: e.target.value })} />
            </div>
            <div style={fs.campo}>
              <label style={fs.label}>Capacidad (personas)</label>
              <input style={fs.input} type="number" min="1" placeholder="ej. 4"
                value={form.capacidad}
                onChange={e => setForm({ ...form, capacidad: parseInt(e.target.value) })} />
            </div>
            <div style={{ ...fs.campo, gridColumn: '1 / -1' }}>
              <label style={fs.label}>Estado</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {ESTADOS.map(e => {
                  const cfg = ESTADO_CONFIG[e];
                  const sel = form.estado === e;
                  return (
                    <button key={e} type="button"
                      style={{ ...fs.estadoOpcion, background: sel ? cfg.bg : '#F8FAFC', color: sel ? cfg.color : '#94A3B8', borderColor: sel ? cfg.border : '#E2E8F0', fontWeight: sel ? 700 : 500 }}
                      onClick={() => setForm({ ...form, estado: e })}>
                      <span style={{ ...s.dot, background: sel ? cfg.dot : '#CBD5E1' }} />
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
              {modal === 'crear' ? 'Agregar mesa' : 'Guardar cambios'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── MODAL ELIMINAR ── */}
      {modal === 'eliminar' && sel && (
        <Modal titulo="Eliminar mesa" onClose={() => setModal(null)}>
          <div style={{ padding: '8px 0 20px' }}>
            <div style={s.deleteWarning}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <p style={{ color: '#7F1D1D', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                ¿Estás seguro de eliminar <strong>{sel?.identificador_mesa}</strong>? Esta acción no se puede deshacer.
              </p>
            </div>
          </div>
          <div style={fs.footer}>
            <button style={s.btnSecundario} onClick={() => setModal(null)}>Cancelar</button>
            <button style={{ ...s.btnPrimario, background: '#DC2626', boxShadow: '0 4px 14px rgba(220,38,38,0.3)' }} onClick={handleEliminar}>
              Sí, eliminar
            </button>
          </div>
        </Modal>
      )}
    </Layout>
  );
}

// ── ESTILOS ────────────────────────────────────────────────────────
const s = {
  page:       { padding: '28px 32px', maxWidth: 1200, margin: '0 auto', fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif" },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  titulo:     { fontSize: 26, fontWeight: 800, color: '#0F1E2E', margin: 0, letterSpacing: -0.5 },
  subtitulo:  { color: '#64748B', fontSize: 13, marginTop: 4 },
  btnPrimario:{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 10, background: 'linear-gradient(135deg,#2563EB,#3B82F6)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, boxShadow: '0 4px 14px rgba(37,99,235,0.35)', fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif" },
  btnSecundario:{ padding: '10px 18px', borderRadius: 10, background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif" },
  statsRow:   { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 },
  statCard:   { borderRadius: 12, padding: '16px 20px', border: '1px solid', display: 'flex', flexDirection: 'column', gap: 4 },
  statValor:  { fontSize: 32, fontWeight: 800, letterSpacing: -1 },
  statLabel:  { fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.75 },
  chipsRow:   { display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  chip:       { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20, background: '#fff', border: '1px solid #E2E8F0', color: '#64748B', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif" },
  chipActive: { background: '#EFF6FF', borderColor: '#BFDBFE', color: '#1D4ED8' },
  chipCount:       { background: '#F1F5F9', color: '#94A3B8', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 700 },
  chipCountActive: { background: '#DBEAFE', color: '#1D4ED8' },
  grid:       { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: 14 },
  loadingGrid:{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: 14 },
  skelCard:   { height: 180, borderRadius: 14, background: 'linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' },
  empty:      { textAlign: 'center', color: '#94A3B8', fontSize: 14, padding: '40px 0' },
  mesaCard:   { background: '#fff', borderRadius: 14, padding: '18px 14px', border: '1.5px solid', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' },
  mesaIcono:  { width: 56, height: 56, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  mesaNombre: { fontSize: 15, fontWeight: 800, color: '#1E293B', letterSpacing: -0.3, textAlign: 'center' },
  estadoBadge:{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  dot:        { width: 7, height: 7, borderRadius: '50%', flexShrink: 0 },
  capacidad:  { display: 'flex', alignItems: 'center', gap: 4, color: '#94A3B8', fontSize: 12 },
  cardBtns:   { display: 'flex', gap: 7, width: '100%', marginTop: 2 },
  btnEdit:    { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '6px 8px', borderRadius: 7, background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif" },
  btnDel:     { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '6px 8px', borderRadius: 7, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif" },
  deleteWarning: { display: 'flex', alignItems: 'flex-start', gap: 14, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '14px 18px' },
};

const fs = {
  grid:       { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px', padding: '4px 0 8px' },
  campo:      { display: 'flex', flexDirection: 'column', gap: 5 },
  label:      { fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 },
  input:      { padding: '9px 12px', borderRadius: 9, border: '1px solid #E2E8F0', fontSize: 13, outline: 'none', color: '#1E293B', fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif", background: '#F8FAFC' },
  estadoOpcion:{ flex: 1, display: 'flex', alignItems: 'center', gap: 7, padding: '9px 12px', borderRadius: 9, border: '1.5px solid', cursor: 'pointer', fontSize: 13, fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif", transition: 'all 0.15s' },
  footer:     { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24, paddingTop: 20, borderTop: '1px solid #F1F5F9' },
};
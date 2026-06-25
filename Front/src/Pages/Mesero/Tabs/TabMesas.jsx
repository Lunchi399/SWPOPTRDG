import { useEffect, useState } from 'react';
import { getMesas, unirMesas, desunirMesa,
         getProductosDisponibles, crearPedido } from '../../../services/meseroService';

// ── ESTADOS ────────────────────────────────────────────────────────
const ESTADO_CONFIG = {
  libre:     { bg: '#D1FAE5', color: '#065F46', dot: '#10B981', border: '#6EE7B7', label: 'Libre'     },
  ocupada:   { bg: '#FEE2E2', color: '#991B1B', dot: '#EF4444', border: '#FCA5A5', label: 'Ocupada'   },
  unida:     { bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B', border: '#FCD34D', label: 'Unida'     },
  reservada: { bg: '#EDE9FE', color: '#5B21B6', dot: '#8B5CF6', border: '#C4B5FD', label: 'Reservada' },
};

const CAT_EMOJI = { entrada: '🥗', segundo: '🍛', bebida: '🥤', postre: '🍮' };

// ── TOAST ──────────────────────────────────────────────────────────
function Toast({ mensaje, error }) {
  if (!mensaje && !error) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: error ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${error ? '#FECACA' : '#BBF7D0'}`, color: error ? '#991B1B' : '#065F46', borderRadius: 10, padding: '11px 16px', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
      {error
        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      }
      {mensaje || error}
    </div>
  );
}

// ── TARJETA MESA ───────────────────────────────────────────────────
function MesaCard({ mesa, onNuevoPedido, onVerPedido, onUnir, onDesunir }) {
  const ec = ESTADO_CONFIG[mesa.estado] || ESTADO_CONFIG.libre;
  return (
    <div style={{ ...s.mesaCard, borderColor: ec.border }}>
      {/* Ícono mesa */}
      <div style={{ ...s.mesaIcono, background: ec.bg }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={ec.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="8" width="18" height="4" rx="1"/>
          <line x1="7" y1="12" x2="7" y2="19"/><line x1="17" y1="12" x2="17" y2="19"/>
          <line x1="5" y1="19" x2="9" y2="19"/><line x1="15" y1="19" x2="19" y2="19"/>
          <line x1="7" y1="8" x2="7" y2="5"/><line x1="17" y1="8" x2="17" y2="5"/>
        </svg>
      </div>

      {/* Info */}
      <div style={s.mesaNombre}>{mesa.identificador_mesa}</div>
      <span style={{ ...s.estadoBadge, background: ec.bg, color: ec.color }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: ec.dot, display: 'inline-block', marginRight: 5 }} />
        {ec.label}
      </span>
      <div style={s.mesaCap}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
        </svg>
        {mesa.capacidad} personas
      </div>

      {/* Acciones según estado */}
      <div style={s.mesaBtns}>
        {mesa.estado === 'libre' && (
          <>
            <button style={s.btnVerde} onClick={() => onNuevoPedido(mesa)}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Pedido
            </button>
            <button style={s.btnAmbar} onClick={() => onUnir(mesa)}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              Unir
            </button>
          </>
        )}
        {mesa.estado === 'ocupada' && (
          <button style={s.btnAzul} onClick={() => onVerPedido(mesa)}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            Ver pedido
          </button>
        )}
        {mesa.estado === 'unida' && (
          <button style={s.btnAmbar} onClick={() => onDesunir(mesa)}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18.84 12.25l1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.006 5.006 0 0 0-6.95 0l-1.72 1.71"/>
              <path d="M5.17 11.75l-1.72 1.71a5.004 5.004 0 0 0 .12 7.07 5.006 5.006 0 0 0 6.95 0l1.72-1.71"/>
              <line x1="8" y1="2" x2="8" y2="5"/><line x1="2" y1="8" x2="5" y2="8"/>
              <line x1="16" y1="19" x2="16" y2="22"/><line x1="19" y1="16" x2="22" y2="16"/>
            </svg>
            Separar
          </button>
        )}
      </div>
    </div>
  );
}

// ── COMPONENTE PRINCIPAL ───────────────────────────────────────────
export default function TabMesas({ onVerPedido }) {
  const [mesas,   setMesas]   = useState([]);
  const [platos,  setPlatos]  = useState([]);
  const [modal,   setModal]   = useState(null);
  const [mesaSel, setMesaSel] = useState(null);
  const [unirSel, setUnirSel] = useState(null);
  const [pedido,  setPedido]  = useState({ observaciones: '', detalles: [] });
  const [mensaje, setMensaje] = useState('');
  const [error,   setError]   = useState('');
  const [filtro,  setFiltro]  = useState('todos');

  const cargar = () => getMesas().then(r => setMesas(r.data));

  useEffect(() => {
    cargar();
    getProductosDisponibles().then(r => setPlatos(r.data));
    const iv = setInterval(cargar, 10000);
    return () => clearInterval(iv);
  }, []);

  const mostrar = (msg, err = false) => {
    err ? setError(msg) : setMensaje(msg);
    setTimeout(() => { setMensaje(''); setError(''); }, 3000);
  };

  const abrirPedido = (mesa) => {
    setMesaSel(mesa);
    setPedido({ observaciones: '', detalles: [] });
    setModal('pedido');
  };

  const agregarPlato = (plato) => {
    setPedido(prev => {
      const existe = prev.detalles.find(d => d.id_producto === plato.id_producto);
      if (existe) return { ...prev, detalles: prev.detalles.map(d => d.id_producto === plato.id_producto ? { ...d, cantidad: d.cantidad + 1 } : d) };
      return { ...prev, detalles: [...prev.detalles, { id_producto: plato.id_producto, nombre: plato.nombre, precio: parseFloat(plato.precio), cantidad: 1 }] };
    });
  };

  const quitarPlato  = (id) => setPedido(prev => ({ ...prev, detalles: prev.detalles.filter(d => d.id_producto !== id) }));
  const cambiarCant  = (id, delta) => setPedido(prev => ({ ...prev, detalles: prev.detalles.map(d => d.id_producto === id ? { ...d, cantidad: Math.max(1, d.cantidad + delta) } : d) }));
  const total = () => pedido.detalles.reduce((s, d) => s + d.precio * d.cantidad, 0).toFixed(2);

  const handleCrearPedido = async () => {
    if (pedido.detalles.length === 0) { mostrar('Agrega al menos un plato', true); return; }
    try {
      await crearPedido({ id_mesa: mesaSel.id_mesa, observaciones: pedido.observaciones, detalles: pedido.detalles });
      mostrar(`Pedido enviado a cocina — ${mesaSel.identificador_mesa}`);
      setModal(null); cargar();
    } catch (e) { mostrar(e.response?.data?.error || 'Error al crear pedido', true); }
  };

  const handleUnir = async () => {
    if (!unirSel) { mostrar('Selecciona la mesa a unir', true); return; }
    try {
      await unirMesas({ mesa_id: mesaSel.id_mesa, mesa_unir_id: unirSel });
      mostrar('Mesas unidas correctamente');
      setModal(null); setUnirSel(null); cargar();
    } catch (e) { mostrar(e.response?.data?.error || 'Error al unir mesas', true); }
  };

  const handleDesunir = async (mesa) => {
    try { await desunirMesa(mesa.id_mesa); mostrar(`${mesa.identificador_mesa} separada`); cargar(); }
    catch (e) { mostrar(e.response?.data?.error || 'Error', true); }
  };

  const categorias = [...new Set(platos.map(p => p.categoria))];
  const mesasFiltradas = filtro === 'todos' ? mesas : mesas.filter(m => m.estado === filtro);
  const contadores = Object.keys(ESTADO_CONFIG).reduce((acc, k) => { acc[k] = mesas.filter(m => m.estado === k).length; return acc; }, {});

  return (
    <div style={s.wrap}>
      <Toast mensaje={mensaje} error={error} />

      {/* Header */}
      <div style={s.topbar}>
        <div>
          <h2 style={s.titulo}>Mapa de mesas</h2>
          <p style={s.subtitulo}>{mesas.length} mesas · actualiza cada 10s</p>
        </div>
        <div style={s.leyenda}>
          {Object.entries(ESTADO_CONFIG).map(([k, v]) => (
            <span key={k} style={{ ...s.leyendaItem, background: v.bg, color: v.color }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: v.dot, display: 'inline-block', marginRight: 5 }} />
              {v.label} ({contadores[k] || 0})
            </span>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div style={s.chipsRow}>
        {[{ key: 'todos', label: 'Todas', count: mesas.length },
          ...Object.entries(ESTADO_CONFIG).map(([k, v]) => ({ key: k, label: v.label, count: contadores[k] || 0 }))
        ].map(chip => (
          <button key={chip.key} style={{ ...s.chip, ...(filtro === chip.key ? s.chipActive : {}) }} onClick={() => setFiltro(chip.key)}>
            {chip.label} <span style={{ ...s.chipCount, ...(filtro === chip.key ? s.chipCountActive : {}) }}>{chip.count}</span>
          </button>
        ))}
      </div>

      {/* Grid mesas */}
      <div style={s.grid}>
        {mesasFiltradas.map(mesa => (
          <MesaCard key={mesa.id_mesa} mesa={mesa}
            onNuevoPedido={abrirPedido}
            onVerPedido={onVerPedido}
            onUnir={(m) => { setMesaSel(m); setModal('unir'); }}
            onDesunir={handleDesunir}
          />
        ))}
      </div>

      {/* ── MODAL NUEVO PEDIDO ── */}
      {modal === 'pedido' && (
        <div style={s.overlay} onClick={() => setModal(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={s.modalHeader}>
              <div>
                <h3 style={s.modalTitulo}>Nuevo pedido</h3>
                <p style={s.modalSub}>{mesaSel?.identificador_mesa}</p>
              </div>
              <button style={s.closeBtn} onClick={() => setModal(null)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div style={s.modalBody}>
              {/* Observaciones */}
              <textarea style={s.textarea}
                placeholder="Observaciones del pedido (opcional)..."
                value={pedido.observaciones}
                onChange={e => setPedido({ ...pedido, observaciones: e.target.value })} />

              {/* Carta por categoría */}
              {categorias.map(cat => (
                <div key={cat} style={{ marginBottom: 16 }}>
                  <div style={s.catLabel}>
                    {CAT_EMOJI[cat] || '🍽️'} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </div>
                  <div style={s.platosGrid}>
                    {platos.filter(p => p.categoria === cat).map(p => (
                      <button key={p.id_producto} style={s.platoBtn} onClick={() => agregarPlato(p)}>
                        <span style={s.platoNombre}>{p.nombre}</span>
                        <span style={s.platoPrecio}>S/ {Number(p.precio).toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Resumen pedido */}
              {pedido.detalles.length > 0 && (
                <div style={s.resumen}>
                  <div style={s.resumenTitulo}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                      <line x1="3" y1="6" x2="21" y2="6"/>
                    </svg>
                    Pedido actual
                  </div>
                  {pedido.detalles.map(d => (
                    <div key={d.id_producto} style={s.detalleRow}>
                      <span style={s.detalleNombre}>{d.nombre}</span>
                      <div style={s.cantCtrl}>
                        <button style={s.ctrlBtn} onClick={() => cambiarCant(d.id_producto, -1)}>−</button>
                        <span style={s.cantNum}>{d.cantidad}</span>
                        <button style={s.ctrlBtn} onClick={() => cambiarCant(d.id_producto, 1)}>+</button>
                      </div>
                      <span style={s.detallePrecio}>S/ {(d.precio * d.cantidad).toFixed(2)}</span>
                      <button style={s.quitarBtn} onClick={() => quitarPlato(d.id_producto)}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                  <div style={s.totalRow}>
                    <span style={{ fontWeight: 700, color: '#1E293B' }}>Total estimado</span>
                    <span style={{ fontWeight: 800, fontSize: 16, color: '#065F46' }}>S/ {total()}</span>
                  </div>
                </div>
              )}
            </div>

            <div style={s.modalFooter}>
              <button style={s.btnSecundario} onClick={() => setModal(null)}>Cancelar</button>
              <button style={s.btnVerde} onClick={handleCrearPedido}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                Confirmar y enviar a cocina
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL UNIR MESAS ── */}
      {modal === 'unir' && (
        <div style={s.overlay} onClick={() => setModal(null)}>
          <div style={{ ...s.modal, maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div>
                <h3 style={s.modalTitulo}>Unir mesas</h3>
                <p style={s.modalSub}>Mesa principal: {mesaSel?.identificador_mesa}</p>
              </div>
              <button style={s.closeBtn} onClick={() => setModal(null)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <p style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>Selecciona la mesa a unir:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {mesas.filter(m => m.id_mesa !== mesaSel?.id_mesa && m.estado === 'libre').map(m => (
                  <button key={m.id_mesa} style={{ ...s.mesaOpcion, background: unirSel === m.id_mesa ? '#EFF6FF' : '#F8FAFC', borderColor: unirSel === m.id_mesa ? '#2563EB' : '#E2E8F0', color: unirSel === m.id_mesa ? '#1D4ED8' : '#475569', fontWeight: unirSel === m.id_mesa ? 700 : 500 }}
                    onClick={() => setUnirSel(m.id_mesa)}>
                    <span>{m.identificador_mesa}</span>
                    <span style={{ fontSize: 12, opacity: 0.7 }}>Cap. {m.capacidad}</span>
                  </button>
                ))}
              </div>
            </div>
            <div style={s.modalFooter}>
              <button style={s.btnSecundario} onClick={() => setModal(null)}>Cancelar</button>
              <button style={s.btnAzul} onClick={handleUnir}>Unir mesas</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ESTILOS ────────────────────────────────────────────────────────
const s = {
  wrap:     { fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif" },
  topbar:   { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 },
  titulo:   { fontSize: 20, fontWeight: 800, color: '#0F1E2E', margin: 0, letterSpacing: -0.3 },
  subtitulo:{ color: '#94A3B8', fontSize: 12, marginTop: 3 },
  leyenda:  { display: 'flex', gap: 6, flexWrap: 'wrap' },
  leyendaItem:{ display: 'flex', alignItems: 'center', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20 },
  chipsRow: { display: 'flex', gap: 7, marginBottom: 16, flexWrap: 'wrap' },
  chip:     { display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 20, background: '#fff', border: '1px solid #E2E8F0', color: '#64748B', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif" },
  chipActive:{ background: '#EFF6FF', borderColor: '#BFDBFE', color: '#1D4ED8' },
  chipCount:{ background: '#F1F5F9', color: '#94A3B8', borderRadius: 20, padding: '1px 6px', fontSize: 10, fontWeight: 700 },
  chipCountActive:{ background: '#DBEAFE', color: '#1D4ED8' },
  grid:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 12 },
  mesaCard: { background: '#fff', borderRadius: 14, padding: '16px 12px', border: '1.5px solid', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' },
  mesaIcono:{ width: 50, height: 50, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  mesaNombre:{ fontSize: 14, fontWeight: 800, color: '#1E293B', letterSpacing: -0.2 },
  estadoBadge:{ display: 'flex', alignItems: 'center', fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20 },
  mesaCap:  { display: 'flex', alignItems: 'center', gap: 4, color: '#94A3B8', fontSize: 11 },
  mesaBtns: { display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'center', width: '100%' },
  btnVerde: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '7px 8px', borderRadius: 8, background: 'linear-gradient(135deg,#059669,#10B981)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif" },
  btnAzul:  { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '7px 8px', borderRadius: 8, background: 'linear-gradient(135deg,#2563EB,#3B82F6)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif" },
  btnAmbar: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '7px 8px', borderRadius: 8, background: 'linear-gradient(135deg,#D97706,#F59E0B)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif" },
  btnSecundario:{ padding: '9px 16px', borderRadius: 9, background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif" },
  // Modal
  overlay:  { position: 'fixed', inset: 0, background: 'rgba(10,20,35,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 },
  modal:    { background: '#fff', borderRadius: 16, width: '100%', maxWidth: 540, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.28)' },
  modalHeader:{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 24px 16px', borderBottom: '1px solid #F1F5F9' },
  modalTitulo:{ fontSize: 17, fontWeight: 800, color: '#0F1E2E', margin: 0, letterSpacing: -0.3 },
  modalSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  closeBtn: { background: '#F1F5F9', border: 'none', borderRadius: 8, cursor: 'pointer', padding: '7px 8px', color: '#64748B', display: 'flex', alignItems: 'center' },
  modalBody:{ flex: 1, overflowY: 'auto', padding: '16px 24px' },
  modalFooter:{ display: 'flex', gap: 10, justifyContent: 'flex-end', padding: '14px 24px', borderTop: '1px solid #F1F5F9' },
  textarea: { width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid #E2E8F0', fontSize: 13, resize: 'vertical', minHeight: 60, marginBottom: 16, fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif", boxSizing: 'border-box', outline: 'none', color: '#334155' },
  catLabel: { fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 },
  platosGrid:{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 },
  platoBtn: { padding: '10px 12px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 3, textAlign: 'left', transition: 'all 0.15s', fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif" },
  platoNombre:{ fontWeight: 700, fontSize: 12, color: '#1E293B' },
  platoPrecio:{ fontSize: 11, color: '#059669', fontWeight: 600 },
  resumen:  { marginTop: 16, background: '#F8FAFC', borderRadius: 10, padding: '12px 14px', border: '1px solid #E2E8F0' },
  resumenTitulo:{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: '#1E293B', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  detalleRow:{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid #F1F5F9' },
  detalleNombre:{ flex: 1, fontSize: 13, color: '#334155', fontWeight: 500 },
  cantCtrl: { display: 'flex', alignItems: 'center', gap: 6 },
  ctrlBtn:  { width: 24, height: 24, borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#475569' },
  cantNum:  { fontSize: 13, fontWeight: 700, minWidth: 22, textAlign: 'center', color: '#1E293B' },
  detallePrecio:{ fontSize: 13, fontWeight: 700, color: '#059669', minWidth: 64, textAlign: 'right' },
  quitarBtn:{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5px', borderRadius: 6, border: 'none', background: '#FEE2E2', color: '#DC2626', cursor: 'pointer' },
  totalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, marginTop: 4 },
  mesaOpcion:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 9, border: '1.5px solid', cursor: 'pointer', fontSize: 13, fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif", transition: 'all 0.15s' },
};
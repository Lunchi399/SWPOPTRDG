import { useEffect, useState } from 'react';
import { getMesas, unirMesas, desunirMesa,
         getProductosDisponibles, crearPedido } from '../../../services/meseroService';

// ── ESTADOS (Colores refinados y más suaves) ──────────────
const ESTADO_CONFIG = {
  libre:     { bg: '#ECFDF5', color: '#047857', dot: '#10B981', label: 'Libre'     },
  ocupada:   { bg: '#FEF2F2', color: '#B91C1C', dot: '#EF4444', label: 'Ocupada'   },
  unida:     { bg: '#FFFBEB', color: '#B45309', dot: '#F59E0B', label: 'Unida'     },
  reservada: { bg: '#F5F3FF', color: '#6D28D9', dot: '#8B5CF6', label: 'Reservada' },
};

const CAT_EMOJI = { entrada: '🥗', segundo: '🍛', bebida: '🥤', postre: '🍮' };

// ── TOAST ──────────────────────────────────────────────────────────
function Toast({ mensaje, error }) {
  if (!mensaje && !error) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: error ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${error ? '#FECACA' : '#BBF7D0'}`, color: error ? '#991B1B' : '#065F46', borderRadius: 12, padding: '12px 18px', fontSize: 13, fontWeight: 600, marginBottom: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      {error
        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      }
      {mensaje || error}
    </div>
  );
}

// ── TARJETA MESA ───────────────────────────────────────────────────
function MesaCard({ mesa, onNuevoPedido, onVerPedido, onUnir, onDesunir }) {
  const ec = ESTADO_CONFIG[mesa.estado] || ESTADO_CONFIG.libre;
  return (
    <div style={s.mesaCard}>
      {/* Ícono mesa en círculo pastel */}
      <div style={{ ...s.mesaIcono, background: ec.bg }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ec.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="8" width="18" height="4" rx="1"/>
          <line x1="7" y1="12" x2="7" y2="19"/><line x1="17" y1="12" x2="17" y2="19"/>
          <line x1="5" y1="19" x2="9" y2="19"/><line x1="15" y1="19" x2="19" y2="19"/>
          <line x1="7" y1="8" x2="7" y2="5"/><line x1="17" y1="8" x2="17" y2="5"/>
        </svg>
      </div>

      {/* Info central */}
      <div style={s.mesaInfoWrap}>
        <div style={s.mesaNombre}>{mesa.identificador_mesa}</div>
        <div style={s.mesaCap}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
          </svg>
          {mesa.capacidad} pers.
        </div>
      </div>

      <span style={{ ...s.estadoBadge, background: ec.bg, color: ec.color }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: ec.dot, display: 'inline-block', marginRight: 6 }} />
        {ec.label}
      </span>

      {/* Acciones según estado */}
      <div style={s.mesaBtns}>
        {mesa.estado === 'libre' && (
          <>
            <button style={s.btnPrimario} onClick={() => onNuevoPedido(mesa)}>
              + Pedido
            </button>
            <button style={s.btnSecundarioLigero} onClick={() => onUnir(mesa)}>
              Unir
            </button>
          </>
        )}
        {mesa.estado === 'ocupada' && (
          <button style={s.btnSecundarioLigero} onClick={() => onVerPedido(mesa)}>
            Ver detalle
          </button>
        )}
        {mesa.estado === 'unida' && (
          <button style={s.btnSecundarioLigero} onClick={() => onDesunir(mesa)}>
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

      {/* Filtros estilo Tabs */}
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
            <div style={s.modalHeader}>
              <div>
                <h3 style={s.modalTitulo}>Nuevo pedido</h3>
                <p style={s.modalSub}>{mesaSel?.identificador_mesa}</p>
              </div>
              <button style={s.closeBtn} onClick={() => setModal(null)}>✕</button>
            </div>

            <div style={s.modalBody}>
              <textarea style={s.textarea}
                placeholder="Observaciones del pedido (opcional)..."
                value={pedido.observaciones}
                onChange={e => setPedido({ ...pedido, observaciones: e.target.value })} />

              {categorias.map(cat => (
                <div key={cat} style={{ marginBottom: 20 }}>
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

              {pedido.detalles.length > 0 && (
                <div style={s.resumen}>
                  <div style={s.resumenTitulo}>Resumen de la orden</div>
                  {pedido.detalles.map(d => (
                    <div key={d.id_producto} style={s.detalleRow}>
                      <span style={s.detalleNombre}>{d.nombre}</span>
                      <div style={s.cantCtrl}>
                        <button style={s.ctrlBtn} onClick={() => cambiarCant(d.id_producto, -1)}>−</button>
                        <span style={s.cantNum}>{d.cantidad}</span>
                        <button style={s.ctrlBtn} onClick={() => cambiarCant(d.id_producto, 1)}>+</button>
                      </div>
                      <span style={s.detallePrecio}>S/ {(d.precio * d.cantidad).toFixed(2)}</span>
                      <button style={s.quitarBtn} onClick={() => quitarPlato(d.id_producto)}>✕</button>
                    </div>
                  ))}
                  <div style={s.totalRow}>
                    <span style={{ fontWeight: 600, color: '#64748B' }}>Total estimado</span>
                    <span style={{ fontWeight: 800, fontSize: 18, color: '#0F172A' }}>S/ {total()}</span>
                  </div>
                </div>
              )}
            </div>

            <div style={s.modalFooter}>
              <button style={s.btnSecundario} onClick={() => setModal(null)}>Cancelar</button>
              <button style={s.btnPrimarioLargo} onClick={handleCrearPedido}>Enviar a cocina</button>
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
                <p style={s.modalSub}>Principal: {mesaSel?.identificador_mesa}</p>
              </div>
              <button style={s.closeBtn} onClick={() => setModal(null)}>✕</button>
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>¿Con qué mesa libre deseas unirla?</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {mesas.filter(m => m.id_mesa !== mesaSel?.id_mesa && m.estado === 'libre').map(m => (
                  <button key={m.id_mesa} style={{ ...s.mesaOpcion, background: unirSel === m.id_mesa ? '#F8FAFC' : '#fff', borderColor: unirSel === m.id_mesa ? '#0F172A' : '#E2E8F0', color: unirSel === m.id_mesa ? '#0F172A' : '#475569', boxShadow: unirSel === m.id_mesa ? '0 0 0 1px #0F172A' : 'none' }}
                    onClick={() => setUnirSel(m.id_mesa)}>
                    <span style={{ fontWeight: 600 }}>{m.identificador_mesa}</span>
                    <span style={{ fontSize: 12, color: '#94A3B8' }}>Cap. {m.capacidad}</span>
                  </button>
                ))}
              </div>
            </div>
            <div style={s.modalFooter}>
              <button style={s.btnSecundario} onClick={() => setModal(null)}>Cancelar</button>
              <button style={s.btnPrimario} onClick={handleUnir}>Unir ahora</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ESTILOS ────────────────────────────────────────────────────────
const s = {
  wrap:     { fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif", padding: '0 0 24px 0' },
  topbar:   { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 },
  titulo:   { fontSize: 24, fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' },
  subtitulo:{ color: '#64748B', fontSize: 13, marginTop: 4, fontWeight: 500 },
  leyenda:  { display: 'flex', gap: 8, flexWrap: 'wrap', background: '#F8FAFC', padding: '6px 8px', borderRadius: 12, border: '1px solid #E2E8F0' },
  leyendaItem:{ display: 'flex', alignItems: 'center', fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 8 },
  chipsRow: { display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap', paddingBottom: 8 },
  chip:     { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 24, background: '#fff', border: '1px solid #E2E8F0', color: '#64748B', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: "inherit", transition: 'all 0.2s' },
  chipActive:{ background: '#0F172A', borderColor: '#0F172A', color: '#fff' },
  chipCount:{ background: '#F1F5F9', color: '#64748B', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700 },
  chipCountActive:{ background: 'rgba(255,255,255,0.2)', color: '#fff' },
  grid:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 },
  
  // Tarjetas rediseñadas
  mesaCard: { background: '#fff', borderRadius: 16, padding: '20px 16px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', transition: 'box-shadow 0.2s' },
  mesaIcono:{ width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  mesaInfoWrap:{ textAlign: 'center' },
  mesaNombre:{ fontSize: 16, fontWeight: 800, color: '#0F172A' },
  mesaCap:  { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#64748B', fontSize: 12, marginTop: 4, fontWeight: 500 },
  estadoBadge:{ display: 'flex', alignItems: 'center', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 24 },
  mesaBtns: { display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', width: '100%', marginTop: 4 },
  
  // Botones sólidos y limpios
  btnPrimario: { flex: 1, padding: '8px 12px', borderRadius: 10, background: '#0F172A', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: "inherit" },
  btnSecundarioLigero: { flex: 1, padding: '8px 12px', borderRadius: 10, background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: "inherit" },
  btnPrimarioLargo: { padding: '10px 20px', borderRadius: 10, background: '#0F172A', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: "inherit" },
  btnSecundario:{ padding: '10px 16px', borderRadius: 10, background: '#fff', color: '#475569', border: '1px solid #CBD5E1', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: "inherit" },
  
  // Modales refinados
  overlay:  { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 },
  modal:    { background: '#fff', borderRadius: 20, width: '100%', maxWidth: 540, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' },
  modalHeader:{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '24px 24px 20px', borderBottom: '1px solid #F1F5F9' },
  modalTitulo:{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 },
  modalSub: { fontSize: 13, color: '#64748B', marginTop: 4, fontWeight: 500 },
  closeBtn: { background: '#F1F5F9', border: 'none', borderRadius: 10, cursor: 'pointer', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontWeight: 'bold' },
  modalBody:{ flex: 1, overflowY: 'auto', padding: '20px 24px' },
  modalFooter:{ display: 'flex', gap: 12, justifyContent: 'flex-end', padding: '16px 24px', borderTop: '1px solid #F1F5F9', background: '#F8FAFC', borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  textarea: { width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #CBD5E1', fontSize: 13, resize: 'vertical', minHeight: 70, marginBottom: 20, fontFamily: "inherit", boxSizing: 'border-box', outline: 'none', color: '#0F172A', transition: 'border-color 0.2s' },
  catLabel: { fontSize: 13, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 },
  platosGrid:{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  platoBtn: { padding: '12px 14px', borderRadius: 12, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'left', transition: 'border-color 0.2s, box-shadow 0.2s', fontFamily: "inherit" },
  platoNombre:{ fontWeight: 700, fontSize: 13, color: '#0F172A' },
  platoPrecio:{ fontSize: 12, color: '#047857', fontWeight: 700 },
  resumen:  { marginTop: 24, background: '#F8FAFC', borderRadius: 16, padding: '16px 20px', border: '1px solid #E2E8F0' },
  resumenTitulo:{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  detalleRow:{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #E2E8F0' },
  detalleNombre:{ flex: 1, fontSize: 13, color: '#334155', fontWeight: 600 },
  cantCtrl: { display: 'flex', alignItems: 'center', gap: 8 },
  ctrlBtn:  { width: 26, height: 26, borderRadius: 6, border: '1px solid #CBD5E1', background: '#fff', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#475569' },
  cantNum:  { fontSize: 13, fontWeight: 700, minWidth: 20, textAlign: 'center', color: '#0F172A' },
  detallePrecio:{ fontSize: 13, fontWeight: 700, color: '#047857', minWidth: 64, textAlign: 'right' },
  quitarBtn:{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 6, border: 'none', background: '#FEE2E2', color: '#DC2626', cursor: 'pointer', fontWeight: 'bold', fontSize: 12 },
  totalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, marginTop: 8 },
  mesaOpcion:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: 12, border: '1px solid', cursor: 'pointer', fontSize: 13, fontFamily: "inherit", transition: 'all 0.2s' },
};
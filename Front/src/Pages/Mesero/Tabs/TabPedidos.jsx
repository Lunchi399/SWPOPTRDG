import { useEffect, useState } from 'react';
import { getPedidos, cambiarEstado, cancelarPedido } from '../../../services/meseroService';

// ── ESTADOS (Colores premium, misma estructura lógica) ──────────────
const ESTADO_INFO = {
  borrador:   { color: '#475569', bg: '#F1F5F9', dot: '#94A3B8', label: 'Borrador',   siguiente: null },
  confirmado: { color: '#1D4ED8', bg: '#EFF6FF', dot: '#3B82F6', label: 'Confirmado', siguiente: null },
  en_cocina:  { color: '#B45309', bg: '#FFFBEB', dot: '#F59E0B', label: 'En cocina',  siguiente: null },
  listo:      { color: '#047857', bg: '#ECFDF5', dot: '#10B981', label: '¡Listo!',    siguiente: 'despachar' },
  despachado: { color: '#6D28D9', bg: '#F5F3FF', dot: '#8B5CF6', label: 'Despachado', siguiente: null },
  pagado:     { color: '#0F172A', bg: '#E2E8F0', dot: '#475569', label: 'Pagado',     siguiente: null },
  cancelado:  { color: '#B91C1C', bg: '#FEF2F2', dot: '#EF4444', label: 'Cancelado',  siguiente: null },
};

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

// ── COMPONENTE PRINCIPAL ───────────────────────────────────────────
export default function TabPedidos({ mesaInicial }) {
  const [pedidos,  setPedidos]  = useState([]);
  const [filtro,   setFiltro]   = useState('activos');
  const [mensaje,  setMensaje]  = useState('');
  const [error,    setError]    = useState('');

  const cargar = () => getPedidos().then(r => setPedidos(r.data));

  useEffect(() => {
    cargar();
    const iv = setInterval(cargar, 8000);
    return () => clearInterval(iv);
  }, []);

  const mostrar = (msg, err = false) => {
    err ? setError(msg) : setMensaje(msg);
    setTimeout(() => { setMensaje(''); setError(''); }, 3000);
  };

  const handleDespachar = async (pedido) => {
    try {
      await cambiarEstado(pedido.id_pedidos, 'despachar');
      mostrar(`Pedido #${pedido.id_pedidos} entregado al cliente`);
      cargar();
    } catch (e) {
      mostrar(e.response?.data?.error || 'Error al despachar', true);
    }
  };

  const handleCancelar = async (pedido) => {
    if (!window.confirm('¿Cancelar este pedido?')) return;
    try {
      await cancelarPedido(pedido.id_pedidos);
      mostrar(`Pedido #${pedido.id_pedidos} cancelado`);
      cargar();
    } catch (e) {
      mostrar(e.response?.data?.error || 'Error al cancelar', true);
    }
  };

  const FILTROS = {
    activos:   ['confirmado', 'en_cocina', 'listo', 'despachado'],
    listos:    ['listo'],
    historial: ['pagado', 'cancelado'],
  };

  const pedidosFiltrados = pedidos.filter(p => FILTROS[filtro]?.includes(p.estado));
  const cantListos = pedidos.filter(p => p.estado === 'listo').length;

  return (
    <div style={s.wrap}>
      <Toast mensaje={mensaje} error={error} />

      {/* Header y Filtros (Estilo Tabs) */}
      <div style={s.chipsRow}>
        {[
          { id: 'activos',   label: 'Activos' },
          { id: 'listos',    label: `Listos para entregar`, count: cantListos },
          { id: 'historial', label: 'Historial' },
        ].map(f => {
          const isActive = filtro === f.id;
          const isListoYActivo = f.id === 'listos' && cantListos > 0;
          return (
            <button key={f.id} style={{ ...s.chip, ...(isActive ? s.chipActive : {}), ...(isListoYActivo && !isActive ? s.chipAlerta : {}) }} onClick={() => setFiltro(f.id)}>
              {f.label} 
              {f.count > 0 && (
                <span style={{ ...s.chipCount, ...(isActive ? s.chipCountActive : {}), ...(isListoYActivo && !isActive ? s.chipCountAlerta : {}) }}>
                  {f.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Lista de pedidos */}
      {pedidosFiltrados.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>🍽️</div>
          No hay pedidos {filtro === 'activos' ? 'activos' : filtro === 'listos' ? 'listos para entregar' : 'en el historial'} en este momento.
        </div>
      ) : (
        <div style={s.lista}>
          {pedidosFiltrados.map(p => {
            const ei = ESTADO_INFO[p.estado] || ESTADO_INFO.confirmado;
            const esListo = p.estado === 'listo';
            return (
              <div key={p.id_pedidos} style={{ ...s.card, ...(esListo ? { boxShadow: '0 0 0 2px #10B981', borderColor: '#10B981' } : {}) }}>
                
                {/* Cabecera del pedido */}
                <div style={s.cardHeader}>
                  <div style={s.cardHeaderLeft}>
                    <span style={s.mesaTxt}>Mesa {p.mesa_identificador || '—'}</span>
                    <span style={{ ...s.estadoPill, background: ei.bg, color: ei.color }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: ei.dot, display: 'inline-block', marginRight: 5 }} />
                      {ei.label}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={s.pedidoId}>#{p.id_pedidos}</div>
                    <div style={s.horaTxt}>{new Date(p.tiempo_creacion).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>

                {/* Barra de progreso visual (Stepper) */}
                <div style={s.progresoWrap}>
                  {['confirmado', 'en_cocina', 'listo', 'despachado', 'pagado'].map((est, i) => {
                    const estados = ['confirmado', 'en_cocina', 'listo', 'despachado', 'pagado'];
                    const idx = estados.indexOf(p.estado);
                    const isCompletado = i < idx;
                    const isActual = i === idx;
                    const info = ESTADO_INFO[est];
                    
                    return (
                      <div key={est} style={s.progresoItem}>
                        <div style={s.progresoLineaWrap}>
                          {i !== 0 && <div style={{ ...s.lineaConectora, background: isCompletado || isActual ? info.dot : '#E2E8F0' }} />}
                          <div style={{ ...s.progresoDot, background: isCompletado || isActual ? info.dot : '#F1F5F9', border: `2px solid ${isActual ? info.color : isCompletado ? info.dot : '#E2E8F0'}` }} />
                          {i !== 4 && <div style={{ ...s.lineaConectora, background: isCompletado ? ESTADO_INFO[estados[i+1]].dot : '#E2E8F0' }} />}
                        </div>
                        <div style={{ fontSize: 10, color: isActual ? '#0F172A' : isCompletado ? '#475569' : '#94A3B8', fontWeight: isActual ? 700 : 500, marginTop: 4 }}>
                          {ESTADO_INFO[est]?.label}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Detalles del pedido (Platos) */}
                <div style={s.detalles}>
                  {p.detalles?.map(d => (
                    <div key={d.id_detalle} style={s.detalleItem}>
                      <span style={s.detalleCantNombre}>
                        <span style={s.cantBadge}>{d.cantidad}</span> {d.producto_nombre}
                      </span>
                      <span style={s.detallePrecio}>S/ {Number(d.subtotal).toFixed(2)}</span>
                    </div>
                  ))}
                  {p.observaciones && (
                    <div style={s.obs}>
                      <span style={{fontWeight: 'bold'}}>Nota:</span> {p.observaciones}
                    </div>
                  )}
                </div>

                {/* Footer (Total y Acciones) */}
                <div style={s.cardFooter}>
                  <div style={s.totalTxt}>Total: S/ {Number(p.total).toFixed(2)}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {esListo && (
                      <button style={s.btnExito} onClick={() => handleDespachar(p)}>
                        Entregar al cliente
                      </button>
                    )}
                    {['borrador', 'confirmado'].includes(p.estado) && (
                      <button style={s.btnSecundarioLigero} onClick={() => handleCancelar(p)}>
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── ESTILOS ────────────────────────────────────────────────────────
const s = {
  wrap:     { fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif", padding: '0 0 24px 0' },
  
  // Filtros (Chips)
  chipsRow: { display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' },
  chip:     { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 24, background: '#fff', border: '1px solid #E2E8F0', color: '#64748B', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: "inherit", transition: 'all 0.2s' },
  chipActive:{ background: '#0F172A', borderColor: '#0F172A', color: '#fff' },
  chipAlerta:{ borderColor: '#10B981', color: '#047857', background: '#ECFDF5' },
  chipCount:{ background: '#F1F5F9', color: '#64748B', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700 },
  chipCountActive:{ background: 'rgba(255,255,255,0.2)', color: '#fff' },
  chipCountAlerta:{ background: '#D1FAE5', color: '#047857' },

  // Empty State
  empty:    { textAlign: 'center', color: '#64748B', padding: '48px 20px', fontSize: 14, background: '#F8FAFC', borderRadius: 16, border: '1px dashed #CBD5E1', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
  emptyIcon:{ fontSize: 32, opacity: 0.8 },

  // Grid / Lista de pedidos
  lista:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 },
  card:     { background: '#fff', borderRadius: 16, padding: '20px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', transition: 'all 0.2s' },
  
  // Cabecera de Tarjeta
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  cardHeaderLeft:{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  mesaTxt:  { fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 },
  estadoPill: { display: 'flex', alignItems: 'center', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 },
  pedidoId: { fontSize: 12, fontWeight: 700, color: '#94A3B8' },
  horaTxt:  { fontSize: 12, color: '#64748B', fontWeight: 500 },

  // Progress Bar / Stepper
  progresoWrap: { display: 'flex', justifyContent: 'space-between', marginBottom: 20, padding: '12px 16px', background: '#F8FAFC', borderRadius: 12, border: '1px solid #F1F5F9' },
  progresoItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' },
  progresoLineaWrap: { display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'center' },
  lineaConectora: { height: 2, flex: 1, transition: 'background 0.3s' },
  progresoDot: { width: 12, height: 12, borderRadius: '50%', zIndex: 2, transition: 'all 0.3s' },

  // Detalles del pedido (Platos)
  detalles: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, flex: 1 },
  detalleItem:{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '6px 0', borderBottom: '1px dashed #E2E8F0' },
  detalleCantNombre: { fontSize: 13, color: '#334155', fontWeight: 600, display: 'flex', gap: 8, alignItems: 'flex-start' },
  cantBadge: { background: '#F1F5F9', color: '#475569', fontSize: 11, fontWeight: 800, padding: '2px 6px', borderRadius: 6, minWidth: 20, textAlign: 'center' },
  detallePrecio: { fontSize: 13, color: '#0F172A', fontWeight: 700, whiteSpace: 'nowrap' },
  obs:      { fontSize: 12, color: '#B45309', background: '#FFFBEB', padding: '8px 12px', borderRadius: 8, marginTop: 4, display: 'inline-block' },

  // Footer Tarjeta
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid #F1F5F9' },
  totalTxt: { fontSize: 15, fontWeight: 800, color: '#0F172A' },
  
  // Botones
  btnExito: { padding: '8px 16px', borderRadius: 10, background: '#10B981', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: "inherit", boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)' },
  btnSecundarioLigero: { padding: '8px 14px', borderRadius: 10, background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: "inherit" },
};
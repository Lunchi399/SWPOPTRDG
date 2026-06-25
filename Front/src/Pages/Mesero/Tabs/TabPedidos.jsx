import { useEffect, useState, useCallback } from 'react';
import { getPedidos, cambiarEstado, cancelarPedido } from '../../../services/meseroService';

// ── ESTADOS ────────────────────────────────────────────────────────
const ESTADO_INFO = {
  borrador:   { color: '#64748B', bg: '#F1F5F9', dot: '#94A3B8', label: 'Borrador'   },
  confirmado: { color: '#1D4ED8', bg: '#DBEAFE', dot: '#3B82F6', label: 'Confirmado' },
  en_cocina:  { color: '#92400E', bg: '#FEF3C7', dot: '#F59E0B', label: 'En cocina'  },
  listo:      { color: '#065F46', bg: '#D1FAE5', dot: '#10B981', label: '¡Listo!'    },
  despachado: { color: '#5B21B6', bg: '#EDE9FE', dot: '#8B5CF6', label: 'Despachado' },
  pagado:     { color: '#065F46', bg: '#D1FAE5', dot: '#10B981', label: 'Pagado'     },
  cancelado:  { color: '#991B1B', bg: '#FEE2E2', dot: '#EF4444', label: 'Cancelado'  },
};

const PASOS = ['confirmado', 'en_cocina', 'listo', 'despachado', 'pagado'];

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

// ── SKELETON ───────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', border: '1px solid #F1F5F9', borderLeft: '4px solid #E2E8F0' }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ ...sk, width: 100, height: 18 }} />
            <div style={{ ...sk, width: 70, height: 18, borderRadius: 20 }} />
            <div style={{ ...sk, width: 40, height: 18 }} />
          </div>
          <div style={{ ...sk, width: '100%', height: 36, borderRadius: 8, marginBottom: 12 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ ...sk, width: '80%', height: 14 }} />
            <div style={{ ...sk, width: '60%', height: 14 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
const sk = { background: 'linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', borderRadius: 6 };

// ── BARRA DE PROGRESO ──────────────────────────────────────────────
function BarraProgreso({ estado }) {
  const idxActual = PASOS.indexOf(estado);
  return (
    <div style={s.progreso}>
      {PASOS.map((paso, i) => {
        const info   = ESTADO_INFO[paso];
        const activo = i <= idxActual;
        const actual = i === idxActual;
        return (
          <div key={paso} style={s.progresoItem}>
            {i > 0 && (
              <div style={{ ...s.progresoLinea, background: i <= idxActual ? info.dot : '#E2E8F0' }} />
            )}
            <div style={{ ...s.progresoDot, background: activo ? info.dot : '#E2E8F0', transform: actual ? 'scale(1.3)' : 'scale(1)', boxShadow: actual ? `0 0 0 3px ${info.dot}33` : 'none' }} />
            <div style={{ fontSize: 10, color: activo ? info.color : '#94A3B8', fontWeight: actual ? 800 : activo ? 600 : 400, whiteSpace: 'nowrap' }}>
              {info.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── TARJETA PEDIDO ─────────────────────────────────────────────────
function PedidoCard({ p, onDespachar, onCancelar }) {
  const ei     = ESTADO_INFO[p.estado] || ESTADO_INFO.confirmado;
  const esListo = p.estado === 'listo';

  return (
    <div style={{ ...s.card, borderLeftColor: ei.dot, ...(esListo ? { boxShadow: `0 0 0 2px ${ei.dot}, 0 4px 16px rgba(16,185,129,0.15)` } : {}) }}>
      {/* Header */}
      <div style={s.cardHeader}>
        <div style={s.cardHeaderLeft}>
          <div style={s.mesaIcon}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ei.color} strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="8" width="18" height="4" rx="1"/>
              <line x1="7" y1="12" x2="7" y2="19"/><line x1="17" y1="12" x2="17" y2="19"/>
            </svg>
          </div>
          <span style={s.mesaLabel}>Mesa {p.mesa_identificador || '—'}</span>
          <span style={{ ...s.estadoPill, background: ei.bg, color: ei.color }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: ei.dot, display: 'inline-block', marginRight: 5 }} />
            {ei.label}
          </span>
          <span style={s.pedidoId}>#{p.id_pedidos}</span>
          {esListo && (
            <span style={s.alertaBadge}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              ¡Listo para entregar!
            </span>
          )}
        </div>
        <span style={s.hora}>
          {new Date(p.tiempo_creacion).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Progreso */}
      <BarraProgreso estado={p.estado} />

      {/* Detalles */}
      <div style={s.detalles}>
        {p.detalles?.map(d => (
          <div key={d.id_detalle} style={s.detalleItem}>
            <span style={s.detalleCant}>{d.cantidad}x</span>
            <span style={s.detalleNombre}>{d.producto_nombre}</span>
            <span style={s.detallePrecio}>S/ {d.subtotal}</span>
          </div>
        ))}
        {p.observaciones && (
          <div style={s.obs}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            {p.observaciones}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={s.cardFooter}>
        <span style={s.total}>Total: <strong>S/ {p.total}</strong></span>
        <div style={{ display: 'flex', gap: 8 }}>
          {esListo && (
            <button style={s.btnDespachar} onClick={() => onDespachar(p)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              Entregar al cliente
            </button>
          )}
          {['borrador', 'confirmado'].includes(p.estado) && (
            <button style={s.btnCancelar} onClick={() => onCancelar(p)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── COMPONENTE PRINCIPAL ───────────────────────────────────────────
export default function TabPedidos() {
  const [pedidos,    setPedidos]    = useState([]);
  const [filtro,     setFiltro]     = useState('activos');
  const [mensaje,    setMensaje]    = useState('');
  const [error,      setError]      = useState('');
  const [loading,    setLoading]    = useState(true);
  const [ultimaAct,  setUltimaAct] = useState(null);

  const mostrar = (msg, err = false) => {
    err ? setError(msg) : setMensaje(msg);
    setTimeout(() => { setMensaje(''); setError(''); }, 3000);
  };

  const cargar = useCallback(() => {
    getPedidos()
      .then(r => {
        setPedidos(r.data);
        setLoading(false);
        setUltimaAct(new Date());
      })
      .catch(() => {
        setLoading(false);
        mostrar('Error al cargar pedidos', true);
      });
  }, []);

  useEffect(() => {
    cargar();
    const iv = setInterval(cargar, 5000);
    return () => clearInterval(iv);
  }, [cargar]);

  const handleDespachar = async (p) => {
    try {
      await cambiarEstado(p.id_pedidos, 'despachar');
      mostrar(`Pedido #${p.id_pedidos} entregado al cliente`);
      cargar();
    } catch (e) { mostrar(e.response?.data?.error || 'Error al despachar', true); }
  };

  const handleCancelar = async (p) => {
    if (!window.confirm('¿Cancelar este pedido?')) return;
    try {
      await cancelarPedido(p.id_pedidos);
      mostrar(`Pedido #${p.id_pedidos} cancelado`);
      cargar();
    } catch (e) { mostrar(e.response?.data?.error || 'Error al cancelar', true); }
  };

  const FILTROS = {
    activos:   ['confirmado', 'en_cocina', 'listo', 'despachado'],
    listos:    ['listo'],
    historial: ['pagado', 'cancelado'],
  };

  const pedidosFiltrados = pedidos.filter(p => FILTROS[filtro]?.includes(p.estado));
  const cantListos = pedidos.filter(p => p.estado === 'listo').length;
  const cantActivos = pedidos.filter(p => FILTROS.activos.includes(p.estado)).length;

  return (
    <div style={s.wrap}>
      <Toast mensaje={mensaje} error={error} />

      {/* Header */}
      <div style={s.topbar}>
        <div>
          <h2 style={s.titulo}>Mis pedidos</h2>
          {ultimaAct && (
            <p style={s.ultimaAct}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              Actualizado {ultimaAct.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · cada 5s
            </p>
          )}
        </div>
        <button style={s.btnRefresh} onClick={cargar} title="Actualizar ahora">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div style={s.filtros}>
        {[
          { id: 'activos',   label: 'Activos',             count: cantActivos },
          { id: 'listos',    label: 'Listos para entregar', count: cantListos, alert: cantListos > 0 },
          { id: 'historial', label: 'Historial',            count: null },
        ].map(f => (
          <button key={f.id} style={{
            ...s.filtroBtn,
            ...(filtro === f.id ? s.filtroBtnActive : {}),
            ...(f.alert && filtro !== f.id ? s.filtroBtnAlert : {}),
          }} onClick={() => setFiltro(f.id)}>
            {f.label}
            {f.count !== null && (
              <span style={{ ...s.filtroBadge, background: filtro === f.id ? 'rgba(255,255,255,0.25)' : f.alert ? '#D1FAE5' : '#F1F5F9', color: filtro === f.id ? '#fff' : f.alert ? '#065F46' : '#94A3B8' }}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {loading ? (
        <Skeleton />
      ) : pedidosFiltrados.length === 0 ? (
        <div style={s.empty}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 12 }}>
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          <p style={{ margin: 0, fontSize: 14, color: '#94A3B8', fontWeight: 600 }}>
            No hay pedidos {filtro === 'activos' ? 'activos' : filtro === 'listos' ? 'listos para entregar' : 'en el historial'}
          </p>
        </div>
      ) : (
        <div style={s.lista}>
          {pedidosFiltrados.map(p => (
            <PedidoCard key={p.id_pedidos} p={p} onDespachar={handleDespachar} onCancelar={handleCancelar} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── ESTILOS ────────────────────────────────────────────────────────
const s = {
  wrap:     { fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif" },
  topbar:   { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  titulo:   { fontSize: 20, fontWeight: 800, color: '#0F1E2E', margin: 0, letterSpacing: -0.3 },
  ultimaAct:{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#94A3B8', marginTop: 4 },
  btnRefresh:{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#475569', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif" },
  filtros:  { display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' },
  filtroBtn:{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 20, border: '1px solid #E2E8F0', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: '#fff', color: '#64748B', transition: 'all .15s', fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif" },
  filtroBtnActive:{ background: '#1E2D40', color: '#fff', borderColor: '#1E2D40' },
  filtroBtnAlert: { borderColor: '#10B981', color: '#065F46' },
  filtroBadge:{ padding: '1px 7px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  empty:    { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: 12, padding: '48px 20px', border: '1px solid #F1F5F9' },
  lista:    { display: 'flex', flexDirection: 'column', gap: 12 },
  card:     { background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #F1F5F9', borderLeft: '4px solid', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' },
  cardHeader:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardHeaderLeft:{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  mesaIcon: { width: 28, height: 28, borderRadius: 8, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  mesaLabel:{ fontSize: 15, fontWeight: 800, color: '#1E293B' },
  estadoPill:{ display: 'flex', alignItems: 'center', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 },
  pedidoId: { fontSize: 11, color: '#94A3B8', fontFamily: 'monospace', fontWeight: 600 },
  alertaBadge:{ display: 'flex', alignItems: 'center', gap: 5, background: '#D1FAE5', color: '#065F46', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, animation: 'pulse 2s infinite' },
  hora:     { fontSize: 11, color: '#94A3B8', fontWeight: 500, flexShrink: 0 },
  // Progreso
  progreso: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', background: '#F8FAFC', borderRadius: 10, padding: '10px 14px', marginBottom: 12, position: 'relative' },
  progresoItem:{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flex: 1, position: 'relative' },
  progresoLinea:{ position: 'absolute', left: '-50%', top: 5, width: '100%', height: 2, zIndex: 0 },
  progresoDot:{ width: 12, height: 12, borderRadius: '50%', transition: 'all 0.3s', zIndex: 1, position: 'relative' },
  // Detalles
  detalles: { background: '#F8FAFC', borderRadius: 10, padding: '10px 12px', marginBottom: 12, border: '1px solid #F1F5F9' },
  detalleItem:{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid #F1F5F9' },
  detalleCant:{ fontSize: 12, fontWeight: 800, color: '#2563EB', minWidth: 24 },
  detalleNombre:{ fontSize: 13, color: '#334155', flex: 1 },
  detallePrecio:{ fontSize: 13, fontWeight: 700, color: '#059669' },
  obs:      { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', marginTop: 8, fontStyle: 'italic' },
  // Footer
  cardFooter:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  total:    { fontSize: 14, color: '#475569' },
  btnDespachar:{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 9, background: 'linear-gradient(135deg,#059669,#10B981)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, boxShadow: '0 3px 10px rgba(5,150,105,0.3)', fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif" },
  btnCancelar:{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 9, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif" },
};
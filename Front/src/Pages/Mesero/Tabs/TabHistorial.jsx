import { useEffect, useState } from 'react';
import { getHistorial } from '../../../services/meseroService';

// ── DICCIONARIO DE ESTADOS (Colores Modernos) ──────────────────────
const ESTADO_INFO = {
  borrador:   { bg: '#F1F5F9', color: '#475569', dot: '#94A3B8' },
  confirmado: { bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6' },
  en_cocina:  { bg: '#FFFBEB', color: '#B45309', dot: '#F59E0B' },
  listo:      { bg: '#ECFDF5', color: '#047857', dot: '#10B981' },
  despachado: { bg: '#F5F3FF', color: '#6D28D9', dot: '#8B5CF6' },
  pagado:     { bg: '#F0FDF4', color: '#15803D', dot: '#22C55E' },
  cancelado:  { bg: '#FEF2F2', color: '#B91C1C', dot: '#EF4444' },
  anulado:    { bg: '#FEF2F2', color: '#991B1B', dot: '#DC2626' },
};

// ── COMPONENTE PRINCIPAL ───────────────────────────────────────────
export default function TabHistorial() {
  const [pedidos, setPedidos] = useState([]);
  const [filtro,  setFiltro]  = useState('');
  const [expandido, setExpandido] = useState(null);

  useEffect(() => {
    getHistorial().then(r => setPedidos(r.data));
  }, []);

  const pedidosFiltrados = filtro
    ? pedidos.filter(p => p.estado === filtro)
    : pedidos;

  const totalDia = pedidos
    .filter(p => p.estado === 'pagado')
    .reduce((s, p) => s + parseFloat(p.total || 0), 0)
    .toFixed(2);

  return (
    <div style={s.tabContent}>
      
      <div style={s.headerSeccion}>
        <h2 style={s.tituloSeccion}>Resumen del turno</h2>
      </div>

      {/* ── Resumen del turno (Estilo Dashboard) ── */}
      <div style={s.resumen}>
        <div style={s.resCard}>
          <div style={s.resIconoWrapper}>📦</div>
          <div>
            <div style={s.resL}>Total pedidos</div>
            <div style={s.resN}>{pedidos.length}</div>
          </div>
        </div>
        
        <div style={s.resCard}>
          <div style={s.resIconoWrapper}>✅</div>
          <div>
            <div style={s.resL}>Pagados</div>
            <div style={s.resN}>{pedidos.filter(p => p.estado === 'pagado').length}</div>
          </div>
        </div>
        
        <div style={s.resCard}>
          <div style={s.resIconoWrapper}>❌</div>
          <div>
            <div style={s.resL}>Cancelados</div>
            <div style={s.resN}>{pedidos.filter(p => p.estado === 'cancelado').length}</div>
          </div>
        </div>
        
        <div style={{ ...s.resCard, ...s.resCardHighlight }}>
          <div style={s.resIconoWrapperHighlight}>💰</div>
          <div>
            <div style={{ ...s.resL, color: '#D1FAE5' }}>Total vendido</div>
            <div style={{ ...s.resN, color: '#fff' }}>S/ {totalDia}</div>
          </div>
        </div>
      </div>

      {/* ── Filtro por estado ── */}
      <div style={s.filtrosWrapper}>
        <button 
          style={filtro === '' ? s.filtroBtnActivo : s.filtroBtnInactivo} 
          onClick={() => setFiltro('')}
        >
          Todos
        </button>
        {Object.keys(ESTADO_INFO).map(est => (
          <button 
            key={est} 
            style={filtro === est ? s.filtroBtnActivo : s.filtroBtnInactivo} 
            onClick={() => setFiltro(est)}
          >
            {est.replace('_', ' ').charAt(0).toUpperCase() + est.replace('_', ' ').slice(1)}
          </button>
        ))}
      </div>

      {/* ── Lista de Pedidos ── */}
      {pedidosFiltrados.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>📋</div>
          No hay pedidos en el historial para mostrar.
        </div>
      ) : (
        <div style={s.lista}>
          {pedidosFiltrados.map(p => {
            const ei      = ESTADO_INFO[p.estado] || ESTADO_INFO.confirmado;
            const abierto = expandido === p.id_pedidos;
            
            return (
              <div key={p.id_pedidos} style={s.card}>
                
                {/* Cabecera del Acordeón */}
                <div style={s.cardHeader} onClick={() => setExpandido(abierto ? null : p.id_pedidos)}>
                  
                  <div style={s.cardHeaderLeft}>
                    <div style={s.mesaAvatar}>
                      {p.mesa_identificador ? p.mesa_identificador.slice(0, 2).toUpperCase() : 'M'}
                    </div>
                    <div>
                      <span style={s.mesaTexto}>
                        Mesa {p.mesa_identificador || 'General'}
                      </span>
                      <div style={s.fechaTexto}>
                        {new Date(p.tiempo_creacion).toLocaleString('es-PE', {
                          day: '2-digit', month: '2-digit',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>

                  <div style={s.cardHeaderRight}>
                    <span style={{ ...s.pill, background: ei.bg, color: ei.color }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: ei.dot, display: 'inline-block', marginRight: 5 }} />
                      {p.estado.replace('_',' ').charAt(0).toUpperCase() + p.estado.replace('_',' ').slice(1)}
                    </span>
                    <span style={s.totalTexto}>
                      S/ {p.total}
                    </span>
                    <div style={{ ...s.arrowIcon, transform: abierto ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                      ▼
                    </div>
                  </div>
                </div>

                {/* Detalles del Acordeón */}
                {abierto && (
                  <div style={s.detalles}>
                    <div style={s.detallesTitulo}>Detalle de la orden:</div>
                    {p.detalles?.map(d => (
                      <div key={d.id_detalle} style={s.detalleItem}>
                        <span style={s.detalleProd}>
                          <span style={s.detalleCant}>{d.cantidad}x</span> {d.producto_nombre}
                        </span>
                        <span style={s.detalleSub}>
                          S/ {d.subtotal}
                        </span>
                      </div>
                    ))}
                    {p.observaciones && (
                      <div style={s.obs}>
                        <span style={{fontWeight: 600}}>Notas:</span> {p.observaciones}
                      </div>
                    )}
                  </div>
                )}
                
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
  tabContent: { fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif", padding: '0 0 24px 0', maxWidth: '1000px', margin: '0 auto' },
  
  // Encabezados
  headerSeccion: { marginBottom: 16 },
  tituloSeccion: { fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 },

  // Tarjetas de Resumen
  resumen: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: '32px' },
  resCard: { background: '#fff', borderRadius: 16, padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: 16 },
  resCardHighlight: { background: 'linear-gradient(135deg, #064E3B 0%, #047857 100%)', border: 'none', color: '#fff' },
  resIconoWrapper: { background: '#F8FAFC', borderRadius: 12, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 },
  resIconoWrapperHighlight: { background: 'rgba(255,255,255,0.2)', borderRadius: 12, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 },
  resL: { fontSize: 13, color: '#64748B', fontWeight: 600, marginBottom: 4 },
  resN: { fontSize: 24, fontWeight: 800, color: '#0F172A', lineHeight: 1 },

  // Filtros
  filtrosWrapper: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '24px', paddingBottom: 8, overflowX: 'auto' },
  filtroBtnInactivo: { padding: '8px 16px', borderRadius: 24, border: '1px solid #E2E8F0', background: '#fff', color: '#475569', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s', fontFamily: "inherit" },
  filtroBtnActivo: { padding: '8px 16px', borderRadius: 24, border: '1px solid #0F172A', background: '#0F172A', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s', fontFamily: "inherit", boxShadow: '0 4px 6px rgba(15,23,42,0.2)' },

  // Estado Vacío
  empty: { textAlign: 'center', color: '#64748B', padding: '48px 20px', background: '#F8FAFC', borderRadius: 16, border: '1px dashed #CBD5E1', fontSize: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
  emptyIcon: { fontSize: 32, opacity: 0.8 },

  // Lista de Acordeón
  lista: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: { background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', transition: 'all 0.2s' },
  
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', cursor: 'pointer', background: '#fff' },
  cardHeaderLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  mesaAvatar: { width: 40, height: 40, borderRadius: 10, background: '#F1F5F9', color: '#0F172A', fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  mesaTexto: { fontWeight: 800, fontSize: 15, color: '#0F172A', display: 'block', marginBottom: 2 },
  fechaTexto: { fontSize: 12, color: '#94A3B8', fontWeight: 500 },
  
  cardHeaderRight: { display: 'flex', alignItems: 'center', gap: 16 },
  pill: { fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, display: 'flex', alignItems: 'center' },
  totalTexto: { fontSize: 15, fontWeight: 800, color: '#047857', minWidth: '70px', textAlign: 'right' },
  arrowIcon: { fontSize: 10, color: '#94A3B8', transition: 'transform 0.3s ease' },

  // Detalles Expandidos
  detalles: { background: '#F8FAFC', padding: '20px', borderTop: '1px solid #E2E8F0' },
  detallesTitulo: { fontSize: 12, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  detalleItem: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #E2E8F0' },
  detalleProd: { fontSize: 14, color: '#334155', fontWeight: 500 },
  detalleCant: { fontWeight: 800, color: '#0F172A', marginRight: 4 },
  detalleSub: { fontSize: 14, color: '#047857', fontWeight: 700 },
  
  obs: { fontSize: 13, color: '#64748B', marginTop: 16, padding: '12px', background: '#fff', borderRadius: 8, border: '1px dashed #CBD5E1' },
};
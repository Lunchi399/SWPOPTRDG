import { useEffect, useState } from 'react';
import { getHistorialCocina } from '../../../services/cocinaService';

const ESTADO_INFO = {
  listo:      { bg:'#0D2A1E', color:'#9FE1CB' },
  despachado: { bg:'#1A1A3E', color:'#A78BFA' },
  pagado:     { bg:'#0D2A1E', color:'#6EE7B7' },
  cancelado:  { bg:'#3A1A1A', color:'#E94560' },
};

export default function TabHistorial() {
  const [pedidos,  setPedidos]  = useState([]);
  const [expandido, setExpandido] = useState(null);

  useEffect(() => {
    getHistorialCocina().then(r => setPedidos(r.data));
  }, []);

  // Métricas del turno
  const completados = pedidos.filter(
    p => ['listo','despachado','pagado'].includes(p.estado)
  ).length;
  const cancelados  = pedidos.filter(p => p.estado === 'cancelado').length;

  // Tiempo promedio (solo pedidos con tiempo_modificacion)
  const tiempoPromedio = () => {
    const conTiempo = pedidos.filter(
      p => p.tiempo_creacion && p.tiempo_modificacion &&
           ['listo','despachado','pagado'].includes(p.estado)
    );
    if (conTiempo.length === 0) return '—';
    const promedio = conTiempo.reduce((s, p) => {
      return s + (new Date(p.tiempo_modificacion) -
                  new Date(p.tiempo_creacion));
    }, 0) / conTiempo.length;
    return `${Math.floor(promedio / 60000)} min`;
  };

  return (
    <div style={{ maxWidth:800 }}>

      {/* Métricas del turno */}
      <div style={s.resumen}>
        <div style={s.resCard}>
          <div style={{ ...s.resN, color:'#9FE1CB' }}>{completados}</div>
          <div style={s.resL}>Completados</div>
        </div>
        <div style={s.resCard}>
          <div style={{ ...s.resN, color:'#E94560' }}>{cancelados}</div>
          <div style={s.resL}>Cancelados</div>
        </div>
        <div style={s.resCard}>
          <div style={{ ...s.resN, color:'#FAC775' }}>{pedidos.length}</div>
          <div style={s.resL}>Total</div>
        </div>
        <div style={s.resCard}>
          <div style={{ ...s.resN, color:'#7BC8F6' }}>{tiempoPromedio()}</div>
          <div style={s.resL}>Tiempo promedio</div>
        </div>
      </div>

      {/* Lista */}
      {pedidos.length === 0 ? (
        <div style={s.empty}>No hay pedidos en el historial de hoy.</div>
      ) : (
        <div style={s.lista}>
          {pedidos.map(p => {
            const ei     = ESTADO_INFO[p.estado] || ESTADO_INFO.cancelado;
            const abierto = expandido === p.id_pedidos;
            return (
              <div key={p.id_pedidos} style={{
                ...s.card, background: ei.bg
              }}>
                <div style={s.cardHeader}
                  onClick={() => setExpandido(
                    abierto ? null : p.id_pedidos
                  )}>
                  <div style={s.cardLeft}>
                    <span style={{ fontSize:15, fontWeight:700,
                                   color:'#fff' }}>
                      Mesa {p.mesa_identificador || '—'}
                    </span>
                    <span style={{ ...s.estadoPill,
                                    background:'rgba(0,0,0,0.3)',
                                    color: ei.color }}>
                      {p.estado}
                    </span>
                    <span style={{ fontSize:11, color:'#8AADCA' }}>
                      #{p.id_pedidos}
                    </span>
                  </div>
                  <div style={s.cardRight}>
                    <span style={{ fontSize:12, color:'#8AADCA' }}>
                      {new Date(p.tiempo_creacion).toLocaleTimeString(
                        'es-PE', { hour:'2-digit', minute:'2-digit' }
                      )}
                    </span>
                    <span style={{ color:'#8AADCA' }}>
                      {abierto ? '▲' : '▼'}
                    </span>
                  </div>
                </div>

                {abierto && (
                  <div style={s.detalles}>
                    {p.detalles?.map(d => (
                      <div key={d.id_detalle} style={s.detalleItem}>
                        <span style={{ color:'#FAC775',
                                       fontWeight:700, minWidth:25 }}>
                          {d.cantidad}x
                        </span>
                        <span style={{ color:'#fff', fontSize:13 }}>
                          {d.producto_nombre}
                        </span>
                      </div>
                    ))}
                    {p.observaciones && (
                      <div style={{ fontSize:12, color:'#8AADCA',
                                     marginTop:6, fontStyle:'italic' }}>
                        📝 {p.observaciones}
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

const s = {
  resumen:    { display:'grid',
                gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))',
                gap:10, marginBottom:'1.5rem' },
  resCard:    { background:'#16213E', borderRadius:10,
                padding:'12px', textAlign:'center',
                border:'1px solid #2E3F52' },
  resN:       { fontSize:26, fontWeight:700 },
  resL:       { fontSize:11, color:'#8AADCA', marginTop:2 },
  empty:      { textAlign:'center', color:'#8AADCA',
                padding:'3rem', background:'#16213E',
                borderRadius:12, fontSize:14 },
  lista:      { display:'flex', flexDirection:'column', gap:8 },
  card:       { borderRadius:10, padding:'12px 1.25rem',
                border:'1px solid #2E3F52' },
  cardHeader: { display:'flex', justifyContent:'space-between',
                alignItems:'center', cursor:'pointer' },
  cardLeft:   { display:'flex', alignItems:'center', gap:8 },
  cardRight:  { display:'flex', alignItems:'center', gap:10 },
  estadoPill: { fontSize:11, fontWeight:500, padding:'3px 10px',
                borderRadius:20 },
  detalles:   { marginTop:10, background:'rgba(0,0,0,0.2)',
                borderRadius:8, padding:'8px 10px' },
  detalleItem:{ display:'flex', gap:8, padding:'4px 0',
                borderBottom:'1px solid rgba(255,255,255,0.05)' },
};
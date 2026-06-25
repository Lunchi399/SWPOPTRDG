import { useEffect, useState } from 'react';
import { getHistorialPagos } from '../../../services/cajaService';

const METODO_INFO = {
  efectivo: { bg:'#E1F5EE', color:'#085041', icon:'💵' },
  yape:     { bg:'#EEEDFE', color:'#3C3489', icon:'📱' },
  plin:     { bg:'#E6F1FB', color:'#0C447C', icon:'📲' },
  tarjeta:  { bg:'#FAEEDA', color:'#633806', icon:'💳' },
};

export default function TabHistorial() {
  const [pagos,     setPagos]     = useState([]);
  const [expandido, setExpandido] = useState(null);
  const [filtro,    setFiltro]    = useState('');

  useEffect(() => {
    getHistorialPagos().then(r => setPagos(r.data));
  }, []);

  const pagosFiltrados = filtro
    ? pagos.filter(p => p.metodo_pago === filtro)
    : pagos;

  const totalDia = pagos.reduce(
    (s, p) => s + parseFloat(p.monto_total || 0), 0
  ).toFixed(2);

  return (
    <div style={{ maxWidth:800 }}>

      {/* Resumen */}
      <div style={s.resumen}>
        <div style={s.resCard}>
          <div style={{ ...s.resN, color:'#0F6E56' }}>S/. {totalDia}</div>
          <div style={s.resL}>Total del día</div>
        </div>
        <div style={s.resCard}>
          <div style={s.resN}>{pagos.length}</div>
          <div style={s.resL}>Transacciones</div>
        </div>
        {Object.entries(METODO_INFO).map(([metodo, info]) => {
          const totalMetodo = pagos
            .filter(p => p.metodo_pago === metodo)
            .reduce((s, p) => s + parseFloat(p.monto_total || 0), 0)
            .toFixed(2);
          return (
            <div key={metodo} style={{
              ...s.resCard,
              background: info.bg,
              border: `1px solid ${info.color}20`
            }}>
              <div style={{ ...s.resN, color:info.color, fontSize:18 }}>
                {info.icon} S/. {totalMetodo}
              </div>
              <div style={{ ...s.resL, color:info.color }}>
                {metodo.charAt(0).toUpperCase() + metodo.slice(1)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Filtros */}
      <div style={s.filtros}>
        <button style={{
          ...s.filtroBtn,
          background: filtro === '' ? '#1E2D40' : '#fff',
          color:      filtro === '' ? '#fff'    : '#555',
        }} onClick={() => setFiltro('')}>Todos</button>
        {Object.entries(METODO_INFO).map(([m, info]) => (
          <button key={m} style={{
            ...s.filtroBtn,
            background: filtro === m ? info.bg : '#fff',
            color:      filtro === m ? info.color : '#555',
            borderColor: filtro === m ? info.color : '#ddd',
          }} onClick={() => setFiltro(m)}>
            {info.icon} {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      {/* Lista de pagos */}
      {pagosFiltrados.length === 0 ? (
        <div style={s.empty}>No hay pagos registrados hoy.</div>
      ) : (
        <div style={s.lista}>
          {pagosFiltrados.map(p => {
            const mi     = METODO_INFO[p.metodo_pago] || METODO_INFO.efectivo;
            const abierto = expandido === p.id_pago;
            return (
              <div key={p.id_pago} style={s.card}>
                <div style={s.cardHeader}
                  onClick={() => setExpandido(abierto ? null : p.id_pago)}>
                  <div style={s.cardLeft}>
                    <span style={{ ...s.metodoPill,
                                    background:mi.bg, color:mi.color }}>
                      {mi.icon} {p.metodo_pago}
                    </span>
                    <span style={{ fontSize:13, color:'#555' }}>
                      Mesa {p.pedido_mesa || '—'}
                    </span>
                    {p.datos_factura?.length > 0 && (
                      <span style={s.facturaPill}>Factura</span>
                    )}
                  </div>
                  <div style={s.cardRight}>
                    <span style={{ fontSize:16, fontWeight:700,
                                   color:'#0F6E56' }}>
                      S/. {p.monto_total}
                    </span>
                    <span style={{ fontSize:11, color:'#aaa' }}>
                      {new Date(p.fecha_cobro).toLocaleTimeString('es-PE', {
                        hour:'2-digit', minute:'2-digit'
                      })}
                    </span>
                    <span style={{ color:'#888', fontSize:12 }}>
                      {abierto ? '▲' : '▼'}
                    </span>
                  </div>
                </div>

                {abierto && (
                  <div style={s.detalles}>
                    {p.detalles_pago?.map(d => (
                      <div key={d.id_detalle_pago} style={s.detalleItem}>
                        <span style={{ fontSize:13 }}>
                          {d.cantidad}x {d.nombre_producto}
                        </span>
                        <span style={{ fontSize:13, color:'#0F6E56' }}>
                          S/. {d.subtotal}
                        </span>
                      </div>
                    ))}
                    <div style={s.pagoResumen}>
                      {p.metodo_pago === 'efectivo' && (
                        <>
                          <div style={s.pagoItem}>
                            <span>Recibido</span>
                            <span>S/. {p.monto_recibido}</span>
                          </div>
                          <div style={s.pagoItem}>
                            <span>Vuelto</span>
                            <span style={{ color:'#0F6E56' }}>
                              S/. {p.vuelto}
                            </span>
                          </div>
                        </>
                      )}
                      <div style={{ ...s.pagoItem, fontWeight:700 }}>
                        <span>Total</span>
                        <span style={{ color:'#0F6E56' }}>
                          S/. {p.monto_total}
                        </span>
                      </div>
                    </div>
                    {p.datos_factura?.length > 0 && (
                      <div style={s.facturaBox}>
                        <div style={{ fontSize:11, fontWeight:700,
                                       color:'#888', marginBottom:4 }}>
                          DATOS DE FACTURA
                        </div>
                        <div style={{ fontSize:13 }}>
                          RUC: {p.datos_factura[0].ruc}
                        </div>
                        <div style={{ fontSize:13 }}>
                          {p.datos_factura[0].razon_social}
                        </div>
                        {p.datos_factura[0].direccion_fiscal && (
                          <div style={{ fontSize:12, color:'#888' }}>
                            {p.datos_factura[0].direccion_fiscal}
                          </div>
                        )}
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
                gap:10, marginBottom:'1.25rem' },
  resCard:    { background:'#fff', borderRadius:10, padding:'12px',
                textAlign:'center', border:'1px solid #E8E6DF' },
  resN:       { fontSize:20, fontWeight:700, color:'#1E2D40' },
  resL:       { fontSize:11, color:'#888', marginTop:2 },
  filtros:    { display:'flex', gap:6, flexWrap:'wrap', marginBottom:'1rem' },
  filtroBtn:  { padding:'6px 14px', borderRadius:20,
                border:'1px solid #ddd', cursor:'pointer',
                fontSize:12, fontWeight:500 },
  empty:      { textAlign:'center', color:'#888', padding:'3rem',
                background:'#fff', borderRadius:10, fontSize:14 },
  lista:      { display:'flex', flexDirection:'column', gap:8 },
  card:       { background:'#fff', borderRadius:10,
                border:'1px solid #E8E6DF', overflow:'hidden' },
  cardHeader: { display:'flex', justifyContent:'space-between',
                alignItems:'center', padding:'12px 1.25rem',
                cursor:'pointer' },
  cardLeft:   { display:'flex', alignItems:'center', gap:8 },
  cardRight:  { display:'flex', alignItems:'center', gap:10 },
  metodoPill: { fontSize:11, fontWeight:500, padding:'3px 10px',
                borderRadius:20 },
  facturaPill:{ fontSize:10, fontWeight:600, padding:'2px 8px',
                borderRadius:20, background:'#E6F1FB', color:'#0C447C' },
  detalles:   { background:'#F8F7F2', padding:'10px 1.25rem',
                borderTop:'1px solid #E8E6DF' },
  detalleItem:{ display:'flex', justifyContent:'space-between',
                padding:'4px 0', borderBottom:'1px solid #eee' },
  pagoResumen:{ background:'#fff', borderRadius:8, padding:'8px 10px',
                marginTop:8 },
  pagoItem:   { display:'flex', justifyContent:'space-between',
                fontSize:13, padding:'3px 0' },
  facturaBox: { background:'#E6F1FB', borderRadius:8,
                padding:'8px 10px', marginTop:8 },
};
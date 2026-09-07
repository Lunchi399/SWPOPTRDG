import { useEffect, useState } from 'react';
import { getHistorial } from '../../../Services/meseroService';

const ESTADO_INFO = {
  borrador:   { bg:'#F1EFE8', color:'#888'    },
  confirmado: { bg:'#E6F1FB', color:'#185FA5' },
  en_cocina:  { bg:'#FAEEDA', color:'#633806' },
  listo:      { bg:'#E1F5EE', color:'#0F6E56' },
  despachado: { bg:'#EEEDFE', color:'#3C3489' },
  pagado:     { bg:'#E1F5EE', color:'#085041' },
  cancelado:  { bg:'#FAECE7', color:'#993C1D' },
  anulado:    { bg:'#FAECE7', color:'#712B13' },
};

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
    <div style={{ maxWidth:800 }}>

      {/* Resumen del turno */}
      <div style={s.resumen}>
        <div style={s.resCard}>
          <div style={s.resN}>{pedidos.length}</div>
          <div style={s.resL}>Total pedidos</div>
        </div>
        <div style={s.resCard}>
          <div style={s.resN}>
            {pedidos.filter(p => p.estado === 'pagado').length}
          </div>
          <div style={s.resL}>Pagados</div>
        </div>
        <div style={s.resCard}>
          <div style={s.resN}>
            {pedidos.filter(p => p.estado === 'cancelado').length}
          </div>
          <div style={s.resL}>Cancelados</div>
        </div>
        <div style={{ ...s.resCard, borderColor:'#0F6E56' }}>
          <div style={{ ...s.resN, color:'#0F6E56' }}>S/. {totalDia}</div>
          <div style={s.resL}>Total vendido</div>
        </div>
      </div>

      {/* Filtro por estado */}
      <div style={s.filtros}>
        <button style={{
          ...s.filtroBtn,
          background: filtro === '' ? '#1E2D40' : '#fff',
          color:      filtro === '' ? '#fff'    : '#555',
        }} onClick={() => setFiltro('')}>Todos</button>
        {Object.keys(ESTADO_INFO).map(est => (
          <button key={est} style={{
            ...s.filtroBtn,
            background: filtro === est ? '#1E2D40' : '#fff',
            color:      filtro === est ? '#fff'    : '#555',
          }} onClick={() => setFiltro(est)}>
            {est.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Lista */}
      {pedidosFiltrados.length === 0 ? (
        <div style={s.empty}>No hay pedidos para mostrar.</div>
      ) : (
        <div style={s.lista}>
          {pedidosFiltrados.map(p => {
            const ei       = ESTADO_INFO[p.estado] || ESTADO_INFO.confirmado;
            const abierto  = expandido === p.id_pedidos;
            return (
              <div key={p.id_pedidos} style={s.card}>
                <div style={s.cardHeader}
                  onClick={() => setExpandido(abierto ? null : p.id_pedidos)}>
                  <div style={s.cardHeaderLeft}>
                    <span style={{ fontWeight:700, fontSize:14,
                                   color:'#1E2D40' }}>
                      Mesa {p.mesa_identificador || '—'}
                    </span>
                    <span style={{ ...s.estadoPill,
                                    background:ei.bg, color:ei.color }}>
                      {p.estado.replace('_',' ')}
                    </span>
                  </div>
                  <div style={s.cardHeaderRight}>
                    <span style={{ fontSize:13, fontWeight:700,
                                   color:'#0F6E56' }}>
                      S/. {p.total}
                    </span>
                    <span style={{ fontSize:11, color:'#aaa' }}>
                      {new Date(p.tiempo_creacion).toLocaleString('es-PE', {
                        day:'2-digit', month:'2-digit',
                        hour:'2-digit', minute:'2-digit'
                      })}
                    </span>
                    <span style={{ fontSize:12, color:'#888' }}>
                      {abierto ? '▲' : '▼'}
                    </span>
                  </div>
                </div>

                {abierto && (
                  <div style={s.detalles}>
                    {p.detalles?.map(d => (
                      <div key={d.id_detalle} style={s.detalleItem}>
                        <span style={{ fontSize:13 }}>
                          {d.cantidad}x {d.producto_nombre}
                        </span>
                        <span style={{ fontSize:13, color:'#0F6E56' }}>
                          S/. {d.subtotal}
                        </span>
                      </div>
                    ))}
                    {p.observaciones && (
                      <div style={s.obs}>📝 {p.observaciones}</div>
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
  resN:       { fontSize:24, fontWeight:700, color:'#1E2D40' },
  resL:       { fontSize:11, color:'#888', marginTop:2 },
  filtros:    { display:'flex', gap:6, flexWrap:'wrap', marginBottom:'1rem' },
  filtroBtn:  { padding:'5px 12px', borderRadius:20, border:'1px solid #ddd',
                cursor:'pointer', fontSize:11, fontWeight:500 },
  empty:      { textAlign:'center', color:'#888', padding:'2rem',
                background:'#fff', borderRadius:10, fontSize:14 },
  lista:      { display:'flex', flexDirection:'column', gap:8 },
  card:       { background:'#fff', borderRadius:10,
                border:'1px solid #E8E6DF', overflow:'hidden' },
  cardHeader: { display:'flex', justifyContent:'space-between',
                alignItems:'center', padding:'12px 1.25rem',
                cursor:'pointer' },
  cardHeaderLeft:{ display:'flex', alignItems:'center', gap:8 },
  cardHeaderRight:{ display:'flex', alignItems:'center', gap:10 },
  estadoPill: { fontSize:11, fontWeight:500, padding:'3px 10px',
                borderRadius:20 },
  detalles:   { background:'#F8F7F2', padding:'10px 1.25rem',
                borderTop:'1px solid #E8E6DF' },
  detalleItem:{ display:'flex', justifyContent:'space-between',
                padding:'4px 0', borderBottom:'1px solid #eee' },
  obs:        { fontSize:12, color:'#888', marginTop:6, fontStyle:'italic' },
};
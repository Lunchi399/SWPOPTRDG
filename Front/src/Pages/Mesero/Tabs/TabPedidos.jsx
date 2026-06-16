import { useEffect, useState } from 'react';
import { getPedidos, cambiarEstado,
         cancelarPedido } from '../../../services/meseroService';

const ESTADO_INFO = {
  borrador:   { color:'#888',    bg:'#F1EFE8', label:'Borrador',    siguiente: null },
  confirmado: { color:'#185FA5', bg:'#E6F1FB', label:'Confirmado',  siguiente: null },
  en_cocina:  { color:'#633806', bg:'#FAEEDA', label:'En cocina',   siguiente: null },
  listo:      { color:'#0F6E56', bg:'#E1F5EE', label:'¡Listo!',     siguiente: 'despachar' },
  despachado: { color:'#3C3489', bg:'#EEEDFE', label:'Despachado',  siguiente: null },
  pagado:     { color:'#085041', bg:'#E1F5EE', label:'Pagado',      siguiente: null },
  cancelado:  { color:'#993C1D', bg:'#FAECE7', label:'Cancelado',   siguiente: null },
};

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



const handleCancelar = async (pedido) => {
  if (!window.confirm('¿Cancelar este pedido?')) return;
  try {
    await cancelarPedido(pedido.id_pedidos); // ← con s
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

  const pedidosFiltrados = pedidos.filter(p =>
    FILTROS[filtro]?.includes(p.estado)
  );

  // Contar pedidos listos para badge
  const cantListos = pedidos.filter(p => p.estado === 'listo').length;

  return (
    <div>
      {mensaje && <div style={s.toast}>{mensaje}</div>}
      {error   && <div style={s.toastErr}>{error}</div>}

      {/* Filtros */}
      <div style={s.filtros}>
        {[
          { id:'activos',   label:'Activos'   },
          { id:'listos',    label:`Listos para entregar${cantListos > 0 ? ` (${cantListos})` : ''}` },
          { id:'historial', label:'Historial'  },
        ].map(f => (
          <button key={f.id} style={{
            ...s.filtroBtn,
            background: filtro === f.id ? '#1E2D40' : '#fff',
            color:      filtro === f.id ? '#fff'    : '#555',
            ...(f.id === 'listos' && cantListos > 0 && filtro !== f.id
              ? { borderColor:'#0F6E56', color:'#0F6E56' } : {})
          }} onClick={() => setFiltro(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista de pedidos */}
      {pedidosFiltrados.length === 0 ? (
        <div style={s.empty}>
          No hay pedidos {filtro === 'activos' ? 'activos' :
                          filtro === 'listos'  ? 'listos para entregar' :
                          'en el historial'} en este momento.
        </div>
      ) : (
        <div style={s.lista}>
          {pedidosFiltrados.map(p => {
            const ei = ESTADO_INFO[p.estado] || ESTADO_INFO.confirmado;
            const esListo = p.estado === 'listo';
            return (
              <div key={p.id_pedidos} style={{
                ...s.card,
                borderLeft: `4px solid ${ei.color}`,
                ...(esListo ? { boxShadow:'0 0 0 2px #0F6E56' } : {})
              }}>
                <div style={s.cardHeader}>
                  <div style={s.cardHeaderLeft}>
                    <span style={{ fontSize:15, fontWeight:700,
                                   color:'#1E2D40' }}>
                      Mesa {p.mesa_identificador || '—'}
                    </span>
                    <span style={{ ...s.estadoPill,
                                    background:ei.bg, color:ei.color }}>
                      {ei.label}
                    </span>
                    <span style={{ fontSize:11, color:'#aaa' }}>
                      #{p.id_pedidos}
                    </span>
                  </div>
                  <span style={{ fontSize:11, color:'#888' }}>
                    {new Date(p.tiempo_creacion).toLocaleTimeString('es-PE',
                      { hour:'2-digit', minute:'2-digit' })}
                  </span>
                </div>

                {/* Barra de progreso del estado */}
                <div style={s.progreso}>
                  {['confirmado','en_cocina','listo','despachado','pagado']
                    .map((est, i) => {
                      const estados = ['confirmado','en_cocina','listo',
                                       'despachado','pagado'];
                      const idx     = estados.indexOf(p.estado);
                      const activo  = i <= idx;
                      const info    = ESTADO_INFO[est];
                      return (
                        <div key={est} style={s.progresoItem}>
                          <div style={{
                            ...s.progresoDot,
                            background: activo ? info.color : '#E8E6DF',
                          }}/>
                          <div style={{
                            fontSize:10,
                            color: activo ? info.color : '#bbb',
                            fontWeight: activo ? 600 : 400,
                          }}>
                            {ESTADO_INFO[est]?.label}
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Detalles del pedido */}
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
                    <div style={s.obs}>
                      📝 {p.observaciones}
                    </div>
                  )}
                </div>

                <div style={s.cardFooter}>
                  <span style={{ fontSize:14, fontWeight:700,
                                 color:'#1E2D40' }}>
                    Total: S/. {p.total}
                  </span>
                  <div style={{ display:'flex', gap:6 }}>
                    {esListo && (
                      <button style={s.btnDespachar}
                        onClick={() => handleDespachar(p)}>
                        ✅ Entregar al cliente
                      </button>
                    )}
                    {['borrador','confirmado'].includes(p.estado) && (
                      <button style={s.btnCancelar}
                        onClick={() => handleCancelar(p)}>
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

const s = {
  toast:      { background:'#E1F5EE', color:'#085041', padding:'10px 14px',
                borderRadius:8, marginBottom:12, fontSize:13 },
  toastErr:   { background:'#FAECE7', color:'#993C1D', padding:'10px 14px',
                borderRadius:8, marginBottom:12, fontSize:13 },
  filtros:    { display:'flex', gap:8, marginBottom:'1rem', flexWrap:'wrap' },
  filtroBtn:  { padding:'7px 16px', borderRadius:20, border:'1px solid #ddd',
                cursor:'pointer', fontSize:13, fontWeight:500,
                transition:'all .15s' },
  empty:      { textAlign:'center', color:'#888', padding:'3rem',
                fontSize:14, background:'#fff', borderRadius:10 },
  lista:      { display:'flex', flexDirection:'column', gap:10 },
  card:       { background:'#fff', borderRadius:10, padding:'1rem 1.25rem',
                border:'1px solid #E8E6DF' },
  cardHeader: { display:'flex', justifyContent:'space-between',
                alignItems:'center', marginBottom:10 },
  cardHeaderLeft:{ display:'flex', alignItems:'center', gap:8 },
  estadoPill: { fontSize:11, fontWeight:600, padding:'3px 10px',
                borderRadius:20 },
  progreso:   { display:'flex', gap:0, marginBottom:12,
                background:'#F8F7F2', borderRadius:8,
                padding:'8px 10px', justifyContent:'space-between' },
  progresoItem:{ display:'flex', flexDirection:'column',
                 alignItems:'center', gap:3, flex:1 },
  progresoDot:{ width:10, height:10, borderRadius:'50%' },
  detalles:   { background:'#F8F7F2', borderRadius:8,
                padding:'8px 10px', marginBottom:10 },
  detalleItem:{ display:'flex', justifyContent:'space-between',
                padding:'3px 0', borderBottom:'1px solid #eee' },
  obs:        { fontSize:12, color:'#888', marginTop:6, fontStyle:'italic' },
  cardFooter: { display:'flex', justifyContent:'space-between',
                alignItems:'center' },
  btnDespachar:{ padding:'7px 16px', borderRadius:8, background:'#0F6E56',
                 color:'#fff', border:'none', cursor:'pointer',
                 fontSize:13, fontWeight:600 },
  btnCancelar:{ padding:'7px 14px', borderRadius:8, background:'#FAECE7',
                color:'#993C1D', border:'none', cursor:'pointer', fontSize:13 },
};
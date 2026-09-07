import { useEffect, useState, useCallback } from 'react';
import { getColaCocina, cambiarEstado,
         enviarAlerta } from '../../../Services/cocinaService';

const ESTADO_INFO = {
  confirmado: { color:'#FAC775', bg:'#2D2416', label:'Nuevo',
                siguiente:'en_cocina', btnLabel:'Iniciar preparación',
                btnColor:'#854F0B' },
  en_cocina:  { color:'#7BC8F6', bg:'#0D2137', label:'En preparación',
                siguiente:'listo',    btnLabel:'Marcar como listo',
                btnColor:'#0F6E56' },
  listo:      { color:'#9FE1CB', bg:'#0D2A1E', label:'¡Listo!',
                siguiente:null,       btnLabel:null,
                btnColor:null },
};

const ALERTAS = [
  { id:'demora',  label:'⏱ Demora en preparación' },
  { id:'insumos', label:'⚠️ Insumos insuficientes'  },
  { id:'escasez', label:'🚫 Escasez del plato'      },
  { id:'otro',    label:'💬 Otro motivo'            },
];

export default function TabCola({ onContarPendientes }) {
  const [pedidos,     setPedidos]     = useState([]);
  const [modalAlerta, setModalAlerta] = useState(null);
  const [alerta,      setAlerta]      = useState({ tipo:'demora', desc:'' });
  const [mensaje,     setMensaje]     = useState('');
  const [error,       setError]       = useState('');
  const [cargando,    setCargando]    = useState({});

  const cargar = useCallback(() => {
    getColaCocina().then(r => {
      setPedidos(r.data);
      const pendientes = r.data.filter(
        p => p.estado === 'confirmado'
      ).length;
      onContarPendientes(pendientes);
    });
  }, [onContarPendientes]);

  useEffect(() => {
    cargar();
    const iv = setInterval(cargar, 8000);
    return () => clearInterval(iv);
  }, [cargar]);

  const mostrar = (msg, err = false) => {
    err ? setError(msg) : setMensaje(msg);
    setTimeout(() => { setMensaje(''); setError(''); }, 3000);
  };

  const handleCambiarEstado = async (pedido, accion) => {
    setCargando(prev => ({ ...prev, [pedido.id_pedidos]: true }));
    try {
      await cambiarEstado(pedido.id_pedidos, accion);
      const labels = {
        en_cocina: 'en preparación',
        listo:     'listo para despachar',
      };
      mostrar(`Pedido #${pedido.id_pedidos} marcado como ${labels[accion] || accion}`);
      cargar();
    } catch (e) {
      mostrar(e.response?.data?.error || 'Error al cambiar estado', true);
    } finally {
      setCargando(prev => ({ ...prev, [pedido.id_pedidos]: false }));
    }
  };

  const handleAlerta = async () => {
    if (!alerta.desc.trim() && alerta.tipo === 'otro') {
      mostrar('Describe el problema', true); return;
    }
    try {
      await enviarAlerta({
        tipo_alerta: alerta.tipo,
        descripcion: alerta.desc,
        id_pedido:   modalAlerta.id_pedidos,
      });
      mostrar('Alerta enviada al administrador');
      setModalAlerta(null);
      setAlerta({ tipo:'demora', desc:'' });
    } catch (e) {
      mostrar(e.response?.data?.error || 'Error al enviar alerta', true);
    }
  };

  // Calcular tiempo transcurrido
  const tiempoTranscurrido = (fechaCreacion) => {
    const diff = Math.floor(
      (new Date() - new Date(fechaCreacion)) / 60000
    );
    if (diff < 1)  return 'Ahora';
    if (diff < 60) return `${diff} min`;
    return `${Math.floor(diff / 60)}h ${diff % 60}min`;
  };

  const tiempoColor = (fechaCreacion, estado) => {
    const diff = Math.floor(
      (new Date() - new Date(fechaCreacion)) / 60000
    );
    if (estado === 'confirmado' && diff > 5)  return '#E94560';
    if (estado === 'en_cocina'  && diff > 15) return '#FAC775';
    return '#8AADCA';
  };

  // Separar por estado
  const nuevos      = pedidos.filter(p => p.estado === 'confirmado');
  const preparando  = pedidos.filter(p => p.estado === 'en_cocina');
  const listos      = pedidos.filter(p => p.estado === 'listo');

  return (
    <div>
      {mensaje && <div style={s.toast}>{mensaje}</div>}
      {error   && <div style={s.toastErr}>{error}</div>}

      {/* Resumen rápido */}
      <div style={s.resumen}>
        <div style={{ ...s.resCard, borderColor:'#FAC775' }}>
          <div style={{ ...s.resN, color:'#FAC775' }}>{nuevos.length}</div>
          <div style={s.resL}>Nuevos</div>
        </div>
        <div style={{ ...s.resCard, borderColor:'#7BC8F6' }}>
          <div style={{ ...s.resN, color:'#7BC8F6' }}>{preparando.length}</div>
          <div style={s.resL}>En preparación</div>
        </div>
        <div style={{ ...s.resCard, borderColor:'#9FE1CB' }}>
          <div style={{ ...s.resN, color:'#9FE1CB' }}>{listos.length}</div>
          <div style={s.resL}>Listos</div>
        </div>
        <div style={{ ...s.resCard, borderColor:'#8AADCA' }}>
          <div style={{ ...s.resN, color:'#8AADCA' }}>{pedidos.length}</div>
          <div style={s.resL}>Total activos</div>
        </div>
      </div>

      {pedidos.length === 0 ? (
        <div style={s.empty}>
          <div style={{ fontSize:48, marginBottom:12 }}>🍽️</div>
          <div>No hay pedidos pendientes</div>
        </div>
      ) : (
        <div>
          {/* Sección Nuevos */}
          {nuevos.length > 0 && (
            <SeccionPedidos
              titulo="🔔 Nuevos pedidos"
              pedidos={nuevos}
              cargando={cargando}
              onCambiar={handleCambiarEstado}
              onAlerta={setModalAlerta}
              tiempoTranscurrido={tiempoTranscurrido}
              tiempoColor={tiempoColor}
            />
          )}

          {/* Sección En preparación */}
          {preparando.length > 0 && (
            <SeccionPedidos
              titulo="👨‍🍳 En preparación"
              pedidos={preparando}
              cargando={cargando}
              onCambiar={handleCambiarEstado}
              onAlerta={setModalAlerta}
              tiempoTranscurrido={tiempoTranscurrido}
              tiempoColor={tiempoColor}
            />
          )}

          {/* Sección Listos */}
          {listos.length > 0 && (
            <SeccionPedidos
              titulo="✅ Listos para despacho"
              pedidos={listos}
              cargando={cargando}
              onCambiar={handleCambiarEstado}
              onAlerta={setModalAlerta}
              tiempoTranscurrido={tiempoTranscurrido}
              tiempoColor={tiempoColor}
            />
          )}
        </div>
      )}

      {/* Modal alerta */}
      {modalAlerta && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitulo}>
                ⚠️ Enviar alerta — Pedido #{modalAlerta.id_pedidos}
              </h3>
              <button style={s.closeBtn}
                onClick={() => setModalAlerta(null)}>✕</button>
            </div>

            <p style={{ fontSize:13, color:'#8AADCA', marginBottom:12 }}>
              Mesa: {modalAlerta.mesa_identificador || '—'}
            </p>

            <label style={s.label}>Tipo de alerta</label>
            <div style={{ display:'flex', flexDirection:'column', gap:6,
                          marginBottom:12 }}>
              {ALERTAS.map(a => (
                <button key={a.id} style={{
                  ...s.alertaBtn,
                  background: alerta.tipo === a.id ? '#2E3F52' : '#1A2A3A',
                  borderColor: alerta.tipo === a.id ? '#FAC775' : '#2E3F52',
                  color: alerta.tipo === a.id ? '#FAC775' : '#8AADCA',
                }} onClick={() => setAlerta({ ...alerta, tipo: a.id })}>
                  {a.label}
                </button>
              ))}
            </div>

            <label style={s.label}>Descripción adicional (opcional)</label>
            <textarea style={s.textarea}
              placeholder="Explica el problema..."
              value={alerta.desc}
              onChange={e => setAlerta({ ...alerta, desc: e.target.value })}
            />

            <div style={s.modalFooter}>
              <button style={s.btnSecundario}
                onClick={() => setModalAlerta(null)}>Cancelar</button>
              <button style={{ ...s.btnPrimario, background:'#E94560' }}
                onClick={handleAlerta}>
                Enviar alerta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente reutilizable para cada sección
function SeccionPedidos({ titulo, pedidos, cargando, onCambiar,
                           onAlerta, tiempoTranscurrido, tiempoColor }) {
  const ESTADO_INFO = {
    confirmado: { color:'#FAC775', bg:'#2D2416', label:'Nuevo',
                  siguiente:'en_cocina', btnLabel:'▶ Iniciar preparación',
                  btnColor:'#854F0B' },
    en_cocina:  { color:'#7BC8F6', bg:'#0D2137', label:'En preparación',
                  siguiente:'listo',    btnLabel:'✅ Marcar como listo',
                  btnColor:'#0F6E56' },
    listo:      { color:'#9FE1CB', bg:'#0D2A1E', label:'¡Listo!',
                  siguiente:null,       btnLabel:null,
                  btnColor:null },
  };

  return (
    <div style={{ marginBottom:'1.5rem' }}>
      <div style={s.seccionTitulo}>{titulo}</div>
      <div style={s.grid}>
        {pedidos.map(p => {
          const ei      = ESTADO_INFO[p.estado] || ESTADO_INFO.confirmado;
          const tiempo  = tiempoTranscurrido(p.tiempo_creacion);
          const tColor  = tiempoColor(p.tiempo_creacion, p.estado);
          const cargandoEste = cargando[p.id_pedidos];

          return (
            <div key={p.id_pedidos} style={{
              ...s.card,
              borderTopColor: ei.color,
              background:     ei.bg,
            }}>
              {/* Header de la tarjeta */}
              <div style={s.cardHeader}>
                <div>
                  <div style={{ fontSize:18, fontWeight:700,
                                 color:'#fff' }}>
                    Mesa {p.mesa_identificador || '—'}
                  </div>
                  <div style={{ fontSize:11, color:ei.color,
                                 fontWeight:600 }}>
                    {ei.label}
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:14, fontWeight:700,
                                 color:tColor }}>
                    ⏱ {tiempo}
                  </div>
                  <div style={{ fontSize:11, color:'#8AADCA' }}>
                    #{p.id_pedidos}
                  </div>
                </div>
              </div>

              {/* Detalles */}
              <div style={s.detalles}>
                {p.detalles?.map(d => (
                  <div key={d.id_detalle} style={s.detalleItem}>
                    <span style={s.cantidad}>{d.cantidad}x</span>
                    <span style={s.nombrePlato}>
                      {d.producto_nombre}
                    </span>
                  </div>
                ))}
              </div>

              {/* Observaciones */}
              {p.observaciones && (
                <div style={s.obs}>
                  📝 {p.observaciones}
                </div>
              )}

              {/* Botones de acción */}
              <div style={s.cardFooter}>
                {ei.siguiente && (
                  <button
                    style={{
                      ...s.btnAccion,
                      background: cargandoEste ? '#333' : ei.btnColor,
                      opacity:    cargandoEste ? 0.7 : 1,
                    }}
                    disabled={cargandoEste}
                    onClick={() => onCambiar(p, ei.siguiente)}>
                    {cargandoEste ? 'Actualizando...' : ei.btnLabel}
                  </button>
                )}
                {p.estado === 'listo' && (
                  <div style={{ ...s.listoIndicador }}>
                    ✅ Esperando al mesero
                  </div>
                )}
                <button style={s.btnAlerta}
                  onClick={() => onAlerta(p)}>
                  ⚠️
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const s = {
  toast:       { background:'#1A3A2A', color:'#9FE1CB',
                 padding:'10px 14px', borderRadius:8,
                 marginBottom:12, fontSize:13 },
  toastErr:    { background:'#3A1A1A', color:'#E94560',
                 padding:'10px 14px', borderRadius:8,
                 marginBottom:12, fontSize:13 },
  resumen:     { display:'grid',
                 gridTemplateColumns:'repeat(auto-fit,minmax(100px,1fr))',
                 gap:10, marginBottom:'1.5rem' },
  resCard:     { background:'#16213E', borderRadius:10,
                 padding:'12px', textAlign:'center',
                 border:'1.5px solid' },
  resN:        { fontSize:28, fontWeight:700 },
  resL:        { fontSize:11, color:'#8AADCA', marginTop:2 },
  empty:       { textAlign:'center', color:'#8AADCA',
                 padding:'4rem', fontSize:16,
                 background:'#16213E', borderRadius:12 },
  seccionTitulo:{ fontSize:14, fontWeight:700, color:'#8AADCA',
                  marginBottom:10, textTransform:'uppercase',
                  letterSpacing:'.05em' },
  grid:        { display:'grid',
                 gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',
                 gap:12 },
  card:        { borderRadius:12, padding:'1rem',
                 borderTop:'3px solid',
                 border:'1px solid #2E3F52',
                 display:'flex', flexDirection:'column', gap:10 },
  cardHeader:  { display:'flex', justifyContent:'space-between',
                 alignItems:'flex-start' },
  detalles:    { background:'rgba(0,0,0,0.2)', borderRadius:8,
                 padding:'8px 10px' },
  detalleItem: { display:'flex', alignItems:'center', gap:8,
                 padding:'4px 0',
                 borderBottom:'1px solid rgba(255,255,255,0.05)' },
  cantidad:    { fontSize:13, fontWeight:700, color:'#FAC775',
                 minWidth:25 },
  nombrePlato: { fontSize:13, color:'#fff' },
  obs:         { fontSize:12, color:'#8AADCA', fontStyle:'italic',
                 background:'rgba(0,0,0,0.2)', padding:'6px 10px',
                 borderRadius:6 },
  cardFooter:  { display:'flex', gap:8, alignItems:'center' },
  btnAccion:   { flex:1, padding:'9px', borderRadius:8, border:'none',
                 color:'#fff', cursor:'pointer', fontSize:13,
                 fontWeight:600 },
  listoIndicador:{ flex:1, textAlign:'center', fontSize:13,
                   color:'#9FE1CB', fontWeight:600 },
  btnAlerta:   { padding:'8px 10px', borderRadius:8,
                 background:'rgba(233,69,96,0.2)',
                 border:'1px solid #E94560',
                 color:'#E94560', cursor:'pointer', fontSize:14 },
  overlay:     { position:'fixed', inset:0,
                 background:'rgba(0,0,0,0.7)',
                 display:'flex', alignItems:'center',
                 justifyContent:'center', zIndex:200, padding:'1rem' },
  modal:       { background:'#16213E', borderRadius:12,
                 width:'100%', maxWidth:400,
                 border:'1px solid #2E3F52' },
  modalHeader: { display:'flex', justifyContent:'space-between',
                 alignItems:'center', padding:'1rem 1.25rem',
                 borderBottom:'1px solid #2E3F52' },
  modalTitulo: { fontSize:14, fontWeight:700, color:'#FAC775', margin:0 },
  closeBtn:    { background:'none', border:'none', fontSize:18,
                 cursor:'pointer', color:'#8AADCA' },
  label:       { fontSize:12, fontWeight:600, color:'#8AADCA',
                 display:'block', marginBottom:6,
                 padding:'0 1.25rem' },
  alertaBtn:   { padding:'10px 14px', borderRadius:8,
                 border:'1.5px solid', cursor:'pointer',
                 fontSize:13, textAlign:'left',
                 margin:'0 1.25rem',
                 transition:'all .15s' },
  textarea:    { width:'calc(100% - 2.5rem)', margin:'0 1.25rem 12px',
                 padding:'8px 12px', borderRadius:8,
                 border:'1px solid #2E3F52',
                 background:'#0D1B2A', color:'#fff',
                 fontSize:13, resize:'vertical', minHeight:70 },
  modalFooter: { display:'flex', gap:8, justifyContent:'flex-end',
                 padding:'1rem 1.25rem',
                 borderTop:'1px solid #2E3F52' },
  btnPrimario: { padding:'9px 20px', borderRadius:8, border:'none',
                 color:'#fff', cursor:'pointer',
                 fontSize:13, fontWeight:600 },
  btnSecundario:{ padding:'9px 20px', borderRadius:8,
                  background:'#2E3F52', color:'#8AADCA',
                  border:'none', cursor:'pointer', fontSize:13 },
};
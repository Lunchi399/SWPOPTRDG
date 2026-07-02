import { useEffect, useState } from 'react';
import { getPedidosPorCobrar, calcularTotal,
         registrarPago } from '../../../services/cajaService';

const METODOS = [
  { id:'efectivo', label:'💵 Efectivo', icon:'💵' },
  { id:'yape',     label:'📱 Yape',     icon:'📱' },
  { id:'plin',     label:'📲 Plin',     icon:'📲' },
  { id:'tarjeta',  label:'💳 Tarjeta',  icon:'💳' },
];

const COMPROBANTES = [
  { id:'boleta',  label:'Boleta'  },
  { id:'factura', label:'Factura' },
  { id:'ninguno', label:'Ninguno' },
];

export default function TabCobro({ onContarPendientes }) {
  const [pedidos,      setPedidos]      = useState([]);
  const [pedidoSel,    setPedidoSel]    = useState(null);
  const [resumen,      setResumen]      = useState(null);
  const [modal,        setModal]        = useState(false);
  const [mensaje,      setMensaje]      = useState('');
  const [error,        setError]        = useState('');
  const [cargando,     setCargando]     = useState(false);
  const [pago, setPago] = useState({
    metodo_pago:      'efectivo',
    monto_recibido:   '',
    tipo_comprobante: 'boleta',
    datos_factura: {
      ruc: '', razon_social: '', direccion_fiscal: ''
    }
  });

  const cargar = () =>
    getPedidosPorCobrar().then(r => {
      setPedidos(r.data);
      onContarPendientes(r.data.length);
    });

  useEffect(() => {
    cargar();
    const iv = setInterval(cargar, 10000);
    return () => clearInterval(iv);
  }, []);

  const mostrar = (msg, err = false) => {
    err ? setError(msg) : setMensaje(msg);
    setTimeout(() => { setMensaje(''); setError(''); }, 4000);
  };

  const abrirCobro = async (pedido) => {
    setCargando(true);
    try {
      const res = await calcularTotal(pedido.id_pedidos);
      setResumen(res.data);
      setPedidoSel(pedido);
      setPago({
        metodo_pago:      'efectivo',
        monto_recibido:   '',
        tipo_comprobante: 'boleta',
        datos_factura: { ruc:'', razon_social:'', direccion_fiscal:'' }
      });
      setModal(true);
    } catch (e) {
      mostrar('Error al calcular el total', true);
    } finally {
      setCargando(false);
    }
  };

  const vuelto = () => {
    if (!resumen || !pago.monto_recibido) return null;
    const v = parseFloat(pago.monto_recibido) - parseFloat(resumen.total);
    return v;
  };

  const handlePagar = async () => {
    if (!resumen) return;

    if (pago.metodo_pago === 'efectivo') {
      if (!pago.monto_recibido) {
        mostrar('Ingresa el monto recibido', true); return;
      }
      if (parseFloat(pago.monto_recibido) < parseFloat(resumen.total)) {
        mostrar('El monto recibido es insuficiente', true); return;
      }
    }

    if (pago.tipo_comprobante === 'factura') {
      if (!pago.datos_factura.ruc || !pago.datos_factura.razon_social) {
        mostrar('Completa los datos de factura (RUC y razón social)', true);
        return;
      }
    }

    setCargando(true);
    try {
      const body = {
        id_pedidos:       resumen.id_pedidos,
        metodo_pago:      pago.metodo_pago,
        monto_recibido:   pago.metodo_pago === 'efectivo'
                          ? parseFloat(pago.monto_recibido)
                          : parseFloat(resumen.total),
        tipo_comprobante: pago.tipo_comprobante,
        ...(pago.tipo_comprobante === 'factura'
          ? { datos_factura: pago.datos_factura }
          : {}),
      };

      await registrarPago(body);
      mostrar(`Pago registrado — Mesa ${resumen.mesa}`);
      setModal(false);
      setPedidoSel(null);
      setResumen(null);
      cargar();
    } catch (e) {
      mostrar(e.response?.data?.error || 'Error al registrar pago', true);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div>
      {mensaje && <div style={s.toast}>{mensaje}</div>}
      {error   && <div style={s.toastErr}>{error}</div>}

      <div style={s.topbar}>
        <h2 style={s.titulo}>Pedidos para cobrar</h2>
        <span style={{ fontSize:13, color:'#888' }}>
          {pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''} pendiente{pedidos.length !== 1 ? 's' : ''}
        </span>
      </div>

      {pedidos.length === 0 ? (
        <div style={s.empty}>
          <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
          <div>No hay pedidos pendientes de cobro</div>
        </div>
      ) : (
        <div style={s.grid}>
          {pedidos.map(p => (
            <div key={p.id_pedidos} style={s.pedidoCard}>
              <div style={s.cardHeader}>
                <div style={s.mesaNombre}>
                  Mesa {p.mesa_identificador || '—'}
                </div>
                <span style={s.estadoPill}>Despachado</span>
              </div>

              <div style={s.detalles}>
                {p.detalles?.map(d => (
                  <div key={d.id_detalle} style={s.detalleItem}>
                    <span style={{ fontSize:13 }}>
                      {d.cantidad}x {d.producto_nombre}
                    </span>
                    <span style={{ fontSize:13, color:'#0F6E56',
                                   fontWeight:600 }}>
                      S/. {d.subtotal}
                    </span>
                  </div>
                ))}
              </div>

              <div style={s.cardFooter}>
                <div>
                  <div style={{ fontSize:12, color:'#888' }}>Total estimado</div>
                  <div style={{ fontSize:18, fontWeight:700,
                                 color:'#0F6E56' }}>
                    S/. {p.total}
                  </div>
                </div>
                <button style={s.btnCobrar}
                  onClick={() => abrirCobro(p)}
                  disabled={cargando}>
                  💳 Cobrar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de cobro */}
      {modal && resumen && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitulo}>
                Cobro — Mesa {resumen.mesa}
              </h3>
              <button style={s.closeBtn}
                onClick={() => setModal(false)}>✕</button>
            </div>

            {/* Resumen del pedido */}
            <div style={s.resumenBox}>
              <div style={s.resumenTitulo}>Detalle del pedido</div>
              {resumen.detalles?.map((d, i) => (
                <div key={i} style={s.resumenItem}>
                  <span style={{ fontSize:13 }}>
                    {d.cantidad}x {d.nombre}
                  </span>
                  <span style={{ fontSize:13 }}>
                    S/. {d.subtotal}
                  </span>
                </div>
              ))}
              <div style={s.resumenDivider} />
              <div style={s.resumenItem}>
                <span style={{ fontSize:13, color:'#888' }}>Subtotal</span>
                <span style={{ fontSize:13 }}>S/. {resumen.subtotal}</span>
              </div>
              <div style={s.resumenItem}>
                <span style={{ fontSize:13, color:'#888' }}>IGV (18%)</span>
                <span style={{ fontSize:13 }}>S/. {resumen.igv}</span>
              </div>
              <div style={{ ...s.resumenItem, marginTop:6 }}>
                <span style={{ fontSize:16, fontWeight:700 }}>TOTAL</span>
                <span style={{ fontSize:20, fontWeight:700,
                               color:'#0F6E56' }}>
                  S/. {resumen.total}
                </span>
              </div>
            </div>

            {/* Método de pago */}
            <div style={s.seccion}>
              <div style={s.seccionLabel}>Método de pago</div>
              <div style={s.metodosGrid}>
                {METODOS.map(m => (
                  <button key={m.id} style={{
                    ...s.metodoBtn,
                    background: pago.metodo_pago === m.id
                      ? '#E6F1FB' : '#F8F7F2',
                    borderColor: pago.metodo_pago === m.id
                      ? '#185FA5' : '#ddd',
                    color: pago.metodo_pago === m.id
                      ? '#0C447C' : '#555',
                  }} onClick={() => setPago({
                    ...pago, metodo_pago: m.id
                  })}>
                    <span style={{ fontSize:20 }}>{m.icon}</span>
                    <span style={{ fontSize:12, fontWeight:600 }}>
                      {m.id.charAt(0).toUpperCase() + m.id.slice(1)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Monto recibido — solo efectivo */}
            {pago.metodo_pago === 'efectivo' && (
              <div style={s.seccion}>
                <div style={s.seccionLabel}>Monto recibido</div>
                <input style={s.inputGrande}
                  type="number" step="0.01"
                  placeholder={`Mínimo S/. ${resumen.total}`}
                  value={pago.monto_recibido}
                  onChange={e => setPago({
                    ...pago, monto_recibido: e.target.value
                  })}
                />
                {vuelto() !== null && vuelto() >= 0 && (
                  <div style={s.vueltoBox}>
                    <span>Vuelto:</span>
                    <span style={{ fontWeight:700, color:'#0F6E56',
                                   fontSize:18 }}>
                      S/. {vuelto().toFixed(2)}
                    </span>
                  </div>
                )}
                {vuelto() !== null && vuelto() < 0 && (
                  <div style={{ ...s.vueltoBox,
                                background:'#FAECE7', color:'#993C1D' }}>
                    Monto insuficiente — faltan S/. {Math.abs(vuelto()).toFixed(2)}
                  </div>
                )}
              </div>
            )}

            {/* Tipo de comprobante */}
            <div style={s.seccion}>
              <div style={s.seccionLabel}>Tipo de comprobante</div>
              <div style={s.comprobantesRow}>
                {COMPROBANTES.map(c => (
                  <button key={c.id} style={{
                    ...s.comprobanteBtn,
                    background: pago.tipo_comprobante === c.id
                      ? '#E6F1FB' : '#F8F7F2',
                    borderColor: pago.tipo_comprobante === c.id
                      ? '#185FA5' : '#ddd',
                    color: pago.tipo_comprobante === c.id
                      ? '#0C447C' : '#555',
                  }} onClick={() => setPago({
                    ...pago, tipo_comprobante: c.id
                  })}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Datos de factura */}
            {pago.tipo_comprobante === 'factura' && (
              <div style={s.seccion}>
                <div style={s.seccionLabel}>Datos de factura</div>
                <input style={s.input}
                          placeholder="RUC * (11 dígitos)"
                          maxLength={11}
                          value={pago.datos_factura.ruc}
                          onChange={e => {
                            // Solo permitir números
                            const val = e.target.value.replace(/\D/g, '');
                            setPago({
                              ...pago,
                              datos_factura: { ...pago.datos_factura, ruc: val }
                            });
                          }}
                        />
                        {pago.datos_factura.ruc &&
                        pago.datos_factura.ruc.length !== 11 && (
                          <div style={{ fontSize:11, color:'#EF4444', marginTop:4 }}>
                            El RUC debe tener 11 dígitos
                          </div>
                        )}
                <input style={{ ...s.input, marginTop:8 }}
                  placeholder="Razón social *"
                  value={pago.datos_factura.razon_social}
                  onChange={e => setPago({
                    ...pago,
                    datos_factura: {
                      ...pago.datos_factura,
                      razon_social: e.target.value
                    }
                  })}
                />
                <input style={{ ...s.input, marginTop:8 }}
                  placeholder="Dirección fiscal (opcional)"
                  value={pago.datos_factura.direccion_fiscal}
                  onChange={e => setPago({
                    ...pago,
                    datos_factura: {
                      ...pago.datos_factura,
                      direccion_fiscal: e.target.value
                    }
                  })}
                />
              </div>
            )}

            <div style={s.modalFooter}>
              <button style={s.btnSecundario}
                onClick={() => setModal(false)}>
                Cancelar
              </button>
              <button style={s.btnPagar}
                onClick={handlePagar}
                disabled={cargando}>
                {cargando ? 'Procesando...' : `✅ Registrar pago S/. ${resumen.total}`}
              </button>
            </div>
          </div>
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
  topbar:     { display:'flex', justifyContent:'space-between',
                alignItems:'center', marginBottom:'1.25rem' },
  titulo:     { fontSize:18, fontWeight:700, color:'#1E2D40', margin:0 },
  empty:      { textAlign:'center', color:'#888', padding:'4rem',
                background:'#fff', borderRadius:12, fontSize:15 },
  grid:       { display:'grid',
                gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',
                gap:12 },
  pedidoCard: { background:'#fff', borderRadius:12, padding:'1rem 1.25rem',
                border:'1px solid #E8E6DF',
                borderTop:'3px solid #2E5F8A' },
  cardHeader: { display:'flex', justifyContent:'space-between',
                alignItems:'center', marginBottom:10 },
  mesaNombre: { fontSize:17, fontWeight:700, color:'#1E2D40' },
  estadoPill: { fontSize:11, fontWeight:500, padding:'3px 10px',
                borderRadius:20, background:'#EEEDFE', color:'#3C3489' },
  detalles:   { background:'#F8F7F2', borderRadius:8,
                padding:'8px 10px', marginBottom:10 },
  detalleItem:{ display:'flex', justifyContent:'space-between',
                padding:'4px 0', borderBottom:'1px solid #eee' },
  cardFooter: { display:'flex', justifyContent:'space-between',
                alignItems:'center' },
  btnCobrar:  { padding:'10px 20px', borderRadius:8, background:'#0F6E56',
                color:'#fff', border:'none', cursor:'pointer',
                fontSize:14, fontWeight:600 },
  overlay:    { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)',
                display:'flex', alignItems:'center', justifyContent:'center',
                zIndex:200, padding:'1rem' },
  modal:      { background:'#fff', borderRadius:12, width:'100%',
                maxWidth:480, maxHeight:'92vh', overflowY:'auto' },
  modalHeader:{ display:'flex', justifyContent:'space-between',
                alignItems:'center', padding:'1rem 1.25rem',
                borderBottom:'1px solid #eee', position:'sticky',
                top:0, background:'#fff', zIndex:1 },
  modalTitulo:{ fontSize:15, fontWeight:700, color:'#1E2D40', margin:0 },
  closeBtn:   { background:'none', border:'none', fontSize:18,
                cursor:'pointer', color:'#888' },
  resumenBox: { margin:'1rem 1.25rem', background:'#F8F7F2',
                borderRadius:8, padding:'10px 12px' },
  resumenTitulo:{ fontSize:12, fontWeight:700, color:'#888',
                  textTransform:'uppercase', letterSpacing:'.05em',
                  marginBottom:8 },
  resumenItem:{ display:'flex', justifyContent:'space-between',
                padding:'4px 0' },
  resumenDivider:{ borderTop:'1px dashed #ddd', margin:'6px 0' },
  seccion:    { padding:'0 1.25rem', marginBottom:'1rem' },
  seccionLabel:{ fontSize:12, fontWeight:600, color:'#555',
                 marginBottom:8, textTransform:'uppercase',
                 letterSpacing:'.05em' },
  metodosGrid:{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 },
  metodoBtn:  { padding:'10px 6px', borderRadius:8, border:'1.5px solid',
                cursor:'pointer', display:'flex', flexDirection:'column',
                alignItems:'center', gap:4, transition:'all .15s' },
  inputGrande:{ width:'100%', padding:'12px 14px', borderRadius:8,
                border:'1px solid #ddd', fontSize:16, fontWeight:600 },
  vueltoBox:  { display:'flex', justifyContent:'space-between',
                alignItems:'center', marginTop:8, padding:'8px 12px',
                background:'#E1F5EE', borderRadius:8, fontSize:14 },
  comprobantesRow:{ display:'flex', gap:8 },
  comprobanteBtn:{ flex:1, padding:'9px', borderRadius:8,
                   border:'1.5px solid', cursor:'pointer',
                   fontSize:13, fontWeight:500,
                   transition:'all .15s' },
  input:      { width:'100%', padding:'9px 12px', borderRadius:8,
                border:'1px solid #ddd', fontSize:13 },
  modalFooter:{ display:'flex', gap:8, justifyContent:'flex-end',
                padding:'1rem 1.25rem', borderTop:'1px solid #eee',
                position:'sticky', bottom:0, background:'#fff' },
  btnSecundario:{ padding:'10px 20px', borderRadius:8, background:'#eee',
                  color:'#555', border:'none', cursor:'pointer', fontSize:13 },
  btnPagar:   { padding:'10px 24px', borderRadius:8, background:'#0F6E56',
                color:'#fff', border:'none', cursor:'pointer',
                fontSize:14, fontWeight:600 },
};
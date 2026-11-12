import { useEffect, useState } from 'react';
import { getPedidosInsumo, crearPedidoInsumo,
         marcarEntrega, getInsumos } from '../../../services/inventarioService';

export default function TabPedidos() {
  const [lista,   setLista]   = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [modal,   setModal]   = useState(null);
  const [tipo,    setTipo]    = useState('programado');
  const [form,    setForm]    = useState({ distribuidora:'', observaciones:'' });
  const [detalles, setDetalles] = useState([{ id_insumo:'', cantidad_solicitada:'' }]);
  const [msg,     setMsg]     = useState('');
  const [error,   setError]   = useState('');

  const cargar = () => getPedidosInsumo().then(r => setLista(r.data));
  useEffect(() => {
    cargar();
    getInsumos().then(r => setInsumos(r.data));
  }, []);

  const mostrar = (m, err=false) => {
    err ? setError(m) : setMsg(m);
    setTimeout(() => { setMsg(''); setError(''); }, 3000);
  };

  const agregarDetalle = () =>
    setDetalles([...detalles,
      { id_insumo:'', cantidad_solicitada:'' }]);

  const quitarDetalle = (i) =>
    setDetalles(detalles.filter((_, idx) => idx !== i));

  const handleCrear = async () => {
    if (!form.distribuidora.trim()) {
      mostrar('La distribuidora es obligatoria', true); return;
    }
    const det = detalles.filter(d => d.id_insumo && d.cantidad_solicitada);
    if (det.length === 0) {
      mostrar('Agrega al menos un insumo', true); return;
    }
    try {
      await crearPedidoInsumo({
        tipo_pedido:   tipo,
        distribuidora: form.distribuidora,
        observaciones: form.observaciones,
        detalles:      det,
      });
      mostrar(`Pedido ${tipo} registrado correctamente`);
      setModal(null);
      setDetalles([{ id_insumo:'', cantidad_solicitada:'' }]);
      setForm({ distribuidora:'', observaciones:'' });
      cargar();
    } catch (e) {
      mostrar(e.response?.data?.error || 'Error', true);
    }
  };

  const handleEntregar = async (id) => {
    try {
      await marcarEntrega(id, {});
      mostrar('Entrega registrada y stock actualizado');
      cargar();
    } catch (e) {
      mostrar(e.response?.data?.error || 'Error', true);
    }
  };

  return (
    <div>
      {msg   && <div style={s.toast}>{msg}</div>}
      {error && <div style={s.toastErr}>{error}</div>}

      <div style={s.topBar}>
        <h2 style={s.secTitle}>Pedidos de insumos</h2>
        <div style={{ display:'flex', gap:8 }}>
          <button style={s.btnSec}
            onClick={() => { setTipo('programado'); setModal('crear'); }}>
            + Pedido programado
          </button>
          <button style={s.btnPrimario}
            onClick={() => { setTipo('espontaneo'); setModal('crear'); }}>
            ⚡ Pedido espontáneo
          </button>
        </div>
      </div>

      <div style={s.lista}>
        {lista.map(p => (
          <div key={p.id_pedido_insumo} style={s.card}>
            <div style={s.cardHeader}>
              <div>
                <span style={{
                  ...s.tipoPill,
                  background: p.tipo_pedido === 'programado'
                    ? '#EEF2FF' : '#FFFBEB',
                  color: p.tipo_pedido === 'programado'
                    ? '#4338CA' : '#B45309',
                }}>
                  {p.tipo_pedido === 'espontaneo' ? '⚡' : '📅'} {p.tipo_pedido}
                </span>
                <strong style={{ fontSize:14, color:'#0F1628' }}>
                  {p.distribuidora}
                </strong>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                {p.minutos_espera != null && (
                  <span style={{ fontSize:12, color:'#6B7280' }}>
                    ⏱ {p.minutos_espera} min
                  </span>
                )}
                <span style={{
                  ...s.estadoPill,
                  background: p.estado_entrega === 'entregado'
                    ? '#ECFDF5' : '#FFFBEB',
                  color: p.estado_entrega === 'entregado'
                    ? '#059669' : '#B45309',
                }}>
                  {p.estado_entrega}
                </span>
                {p.estado_entrega === 'pendiente' && (
                  <button style={s.btnEntregar}
                    onClick={() => handleEntregar(p.id_pedido_insumo)}>
                    ✅ Marcar entregado
                  </button>
                )}
              </div>
            </div>
            <div style={s.detalles}>
              {p.detalles?.map(d => (
                <span key={d.id_detalle_pedido_insumo} style={s.detalleTag}>
                  {d.insumo_nombre}: {d.cantidad_solicitada}
                  {d.cantidad_recibida && ` (recibido: ${d.cantidad_recibida})`}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal === 'crear' && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitulo}>
                {tipo === 'programado' ? '📅 Pedido programado' : '⚡ Pedido espontáneo'}
              </h3>
              <button style={s.closeBtn}
                onClick={() => setModal(null)}>✕</button>
            </div>
            <div style={s.modalBody}>
              <div style={{ marginBottom:12 }}>
                <label style={s.label}>Distribuidora / Procedencia *</label>
                <input style={s.input} value={form.distribuidora}
                  placeholder="ej: Mercado Central, Distribuidora López"
                  onChange={e => setForm({...form, distribuidora:e.target.value})} />
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={s.label}>Observaciones</label>
                <textarea style={{ ...s.input, minHeight:60, resize:'vertical' }}
                  value={form.observaciones}
                  onChange={e => setForm({...form, observaciones:e.target.value})} />
              </div>

              <label style={s.label}>Insumos solicitados</label>
              {detalles.map((d, i) => (
                <div key={i} style={s.detalleRow}>
                  <select style={{ ...s.input, flex:2 }}
                    value={d.id_insumo}
                    onChange={e => {
                      const cp = [...detalles];
                      cp[i].id_insumo = e.target.value;
                      setDetalles(cp);
                    }}>
                    <option value="">Seleccionar insumo</option>
                    {insumos.map(ins => (
                      <option key={ins.id_insumo} value={ins.id_insumo}>
                        {ins.nombre} ({ins.unidad_medida})
                      </option>
                    ))}
                  </select>
                  <input style={{ ...s.input, flex:1 }}
                    type="number" step="0.01"
                    placeholder="Cantidad"
                    value={d.cantidad_solicitada}
                    onChange={e => {
                      const cp = [...detalles];
                      cp[i].cantidad_solicitada = e.target.value;
                      setDetalles(cp);
                    }} />
                  {detalles.length > 1 && (
                    <button style={s.btnQuitar}
                      onClick={() => quitarDetalle(i)}>✕</button>
                  )}
                </div>
              ))}
              <button style={s.btnAgregar}
                onClick={agregarDetalle}>
                + Agregar insumo
              </button>
            </div>
            <div style={s.modalFooter}>
              <button style={s.btnSec}
                onClick={() => setModal(null)}>Cancelar</button>
              <button style={s.btnPrimario}
                onClick={handleCrear}>
                Registrar pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  toast:    { background:'#ECFDF5', color:'#059669', padding:'10px 14px', borderRadius:'8px', marginBottom:12, fontSize:13 },
  toastErr: { background:'#FEF2F2', color:'#DC2626', padding:'10px 14px', borderRadius:'8px', marginBottom:12, fontSize:13 },
  topBar:   { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem', flexWrap:'wrap', gap:10 },
  secTitle: { fontSize:16, fontWeight:700, color:'#0F1628', margin:0 },
  lista:    { display:'flex', flexDirection:'column', gap:10 },
  card:     { background:'#fff', borderRadius:'12px', padding:'1rem 1.25rem', border:'1px solid #E8EAF0' },
  cardHeader:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8, flexWrap:'wrap', gap:8 },
  tipoPill: { fontSize:11, fontWeight:500, padding:'3px 10px', borderRadius:'20px', marginRight:8 },
  estadoPill:{ fontSize:11, fontWeight:500, padding:'3px 10px', borderRadius:'20px' },
  btnEntregar:{ padding:'5px 12px', borderRadius:'6px', background:'#ECFDF5', color:'#059669', border:'1px solid #059669', cursor:'pointer', fontSize:12 },
  detalles: { display:'flex', gap:6, flexWrap:'wrap' },
  detalleTag:{ background:'#F9FAFB', border:'1px solid #E8EAF0', borderRadius:'6px', padding:'3px 10px', fontSize:12, color:'#374151' },
  btnPrimario:{ padding:'9px 18px', borderRadius:'8px', background:'#6366F1', color:'#fff', border:'none', cursor:'pointer', fontSize:13, fontWeight:600 },
  btnSec:   { padding:'9px 18px', borderRadius:'8px', background:'#F3F4F6', color:'#6B7280', border:'none', cursor:'pointer', fontSize:13 },
  overlay:  { position:'fixed', inset:0, background:'rgba(15,22,40,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:'1rem', backdropFilter:'blur(2px)' },
  modal:    { background:'#fff', borderRadius:'16px', width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.15)' },
  modalHeader:{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'1.25rem 1.5rem', borderBottom:'1px solid #F3F4F6', position:'sticky', top:0, background:'#fff', zIndex:1 },
  modalTitulo:{ fontSize:16, fontWeight:700, color:'#0F1628', margin:0 },
  closeBtn: { background:'#F3F4F6', border:'none', borderRadius:'50%', width:28, height:28, cursor:'pointer', color:'#6B7280', fontSize:14 },
  modalBody:{ padding:'1.25rem 1.5rem' },
  label:    { fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 },
  input:    { width:'100%', padding:'9px 12px', borderRadius:'8px', border:'1px solid #E8EAF0', fontSize:13, color:'#0F1628', outline:'none' },
  detalleRow:{ display:'flex', gap:8, marginBottom:8 },
  btnQuitar:{ padding:'8px 10px', borderRadius:'6px', background:'#FEF2F2', color:'#DC2626', border:'none', cursor:'pointer' },
  btnAgregar:{ fontSize:12, color:'#6366F1', background:'none', border:'none', cursor:'pointer', padding:'4px 0', marginBottom:8 },
  modalFooter:{ display:'flex', gap:8, justifyContent:'flex-end', padding:'1rem 1.5rem', borderTop:'1px solid #F3F4F6', position:'sticky', bottom:0, background:'#fff' },
};
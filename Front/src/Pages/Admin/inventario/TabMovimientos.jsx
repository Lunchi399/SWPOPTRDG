import { useEffect, useState } from 'react';
import { getInsumos, moverInsumo,
         cambiarEstado, getMovimientos } from '../../../services/inventarioService';

export default function TabMovimientos() {
  const [insumos, setInsumos] = useState([]);
  const [movs,    setMovs]    = useState([]);
  const [form,    setForm]    = useState({ id_insumo:'', cantidad:'', motivo:'' });
  const [msg,     setMsg]     = useState('');
  const [error,   setError]   = useState('');

  const cargar = () => {
    getInsumos().then(r => setInsumos(r.data));
    getMovimientos().then(r => setMovs(r.data));
  };
  useEffect(() => { cargar(); }, []);

  const mostrar = (m, err=false) => {
    err ? setError(m) : setMsg(m);
    setTimeout(() => { setMsg(''); setError(''); }, 3000);
  };

  const handleMover = async () => {
    if (!form.id_insumo || !form.cantidad) {
      mostrar('Selecciona insumo y cantidad', true); return;
    }
    try {
      await moverInsumo({
        id_insumo: form.id_insumo,
        cantidad:  form.cantidad,
        motivo:    form.motivo,
      });
      mostrar('Insumo movido a utilización');
      setForm({ id_insumo:'', cantidad:'', motivo:'' });
      cargar();
    } catch (e) {
      mostrar(e.response?.data?.error || 'Error', true);
    }
  };

  const insumoSel = insumos.find(
    i => String(i.id_insumo) === String(form.id_insumo)
  );

  const TIPO_INFO = {
    entrada:              { color:'#059669', bg:'#ECFDF5', label:'Entrada' },
    almacen_a_utilizacion:{ color:'#2563EB', bg:'#EFF6FF', label:'→ Utilización' },
    utilizado:            { color:'#7C3AED', bg:'#F5F3FF', label:'Utilizado' },
    desperdiciado:        { color:'#DC2626', bg:'#FEF2F2', label:'Desperdicio' },
  };

  return (
    <div>
      {msg   && <div style={s.toast}>{msg}</div>}
      {error && <div style={s.toastErr}>{error}</div>}

      <div style={s.layout}>
        {/* Panel de movimiento */}
        <div style={s.panel}>
          <h3 style={s.panelTitle}>
            🔄 Mover almacén → utilización
          </h3>
          <div style={{ marginBottom:12 }}>
            <label style={s.label}>Insumo</label>
            <select style={s.input} value={form.id_insumo}
              onChange={e => setForm({...form, id_insumo:e.target.value})}>
              <option value="">Seleccionar insumo</option>
              {insumos.filter(i => i.stock_almacen > 0).map(i => (
                <option key={i.id_insumo} value={i.id_insumo}>
                  {i.nombre} — {i.stock_almacen} en almacén
                </option>
              ))}
            </select>
          </div>

          {insumoSel && (
            <div style={s.infoBox}>
              <div>
                <span style={s.infoLabel}>En almacén</span>
                <span style={{ fontWeight:700, color:'#059669' }}>
                  {insumoSel.stock_almacen} {insumoSel.unidad_medida}
                </span>
              </div>
              <div>
                <span style={s.infoLabel}>En utilización</span>
                <span style={{ fontWeight:700, color:'#2563EB' }}>
                  {insumoSel.stock_utilizacion} {insumoSel.unidad_medida}
                </span>
              </div>
            </div>
          )}

          <div style={{ marginBottom:12 }}>
            <label style={s.label}>Cantidad a mover</label>
            <input style={s.input} type="number" step="0.01"
              value={form.cantidad}
              onChange={e => setForm({...form, cantidad:e.target.value})} />
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={s.label}>Motivo (opcional)</label>
            <input style={s.input} value={form.motivo}
              placeholder="ej: Preparación del servicio del día"
              onChange={e => setForm({...form, motivo:e.target.value})} />
          </div>
          <button style={s.btnPrimario} onClick={handleMover}>
            🔄 Confirmar movimiento
          </button>
        </div>

        {/* Historial */}
        <div style={{ flex:1 }}>
          <h3 style={s.panelTitle}>Historial de movimientos</h3>
          <div style={s.movLista}>
            {movs.map(m => {
              const ti = TIPO_INFO[m.tipo_movimiento] || TIPO_INFO.entrada;
              return (
                <div key={m.id_movimiento} style={s.movItem}>
                  <span style={{ ...s.movPill,
                                  background:ti.bg, color:ti.color }}>
                    {ti.label}
                  </span>
                  <span style={{ flex:1, fontSize:13, color:'#374151' }}>
                    {m.insumo_nombre}
                  </span>
                  <span style={{ fontSize:13, fontWeight:600,
                                  color:ti.color }}>
                    {m.cantidad}
                  </span>
                  <span style={{ fontSize:11, color:'#9CA3AF' }}>
                    {new Date(m.fecha_movimiento).toLocaleTimeString(
                      'es-PE', { hour:'2-digit', minute:'2-digit' }
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  toast:     { background:'#ECFDF5', color:'#059669', padding:'10px 14px', borderRadius:'8px', marginBottom:12, fontSize:13 },
  toastErr:  { background:'#FEF2F2', color:'#DC2626', padding:'10px 14px', borderRadius:'8px', marginBottom:12, fontSize:13 },
  layout:    { display:'grid', gridTemplateColumns:'340px 1fr', gap:16 },
  panel:     { background:'#fff', borderRadius:'12px', padding:'1.25rem', border:'1px solid #E8EAF0' },
  panelTitle:{ fontSize:15, fontWeight:700, color:'#0F1628', margin:'0 0 14px' },
  label:     { fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 },
  input:     { width:'100%', padding:'9px 12px', borderRadius:'8px', border:'1px solid #E8EAF0', fontSize:13, color:'#0F1628', outline:'none', marginBottom:0 },
  infoBox:   { background:'#F9FAFB', borderRadius:'8px', padding:'10px 12px', display:'flex', gap:16, marginBottom:12 },
  infoLabel: { fontSize:11, color:'#9CA3AF', display:'block', marginBottom:2 },
  btnPrimario:{ width:'100%', padding:'10px', borderRadius:'8px', background:'#6366F1', color:'#fff', border:'none', cursor:'pointer', fontSize:13, fontWeight:600 },
  movLista:  { display:'flex', flexDirection:'column', gap:6, background:'#fff', borderRadius:'12px', padding:'1rem', border:'1px solid #E8EAF0', maxHeight:500, overflowY:'auto' },
  movItem:   { display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid #F3F4F6' },
  movPill:   { fontSize:11, fontWeight:500, padding:'3px 8px', borderRadius:'20px', flexShrink:0 },
};
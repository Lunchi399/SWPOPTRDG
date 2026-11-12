import { useEffect, useState } from 'react';
import { getInsumos, crearInsumo, editarInsumo,
         desactivarInsumo } from '../../../services/inventarioService';

const CAT = ['carnes','verduras','lacteos','bebidas','abarrotes','otros'];
const ALM = ['paquetes','cajas','botellas','baldes','otros'];
const FORM_VACIO = {
  nombre:'', categoria:'carnes', unidad_medida:'kg',
  tipo_almacenaje:'cajas', stock_almacen:0, stock_minimo:0,
};

const svg = { width:16, height:16, viewBox:'0 0 24 24', fill:'none', stroke:'currentColor',
              strokeWidth:2, strokeLinecap:'round', strokeLinejoin:'round' };
const IconBuscar   = () => (<svg {...svg} width="18" height="18"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>);
const IconEditar   = () => (<svg {...svg}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>);
const IconEliminar = () => (<svg {...svg}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>);

export default function TabInsumos() {
  const [lista,     setLista]     = useState([]);
  const [modal,     setModal]     = useState(null);
  const [sel,       setSel]       = useState(null);
  const [form,      setForm]      = useState(FORM_VACIO);
  const [buscar,    setBuscar]    = useState('');
  const [filtroCat, setFiltroCat] = useState('todos');
  const [msg,       setMsg]       = useState('');
  const [error,     setError]     = useState('');

  const cargar = () => getInsumos().then(r => setLista(r.data));
  useEffect(() => { cargar(); }, []);

  const mostrar = (texto, err = false) => {
    err ? setError(texto) : setMsg(texto);
    setTimeout(() => { setMsg(''); setError(''); }, 3000);
  };

  const handleCrear = async () => {
    if (!form.nombre.trim()) { mostrar('El nombre es obligatorio', true); return; }
    try {
      await crearInsumo(form);
      mostrar('Insumo creado correctamente');
      setModal(null); cargar();
    } catch (e) { mostrar(JSON.stringify(e.response?.data), true); }
  };

  const handleEditar = async () => {
    try {
      await editarInsumo(sel.id_insumo, form);
      mostrar('Insumo actualizado');
      setModal(null); cargar();
    } catch (e) { mostrar(JSON.stringify(e.response?.data), true); }
  };

  const handleEliminar = async (ins) => {
    if (!window.confirm(`¿Eliminar "${ins.nombre}"? Dejará de aparecer en el inventario.`)) return;
    try {
      await desactivarInsumo(ins.id_insumo);
      mostrar('Insumo eliminado');
      cargar();
    } catch (e) { mostrar(e.response?.data?.error || 'No se pudo eliminar', true); }
  };

  const abrirEditar = (ins) => {
    setSel(ins);
    setForm({
      nombre: ins.nombre, categoria: ins.categoria,
      unidad_medida: ins.unidad_medida, tipo_almacenaje: ins.tipo_almacenaje,
      stock_almacen: ins.stock_almacen, stock_minimo: ins.stock_minimo,
    });
    setModal('editar');
  };

  const listaFiltrada = lista.filter(i =>
    i.nombre.toLowerCase().includes(buscar.toLowerCase()) &&
    (filtroCat === 'todos' || i.categoria === filtroCat));

  return (
    <div>
      {msg   && <div style={s.toast}>{msg}</div>}
      {error && <div style={s.toastErr}>{error}</div>}

      {/* Barra superior */}
      <div style={s.barra}>
        <div style={s.buscador}>
          <IconBuscar />
          <input style={s.inputBuscar} placeholder="Buscar insumo por nombre…"
            value={buscar} onChange={e => setBuscar(e.target.value)} />
        </div>
        <span style={s.contador}>
          {listaFiltrada.length} insumo{listaFiltrada.length === 1 ? '' : 's'}
        </span>
        <select style={s.select} value={filtroCat}
          onChange={e => setFiltroCat(e.target.value)}>
          <option value="todos">Todas las categorías</option>
          {CAT.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button style={s.btnPrimario}
          onClick={() => { setForm(FORM_VACIO); setModal('crear'); }}>
          + Nuevo insumo
        </button>
      </div>

      {/* Tabla */}
      <div style={s.tablaCard}>
        <div style={{ overflowX:'auto' }}>
          <table style={s.table}>
            <thead>
              <tr>
                {['Insumo','Categoría','Almacenaje','Unidad','En almacén',
                  'En uso','Mínimo','Estado','Acciones']
                  .map(h => <th key={h} style={s.th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {listaFiltrada.map((ins, i) => (
                <tr key={ins.id_insumo}
                  style={{ background: i % 2 === 0 ? '#fff' : '#FAFBFD' }}>
                  <td style={s.td}>
                    <div style={s.celdaNombre}>
                      <span style={s.avatar}>{ins.nombre?.[0]?.toUpperCase()}</span>
                      <strong style={{ color:'#0F1628' }}>{ins.nombre}</strong>
                    </div>
                  </td>
                  <td style={{ ...s.td, textTransform:'capitalize' }}>{ins.categoria}</td>
                  <td style={{ ...s.td, textTransform:'capitalize' }}>{ins.tipo_almacenaje}</td>
                  <td style={s.td}>{ins.unidad_medida}</td>
                  <td style={{ ...s.td, fontWeight:700,
                               color: ins.en_alerta ? '#DC2626' : '#059669' }}>
                    {ins.stock_almacen}
                  </td>
                  <td style={s.td}>{ins.stock_utilizacion}</td>
                  <td style={s.td}>{ins.stock_minimo}</td>
                  <td style={s.td}>
                    <span style={ins.en_alerta ? s.pillRojo : s.pillVerde}>
                      <span style={{ ...s.punto,
                        background: ins.en_alerta ? '#DC2626' : '#059669' }} />
                      {ins.en_alerta ? 'Alerta' : 'OK'}
                    </span>
                  </td>
                  <td style={s.td}>
                    <div style={{ display:'flex', gap:8 }}>
                      <button style={s.btnEditar} onClick={() => abrirEditar(ins)}>
                        <IconEditar /> Editar
                      </button>
                      <button style={s.btnEliminar} onClick={() => handleEliminar(ins)}>
                        <IconEliminar /> Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {listaFiltrada.length === 0 && (
                <tr><td colSpan={9} style={s.vacio}>No hay insumos para mostrar.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {(modal === 'crear' || modal === 'editar') && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitulo}>
                {modal === 'crear' ? '+ Nuevo insumo' : 'Editar insumo'}
              </h3>
              <button style={s.closeBtn} onClick={() => setModal(null)}>✕</button>
            </div>
            <div style={s.modalBody}>
              <div style={s.formGrid}>
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={s.label}>Nombre *</label>
                  <input style={s.input} value={form.nombre}
                    onChange={e => setForm({ ...form, nombre:e.target.value })} />
                </div>
                <div>
                  <label style={s.label}>Categoría</label>
                  <select style={s.input} value={form.categoria}
                    onChange={e => setForm({ ...form, categoria:e.target.value })}>
                    {CAT.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={s.label}>Tipo de almacenaje</label>
                  <select style={s.input} value={form.tipo_almacenaje}
                    onChange={e => setForm({ ...form, tipo_almacenaje:e.target.value })}>
                    {ALM.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label style={s.label}>Unidad de medida</label>
                  <select style={s.input} value={form.unidad_medida}
                    onChange={e => setForm({ ...form, unidad_medida:e.target.value })}>
                    {['kg','gramos','litros','ml','unidades','porciones']
                      .map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label style={s.label}>Stock inicial en almacén</label>
                  <input style={s.input} type="number" step="0.01" value={form.stock_almacen}
                    onChange={e => setForm({ ...form, stock_almacen:e.target.value })} />
                </div>
                <div>
                  <label style={s.label}>Stock mínimo para alerta</label>
                  <input style={s.input} type="number" step="0.01" value={form.stock_minimo}
                    onChange={e => setForm({ ...form, stock_minimo:e.target.value })} />
                </div>
              </div>
            </div>
            <div style={s.modalFooter}>
              <button style={s.btnSec} onClick={() => setModal(null)}>Cancelar</button>
              <button style={s.btnPrimario}
                onClick={modal === 'crear' ? handleCrear : handleEditar}>
                {modal === 'crear' ? 'Crear insumo' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  toast:    { background:'#ECFDF5', color:'#059669', padding:'10px 14px', borderRadius:10, marginBottom:12, fontSize:13, fontWeight:600 },
  toastErr: { background:'#FEF2F2', color:'#DC2626', padding:'10px 14px', borderRadius:10, marginBottom:12, fontSize:13, fontWeight:600 },

  barra:      { display:'flex', alignItems:'center', gap:14, marginBottom:'1.25rem', flexWrap:'wrap' },
  buscador:   { flex:1, minWidth:240, display:'flex', alignItems:'center', gap:12, background:'#fff', border:'1px solid #E6E9F2', borderRadius:14, padding:'0 18px', height:52, color:'#6B7280' },
  inputBuscar:{ flex:1, border:'none', outline:'none', background:'transparent', fontSize:14, color:'#0F1628' },
  contador:   { fontSize:13, fontWeight:600, color:'#6B7280', whiteSpace:'nowrap' },
  select:     { height:52, padding:'0 14px', borderRadius:14, border:'1px solid #E6E9F2', background:'#fff', fontSize:13, color:'#374151' },
  btnPrimario:{ height:52, padding:'0 22px', borderRadius:12, background:'#2563EB', color:'#fff', border:'none', cursor:'pointer', fontSize:14, fontWeight:700, boxShadow:'0 6px 16px rgba(37,99,235,0.28)' },

  tablaCard:  { background:'#fff', borderRadius:18, border:'1px solid #E6E9F2', overflow:'hidden', boxShadow:'0 1px 3px rgba(15,23,42,0.05)' },
  table:      { width:'100%', borderCollapse:'collapse' },
  th:         { background:'#0F172A', color:'#fff', padding:'18px 20px', fontSize:12.5, fontWeight:700, textAlign:'left', textTransform:'uppercase', letterSpacing:'.03em', whiteSpace:'nowrap' },
  td:         { padding:'18px 20px', fontSize:14, color:'#374151', borderBottom:'1px solid #F0F2F7', verticalAlign:'middle' },
  vacio:      { textAlign:'center', color:'#9CA3AF', padding:'2.5rem', fontSize:14 },
  celdaNombre:{ display:'flex', alignItems:'center', gap:12 },
  avatar:     { width:40, height:40, borderRadius:'50%', background:'#FDF1C8', color:'#92400E', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:15, flexShrink:0 },
  punto:      { width:7, height:7, borderRadius:'50%', display:'inline-block' },
  pillVerde:  { display:'inline-flex', alignItems:'center', gap:7, background:'#DCFCE7', color:'#166534', fontSize:12, fontWeight:600, padding:'5px 12px', borderRadius:20 },
  pillRojo:   { display:'inline-flex', alignItems:'center', gap:7, background:'#FEE2E2', color:'#B91C1C', fontSize:12, fontWeight:600, padding:'5px 12px', borderRadius:20 },
  btnEditar:  { display:'inline-flex', alignItems:'center', gap:7, padding:'8px 14px', borderRadius:9, background:'#EFF6FF', color:'#2563EB', border:'1px solid #BFDBFE', cursor:'pointer', fontSize:13, fontWeight:600 },
  btnEliminar:{ display:'inline-flex', alignItems:'center', gap:7, padding:'8px 14px', borderRadius:9, background:'#FEF2F2', color:'#DC2626', border:'1px solid #FECACA', cursor:'pointer', fontSize:13, fontWeight:600 },

  overlay:    { position:'fixed', inset:0, background:'rgba(15,22,40,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:'1rem', backdropFilter:'blur(2px)' },
  modal:      { background:'#fff', borderRadius:16, width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.15)' },
  modalHeader:{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'1.25rem 1.5rem', borderBottom:'1px solid #F3F4F6', position:'sticky', top:0, background:'#fff', zIndex:1 },
  modalTitulo:{ fontSize:16, fontWeight:700, color:'#0F1628', margin:0 },
  closeBtn:   { background:'#F3F4F6', border:'none', borderRadius:'50%', width:28, height:28, cursor:'pointer', color:'#6B7280', fontSize:14 },
  modalBody:  { padding:'1.25rem 1.5rem' },
  formGrid:   { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 },
  label:      { fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 },
  input:      { width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #E8EAF0', fontSize:13, color:'#0F1628', outline:'none' },
  modalFooter:{ display:'flex', gap:8, justifyContent:'flex-end', padding:'1rem 1.5rem', borderTop:'1px solid #F3F4F6', position:'sticky', bottom:0, background:'#fff' },
  btnSec:     { padding:'9px 18px', borderRadius:8, background:'#F3F4F6', color:'#6B7280', border:'none', cursor:'pointer', fontSize:13 },
};
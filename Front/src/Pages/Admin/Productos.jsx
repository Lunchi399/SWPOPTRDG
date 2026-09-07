import { useEffect, useState } from 'react';
import Layout from '../../Components/Admin/Layout';
import { getProductos, crearProducto, editarProducto,
         toggleProducto, eliminarProducto } from '../../Services/adminService';

const CAT_INFO = {
  entrada: { bg:'#ECFDF5', color:'#059669', icon:'🥗' },
  segundo: { bg:'#EFF6FF', color:'#2563EB', icon:'🍛' },
  bebida:  { bg:'#FFFBEB', color:'#B45309', icon:'🥤' },
  postre:  { bg:'#FDF4FF', color:'#7C3AED', icon:'🍮' },
};

const FORM_VACIO = {
  nombre:'', descripcion:'', precio:'',
  categoria:'entrada', stock:0, imagen_url:'', disponible:true
};

export default function Productos() {
  const [lista,    setLista]    = useState([]);
  const [modal,    setModal]    = useState(null);
  const [sel,      setSel]      = useState(null);
  const [form,     setForm]     = useState(FORM_VACIO);
  const [buscar,   setBuscar]   = useState('');
  const [filtroCat,setFiltroCat]= useState('todos');
  const [mensaje,  setMensaje]  = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(true);

  const cargar = () => {
    setLoading(true);
    getProductos().then(r => setLista(r.data))
      .finally(() => setLoading(false));
  };
  useEffect(() => { cargar(); }, []);

  const mostrar = (msg, err=false) => {
    err ? setError(msg) : setMensaje(msg);
    setTimeout(() => { setMensaje(''); setError(''); }, 3000);
  };

  const handleToggle = async (p) => {
    try {
      await toggleProducto(p.id_producto);
      mostrar(`${p.nombre} ${p.disponible
        ? 'marcado como no disponible'
        : 'marcado como disponible'}`);
      cargar();
    } catch(e) { mostrar('Error', true); }
  };

  const handleCrear = async () => {
    try {
      await crearProducto(form);
      mostrar('Producto creado');
      setModal(null); cargar();
    } catch(e) {
      mostrar(JSON.stringify(e.response?.data), true);
    }
  };

  const handleEditar = async () => {
    try {
      await editarProducto(sel.id_producto, form);
      mostrar('Producto actualizado');
      setModal(null); cargar();
    } catch(e) {
      mostrar(JSON.stringify(e.response?.data), true);
    }
  };

  const handleEliminar = async () => {
    try {
      await eliminarProducto(sel.id_producto);
      mostrar('Producto eliminado');
      setModal(null); cargar();
    } catch(e) {
      mostrar(e.response?.data?.error || 'Error', true);
    }
  };

  const listaFiltrada = lista.filter(p => {
    const ok1 = p.nombre?.toLowerCase()
                          .includes(buscar.toLowerCase());
    const ok2 = filtroCat === 'todos' || p.categoria === filtroCat;
    return ok1 && ok2;
  });

  const disponibles  = lista.filter(p => p.disponible).length;
  const noDisponibles = lista.length - disponibles;

  return (
    <Layout>
      <div style={s.page}>

        {/* Header */}
        <div style={s.pageHeader}>
          <div>
            <h1 style={s.titulo}>Productos</h1>
            <p style={s.subtitulo}>
              {lista.length} productos · {disponibles} disponibles
            </p>
          </div>
          <button style={s.btnPrimario}
            onClick={() => { setForm(FORM_VACIO); setModal('crear'); }}>
            + Nuevo producto
          </button>
        </div>

        {mensaje && <div style={s.toast}>{mensaje}</div>}
        {error   && <div style={s.toastErr}>{error}</div>}

        {/* Stats */}
        <div style={s.statsRow}>
          <div style={s.statCard}>
            <span style={{ fontSize:24, fontWeight:800,
                           color:'#6366F1' }}>{lista.length}</span>
            <span style={s.statL}>Total</span>
          </div>
          <div style={s.statCard}>
            <span style={{ fontSize:24, fontWeight:800,
                           color:'#059669' }}>{disponibles}</span>
            <span style={s.statL}>Disponibles</span>
          </div>
          <div style={s.statCard}>
            <span style={{ fontSize:24, fontWeight:800,
                           color:'#DC2626' }}>{noDisponibles}</span>
            <span style={s.statL}>No disponibles</span>
          </div>
          {Object.entries(CAT_INFO).map(([cat, info]) => (
            <div key={cat} style={{ ...s.statCard,
                                     background:info.bg,
                                     cursor:'pointer',
                                     outline: filtroCat === cat
                                       ? `2px solid ${info.color}` : 'none',
                                   }}
              onClick={() => setFiltroCat(
                filtroCat === cat ? 'todos' : cat
              )}>
              <span style={{ fontSize:20 }}>{info.icon}</span>
              <span style={{ fontSize:18, fontWeight:700,
                              color:info.color }}>
                {lista.filter(p => p.categoria === cat).length}
              </span>
              <span style={{ fontSize:11, color:info.color,
                              fontWeight:500, textTransform:'capitalize' }}>
                {cat}s
              </span>
            </div>
          ))}
        </div>

        {/* Buscador */}
        <div style={s.searchWrap}>
          <span style={{ color:'#9CA3AF' }}>🔍</span>
          <input style={s.searchInput}
            placeholder="Buscar producto..."
            value={buscar}
            onChange={e => setBuscar(e.target.value)}
          />
        </div>

        {/* Grid de productos */}
        {loading ? (
          <div style={s.empty}>Cargando productos...</div>
        ) : listaFiltrada.length === 0 ? (
          <div style={s.empty}>No se encontraron productos.</div>
        ) : (
          <div style={s.prodGrid}>
            {listaFiltrada.map(p => {
              const ci = CAT_INFO[p.categoria] || CAT_INFO.entrada;
              return (
                <div key={p.id_producto} style={{
                  ...s.prodCard,
                  opacity: p.disponible ? 1 : 0.6,
                }}>
                  {/* Badge categoría */}
                  <div style={s.prodTop}>
                    <span style={{ ...s.pill,
                                    background:ci.bg, color:ci.color }}>
                      {ci.icon} {p.categoria}
                    </span>
                    <span style={{
                      ...s.pill,
                      background: p.disponible ? '#ECFDF5' : '#F3F4F6',
                      color:      p.disponible ? '#059669' : '#9CA3AF',
                    }}>
                      {p.disponible ? '● Disponible' : '○ No disponible'}
                    </span>
                  </div>

                  <div style={s.prodNombre}>{p.nombre}</div>
                  <div style={s.prodDesc}>
                    {p.descripcion || 'Sin descripción'}
                  </div>

                  <div style={s.prodBottom}>
                    <div>
                      <div style={s.prodPrecio}>S/. {p.precio}</div>
                      <div style={s.prodStock}>
                        Stock: {p.stock}
                      </div>
                    </div>
                    <div style={s.prodAcciones}>
                      <button style={s.btnToggle}
                        onClick={() => handleToggle(p)}>
                        {p.disponible ? 'Deshabilitar' : 'Habilitar'}
                      </button>
                      <button style={s.btnIconEdit}
                        onClick={() => {
                          setSel(p);
                          setForm({
                            nombre:      p.nombre,
                            descripcion: p.descripcion || '',
                            precio:      p.precio,
                            categoria:   p.categoria,
                            stock:       p.stock,
                            imagen_url:  p.imagen_url || '',
                            disponible:  p.disponible,
                          });
                          setModal('editar');
                        }}>✏️</button>
                      <button style={s.btnIconDel}
                        onClick={() => {
                          setSel(p); setModal('eliminar');
                        }}>🗑️</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal crear/editar */}
        {(modal === 'crear' || modal === 'editar') && (
          <div style={s.overlay}>
            <div style={s.modal}>
              <div style={s.modalHeader}>
                <h3 style={s.modalTitulo}>
                  {modal === 'crear' ? '+ Nuevo producto' : 'Editar producto'}
                </h3>
                <button style={s.closeBtn}
                  onClick={() => setModal(null)}>✕</button>
              </div>
              <div style={s.modalBody}>
                <div style={s.formGrid}>
                  <div style={{ gridColumn:'1/-1' }}>
                    <label style={s.label}>Nombre *</label>
                    <input style={s.input} value={form.nombre}
                      onChange={e => setForm({
                        ...form, nombre:e.target.value
                      })} />
                  </div>
                  <div style={{ gridColumn:'1/-1' }}>
                    <label style={s.label}>Descripción</label>
                    <textarea style={{ ...s.input, minHeight:70,
                                       resize:'vertical' }}
                      value={form.descripcion}
                      onChange={e => setForm({
                        ...form, descripcion:e.target.value
                      })} />
                  </div>
                  <div>
                    <label style={s.label}>Precio *</label>
                    <input style={s.input} type="number"
                      step="0.01" value={form.precio}
                      onChange={e => setForm({
                        ...form, precio:e.target.value
                      })} />
                  </div>
                  <div>
                    <label style={s.label}>Stock</label>
                    <input style={s.input} type="number"
                      value={form.stock}
                      onChange={e => setForm({
                        ...form, stock:e.target.value
                      })} />
                  </div>
                  <div>
                    <label style={s.label}>Categoría *</label>
                    <select style={s.input} value={form.categoria}
                      onChange={e => setForm({
                        ...form, categoria:e.target.value
                      })}>
                      <option value="entrada">🥗 Entrada</option>
                      <option value="segundo">🍛 Segundo</option>
                      <option value="bebida">🥤 Bebida</option>
                      <option value="postre">🍮 Postre</option>
                    </select>
                  </div>
                  <div>
                    <label style={s.label}>URL Imagen</label>
                    <input style={s.input} value={form.imagen_url}
                      placeholder="https://..."
                      onChange={e => setForm({
                        ...form, imagen_url:e.target.value
                      })} />
                  </div>
                </div>
              </div>
              <div style={s.modalFooter}>
                <button style={s.btnSecundario}
                  onClick={() => setModal(null)}>Cancelar</button>
                <button style={s.btnPrimario}
                  onClick={modal === 'crear'
                    ? handleCrear : handleEditar}>
                  {modal === 'crear' ? 'Crear producto' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal eliminar */}
        {modal === 'eliminar' && (
          <div style={s.overlay}>
            <div style={{ ...s.modal, maxWidth:380 }}>
              <div style={s.modalHeader}>
                <h3 style={s.modalTitulo}>Eliminar producto</h3>
                <button style={s.closeBtn}
                  onClick={() => setModal(null)}>✕</button>
              </div>
              <div style={{ ...s.modalBody, textAlign:'center' }}>
                <div style={{ fontSize:40, marginBottom:12 }}>⚠️</div>
                <p style={{ fontSize:14, color:'#374151',
                             lineHeight:1.6 }}>
                  ¿Eliminar <strong>{sel?.nombre}</strong>?
                  Esta acción no se puede deshacer.
                </p>
              </div>
              <div style={s.modalFooter}>
                <button style={s.btnSecundario}
                  onClick={() => setModal(null)}>Cancelar</button>
                <button style={{ ...s.btnPrimario,
                                  background:'#DC2626' }}
                  onClick={handleEliminar}>Eliminar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

const s = {
  page:       { maxWidth:1100 },
  pageHeader: { display:'flex', justifyContent:'space-between',
                alignItems:'flex-start', marginBottom:'1.25rem' },
  titulo:     { fontSize:22, fontWeight:800, color:'#0F1628',
                margin:0, letterSpacing:'-0.02em' },
  subtitulo:  { fontSize:13, color:'#6B7280', marginTop:4 },
  toast:      { background:'#ECFDF5', color:'#059669',
                padding:'10px 14px', borderRadius:'8px',
                marginBottom:12, fontSize:13 },
  toastErr:   { background:'#FEF2F2', color:'#DC2626',
                padding:'10px 14px', borderRadius:'8px',
                marginBottom:12, fontSize:13 },
  statsRow:   { display:'flex', gap:10, marginBottom:'1.25rem',
                flexWrap:'wrap' },
  statCard:   { background:'#fff', borderRadius:'10px',
                padding:'12px 16px', textAlign:'center',
                border:'1px solid #E8EAF0', display:'flex',
                flexDirection:'column', alignItems:'center',
                gap:2, cursor:'default', minWidth:80,
                boxShadow:'0 1px 3px rgba(0,0,0,0.04)' },
  statL:      { fontSize:11, color:'#9CA3AF', fontWeight:500 },
  searchWrap: { display:'flex', alignItems:'center', gap:8,
                background:'#fff', borderRadius:'10px',
                border:'1px solid #E8EAF0', padding:'0 14px',
                marginBottom:'1rem',
                boxShadow:'0 1px 3px rgba(0,0,0,0.04)' },
  searchInput:{ flex:1, border:'none', outline:'none',
                padding:'10px 4px', fontSize:13,
                background:'transparent', color:'#0F1628' },
  prodGrid:   { display:'grid',
                gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',
                gap:12 },
  prodCard:   { background:'#fff', borderRadius:'12px',
                padding:'1rem', border:'1px solid #E8EAF0',
                boxShadow:'0 1px 3px rgba(0,0,0,0.04)',
                display:'flex', flexDirection:'column', gap:8,
                transition:'all .15s' },
  prodTop:    { display:'flex', justifyContent:'space-between',
                alignItems:'center', flexWrap:'wrap', gap:4 },
  prodNombre: { fontSize:15, fontWeight:700, color:'#0F1628' },
  prodDesc:   { fontSize:12, color:'#9CA3AF', lineHeight:1.5,
                flex:1 },
  prodBottom: { display:'flex', justifyContent:'space-between',
                alignItems:'flex-end', marginTop:'auto' },
  prodPrecio: { fontSize:18, fontWeight:800, color:'#059669' },
  prodStock:  { fontSize:11, color:'#9CA3AF', marginTop:2 },
  prodAcciones:{ display:'flex', gap:4, alignItems:'center' },
  btnToggle:  { padding:'5px 10px', borderRadius:'6px',
                background:'#F3F4F6', color:'#6B7280',
                border:'none', cursor:'pointer', fontSize:11,
                fontWeight:500 },
  btnIconEdit:{ padding:'5px 8px', borderRadius:'6px',
                background:'#EEF2FF', border:'none',
                cursor:'pointer', fontSize:13 },
  btnIconDel: { padding:'5px 8px', borderRadius:'6px',
                background:'#FEF2F2', border:'none',
                cursor:'pointer', fontSize:13 },
  pill:       { fontSize:11, fontWeight:500, padding:'3px 9px',
                borderRadius:'20px' },
  empty:      { textAlign:'center', color:'#9CA3AF', padding:'3rem',
                background:'#fff', borderRadius:'12px',
                fontSize:14, border:'1px solid #E8EAF0' },
  overlay:    { position:'fixed', inset:0,
                background:'rgba(15,22,40,0.5)',
                display:'flex', alignItems:'center',
                justifyContent:'center', zIndex:200,
                padding:'1rem', backdropFilter:'blur(2px)' },
  modal:      { background:'#fff', borderRadius:'16px',
                width:'100%', maxWidth:540,
                maxHeight:'90vh', overflowY:'auto',
                boxShadow:'0 20px 60px rgba(0,0,0,0.15)' },
  modalHeader:{ display:'flex', justifyContent:'space-between',
                alignItems:'center', padding:'1.25rem 1.5rem',
                borderBottom:'1px solid #F3F4F6',
                position:'sticky', top:0,
                background:'#fff', zIndex:1 },
  modalTitulo:{ fontSize:16, fontWeight:700, color:'#0F1628', margin:0 },
  closeBtn:   { background:'#F3F4F6', border:'none',
                borderRadius:'50%', width:28, height:28,
                cursor:'pointer', color:'#6B7280', fontSize:14,
                display:'flex', alignItems:'center',
                justifyContent:'center' },
  modalBody:  { padding:'1.25rem 1.5rem' },
  formGrid:   { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 },
  label:      { fontSize:12, fontWeight:600, color:'#374151',
                display:'block', marginBottom:5 },
  input:      { width:'100%', padding:'9px 12px', borderRadius:'8px',
                border:'1px solid #E8EAF0', fontSize:13,
                color:'#0F1628', outline:'none' },
  modalFooter:{ display:'flex', gap:8, justifyContent:'flex-end',
                padding:'1rem 1.5rem',
                borderTop:'1px solid #F3F4F6',
                position:'sticky', bottom:0, background:'#fff' },
  btnPrimario:{ padding:'9px 20px', borderRadius:'8px',
                background:'#6366F1', color:'#fff',
                border:'none', cursor:'pointer',
                fontSize:13, fontWeight:600 },
  btnSecundario:{ padding:'9px 20px', borderRadius:'8px',
                  background:'#F3F4F6', color:'#6B7280',
                  border:'none', cursor:'pointer', fontSize:13 },
};
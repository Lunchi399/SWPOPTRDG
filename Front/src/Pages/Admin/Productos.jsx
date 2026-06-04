import { useEffect, useState } from 'react';
import Layout from '../../components/admin/Layout';
import Modal  from '../../components/admin/Modal';
import { getProductos, crearProducto,
         editarProducto, toggleProducto,
         eliminarProducto } from '../../services/adminService';

const FORM_VACIO = {
  nombre:'', descripcion:'', precio:'',
  categoria:'entrada', disponible: true, stock: 0, imagen_url:''
};

const CAT_COLOR = {
  entrada: { bg:'#E1F5EE', color:'#085041' },
  segundo: { bg:'#E6F1FB', color:'#0C447C' },
  bebida:  { bg:'#FAEEDA', color:'#633806' },
  postre:  { bg:'#EEEDFE', color:'#3C3489' },
};

export default function Productos() {
  const [lista, setLista]     = useState([]);
  const [modal, setModal]     = useState(null);
  const [sel, setSel]         = useState(null);
  const [form, setForm]       = useState(FORM_VACIO);
  const [filtro, setFiltro]   = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError]     = useState('');

  const cargar = () => getProductos().then(r => setLista(r.data));
  useEffect(() => { cargar(); }, []);

  const mostrar = (msg, esError = false) => {
    esError ? setError(msg) : setMensaje(msg);
    setTimeout(() => { setMensaje(''); setError(''); }, 3000);
  };

  const handleCrear = async () => {
    try {
      await crearProducto(form);
      mostrar('Producto creado');
      setModal(null); cargar();
    } catch (e) { mostrar(JSON.stringify(e.response?.data), true); }
  };

  const handleEditar = async () => {
    try {
      await editarProducto(sel.id_producto, form);
      mostrar('Producto actualizado');
      setModal(null); cargar();
    } catch (e) { mostrar(JSON.stringify(e.response?.data), true); }
  };

  const handleToggle = async (p) => {
    await toggleProducto(p.id_producto);
    mostrar(`${p.nombre} ${p.disponible ? 'deshabilitado' : 'habilitado'}`);
    cargar();
  };

  const handleEliminar = async () => {
    try {
      await eliminarProducto(sel.id_producto);
      mostrar('Producto eliminado');
      setModal(null); cargar();
    } catch (e) { mostrar(e.response?.data?.error, true); }
  };

  const listaFiltrada = lista.filter(p =>
    p.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    p.categoria.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <Layout>
      <div style={s.page}>
        <div style={s.pageHeader}>
          <h1 style={s.titulo}>Gestión de productos</h1>
          <button style={s.btnPrimario}
            onClick={() => { setForm(FORM_VACIO); setModal('crear'); }}>
            + Nuevo producto
          </button>
        </div>

        {mensaje && <div style={s.toast}>{mensaje}</div>}
        {error   && <div style={s.toastErr}>{error}</div>}

        {/* Búsqueda */}
        <input style={s.buscador} placeholder="🔍 Buscar por nombre o categoría..."
          value={filtro} onChange={e => setFiltro(e.target.value)} />

        {/* Grilla de productos */}
        <div style={s.grid}>
          {listaFiltrada.map(p => {
            const cc = CAT_COLOR[p.categoria] || CAT_COLOR.entrada;
            return (
              <div key={p.id_producto} style={{
                ...s.card,
                opacity: p.disponible ? 1 : 0.6,
                borderLeft: `4px solid ${cc.color}`
              }}>
                <div style={s.cardTop}>
                  <span style={{ ...s.catPill, background:cc.bg, color:cc.color }}>
                    {p.categoria}
                  </span>
                  <span style={{
                    ...s.dispPill,
                    background: p.disponible ? '#E1F5EE' : '#F1EFE8',
                    color:      p.disponible ? '#085041' : '#888'
                  }}>
                    {p.disponible ? 'Disponible' : 'No disponible'}
                  </span>
                </div>
                <div style={s.cardNombre}>{p.nombre}</div>
                <div style={s.cardDesc}>{p.descripcion || '—'}</div>
                <div style={s.cardBottom}>
                  <span style={s.precio}>S/. {p.precio}</span>
                  <span style={s.stock}>Stock: {p.stock}</span>
                </div>
                <div style={s.cardBtns}>
                  <button style={s.btnEdit}
                    onClick={() => {
                      setSel(p);
                      setForm({ nombre: p.nombre, descripcion: p.descripcion,
                                precio: p.precio, categoria: p.categoria,
                                disponible: p.disponible, stock: p.stock,
                                imagen_url: p.imagen_url || '' });
                      setModal('editar');
                    }}>Editar</button>
                  <button style={{
                    ...s.btnToggle,
                    background: p.disponible ? '#FAEEDA' : '#E1F5EE',
                    color:      p.disponible ? '#633806' : '#085041'
                  }} onClick={() => handleToggle(p)}>
                    {p.disponible ? 'Deshabilitar' : 'Habilitar'}
                  </button>
                  <button style={s.btnDel}
                    onClick={() => { setSel(p); setModal('eliminar'); }}>
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modales */}
        {(modal === 'crear' || modal === 'editar') && (
          <Modal titulo={modal === 'crear' ? 'Nuevo producto' : 'Editar producto'}
                 onClose={() => setModal(null)}>
            <FormProducto form={form} setForm={setForm} />
            <div style={s.modalBtns}>
              <button style={s.btnSecundario}
                onClick={() => setModal(null)}>Cancelar</button>
              <button style={s.btnPrimario}
                onClick={modal === 'crear' ? handleCrear : handleEditar}>
                {modal === 'crear' ? 'Crear' : 'Guardar'}
              </button>
            </div>
          </Modal>
        )}

        {modal === 'eliminar' && (
          <Modal titulo="Eliminar producto" onClose={() => setModal(null)}>
            <p style={{ fontSize:14, marginBottom:16 }}>
              ¿Eliminar <strong>{sel?.nombre}</strong>? Esta acción no se puede deshacer.
            </p>
            <div style={s.modalBtns}>
              <button style={s.btnSecundario}
                onClick={() => setModal(null)}>Cancelar</button>
              <button style={{ ...s.btnPrimario, background:'#993C1D' }}
                onClick={handleEliminar}>Eliminar</button>
            </div>
          </Modal>
        )}
      </div>
    </Layout>
  );
}

function FormProducto({ form, setForm }) {
  const f = (label, key, type='text', opciones=null) => (
    <div style={{ marginBottom:10 }}>
      <label style={fs.label}>{label}</label>
      {opciones
        ? <select style={fs.input} value={form[key]}
            onChange={e => setForm({ ...form, [key]: e.target.value })}>
            {opciones.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        : <input style={fs.input} type={type} value={form[key]}
            onChange={e => setForm({ ...form, [key]: e.target.value })} />
      }
    </div>
  );
  return (
    <>
      {f('Nombre *',     'nombre')}
      {f('Descripción',  'descripcion')}
      {f('Precio *',     'precio',    'number')}
      {f('Stock',        'stock',     'number')}
      {f('Imagen URL',   'imagen_url')}
      {f('Categoría *',  'categoria', 'text', [
        { v:'entrada', l:'Entrada' },
        { v:'segundo', l:'Segundo' },
        { v:'bebida',  l:'Bebida'  },
        { v:'postre',  l:'Postre'  },
      ])}
    </>
  );
}

const fs = {
  label: { fontSize:12, fontWeight:600, color:'#555', display:'block', marginBottom:4 },
  input: { width:'100%', padding:'8px 12px', borderRadius:7,
           border:'1px solid #ddd', fontSize:13 },
};

const s = {
  page:       { maxWidth:1100 },
  pageHeader: { display:'flex', justifyContent:'space-between',
                alignItems:'center', marginBottom:'1.25rem' },
  titulo:     { fontSize:20, fontWeight:700, color:'#1E2D40', margin:0 },
  buscador:   { width:'100%', padding:'9px 14px', borderRadius:8,
                border:'1px solid #ddd', fontSize:13,
                marginBottom:'1.25rem', maxWidth:360 },
  toast:      { background:'#E1F5EE', color:'#085041', padding:'10px 14px',
                borderRadius:8, marginBottom:12, fontSize:13 },
  toastErr:   { background:'#FAECE7', color:'#993C1D', padding:'10px 14px',
                borderRadius:8, marginBottom:12, fontSize:13 },
  grid:       { display:'grid',
                gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:12 },
  card:       { background:'#fff', borderRadius:10, padding:'1rem',
                border:'1px solid #E8E6DF' },
  cardTop:    { display:'flex', justifyContent:'space-between', marginBottom:8 },
  catPill:    { fontSize:11, fontWeight:500, padding:'2px 8px', borderRadius:20 },
  dispPill:   { fontSize:11, fontWeight:500, padding:'2px 8px', borderRadius:20 },
  cardNombre: { fontSize:14, fontWeight:700, color:'#1E2D40', marginBottom:4 },
  cardDesc:   { fontSize:12, color:'#888', marginBottom:8, minHeight:32 },
  cardBottom: { display:'flex', justifyContent:'space-between',
                marginBottom:10 },
  precio:     { fontSize:15, fontWeight:700, color:'#0F6E56' },
  stock:      { fontSize:12, color:'#888' },
  cardBtns:   { display:'flex', gap:5 },
  btnPrimario:{ padding:'8px 16px', borderRadius:8, background:'#2E5F8A',
                color:'#fff', border:'none', cursor:'pointer',
                fontSize:13, fontWeight:600 },
  btnSecundario:{ padding:'8px 16px', borderRadius:8, background:'#eee',
                  color:'#555', border:'none', cursor:'pointer', fontSize:13 },
  btnEdit:    { padding:'5px 10px', borderRadius:6, background:'#E6F1FB',
                color:'#0C447C', border:'none', cursor:'pointer', fontSize:11 },
  btnToggle:  { padding:'5px 10px', borderRadius:6, border:'none',
                cursor:'pointer', fontSize:11 },
  btnDel:     { padding:'5px 10px', borderRadius:6, background:'#FAECE7',
                color:'#993C1D', border:'none', cursor:'pointer', fontSize:11 },
  modalBtns:  { display:'flex', gap:8, justifyContent:'flex-end', marginTop:16 },
};
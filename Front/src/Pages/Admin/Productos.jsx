import { useEffect, useState } from 'react';
import Layout from '../../components/admin/Layout';
import Modal  from '../../components/admin/Modal';
import { getProductos, crearProducto, editarProducto,
         toggleProducto, eliminarProducto } from '../../services/adminService';

// ── CATEGORÍAS ─────────────────────────────────────────────────────
const CAT_CONFIG = {
  entrada: { bg: '#FEF3C7', color: '#92400E', emoji: '🥗', label: 'Entrada'  },
  segundo: { bg: '#DBEAFE', color: '#1D4ED8', emoji: '🍛', label: 'Segundo'  },
  bebida:  { bg: '#D1FAE5', color: '#065F46', emoji: '🥤', label: 'Bebida'   },
  postre:  { bg: '#EDE9FE', color: '#5B21B6', emoji: '🍮', label: 'Postre'   },
};

const FORM_VACIO = { nombre: '', descripcion: '', precio: '', categoria: 'entrada', disponible: true, stock: 0, imagen_url: '' };

// ── TOAST ──────────────────────────────────────────────────────────
function Toast({ mensaje, error }) {
  if (!mensaje && !error) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: error ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${error ? '#FECACA' : '#BBF7D0'}`, color: error ? '#991B1B' : '#065F46', borderRadius: 10, padding: '12px 16px', fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
      {error
        ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      }
      {mensaje || error}
    </div>
  );
}

// ── TARJETA PRODUCTO ───────────────────────────────────────────────
function ProductoCard({ p, onEditar, onToggle, onEliminar }) {
  const cc = CAT_CONFIG[p.categoria] || CAT_CONFIG.entrada;
  return (
    <div style={{ ...s.card, opacity: p.disponible ? 1 : 0.7 }}>
      {/* Imagen placeholder */}
      <div style={{ ...s.imgBox, background: cc.bg }}>
        <span style={{ fontSize: 38 }}>{cc.emoji}</span>
        {!p.disponible && <div style={s.noDispOverlay}>No disponible</div>}
      </div>

      <div style={s.cardBody}>
        {/* Top row */}
        <div style={s.cardTop}>
          <span style={{ ...s.catPill, background: cc.bg, color: cc.color }}>{cc.label}</span>
          <span style={s.precio}>S/ {Number(p.precio).toFixed(2)}</span>
        </div>

        {/* Nombre */}
        <div style={s.cardNombre}>{p.nombre}</div>

        {/* Desc */}
        <div style={s.cardDesc}>{p.descripcion || '—'}</div>

        {/* Stock + disponible */}
        <div style={s.cardMeta}>
          <span style={s.stockInfo}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
            Stock: <strong>{p.stock}</strong>
          </span>
          <span style={{ ...s.dispPill, background: p.disponible ? '#D1FAE5' : '#FEE2E2', color: p.disponible ? '#065F46' : '#991B1B' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.disponible ? '#10B981' : '#EF4444', display: 'inline-block', marginRight: 4 }} />
            {p.disponible ? 'Disponible' : 'No disponible'}
          </span>
        </div>

        {/* Acciones */}
        <div style={s.cardBtns}>
          <button style={s.btnEdit} onClick={() => onEditar(p)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Editar
          </button>
          <button style={{ ...s.btnToggle, background: p.disponible ? '#FEF3C7' : '#D1FAE5', color: p.disponible ? '#92400E' : '#065F46' }} onClick={() => onToggle(p)}>
            {p.disponible ? 'Deshabilitar' : 'Habilitar'}
          </button>
          <button style={s.btnDel} onClick={() => onEliminar(p)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── FORM PRODUCTO ──────────────────────────────────────────────────
function FormProducto({ form, setForm }) {
  const campo = (label, key, type = 'text', placeholder = '') => (
    <div style={fs.campo}>
      <label style={fs.label}>{label}</label>
      <input style={fs.input} type={type} placeholder={placeholder}
        value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
    </div>
  );
  return (
    <div style={fs.grid}>
      {campo('Nombre *',   'nombre',      'text',   'ej. Lomo saltado')}
      {campo('Precio *',   'precio',      'number', 'ej. 28.00')}
      <div style={{ ...fs.campo, gridColumn: '1 / -1' }}>
        <label style={fs.label}>Descripción</label>
        <textarea style={{ ...fs.input, minHeight: 64, resize: 'vertical' }}
          placeholder="Descripción del plato..."
          value={form.descripcion}
          onChange={e => setForm({ ...form, descripcion: e.target.value })} />
      </div>
      <div style={fs.campo}>
        <label style={fs.label}>Categoría *</label>
        <select style={fs.input} value={form.categoria}
          onChange={e => setForm({ ...form, categoria: e.target.value })}>
          {Object.entries(CAT_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.emoji} {v.label}</option>
          ))}
        </select>
      </div>
      {campo('Stock',      'stock',       'number', 'ej. 10')}
      {campo('URL Imagen', 'imagen_url',  'text',   'https://...')}
      <div style={fs.campo}>
        <label style={fs.label}>Disponibilidad</label>
        <button type="button"
          style={{ ...fs.toggleBtn, background: form.disponible ? '#D1FAE5' : '#F1F5F9', color: form.disponible ? '#065F46' : '#94A3B8' }}
          onClick={() => setForm({ ...form, disponible: !form.disponible })}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: form.disponible ? '#10B981' : '#CBD5E1', display: 'inline-block', marginRight: 7 }} />
          {form.disponible ? 'Disponible' : 'No disponible'}
        </button>
      </div>
    </div>
  );
}

// ── COMPONENTE PRINCIPAL ───────────────────────────────────────────
export default function Productos() {
  const [lista, setLista]     = useState([]);
  const [modal, setModal]     = useState(null);
  const [sel, setSel]         = useState(null);
  const [form, setForm]       = useState(FORM_VACIO);
  const [filtro, setFiltro]   = useState('');
  const [filtroCat, setFiltroCat] = useState('todos');
  const [mensaje, setMensaje] = useState('');
  const [error, setError]     = useState('');

  const cargar = () => getProductos().then(r => setLista(r.data));
  useEffect(() => { cargar(); }, []);

  const mostrar = (msg, esError = false) => {
    esError ? setError(msg) : setMensaje(msg);
    setTimeout(() => { setMensaje(''); setError(''); }, 3000);
  };

  const abrirEditar = (p) => {
    setSel(p);
    setForm({ nombre: p.nombre, descripcion: p.descripcion, precio: p.precio, categoria: p.categoria, disponible: p.disponible, stock: p.stock, imagen_url: p.imagen_url || '' });
    setModal('editar');
  };

  const handleCrear = async () => {
    try { await crearProducto(form); mostrar('Producto creado'); setModal(null); cargar(); }
    catch (e) { mostrar(JSON.stringify(e.response?.data), true); }
  };

  const handleEditar = async () => {
    try { await editarProducto(sel.id_producto, form); mostrar('Producto actualizado'); setModal(null); cargar(); }
    catch (e) { mostrar(JSON.stringify(e.response?.data), true); }
  };

  const handleToggle = async (p) => {
    await toggleProducto(p.id_producto);
    mostrar(`${p.nombre} ${p.disponible ? 'deshabilitado' : 'habilitado'}`);
    cargar();
  };

  const handleEliminar = async () => {
    try { await eliminarProducto(sel.id_producto); mostrar('Producto eliminado'); setModal(null); cargar(); }
    catch (e) { mostrar(e.response?.data?.error, true); }
  };

  // Contadores
  const contadores = Object.keys(CAT_CONFIG).reduce((acc, k) => {
    acc[k] = lista.filter(p => p.categoria === k).length;
    return acc;
  }, {});

  const listaFiltrada = lista.filter(p => {
    const matchCat = filtroCat === 'todos' || p.categoria === filtroCat;
    const matchQ   = !filtro || p.nombre.toLowerCase().includes(filtro.toLowerCase()) || p.categoria.toLowerCase().includes(filtro.toLowerCase());
    return matchCat && matchQ;
  });

  return (
    <Layout>
      <div style={s.page}>

        {/* HEADER */}
        <div style={s.pageHeader}>
          <div>
            <h1 style={s.titulo}>Gestión de Productos</h1>
            <p style={s.subtitulo}>{lista.length} productos · {lista.filter(p => p.disponible).length} disponibles</p>
          </div>
          <button style={s.btnPrimario} onClick={() => { setForm(FORM_VACIO); setModal('crear'); }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nuevo producto
          </button>
        </div>

        <Toast mensaje={mensaje} error={error} />

        {/* CHIPS CATEGORÍA */}
        <div style={s.chipsRow}>
          {[{ key: 'todos', label: 'Todos', count: lista.length },
            ...Object.entries(CAT_CONFIG).map(([k, v]) => ({ key: k, label: `${v.emoji} ${v.label}`, count: contadores[k] || 0 }))
          ].map(chip => (
            <button key={chip.key} style={{ ...s.chip, ...(filtroCat === chip.key ? s.chipActive : {}) }} onClick={() => setFiltroCat(chip.key)}>
              {chip.label}
              <span style={{ ...s.chipCount, ...(filtroCat === chip.key ? s.chipCountActive : {}) }}>{chip.count}</span>
            </button>
          ))}
        </div>

        {/* BUSCADOR */}
        <div style={s.searchWrap}>
          <svg style={s.searchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input style={s.searchInput} placeholder="Buscar por nombre o categoría..."
            value={filtro} onChange={e => setFiltro(e.target.value)} />
          <span style={s.resultCount}>{listaFiltrada.length} resultado{listaFiltrada.length !== 1 ? 's' : ''}</span>
        </div>

        {/* GRID */}
        {listaFiltrada.length === 0
          ? <div style={s.empty}>No se encontraron productos</div>
          : (
            <div style={s.grid}>
              {listaFiltrada.map(p => (
                <ProductoCard key={p.id_producto} p={p}
                  onEditar={abrirEditar}
                  onToggle={handleToggle}
                  onEliminar={(p) => { setSel(p); setModal('eliminar'); }}
                />
              ))}
            </div>
          )
        }
      </div>

      {/* ── MODAL CREAR / EDITAR ── */}
      {(modal === 'crear' || modal === 'editar') && (
        <Modal titulo={modal === 'crear' ? '🍽️ Nuevo producto' : '✏️ Editar producto'} onClose={() => setModal(null)} maxWidth={560}>
          <FormProducto form={form} setForm={setForm} />
          <div style={fs.footer}>
            <button style={s.btnSecundario} onClick={() => setModal(null)}>Cancelar</button>
            <button style={s.btnPrimario} onClick={modal === 'crear' ? handleCrear : handleEditar}>
              {modal === 'crear' ? 'Crear producto' : 'Guardar cambios'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── MODAL ELIMINAR ── */}
      {modal === 'eliminar' && sel && (
        <Modal titulo="Eliminar producto" onClose={() => setModal(null)}>
          <div style={{ padding: '8px 0 20px' }}>
            <div style={s.deleteWarning}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <p style={{ color: '#7F1D1D', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                ¿Estás seguro de eliminar <strong>{sel?.nombre}</strong>? Esta acción no se puede deshacer.
              </p>
            </div>
          </div>
          <div style={fs.footer}>
            <button style={s.btnSecundario} onClick={() => setModal(null)}>Cancelar</button>
            <button style={{ ...s.btnPrimario, background: '#DC2626', boxShadow: '0 4px 14px rgba(220,38,38,0.3)' }} onClick={handleEliminar}>
              Sí, eliminar
            </button>
          </div>
        </Modal>
      )}
    </Layout>
  );
}

// ── ESTILOS ────────────────────────────────────────────────────────
const s = {
  page:       { padding: '28px 32px', maxWidth: 1200, margin: '0 auto', fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif" },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  titulo:     { fontSize: 26, fontWeight: 800, color: '#0F1E2E', margin: 0, letterSpacing: -0.5 },
  subtitulo:  { color: '#64748B', fontSize: 13, marginTop: 4 },
  btnPrimario:{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 10, background: 'linear-gradient(135deg,#2563EB,#3B82F6)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, boxShadow: '0 4px 14px rgba(37,99,235,0.35)', fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif" },
  btnSecundario:{ padding: '10px 18px', borderRadius: 10, background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif" },
  chipsRow:   { display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  chip:       { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20, background: '#fff', border: '1px solid #E2E8F0', color: '#64748B', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif" },
  chipActive: { background: '#EFF6FF', borderColor: '#BFDBFE', color: '#1D4ED8' },
  chipCount:       { background: '#F1F5F9', color: '#94A3B8', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 700 },
  chipCountActive: { background: '#DBEAFE', color: '#1D4ED8' },
  searchWrap:  { position: 'relative', display: 'flex', alignItems: 'center', marginBottom: 20 },
  searchIcon:  { position: 'absolute', left: 12, color: '#94A3B8', pointerEvents: 'none' },
  searchInput: { flex: 1, maxWidth: 380, padding: '9px 12px 9px 36px', borderRadius: 9, border: '1px solid #E2E8F0', fontSize: 13, outline: 'none', color: '#334155', fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif", background: '#fff' },
  resultCount: { color: '#94A3B8', fontSize: 12, fontWeight: 600, marginLeft: 14 },
  grid:       { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 16 },
  empty:      { textAlign: 'center', color: '#94A3B8', fontSize: 14, padding: '40px 0' },
  card:       { background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column' },
  imgBox:     { height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  noDispOverlay: { position: 'absolute', top: 8, right: 8, background: 'rgba(239,68,68,0.85)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 },
  cardBody:   { padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 },
  cardTop:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  catPill:    { padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  precio:     { fontWeight: 800, fontSize: 16, color: '#1E293B' },
  cardNombre: { fontSize: 14, fontWeight: 800, color: '#1E293B', letterSpacing: -0.2 },
  cardDesc:   { fontSize: 12, color: '#94A3B8', lineHeight: 1.5, flex: 1 },
  cardMeta:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  stockInfo:  { display: 'flex', alignItems: 'center', gap: 5, color: '#64748B', fontSize: 12 },
  dispPill:   { display: 'flex', alignItems: 'center', padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  cardBtns:   { display: 'flex', gap: 6, marginTop: 4 },
  btnEdit:    { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '6px 8px', borderRadius: 7, background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif" },
  btnToggle:  { flex: 1, padding: '6px 8px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif" },
  btnDel:     { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 10px', borderRadius: 7, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif" },
  deleteWarning: { display: 'flex', alignItems: 'flex-start', gap: 14, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '14px 18px' },
};

const fs = {
  grid:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px', padding: '4px 0 8px' },
  campo:     { display: 'flex', flexDirection: 'column', gap: 5 },
  label:     { fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 },
  input:     { padding: '9px 12px', borderRadius: 9, border: '1px solid #E2E8F0', fontSize: 13, outline: 'none', color: '#1E293B', fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif", background: '#F8FAFC', width: '100%', boxSizing: 'border-box' },
  toggleBtn: { display: 'flex', alignItems: 'center', padding: '9px 14px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif" },
  footer:    { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24, paddingTop: 20, borderTop: '1px solid #F1F5F9' },
};
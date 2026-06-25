import { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';

// ── ESTADOS DE PEDIDO ─────────────────────────────────────────────────────
const ESTADOS_PEDIDO = ['recibido', 'preparacion', 'listo', 'pagado', 'anulado'];

const ESTADO_CONFIG = {
  recibido:    { bg: '#DBEAFE', color: '#1D4ED8', label: 'Recibido', icono: '📋' },
  preparacion: { bg: '#FEF3C7', color: '#92400E', label: 'En preparación', icono: '🍳' },
  listo:       { bg: '#D1FAE5', color: '#065F46', label: 'Listo', icono: '✅' },
  pagado:      { bg: '#EDE9FE', color: '#5B21B6', label: 'Pagado', icono: '💵' },
  anulado:     { bg: '#FEE2E2', color: '#991B1B', label: 'Anulado', icono: '❌' },
};

// ── MOCK DATA ──────────────────────────────────────────────────────
const MOCK_MESAS = [
  { id_mesa: 1, identificador_mesa: 'Mesa 1', capacidad: 4 },
  { id_mesa: 2, identificador_mesa: 'Mesa 2', capacidad: 2 },
  { id_mesa: 3, identificador_mesa: 'Mesa 3', capacidad: 6 },
  { id_mesa: 4, identificador_mesa: 'Mesa 4', capacidad: 4 },
  { id_mesa: 5, identificador_mesa: 'Mesa 5', capacidad: 2 },
];

const MOCK_USUARIOS = [
  { id: 1, usuario: 'ana_m', nombre: 'Ana', apellido: 'Martínez', rol: 'mesero' },
  { id: 2, usuario: 'jorge_l', nombre: 'Jorge', apellido: 'López', rol: 'mesero' },
];

const MOCK_PRODUCTOS = [
  { id_producto: 1, nombre: 'Ceviche mixto', precio: 28.00, categoria: 'Entrada' },
  { id_producto: 2, nombre: 'Tequeños', precio: 12.00, categoria: 'Entrada' },
  { id_producto: 3, nombre: 'Lomo saltado', precio: 38.00, categoria: 'Segundo' },
  { id_producto: 4, nombre: 'Pollo a la brasa', precio: 22.00, categoria: 'Segundo' },
  { id_producto: 5, nombre: 'Hamburguesa clásica', precio: 18.00, categoria: 'Hamburguesas' },
  { id_producto: 6, nombre: 'Salchipapa clásica', precio: 12.00, categoria: 'Salchipapas' },
];

const MOCK_PEDIDOS = [
  { id_pedidos: 101, estado: 'recibido', observaciones: 'Sin cebolla', tiempo_creacion: '2026-04-06 13:30:00', tiempo_finalizacion: null, id_mesa: 1, id: 1, tiempo_modificacion: null, items: [{ id_producto: 3, cantidad: 2, precio: 38.00 }] },
  { id_pedidos: 102, estado: 'preparacion', observaciones: '', tiempo_creacion: '2026-04-06 13:15:00', tiempo_finalizacion: null, id_mesa: 2, id: 2, tiempo_modificacion: null, items: [{ id_producto: 1, cantidad: 1, precio: 28.00 }, { id_producto: 2, cantidad: 1, precio: 12.00 }] },
  { id_pedidos: 103, estado: 'listo', observaciones: 'Picante', tiempo_creacion: '2026-04-06 12:45:00', tiempo_finalizacion: '2026-04-07 13:10:00', id_mesa: 3, id: 1, tiempo_modificacion: null, items: [{ id_producto: 4, cantidad: 2, precio: 22.00 }] },
  { id_pedidos: 104, estado: 'pagado', observaciones: '', tiempo_creacion: '2026-04-06 12:00:00', tiempo_finalizacion: '2026-04-07 12:50:00', id_mesa: 4, id: 2, tiempo_modificacion: null, items: [{ id_producto: 5, cantidad: 1, precio: 18.00 }, { id_producto: 6, cantidad: 1, precio: 12.00 }] },
  { id_pedidos: 105, estado: 'anulado', observaciones: 'Cliente canceló', tiempo_creacion: '2026-04-06 11:30:00', tiempo_finalizacion: '2026-04-07 11:35:00', id_mesa: 5, id: 1, tiempo_modificacion: null, items: [{ id_producto: 3, cantidad: 1, precio: 38.00 }] },
];

const PEDIDO_VACIO = { estado: 'recibido', observaciones: '', id_mesa: '', id: '', items: [] };

// ── MODAL ──────────────────────────────────────────────────────────
function Modal({ titulo, onClose, children }) {
  return (
    <div style={m.overlay} onClick={onClose}>
      <div style={m.modal} onClick={e => e.stopPropagation()}>
        <div style={m.header}>
          <h3 style={m.titulo}>{titulo}</h3>
          <button style={m.closeBtn} onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── MODAL DETALLE PEDIDO ──
function ModalDetalle({ pedido, mesa, mesero, onClose }) {
  const total = pedido.items?.reduce((sum, item) => sum + (item.precio * item.cantidad), 0) || 0;
  const ec = ESTADO_CONFIG[pedido.estado];
  
  return (
    <Modal titulo={`Detalle del pedido #${pedido.id_pedidos}`} onClose={onClose}>
      <div style={s.detalleContainer}>
        <div style={s.detalleHeader}>
          <div style={{ ...s.detalleEstado, background: ec.bg, color: ec.color }}>
            {ec.icono} {ec.label}
          </div>
          <div style={s.detalleFechas}>
            <div><strong>Creación:</strong> {pedido.tiempo_creacion}</div>
            {pedido.tiempo_finalizacion && <div><strong>Finalización:</strong> {pedido.tiempo_finalizacion}</div>}
          </div>
        </div>
        
        <div style={s.detalleInfo}>
          <div><strong>🪑 Mesa:</strong> {mesa?.identificador_mesa || 'N/A'}</div>
          <div><strong>👨‍🍳 Mesero:</strong> {mesero?.nombre} {mesero?.apellido} (@{mesero?.usuario})</div>
          {pedido.observaciones && <div><strong>📝 Observaciones:</strong> {pedido.observaciones}</div>}
        </div>
        
        <table style={s.detalleTable}>
          <thead>
            <tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th></tr>
          </thead>
          <tbody>
            {pedido.items?.map((item, idx) => {
              const prod = MOCK_PRODUCTOS.find(p => p.id_producto === item.id_producto);
              return (
                <tr key={idx}>
                  <td>{prod?.nombre || `Producto #${item.id_producto}`}</td>
                  <td>{item.cantidad}</td>
                  <td>S/ {item.precio.toFixed(2)}</td>
                  <td>S/ {(item.precio * item.cantidad).toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr><td colSpan="3" style={s.detalleTotalLabel}><strong>TOTAL</strong></td><td style={s.detalleTotal}><strong>S/ {total.toFixed(2)}</strong></td></tr>
          </tfoot>
        </table>
      </div>
      <div style={m.footer}>
        <button style={s.btnSecondary} onClick={onClose}>Cerrar</button>
      </div>
    </Modal>
  );
}

// ── MODAL CREAR/EDITAR PEDIDO ──
function ModalPedido({ titulo, form, setForm, errores, productos, mesas, usuarios, onClose, onSave }) {
  const [items, setItems] = useState(form.items || []);
  const [selectedProducto, setSelectedProducto] = useState('');
  const [cantidad, setCantidad] = useState(1);
  
  const agregarItem = () => {
    if (!selectedProducto) return;
    const producto = productos.find(p => p.id_producto === parseInt(selectedProducto));
    if (!producto) return;
    
    const existente = items.find(i => i.id_producto === producto.id_producto);
    if (existente) {
      setItems(items.map(i => i.id_producto === producto.id_producto 
        ? { ...i, cantidad: i.cantidad + cantidad }
        : i
      ));
    } else {
      setItems([...items, { id_producto: producto.id_producto, cantidad, precio: producto.precio }]);
    }
    setSelectedProducto('');
    setCantidad(1);
  };
  
  const removerItem = (id_producto) => {
    setItems(items.filter(i => i.id_producto !== id_producto));
  };
  
  const actualizarCantidad = (id_producto, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      removerItem(id_producto);
    } else {
      setItems(items.map(i => i.id_producto === id_producto ? { ...i, cantidad: nuevaCantidad } : i));
    }
  };
  
  const guardarPedido = () => {
    // Validar
    if (!form.id_mesa) { alert('Seleccione una mesa'); return; }
    if (!form.id) { alert('Seleccione un mesero'); return; }
    if (items.length === 0) { alert('Agregue al menos un producto'); return; }
    
    onSave({ ...form, items });
  };
  
  const total = items.reduce((sum, i) => sum + (i.precio * i.cantidad), 0);
  
  return (
    <Modal titulo={titulo} onClose={onClose}>
      <div style={s.formGrid}>
        <div style={s.campo}>
          <label style={s.label}>Mesa</label>
          <select style={s.input} value={form.id_mesa} onChange={e => setForm(f => ({ ...f, id_mesa: e.target.value }))}>
            <option value="">Seleccionar mesa</option>
            {mesas.map(m => <option key={m.id_mesa} value={m.id_mesa}>{m.identificador_mesa}</option>)}
          </select>
        </div>
        <div style={s.campo}>
          <label style={s.label}>Mesero</label>
          <select style={s.input} value={form.id} onChange={e => setForm(f => ({ ...f, id: e.target.value }))}>
            <option value="">Seleccionar mesero</option>
            {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>)}
          </select>
        </div>
        <div style={{ ...s.campo, gridColumn: '1 / -1' }}>
          <label style={s.label}>Observaciones</label>
          <textarea style={{ ...s.input, minHeight: 60 }} placeholder="Observaciones del pedido..." value={form.observaciones} onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} />
        </div>
        <div style={{ ...s.campo, gridColumn: '1 / -1' }}>
          <label style={s.label}>Productos</label>
          <div style={s.agregarProducto}>
            <select style={{ ...s.input, flex: 2 }} value={selectedProducto} onChange={e => setSelectedProducto(e.target.value)}>
              <option value="">Seleccionar producto</option>
              {productos.map(p => <option key={p.id_producto} value={p.id_producto}>{p.nombre} - S/ {p.precio.toFixed(2)}</option>)}
            </select>
            <input type="number" style={{ ...s.input, width: 80 }} min="1" value={cantidad} onChange={e => setCantidad(parseInt(e.target.value) || 1)} />
            <button style={s.btnAgregar} onClick={agregarItem}>+ Agregar</button>
          </div>
        </div>
        {items.length > 0 && (
          <div style={{ ...s.campo, gridColumn: '1 / -1' }}>
            <table style={s.itemsTable}>
              <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th><th></th></tr></thead>
              <tbody>
                {items.map((item, idx) => {
                  const prod = productos.find(p => p.id_producto === item.id_producto);
                  return (
                    <tr key={idx}>
                      <td>{prod?.nombre}</td>
                      <td><input type="number" min="1" value={item.cantidad} onChange={e => actualizarCantidad(item.id_producto, parseInt(e.target.value) || 1)} style={s.cantidadInput} /></td>
                      <td>S/ {item.precio.toFixed(2)}</td>
                      <td>S/ {(item.precio * item.cantidad).toFixed(2)}</td>
                      <td><button style={s.btnRemoveItem} onClick={() => removerItem(item.id_producto)}>✕</button></td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot><tr><td colSpan="3" style={{ textAlign: 'right' }}><strong>TOTAL:</strong></td><td><strong>S/ {total.toFixed(2)}</strong></td><td></td></tr></tfoot>
            </table>
          </div>
        )}
        <div style={s.campo}>
          <label style={s.label}>Estado</label>
          <div style={s.estadoRadioGroup}>
            {ESTADOS_PEDIDO.map(est => {
              const ec = ESTADO_CONFIG[est];
              return (
                <button key={est} type="button" style={{ ...s.estadoRadio, background: form.estado === est ? ec.bg : '#F8FAFC', borderColor: form.estado === est ? ec.color : '#E2E8F0', color: form.estado === est ? ec.color : '#64748B' }} onClick={() => setForm(f => ({ ...f, estado: est }))}>
                  {ec.icono} {ec.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div style={m.footer}>
        <button style={s.btnSecondary} onClick={onClose}>Cancelar</button>
        <button style={s.btnPrimary} onClick={guardarPedido}>{titulo === 'Nuevo pedido' ? 'Crear pedido' : 'Guardar cambios'}</button>
      </div>
    </Modal>
  );
}

// ── COMPONENTE PRINCIPAL ───────────────────────────────────────────
export default function Pedidos() {
  const [pedidos, setPedidos] = useState(MOCK_PEDIDOS);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false); // 'crear' | 'editar' | 'detalle' | 'eliminar'
  const [pedidoSel, setPedidoSel] = useState(null);
  const [form, setForm] = useState(PEDIDO_VACIO);
  
  // Mock data para selects
  const mesas = MOCK_MESAS;
  const usuarios = MOCK_USUARIOS;
  const productos = MOCK_PRODUCTOS;
  
  const getMesa = (id_mesa) => mesas.find(m => m.id_mesa === id_mesa);
  const getMesero = (id) => usuarios.find(u => u.id === id);
  
  // Filtrado
  const pedidosFiltrados = pedidos.filter(p => {
    const matchEstado = filtroEstado === 'todos' || p.estado === filtroEstado;
    const q = busqueda.toLowerCase();
    const mesa = getMesa(p.id_mesa);
    const matchBusq = !q || mesa?.identificador_mesa?.toLowerCase().includes(q) || p.id_pedidos.toString().includes(q);
    return matchEstado && matchBusq;
  });
  
  // Abrir modales
  const abrirCrear = () => {
    setForm({ ...PEDIDO_VACIO, items: [] });
    setModalAbierto('crear');
  };
  const abrirEditar = (p) => {
    setPedidoSel(p);
    setForm({ ...p, items: p.items || [] });
    setModalAbierto('editar');
  };
  const abrirDetalle = (p) => {
    setPedidoSel(p);
    setModalAbierto('detalle');
  };
  const abrirEliminar = (p) => {
    setPedidoSel(p);
    setModalAbierto('eliminar');
  };
  const cerrarModal = () => { setModalAbierto(false); setPedidoSel(null); };
  
  // Guardar
  const guardar = (data) => {
    const ahora = new Date().toISOString().slice(0, 19).replace('T', ' ');
    if (modalAbierto === 'editar') {
      setPedidos(prev => prev.map(p => p.id_pedidos === pedidoSel.id_pedidos 
        ? { ...p, ...data, tiempo_modificacion: ahora }
        : p
      ));
    } else {
      const nuevoId = Math.max(...pedidos.map(p => p.id_pedidos), 0) + 1;
      setPedidos(prev => [...prev, {
        ...data,
        id_pedidos: nuevoId,
        tiempo_creacion: ahora,
        tiempo_finalizacion: null,
        tiempo_modificacion: null
      }]);
    }
    cerrarModal();
  };
  
  // Cambiar estado rápido
  const cambiarEstado = (id, nuevoEstado) => {
    setPedidos(prev => prev.map(p => p.id_pedidos === id 
      ? { ...p, estado: nuevoEstado, tiempo_modificacion: new Date().toISOString().slice(0, 19).replace('T', ' ') }
      : p
    ));
  };
  
  // Eliminar
  const eliminar = () => {
    setPedidos(prev => prev.filter(p => p.id_pedidos !== pedidoSel.id_pedidos));
    cerrarModal();
  };
  
  // Contadores
  const contadores = ESTADOS_PEDIDO.reduce((acc, e) => {
    acc[e] = pedidos.filter(p => p.estado === e).length;
    return acc;
  }, {});
  contadores.todos = pedidos.length;
  
  return (
    <AdminLayout>
      <div style={s.page}>
        
        {/* HEADER */}
        <div style={s.pageHeader}>
          <div>
            <h1 style={s.titulo}>Gestión de Pedidos</h1>
            <p style={s.subtitulo}>{pedidos.length} pedidos en total · {contadores.recibido || 0} por atender · {contadores.preparacion || 0} en cocina · {contadores.listo || 0} listos</p>
          </div>
          <button style={s.btnPrimary} onClick={abrirCrear}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nuevo pedido
          </button>
        </div>
        
        {/* CHIPS POR ESTADO */}
        <div style={s.chipsRow}>
          {[
            { key: 'todos', label: 'Todos', count: contadores.todos, icono: '📋' },
            { key: 'recibido', label: 'Recibidos', count: contadores.recibido, icono: ESTADO_CONFIG.recibido.icono },
            { key: 'preparacion', label: 'En preparación', count: contadores.preparacion, icono: ESTADO_CONFIG.preparacion.icono },
            { key: 'listo', label: 'Listos', count: contadores.listo, icono: ESTADO_CONFIG.listo.icono },
            { key: 'pagado', label: 'Pagados', count: contadores.pagado, icono: ESTADO_CONFIG.pagado.icono },
            { key: 'anulado', label: 'Anulados', count: contadores.anulado, icono: ESTADO_CONFIG.anulado.icono },
          ].map(chip => (
            <button key={chip.key} style={{ ...s.chip, ...(filtroEstado === chip.key ? s.chipActive : {}) }} onClick={() => setFiltroEstado(chip.key)}>
              <span style={{ marginRight: 4 }}>{chip.icono}</span>
              {chip.label}
              <span style={{ ...s.chipCount, ...(filtroEstado === chip.key ? s.chipCountActive : {}) }}>{chip.count}</span>
            </button>
          ))}
        </div>
        
        {/* BUSCADOR */}
        <div style={s.searchWrap}>
          <svg style={s.searchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input style={s.searchInput} placeholder="Buscar por #pedido o mesa..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          <span style={s.resultCount}>{pedidosFiltrados.length} pedido{pedidosFiltrados.length !== 1 ? 's' : ''}</span>
        </div>
        
        {/* TABLA DE PEDIDOS */}
        <div style={s.tableCard}>
          <table style={s.table}>
            <thead>
              <tr style={s.thead}>
                {['ID', 'Mesa', 'Mesero', 'Fecha/Hora', 'Items', 'Total', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
               </tr>
            </thead>
            <tbody>
              {pedidosFiltrados.length === 0 ? (
                <tr><td colSpan={8} style={s.emptyTd}>No se encontraron pedidos</td></tr>
              ) : (
                pedidosFiltrados.map((p, i) => {
                  const ec = ESTADO_CONFIG[p.estado];
                  const mesa = getMesa(p.id_mesa);
                  const mesero = getMesero(p.id);
                  const total = p.items?.reduce((sum, item) => sum + (item.precio * item.cantidad), 0) || 0;
                  const itemsCount = p.items?.reduce((sum, item) => sum + item.cantidad, 0) || 0;
                  
                  return (
                    <tr key={p.id_pedidos} style={{ background: i % 2 === 0 ? '#fff' : '#F8FAFC' }}>
                      <td style={s.td}><span style={s.pedidoId}>#{p.id_pedidos}</span></td>
                      <td style={s.td}>{mesa?.identificador_mesa || 'N/A'}</td>
                      <td style={s.td}>{mesero?.nombre} {mesero?.apellido}</td>
                      <td style={{ ...s.td, fontSize: 12, color: '#64748B' }}>{p.tiempo_creacion}</td>
                      <td style={s.td}>{itemsCount} {itemsCount === 1 ? 'producto' : 'productos'}</td>
                      <td style={{ ...s.td, fontWeight: 700 }}>S/ {total.toFixed(2)}</td>
                      <td style={s.td}>
                        <select
                          style={{ ...s.estadoSelect, background: ec.bg, color: ec.color, borderColor: ec.color }}
                          value={p.estado}
                          onChange={e => cambiarEstado(p.id_pedidos, e.target.value)}
                        >
                          {ESTADOS_PEDIDO.map(est => {
                            const estConf = ESTADO_CONFIG[est];
                            return <option key={est} value={est}>{estConf.icono} {estConf.label}</option>;
                          })}
                        </select>
                      </td>
                      <td style={s.td}>
                        <div style={s.acciones}>
                          <button style={s.btnView} onClick={() => abrirDetalle(p)} title="Ver detalle">👁️</button>
                          <button style={s.btnEdit} onClick={() => abrirEditar(p)} title="Editar">✏️</button>
                          <button style={s.btnDelete} onClick={() => abrirEliminar(p)} title="Eliminar">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* MODAL CREAR/EDITAR */}
      {(modalAbierto === 'crear' || modalAbierto === 'editar') && (
        <ModalPedido
          titulo={modalAbierto === 'crear' ? 'Nuevo pedido' : 'Editar pedido'}
          form={form}
          setForm={setForm}
          errores={{}}
          productos={productos}
          mesas={mesas}
          usuarios={usuarios}
          onClose={cerrarModal}
          onSave={guardar}
        />
      )}
      
      {/* MODAL DETALLE */}
      {modalAbierto === 'detalle' && pedidoSel && (
        <ModalDetalle
          pedido={pedidoSel}
          mesa={getMesa(pedidoSel.id_mesa)}
          mesero={getMesero(pedidoSel.id)}
          onClose={cerrarModal}
        />
      )}
      
      {/* MODAL ELIMINAR */}
      {modalAbierto === 'eliminar' && pedidoSel && (
        <Modal titulo="Eliminar pedido" onClose={cerrarModal}>
          <div style={s.deleteWarning}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <p style={s.deleteText}>¿Estás seguro de eliminar el pedido <strong>#{pedidoSel.id_pedidos}</strong>? Esta acción no se puede deshacer.</p>
          </div>
          <div style={m.footer}>
            <button style={s.btnSecondary} onClick={cerrarModal}>Cancelar</button>
            <button style={{ ...s.btnPrimary, background: '#DC2626' }} onClick={eliminar}>Sí, eliminar</button>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}

// ── ESTILOS ────────────────────────────────────────────────────────
const s = {
  page: { padding: '28px 32px', maxWidth: 1400, margin: '0 auto', fontFamily: "'Plus Jakarta Sans',sans-serif" },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  titulo: { fontSize: 26, fontWeight: 800, color: '#0F1E2E', margin: 0, letterSpacing: -0.5 },
  subtitulo: { color: '#64748B', fontSize: 13, marginTop: 4 },
  btnPrimary: {
    display: 'flex', alignItems: 'center', gap: 7,
    padding: '10px 18px', borderRadius: 10,
    background: 'linear-gradient(135deg,#2563EB,#3B82F6)',
    color: '#fff', border: 'none', cursor: 'pointer',
    fontSize: 14, fontWeight: 700,
    boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
    fontFamily: "'Plus Jakarta Sans',sans-serif",
  },
  btnSecondary: {
    padding: '10px 18px', borderRadius: 10,
    background: '#F1F5F9', color: '#475569',
    border: '1px solid #E2E8F0', cursor: 'pointer',
    fontSize: 14, fontWeight: 600,
    fontFamily: "'Plus Jakarta Sans',sans-serif",
  },
  chipsRow: { display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  chip: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '7px 14px', borderRadius: 20,
    background: '#fff', border: '1px solid #E2E8F0',
    color: '#64748B', cursor: 'pointer',
    fontSize: 13, fontWeight: 600,
    fontFamily: "'Plus Jakarta Sans',sans-serif",
  },
  chipActive: { background: '#EFF6FF', borderColor: '#BFDBFE', color: '#1D4ED8' },
  chipCount: { background: '#F1F5F9', color: '#94A3B8', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 700 },
  chipCountActive: { background: '#DBEAFE', color: '#1D4ED8' },
  searchWrap: { position: 'relative', display: 'flex', alignItems: 'center', marginBottom: 20 },
  searchIcon: { position: 'absolute', left: 12, color: '#94A3B8', pointerEvents: 'none' },
  searchInput: { flex: 1, maxWidth: 380, padding: '9px 12px 9px 36px', borderRadius: 9, border: '1px solid #E2E8F0', fontSize: 13, outline: 'none', color: '#334155', fontFamily: "'Plus Jakarta Sans',sans-serif", background: '#fff' },
  resultCount: { color: '#94A3B8', fontSize: 12, fontWeight: 600, marginLeft: 14 },
  tableCard: { background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.07)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  thead: { background: '#F8FAFC' },
  th: { padding: '11px 16px', textAlign: 'left', color: '#64748B', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, borderBottom: '1px solid #F1F5F9' },
  td: { padding: '12px 16px', color: '#334155', verticalAlign: 'middle', borderBottom: '1px solid #F8FAFC' },
  emptyTd: { padding: '40px', textAlign: 'center', color: '#94A3B8', fontSize: 14 },
  pedidoId: { fontWeight: 700, color: '#2563EB', fontFamily: 'monospace', fontSize: 12 },
  estadoSelect: { padding: '4px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, border: '1px solid', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif" },
  acciones: { display: 'flex', gap: 6 },
  btnView: { padding: '5px 8px', borderRadius: 6, background: '#F1F5F9', border: '1px solid #E2E8F0', cursor: 'pointer', fontSize: 13 },
  btnEdit: { padding: '5px 8px', borderRadius: 6, background: '#EFF6FF', border: '1px solid #BFDBFE', cursor: 'pointer', fontSize: 13 },
  btnDelete: { padding: '5px 8px', borderRadius: 6, background: '#FEF2F2', border: '1px solid #FECACA', cursor: 'pointer', fontSize: 13 },
  // Formulario
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px', padding: '4px 0 8px' },
  campo: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { padding: '9px 12px', borderRadius: 9, border: '1px solid #E2E8F0', fontSize: 13, outline: 'none', color: '#1E293B', fontFamily: "'Plus Jakarta Sans',sans-serif", background: '#F8FAFC' },
  estadoRadioGroup: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  estadoRadio: { flex: 1, padding: '8px 12px', borderRadius: 9, border: '1px solid #E2E8F0', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 },
  agregarProducto: { display: 'flex', gap: 8, alignItems: 'center' },
  btnAgregar: { padding: '9px 16px', borderRadius: 9, background: '#D1FAE5', color: '#065F46', border: '1px solid #A7F3D0', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  itemsTable: { width: '100%', borderCollapse: 'collapse', fontSize: 12, marginTop: 8 },
  cantidadInput: { width: 60, padding: '4px 8px', borderRadius: 6, border: '1px solid #E2E8F0', textAlign: 'center' },
  btnRemoveItem: { background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#DC2626' },
  // Detalle
  detalleContainer: { padding: '4px 0 8px' },
  detalleHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 },
  detalleEstado: { padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700 },
  detalleFechas: { fontSize: 12, color: '#64748B' },
  detalleInfo: { background: '#F8FAFC', borderRadius: 10, padding: '14px 16px', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 8 },
  detalleTable: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  detalleTotalLabel: { textAlign: 'right', padding: '12px 16px' },
  detalleTotal: { padding: '12px 16px', fontSize: 16 },
  deleteWarning: { display: 'flex', alignItems: 'flex-start', gap: 16, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '16px 20px' },
  deleteText: { color: '#7F1D1D', fontSize: 14, lineHeight: 1.6, margin: 0 },
};

const m = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,30,46,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(3px)' },
  modal: { background: '#fff', borderRadius: 16, padding: '28px 32px', width: '100%', maxWidth: 720, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', fontFamily: "'Plus Jakarta Sans',sans-serif", maxHeight: '90vh', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  titulo: { fontSize: 18, fontWeight: 800, color: '#0F1E2E', margin: 0, letterSpacing: -0.3 },
  closeBtn: { background: '#F1F5F9', border: 'none', cursor: 'pointer', borderRadius: 8, padding: '6px 8px', color: '#64748B', display: 'flex', alignItems: 'center' },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24, paddingTop: 20, borderTop: '1px solid #F1F5F9' },
};
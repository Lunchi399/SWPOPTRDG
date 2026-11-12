import { useEffect, useState } from 'react';
import {
  getRecetas, crearReceta, editarReceta, getInsumos, getDisponibilidad,
} from '../../../services/inventarioService';
import { getProductos } from '../../../services/adminService';

const LINEA_VACIA = { id_insumo: '', cantidad_por_porcion: '' };

export default function TabRecetas() {
  const [recetas,   setRecetas]   = useState([]);
  const [insumos,   setInsumos]   = useState([]);
  const [productos, setProductos] = useState([]);
  const [dispon,    setDispon]    = useState([]);
  const [modal,     setModal]     = useState(null);      // 'crear' | 'editar' | null
  const [sel,       setSel]       = useState(null);
  const [form,      setForm]      = useState({ id_producto: '', descripcion: '' });
  const [detalles,  setDetalles]  = useState([{ ...LINEA_VACIA }]);
  const [vista,     setVista]     = useState('recetas');
  const [guardando, setGuardando] = useState(false);
  const [msg,       setMsg]       = useState('');
  const [error,     setError]     = useState('');

  const cargar = () => {
    getRecetas().then(r => setRecetas(r.data));
    getInsumos().then(r => setInsumos(r.data));
    getProductos().then(r => setProductos(r.data)).catch(() => {});
    getDisponibilidad().then(r => setDispon(r.data)).catch(() => {});
  };
  useEffect(() => { cargar(); }, []);   // eslint-disable-line

  const mostrar = (texto, err = false) => {
    err ? setError(texto) : setMsg(texto);
    setTimeout(() => { setMsg(''); setError(''); }, err ? 6000 : 3000);
  };

  // Productos de la carta que todavía no tienen receta activa
  const conReceta = new Set(recetas.map(r => r.id_producto));
  const productosSinReceta = productos.filter(p => !conReceta.has(p.id_producto));

  const cambiarLinea = (i, campo, valor) =>
    setDetalles(ds => ds.map((d, idx) => (idx === i ? { ...d, [campo]: valor } : d)));
  const quitarLinea = (i) => setDetalles(ds => ds.filter((_, idx) => idx !== i));

  const esValida = (d) => d.id_insumo && Number(d.cantidad_por_porcion) > 0;
  const estaVacia = (d) => !d.id_insumo && !d.cantidad_por_porcion;

  const abrirCrear = () => {
    setForm({ id_producto: '', descripcion: '' });
    setDetalles([{ ...LINEA_VACIA }]);
    setError('');
    setModal('crear');
  };

  const abrirEditar = (r) => {
    setSel(r);
    setForm({ id_producto: r.id_producto, descripcion: r.descripcion || '' });
    setDetalles(r.detalles.length > 0
      ? r.detalles.map(d => ({
          id_insumo: d.id_insumo,
          cantidad_por_porcion: d.cantidad_por_porcion,
        }))
      : [{ ...LINEA_VACIA }]);
    setError('');
    setModal('editar');
  };

  const guardar = async () => {
    if (guardando) return;                           // evita el doble clic
    if (modal === 'crear' && !form.id_producto) {
      mostrar('Selecciona un producto de la carta', true); return;
    }
    const incompletas = detalles.filter(d => !esValida(d) && !estaVacia(d));
    if (incompletas.length > 0) {
      mostrar('Hay ingredientes incompletos: elige el insumo y escribe una cantidad mayor a 0, o quita la fila.', true);
      return;
    }
    const validas = detalles.filter(esValida);
    if (validas.length === 0) {
      mostrar('Agrega al menos un ingrediente: elige el insumo y escribe una cantidad mayor a 0.', true);
      return;
    }

    setGuardando(true);
    try {
      if (modal === 'crear') {
        await crearReceta({
          id_producto: form.id_producto,
          descripcion: form.descripcion,
          detalles: validas,
        });
        mostrar('Receta creada y cocineros notificados');
      } else {
        await editarReceta(sel.id_receta, {
          descripcion: form.descripcion,
          detalles: validas,
        });
        mostrar('Receta actualizada y cocineros notificados');
      }
      setModal(null);
      cargar();
    } catch (e) {
      mostrar(e.response?.data?.error || 'No se pudo guardar la receta', true);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div>
      {msg   && <div style={s.toast}>{msg}</div>}
      {error && !modal && <div style={s.toastErr}>{error}</div>}

      {/* Sub-navegación */}
      <div style={s.subNav}>
        {[{ id: 'recetas', label: '📋 Recetas' },
          { id: 'disponibilidad', label: '📊 Disponibilidad por plato' }]
          .map(v => (
            <button key={v.id} style={{
              ...s.subBtn,
              background: vista === v.id ? '#6366F1' : '#fff',
              color:      vista === v.id ? '#fff'    : '#6B7280',
            }} onClick={() => setVista(v.id)}>
              {v.label}
            </button>
          ))}
        <button style={{ ...s.btnPrimario, marginLeft: 'auto' }} onClick={abrirCrear}>
          + Nueva receta
        </button>
      </div>

      {/* Recetas */}
      {vista === 'recetas' && (
        <div style={s.lista}>
          {recetas.length === 0 && (
            <div style={s.vacio}>Aún no hay recetas. Crea la primera con “Nueva receta”.</div>
          )}
          {recetas.map(r => (
            <div key={r.id_receta} style={s.card}>
              <div style={s.cardHeader}>
                <div>
                  <div style={s.cardTitle}>{r.producto_nombre}</div>
                  {r.descripcion && <div style={s.cardSub}>{r.descripcion}</div>}
                </div>
                <button style={s.btnEdit} onClick={() => abrirEditar(r)}>
                  ✏️ Editar receta
                </button>
              </div>
              <div style={s.ingredientes}>
                {r.detalles.length === 0 && (
                  <span style={{ fontSize: 12, color: '#B45309' }}>
                    ⚠️ Sin ingredientes: pulsa Editar para agregarlos.
                  </span>
                )}
                {r.detalles.map(d => (
                  <span key={d.id_detalle_receta} style={s.ingTag}>
                    {d.insumo_nombre}: {d.cantidad_por_porcion} {d.unidad_medida}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Disponibilidad */}
      {vista === 'disponibilidad' && (
        <div style={s.lista}>
          {dispon.map((d, i) => (
            <div key={i} style={{
              ...s.dispCard,
              borderLeftColor: d.alerta_escasez ? '#DC2626' : '#059669',
            }}>
              <div style={s.dispHeader}>
                <span style={s.cardTitle}>{d.producto}</span>
                <span style={{
                  fontSize: 18, fontWeight: 800,
                  color: d.porciones_posibles <= 5 ? '#DC2626'
                       : d.porciones_posibles <= 10 ? '#B45309' : '#059669',
                }}>
                  {d.porciones_posibles} porciones
                </span>
              </div>
              {d.alertas.map((a, j) => (
                <div key={j} style={s.alertaIng}>
                  ⚠️ {a.insumo}: {a.stock} {a.unidad} (solo {a.porciones} porciones posibles)
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Modal crear / editar */}
      {modal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitulo}>
                {modal === 'crear' ? '+ Nueva receta'
                                   : `Editar receta — ${sel?.producto_nombre || ''}`}
              </h3>
              <button style={s.closeBtn} onClick={() => setModal(null)}>✕</button>
            </div>

            <div style={s.modalBody}>
              {/* El error se muestra AQUÍ, dentro del modal */}
              {error && <div style={s.toastErr}>{error}</div>}

              {modal === 'crear' && (
                <div style={{ marginBottom: 12 }}>
                  <label style={s.label}>Producto de la carta *</label>
                  <select style={s.input} value={form.id_producto}
                    onChange={e => setForm({ ...form, id_producto: e.target.value })}>
                    <option value="">
                      {productosSinReceta.length
                        ? 'Seleccionar producto'
                        : 'Todos los productos ya tienen receta'}
                    </option>
                    {productosSinReceta.map(p => (
                      <option key={p.id_producto} value={p.id_producto}>
                        {p.nombre} — {p.categoria}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ marginBottom: 12 }}>
                <label style={s.label}>Descripción / notas de preparación</label>
                <textarea style={{ ...s.input, minHeight: 60, resize: 'vertical' }}
                  value={form.descripcion}
                  onChange={e => setForm({ ...form, descripcion: e.target.value })} />
              </div>

              <label style={s.label}>Ingredientes (cantidad por porción)</label>
              {detalles.map((d, i) => (
                <div key={i} style={s.detalleRow}>
                  <select style={{ ...s.input, flex: 2 }} value={d.id_insumo}
                    onChange={e => cambiarLinea(i, 'id_insumo', e.target.value)}>
                    <option value="">Insumo</option>
                    {d.id_insumo !== '' &&
                      !insumos.some(x => String(x.id_insumo) === String(d.id_insumo)) && (
                        <option value={d.id_insumo}>
                          Insumo #{d.id_insumo} (inactivo)
                        </option>
                      )}
                    {insumos.map(ins => (
                      <option key={ins.id_insumo} value={ins.id_insumo}>
                        {ins.nombre} ({ins.unidad_medida})
                      </option>
                    ))}
                  </select>
                  <input style={{ ...s.input, flex: 1 }} type="number" min="0"
                    step="0.0001" placeholder="Cantidad"
                    value={d.cantidad_por_porcion}
                    onChange={e => cambiarLinea(i, 'cantidad_por_porcion', e.target.value)} />
                  {detalles.length > 1 && (
                    <button style={s.btnQuitar} onClick={() => quitarLinea(i)}>✕</button>
                  )}
                </div>
              ))}
              <button style={s.btnAgregar}
                onClick={() => setDetalles(ds => [...ds, { ...LINEA_VACIA }])}>
                + Agregar ingrediente
              </button>
            </div>

            <div style={s.modalFooter}>
              <button style={s.btnSec} onClick={() => setModal(null)}>Cancelar</button>
              <button style={{ ...s.btnPrimario, opacity: guardando ? 0.7 : 1 }}
                disabled={guardando} onClick={guardar}>
                {guardando ? 'Guardando…'
                  : modal === 'crear' ? 'Crear receta' : 'Guardar y notificar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  toast:    { background: '#ECFDF5', color: '#059669', padding: '10px 14px', borderRadius: 8, marginBottom: 12, fontSize: 13 },
  toastErr: { background: '#FEF2F2', color: '#DC2626', padding: '10px 14px', borderRadius: 8, marginBottom: 12, fontSize: 13, lineHeight: 1.5 },
  subNav:   { display: 'flex', gap: 8, marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' },
  subBtn:   { padding: '7px 16px', borderRadius: 20, border: '1px solid #E8EAF0', cursor: 'pointer', fontSize: 13 },
  btnPrimario: { padding: '9px 18px', borderRadius: 8, background: '#6366F1', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  lista:    { display: 'flex', flexDirection: 'column', gap: 10 },
  vacio:    { textAlign: 'center', color: '#9CA3AF', padding: '2.5rem', fontSize: 14, background: '#fff', borderRadius: 12, border: '1px solid #E8EAF0' },
  card:     { background: '#fff', borderRadius: 12, padding: '1rem 1.25rem', border: '1px solid #E8EAF0' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardTitle:  { fontSize: 14, fontWeight: 700, color: '#0F1628' },
  cardSub:    { fontSize: 12, color: '#6B7280', marginTop: 2 },
  ingredientes: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  ingTag:   { background: '#EEF2FF', color: '#4338CA', fontSize: 11, padding: '3px 10px', borderRadius: 6 },
  btnEdit:  { padding: '6px 14px', borderRadius: 8, background: '#F9FAFB', color: '#6366F1', border: '1px solid #E8EAF0', cursor: 'pointer', fontSize: 12 },
  dispCard: { background: '#fff', borderRadius: 12, padding: '1rem 1.25rem', border: '1px solid #E8EAF0', borderLeft: '4px solid' },
  dispHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  alertaIng: { fontSize: 12, color: '#B45309', marginTop: 4 },
  overlay:  { position: 'fixed', inset: 0, background: 'rgba(15,22,40,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem', backdropFilter: 'blur(2px)' },
  modal:    { background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid #F3F4F6', position: 'sticky', top: 0, background: '#fff', zIndex: 1 },
  modalTitulo: { fontSize: 16, fontWeight: 700, color: '#0F1628', margin: 0 },
  closeBtn: { background: '#F3F4F6', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', color: '#6B7280', fontSize: 14 },
  modalBody: { padding: '1.25rem 1.5rem' },
  label:    { fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 },
  input:    { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E8EAF0', fontSize: 13, color: '#0F1628', outline: 'none', boxSizing: 'border-box' },
  detalleRow: { display: 'flex', gap: 8, marginBottom: 8 },
  btnQuitar: { padding: '8px 10px', borderRadius: 6, background: '#FEF2F2', color: '#DC2626', border: 'none', cursor: 'pointer' },
  btnAgregar: { fontSize: 12, color: '#6366F1', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', marginBottom: 8 },
  modalFooter: { display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '1rem 1.5rem', borderTop: '1px solid #F3F4F6', position: 'sticky', bottom: 0, background: '#fff' },
  btnSec:   { padding: '9px 18px', borderRadius: 8, background: '#F3F4F6', color: '#6B7280', border: 'none', cursor: 'pointer', fontSize: 13 },
};

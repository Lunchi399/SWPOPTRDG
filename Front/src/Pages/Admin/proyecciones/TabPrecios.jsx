import { useState } from 'react';
import Modal from '../../../components/Admin/Modal';
import { getHistorialPrecios, getPrecios, registrarPrecio } from '../../../services/proyeccionesService';
import { Aviso, Cargando, Metrica, Pill, Tabla } from './comunes';
import { fmtFecha, msgError, s, useCarga } from './utilidades';

// RFN57 — precio de compra por unidad de medida, con historial
export default function TabPrecios() {
  const { data: d, cargando, error, recargar } = useCarga(() => getPrecios(), []);
  const [soloSin, setSoloSin] = useState(false);
  const [form, setForm] = useState({});            // { [id_insumo]: { precio } }
  const [msg, setMsg] = useState(null);
  const [hist, setHist] = useState(null);

  const aviso = (ok, t) => { setMsg({ ok, t }); setTimeout(() => setMsg(null), 3500); };
  const set = (id, k, v) => setForm(f => ({ ...f, [id]: { ...f[id], [k]: v } }));

  const guardar = async (i) => {
    const f = form[i.id_insumo] || {};
    if (!f.precio) return aviso(false, 'Ingresa el precio');
    try {
      const r = await registrarPrecio({ id_insumo: i.id_insumo, precio_unitario: f.precio });
      aviso(true, r.data.corregido ? `${i.nombre}: el precio no cambió` : `Precio de ${i.nombre} actualizado`);
      setForm(x => ({ ...x, [i.id_insumo]: {} })); recargar();
    } catch (e) { aviso(false, msgError(e, 'No se pudo registrar')); }
  };
  const verHistorial = async (i) => {
    try { setHist((await getHistorialPrecios(i.id_insumo)).data); }
    catch (e) { aviso(false, msgError(e)); }
  };

  const filas = d ? d.insumos.filter(i => !soloSin || i.sin_precio) : [];
  return (
    <div>
      {msg && <Aviso tipo={msg.ok ? 'ok' : 'err'}>{msg.t}</Aviso>}
      <Cargando cargando={cargando && !d} error={error} />
      {d && (<>
        <div style={s.metricas}>
          <Metrica icono="📦" label="Insumos activos" valor={d.insumos.length} />
          <Metrica icono="⚠️" label="Sin precio registrado" valor={d.total_sin_precio} bg="#FEF3D0" fg="#92400E" />
        </div>
        <div style={s.fila}>
          <label style={{ ...s.label, display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="checkbox" checked={soloSin} onChange={e => setSoloSin(e.target.checked)} /> Mostrar solo los que no tienen precio
          </label>
        </div>
        <Tabla keyFn={i => i.id_insumo} filas={filas} vacio="Todos los insumos tienen precio 🎉"
          cols={[['Insumo', i => <b>{i.nombre}</b>],
                 ['Unidad', i => i.unidad_medida],
                 ['Precio actual', i => i.sin_precio ? <Pill tono="medio">Sin precio</Pill>
                     : `S/ ${i.precio_actual.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} / ${i.unidad_medida}`, 'right'],
                 ['Vigente desde', i => fmtFecha(i.vigente_desde)],
                 ['Nuevo precio', i => (
                    <span style={{ display: 'inline-flex', gap: 6 }}>
                      <input type="number" min="0" step="0.0001" placeholder="S/" style={{ ...s.input, width: 90 }}
                        value={form[i.id_insumo]?.precio || ''} onChange={e => set(i.id_insumo, 'precio', e.target.value)} />
                      <button style={s.btn} onClick={() => guardar(i)}>Guardar</button>
                    </span>)],
                 ['', i => <button style={s.btnSec} onClick={() => verHistorial(i)}>Historial</button>]]} />
      </>)}

      {hist && (
        <Modal titulo={`Historial de precios · ${hist.insumo}`} onClose={() => setHist(null)} maxWidth={560}>
          <Tabla filas={hist.historial} vacio="Sin precios registrados" keyFn={h => h.id_precio}
            cols={[['Vigente desde', h => h.vigente_desde],
                   ['Precio', h => `S/ ${h.precio_unitario} / ${hist.unidad_medida}`, 'right']]} />
        </Modal>
      )}
    </div>
  );
}

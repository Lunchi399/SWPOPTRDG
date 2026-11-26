import { useState } from 'react';
import { descargarPlanCsv, getPlanCompras } from '../../../services/proyeccionesService';
import { Aviso, AvisoSinPrecio, BotonGuardar, Cargando, Metrica, Pill, Tabla } from './comunes';
import { descargarBlob, fmtN, fmtS, msgError, s, useCarga } from './utilidades';

// RFN55 — plan de compras · RFN60 — exportar a CSV
export default function TabCompras() {
  const [dias, setDias] = useState(28);
  const [err, setErr] = useState('');
  const { data: d, cargando, error } = useCarga(() => getPlanCompras({ dias_historial: dias }), [dias]);

  const exportar = async () => {
    try {
      const r = await descargarPlanCsv({ dias_historial: dias });
      descargarBlob(r.data, `plan_compras_${d.desde}_${d.hasta}.csv`);
    } catch (e) { setErr(msgError(e, 'No se pudo exportar')); }
  };

  return (
    <div>
      <div style={s.fila}>
        <span style={s.label}>Demanda basada en</span>
        <select style={s.select} value={dias} onChange={e => setDias(+e.target.value)}>
          {[14, 28, 56, 90].map(n => <option key={n} value={n}>últimos {n} días</option>)}
        </select>
        <span style={{ flex: 1 }} />
        <BotonGuardar tipo="compras" parametros={{ dias_historial: dias }} />
        <button style={s.btn} onClick={exportar} disabled={!d}>⬇️ Exportar CSV</button>
      </div>
      {err && <Aviso tipo="err">{err}</Aviso>}
      <Cargando cargando={cargando && !d} error={error} />
      {d && (<>
        <AvisoSinPrecio lista={d.insumos_sin_precio} />
        <div style={s.metricas}>
          <Metrica icono="🗓️" label="Semana" valor={`${d.desde.slice(5)} → ${d.hasta.slice(5)}`} />
          <Metrica icono="📦" label="Insumos a comprar" valor={d.total_items} bg="#E8FAF1" fg="#059669" />
          <Metrica icono="🧾" label="Total estimado" valor={fmtS(d.total_estimado)} bg="#FEF3D0" fg="#92400E" />
        </div>
        {d.grupos.length === 0 && <Aviso tipo="ok">No hace falta comprar nada: el stock cubre la semana y el punto de reorden.</Aviso>}
        {d.grupos.map(g => (
          <div key={g.distribuidora}>
            <h3 style={s.h3}>🚚 {g.distribuidora} · {fmtS(g.subtotal)}</h3>
            <Tabla keyFn={i => i.id_insumo} filas={g.items}
              cols={[['Insumo', i => <b>{i.nombre}</b>],
                     ['Stock', i => `${fmtN(i.stock_actual, 2)} ${i.unidad_medida}`, 'right'],
                     ['En camino', i => fmtN(i.en_camino, 2), 'right'],
                     ['Necesidad', i => fmtN(i.necesidad_estimada, 2), 'right'],
                     ['Comprar', i => <b>{fmtN(i.cantidad_a_comprar, 2)} {i.unidad_medida}</b>, 'right'],
                     ['Precio', i => fmtS(i.precio_unitario), 'right'],
                     ['Costo', i => fmtS(i.costo_estimado), 'right'],
                     ['Riesgo', i => <Pill tono={i.riesgo_quiebre}>{i.riesgo_quiebre}</Pill>]]} />
          </div>
        ))}
      </>)}
    </div>
  );
}

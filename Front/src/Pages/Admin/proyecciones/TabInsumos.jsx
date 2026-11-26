import { useState } from 'react';
import { getConsumo, getGasto } from '../../../services/proyeccionesService';
import { Aviso, AvisoSinPrecio, BotonGuardar, Cargando, Metrica, Pill, Tabla } from './comunes';
import { fmtN, fmtS, s, useCarga } from './utilidades';

// RFN50 (consumo y frecuencia de compra) + RFN51 (gasto vs. real)
export default function TabInsumos() {
  const [p, setP] = useState({ horizonte: 'semana', dias_historial: 28 });
  const c = useCarga(() => getConsumo(p), [p.horizonte, p.dias_historial]);
  const g = useCarga(() => getGasto(p), [p.horizonte, p.dias_historial]);
  const cons = c.data, gas = g.data;

  return (
    <div>
      <div style={s.fila}>
        <span style={s.label}>Proyectar</span>
        <select style={s.select} value={p.horizonte} onChange={e => setP({ ...p, horizonte: e.target.value })}>
          <option value="dia">Próximo día</option><option value="semana">Próxima semana</option>
        </select>
        <span style={{ flex: 1 }} />
        <BotonGuardar tipo="consumo" parametros={p} />
        <BotonGuardar tipo="gasto" parametros={p} />
      </div>

      <Cargando cargando={(c.cargando && !cons) || (g.cargando && !gas)} error={c.error || g.error} />
      {gas && (<>
        <AvisoSinPrecio lista={gas.insumos_sin_precio} aprox={gas.valorizaciones_aproximadas} />
        <div style={s.metricas}>
          <Metrica icono="🧾" label="Gasto estimado en compras" valor={fmtS(gas.gasto_estimado_compras)} bg="#FEF3D0" fg="#92400E" />
          <Metrica icono="🍳" label="Costo del consumo estimado" valor={fmtS(gas.costo_consumo_estimado)} />
          <Metrica icono="📊" label="Promedio real anterior" valor={fmtS(gas.promedio_gasto_real)} bg="#EEF0FF" fg="#4338CA"
            sub={gas.variacion_pct == null ? 'sin referencia' : `${gas.variacion_pct > 0 ? '+' : ''}${gas.variacion_pct}% la estimación`} />
        </div>
        <div style={s.cardPad}>
          <h3 style={s.h3}>Gasto real de períodos anteriores</h3>
          <Tabla keyFn={h => h.desde} filas={gas.historico}
            cols={[['Período', h => `${h.desde} → ${h.hasta}`], ['Gasto real', h => fmtS(h.gasto_real), 'right']]} />
        </div>
      </>)}

      {cons && (<>
        {cons.productos_sin_receta.length > 0 && (
          <Aviso>Platos con demanda sin receta activa: <b>{cons.productos_sin_receta.map(x => x.nombre).join(', ')}</b></Aviso>
        )}
        <h3 style={s.h3}>Insumos necesarios, cantidad a comprar y frecuencia</h3>
        <Tabla keyFn={r => r.id_insumo} filas={cons.items} vacio="No hay insumos activos"
          cols={[['Insumo', r => <b>{r.nombre}</b>],
                 ['Stock', r => `${fmtN(r.stock_actual, 2)} ${r.unidad_medida}`, 'right'],
                 ['Necesidad', r => fmtN(r.necesidad_estimada, 2), 'right'],
                 ['Cobertura', r => r.cobertura_dias == null ? '—' : `${r.cobertura_dias} d`, 'right'],
                 ['Riesgo', r => <Pill tono={r.riesgo_quiebre}>{r.riesgo_quiebre}</Pill>],
                 ['Comprar', r => <b>{fmtN(r.cantidad_a_comprar, 2)}</b>, 'right'],
                 ['Frecuencia', r => <span title={r.frecuencia_origen === 'historial' ? 'según tus compras previas' : 'estimada por categoría'}>
                    cada {r.frecuencia_dias} d · {fmtN(r.cantidad_por_compra, 2)}</span>],
                 ['Stock', r => r.sobrestock ? <Pill tono="medio">sobrestock</Pill> : '']]} />
      </>)}
    </div>
  );
}

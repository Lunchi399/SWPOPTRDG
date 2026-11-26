import { GraficoSerie } from './Grafico';
import { getDashboardProy } from '../../../services/proyeccionesService';
import { AvisoSinPrecio, Aviso, Cargando, Metrica, Pill, Tabla } from './comunes';
import { fmtN, fmtS, s, useCarga } from './utilidades';

export default function TabDashboard() {
  const { data: d, cargando, error } = useCarga(() => getDashboardProy(), []);
  if (!d) return <Cargando cargando={cargando} error={error} />;

  const sinDatos = d.confianza === 'sin_datos';
  return (
    <div>
      {sinDatos && <Aviso>Aún no hay ventas históricas: las proyecciones aparecerán cuando existan pedidos de días anteriores.</Aviso>}
      {d.confianza === 'baja' && <Aviso>Confianza baja: solo {d.dias_operativos} día(s) con ventas en el historial.</Aviso>}
      <AvisoSinPrecio lista={d.insumos_sin_precio} />

      <div style={s.metricas}>
        <Metrica icono="🛒" label="Ventas estimadas · mañana" valor={fmtS(d.ventas_estimadas_dia)} />
        <Metrica icono="📈" label="Ventas estimadas · 7 días" valor={fmtS(d.ventas_estimadas_semana)}
          bg="#E8FAF1" fg="#059669" sub={`${fmtN(d.unidades_estimadas_semana, 0)} platos`} />
        <Metrica icono="📦" label="Gasto estimado en insumos" valor={fmtS(d.gasto_estimado_insumos)}
          bg="#FEF3D0" fg="#92400E"
          sub={d.variacion_gasto_pct == null ? 'sin referencia previa'
            : `${d.variacion_gasto_pct > 0 ? '+' : ''}${d.variacion_gasto_pct}% vs. promedio real`} />
        <Metrica icono="💰" label="Margen esperado" valor={fmtS(d.margen_esperado)} bg="#EEF0FF" fg="#4338CA"
          sub={d.margen_esperado_pct == null ? '' : `${d.margen_esperado_pct}%${d.margen_confiable ? '' : ' (parcial)'}`} />
      </div>

      <div style={s.cardPad}>
        <h3 style={s.h3}>Ventas reales (14 días) y proyectadas (7 días)</h3>
        <GraficoSerie serie={d.serie.map(p => ({ ...p, valor: p.ventas }))} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(420px,1fr))', gap: 16 }}>
        <div>
          <h3 style={s.h3}>⚠️ Insumos con alto riesgo de quiebre ({d.total_alertas_quiebre})</h3>
          <Tabla vacio="Sin riesgo de quiebre 🎉" filas={d.alertas_quiebre} keyFn={r => r.id_insumo}
            cols={[['Insumo', r => <b>{r.nombre}</b>],
                   ['Stock', r => `${fmtN(r.stock_actual)} ${r.unidad_medida}`, 'right'],
                   ['Cobertura', r => r.cobertura_dias == null ? '—' : `${r.cobertura_dias} d`, 'right'],
                   ['Comprar', r => fmtN(r.cantidad_a_comprar, 2), 'right']]} />
        </div>
        <div>
          <h3 style={s.h3}>📉 Platos con baja rentabilidad ({d.total_alertas_rentabilidad})</h3>
          <Tabla vacio="Todos los platos superan el margen mínimo" filas={d.alertas_rentabilidad} keyFn={r => r.id_producto}
            cols={[['Plato', r => <b>{r.nombre}</b>],
                   ['Costo', r => fmtS(r.costo_preparacion), 'right'],
                   ['Margen', r => <Pill tono="no_rentable">{r.margen_pct}%</Pill>, 'right'],
                   ['Precio sugerido', r => fmtS(r.precio_sugerido), 'right']]} />
        </div>
        <div>
          <h3 style={s.h3}>🔥 Mayor rotación (próx. 7 días)</h3>
          <Tabla filas={d.mayor_rotacion} keyFn={r => r.id_producto}
            cols={[['Plato', r => r.nombre], ['Unidades', r => fmtN(r.unidades_estimadas), 'right'],
                   ['Ventas', r => fmtS(r.ventas_estimadas), 'right']]} />
        </div>
        <div>
          <h3 style={s.h3}>🧊 Menor rotación</h3>
          <Tabla filas={d.menor_rotacion} keyFn={r => r.id_producto}
            cols={[['Plato', r => r.nombre], ['Unidades', r => fmtN(r.unidades_estimadas), 'right'],
                   ['Ventas', r => fmtS(r.ventas_estimadas), 'right']]} />
        </div>
      </div>

      {d.productos_sin_receta.length > 0 && (
        <Aviso>Platos con demanda pero sin receta activa (no se proyecta su consumo de insumos):{' '}
          <b>{d.productos_sin_receta.map(p => p.nombre).join(', ')}</b></Aviso>
      )}
    </div>
  );
}

import { useState } from 'react';
import { GraficoFinanzas } from './Grafico';
import { getFinanzas } from '../../../services/proyeccionesService';
import { AvisoSinPrecio, BotonGuardar, Cargando, Metrica, Tabla } from './comunes';
import { fmtFecha, fmtS, s, useCarga } from './utilidades';

export default function TabFinanzas() {
  const [f, setF] = useState({ agrupar: 'dia', desde: '', hasta: '' });
  const params = { agrupar: f.agrupar, ...(f.desde && { desde: f.desde }), ...(f.hasta && { hasta: f.hasta }) };
  const { data: d, cargando, error } = useCarga(() => getFinanzas(params), [f.agrupar, f.desde, f.hasta]);

  const etiqueta = (iso) => f.agrupar === 'mes'
    ? new Date(iso + 'T12:00:00').toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })
    : f.agrupar === 'semana' ? `Sem. ${fmtFecha(iso)}` : fmtFecha(iso);

  return (
    <div>
      <div style={s.fila}>
        <span style={s.label}>Agrupar por</span>
        <select style={s.select} value={f.agrupar} onChange={e => setF({ ...f, agrupar: e.target.value })}>
          <option value="dia">Día</option><option value="semana">Semana</option><option value="mes">Mes</option>
        </select>
        <span style={s.label}>Desde</span>
        <input type="date" style={s.input} value={f.desde} onChange={e => setF({ ...f, desde: e.target.value })} />
        <span style={s.label}>Hasta</span>
        <input type="date" style={s.input} value={f.hasta} onChange={e => setF({ ...f, hasta: e.target.value })} />
        <span style={{ flex: 1 }} />
        <BotonGuardar tipo="financiero" parametros={params} />
      </div>

      <Cargando cargando={cargando && !d} error={error} />
      {d && (<>
        <AvisoSinPrecio lista={d.insumos_sin_precio} aprox={d.valorizaciones_aproximadas} />
        <div style={s.metricas}>
          <Metrica icono="💵" label="Ingresos (caja)" valor={fmtS(d.totales.ingresos)} bg="#E8FAF1" fg="#059669" />
          <Metrica icono="🛒" label="Gasto en compras" valor={fmtS(d.totales.gastos_compras)} bg="#FEE2E2" fg="#991B1B" />
          <Metrica icono="🗑️" label="Merma valorizada" valor={fmtS(d.totales.merma_valorizada)} bg="#FEF3D0" fg="#92400E" sub="incluida en compras" />
          <Metrica icono="🏁" label="Resultado neto" valor={fmtS(d.totales.resultado_neto)}
            sub={d.totales.margen_pct == null ? '' : `${d.totales.margen_pct}% de los ingresos`} />
        </div>
        <div style={s.cardPad}><GraficoFinanzas periodos={d.periodos.map(p => ({ ...p, periodo: p.periodo }))} /></div>
        <Tabla keyFn={p => p.periodo} filas={[...d.periodos].reverse()}
          cols={[['Período', p => etiqueta(p.periodo)],
                 ['Ingresos', p => fmtS(p.ingresos), 'right'],
                 ['Compras', p => fmtS(p.gastos_compras), 'right'],
                 ['Merma', p => fmtS(p.merma_valorizada), 'right'],
                 ['Neto', p => <b style={{ color: p.resultado_neto < 0 ? '#991B1B' : '#166534' }}>{fmtS(p.resultado_neto)}</b>, 'right']]} />
        <p style={{ fontSize: 12, color: '#6B7280' }}>{d.nota}</p>
      </>)}
    </div>
  );
}

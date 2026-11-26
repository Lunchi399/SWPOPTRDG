import { useState } from 'react';
import { GraficoSerie } from './Grafico';
import { getDemanda } from '../../../services/proyeccionesService';
import { Aviso, BotonGuardar, Cargando, Metrica, Pill, Tabla } from './comunes';
import { fmtN, fmtS, s, useCarga } from './utilidades';

const TEND = (t) => t == null ? '—' : t > 5 ? `▲ ${t}%` : t < -5 ? `▼ ${Math.abs(t)}%` : '≈ estable';

export default function TabDemanda() {
  const [p, setP] = useState({ horizonte: 'semana', dias_historial: 28 });
  const { data: d, cargando, error } = useCarga(() => getDemanda(p), [p.horizonte, p.dias_historial]);

  return (
    <div>
      <div style={s.fila}>
        <span style={s.label}>Proyectar</span>
        <select style={s.select} value={p.horizonte} onChange={e => setP({ ...p, horizonte: e.target.value })}>
          <option value="dia">Próximo día</option><option value="semana">Próxima semana</option>
        </select>
        <span style={s.label}>Basado en</span>
        <select style={s.select} value={p.dias_historial} onChange={e => setP({ ...p, dias_historial: +e.target.value })}>
          {[14, 28, 56, 90].map(n => <option key={n} value={n}>últimos {n} días</option>)}
        </select>
        <span style={{ flex: 1 }} />
        <BotonGuardar tipo="demanda" parametros={p} />
      </div>

      <Cargando cargando={cargando && !d} error={error} />
      {d && (<>
        {d.confianza === 'sin_datos' && <Aviso>No hay ventas en el historial seleccionado.</Aviso>}
        {d.confianza === 'baja' && <Aviso>Confianza baja: solo {d.dias_operativos} día(s) con ventas.</Aviso>}
        <div style={s.metricas}>
          <Metrica icono="🍽️" label="Platos estimados" valor={fmtN(d.total_unidades, 0)} />
          <Metrica icono="💵" label="Ventas estimadas" valor={fmtS(d.ventas_estimadas)} bg="#E8FAF1" fg="#059669" />
          <Metrica icono="📅" label="Días con ventas" valor={d.dias_operativos} bg="#EEF0FF" fg="#4338CA"
            sub={`confianza ${d.confianza}`} />
        </div>
        <div style={s.cardPad}>
          <h3 style={s.h3}>Unidades vendidas por día (historial) y proyectadas</h3>
          <GraficoSerie formato={(v) => fmtN(v, 0)} serie={[
            ...d.historico_diario.map(h => ({ fecha: h.fecha, valor: h.unidades, tipo: 'real' })),
            ...d.por_dia.map(h => ({ fecha: h.fecha, valor: h.unidades, tipo: 'proyectado' }))]} />
          <p style={{ fontSize: 12, color: '#6B7280', margin: '8px 0 0' }}>{d.metodo}</p>
        </div>
        <Tabla keyFn={r => r.id_producto} filas={d.platos} vacio="Sin platos"
          cols={[['Plato', r => <b>{r.nombre}</b>], ['Categoría', r => r.categoria],
                 ['Vendidos (hist.)', r => r.unidades_historicas, 'right'],
                 ['Prom./día', r => fmtN(r.promedio_diario, 1), 'right'],
                 ['Estimado', r => <b>{fmtN(r.unidades_estimadas)}</b>, 'right'],
                 ['Ventas est.', r => fmtS(r.ventas_estimadas), 'right'],
                 ['Tendencia', r => TEND(r.tendencia_pct)],
                 ['Rotación', r => r.rotacion ? <Pill tono={r.rotacion}>{r.rotacion}</Pill> : '—']]} />
      </>)}
    </div>
  );
}

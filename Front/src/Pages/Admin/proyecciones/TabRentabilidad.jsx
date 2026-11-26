import { useEffect, useState } from 'react';
import { getConfigProy, getRentabilidad, putConfigProy } from '../../../services/proyeccionesService';
import { Aviso, AvisoSinPrecio, BotonGuardar, Cargando, Metrica, Pill, Tabla } from './comunes';
import { fmtN, fmtS, msgError, s, useCarga } from './utilidades';

const ETIQ = { rentable: 'Rentable', no_rentable: 'No rentable', costo_incompleto: 'Costo incompleto',
               sin_receta: 'Sin receta', sin_precio_venta: 'Sin precio de venta' };

export default function TabRentabilidad() {
  const [dias, setDias] = useState(28);
  const [cfg, setCfg] = useState({ margen_minimo_pct: '', factor_seguridad_pct: '' });
  const [msg, setMsg] = useState(null);
  const { data: d, cargando, error, recargar } = useCarga(() => getRentabilidad({ dias }), [dias]);

  useEffect(() => { getConfigProy().then(r => setCfg(r.data)).catch(() => {}); }, []);

  const guardarCfg = async () => {
    try {
      await putConfigProy({ margen_minimo_pct: cfg.margen_minimo_pct, factor_seguridad_pct: cfg.factor_seguridad_pct });
      setMsg({ ok: true, t: 'Parámetros actualizados' }); recargar();
    } catch (e) { setMsg({ ok: false, t: msgError(e) }); }
    setTimeout(() => setMsg(null), 3000);
  };

  const alertas = d?.platos.filter(x => x.estado === 'no_rentable') || [];
  return (
    <div>
      <div style={s.cardPad}>
        <h3 style={s.h3}>Parámetros</h3>
        <div style={s.fila}>
          <span style={s.label}>Margen mínimo (%)</span>
          <input type="number" min="0" max="99" style={{ ...s.input, width: 90 }} value={cfg.margen_minimo_pct}
            onChange={e => setCfg({ ...cfg, margen_minimo_pct: e.target.value })} />
          <span style={s.label} title="Se suma a la necesidad proyectada para evitar quiebres">Factor de seguridad (%)</span>
          <input type="number" min="0" max="100" style={{ ...s.input, width: 90 }} value={cfg.factor_seguridad_pct}
            onChange={e => setCfg({ ...cfg, factor_seguridad_pct: e.target.value })} />
          <button style={s.btn} onClick={guardarCfg}>Guardar</button>
          {msg && <span style={{ color: msg.ok ? '#166534' : '#991B1B', fontSize: 13 }}>{msg.t}</span>}
        </div>
      </div>

      <div style={s.fila}>
        <span style={s.label}>Unidades vendidas en</span>
        <select style={s.select} value={dias} onChange={e => setDias(+e.target.value)}>
          {[7, 14, 28, 56, 90].map(n => <option key={n} value={n}>últimos {n} días</option>)}
        </select>
        <span style={{ flex: 1 }} />
        <BotonGuardar tipo="rentabilidad" parametros={{ dias }} />
      </div>

      <Cargando cargando={cargando && !d} error={error} />
      {d && (<>
        <AvisoSinPrecio lista={d.insumos_sin_precio} aprox={d.valorizaciones_aproximadas} />
        <div style={s.metricas}>
          <Metrica icono="✅" label="Rentables" valor={d.resumen.rentables} bg="#E8FAF1" fg="#059669" />
          <Metrica icono="📉" label="No rentables" valor={d.resumen.no_rentables} bg="#FEE2E2" fg="#991B1B" />
          <Metrica icono="🧮" label="Margen promedio" valor={d.resumen.margen_promedio_pct == null ? '—' : `${d.resumen.margen_promedio_pct}%`}
            bg="#EEF0FF" fg="#4338CA" sub={`mínimo ${d.umbral_margen_pct}%`} />
        </div>

        {alertas.length > 0 && (
          <Aviso tipo="err">
            <b>🔔 {alertas.length} plato(s) bajo el margen mínimo</b>
            {alertas.map(a => (
              <div key={a.id_producto} style={{ marginTop: 4 }}>
                <b>{a.nombre}</b>: margen {a.margen_pct}% · revisar precio (S/ {fmtN(a.costo_preparacion / (1 - d.umbral_margen_pct / 100), 2)} o más)
                {a.insumo_mayor_costo && <> o la receta (mayor costo: {a.insumo_mayor_costo.insumo})</>}
              </div>
            ))}
          </Aviso>
        )}

        <Tabla keyFn={r => r.id_producto} filas={d.platos}
          cols={[['Plato', r => <b>{r.nombre}</b>],
                 ['Precio venta', r => fmtS(r.precio_venta), 'right'],
                 ['Costo prep.', r => r.costo_preparacion == null ? '—' : <>{fmtS(r.costo_preparacion)}{r.costo_es_parcial && ' *'}</>, 'right'],
                 ['Margen', r => fmtS(r.margen), 'right'],
                 ['Margen %', r => r.margen_pct == null ? '—' : `${r.margen_pct}%`, 'right'],
                 ['Vendidos', r => r.unidades_vendidas, 'right'],
                 ['Utilidad', r => fmtS(r.utilidad_total), 'right'],
                 ['Estado', r => <Pill tono={r.estado}>{ETIQ[r.estado] || r.estado}</Pill>]]} />
        <p style={{ fontSize: 12, color: '#6B7280' }}>* Costo parcial: faltan precios de algún insumo de la receta.</p>
      </>)}
    </div>
  );
}

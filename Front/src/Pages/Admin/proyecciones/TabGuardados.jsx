import { useState } from 'react';
import Modal from '../../../components/Admin/Modal';
import { descargarGuardadoCsv, getGuardada, getGuardadas } from '../../../services/proyeccionesService';
import { Aviso, Cargando, Tabla } from './comunes';
import { descargarBlob, fmtFecha, fmtN, fmtS, msgError, s, useCarga } from './utilidades';

// Cómo mostrar el resultado guardado de cada tipo
const VISTAS = {
  demanda:      { filas: r => r.platos, cols: [['Plato', x => x.nombre], ['Estimado', x => fmtN(x.unidades_estimadas), 'right'], ['Ventas', x => fmtS(x.ventas_estimadas), 'right'], ['Rotación', x => x.rotacion || '—']], key: x => x.id_producto },
  consumo:      { filas: r => r.items, cols: [['Insumo', x => x.nombre], ['Necesidad', x => fmtN(x.necesidad_estimada, 2), 'right'], ['Comprar', x => fmtN(x.cantidad_a_comprar, 2), 'right'], ['Riesgo', x => x.riesgo_quiebre]], key: x => x.id_insumo },
  gasto:        { filas: r => r.items, cols: [['Insumo', x => x.nombre], ['A comprar', x => fmtN(x.cantidad_a_comprar, 2), 'right'], ['Gasto', x => fmtS(x.gasto_compra), 'right']], key: x => x.id_insumo },
  rentabilidad: { filas: r => r.platos, cols: [['Plato', x => x.nombre], ['Costo', x => fmtS(x.costo_preparacion), 'right'], ['Margen %', x => x.margen_pct == null ? '—' : `${x.margen_pct}%`, 'right'], ['Estado', x => x.estado]], key: x => x.id_producto },
  financiero:   { filas: r => r.periodos, cols: [['Período', x => fmtFecha(x.periodo)], ['Ingresos', x => fmtS(x.ingresos), 'right'], ['Compras', x => fmtS(x.gastos_compras), 'right'], ['Neto', x => fmtS(x.resultado_neto), 'right']], key: x => x.periodo },
  compras:      { filas: r => r.grupos.flatMap(g => g.items.map(i => ({ ...i, dist: g.distribuidora }))), cols: [['Distribuidora', x => x.dist], ['Insumo', x => x.nombre], ['Comprar', x => fmtN(x.cantidad_a_comprar, 2), 'right'], ['Costo', x => fmtS(x.costo_estimado), 'right']], key: x => `${x.dist}-${x.id_insumo}` },
};
const FILTROS = [['', 'Todos'], ['demanda', 'Demanda'], ['consumo', 'Consumo'], ['gasto', 'Gasto'],
                 ['rentabilidad', 'Rentabilidad'], ['financiero', 'Financiero'], ['compras', 'Plan de compras']];

export default function TabGuardados() {
  const [tipo, setTipo] = useState('');
  const { data, cargando, error } = useCarga(() => getGuardadas(tipo ? { tipo } : {}), [tipo]);
  const [ver, setVer] = useState(null);
  const [err, setErr] = useState('');

  const abrir = async (id) => {
    try { setVer((await getGuardada(id)).data); } catch (e) { setErr(msgError(e)); }
  };
  const csv = async (id) => {
    try { descargarBlob((await descargarGuardadoCsv(id)).data, `plan_compras_${id}.csv`); }
    catch (e) { setErr(msgError(e)); }
  };
  const vista = ver && VISTAS[ver.tipo];

  return (
    <div>
      <div style={s.fila}>
        <span style={s.label}>Tipo</span>
        <select style={s.select} value={tipo} onChange={e => setTipo(e.target.value)}>
          {FILTROS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      {err && <Aviso tipo="err">{err}</Aviso>}
      <Cargando cargando={cargando && !data} error={error} />
      {data && (
        <Tabla keyFn={g => g.id_proyeccion} filas={data} vacio="Aún no guardaste proyecciones ni reportes"
          cols={[['Fecha', g => new Date(g.fecha_creacion).toLocaleString('es-PE')],
                 ['Tipo', g => g.tipo_nombre], ['Título', g => <b>{g.titulo}</b>],
                 ['Parámetros', g => <code style={{ fontSize: 12 }}>{Object.entries(g.parametros).filter(([, v]) => v).map(([k, v]) => `${k}=${v}`).join(' · ') || '—'}</code>],
                 ['Usuario', g => g.usuario],
                 ['', g => <span style={{ display: 'inline-flex', gap: 6 }}>
                    <button style={s.btnSec} onClick={() => abrir(g.id_proyeccion)}>Ver</button>
                    {g.tipo === 'compras' && <button style={s.btnSec} onClick={() => csv(g.id_proyeccion)}>CSV</button>}
                  </span>]]} />
      )}
      {ver && (
        <Modal titulo={ver.titulo} onClose={() => setVer(null)} maxWidth={820}>
          <p style={{ fontSize: 12.5, color: '#6B7280', marginTop: 0 }}>
            {ver.tipo_nombre} · {new Date(ver.fecha_creacion).toLocaleString('es-PE')} · {ver.usuario}
          </p>
          {vista && <Tabla cols={vista.cols} filas={vista.filas(ver.resultado)} keyFn={vista.key} />}
        </Modal>
      )}
    </div>
  );
}

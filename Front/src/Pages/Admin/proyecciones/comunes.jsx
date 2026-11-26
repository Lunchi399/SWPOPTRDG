import { useState } from 'react';
import { guardarProyeccion } from '../../../services/proyeccionesService';
import { msgError, s } from './utilidades';

// ── Componentes pequeños ─────────────────────────────────────
const TONOS = {
  alto: ['#FEE2E2', '#991B1B'], medio: ['#FEF3C7', '#92400E'], bajo: ['#DCFCE7', '#166534'],
  alta: ['#DCFCE7', '#166534'], media: ['#EEF0FF', '#4338CA'], baja: ['#F3F4F6', '#6B7280'],
  rentable: ['#DCFCE7', '#166534'], no_rentable: ['#FEE2E2', '#991B1B'],
  costo_incompleto: ['#FEF3C7', '#92400E'], sin_receta: ['#F3F4F6', '#6B7280'],
  sin_precio_venta: ['#F3F4F6', '#6B7280'], real: ['#EAF1FF', '#1D4ED8'],
};
export const Pill = ({ tono, children }) => {
  const [bg, fg] = TONOS[tono] || ['#F3F4F6', '#374151'];
  return <span style={{ ...s.pill, background: bg, color: fg }}>{children}</span>;
};

export const Metrica = ({ icono, valor, label, bg = '#EAF1FF', fg = '#1D4ED8', sub }) => (
  <div style={{ ...s.metrica, background: bg }}>
    <span style={{ fontSize: 30 }}>{icono}</span>
    <div>
      <div style={{ fontSize: 24, fontWeight: 800, color: fg, lineHeight: 1.1 }}>{valor}</div>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: fg, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: fg, opacity: .8 }}>{sub}</div>}
    </div>
  </div>
);

export const Aviso = ({ tipo = 'warn', children }) => (
  <div style={{ ...s.aviso, ...(tipo === 'err' ? s.avisoErr : tipo === 'ok' ? s.avisoOk : {}) }}>{children}</div>
);

export const AvisoSinPrecio = ({ lista = [], aprox = 0 }) => (
  <>
    {lista.length > 0 && (
      <Aviso>⚠️ Sin precio de compra: <b>{lista.map(i => i.nombre).join(', ')}</b>. Los costos se
        subestiman hasta registrarlos en la pestaña <b>Precios</b>.</Aviso>
    )}
    {aprox > 0 && (
      <Aviso>ℹ️ {aprox} valorización(es) usan el primer precio registrado porque la compra es anterior a él.</Aviso>
    )}
  </>
);

export const Cargando = ({ cargando, error }) =>
  error ? <Aviso tipo="err">{error}</Aviso>
        : cargando ? <div style={s.vacio}>Calculando…</div> : null;

export const Tabla = ({ cols, filas, vacio = 'Sin datos', keyFn }) => (
  <div style={s.card}>
    <div style={{ overflowX: 'auto' }}>
      <table style={s.table}>
        <thead><tr>{cols.map(c => <th key={c[0]} style={{ ...s.th, textAlign: c[2] || 'left' }}>{c[0]}</th>)}</tr></thead>
        <tbody>
          {filas.length === 0 && <tr><td colSpan={cols.length} style={s.vacio}>{vacio}</td></tr>}
          {filas.map((f, i) => (
            <tr key={keyFn ? keyFn(f) : i}>
              {cols.map(c => <td key={c[0]} style={{ ...s.td, textAlign: c[2] || 'left' }}>{c[1](f)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ── RFN61: botón "Guardar en historial" ──────────────────────
export function BotonGuardar({ tipo, parametros, onGuardado }) {
  const [estado, setEstado] = useState('');
  const guardar = async () => {
    const titulo = window.prompt('Título para guardar (opcional):', '');
    if (titulo === null) return;
    setEstado('guardando');
    try {
      await guardarProyeccion({ tipo, parametros, titulo });
      setEstado('ok'); onGuardado?.();
    } catch (e) { setEstado(msgError(e, 'No se pudo guardar')); }
    setTimeout(() => setEstado(''), 3000);
  };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <button style={s.btnSec} onClick={guardar} disabled={estado === 'guardando'}>💾 Guardar en historial</button>
      {estado === 'ok' && <span style={{ color: '#166534', fontSize: 13 }}>✅ Guardado</span>}
      {estado && estado !== 'ok' && estado !== 'guardando' && <span style={{ color: '#991B1B', fontSize: 13 }}>{estado}</span>}
    </span>
  );
}

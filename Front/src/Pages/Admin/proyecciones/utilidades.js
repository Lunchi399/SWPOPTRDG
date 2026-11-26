import { useCallback, useEffect, useRef, useState } from 'react';

// ── Formato ──────────────────────────────────────────────────
export const fmtS = (n) => n == null ? '—'
  : 'S/ ' + Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const fmtN = (n, d = 1) => n == null ? '—'
  : Number(n).toLocaleString('es-PE', { maximumFractionDigits: d });
export const fmtFecha = (iso) => iso
  ? new Date(iso.length === 10 ? iso + 'T12:00:00' : iso)
      .toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }) : '—';
export const msgError = (e, def = 'Ocurrió un error') => e?.response?.data?.error || def;

export function descargarBlob(data, nombre) {
  const url = URL.createObjectURL(new Blob([data], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url; a.download = nombre; a.click();
  URL.revokeObjectURL(url);
}

// ── Hook de carga ────────────────────────────────────────────
// fn: () => promesa axios · deps: valores que, al cambiar, recargan.
// Al cambiar deps se conservan los datos anteriores hasta que llegan los nuevos.
export function useCarga(fn, deps) {
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const fnRef = useRef(fn);
  useEffect(() => { fnRef.current = fn; });
  const clave = JSON.stringify(deps);

  const pedir = useCallback(() => {
    fnRef.current()
      .then(r => { setData(r.data); setError(''); })
      .catch(e => setError(msgError(e, 'No se pudo cargar')))
      .finally(() => setCargando(false));
  }, []);
  useEffect(() => { pedir(); }, [pedir, clave]);

  const recargar = useCallback(() => { setCargando(true); pedir(); }, [pedir]);
  return { data, cargando, error, recargar };
}

// ── Estilos compartidos ──────────────────────────────────────
export const s = {
  fila:     { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' },
  metricas: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14, marginBottom: '1.25rem' },
  metrica:  { display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderRadius: 18 },
  card:     { background: '#fff', borderRadius: 18, border: '1px solid #E6E9F2', overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,.05)', marginBottom: '1.25rem' },
  cardPad:  { background: '#fff', borderRadius: 18, border: '1px solid #E6E9F2', padding: '18px 22px', marginBottom: '1.25rem' },
  h3:       { fontSize: 15, fontWeight: 800, color: '#0F1628', margin: '0 0 12px' },
  table:    { width: '100%', borderCollapse: 'collapse' },
  th:       { background: '#0F172A', color: '#fff', padding: '13px 16px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.03em', whiteSpace: 'nowrap' },
  td:       { padding: '12px 16px', fontSize: 13.5, color: '#374151', borderBottom: '1px solid #F0F2F7', verticalAlign: 'middle' },
  vacio:    { textAlign: 'center', color: '#9CA3AF', padding: '2rem', fontSize: 14 },
  pill:     { display: 'inline-block', fontSize: 11.5, fontWeight: 700, padding: '4px 11px', borderRadius: 20, whiteSpace: 'nowrap' },
  select:   { height: 40, padding: '0 12px', borderRadius: 10, border: '1px solid #E6E9F2', background: '#fff', fontSize: 13, color: '#374151' },
  input:    { height: 40, padding: '0 12px', borderRadius: 10, border: '1px solid #E6E9F2', background: '#fff', fontSize: 13, color: '#374151', boxSizing: 'border-box' },
  label:    { fontSize: 12, fontWeight: 600, color: '#6B7280' },
  btn:      { padding: '10px 18px', borderRadius: 10, background: '#2563EB', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 },
  btnSec:   { padding: '10px 16px', borderRadius: 10, background: '#fff', color: '#374151', border: '1px solid #D1D5DB', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  aviso:    { background: '#FFFBEB', color: '#92400E', border: '1px solid #FCD34D', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: '1rem' },
  avisoErr: { background: '#FEF2F2', color: '#991B1B', border: '1px solid #FCA5A5' },
  avisoOk:  { background: '#F0FDF4', color: '#166534', border: '1px solid #86EFAC' },
};

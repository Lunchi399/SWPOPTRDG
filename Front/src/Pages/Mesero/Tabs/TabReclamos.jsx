import { useEffect, useState } from 'react';
import { getMesas, getReclamos, crearReclamo } from '../../../services/meseroService';

// ── TOAST (Mismo estilo premium de Pedidos) ────────────────────────
function Toast({ mensaje, error }) {
  if (!mensaje && !error) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: error ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${error ? '#FECACA' : '#BBF7D0'}`, color: error ? '#991B1B' : '#065F46', borderRadius: 12, padding: '12px 18px', fontSize: 13, fontWeight: 600, marginBottom: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      {error
        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      }
      {mensaje || error}
    </div>
  );
}

// ── COMPONENTE PRINCIPAL ───────────────────────────────────────────
export default function TabReclamos() {
  const [mesas, setMesas] = useState([]);
  const [reclamos, setReclamos] = useState([]);
  const [form, setForm] = useState({
    tipo: 'reclamo', descripcion: '', id_pedidos: ''
  });
  const [mesaSel, setMesaSel] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  // 1. Declaramos la función primero
  const cargarReclamos = () => {
    getReclamos().then(r => setReclamos(r.data));
  };

  // 2. La llamamos en el useEffect
  useEffect(() => {
    getMesas().then(r => setMesas(r.data));
    cargarReclamos();
  }, []);

  const mostrar = (msg, err = false) => {
    err ? setError(msg) : setMensaje(msg);
    setTimeout(() => { setMensaje(''); setError(''); }, 3000);
  };

  const handleEnviar = async () => {
    if (!form.descripcion.trim()) {
      mostrar('La descripción es obligatoria', true); return;
    }
    try {
      await crearReclamo({
        tipo: form.tipo,
        descripcion: form.descripcion,
        id_pedidos: form.id_pedidos || null,
      });
      mostrar('Reclamo registrado correctamente');
      setForm({ tipo: 'reclamo', descripcion: '', id_pedidos: '' });
      setMesaSel('');
      cargarReclamos();
    } catch (e) {
      mostrar(e.response?.data?.error || 'Error al registrar', true);
    }
  };

  // ── DICCIONARIOS DE DISEÑO ───────────────────────────────────────
  const TIPO_COLOR = {
    reclamo:    { bg: '#FEF2F2', color: '#B91C1C', dot: '#EF4444' }, 
    sugerencia: { bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6' }, 
  };
  const ESTADO_COLOR = {
    pendiente:  { bg: '#FFFBEB', color: '#B45309', dot: '#F59E0B' }, 
    revisado:   { bg: '#F5F3FF', color: '#6D28D9', dot: '#8B5CF6' }, 
    resuelto:   { bg: '#ECFDF5', color: '#047857', dot: '#10B981' }, 
  };

  return (
    <div style={s.tabContent}>
      <Toast mensaje={mensaje} error={error} />

      {/* ── Formulario ── */}
      <div style={s.formCard}>
        <div style={s.formHeader}>
          <span style={s.formIcon}>📝</span>
          <h3 style={s.formTitulo}>Registrar reclamo o sugerencia</h3>
        </div>

        <div style={s.formRow}>
          <div style={s.inputGroup}>
            <label style={s.label}>Tipo</label>
            <select style={s.select} value={form.tipo}
              onChange={e => setForm({ ...form, tipo: e.target.value })}>
              <option value="reclamo">Reclamo</option>
              <option value="sugerencia">Sugerencia</option>
            </select>
          </div>
          <div style={s.inputGroup}>
            <label style={s.label}>Mesa (opcional)</label>
            <select style={s.select} value={mesaSel}
              onChange={e => setMesaSel(e.target.value)}>
              <option value="">Sin mesa específica</option>
              {mesas.map(m => (
                <option key={m.id_mesa} value={m.id_mesa}>
                  {m.identificador_mesa}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={s.inputGroup}>
          <label style={s.label}>Descripción <span style={{color: '#EF4444'}}>*</span></label>
          <textarea style={s.textarea}
            placeholder="Describe el reclamo o sugerencia del cliente..."
            value={form.descripcion}
            onChange={e => setForm({ ...form, descripcion: e.target.value })}
          />
        </div>

        <div style={s.formFooter}>
          <button style={s.btnEnviar} onClick={handleEnviar}>
            Registrar reporte
          </button>
        </div>
      </div>

      {/* ── Listado de reclamos del turno ── */}
      <div style={s.listHeader}>
        <h3 style={s.listTitulo}>Historial del turno</h3>
        <span style={s.badgeCount}>{reclamos.length} registros</span>
      </div>

      {reclamos.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}> inbox </div>
          No hay reclamos ni sugerencias registrados aún.
        </div>
      ) : (
        <div style={s.listaGrid}>
          {reclamos.map(r => {
            const tc = TIPO_COLOR[r.tipo] || TIPO_COLOR.reclamo;
            const ec = ESTADO_COLOR[r.estado] || ESTADO_COLOR.pendiente;
            
            return (
              <div key={r.id_reclamo} style={s.reclamoCard}>
                
                {/* Cabecera Tarjeta */}
                <div style={s.reclamoHeader}>
                  <div style={s.reclamoIdGroup}>
                    <span style={{ ...s.pill, background: tc.bg, color: tc.color }}>
                      {r.tipo.charAt(0).toUpperCase() + r.tipo.slice(1)}
                    </span>
                    <span style={s.reclamoIdText}>#{r.id_reclamo}</span>
                  </div>
                  <div style={s.reclamoEstadoGroup}>
                    <span style={s.reclamoDateText}>
                      {new Date(r.tiempo_creacion).toLocaleString('es-PE', {
                        day: '2-digit', month: '2-digit',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                {/* Contenido Tarjeta */}
                <div style={s.reclamoDescGroup}>
                  <p style={s.reclamoDescText}>"{r.descripcion}"</p>
                </div>

                {/* Footer Tarjeta */}
                <div style={s.reclamoCardFooter}>
                  <p style={s.reclamoMesaText}>
                    📍 Mesa: {mesas.find(m => m.id_mesa === r.id_mesa)?.identificador_mesa || 'General'}
                  </p>
                  <span style={{ ...s.pill, background: ec.bg, color: ec.color }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: ec.dot, display: 'inline-block', marginRight: 5 }} />
                    {r.estado.charAt(0).toUpperCase() + r.estado.slice(1)}
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── ESTILOS ────────────────────────────────────────────────────────
const s = {
  tabContent: { fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif", padding: '0 0 24px 0' },
  
  // Formulario
  formCard:   { background: '#fff', borderRadius: 16, padding: '24px', border: '1px solid #E2E8F0', marginBottom: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' },
  formHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: '20px' },
  formIcon:   { fontSize: 20 },
  formTitulo: { fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 },
  formRow:    { display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' },
  inputGroup: { flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: 6 },
  label:      { fontSize: 13, fontWeight: 700, color: '#475569', display: 'block' },
  select:     { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 14, background: '#F8FAFC', color: '#0F172A', outline: 'none', fontFamily: "inherit" },
  textarea:   { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 14, background: '#F8FAFC', color: '#0F172A', resize: 'vertical', minHeight: 100, marginBottom: 8, outline: 'none', fontFamily: "inherit", boxSizing: 'border-box' },
  formFooter: { display: 'flex', justifyContent: 'flex-end', marginTop: 8 },
  btnEnviar:  { padding: '10px 24px', borderRadius: 10, background: '#0F172A', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: "inherit", transition: 'background 0.2s' },
  
  // Encabezado de Lista
  listHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: '16px' },
  listTitulo: { fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 },
  badgeCount: { background: '#F1F5F9', color: '#475569', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 },
  
  // Estado Vacío (Empty State)
  empty:      { textAlign: 'center', color: '#64748B', padding: '48px 20px', background: '#F8FAFC', borderRadius: 16, border: '1px dashed #CBD5E1', fontSize: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
  emptyIcon:  { fontSize: 32, opacity: 0.8 },
  
  // Grid / Tarjetas
  listaGrid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 },
  reclamoCard:{ background: '#fff', borderRadius: 16, padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' },
  reclamoHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  reclamoIdGroup: { display: 'flex', gap: 8, alignItems: 'center' },
  reclamoIdText: { fontSize: 12, color: '#94A3B8', fontWeight: 600 },
  reclamoEstadoGroup: { display: 'flex', gap: 6, alignItems: 'center' },
  reclamoDateText: { fontSize: 12, color: '#64748B', fontWeight: 500 },
  pill:       { fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, display: 'inline-flex', alignItems: 'center' },
  
  // Contenido de la Tarjeta
  reclamoDescGroup: { flex: 1, marginBottom: 16, background: '#F8FAFC', padding: '12px 14px', borderRadius: 10, border: '1px solid #F1F5F9' },
  reclamoDescText: { fontSize: 14, color: '#334155', margin: 0, lineHeight: 1.6, fontStyle: 'italic' },
  
  // Footer de la Tarjeta
  reclamoCardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid #F1F5F9' },
  reclamoMesaText: { fontSize: 13, color: '#0F172A', fontWeight: 700, margin: 0 },
};
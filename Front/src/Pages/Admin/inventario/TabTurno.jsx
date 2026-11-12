import { useState } from 'react';
import { abrirTurno, cerrarTurno } from '../../../services/inventarioService';

export default function TabTurno({ turno, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState('');
  const [error,   setError]   = useState('');

  const mostrar = (m, err=false) => {
    err ? setError(m) : setMsg(m);
    setTimeout(() => { setMsg(''); setError(''); }, 3000);
  };

  const handleAbrir = async () => {
    setLoading(true);
    try {
      await abrirTurno();
      mostrar('✅ Turno abierto correctamente');
      onRefresh();
    } catch (e) {
      mostrar(e.response?.data?.error || 'Error al abrir turno', true);
    } finally { setLoading(false); }
  };

  const handleCerrar = async () => {
    if (!window.confirm('¿Cerrar el turno del día? Esta acción consolidará todos los registros.')) return;
    setLoading(true);
    try {
      await cerrarTurno(turno.id_turno);
      mostrar('Turno cerrado correctamente');
      onRefresh();
    } catch (e) {
      mostrar(e.response?.data?.error || 'Error al cerrar turno', true);
    } finally { setLoading(false); }
  };

  const turnoAbierto = turno?.estado === 'abierto';

  return (
    <div style={{ maxWidth:500 }}>
      {msg   && <div style={s.toast}>{msg}</div>}
      {error && <div style={s.toastErr}>{error}</div>}

      <div style={s.card}>
        <div style={s.cardHeader}>
          <div style={{ fontSize:40 }}>
            {turnoAbierto ? '🟢' : '⚫'}
          </div>
          <div>
            <div style={s.cardTitle}>
              {turnoAbierto ? 'Turno activo' : 'Sin turno activo'}
            </div>
            <div style={s.cardSub}>
              {turnoAbierto
                ? `Abierto a las ${new Date(turno.hora_inicio)
                    .toLocaleTimeString('es-PE', {
                      hour:'2-digit', minute:'2-digit'
                    })}`
                : 'El turno de hoy aún no ha comenzado'}
            </div>
          </div>
        </div>

        {turnoAbierto && (
          <div style={s.infoGrid}>
            <div style={s.infoItem}>
              <span style={s.infoLabel}>Fecha</span>
              <span style={s.infoVal}>{turno.fecha}</span>
            </div>
            <div style={s.infoItem}>
              <span style={s.infoLabel}>Estado</span>
              <span style={{ ...s.infoVal, color:'#059669',
                              fontWeight:700 }}>
                ABIERTO
              </span>
            </div>
          </div>
        )}

        <div style={s.btnRow}>
          {!turnoAbierto && (
            <button style={s.btnAbrir}
              onClick={handleAbrir} disabled={loading}>
              {loading ? 'Abriendo...' : '▶ Marcar inicio del día'}
            </button>
          )}
          {turnoAbierto && (
            <button style={s.btnCerrar}
              onClick={handleCerrar} disabled={loading}>
              {loading ? 'Cerrando...' : '⏹ Marcar fin del día'}
            </button>
          )}
        </div>

        <div style={s.nota}>
          <strong>Inicio del día:</strong> habilita las operaciones de
          inventario y reinicia los contadores del turno.<br/>
          <strong>Fin del día:</strong> consolida todos los registros de
          insumos, movimientos y mermas del turno.
        </div>
      </div>
    </div>
  );
}

const s = {
  toast:     { background:'#ECFDF5', color:'#059669', padding:'10px 14px',
               borderRadius:'8px', marginBottom:12, fontSize:13 },
  toastErr:  { background:'#FEF2F2', color:'#DC2626', padding:'10px 14px',
               borderRadius:'8px', marginBottom:12, fontSize:13 },
  card:      { background:'#fff', borderRadius:'16px',
               padding:'1.5rem', border:'1px solid #E8EAF0' },
  cardHeader:{ display:'flex', alignItems:'center', gap:16,
               marginBottom:'1.25rem' },
  cardTitle: { fontSize:18, fontWeight:700, color:'#0F1628' },
  cardSub:   { fontSize:13, color:'#6B7280', marginTop:4 },
  infoGrid:  { display:'grid', gridTemplateColumns:'1fr 1fr',
               gap:10, marginBottom:'1.25rem' },
  infoItem:  { background:'#F9FAFB', borderRadius:'8px',
               padding:'10px 14px' },
  infoLabel: { fontSize:11, color:'#9CA3AF', display:'block',
               marginBottom:3 },
  infoVal:   { fontSize:15, fontWeight:600, color:'#0F1628' },
  btnRow:    { marginBottom:'1rem' },
  btnAbrir:  { width:'100%', padding:'13px', borderRadius:'10px',
               background:'#059669', color:'#fff', border:'none',
               cursor:'pointer', fontSize:15, fontWeight:600 },
  btnCerrar: { width:'100%', padding:'13px', borderRadius:'10px',
               background:'#DC2626', color:'#fff', border:'none',
               cursor:'pointer', fontSize:15, fontWeight:600 },
  nota:      { fontSize:12, color:'#9CA3AF', lineHeight:1.6,
               background:'#F9FAFB', borderRadius:'8px',
               padding:'10px 14px' },
};
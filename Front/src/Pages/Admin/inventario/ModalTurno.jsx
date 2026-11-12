import { useEffect, useState } from 'react';
import { abrirTurno, cerrarTurno,
         getDashboardInsumos } from '../../../services/inventarioService';
import { getUsuario } from '../../../services/authService';

export default function ModalTurno({ tipo, turno, onClose, onListo }) {
  const abrir = tipo === 'abrir';
  const [resumen,  setResumen]  = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [error,    setError]    = useState('');

  const ahora   = new Date();
  const usuario = getUsuario();
  const quien   = `${usuario?.Nombre || ''} ${usuario?.Apellido || ''}`.trim() || '—';
  const hora    = (d) => new Date(d).toLocaleTimeString('es-PE', { hour:'2-digit', minute:'2-digit' });

  useEffect(() => {
    if (!abrir) {
      getDashboardInsumos().then(r => setResumen(r.data)).catch(() => setResumen(null));
    }
  }, [abrir]);

  const duracion = () => {
    if (!turno?.hora_inicio) return '—';
    const min = Math.floor((ahora - new Date(turno.hora_inicio)) / 60000);
    return `${Math.floor(min / 60)} h ${min % 60} min`;
  };

  const confirmar = async () => {
    setEnviando(true);
    setError('');
    try {
      if (abrir) await abrirTurno();
      else       await cerrarTurno(turno.id_turno);
      onListo(abrir ? 'Día iniciado correctamente' : 'Día cerrado correctamente');
    } catch (e) {
      setError(e.response?.data?.error || 'No se pudo completar la acción');
      setEnviando(false);
    }
  };

  const filas = abrir
    ? [
        ['Fecha',          ahora.toLocaleDateString('es-PE', { weekday:'long', day:'numeric', month:'long', year:'numeric' })],
        ['Hora de inicio', hora(ahora)],
        ['Responsable',    quien],
      ]
    : [
        ['Fecha',        ahora.toLocaleDateString('es-PE', { weekday:'long', day:'numeric', month:'long', year:'numeric' })],
        ['Abierto desde', turno?.hora_inicio ? hora(turno.hora_inicio) : '—'],
        ['Duración',     duracion()],
        ['Responsable',  quien],
      ];

  const color = abrir ? '#059669' : '#DC2626';

  return (
    <div style={s.overlay} onClick={() => !enviando && onClose()}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <div style={s.head}>
          <div style={{ ...s.icono, background:color + '18', color }}>
            {abrir ? '▶' : '⏹'}
          </div>
          <div>
            <h3 style={s.titulo}>{abrir ? 'Iniciar el día' : 'Cerrar el día'}</h3>
            <p style={s.sub}>
              {abrir ? 'Confirma para abrir el turno de hoy'
                     : 'Revisa el resumen antes de cerrar el turno'}
            </p>
          </div>
        </div>

        <div style={s.body}>
          <div style={s.detalles}>
            {filas.map(([k, v]) => (
              <div key={k} style={s.fila}>
                <span style={s.k}>{k}</span>
                <span style={s.v}>{v}</span>
              </div>
            ))}
          </div>

          {abrir && (
            <ul style={s.lista}>
              <li>Se registra la apertura con la fecha, la hora y tu usuario.</li>
              <li>Los contadores del dashboard (ingresado, utilizado, desperdiciado) empiezan desde cero para hoy.</li>
              <li>Se habilitan las operaciones de inventario del turno.</li>
            </ul>
          )}

          {!abrir && (
            <>
              {resumen ? (
                <div style={s.grid}>
                  {[
                    ['Ingresado',     resumen.total_ingresado],
                    ['Movido a uso',  resumen.total_movido],
                    ['Utilizado',     resumen.total_utilizado],
                    ['Desperdiciado', resumen.total_desperdiciado],
                    ['Alertas stock', resumen.total_alertas],
                    ['Mermas',        resumen.mermas_hoy?.length ?? 0],
                  ].map(([k, v]) => (
                    <div key={k} style={s.cel}>
                      <div style={s.celV}>{v}</div>
                      <div style={s.celK}>{k}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={s.cargando}>Cargando resumen del turno…</div>
              )}

              {resumen?.total_alertas > 0 && (
                <div style={s.aviso}>
                  ⚠️ Hay {resumen.total_alertas} insumo{resumen.total_alertas > 1 ? 's' : ''} en
                  alerta de stock. Considera registrar una compra antes de cerrar.
                </div>
              )}

              <ul style={s.lista}>
                <li>Se guarda la hora de cierre y se consolidan los registros del turno.</li>
                <li>El historial queda disponible en <strong>Historial global</strong>.</li>
              </ul>
            </>
          )}

          {error && <div style={s.error}>{error}</div>}
        </div>

        <div style={s.footer}>
          <button style={s.btnSec} disabled={enviando} onClick={onClose}>Cancelar</button>
          <button style={{ ...s.btnOk, background:color, opacity: enviando ? 0.7 : 1 }}
            disabled={enviando} onClick={confirmar}>
            {enviando ? 'Procesando…' : abrir ? 'Confirmar inicio' : 'Confirmar cierre'}
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay: { position:'fixed', inset:0, background:'rgba(15,22,40,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300, padding:'1rem', backdropFilter:'blur(2px)' },
  modal:   { background:'#fff', borderRadius:18, width:'100%', maxWidth:460, maxHeight:'92vh', overflowY:'auto', boxShadow:'0 24px 60px rgba(0,0,0,0.22)' },
  head:    { display:'flex', alignItems:'center', gap:14, padding:'1.25rem 1.5rem', borderBottom:'1px solid #F3F4F6' },
  icono:   { width:44, height:44, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 },
  titulo:  { fontSize:17, fontWeight:800, color:'#0F1628', margin:0 },
  sub:     { fontSize:12, color:'#6B7280', margin:'2px 0 0' },
  body:    { padding:'1.25rem 1.5rem' },
  detalles:{ background:'#F9FAFB', borderRadius:12, padding:'6px 14px', marginBottom:14 },
  fila:    { display:'flex', justifyContent:'space-between', gap:12, padding:'9px 0', borderBottom:'1px solid #F0F1F5' },
  k:       { fontSize:12, color:'#6B7280' },
  v:       { fontSize:13, fontWeight:600, color:'#0F1628', textAlign:'right', textTransform:'capitalize' },
  lista:   { margin:'0 0 4px', paddingLeft:18, fontSize:12.5, color:'#4B5563', lineHeight:1.7 },
  grid:    { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:12 },
  cel:     { background:'#F9FAFB', borderRadius:10, padding:'10px 6px', textAlign:'center' },
  celV:    { fontSize:20, fontWeight:800, color:'#0F1628' },
  celK:    { fontSize:10.5, color:'#6B7280', marginTop:2, textTransform:'uppercase', letterSpacing:'.04em' },
  cargando:{ textAlign:'center', color:'#9CA3AF', fontSize:13, padding:'1rem' },
  aviso:   { background:'#FEF3C7', color:'#92400E', borderRadius:10, padding:'10px 12px', fontSize:12.5, marginBottom:12 },
  error:   { background:'#FEF2F2', color:'#DC2626', borderRadius:10, padding:'10px 12px', fontSize:12.5, marginTop:10 },
  footer:  { display:'flex', justifyContent:'flex-end', gap:8, padding:'1rem 1.5rem', borderTop:'1px solid #F3F4F6' },
  btnSec:  { padding:'10px 18px', borderRadius:10, background:'#F3F4F6', color:'#6B7280', border:'none', cursor:'pointer', fontSize:13, fontWeight:600 },
  btnOk:   { padding:'10px 20px', borderRadius:10, color:'#fff', border:'none', cursor:'pointer', fontSize:13, fontWeight:700 },
};
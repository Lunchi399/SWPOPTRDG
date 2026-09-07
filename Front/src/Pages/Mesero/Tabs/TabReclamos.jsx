import { useEffect, useState } from 'react';
import { getMesas, getReclamos,
         crearReclamo } from '../../../Services/meseroService';

export default function TabReclamos() {
  const [mesas,     setMesas]    = useState([]);
  const [reclamos,  setReclamos] = useState([]);
  const [form,      setForm]     = useState({
    tipo:'reclamo', descripcion:'', id_pedidos: ''
  });
  const [mesaSel,  setMesaSel]  = useState('');
  const [mensaje,  setMensaje]  = useState('');
  const [error,    setError]    = useState('');

  useEffect(() => {
    getMesas().then(r => setMesas(r.data));
    cargarReclamos();
  }, []);

  const cargarReclamos = () =>
    getReclamos().then(r => setReclamos(r.data));

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
        tipo:        form.tipo,
        descripcion: form.descripcion,
        id_pedidos:   form.id_pedidos || null,
      });
      mostrar('Reclamo registrado correctamente');
      setForm({ tipo:'reclamo', descripcion:'', id_pedidos:'' });
      setMesaSel('');
      cargarReclamos();
    } catch (e) {
      mostrar(e.response?.data?.error || 'Error al registrar', true);
    }
  };

  const TIPO_COLOR = {
    reclamo:    { bg:'#FAECE7', color:'#712B13' },
    sugerencia: { bg:'#E6F1FB', color:'#0C447C' },
  };
  const ESTADO_COLOR = {
    pendiente: { bg:'#FAEEDA', color:'#633806' },
    revisado:  { bg:'#E6F1FB', color:'#0C447C' },
    resuelto:  { bg:'#E1F5EE', color:'#085041' },
  };

  return (
    <div style={{ maxWidth:700 }}>
      {mensaje && <div style={s.toast}>{mensaje}</div>}
      {error   && <div style={s.toastErr}>{error}</div>}

      {/* Formulario */}
      <div style={s.formCard}>
        <h3 style={s.formTitulo}>Registrar reclamo o sugerencia</h3>

        <div style={s.formRow}>
          <div style={{ flex:1 }}>
            <label style={s.label}>Tipo</label>
            <select style={s.select} value={form.tipo}
              onChange={e => setForm({ ...form, tipo: e.target.value })}>
              <option value="reclamo">Reclamo</option>
              <option value="sugerencia">Sugerencia</option>
            </select>
          </div>
          <div style={{ flex:2 }}>
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

        <label style={s.label}>Descripción *</label>
        <textarea style={s.textarea}
          placeholder="Describe el reclamo o sugerencia del cliente..."
          value={form.descripcion}
          onChange={e => setForm({ ...form, descripcion: e.target.value })}
        />

        <button style={s.btnEnviar} onClick={handleEnviar}>
          Registrar
        </button>
      </div>

      {/* Listado de reclamos del turno */}
      <h3 style={{ fontSize:15, fontWeight:700, color:'#1E2D40',
                   margin:'1.5rem 0 1rem' }}>
        Reclamos registrados
      </h3>

      {reclamos.length === 0 ? (
        <div style={s.empty}>No hay reclamos registrados aún.</div>
      ) : (
        <div style={s.lista}>
          {reclamos.map(r => {
            const tc = TIPO_COLOR[r.tipo]    || TIPO_COLOR.reclamo;
            const ec = ESTADO_COLOR[r.estado] || ESTADO_COLOR.pendiente;
            return (
              <div key={r.id_reclamo} style={s.reclamoCard}>
                <div style={s.reclamoHeader}>
                  <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                    <span style={{ ...s.pill,
                                    background:tc.bg, color:tc.color }}>
                      {r.tipo}
                    </span>
                    <span style={{ fontSize:11, color:'#aaa' }}>
                      #{r.id_reclamo}
                    </span>
                  </div>
                  <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                    <span style={{ ...s.pill,
                                    background:ec.bg, color:ec.color }}>
                      {r.estado}
                    </span>
                    <span style={{ fontSize:11, color:'#aaa' }}>
                      {new Date(r.tiempo_creacion).toLocaleString('es-PE', {
                        day:'2-digit', month:'2-digit',
                        hour:'2-digit', minute:'2-digit'
                      })}
                    </span>
                  </div>
                </div>
                <p style={{ fontSize:13, color:'#333',
                             margin:'8px 0 0', lineHeight:1.5 }}>
                  {r.descripcion}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const s = {
  toast:      { background:'#E1F5EE', color:'#085041', padding:'10px 14px',
                borderRadius:8, marginBottom:12, fontSize:13 },
  toastErr:   { background:'#FAECE7', color:'#993C1D', padding:'10px 14px',
                borderRadius:8, marginBottom:12, fontSize:13 },
  formCard:   { background:'#fff', borderRadius:10, padding:'1.25rem',
                border:'1px solid #E8E6DF', marginBottom:'1.5rem' },
  formTitulo: { fontSize:15, fontWeight:700, color:'#1E2D40', margin:'0 0 1rem' },
  formRow:    { display:'flex', gap:10, marginBottom:10 },
  label:      { fontSize:12, fontWeight:600, color:'#555',
                display:'block', marginBottom:4 },
  select:     { width:'100%', padding:'8px 12px', borderRadius:8,
                border:'1px solid #ddd', fontSize:13 },
  textarea:   { width:'100%', padding:'8px 12px', borderRadius:8,
                border:'1px solid #ddd', fontSize:13, resize:'vertical',
                minHeight:80, marginBottom:12, marginTop:4 },
  btnEnviar:  { padding:'9px 20px', borderRadius:8, background:'#2E5F8A',
                color:'#fff', border:'none', cursor:'pointer',
                fontSize:13, fontWeight:600 },
  empty:      { textAlign:'center', color:'#888', padding:'2rem',
                background:'#fff', borderRadius:10, fontSize:14 },
  lista:      { display:'flex', flexDirection:'column', gap:8 },
  reclamoCard:{ background:'#fff', borderRadius:10, padding:'1rem 1.25rem',
                border:'1px solid #E8E6DF' },
  reclamoHeader:{ display:'flex', justifyContent:'space-between',
                  alignItems:'center' },
  pill:       { fontSize:11, fontWeight:500, padding:'3px 10px',
                borderRadius:20 },
};
import { useState } from 'react';
import { crearReclamoCaja } from '../../../services/cajaService';

export default function TabReclamos() {
  const [form,    setForm]    = useState({
    tipo:'reclamo', descripcion:''
  });
  const [mensaje, setMensaje] = useState('');
  const [error,   setError]   = useState('');

  const mostrar = (msg, err = false) => {
    err ? setError(msg) : setMensaje(msg);
    setTimeout(() => { setMensaje(''); setError(''); }, 3000);
  };

  const handleEnviar = async () => {
    if (!form.descripcion.trim()) {
      mostrar('La descripción es obligatoria', true); return;
    }
    try {
      await crearReclamoCaja(form);
      mostrar('Reclamo registrado correctamente');
      setForm({ tipo:'reclamo', descripcion:'' });
    } catch (e) {
      mostrar(e.response?.data?.error || 'Error al registrar', true);
    }
  };

  return (
    <div style={{ maxWidth:500 }}>
      {mensaje && <div style={s.toast}>{mensaje}</div>}
      {error   && <div style={s.toastErr}>{error}</div>}

      <div style={s.card}>
        <h3 style={s.titulo}>Registrar reclamo o sugerencia</h3>
        <p style={s.desc}>
          Registra aquí cualquier reclamo o sugerencia que el cliente
          haga durante el proceso de pago.
        </p>

        <label style={s.label}>Tipo</label>
        <div style={s.tipoRow}>
          {[
            { v:'reclamo',    l:'🚨 Reclamo'    },
            { v:'sugerencia', l:'💡 Sugerencia'  },
          ].map(t => (
            <button key={t.v} style={{
              ...s.tipoBtn,
              background: form.tipo === t.v ? '#FAECE7' : '#F8F7F2',
              borderColor: form.tipo === t.v ? '#993C1D' : '#ddd',
              color:       form.tipo === t.v ? '#712B13' : '#555',
            }} onClick={() => setForm({ ...form, tipo: t.v })}>
              {t.l}
            </button>
          ))}
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
    </div>
  );
}

const s = {
  toast:    { background:'#E1F5EE', color:'#085041', padding:'10px 14px',
              borderRadius:8, marginBottom:12, fontSize:13 },
  toastErr: { background:'#FAECE7', color:'#993C1D', padding:'10px 14px',
              borderRadius:8, marginBottom:12, fontSize:13 },
  card:     { background:'#fff', borderRadius:12, padding:'1.5rem',
              border:'1px solid #E8E6DF' },
  titulo:   { fontSize:16, fontWeight:700, color:'#1E2D40',
              margin:'0 0 6px' },
  desc:     { fontSize:13, color:'#888', marginBottom:'1.25rem',
              lineHeight:1.5 },
  label:    { fontSize:12, fontWeight:600, color:'#555',
              display:'block', marginBottom:6 },
  tipoRow:  { display:'flex', gap:8, marginBottom:'1rem' },
  tipoBtn:  { flex:1, padding:'10px', borderRadius:8,
              border:'1.5px solid', cursor:'pointer',
              fontSize:13, fontWeight:500, transition:'all .15s' },
  textarea: { width:'100%', padding:'10px 12px', borderRadius:8,
              border:'1px solid #ddd', fontSize:13,
              resize:'vertical', minHeight:100,
              marginBottom:'1rem', marginTop:4 },
  btnEnviar:{ width:'100%', padding:'11px', borderRadius:8,
              background:'#2E5F8A', color:'#fff', border:'none',
              cursor:'pointer', fontSize:14, fontWeight:600 },
};
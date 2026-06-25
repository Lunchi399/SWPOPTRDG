import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginService } from '../services/authService';

const RUTAS_POR_ROL = {
  administrador: '/admin/dashboard',
  mesero:        '/mesero/mesas',
  cocinero:      '/cocina/pedidos',
  cajero:        '/caja/cobros',
};

export default function Login() {
  const [form,    setForm]    = useState({ username: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await loginService(form.username, form.password);

      // Normalizar rol a minúscula para evitar problemas de capitalización
      const rolRaw  = data.usuario?.Rol || data.usuario?.rol || '';
      const rol     = rolRaw.toLowerCase().trim();

      console.log('Rol recibido del servidor:', rolRaw);
      console.log('Rol normalizado:', rol);

      const ruta = RUTAS_POR_ROL[rol];

      if (ruta) {
        navigate(ruta);
      } else {
        setError(`Rol no reconocido: "${rolRaw}". Contacta al administrador.`);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.container}>
      <div style={s.card}>
        <h1 style={s.title}>Don George</h1>
        <p style={s.subtitle}>Sistema de Gestión</p>

        <form onSubmit={handleSubmit} style={s.form}>
          <input style={s.input} type="text" placeholder="Usuario"
            value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
            required
          />
          <input style={s.input} type="password" placeholder="Contraseña"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            required
          />
          {error && <p style={s.error}>{error}</p>}
          <button style={s.button} type="submit" disabled={loading}>
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}

const s = {
  container: { minHeight:'100vh', display:'flex', alignItems:'center',
               justifyContent:'center', background:'#1E2D40' },
  card:      { background:'#fff', borderRadius:12, padding:'2.5rem 2rem',
               width:'100%', maxWidth:380,
               boxShadow:'0 8px 32px rgba(0,0,0,0.2)' },
  title:     { textAlign:'center', fontSize:28, fontWeight:700,
               color:'#1E2D40', margin:0 },
  subtitle:  { textAlign:'center', color:'#888',
               marginBottom:28, fontSize:14 },
  form:      { display:'flex', flexDirection:'column', gap:12 },
  input:     { padding:'10px 14px', borderRadius:8,
               border:'1px solid #ddd', fontSize:14, outline:'none' },
  button:    { padding:'12px', borderRadius:8, background:'#2E5F8A',
               color:'#fff', border:'none', fontSize:15,
               fontWeight:600, cursor:'pointer', marginTop:4 },
  error:     { color:'#993C1D', fontSize:13, margin:0 },
};
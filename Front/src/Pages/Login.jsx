import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginService } from '../services/authService';

export default function Login() {
  const [form, setForm]   = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const RUTAS_POR_ROL = {
  administrador: '/admin/dashboard',
  mesero:        '/mesero/mesas',
  cocinero:      '/cocina/pedidos',
  cajero:        '/caja/cobros',
};

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  try {
    const data = await loginService(form.username, form.password);

    // Rol puede venir como 'Rol' o 'rol' según el serializer
    const rol = data.usuario.Rol || data.usuario.rol;
    const ruta = RUTAS_POR_ROL[rol];

    if (ruta) {
      navigate(ruta);
    } else {
      setError(`Rol no reconocido: ${rol}`);
    }
  } catch (err) {
    setError(err.response?.data?.error || 'Error al iniciar sesión');
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Don George</h1>
        <p style={styles.subtitle}>Sistema de Gestión</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            style={styles.input}
            type="text"
            placeholder="Usuario"
            value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            required
          />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight:'100vh', display:'flex', alignItems:'center',
               justifyContent:'center', background:'#1E2D40' },
  card:      { background:'#fff', borderRadius:12, padding:'2.5rem 2rem',
               width:'100%', maxWidth:380, boxShadow:'0 8px 32px rgba(0,0,0,0.2)' },
  title:     { textAlign:'center', fontSize:28, fontWeight:700,
               color:'#1E2D40', margin:0 },
  subtitle:  { textAlign:'center', color:'#888', marginBottom:28, fontSize:14 },
  form:      { display:'flex', flexDirection:'column', gap:12 },
  input:     { padding:'10px 14px', borderRadius:8, border:'1px solid #ddd',
               fontSize:14, outline:'none' },
  button:    { padding:'12px', borderRadius:8, background:'#2E5F8A',
               color:'#fff', border:'none', fontSize:15,
               fontWeight:600, cursor:'pointer', marginTop:4 },
  error:     { color:'#993C1D', fontSize:13, margin:0 },
};
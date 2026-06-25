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
  const [form, setForm]         = useState({ username: '', password: '' });
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPwd, setShowPwd]   = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await loginService(form.username, form.password);

      const rolRaw  = data.usuario?.Rol || data.usuario?.rol || '';
      const rol     = rolRaw.toLowerCase().trim();

      const ruta = RUTAS_POR_ROL[rol];

      if (ruta) {
        navigate(ruta);
      } else {
        setError(`Rol no reconocido: "${rolRaw}". Contacta al administrador.`);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Usuario o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.layout}>
      
      {/* ── PANEL IZQUIERDO (Imagen del Restaurante) ── */}
      <div style={s.leftPanel}>
        {/* La imagen está directamente en los estilos (background) y quitamos el texto para que se vea limpio */}
      </div>

      {/* ── PANEL DERECHO (Formulario) ── */}
      <div style={s.rightPanel}>
        <div style={s.card}>
          
          {/* Logo y Cabecera */}
          <div style={s.logoWrapper}>
            <span style={s.logoText}>DG</span>
          </div>
          <h1 style={s.title}>Don George</h1>
          <p style={s.subtitle}>Accede a tu panel de gestión</p>

          {/* Formulario */}
          <form onSubmit={handleSubmit} style={s.form}>
            
            <div style={s.inputGroup}>
              <label style={s.label}>Usuario</label>
              <input 
                style={s.input} 
                type="text" 
                placeholder="Ej. admin123"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div style={s.inputGroup}>
              <label style={s.label}>Contraseña</label>
              <div style={s.passwordWrapper}>
                <input 
                  style={{...s.input, paddingRight: '45px', width: '100%', boxSizing: 'border-box'}} 
                  type={showPwd ? "text" : "password"} 
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  disabled={loading}
                />
                <button 
                  type="button" 
                  style={s.eyeButton} 
                  onClick={() => setShowPwd(!showPwd)}
                  tabIndex="-1"
                >
                  {showPwd ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>
            </div>

            <div style={s.errorWrapper}>
              {error && (
                <div style={s.errorBox}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  <span>{error}</span>
                </div>
              )}
            </div>

            <button style={{ ...s.button, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
              {loading ? 'Verificando...' : 'Ingresar al sistema'}
            </button>
            
          </form>
        </div>
      </div>
    </div>
  );
}

// ── ESTILOS ────────────────────────────────────────────────────────
const s = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: "'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif",
    backgroundColor: '#0F172A',
  },
  leftPanel: {
    flex: 1.2, 
    /* Aquí está la magia: Usamos una imagen real de un restaurante de alta calidad */
    backgroundImage: 'url("https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    borderRight: '1px solid rgba(255,255,255,0.1)',
  },
  rightPanel: {
    flex: 1, 
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    background: '#0F172A', 
  },
  card: {
    background: '#ffffff',
    borderRadius: 24,
    padding: '48px 40px',
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  logoWrapper: {
    width: 64,
    height: 64,
    background: '#F1F5F9',
    borderRadius: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 800,
    color: '#0F172A',
    letterSpacing: '-1px',
  },
  title: {
    fontSize: 28,
    fontWeight: 800,
    color: '#0F172A',
    margin: '0 0 8px 0',
    letterSpacing: '-0.5px',
    textAlign: 'center',
  },
  subtitle: {
    color: '#64748B',
    fontSize: 15,
    margin: '0 0 32px 0',
    textAlign: 'center',
    fontWeight: 500,
  },
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: 700,
    color: '#334155',
  },
  input: {
    padding: '14px 16px',
    borderRadius: 12,
    border: '1px solid #E2E8F0',
    background: '#F8FAFC',
    fontSize: 15,
    color: '#0F172A',
    outline: 'none',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  passwordWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  eyeButton: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94A3B8',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s',
  },
  errorWrapper: {
    minHeight: '40px', // Evita que el formulario salte cuando aparece el error
    display: 'flex',
    alignItems: 'center',
  },
  errorBox: {
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: 12,
    padding: '10px 16px',
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    boxSizing: 'border-box',
  },
  button: {
    padding: '14px',
    borderRadius: 12,
    background: '#0F172A',
    color: '#fff',
    border: 'none',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 4,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  }
};
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginService } from '../Services/authService';

const RUTAS_POR_ROL = {
  administrador: '/admin/dashboard',
  mesero:        '/mesero/mesas',
  cocinero:      '/cocina/pedidos',
  cajero:        '/caja/cobros',
};

const FEATURES = [
  { icon:'🍽️', label:'Gestión de carta y pedidos en tiempo real', bg:'rgba(99,102,241,0.2)'  },
  { icon:'👨‍🍳', label:'Control de cocina con KDS integrado',      bg:'rgba(239,68,68,0.2)'   },
  { icon:'💳', label:'Caja y reportes automáticos',               bg:'rgba(16,185,129,0.2)'  },
  { icon:'📊', label:'Dashboard con estadísticas del día',        bg:'rgba(245,158,11,0.2)'  },
];

const ROLES = [
  { label:'Administrador', color:'#818CF8' },
  { label:'Mesero',        color:'#FCD34D' },
  { label:'Cocinero',      color:'#FCA5A5' },
  { label:'Cajero',        color:'#6EE7B7' },
];

export default function Login() {
  const [form,     setForm]     = useState({ username:'', password:'' });
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await loginService(form.username, form.password);
      const rol  = (data.usuario?.Rol || data.usuario?.rol || '')
                     .toLowerCase().trim();
      const ruta = RUTAS_POR_ROL[rol];
      if (ruta) navigate(ruta);
      else setError(`Rol no reconocido: "${rol}"`);
    } catch (err) {
      setError(err.response?.data?.error || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>

        {/* ── Panel izquierdo ── */}
        <div style={s.left}>
          <div style={s.logo}>DG</div>
          <div>
            <div style={s.brandName}>Don George</div>
            <div style={s.brandSub}>Sistema de gestión</div>
          </div>
          <div style={s.featList}>
            {FEATURES.map((f, i) => (
              <div key={i} style={s.feat}>
                <div style={{ ...s.featIcon, background:f.bg }}>
                  {f.icon}
                </div>
                <div style={s.featLabel}>{f.label}</div>
              </div>
            ))}
          </div>
          <div style={s.roles}>
            <div style={s.rolesLabel}>Roles del sistema</div>
            <div style={s.rolesGrid}>
              {ROLES.map((r, i) => (
                <div key={i} style={s.rolePill}>
                  <div style={{ ...s.roleDot, background:r.color }} />
                  <span style={s.roleName}>{r.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Panel derecho ── */}
        <div style={s.right}>
          <div>
            <h1 style={s.formTitle}>Bienvenido de vuelta</h1>
            <p style={s.formSub}>Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit} style={s.form}>
            <div style={s.field}>
              <label style={s.label}>Usuario</label>
              <div style={s.inputWrap}>
                <span style={s.inputIcon}>👤</span>
                <input style={s.input}
                  type="text"
                  placeholder="Tu nombre de usuario"
                  value={form.username}
                  onChange={e => setForm({ ...form, username:e.target.value })}
                  required autoFocus
                />
              </div>
            </div>

            <div style={s.field}>
              <label style={s.label}>Contraseña</label>
              <div style={s.inputWrap}>
                <span style={s.inputIcon}>🔒</span>
                <input style={{ ...s.input, paddingRight:36 }}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password:e.target.value })}
                  required
                />
                <button type="button" style={s.eyeBtn}
                  onClick={() => setShowPass(!showPass)}
                  aria-label="Mostrar contraseña">
                  {showPass ? '*' : '👁️'}
                </button>
              </div>
            </div>

            {error && (
              <div style={s.errorBox}>
                ⚠️ {error}
              </div>
            )}

            <button type="submit" style={{
              ...s.submitBtn,
              opacity: loading ? 0.75 : 1,
              cursor:  loading ? 'not-allowed' : 'pointer',
            }} disabled={loading}>
              {loading ? '⏳ Verificando...' : 'Iniciar sesión'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const s = {
  page:      { minHeight:'100vh', display:'flex', alignItems:'center',
               justifyContent:'center', background:'#0B0F1A',
               fontFamily:'"Inter",Arial,sans-serif', padding:'1rem' },
  card:      { display:'flex', width:'100%', maxWidth:680,
               borderRadius:16, overflow:'hidden',
               boxShadow:'0 24px 64px rgba(0,0,0,0.4)',
               minHeight:520 },

  // Panel izquierdo
  left:      { width:240, background:'#0F1628', padding:'2rem 1.5rem',
               display:'flex', flexDirection:'column', gap:'1.25rem',
               flexShrink:0 },
  logo:      { width:44, height:44, borderRadius:10, background:'#6366F1',
               display:'flex', alignItems:'center', justifyContent:'center',
               color:'#fff', fontWeight:800, fontSize:16 },
  brandName: { color:'#fff', fontWeight:700, fontSize:18,
               letterSpacing:'-0.02em' },
  brandSub:  { color:'rgba(255,255,255,0.35)', fontSize:12, marginTop:2 },
  featList:  { display:'flex', flexDirection:'column', gap:12 },
  feat:      { display:'flex', alignItems:'flex-start', gap:10 },
  featIcon:  { width:28, height:28, borderRadius:7, display:'flex',
               alignItems:'center', justifyContent:'center',
               fontSize:14, flexShrink:0 },
  featLabel: { fontSize:12, color:'rgba(255,255,255,0.55)', lineHeight:1.4 },
  roles:     { marginTop:'auto' },
  rolesLabel:{ fontSize:9, fontWeight:600, color:'rgba(255,255,255,0.25)',
               letterSpacing:'.1em', textTransform:'uppercase',
               marginBottom:8 },
  rolesGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 },
  rolePill:  { background:'rgba(255,255,255,0.06)', borderRadius:7,
               padding:'6px 8px', display:'flex', alignItems:'center', gap:6 },
  roleDot:   { width:6, height:6, borderRadius:'50%', flexShrink:0 },
  roleName:  { fontSize:10, color:'rgba(255,255,255,0.5)', fontWeight:500 },

  // Panel derecho
  right:     { flex:1, background:'#F5F6FA', padding:'2rem',
               display:'flex', flexDirection:'column',
               justifyContent:'center', gap:'1.25rem' },
  formTitle: { fontSize:20, fontWeight:700, color:'#0F1628',
               letterSpacing:'-0.02em', margin:0 },
  formSub:   { fontSize:13, color:'#6B7280', marginTop:4 },
  form:      { display:'flex', flexDirection:'column', gap:14 },
  field:     { display:'flex', flexDirection:'column', gap:5 },
  label:     { fontSize:12, fontWeight:600, color:'#374151' },
  inputWrap: { position:'relative', display:'flex', alignItems:'center' },
  inputIcon: { position:'absolute', left:10, fontSize:15, zIndex:1,
               color:'#9CA3AF', pointerEvents:'none' },
  input:     { width:'100%', padding:'10px 10px 10px 34px',
               borderRadius:8, border:'1px solid #E8EAF0',
               background:'#fff', fontSize:13, color:'#0F1628',
               outline:'none', fontFamily:'inherit',
               transition:'border-color .15s, box-shadow .15s' },
  eyeBtn:    { position:'absolute', right:8, background:'none',
               border:'none', cursor:'pointer', fontSize:14,
               color:'#9CA3AF', padding:'2px' },
  errorBox:  { background:'#FEF2F2', border:'1px solid #FCA5A5',
               borderRadius:8, padding:'9px 12px',
               fontSize:12, color:'#DC2626' },
  submitBtn: { padding:12, borderRadius:8, background:'#6366F1',
               color:'#fff', border:'none', fontSize:14,
               fontWeight:600, fontFamily:'inherit',
               letterSpacing:'-0.01em',
               transition:'opacity .15s' },
};
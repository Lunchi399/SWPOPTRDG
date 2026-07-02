import { useEffect, useState } from 'react';
import Layout from '../../components/admin/Layout';
import { getUsuarios, crearUsuario,
         editarUsuario, eliminarUsuario } from '../../services/adminService';

const ROL_INFO = {
  administrador:{ bg:'#EEF2FF', color:'#4338CA', icon:'👑' },
  mesero:       { bg:'#FFFBEB', color:'#B45309', icon:'🍽️' },
  cocinero:     { bg:'#FEF2F2', color:'#B91C1C', icon:'👨‍🍳' },
  cajero:       { bg:'#ECFDF5', color:'#065F46', icon:'💰' },
};

const FORM_VACIO = {
  username:'', Nombre:'', Apellido:'',
  email:'', Rol:'mesero', password:'', Activo:true
};

export default function Usuarios() {
  const [lista,   setLista]   = useState([]);
  const [modal,   setModal]   = useState(null);
  const [sel,     setSel]     = useState(null);
  const [form,    setForm]    = useState(FORM_VACIO);
  const [buscar,  setBuscar]  = useState('');
  const [filtroRol, setFiltroRol] = useState('todos');
  const [mensaje, setMensaje] = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(true);

  const cargar = () => {
    setLoading(true);
    getUsuarios()
      .then(r => setLista(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const mostrar = (msg, err = false) => {
    err ? setError(msg) : setMensaje(msg);
    setTimeout(() => { setMensaje(''); setError(''); }, 3000);
  };

  const handleCrear = async () => {
    try {
      await crearUsuario(form);
      mostrar('Usuario creado correctamente');
      setModal(null); cargar();
    } catch (e) {
      mostrar(JSON.stringify(e.response?.data), true);
    }
  };

  const handleEditar = async () => {
    try {
      const data = { ...form };
      if (!data.password) delete data.password;
      await editarUsuario(sel.id, data);
      mostrar('Usuario actualizado');
      setModal(null); cargar();
    } catch (e) {
      mostrar(JSON.stringify(e.response?.data), true);
    }
  };

  const handleEliminar = async () => {
    try {
      await eliminarUsuario(sel.id);
      mostrar('Usuario eliminado');
      setModal(null); cargar();
    } catch (e) {
      mostrar(e.response?.data?.error || 'Error', true);
    }
  };

  const listaFiltrada = lista.filter(u => {
    const coincideBusqueda =
      u.username?.toLowerCase().includes(buscar.toLowerCase()) ||
      u.Nombre?.toLowerCase().includes(buscar.toLowerCase()) ||
      u.Apellido?.toLowerCase().includes(buscar.toLowerCase());
    const coincideRol = filtroRol === 'todos' || u.Rol === filtroRol;
    return coincideBusqueda && coincideRol;
  });

  const contPorRol = (rol) => lista.filter(u => u.Rol === rol).length;

  return (
    <Layout>
      <div style={s.page}>

        {/* Header */}
        <div style={s.pageHeader}>
          <div>
            <h1 style={s.titulo}>Usuarios</h1>
            <p style={s.subtitulo}>
              {lista.length} usuarios registrados en el sistema
            </p>
          </div>
          <button style={s.btnPrimario}
            onClick={() => { setForm(FORM_VACIO); setModal('crear'); }}>
            + Nuevo usuario
          </button>
        </div>

        {mensaje && <div style={s.toast}>{mensaje}</div>}
        {error   && <div style={s.toastErr}>{error}</div>}

        {/* Resumen por rol */}
        <div style={s.rolGrid}>
          {Object.entries(ROL_INFO).map(([rol, info]) => (
            <div key={rol} style={{ ...s.rolCard,
                                     background:info.bg,
                                     borderColor:info.color+'25',
                                     cursor:'pointer',
                                     outline: filtroRol === rol
                                       ? `2px solid ${info.color}` : 'none',
                                   }}
              onClick={() => setFiltroRol(
                filtroRol === rol ? 'todos' : rol
              )}>
              <span style={{ fontSize:22 }}>{info.icon}</span>
              <div style={{ fontSize:22, fontWeight:800,
                             color:info.color }}>
                {contPorRol(rol)}
              </div>
              <div style={{ fontSize:11, color:info.color,
                             fontWeight:500, textTransform:'capitalize' }}>
                {rol}s
              </div>
            </div>
          ))}
        </div>

        {/* Buscador */}
        <div style={s.searchWrap}>
          <span style={s.searchIcon}>🔍</span>
          <input style={s.searchInput}
            placeholder="Buscar por nombre o usuario..."
            value={buscar}
            onChange={e => setBuscar(e.target.value)}
          />
          {buscar && (
            <button style={s.clearBtn}
              onClick={() => setBuscar('')}>✕</button>
          )}
        </div>

        {/* Tabla */}
        {loading ? (
          <div style={s.empty}>Cargando usuarios...</div>
        ) : listaFiltrada.length === 0 ? (
          <div style={s.empty}>No se encontraron usuarios.</div>
        ) : (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['Usuario','Nombre completo','Email',
                    'Rol','Estado','Acciones'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {listaFiltrada.map((u, i) => {
                  const ri = ROL_INFO[u.Rol] || ROL_INFO.mesero;
                  return (
                    <tr key={u.id}
                      style={{ background: i%2===0 ? '#fff' : '#FAFAFA' }}>
                      <td style={s.td}>
                        <div style={s.userCell}>
                          <div style={{ ...s.avatar,
                                         background:ri.bg,
                                         color:ri.color }}>
                            {u.Nombre?.[0]}{u.Apellido?.[0]}
                          </div>
                          <span style={{ fontWeight:600,
                                          color:'#0F1628' }}>
                            {u.username}
                          </span>
                        </div>
                      </td>
                      <td style={s.td}>
                        {u.Nombre} {u.Apellido}
                      </td>
                      <td style={{ ...s.td, color:'#6B7280' }}>
                        {u.email || '—'}
                      </td>
                      <td style={s.td}>
                        <span style={{ ...s.pill,
                                        background:ri.bg,
                                        color:ri.color }}>
                          {ri.icon} {u.Rol}
                        </span>
                      </td>
                      <td style={s.td}>
                        <span style={{
                          ...s.pill,
                          background: u.Activo ? '#ECFDF5' : '#F3F4F6',
                          color:      u.Activo ? '#059669' : '#9CA3AF',
                        }}>
                          {u.Activo ? '● Activo' : '○ Inactivo'}
                        </span>
                      </td>
                      <td style={s.td}>
                        <div style={s.acciones}>
                          <button style={s.btnEditar}
                            onClick={() => {
                              setSel(u);
                              setForm({
                                username: u.username,
                                Nombre:   u.Nombre,
                                Apellido: u.Apellido,
                                email:    u.email,
                                Rol:      u.Rol,
                                Activo:   u.Activo,
                                password: ''
                              });
                              setModal('editar');
                            }}>
                            Editar
                          </button>
                          <button style={s.btnEliminar}
                            onClick={() => {
                              setSel(u); setModal('eliminar');
                            }}>
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal crear/editar */}
        {(modal === 'crear' || modal === 'editar') && (
          <div style={s.overlay}>
            <div style={s.modal}>
              <div style={s.modalHeader}>
                <h3 style={s.modalTitulo}>
                  {modal === 'crear' ? '+ Nuevo usuario' : 'Editar usuario'}
                </h3>
                <button style={s.closeBtn}
                  onClick={() => setModal(null)}>✕</button>
              </div>
              <div style={s.modalBody}>
                <div style={s.formGrid}>
                  {[
                    { label:'Usuario *',   key:'username',  type:'text'     },
                    { label:'Contraseña',  key:'password',  type:'password' },
                    { label:'Nombre',      key:'Nombre',    type:'text'     },
                    { label:'Apellido',    key:'Apellido',  type:'text'     },
                    { label:'Email',       key:'email',     type:'email'    },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={s.label}>{f.label}</label>
                      <input style={s.input} type={f.type}
                        value={form[f.key] || ''}
                        placeholder={
                          modal === 'editar' && f.key === 'password'
                            ? 'Dejar vacío para no cambiar' : ''
                        }
                        onChange={e => setForm({
                          ...form, [f.key]: e.target.value
                        })}
                      />
                    </div>
                  ))}
                  <div>
                    <label style={s.label}>Rol *</label>
                    <select style={s.input} value={form.Rol}
                      onChange={e => setForm({
                        ...form, Rol: e.target.value
                      })}>
                      <option value="administrador">👑 Administrador</option>
                      <option value="mesero">🍽️ Mesero/a</option>
                      <option value="cocinero">👨‍🍳 Cocinero/a</option>
                      <option value="cajero">💰 Cajero/a</option>
                    </select>
                  </div>
                  {modal === 'editar' && (
                    <div>
                      <label style={s.label}>Estado</label>
                      <select style={s.input}
                        value={form.Activo}
                        onChange={e => setForm({
                          ...form,
                          Activo: e.target.value === 'true'
                        })}>
                        <option value="true">● Activo</option>
                        <option value="false">○ Inactivo</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
              <div style={s.modalFooter}>
                <button style={s.btnSecundario}
                  onClick={() => setModal(null)}>
                  Cancelar
                </button>
                <button style={s.btnPrimario}
                  onClick={modal === 'crear'
                    ? handleCrear : handleEditar}>
                  {modal === 'crear' ? 'Crear usuario' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal eliminar */}
        {modal === 'eliminar' && (
          <div style={s.overlay}>
            <div style={{ ...s.modal, maxWidth:400 }}>
              <div style={s.modalHeader}>
                <h3 style={s.modalTitulo}>Eliminar usuario</h3>
                <button style={s.closeBtn}
                  onClick={() => setModal(null)}>✕</button>
              </div>
              <div style={s.modalBody}>
                <div style={s.deleteWarn}>
                  <div style={{ fontSize:40 }}>⚠️</div>
                  <p style={{ fontSize:14, color:'#374151',
                               textAlign:'center', lineHeight:1.6 }}>
                    ¿Eliminar al usuario{' '}
                    <strong>{sel?.username}</strong>?
                    Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>
              <div style={s.modalFooter}>
                <button style={s.btnSecundario}
                  onClick={() => setModal(null)}>
                  Cancelar
                </button>
                <button style={{ ...s.btnPrimario,
                                  background:'#DC2626' }}
                  onClick={handleEliminar}>
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

const s = {
  page:       { maxWidth:1100 },
  pageHeader: { display:'flex', justifyContent:'space-between',
                alignItems:'flex-start', marginBottom:'1.25rem' },
  titulo:     { fontSize:22, fontWeight:800, color:'#0F1628',
                margin:0, letterSpacing:'-0.02em' },
  subtitulo:  { fontSize:13, color:'#6B7280', marginTop:4 },
  toast:      { background:'#ECFDF5', color:'#059669', padding:'10px 14px',
                borderRadius:'8px', marginBottom:12, fontSize:13 },
  toastErr:   { background:'#FEF2F2', color:'#DC2626', padding:'10px 14px',
                borderRadius:'8px', marginBottom:12, fontSize:13 },
  rolGrid:    { display:'grid',
                gridTemplateColumns:'repeat(4,minmax(0,1fr))',
                gap:10, marginBottom:'1.25rem' },
  rolCard:    { borderRadius:'12px', padding:'16px 12px',
                textAlign:'center', border:'1px solid',
                display:'flex', flexDirection:'column',
                alignItems:'center', gap:4,
                transition:'all .15s' },
  searchWrap: { display:'flex', alignItems:'center', gap:8,
                background:'#fff', borderRadius:'10px',
                border:'1px solid #E8EAF0', padding:'0 12px',
                marginBottom:'1rem',
                boxShadow:'0 1px 3px rgba(0,0,0,0.04)' },
  searchIcon: { fontSize:14, color:'#9CA3AF' },
  searchInput:{ flex:1, border:'none', outline:'none', padding:'10px 4px',
                fontSize:13, background:'transparent', color:'#0F1628' },
  clearBtn:   { background:'none', border:'none', cursor:'pointer',
                color:'#9CA3AF', fontSize:12, padding:'4px' },
  tableWrap:  { background:'#fff', borderRadius:'12px',
                overflow:'hidden', border:'1px solid #E8EAF0',
                boxShadow:'0 1px 3px rgba(0,0,0,0.04)' },
  table:      { width:'100%', borderCollapse:'collapse' },
  th:         { background:'#F9FAFB', color:'#6B7280', padding:'10px 14px',
                fontSize:11, fontWeight:600, textAlign:'left',
                textTransform:'uppercase', letterSpacing:'.06em',
                borderBottom:'1px solid #E8EAF0' },
  td:         { padding:'12px 14px', fontSize:13,
                borderBottom:'1px solid #F3F4F6', color:'#374151' },
  userCell:   { display:'flex', alignItems:'center', gap:8 },
  avatar:     { width:32, height:32, borderRadius:'50%',
                display:'flex', alignItems:'center',
                justifyContent:'center', fontWeight:700,
                fontSize:12, flexShrink:0 },
  pill:       { fontSize:11, fontWeight:500, padding:'3px 10px',
                borderRadius:'20px', display:'inline-block' },
  acciones:   { display:'flex', gap:6 },
  btnEditar:  { padding:'5px 12px', borderRadius:'6px',
                background:'#EEF2FF', color:'#4338CA',
                border:'none', cursor:'pointer', fontSize:12,
                fontWeight:500 },
  btnEliminar:{ padding:'5px 12px', borderRadius:'6px',
                background:'#FEF2F2', color:'#DC2626',
                border:'none', cursor:'pointer', fontSize:12,
                fontWeight:500 },
  empty:      { textAlign:'center', color:'#9CA3AF', padding:'3rem',
                background:'#fff', borderRadius:'12px',
                fontSize:14, border:'1px solid #E8EAF0' },
  overlay:    { position:'fixed', inset:0,
                background:'rgba(15,22,40,0.5)',
                display:'flex', alignItems:'center',
                justifyContent:'center', zIndex:200, padding:'1rem',
                backdropFilter:'blur(2px)' },
  modal:      { background:'#fff', borderRadius:'16px',
                width:'100%', maxWidth:560,
                maxHeight:'90vh', overflowY:'auto',
                boxShadow:'0 20px 60px rgba(0,0,0,0.15)' },
  modalHeader:{ display:'flex', justifyContent:'space-between',
                alignItems:'center', padding:'1.25rem 1.5rem',
                borderBottom:'1px solid #F3F4F6',
                position:'sticky', top:0,
                background:'#fff', zIndex:1 },
  modalTitulo:{ fontSize:16, fontWeight:700, color:'#0F1628', margin:0 },
  closeBtn:   { background:'#F3F4F6', border:'none', borderRadius:'50%',
                width:28, height:28, cursor:'pointer',
                color:'#6B7280', fontSize:14,
                display:'flex', alignItems:'center',
                justifyContent:'center' },
  modalBody:  { padding:'1.25rem 1.5rem' },
  formGrid:   { display:'grid', gridTemplateColumns:'1fr 1fr',
                gap:14 },
  label:      { fontSize:12, fontWeight:600, color:'#374151',
                display:'block', marginBottom:5 },
  input:      { width:'100%', padding:'9px 12px', borderRadius:'8px',
                border:'1px solid #E8EAF0', fontSize:13,
                color:'#0F1628', outline:'none',
                transition:'border-color .15s' },
  modalFooter:{ display:'flex', gap:8, justifyContent:'flex-end',
                padding:'1rem 1.5rem',
                borderTop:'1px solid #F3F4F6',
                position:'sticky', bottom:0, background:'#fff' },
  btnPrimario:{ padding:'9px 20px', borderRadius:'8px',
                background:'#6366F1', color:'#fff', border:'none',
                cursor:'pointer', fontSize:13, fontWeight:600 },
  btnSecundario:{ padding:'9px 20px', borderRadius:'8px',
                  background:'#F3F4F6', color:'#6B7280',
                  border:'none', cursor:'pointer', fontSize:13 },
  deleteWarn: { display:'flex', flexDirection:'column',
                alignItems:'center', gap:12, padding:'1rem 0' },
};
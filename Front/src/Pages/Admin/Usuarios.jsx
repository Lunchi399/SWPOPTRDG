import { useEffect, useState } from 'react';
import Layout from '../../components/admin/Layout';
import Modal  from '../../components/admin/Modal';
import { getUsuarios, crearUsuario,
         editarUsuario, eliminarUsuario } from '../../services/adminService';

// ── CONFIG ROLES ───────────────────────────────────────────────────
const ROL_CONFIG = {
  administrador: { bg: '#EDE9FE', color: '#5B21B6', label: 'Administrador' },
  mesero:        { bg: '#FEF3C7', color: '#92400E', label: 'Mesero'        },
  cocinero:      { bg: '#DBEAFE', color: '#1D4ED8', label: 'Cocinero'      },
  cajero:        { bg: '#D1FAE5', color: '#065F46', label: 'Cajero'        },
};

const ROLES = [
  { v: 'administrador', l: 'Administrador' },
  { v: 'mesero',        l: 'Mesero/a'      },
  { v: 'cocinero',      l: 'Cocinero/a'    },
  { v: 'cajero',        l: 'Cajero/a'      },
];

const FORM_VACIO = { username: '', first_name: '', last_name: '', email: '', rol: 'mesero', password: '', activo: true };

// ── TOAST ──────────────────────────────────────────────────────────
function Toast({ mensaje, error }) {
  if (!mensaje && !error) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: error ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${error ? '#FECACA' : '#BBF7D0'}`, color: error ? '#991B1B' : '#065F46', borderRadius: 10, padding: '12px 16px', fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
      {error
        ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      }
      {mensaje || error}
    </div>
  );
}

// ── FORM USUARIO ───────────────────────────────────────────────────
function FormUsuario({ form, setForm, esEditar }) {
  const campo = (label, key, type = 'text', placeholder = '') => (
    <div style={fs.campo}>
      <label style={fs.label}>{label}</label>
      <input style={fs.input} type={type} placeholder={placeholder}
        value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
    </div>
  );

  return (
    <div style={fs.grid}>
      {campo('Usuario *',    'username',   'text',     'ej. carlos_r')}
      {campo('Email',        'email',      'email',    'ej. carlos@dongeorge.pe')}
      {campo('Nombre',       'first_name', 'text',     'ej. Carlos')}
      {campo('Apellido',     'last_name',  'text',     'ej. Ríos')}
      <div style={fs.campo}>
        <label style={fs.label}>Rol *</label>
        <select style={fs.input} value={form.rol}
          onChange={e => setForm({ ...form, rol: e.target.value })}>
          {ROLES.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
      </div>
      <div style={fs.campo}>
        <label style={fs.label}>{esEditar ? 'Nueva contraseña (opcional)' : 'Contraseña *'}</label>
        <input style={fs.input} type="password"
          placeholder={esEditar ? 'Dejar vacío para no cambiar' : '••••••••'}
          value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
      </div>
      {esEditar && (
        <div style={{ ...fs.campo, gridColumn: '1 / -1' }}>
          <label style={fs.label}>Estado</label>
          <div style={{ display: 'flex', gap: 10 }}>
            {[{ v: true, l: 'Activo' }, { v: false, l: 'Inactivo' }].map(opt => (
              <button key={String(opt.v)} type="button"
                style={{ ...fs.estadoBtn, background: form.activo === opt.v ? (opt.v ? '#D1FAE5' : '#FEE2E2') : '#F8FAFC', color: form.activo === opt.v ? (opt.v ? '#065F46' : '#991B1B') : '#94A3B8', borderColor: form.activo === opt.v ? (opt.v ? '#6EE7B7' : '#FCA5A5') : '#E2E8F0', fontWeight: form.activo === opt.v ? 700 : 500 }}
                onClick={() => setForm({ ...form, activo: opt.v })}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: form.activo === opt.v ? (opt.v ? '#10B981' : '#EF4444') : '#CBD5E1', display: 'inline-block', marginRight: 7 }} />
                {opt.l}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── COMPONENTE PRINCIPAL ───────────────────────────────────────────
export default function Usuarios() {
  const [lista, setLista]      = useState([]);
  const [modal, setModal]      = useState(null);
  const [seleccionado, setSel] = useState(null);
  const [form, setForm]        = useState(FORM_VACIO);
  const [mensaje, setMensaje]  = useState('');
  const [error, setError]      = useState('');
  const [busqueda, setBusqueda]= useState('');
  const [filtroRol, setFiltroRol] = useState('todos');

  const cargar = () => getUsuarios().then(r => setLista(r.data));
  useEffect(() => { cargar(); }, []);

  const mostrar = (msg, esError = false) => {
    esError ? setError(msg) : setMensaje(msg);
    setTimeout(() => { setMensaje(''); setError(''); }, 3000);
  };

  const abrirCrear = () => { setForm(FORM_VACIO); setModal('crear'); };
  const abrirEditar = (u) => {
    setSel(u);
    setForm({ username: u.username, first_name: u.first_name, last_name: u.last_name, email: u.email, rol: u.rol, activo: u.activo, password: '' });
    setModal('editar');
  };
  const abrirEliminar = (u) => { setSel(u); setModal('eliminar'); };

  const handleCrear = async () => {
    try { await crearUsuario(form); mostrar('Usuario creado correctamente'); setModal(null); cargar(); }
    catch (e) { mostrar(JSON.stringify(e.response?.data), true); }
  };

  const handleEditar = async () => {
    try {
      const data = { ...form };
      if (!data.password) delete data.password;
      await editarUsuario(seleccionado.id, data);
      mostrar('Usuario actualizado'); setModal(null); cargar();
    } catch (e) { mostrar(JSON.stringify(e.response?.data), true); }
  };

  const handleEliminar = async () => {
    try { await eliminarUsuario(seleccionado.id); mostrar('Usuario eliminado'); setModal(null); cargar(); }
    catch (e) { mostrar(e.response?.data?.error, true); }
  };

  // Contadores por rol
  const contadores = Object.keys(ROL_CONFIG).reduce((acc, r) => {
    acc[r] = lista.filter(u => u.rol === r).length;
    return acc;
  }, {});

  // Filtrado
  const listaFiltrada = lista.filter(u => {
    const matchRol = filtroRol === 'todos' || u.rol === filtroRol;
    const q = busqueda.toLowerCase();
    const matchQ = !q || u.username?.toLowerCase().includes(q)
      || u.first_name?.toLowerCase().includes(q)
      || u.last_name?.toLowerCase().includes(q)
      || u.email?.toLowerCase().includes(q);
    return matchRol && matchQ;
  });

  return (
    <Layout>
      <div style={s.page}>

        {/* HEADER */}
        <div style={s.pageHeader}>
          <div>
            <h1 style={s.titulo}>Gestión de Usuarios</h1>
            <p style={s.subtitulo}>{lista.length} usuarios registrados en el sistema</p>
          </div>
          <button style={s.btnPrimario} onClick={abrirCrear}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nuevo usuario
          </button>
        </div>

        <Toast mensaje={mensaje} error={error} />

        {/* CHIPS ROL */}
        <div style={s.chipsRow}>
          {[{ key: 'todos', label: 'Todos', count: lista.length },
            ...Object.entries(ROL_CONFIG).map(([k, v]) => ({ key: k, label: v.label, count: contadores[k] || 0 }))
          ].map(chip => (
            <button key={chip.key} style={{ ...s.chip, ...(filtroRol === chip.key ? s.chipActive : {}) }} onClick={() => setFiltroRol(chip.key)}>
              {chip.label}
              <span style={{ ...s.chipCount, ...(filtroRol === chip.key ? s.chipCountActive : {}) }}>{chip.count}</span>
            </button>
          ))}
        </div>

        {/* TABLA CARD */}
        <div style={s.tableCard}>
          {/* Top bar */}
          <div style={s.tableTopBar}>
            <div style={s.searchWrap}>
              <svg style={s.searchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input style={s.searchInput} placeholder="Buscar por nombre, usuario o email..."
                value={busqueda} onChange={e => setBusqueda(e.target.value)} />
            </div>
            <span style={s.resultCount}>{listaFiltrada.length} resultado{listaFiltrada.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Tabla */}
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr style={s.thead}>
                  {['Usuario', 'Nombre completo', 'Email', 'Rol', 'Estado', 'Acciones'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {listaFiltrada.length === 0
                  ? <tr><td colSpan={6} style={s.empty}>No se encontraron usuarios</td></tr>
                  : listaFiltrada.map((u, i) => {
                    const rc = ROL_CONFIG[u.rol] || ROL_CONFIG.mesero;
                    return (
                      <tr key={u.id} style={{ background: i % 2 === 0 ? '#fff' : '#F8FAFC' }}>
                        <td style={s.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={s.avatar}>{u.username?.[0]?.toUpperCase() ?? 'U'}</div>
                            <span style={s.usernameText}>@{u.username}</span>
                          </div>
                        </td>
                        <td style={s.td}>{u.first_name} {u.last_name}</td>
                        <td style={{ ...s.td, color: '#64748B' }}>{u.email || '—'}</td>
                        <td style={s.td}>
                          <span style={{ ...s.pill, background: rc.bg, color: rc.color }}>{rc.label}</span>
                        </td>
                        <td style={s.td}>
                          <span style={{ ...s.pill, background: u.activo ? '#D1FAE5' : '#FEE2E2', color: u.activo ? '#065F46' : '#991B1B', display: 'flex', alignItems: 'center', gap: 5, width: 'fit-content' }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: u.activo ? '#10B981' : '#EF4444' }} />
                            {u.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td style={s.td}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button style={s.btnEdit} onClick={() => abrirEditar(u)}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                              Editar
                            </button>
                            <button style={s.btnDel} onClick={() => abrirEliminar(u)}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                              </svg>
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
        </div>
      </div>

      {/* ── MODAL CREAR / EDITAR ── */}
      {(modal === 'crear' || modal === 'editar') && (
        <Modal titulo={modal === 'crear' ? '👤 Nuevo usuario' : '✏️ Editar usuario'} onClose={() => setModal(null)} maxWidth={560}>
          <FormUsuario form={form} setForm={setForm} esEditar={modal === 'editar'} />
          <div style={fs.footer}>
            <button style={s.btnSecundario} onClick={() => setModal(null)}>Cancelar</button>
            <button style={s.btnPrimario} onClick={modal === 'crear' ? handleCrear : handleEditar}>
              {modal === 'crear' ? 'Crear usuario' : 'Guardar cambios'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── MODAL ELIMINAR ── */}
      {modal === 'eliminar' && (
        <Modal titulo="Eliminar usuario" onClose={() => setModal(null)}>
          <div style={{ padding: '8px 0 20px' }}>
            <div style={s.deleteWarning}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <p style={{ color: '#7F1D1D', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                ¿Estás seguro de eliminar al usuario <strong>@{seleccionado?.username}</strong>? Esta acción no se puede deshacer.
              </p>
            </div>
          </div>
          <div style={fs.footer}>
            <button style={s.btnSecundario} onClick={() => setModal(null)}>Cancelar</button>
            <button style={{ ...s.btnPrimario, background: '#DC2626', boxShadow: '0 4px 14px rgba(220,38,38,0.3)' }} onClick={handleEliminar}>
              Sí, eliminar
            </button>
          </div>
        </Modal>
      )}
    </Layout>
  );
}

// ── ESTILOS ────────────────────────────────────────────────────────
const s = {
  page:       { padding: '28px 32px', maxWidth: 1200, margin: '0 auto', fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif" },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  titulo:     { fontSize: 26, fontWeight: 800, color: '#0F1E2E', margin: 0, letterSpacing: -0.5 },
  subtitulo:  { color: '#64748B', fontSize: 13, marginTop: 4 },
  btnPrimario:{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 10, background: 'linear-gradient(135deg,#2563EB,#3B82F6)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, boxShadow: '0 4px 14px rgba(37,99,235,0.35)', fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif" },
  btnSecundario:{ padding: '10px 18px', borderRadius: 10, background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif" },
  chipsRow:   { display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  chip:       { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20, background: '#fff', border: '1px solid #E2E8F0', color: '#64748B', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif" },
  chipActive: { background: '#EFF6FF', borderColor: '#BFDBFE', color: '#1D4ED8' },
  chipCount:       { background: '#F1F5F9', color: '#94A3B8', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 700 },
  chipCountActive: { background: '#DBEAFE', color: '#1D4ED8' },
  tableCard:  { background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.07)', overflow: 'hidden' },
  tableTopBar:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #F1F5F9' },
  searchWrap: { position: 'relative', flex: 1, maxWidth: 360 },
  searchIcon: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' },
  searchInput:{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: 9, border: '1px solid #E2E8F0', fontSize: 13, outline: 'none', color: '#334155', fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif", background: '#F8FAFC' },
  resultCount:{ color: '#94A3B8', fontSize: 12, fontWeight: 600, marginLeft: 16 },
  table:      { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  thead:      { background: '#F8FAFC' },
  th:         { padding: '11px 16px', textAlign: 'left', color: '#64748B', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' },
  td:         { padding: '12px 16px', color: '#334155', verticalAlign: 'middle', borderBottom: '1px solid #F8FAFC' },
  empty:      { padding: '40px', textAlign: 'center', color: '#94A3B8', fontSize: 14 },
  avatar:     { width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#2563EB,#60A5FA)', color: '#fff', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  usernameText:{ fontWeight: 600, color: '#1E3A5F', fontFamily: 'monospace', fontSize: 13 },
  pill:       { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, display: 'inline-block' },
  btnEdit:    { display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif" },
  btnDel:     { display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif" },
  deleteWarning: { display: 'flex', alignItems: 'flex-start', gap: 14, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '14px 18px' },
};

const fs = {
  grid:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px', padding: '4px 0 8px' },
  campo:     { display: 'flex', flexDirection: 'column', gap: 5 },
  label:     { fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 },
  input:     { padding: '9px 12px', borderRadius: 9, border: '1px solid #E2E8F0', fontSize: 13, outline: 'none', color: '#1E293B', fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif", background: '#F8FAFC', width: '100%', boxSizing: 'border-box' },
  estadoBtn: { flex: 1, display: 'flex', alignItems: 'center', padding: '9px 14px', borderRadius: 9, border: '1.5px solid', cursor: 'pointer', fontSize: 13, fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif", transition: 'all 0.15s' },
  footer:    { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24, paddingTop: 20, borderTop: '1px solid #F1F5F9' },
};
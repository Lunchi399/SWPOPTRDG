import { useEffect, useState } from 'react';
import Layout from '../../components/admin/Layout';
import Modal from '../../components/admin/Modal';
import { getUsuarios, crearUsuario,
         editarUsuario, eliminarUsuario } from '../../services/adminService';

const ROL_COLOR = {
  administrador: { bg: '#EEF2FF', color: '#3730A3', icon: '👑' },
  mesero:        { bg: '#FEF3C7', color: '#92400E', icon: '🍽️' },
  cocinero:      { bg: '#ECFDF5', color: '#065F46', icon: '👨‍🍳' },
  cajero:        { bg: '#FCE7F3', color: '#9D174D', icon: '💰' },
};

const ROL_LABELS = {
  administrador: 'Administrador',
  mesero: 'Mesero/a',
  cocinero: 'Cocinero/a',
  cajero: 'Cajero/a'
};

const FORM_VACIO = {
  username:  '',
  Nombre:    '',
  Apellido:  '',
  email:     '',
  Rol:       'mesero',
  password:  '',
  Activo:    true
};

export default function Usuarios() {
  const [lista, setLista] = useState([]);
  const [modal, setModal] = useState(null);
  const [seleccionado, setSel] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  const cargar = () =>
    getUsuarios().then(r => {
      setLista(r.data);
      setLoading(false);
    });

  useEffect(() => { cargar(); }, []);

  const mostrar = (msg, esError = false) => {
    esError ? setError(msg) : setMensaje(msg);
    setTimeout(() => { setMensaje(''); setError(''); }, 3000);
  };

  const abrirCrear = () => {
    setForm(FORM_VACIO);
    setModal('crear');
  };

  const abrirEditar = (u) => {
    setSel(u);
    setForm({ 
      username: u.username, 
      Nombre: u.first_name,
      Apellido: u.last_name, 
      email: u.email,
      Rol: u.rol, 
      Activo: u.activo, 
      password: '' 
    });
    setModal('editar');
  };

  const abrirEliminar = (u) => {
    setSel(u);
    setModal('eliminar');
  };

  const handleCrear = async () => {
    try {
      await crearUsuario(form);
      mostrar('Usuario creado correctamente');
      setModal(null);
      cargar();
    } catch (e) {
      mostrar(JSON.stringify(e.response?.data), true);
    }
  };

  const handleEditar = async () => {
    try {
      const data = { ...form };
      if (!data.password) delete data.password;
      await editarUsuario(seleccionado.id, data);
      mostrar('Usuario actualizado');
      setModal(null);
      cargar();
    } catch (e) {
      mostrar(JSON.stringify(e.response?.data), true);
    }
  };

  const handleEliminar = async () => {
    try {
      await eliminarUsuario(seleccionado.id);
      mostrar('Usuario eliminado');
      setModal(null);
      cargar();
    } catch (e) {
      mostrar(e.response?.data?.error, true);
    }
  };

  // Filtrar usuarios
  const usuariosFiltrados = lista.filter(u => {
    const search = busqueda.toLowerCase();
    return u.username?.toLowerCase().includes(search) ||
           u.first_name?.toLowerCase().includes(search) ||
           u.last_name?.toLowerCase().includes(search) ||
           u.email?.toLowerCase().includes(search) ||
           u.rol?.toLowerCase().includes(search);
  });

  // Estadísticas
  const stats = {
    total: lista.length,
    activos: lista.filter(u => u.activo).length,
    ...Object.keys(ROL_COLOR).reduce((acc, rol) => {
      acc[rol] = lista.filter(u => u.rol === rol).length;
      return acc;
    }, {})
  };

  return (
    <Layout>
      <div style={s.page}>
        {/* HEADER */}
        <div style={s.pageHeader}>
          <div>
            <h1 style={s.titulo}>👥 Gestión de Usuarios</h1>
            <p style={s.subtitulo}>
              {stats.total} usuarios totales · {stats.activos} activos
            </p>
          </div>
          <button style={s.btnPrimario} onClick={abrirCrear}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nuevo Usuario
          </button>
        </div>

        {/* TOAST */}
        {mensaje && (
          <div style={s.toast}>
            <div style={s.toastIcon}>✅</div>
            {mensaje}
          </div>
        )}
        {error && (
          <div style={s.toastErr}>
            <div style={s.toastIcon}>❌</div>
            {error}
          </div>
        )}

        {/* STATS ROW */}
        <div style={s.statsRow}>
          {[
            { label: 'Total', valor: stats.total, bg: '#EFF6FF', color: '#1D4ED8', icon: '📊' },
            { label: 'Activos', valor: stats.activos, bg: '#ECFDF5', color: '#065F46', icon: '🟢' },
            { label: 'Administradores', valor: stats.administrador || 0, bg: '#EEF2FF', color: '#3730A3', icon: '👑' },
            { label: 'Meseros', valor: stats.mesero || 0, bg: '#FEF3C7', color: '#92400E', icon: '🍽️' },
          ].map(stat => (
            <div key={stat.label} style={{ ...s.statCard, background: stat.bg, borderColor: stat.bg }}>
              <div style={s.statIcon}>{stat.icon}</div>
              <div>
                <span style={{ ...s.statValor, color: stat.color }}>{stat.valor}</span>
                <span style={{ ...s.statLabel, color: stat.color }}>{stat.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* BARRA DE BÚSQUEDA */}
        <div style={s.searchBar}>
          <div style={s.searchWrapper}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              style={s.searchInput}
              placeholder="Buscar usuario por nombre, email o rol..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
            {busqueda && (
              <button style={s.searchClear} onClick={() => setBusqueda('')}>
                ✕
              </button>
            )}
          </div>
          <div style={s.searchInfo}>
            {usuariosFiltrados.length} {usuariosFiltrados.length === 1 ? 'usuario' : 'usuarios'}
          </div>
        </div>

        {/* TABLA */}
        {loading ? (
          <div style={s.loadingTable}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={s.skelRow} />
            ))}
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div style={s.empty}>
            <div style={s.emptyIcon}>🔍</div>
            <p style={s.emptyText}>No se encontraron usuarios</p>
            <button style={s.btnSecundario} onClick={() => setBusqueda('')}>
              Limpiar búsqueda
            </button>
          </div>
        ) : (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['Usuario', 'Nombre', 'Email', 'Rol', 'Estado', 'Acciones'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((u, i) => {
                  const rc = ROL_COLOR[u.rol] || ROL_COLOR.mesero;
                  return (
                    <tr key={u.id} style={i % 2 === 0 ? s.trEven : s.trOdd}>
                      <td style={s.td}>
                        <div style={s.userCell}>
                          <div style={{ ...s.avatar, background: rc.bg, color: rc.color }}>
                            {u.username?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <strong style={s.userName}>{u.username}</strong>
                        </div>
                      </td>
                      <td style={s.td}>
                        {u.first_name} {u.last_name}
                        {!u.first_name && !u.last_name && <span style={s.emptyField}>—</span>}
                      </td>
                      <td style={s.td}>
                        <span style={s.email}>{u.email || '—'}</span>
                      </td>
                      <td style={s.td}>
                        <span style={{ ...s.pill, background: rc.bg, color: rc.color }}>
                          <span style={s.pillIcon}>{rc.icon}</span>
                          {ROL_LABELS[u.rol] || u.rol}
                        </span>
                      </td>
                      <td style={s.td}>
                        <span style={{
                          ...s.pill,
                          background: u.activo ? '#D1FAE5' : '#F1F5F9',
                          color: u.activo ? '#065F46' : '#64748B'
                        }}>
                          <span style={{
                            ...s.statusDot,
                            background: u.activo ? '#10B981' : '#94A3B8'
                          }} />
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td style={s.td}>
                        <div style={s.acciones}>
                          <button style={s.btnEdit} onClick={() => abrirEditar(u)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            Editar
                          </button>
                          <button style={s.btnDel} onClick={() => abrirEliminar(u)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
        )}
      </div>

      {/* MODAL CREAR/EDITAR */}
      {(modal === 'crear' || modal === 'editar') && (
        <Modal 
          titulo={modal === 'crear' ? '🪑 Nuevo Usuario' : '✏️ Editar Usuario'}
          onClose={() => setModal(null)}
        >
          <FormUsuario 
            form={form} 
            setForm={setForm}
            esEditar={modal === 'editar'} 
          />
          <div style={s.modalBtns}>
            <button style={s.btnSecundario} onClick={() => setModal(null)}>
              Cancelar
            </button>
            <button 
              style={s.btnPrimario} 
              onClick={modal === 'crear' ? handleCrear : handleEditar}
            >
              {modal === 'crear' ? 'Crear Usuario' : 'Guardar Cambios'}
            </button>
          </div>
        </Modal>
      )}

      {/* MODAL ELIMINAR */}
      {modal === 'eliminar' && seleccionado && (
        <Modal titulo="Eliminar Usuario" onClose={() => setModal(null)}>
          <div style={s.deleteWarning}>
            <div style={s.deleteIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div>
              <h3 style={s.deleteTitle}>¿Estás seguro?</h3>
              <p style={s.deleteText}>
                Eliminarás al usuario <strong>"{seleccionado?.username}"</strong> de forma permanente.
                Esta acción no se puede deshacer.
              </p>
            </div>
          </div>
          <div style={s.modalBtns}>
            <button style={s.btnSecundario} onClick={() => setModal(null)}>
              Cancelar
            </button>
            <button 
              style={{ ...s.btnPrimario, background: '#DC2626', boxShadow: '0 4px 14px rgba(220,38,38,0.35)' }} 
              onClick={handleEliminar}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              </svg>
              Eliminar Usuario
            </button>
          </div>
        </Modal>
      )}
    </Layout>
  );
}

// ── FORMULARIO DE USUARIO ──────────────────────────────────────────
function FormUsuario({ form, setForm, esEditar }) {
  const campo = (label, key, type = 'text', opciones = null, required = false) => (
    <div style={fs.campo}>
      <label style={fs.label}>
        {label}
        {required && <span style={fs.required}>*</span>}
      </label>
      {opciones ? (
        <div style={fs.selectWrapper}>
          <select
            style={fs.select}
            value={form[key]}
            onChange={e => setForm({ ...form, [key]: e.target.value })}
          >
            {opciones.map(o => (
              <option key={o.v} value={o.v}>{o.l}</option>
            ))}
          </select>
          <span style={fs.selectArrow}>▼</span>
        </div>
      ) : (
        <input
          style={fs.input}
          type={type}
          value={form[key] || ''}
          placeholder={esEditar && key === 'password' ? 'Dejar vacío para no cambiar' : ''}
          onChange={e => setForm({ ...form, [key]: e.target.value })}
        />
      )}
    </div>
  );

  return (
    <div style={fs.formGrid}>
      <div style={fs.formCol}>
        {campo('Usuario', 'username', 'text', null, true)}
        {campo('Nombre', 'Nombre')}
        {campo('Apellido', 'Apellido')}
      </div>
      <div style={fs.formCol}>
        {campo('Email', 'email', 'email')}
        {campo('Rol', 'Rol', 'text', [
          { v: 'administrador', l: '👑 Administrador' },
          { v: 'mesero', l: '🍽️ Mesero/a' },
          { v: 'cocinero', l: '👨‍🍳 Cocinero/a' },
          { v: 'cajero', l: '💰 Cajero/a' },
        ], true)}
        {campo('Contraseña', 'password', 'password', null, !esEditar)}
        {esEditar && campo('Estado', 'Activo', 'text', [
          { v: true, l: '🟢 Activo' },
          { v: false, l: '🔴 Inactivo' },
        ])}
      </div>
    </div>
  );
}

// ── ESTILOS ──────────────────────────────────────────────────────────
const s = {
  page: { 
    padding: '32px 40px', 
    maxWidth: 1280, 
    margin: '0 auto',
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    background: '#F8FAFC',
    minHeight: '100vh'
  },
  pageHeader: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 32 
  },
  titulo: { 
    fontSize: 28, 
    fontWeight: 700, 
    color: '#0F172A', 
    margin: 0,
    letterSpacing: '-0.025em'
  },
  subtitulo: { 
    color: '#64748B', 
    fontSize: 14, 
    marginTop: 6,
    fontWeight: 400
  },
  btnPrimario: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 24px',
    borderRadius: 12,
    background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    boxShadow: '0 4px 16px rgba(37,99,235,0.3)',
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    transition: 'all 0.2s ease',
  },
  btnSecundario: {
    padding: '10px 20px',
    borderRadius: 10,
    background: '#F1F5F9',
    color: '#475569',
    border: '1px solid #E2E8F0',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    transition: 'all 0.2s ease',
  },
  toast: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: '#F0FDF4',
    border: '1px solid #86EFAC',
    color: '#065F46',
    borderRadius: 12,
    padding: '14px 20px',
    marginBottom: 24,
    fontSize: 14,
    fontWeight: 500,
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
  },
  toastErr: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    color: '#991B1B',
    borderRadius: 12,
    padding: '14px 20px',
    marginBottom: 24,
    fontSize: 14,
    fontWeight: 500,
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
  },
  toastIcon: { fontSize: 18 },
  statsRow: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(4, 1fr)', 
    gap: 16, 
    marginBottom: 24 
  },
  statCard: { 
    borderRadius: 14, 
    padding: '18px 22px', 
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    transition: 'all 0.2s ease',
  },
  statIcon: { fontSize: 28, opacity: 0.8 },
  statValor: { fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.2 },
  statLabel: { fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.7, marginLeft: 6 },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 24,
    padding: '4px 0'
  },
  searchWrapper: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: '#fff',
    borderRadius: 12,
    padding: '0 16px',
    border: '1.5px solid #E2E8F0',
    transition: 'all 0.2s ease',
  },
  searchInput: {
    flex: 1,
    padding: '12px 0',
    border: 'none',
    outline: 'none',
    fontSize: 14,
    background: 'transparent',
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    color: '#0F172A'
  },
  searchClear: {
    background: 'none',
    border: 'none',
    color: '#94A3B8',
    cursor: 'pointer',
    fontSize: 16,
    padding: '4px',
    borderRadius: '50%',
    transition: 'all 0.2s ease',
    ':hover': { background: '#F1F5F9' }
  },
  searchInfo: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: 500,
    whiteSpace: 'nowrap'
  },
  loadingTable: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: 20,
    background: '#fff',
    borderRadius: 14,
    border: '1px solid #E2E8F0'
  },
  skelRow: {
    height: 56,
    borderRadius: 8,
    background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.4s infinite'
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '60px 20px',
    background: '#fff',
    borderRadius: 16,
    border: '2px dashed #E2E8F0'
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { color: '#64748B', fontSize: 16, marginBottom: 20, fontWeight: 500 },
  tableWrap: {
    background: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    border: '1px solid #E2E8F0',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    background: '#0F172A',
    color: '#F8FAFC',
    padding: '14px 20px',
    fontSize: 12,
    fontWeight: 600,
    textAlign: 'left',
    letterSpacing: 0.5,
    textTransform: 'uppercase'
  },
  td: { padding: '14px 20px', fontSize: 13, borderBottom: '1px solid #F1F5F9' },
  trEven: { background: '#fff' },
  trOdd: { background: '#F8FAFC' },
  userCell: { display: 'flex', alignItems: 'center', gap: 12 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 14
  },
  userName: { color: '#0F172A' },
  emptyField: { color: '#94A3B8' },
  email: { color: '#475569' },
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    fontWeight: 600,
    padding: '4px 14px',
    borderRadius: 20,
    whiteSpace: 'nowrap'
  },
  pillIcon: { fontSize: 13 },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    display: 'inline-block'
  },
  acciones: { display: 'flex', gap: 8 },
  btnEdit: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '6px 14px',
    borderRadius: 8,
    background: '#EFF6FF',
    color: '#2563EB',
    border: '1px solid #BFDBFE',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    transition: 'all 0.15s ease',
  },
  btnDel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '6px 14px',
    borderRadius: 8,
    background: '#FEF2F2',
    color: '#DC2626',
    border: '1px solid #FECACA',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    transition: 'all 0.15s ease',
  },
  deleteWarning: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 16,
    background: '#FEF2F2',
    border: '2px solid #FECACA',
    borderRadius: 12,
    padding: '20px 24px',
    marginBottom: 8
  },
  deleteIcon: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: '#FEE2E2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  deleteTitle: { margin: '0 0 4px 0', color: '#991B1B', fontSize: 16, fontWeight: 700 },
  deleteText: { margin: 0, color: '#7F1D1D', fontSize: 14, lineHeight: 1.6, opacity: 0.8 },
  modalBtns: {
    display: 'flex',
    gap: 12,
    justifyContent: 'flex-end',
    marginTop: 24,
    paddingTop: 20,
    borderTop: '1.5px solid #F1F5F9'
  }
};

const fs = {
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px 24px',
    padding: '4px 0 8px'
  },
  formCol: { display: 'flex', flexDirection: 'column', gap: 12 },
  campo: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  required: { color: '#EF4444', marginLeft: 4 },
  input: {
    padding: '10px 14px',
    borderRadius: 10,
    border: '1.5px solid #E2E8F0',
    fontSize: 14,
    outline: 'none',
    color: '#0F172A',
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    background: '#F8FAFC',
    transition: 'all 0.15s ease',
  },
  selectWrapper: { position: 'relative' },
  select: {
    width: '100%',
    padding: '10px 40px 10px 14px',
    borderRadius: 10,
    border: '1.5px solid #E2E8F0',
    fontSize: 14,
    outline: 'none',
    color: '#0F172A',
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    background: '#F8FAFC',
    appearance: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  selectArrow: {
    position: 'absolute',
    right: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#94A3B8',
    fontSize: 10,
    pointerEvents: 'none'
  }
};

// Agregar keyframes para shimmer
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;
document.head.appendChild(styleSheet);
import { useEffect, useState } from 'react';
import Layout from '../../components/admin/Layout';
import Modal  from '../../components/admin/Modal';
import { getUsuarios, crearUsuario,
         editarUsuario, eliminarUsuario } from '../../services/adminService';

const ROL_COLOR = {
  administrador: { bg:'#EEEDFE', color:'#3C3489' },
  mesero:        { bg:'#FAEEDA', color:'#633806' },
  cocinero:      { bg:'#E6F1FB', color:'#0C447C' },
  cajero:        { bg:'#FAECE7', color:'#712B13' },
};

const FORM_VACIO = {
  username:'', first_name:'', last_name:'',
  email:'', rol:'mesero', password:'', activo: true
};

export default function Usuarios() {
  const [lista, setLista]       = useState([]);
  const [modal, setModal]       = useState(null); // 'crear' | 'editar' | 'eliminar'
  const [seleccionado, setSel]  = useState(null);
  const [form, setForm]         = useState(FORM_VACIO);
  const [mensaje, setMensaje]   = useState('');
  const [error, setError]       = useState('');

  const cargar = () =>
    getUsuarios().then(r => setLista(r.data));

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
    setForm({ username: u.username, first_name: u.first_name,
              last_name: u.last_name, email: u.email,
              rol: u.rol, activo: u.activo, password: '' });
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

  return (
    <Layout>
      <div style={s.page}>
        <div style={s.pageHeader}>
          <h1 style={s.titulo}>Gestión de usuarios</h1>
          <button style={s.btnPrimario} onClick={abrirCrear}>
            + Nuevo usuario
          </button>
        </div>

        {mensaje && <div style={s.toast}>{mensaje}</div>}
        {error   && <div style={s.toastErr}>{error}</div>}

        {/* Tabla */}
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                {['ID','Usuario','Nombre','Email','Rol','Estado','Acciones']
                  .map(h => <th key={h} style={s.th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {lista.map((u, i) => {
                const rc = ROL_COLOR[u.rol] || ROL_COLOR.mesero;
                return (
                  <tr key={u.id} style={{ background: i%2===0?'#fff':'#F8F7F2' }}>
                    <td style={s.td}>{u.id}</td>
                    <td style={s.td}><strong>{u.username}</strong></td>
                    <td style={s.td}>{u.first_name} {u.last_name}</td>
                    <td style={s.td}>{u.email || '—'}</td>
                    <td style={s.td}>
                      <span style={{ ...s.pill, background:rc.bg, color:rc.color }}>
                        {u.rol}
                      </span>
                    </td>
                    <td style={s.td}>
                      <span style={{ ...s.pill,
                        background: u.activo ? '#E1F5EE' : '#F1EFE8',
                        color:      u.activo ? '#085041' : '#888' }}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={s.td}>
                      <div style={s.acciones}>
                        <button style={s.btnEdit}
                          onClick={() => abrirEditar(u)}>Editar</button>
                        <button style={s.btnDel}
                          onClick={() => abrirEliminar(u)}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modal crear / editar */}
        {(modal === 'crear' || modal === 'editar') && (
          <Modal titulo={modal === 'crear' ? 'Nuevo usuario' : 'Editar usuario'}
                 onClose={() => setModal(null)}>
            <FormUsuario form={form} setForm={setForm}
                         esEditar={modal === 'editar'} />
            <div style={s.modalBtns}>
              <button style={s.btnSecundario}
                onClick={() => setModal(null)}>Cancelar</button>
              <button style={s.btnPrimario}
                onClick={modal === 'crear' ? handleCrear : handleEditar}>
                {modal === 'crear' ? 'Crear usuario' : 'Guardar cambios'}
              </button>
            </div>
          </Modal>
        )}

        {/* Modal eliminar */}
        {modal === 'eliminar' && (
          <Modal titulo="Eliminar usuario" onClose={() => setModal(null)}>
            <p style={{ fontSize:14, color:'#333', marginBottom:16 }}>
              ¿Estás seguro de eliminar al usuario{' '}
              <strong>{seleccionado?.username}</strong>?
              Esta acción no se puede deshacer.
            </p>
            <div style={s.modalBtns}>
              <button style={s.btnSecundario}
                onClick={() => setModal(null)}>Cancelar</button>
              <button style={{ ...s.btnPrimario, background:'#993C1D' }}
                onClick={handleEliminar}>Sí, eliminar</button>
            </div>
          </Modal>
        )}
      </div>
    </Layout>
  );
}

function FormUsuario({ form, setForm, esEditar }) {
  const campo = (label, key, type = 'text', opciones = null) => (
    <div style={{ marginBottom:12 }}>
      <label style={fs.label}>{label}</label>
      {opciones ? (
        <select style={fs.input} value={form[key]}
          onChange={e => setForm({ ...form, [key]: e.target.value })}>
          {opciones.map(o =>
            <option key={o.v} value={o.v}>{o.l}</option>
          )}
        </select>
      ) : (
        <input style={fs.input} type={type} value={form[key]}
          placeholder={esEditar && key === 'password'
            ? 'Dejar vacío para no cambiar' : ''}
          onChange={e => setForm({ ...form, [key]: e.target.value })} />
      )}
    </div>
  );

  return (
    <>
      {campo('Usuario *', 'username')}
      {campo('Nombre',    'first_name')}
      {campo('Apellido',  'last_name')}
      {campo('Email',     'email', 'email')}
      {campo('Rol *', 'rol', 'text', [
        { v:'administrador', l:'Administrador' },
        { v:'mesero',        l:'Mesero/a'      },
        { v:'cocinero',      l:'Cocinero/a'    },
        { v:'cajero',        l:'Cajero/a'      },
      ])}
      {campo('Contraseña *', 'password', 'password')}
      {esEditar && campo('Estado', 'activo', 'text', [
        { v: true,  l: 'Activo'   },
        { v: false, l: 'Inactivo' },
      ])}
    </>
  );
}

const fs = {
  label: { fontSize:12, fontWeight:600, color:'#555',
           display:'block', marginBottom:4 },
  input: { width:'100%', padding:'8px 12px', borderRadius:7,
           border:'1px solid #ddd', fontSize:13 },
};

const s = {
  page:       { maxWidth:1100 },
  pageHeader: { display:'flex', justifyContent:'space-between',
                alignItems:'center', marginBottom:'1.25rem' },
  titulo:     { fontSize:20, fontWeight:700, color:'#1E2D40', margin:0 },
  toast:      { background:'#E1F5EE', color:'#085041', padding:'10px 14px',
                borderRadius:8, marginBottom:12, fontSize:13 },
  toastErr:   { background:'#FAECE7', color:'#993C1D', padding:'10px 14px',
                borderRadius:8, marginBottom:12, fontSize:13 },
  tableWrap:  { background:'#fff', borderRadius:10, overflow:'hidden',
                border:'1px solid #E8E6DF' },
  table:      { width:'100%', borderCollapse:'collapse' },
  th:         { background:'#1E2D40', color:'#fff', padding:'10px 14px',
                fontSize:12, fontWeight:600, textAlign:'left' },
  td:         { padding:'10px 14px', fontSize:13, borderBottom:'1px solid #F0EEE8' },
  pill:       { fontSize:11, fontWeight:500, padding:'3px 9px',
                borderRadius:20, display:'inline-block' },
  acciones:   { display:'flex', gap:6 },
  btnPrimario:{ padding:'8px 16px', borderRadius:8, background:'#2E5F8A',
                color:'#fff', border:'none', cursor:'pointer',
                fontSize:13, fontWeight:600 },
  btnSecundario:{ padding:'8px 16px', borderRadius:8, background:'#eee',
                  color:'#555', border:'none', cursor:'pointer', fontSize:13 },
  btnEdit:    { padding:'5px 12px', borderRadius:6, background:'#E6F1FB',
                color:'#0C447C', border:'none', cursor:'pointer', fontSize:12 },
  btnDel:     { padding:'5px 12px', borderRadius:6, background:'#FAECE7',
                color:'#993C1D', border:'none', cursor:'pointer', fontSize:12 },
  modalBtns:  { display:'flex', gap:8, justifyContent:'flex-end', marginTop:16 },
};
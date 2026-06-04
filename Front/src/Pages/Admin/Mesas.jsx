import { useEffect, useState } from 'react';
import Layout from '../../components/admin/Layout';
import Modal  from '../../components/admin/Modal';
import { getMesas, crearMesa,
         editarMesa, eliminarMesa } from '../../services/adminService';

const ESTADO_COLOR = {
  libre:    { bg:'#E1F5EE', color:'#085041' },
  ocupada:  { bg:'#FAECE7', color:'#712B13' },
  unida:    { bg:'#FAEEDA', color:'#633806' },
  reservada:{ bg:'#EEEDFE', color:'#3C3489' },
};
const FORM_VACIO = { identificador_mesa:'', capacidad: 4, estado:'libre' };

export default function Mesas() {
  const [lista, setLista]     = useState([]);
  const [modal, setModal]     = useState(null);
  const [sel, setSel]         = useState(null);
  const [form, setForm]       = useState(FORM_VACIO);
  const [mensaje, setMensaje] = useState('');
  const [error, setError]     = useState('');

  const cargar = () => getMesas().then(r => setLista(r.data));
  useEffect(() => { cargar(); }, []);

  const mostrar = (msg, esError = false) => {
    esError ? setError(msg) : setMensaje(msg);
    setTimeout(() => { setMensaje(''); setError(''); }, 3000);
  };

  const handleCrear = async () => {
    try {
      await crearMesa(form);
      mostrar('Mesa creada correctamente');
      setModal(null); cargar();
    } catch (e) { mostrar(JSON.stringify(e.response?.data), true); }
  };

  const handleEditar = async () => {
    try {
      await editarMesa(sel.id_mesa, form);
      mostrar('Mesa actualizada');
      setModal(null); cargar();
    } catch (e) { mostrar(JSON.stringify(e.response?.data), true); }
  };

  const handleEliminar = async () => {
    try {
      await eliminarMesa(sel.id_mesa);
      mostrar('Mesa eliminada');
      setModal(null); cargar();
    } catch (e) { mostrar(e.response?.data?.error, true); }
  };

  return (
    <Layout>
      <div style={s.page}>
        <div style={s.pageHeader}>
          <h1 style={s.titulo}>Gestión de mesas</h1>
          <button style={s.btnPrimario}
            onClick={() => { setForm(FORM_VACIO); setModal('crear'); }}>
            + Nueva mesa
          </button>
        </div>

        {mensaje && <div style={s.toast}>{mensaje}</div>}
        {error   && <div style={s.toastErr}>{error}</div>}

        {/* Resumen */}
        <div style={s.resumen}>
          {['libre','ocupada','unida','reservada'].map(est => {
            const cc  = ESTADO_COLOR[est];
            const cnt = lista.filter(m => m.estado === est).length;
            return (
              <div key={est} style={{ ...s.resCard,
                                      background:cc.bg, borderColor:cc.color }}>
                <div style={{ fontSize:18, fontWeight:700, color:cc.color }}>
                  {cnt}
                </div>
                <div style={{ fontSize:11, color:cc.color, textTransform:'capitalize' }}>
                  {est}s
                </div>
              </div>
            );
          })}
        </div>

        {/* Mapa de mesas */}
        <div style={s.grid}>
          {lista.map(m => {
            const cc = ESTADO_COLOR[m.estado] || ESTADO_COLOR.libre;
            return (
              <div key={m.id_mesa} style={{
                ...s.mesaCard,
                background: cc.bg,
                borderColor: cc.color
              }}>
                <div style={{ fontSize:20, fontWeight:700, color:cc.color }}>
                  {m.identificador_mesa}
                </div>
                <div style={{ fontSize:12, color:cc.color,
                               textTransform:'capitalize' }}>
                  {m.estado}
                </div>
                <div style={{ fontSize:11, color:'#888', marginTop:2 }}>
                  Cap. {m.capacidad} personas
                </div>
                <div style={s.cardBtns}>
                  <button style={s.btnEdit}
                    onClick={() => {
                      setSel(m);
                      setForm({ identificador_mesa: m.identificador_mesa,
                                capacidad: m.capacidad, estado: m.estado });
                      setModal('editar');
                    }}>Editar</button>
                  <button style={s.btnDel}
                    onClick={() => { setSel(m); setModal('eliminar'); }}>
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modales */}
        {(modal === 'crear' || modal === 'editar') && (
          <Modal titulo={modal === 'crear' ? 'Nueva mesa' : 'Editar mesa'}
                 onClose={() => setModal(null)}>
            <div style={{ marginBottom:10 }}>
              <label style={fs.label}>Identificador (ej: Mesa 1, VIP-A)</label>
              <input style={fs.input} value={form.identificador_mesa}
                onChange={e => setForm({...form, identificador_mesa:e.target.value})} />
            </div>
            <div style={{ marginBottom:10 }}>
              <label style={fs.label}>Capacidad (personas)</label>
              <input style={fs.input} type="number" value={form.capacidad}
                onChange={e => setForm({...form, capacidad:parseInt(e.target.value)})} />
            </div>
            <div style={{ marginBottom:10 }}>
              <label style={fs.label}>Estado</label>
              <select style={fs.input} value={form.estado}
                onChange={e => setForm({...form, estado:e.target.value})}>
                <option value="libre">Libre</option>
                <option value="ocupada">Ocupada</option>
                <option value="reservada">Reservada</option>
              </select>
            </div>
            <div style={s.modalBtns}>
              <button style={s.btnSecundario}
                onClick={() => setModal(null)}>Cancelar</button>
              <button style={s.btnPrimario}
                onClick={modal === 'crear' ? handleCrear : handleEditar}>
                {modal === 'crear' ? 'Crear mesa' : 'Guardar'}
              </button>
            </div>
          </Modal>
        )}

        {modal === 'eliminar' && (
          <Modal titulo="Eliminar mesa" onClose={() => setModal(null)}>
            <p style={{ fontSize:14, marginBottom:16 }}>
              ¿Eliminar la mesa <strong>{sel?.identificador_mesa}</strong>?
            </p>
            <div style={s.modalBtns}>
              <button style={s.btnSecundario}
                onClick={() => setModal(null)}>Cancelar</button>
              <button style={{ ...s.btnPrimario, background:'#993C1D' }}
                onClick={handleEliminar}>Eliminar</button>
            </div>
          </Modal>
        )}
      </div>
    </Layout>
  );
}

const fs = {
  label: { fontSize:12, fontWeight:600, color:'#555', display:'block', marginBottom:4 },
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
  resumen:    { display:'flex', gap:10, marginBottom:'1.25rem', flexWrap:'wrap' },
  resCard:    { padding:'10px 18px', borderRadius:8, border:'1.5px solid',
                textAlign:'center', minWidth:80 },
  grid:       { display:'grid',
                gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:10 },
  mesaCard:   { border:'1.5px solid', borderRadius:10, padding:'1rem',
                display:'flex', flexDirection:'column',
                alignItems:'center', gap:4 },
  cardBtns:   { display:'flex', gap:5, marginTop:6 },
  btnPrimario:{ padding:'8px 16px', borderRadius:8, background:'#2E5F8A',
                color:'#fff', border:'none', cursor:'pointer',
                fontSize:13, fontWeight:600 },
  btnSecundario:{ padding:'8px 16px', borderRadius:8, background:'#eee',
                  color:'#555', border:'none', cursor:'pointer', fontSize:13 },
  btnEdit:    { padding:'5px 10px', borderRadius:6, background:'#E6F1FB',
                color:'#0C447C', border:'none', cursor:'pointer', fontSize:11 },
  btnDel:     { padding:'5px 10px', borderRadius:6, background:'#FAECE7',
                color:'#993C1D', border:'none', cursor:'pointer', fontSize:11 },
  modalBtns:  { display:'flex', gap:8, justifyContent:'flex-end', marginTop:16 },
};
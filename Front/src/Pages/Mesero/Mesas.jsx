import { useEffect, useState } from 'react';
import { getMesas, confirmarPedido, despacharPedido,
         finalizarServicio, crearPedido,
         getPlatosDisponibles } from '../../services/meseroService';
import { getUsuario, logoutService } from '../../services/authService';
import { useNavigate } from 'react-router-dom';

const ESTADO_COLOR = {
  libre:    { bg: '#E1F5EE', color: '#085041', label: 'Libre' },
  ocupada:  { bg: '#FAECE7', color: '#712B13', label: 'Ocupada' },
  unida:    { bg: '#FAEEDA', color: '#633806', label: 'Unida' },
  reservada:{ bg: '#EEEDFE', color: '#3C3489', label: 'Reservada' },
};

export default function Mesas() {
  const [mesas, setMesas]         = useState([]);
  const [platos, setPlatos]       = useState([]);
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
  const [pedidoForm, setPedidoForm] = useState({ num_comensales: 1, detalles: [] });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [mensaje, setMensaje]     = useState('');
  const navigate                  = useNavigate();
  const usuario                   = getUsuario();

  const cargarMesas  = () => getMesas().then(r => setMesas(r.data));
  const cargarPlatos = () => getPlatosDisponibles().then(r => setPlatos(r.data));

  useEffect(() => {
    cargarMesas();
    cargarPlatos();
    // refresca cada 15 segundos
    const interval = setInterval(cargarMesas, 15000);
    return () => clearInterval(interval);
  }, []);

  const mostrarMensaje = (msg) => {
    setMensaje(msg);
    setTimeout(() => setMensaje(''), 3000);
  };

  const abrirModal = (mesa) => {
    setMesaSeleccionada(mesa);
    setPedidoForm({ num_comensales: 1, detalles: [] });
    setModalAbierto(true);
  };

  const agregarPlato = (plato) => {
    setPedidoForm(prev => {
      const existe = prev.detalles.find(d => d.plato === plato.id);
      if (existe) {
        return { ...prev, detalles: prev.detalles.map(d =>
          d.plato === plato.id ? { ...d, cantidad: d.cantidad + 1 } : d
        )};
      }
      return { ...prev, detalles: [...prev.detalles,
        { plato: plato.id, nombre: plato.nombre,
          precio: plato.precio, cantidad: 1, observacion: '' }
      ]};
    });
  };

  const quitarPlato = (platoId) => {
    setPedidoForm(prev => ({
      ...prev,
      detalles: prev.detalles.filter(d => d.plato !== platoId)
    }));
  };

  const totalPedido = () =>
    pedidoForm.detalles.reduce((s, d) => s + d.precio * d.cantidad, 0).toFixed(2);

  const handleCrearPedido = async () => {
    if (pedidoForm.detalles.length === 0) {
      mostrarMensaje('Agrega al menos un plato al pedido');
      return;
    }
    try {
      await crearPedido({
        mesa:           mesaSeleccionada.id,
        num_comensales: pedidoForm.num_comensales,
        detalles:       pedidoForm.detalles,
      });
      mostrarMensaje(`Pedido creado para Mesa ${mesaSeleccionada.numero}`);
      setModalAbierto(false);
      cargarMesas();
    } catch (e) {
      mostrarMensaje(e.response?.data?.error || 'Error al crear pedido');
    }
  };

  const handleLogout = async () => {
    await logoutService();
    navigate('/login');
  };

  return (
    <div style={s.page}>
      {/* Topbar */}
      <div style={s.topbar}>
        <h1 style={s.titulo}>🍽️ Módulo Mesero — Don George</h1>
        <div style={s.userbar}>
          <span style={s.username}>👤 {usuario?.username}</span>
          <button style={s.logoutBtn} onClick={handleLogout}>Salir</button>
        </div>
      </div>

      {mensaje && <div style={s.toast}>{mensaje}</div>}

      {/* Mapa de mesas */}
      <h2 style={s.subtitulo}>Estado de mesas</h2>
      <div style={s.mesasGrid}>
        {mesas.map(mesa => {
          const est = ESTADO_COLOR[mesa.estado] || ESTADO_COLOR.libre;
          return (
            <div key={mesa.id} style={{ ...s.mesaCard, background: est.bg,
                                        borderColor: est.color }}>
              <div style={{ ...s.mesaNumero, color: est.color }}>
                Mesa {mesa.numero}
              </div>
              <div style={{ ...s.mesaEstado, color: est.color }}>
                {est.label}
              </div>
              <div style={s.mesaCap}>Cap. {mesa.capacidad} personas</div>

              {mesa.estado === 'libre' && (
                <button style={{ ...s.btn, background: est.color, color: '#fff' }}
                  onClick={() => abrirModal(mesa)}>
                  + Nuevo pedido
                </button>
              )}
              {mesa.estado === 'ocupada' && (
                <button style={{ ...s.btn, background: '#185FA5', color: '#fff' }}
                  onClick={() => navigate(`/mesero/pedido/${mesa.id}`)}>
                  Ver pedido
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal nuevo pedido */}
      {modalAbierto && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={s.modalTitulo}>
              Nuevo pedido — Mesa {mesaSeleccionada?.numero}
            </h3>

            <label style={s.label}>Número de comensales</label>
            <input style={s.input} type="number" min="1"
              value={pedidoForm.num_comensales}
              onChange={e => setPedidoForm({
                ...pedidoForm, num_comensales: parseInt(e.target.value)
              })}
            />

            <label style={s.label}>Seleccionar platos</label>
            <div style={s.platosGrid}>
              {platos.map(p => (
                <button key={p.id} style={s.platoBtn}
                  onClick={() => agregarPlato(p)}>
                  <span style={{ fontWeight: 600 }}>{p.nombre}</span>
                  <span style={{ color: '#0F6E56' }}>S/. {p.precio}</span>
                </button>
              ))}
            </div>

            {pedidoForm.detalles.length > 0 && (
              <>
                <label style={s.label}>Pedido actual</label>
                {pedidoForm.detalles.map(d => (
                  <div key={d.plato} style={s.detalleRow}>
                    <span>{d.nombre} x{d.cantidad}</span>
                    <span style={{ color: '#0F6E56' }}>
                      S/. {(d.precio * d.cantidad).toFixed(2)}
                    </span>
                    <button style={s.quitarBtn}
                      onClick={() => quitarPlato(d.plato)}>✕</button>
                  </div>
                ))}
                <div style={s.totalRow}>
                  <strong>Total estimado:</strong>
                  <strong style={{ color: '#0F6E56' }}>S/. {totalPedido()}</strong>
                </div>
              </>
            )}

            <div style={s.modalBtns}>
              <button style={s.btnSecundario}
                onClick={() => setModalAbierto(false)}>Cancelar</button>
              <button style={s.btnPrimario}
                onClick={handleCrearPedido}>Confirmar pedido</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page:       { padding: '1.5rem', fontFamily: 'Arial, sans-serif',
                background: '#F8F7F2', minHeight: '100vh' },
  topbar:     { display:'flex', justifyContent:'space-between',
                alignItems:'center', marginBottom: '1.5rem' },
  titulo:     { fontSize: 18, fontWeight: 700, color: '#1E2D40', margin: 0 },
  userbar:    { display:'flex', alignItems:'center', gap: 10 },
  username:   { fontSize: 13, color: '#555' },
  logoutBtn:  { padding:'6px 12px', borderRadius:7, background:'#993C1D',
                color:'#fff', border:'none', cursor:'pointer', fontSize:12 },
  toast:      { background:'#1E2D40', color:'#fff', padding:'10px 18px',
                borderRadius:8, marginBottom:16, fontSize:13 },
  subtitulo:  { fontSize:15, fontWeight:600, color:'#1E2D40', marginBottom:12 },
  mesasGrid:  { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',
                gap:10, marginBottom:'2rem' },
  mesaCard:   { border:'1.5px solid', borderRadius:10, padding:'1rem',
                display:'flex', flexDirection:'column', gap:6, alignItems:'center' },
  mesaNumero: { fontSize:16, fontWeight:700 },
  mesaEstado: { fontSize:12, fontWeight:500 },
  mesaCap:    { fontSize:11, color:'#888' },
  btn:        { padding:'6px 14px', borderRadius:7, border:'none',
                cursor:'pointer', fontSize:12, fontWeight:600, marginTop:4 },
  overlay:    { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)',
                display:'flex', alignItems:'center', justifyContent:'center',
                zIndex:100 },
  modal:      { background:'#fff', borderRadius:12, padding:'1.5rem',
                width:'100%', maxWidth:480, maxHeight:'85vh', overflowY:'auto' },
  modalTitulo:{ fontSize:16, fontWeight:700, color:'#1E2D40', marginBottom:14 },
  label:      { fontSize:12, fontWeight:600, color:'#555',
                display:'block', marginBottom:4, marginTop:10 },
  input:      { padding:'8px 12px', borderRadius:7, border:'1px solid #ddd',
                fontSize:13, width:'100%' },
  platosGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 },
  platoBtn:   { padding:'8px', borderRadius:7, border:'1px solid #ddd',
                background:'#F8F7F2', cursor:'pointer', display:'flex',
                flexDirection:'column', gap:2, alignItems:'flex-start',
                fontSize:12 },
  detalleRow: { display:'flex', justifyContent:'space-between',
                alignItems:'center', padding:'5px 0',
                borderBottom:'1px solid #eee', fontSize:13 },
  quitarBtn:  { padding:'2px 8px', borderRadius:5, border:'none',
                background:'#FAECE7', color:'#993C1D', cursor:'pointer',
                fontSize:11 },
  totalRow:   { display:'flex', justifyContent:'space-between',
                padding:'8px 0', fontSize:14, marginTop:4 },
  modalBtns:  { display:'flex', gap:8, justifyContent:'flex-end', marginTop:16 },
  btnPrimario:{ padding:'9px 20px', borderRadius:8, background:'#0F6E56',
                color:'#fff', border:'none', cursor:'pointer',
                fontSize:13, fontWeight:600 },
  btnSecundario:{ padding:'9px 20px', borderRadius:8, background:'#eee',
                  color:'#555', border:'none', cursor:'pointer', fontSize:13 },
};
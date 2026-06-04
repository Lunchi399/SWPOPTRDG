import { useEffect, useState } from 'react';
import { getMesas, unirMesas, desunirMesa,
         getProductosDisponibles, crearPedido,
         cambiarEstado } from '../../../services/meseroService';

const ESTADO_COLOR = {
  libre:    { bg:'#E1F5EE', color:'#085041', label:'Libre'    },
  ocupada:  { bg:'#FAECE7', color:'#712B13', label:'Ocupada'  },
  unida:    { bg:'#FAEEDA', color:'#633806', label:'Unida'    },
  reservada:{ bg:'#EEEDFE', color:'#3C3489', label:'Reservada'},
};

export default function TabMesas({ onVerPedido }) {
  const [mesas,    setMesas]    = useState([]);
  const [platos,   setPlatos]   = useState([]);
  const [modal,    setModal]    = useState(null);
  const [mesaSel,  setMesaSel]  = useState(null);
  const [unirSel,  setUnirSel]  = useState(null);
  const [pedido,   setPedido]   = useState({ observaciones:'', detalles:[] });
  const [mensaje,  setMensaje]  = useState('');
  const [error,    setError]    = useState('');

  const cargar = () => getMesas().then(r => setMesas(r.data));

  useEffect(() => {
    cargar();
    getProductosDisponibles().then(r => setPlatos(r.data));
    const iv = setInterval(cargar, 10000);
    return () => clearInterval(iv);
  }, []);

  const mostrar = (msg, err = false) => {
    err ? setError(msg) : setMensaje(msg);
    setTimeout(() => { setMensaje(''); setError(''); }, 3000);
  };

  const abrirPedido = (mesa) => {
    setMesaSel(mesa);
    setPedido({ observaciones:'', detalles:[] });
    setModal('pedido');
  };

  const agregarPlato = (plato) => {
    setPedido(prev => {
      const existe = prev.detalles.find(d => d.id_producto === plato.id_producto);
      if (existe) {
        return {
          ...prev,
          detalles: prev.detalles.map(d =>
            d.id_producto === plato.id_producto
              ? { ...d, cantidad: d.cantidad + 1 }
              : d
          )
        };
      }
      return {
        ...prev,
        detalles: [...prev.detalles, {
          id_producto: plato.id_producto,
          nombre:      plato.nombre,
          precio:      parseFloat(plato.precio),
          cantidad:    1,
        }]
      };
    });
  };

  const quitarPlato = (id) => {
    setPedido(prev => ({
      ...prev,
      detalles: prev.detalles.filter(d => d.id_producto !== id)
    }));
  };

  const cambiarCantidad = (id, delta) => {
    setPedido(prev => ({
      ...prev,
      detalles: prev.detalles
        .map(d => d.id_producto === id
          ? { ...d, cantidad: Math.max(1, d.cantidad + delta) }
          : d
        )
    }));
  };

  const total = () =>
    pedido.detalles.reduce((s, d) => s + d.precio * d.cantidad, 0).toFixed(2);

  const handleCrearPedido = async () => {
    if (pedido.detalles.length === 0) {
      mostrar('Agrega al menos un plato', true); return;
    }
    try {
      const nuevo = await crearPedido({
        id_mesa:       mesaSel.id_mesa,
        observaciones: pedido.observaciones,
        detalles:      pedido.detalles,
      });
      // Confirmar automáticamente y enviar a cocina
      await cambiarEstado(nuevo.data.id_pedido, 'confirmar');
      mostrar(`Pedido enviado a cocina — Mesa ${mesaSel.identificador_mesa}`);
      setModal(null);
      cargar();
    } catch (e) {
      mostrar(e.response?.data?.error || 'Error al crear pedido', true);
    }
  };

  const handleUnir = async () => {
    if (!unirSel) { mostrar('Selecciona la mesa a unir', true); return; }
    try {
      await unirMesas({ mesa_id: mesaSel.id_mesa, mesa_unir_id: unirSel });
      mostrar('Mesas unidas correctamente');
      setModal(null); setUnirSel(null); cargar();
    } catch (e) {
      mostrar(e.response?.data?.error || 'Error al unir mesas', true);
    }
  };

  const handleDesunir = async (mesa) => {
    try {
      await desunirMesa(mesa.id_mesa);
      mostrar(`Mesa ${mesa.identificador_mesa} separada`);
      cargar();
    } catch (e) {
      mostrar(e.response?.data?.error || 'Error', true);
    }
  };

  // Agrupar por categoría
  const categorias = [...new Set(platos.map(p => p.categoria))];

  return (
    <div>
      {mensaje && <div style={s.toast}>{mensaje}</div>}
      {error   && <div style={s.toastErr}>{error}</div>}

      <div style={s.topbar}>
        <h2 style={s.titulo}>Mapa de mesas</h2>
        <div style={s.leyenda}>
          {Object.entries(ESTADO_COLOR).map(([k, v]) => (
            <span key={k} style={{ ...s.leyendaItem,
                                    background:v.bg, color:v.color }}>
              {v.label}
            </span>
          ))}
        </div>
      </div>

      {/* Mapa de mesas */}
      <div style={s.grid}>
        {mesas.map(mesa => {
          const est = ESTADO_COLOR[mesa.estado] || ESTADO_COLOR.libre;
          return (
            <div key={mesa.id_mesa} style={{
              ...s.mesaCard,
              background:  est.bg,
              borderColor: est.color,
            }}>
              <div style={{ fontSize:18, fontWeight:700, color:est.color }}>
                {mesa.identificador_mesa}
              </div>
              <div style={{ fontSize:11, color:est.color, fontWeight:500 }}>
                {est.label}
              </div>
              <div style={{ fontSize:11, color:'#888' }}>
                Cap. {mesa.capacidad}
              </div>

              <div style={s.mesaBtns}>
                {mesa.estado === 'libre' && (
                  <>
                    <button style={s.btnVerde}
                      onClick={() => abrirPedido(mesa)}>
                      + Pedido
                    </button>
                    <button style={s.btnAmbar}
                      onClick={() => { setMesaSel(mesa); setModal('unir'); }}>
                      Unir
                    </button>
                  </>
                )}
                {mesa.estado === 'ocupada' && (
                  <button style={s.btnAzul}
                    onClick={() => onVerPedido(mesa)}>
                    Ver pedido
                  </button>
                )}
                {mesa.estado === 'unida' && (
                  <button style={s.btnAmbar}
                    onClick={() => handleDesunir(mesa)}>
                    Separar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal — Nuevo pedido */}
      {modal === 'pedido' && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitulo}>
                Nuevo pedido — {mesaSel?.identificador_mesa}
              </h3>
              <button style={s.closeBtn}
                onClick={() => setModal(null)}>✕</button>
            </div>

            <textarea style={s.textarea}
              placeholder="Observaciones del pedido..."
              value={pedido.observaciones}
              onChange={e => setPedido({
                ...pedido, observaciones: e.target.value
              })}
            />

            {/* Carta por categoría */}
            {categorias.map(cat => (
              <div key={cat} style={{ marginBottom:12 }}>
                <div style={s.catLabel}>{cat.toUpperCase()}</div>
                <div style={s.platosGrid}>
                  {platos.filter(p => p.categoria === cat).map(p => (
                    <button key={p.id_producto} style={s.platoBtn}
                      onClick={() => agregarPlato(p)}>
                      <span style={{ fontWeight:600, fontSize:12 }}>
                        {p.nombre}
                      </span>
                      <span style={{ color:'#0F6E56', fontSize:11 }}>
                        S/. {p.precio}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Resumen del pedido */}
            {pedido.detalles.length > 0 && (
              <div style={s.resumen}>
                <div style={s.resumenTitulo}>Pedido actual</div>
                {pedido.detalles.map(d => (
                  <div key={d.id_producto} style={s.detalleRow}>
                    <span style={{ flex:1, fontSize:13 }}>{d.nombre}</span>
                    <div style={s.cantidadCtrl}>
                      <button style={s.ctrlBtn}
                        onClick={() => cambiarCantidad(d.id_producto, -1)}>
                        −
                      </button>
                      <span style={{ fontSize:13, minWidth:20,
                                     textAlign:'center' }}>
                        {d.cantidad}
                      </span>
                      <button style={s.ctrlBtn}
                        onClick={() => cambiarCantidad(d.id_producto, 1)}>
                        +
                      </button>
                    </div>
                    <span style={{ color:'#0F6E56', fontSize:13, width:60,
                                   textAlign:'right' }}>
                      S/. {(d.precio * d.cantidad).toFixed(2)}
                    </span>
                    <button style={s.quitarBtn}
                      onClick={() => quitarPlato(d.id_producto)}>✕</button>
                  </div>
                ))}
                <div style={s.totalRow}>
                  <strong>Total estimado</strong>
                  <strong style={{ color:'#0F6E56' }}>S/. {total()}</strong>
                </div>
              </div>
            )}

            <div style={s.modalFooter}>
              <button style={s.btnSecundario}
                onClick={() => setModal(null)}>Cancelar</button>
              <button style={s.btnPrimario}
                onClick={handleCrearPedido}>
                Confirmar y enviar a cocina
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Unir mesas */}
      {modal === 'unir' && (
        <div style={s.overlay}>
          <div style={{ ...s.modal, maxWidth:360 }}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitulo}>
                Unir con {mesaSel?.identificador_mesa}
              </h3>
              <button style={s.closeBtn}
                onClick={() => setModal(null)}>✕</button>
            </div>
            <p style={{ fontSize:13, color:'#555', marginBottom:12 }}>
              Selecciona la mesa a unir:
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {mesas
                .filter(m => m.id_mesa !== mesaSel?.id_mesa &&
                             m.estado === 'libre')
                .map(m => (
                  <button key={m.id_mesa} style={{
                    ...s.mesaOpcion,
                    background: unirSel === m.id_mesa ? '#E6F1FB' : '#F8F7F2',
                    borderColor: unirSel === m.id_mesa ? '#185FA5' : '#ddd',
                  }} onClick={() => setUnirSel(m.id_mesa)}>
                    {m.identificador_mesa} — Cap. {m.capacidad}
                  </button>
                ))}
            </div>
            <div style={s.modalFooter}>
              <button style={s.btnSecundario}
                onClick={() => setModal(null)}>Cancelar</button>
              <button style={s.btnPrimario}
                onClick={handleUnir}>Unir mesas</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  toast:      { background:'#E1F5EE', color:'#085041', padding:'10px 14px',
                borderRadius:8, marginBottom:12, fontSize:13 },
  toastErr:   { background:'#FAECE7', color:'#993C1D', padding:'10px 14px',
                borderRadius:8, marginBottom:12, fontSize:13 },
  topbar:     { display:'flex', justifyContent:'space-between',
                alignItems:'center', marginBottom:'1rem', flexWrap:'wrap', gap:8 },
  titulo:     { fontSize:18, fontWeight:700, color:'#1E2D40', margin:0 },
  leyenda:    { display:'flex', gap:6, flexWrap:'wrap' },
  leyendaItem:{ fontSize:11, fontWeight:500, padding:'3px 10px',
                borderRadius:20 },
  grid:       { display:'grid',
                gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',
                gap:10 },
  mesaCard:   { border:'2px solid', borderRadius:12, padding:'1rem',
                display:'flex', flexDirection:'column',
                alignItems:'center', gap:6, textAlign:'center' },
  mesaBtns:   { display:'flex', gap:5, flexWrap:'wrap',
                justifyContent:'center', marginTop:4 },
  btnVerde:   { padding:'5px 10px', borderRadius:6, background:'#0F6E56',
                color:'#fff', border:'none', cursor:'pointer', fontSize:11 },
  btnAzul:    { padding:'5px 10px', borderRadius:6, background:'#185FA5',
                color:'#fff', border:'none', cursor:'pointer', fontSize:11 },
  btnAmbar:   { padding:'5px 10px', borderRadius:6, background:'#854F0B',
                color:'#fff', border:'none', cursor:'pointer', fontSize:11 },
  overlay:    { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)',
                display:'flex', alignItems:'center', justifyContent:'center',
                zIndex:200, padding:'1rem' },
  modal:      { background:'#fff', borderRadius:12, width:'100%',
                maxWidth:520, maxHeight:'90vh', overflowY:'auto' },
  modalHeader:{ display:'flex', justifyContent:'space-between',
                alignItems:'center', padding:'1rem 1.25rem',
                borderBottom:'1px solid #eee' },
  modalTitulo:{ fontSize:15, fontWeight:700, color:'#1E2D40', margin:0 },
  closeBtn:   { background:'none', border:'none', fontSize:18,
                cursor:'pointer', color:'#888' },
  textarea:   { width:'100%', padding:'8px 12px', borderRadius:8,
                border:'1px solid #ddd', fontSize:13, resize:'vertical',
                minHeight:60, margin:'1rem 1.25rem 0',
                width:'calc(100% - 2.5rem)' },
  catLabel:   { fontSize:11, fontWeight:700, color:'#888',
                textTransform:'uppercase', letterSpacing:'.05em',
                padding:'0 1.25rem', marginBottom:6, marginTop:10 },
  platosGrid: { display:'grid', gridTemplateColumns:'1fr 1fr',
                gap:6, padding:'0 1.25rem' },
  platoBtn:   { padding:'8px 10px', borderRadius:8, border:'1px solid #eee',
                background:'#F8F7F2', cursor:'pointer', display:'flex',
                flexDirection:'column', gap:2, textAlign:'left' },
  resumen:    { margin:'1rem 1.25rem 0', background:'#F8F7F2',
                borderRadius:8, padding:'10px 12px' },
  resumenTitulo:{ fontSize:12, fontWeight:700, color:'#1E2D40',
                  marginBottom:8 },
  detalleRow: { display:'flex', alignItems:'center', gap:8,
                padding:'5px 0', borderBottom:'1px solid #eee' },
  cantidadCtrl:{ display:'flex', alignItems:'center', gap:4 },
  ctrlBtn:    { width:22, height:22, borderRadius:5, border:'1px solid #ddd',
                background:'#fff', cursor:'pointer', fontSize:13,
                display:'flex', alignItems:'center', justifyContent:'center' },
  quitarBtn:  { padding:'2px 6px', borderRadius:5, border:'none',
                background:'#FAECE7', color:'#993C1D',
                cursor:'pointer', fontSize:11 },
  totalRow:   { display:'flex', justifyContent:'space-between',
                padding:'8px 0 0', fontSize:14 },
  modalFooter:{ display:'flex', gap:8, justifyContent:'flex-end',
                padding:'1rem 1.25rem', borderTop:'1px solid #eee',
                marginTop:12 },
  btnPrimario:{ padding:'9px 20px', borderRadius:8, background:'#0F6E56',
                color:'#fff', border:'none', cursor:'pointer',
                fontSize:13, fontWeight:600 },
  btnSecundario:{ padding:'9px 20px', borderRadius:8, background:'#eee',
                  color:'#555', border:'none', cursor:'pointer', fontSize:13 },
  mesaOpcion: { padding:'10px 14px', borderRadius:8, border:'1.5px solid',
                background:'#F8F7F2', cursor:'pointer', fontSize:13,
                textAlign:'left' },
};
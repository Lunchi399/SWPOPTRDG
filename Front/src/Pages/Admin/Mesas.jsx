import { useEffect, useState } from 'react';
import Layout from '../../components/admin/Layout';
import { getMesas, crearMesa, editarMesa,
         eliminarMesa, desunirMesa } from '../../services/adminService';

const ESTADO_INFO = {
  libre:    { bg:'#ECFDF5', color:'#059669', icon:'○', label:'Libre'    },
  ocupada:  { bg:'#FEF2F2', color:'#DC2626', icon:'●', label:'Ocupada'  },
  unida:    { bg:'#FFFBEB', color:'#B45309', icon:'◈', label:'Unida'    },
  reservada:{ bg:'#EEF2FF', color:'#4338CA', icon:'◉', label:'Reservada'},
};

const FORM_VACIO = { identificador_mesa:'', capacidad:4, estado:'libre' };

export default function Mesas() {
  const [lista,   setLista]   = useState([]);
  const [modal,   setModal]   = useState(null);
  const [sel,     setSel]     = useState(null);
  const [form,    setForm]    = useState(FORM_VACIO);
  const [mensaje, setMensaje] = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(true);

  const cargar = () => {
    setLoading(true);
    getMesas().then(r => setLista(r.data))
      .finally(() => setLoading(false));
  };
  useEffect(() => { cargar(); }, []);

  const mostrar = (msg, err=false) => {
    err ? setError(msg) : setMensaje(msg);
    setTimeout(() => { setMensaje(''); setError(''); }, 3000);
  };

  // ── Combinar mesas unidas en una sola tarjeta virtual (igual que el mesero) ──
  const procesarMesas = () => {
    const secundarias = lista.filter(m => m.estado === 'unida');
    const resultado = [];

    lista.forEach(mesa => {
      // Las secundarias no se muestran sueltas, van dentro de la combinada
      if (mesa.estado === 'unida') return;

      const secundariaDeEsta = secundarias.find(
        s => s.mesa_unida_a === mesa.id_mesa
      );

      if (secundariaDeEsta) {
        resultado.push({
          esCombinada: true,
          id_mesa: mesa.id_mesa,
          identificador_mesa:
            `${mesa.identificador_mesa} + ${secundariaDeEsta.identificador_mesa}`,
          capacidad: mesa.capacidad + secundariaDeEsta.capacidad,
          estado: mesa.estado,
          mesaSecundariaId: secundariaDeEsta.id_mesa,
          mesaPrincipalNombre: mesa.identificador_mesa,
          mesaSecundariaNombre: secundariaDeEsta.identificador_mesa,
        });
      } else {
        resultado.push({ ...mesa, esCombinada:false });
      }
    });

    return resultado;
  };

  const mesasParaMostrar = procesarMesas();

  const handleCrear = async () => {
    if (!form.identificador_mesa.trim()) {
      mostrar('El identificador es obligatorio', true); return;
    }
    try {
      await crearMesa(form);
      mostrar('Mesa creada correctamente');
      setModal(null); cargar();
    } catch(e) {
      mostrar(JSON.stringify(e.response?.data), true);
    }
  };

  const handleEditar = async () => {
    try {
      await editarMesa(sel.id_mesa, form);
      mostrar('Mesa actualizada');
      setModal(null); cargar();
    } catch(e) {
      mostrar(JSON.stringify(e.response?.data), true);
    }
  };

  const handleEliminar = async () => {
    try {
      await eliminarMesa(sel.id_mesa);
      mostrar('Mesa eliminada');
      setModal(null); cargar();
    } catch(e) {
      mostrar(e.response?.data?.error || 'Error al eliminar', true);
    }
  };

  const handleDesunir = async (mesaCombinada) => {
    try {
      await desunirMesa(mesaCombinada.id_mesa);
      mostrar(`${mesaCombinada.mesaPrincipalNombre} y `
        + `${mesaCombinada.mesaSecundariaNombre} separadas`);
      cargar();
    } catch(e) {
      mostrar(e.response?.data?.error || 'Error al separar', true);
    }
  };

  // Contadores — las mesas combinadas cuentan como 1 ocupada/libre,
  // pero la secundaria 'unida' se cuenta aparte para que el total cuadre
  const contPorEstado = (est) => {
    if (est === 'unida') {
      return lista.filter(m => m.estado === 'unida').length;
    }
    return mesasParaMostrar.filter(m => m.estado === est).length;
  };

  return (
    <Layout>
      <div style={s.page}>

        {/* Header */}
        <div style={s.pageHeader}>
          <div>
            <h1 style={s.titulo}>Mesas</h1>
            <p style={s.subtitulo}>
              {lista.length} mesas configuradas · {mesasParaMostrar.filter(
                m => m.esCombinada
              ).length} combinaciones activas
            </p>
          </div>
          <button style={s.btnPrimario}
            onClick={() => { setForm(FORM_VACIO); setModal('crear'); }}>
            + Nueva mesa
          </button>
        </div>

        {mensaje && <div style={s.toast}>{mensaje}</div>}
        {error   && <div style={s.toastErr}>{error}</div>}

        {/* Resumen por estado */}
        <div style={s.estadoGrid}>
          {Object.entries(ESTADO_INFO).map(([est, info]) => (
            <div key={est} style={{ ...s.estadoCard,
                                     background:info.bg,
                                     borderColor:info.color+'30' }}>
              <div style={{ fontSize:28, fontWeight:800,
                             color:info.color }}>
                {contPorEstado(est)}
              </div>
              <div style={{ fontSize:12, color:info.color,
                             fontWeight:500 }}>
                {info.icon} {info.label}s
              </div>
            </div>
          ))}
        </div>

        {/* Mapa de mesas */}
        {loading ? (
          <div style={s.empty}>Cargando mesas...</div>
        ) : mesasParaMostrar.length === 0 ? (
          <div style={s.empty}>
            No hay mesas configuradas. Crea la primera.
          </div>
        ) : (
          <div style={s.mesasGrid}>
            {mesasParaMostrar.map(mesa => {
              const ei = mesa.esCombinada
                ? { bg:'#EEF2FF', color:'#4338CA', icon:'⛓',
                    label:'Combinada' }
                : (ESTADO_INFO[mesa.estado] || ESTADO_INFO.libre);
              return (
                <div key={mesa.id_mesa + (mesa.esCombinada ? '-combo' : '')}
                  style={{
                    ...s.mesaCard,
                    background: ei.bg,
                    borderColor: ei.color + '40',
                    borderStyle: mesa.esCombinada ? 'dashed' : 'solid',
                  }}>
                  <div style={s.mesaTop}>
                    <span style={{ ...s.mesaEstadoPill,
                                    background:'rgba(255,255,255,0.7)',
                                    color:ei.color }}>
                      {ei.icon} {mesa.esCombinada
                        ? `Combinada (${ESTADO_INFO[mesa.estado]?.label})`
                        : ei.label}
                    </span>
                  </div>
                  <div style={{
                    fontSize: mesa.esCombinada ? 17 : 22,
                    fontWeight:800, color:ei.color, marginBottom:4,
                  }}>
                    {mesa.identificador_mesa}
                  </div>
                  <div style={{ fontSize:12, color:ei.color, opacity:0.7 }}>
                    Cap. {mesa.capacidad} personas
                  </div>
                  <div style={s.mesaAcciones}>
                    {mesa.esCombinada ? (
                      <button style={{ ...s.mesaBtn,
                                        background:'rgba(180,83,9,0.12)',
                                        color:'#B45309' }}
                        onClick={() => handleDesunir(mesa)}>
                        🔓 Separar
                      </button>
                    ) : (
                      <>
                        <button style={{ ...s.mesaBtn,
                                          background:'rgba(255,255,255,0.8)',
                                          color:ei.color }}
                          onClick={() => {
                            setSel(mesa);
                            setForm({
                              identificador_mesa: mesa.identificador_mesa,
                              capacidad:          mesa.capacidad,
                              estado:             mesa.estado,
                            });
                            setModal('editar');
                          }}>
                          ✏️ Editar
                        </button>
                        <button style={{ ...s.mesaBtn,
                                          background:'rgba(220,38,38,0.1)',
                                          color:'#DC2626' }}
                          onClick={() => {
                            setSel(mesa); setModal('eliminar');
                          }}>
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal crear/editar */}
        {(modal === 'crear' || modal === 'editar') && (
          <div style={s.overlay}>
            <div style={{ ...s.modal, maxWidth:420 }}>
              <div style={s.modalHeader}>
                <h3 style={s.modalTitulo}>
                  {modal === 'crear' ? '+ Nueva mesa' : 'Editar mesa'}
                </h3>
                <button style={s.closeBtn}
                  onClick={() => setModal(null)}>✕</button>
              </div>
              <div style={s.modalBody}>
                <div style={{ marginBottom:14 }}>
                  <label style={s.label}>
                    Identificador * (ej: Mesa 1, VIP-A, Terraza 3)
                  </label>
                  <input style={s.input}
                    placeholder="Mesa 1"
                    value={form.identificador_mesa}
                    onChange={e => setForm({
                      ...form, identificador_mesa: e.target.value
                    })} />
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={s.label}>Capacidad (personas)</label>
                  <input style={s.input} type="number"
                    min="1" value={form.capacidad}
                    onChange={e => setForm({
                      ...form, capacidad: parseInt(e.target.value)
                    })} />
                </div>
                {modal === 'editar' && (
                  <div>
                    <label style={s.label}>Estado</label>
                    <div style={s.estadoSelector}>
                      {['libre','ocupada','reservada'].map(est => {
                        const info = ESTADO_INFO[est];
                        return (
                          <button key={est} style={{
                            ...s.estadoOpc,
                            background: form.estado === est
                              ? info.bg : '#F9FAFB',
                            borderColor: form.estado === est
                              ? info.color : '#E8EAF0',
                            color: form.estado === est
                              ? info.color : '#9CA3AF',
                          }} onClick={() => setForm({
                            ...form, estado:est
                          })}>
                            {info.icon} {info.label}
                          </button>
                        );
                      })}
                    </div>
                    <p style={{ fontSize:11, color:'#9CA3AF', marginTop:8 }}>
                      Nota: el estado "Unida" se gestiona automáticamente
                      desde el módulo de mesero al combinar mesas.
                    </p>
                  </div>
                )}
              </div>
              <div style={s.modalFooter}>
                <button style={s.btnSecundario}
                  onClick={() => setModal(null)}>Cancelar</button>
                <button style={s.btnPrimario}
                  onClick={modal === 'crear'
                    ? handleCrear : handleEditar}>
                  {modal === 'crear' ? 'Crear mesa' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal eliminar */}
        {modal === 'eliminar' && (
          <div style={s.overlay}>
            <div style={{ ...s.modal, maxWidth:380 }}>
              <div style={s.modalHeader}>
                <h3 style={s.modalTitulo}>Eliminar mesa</h3>
                <button style={s.closeBtn}
                  onClick={() => setModal(null)}>✕</button>
              </div>
              <div style={{ ...s.modalBody, textAlign:'center' }}>
                <div style={{ fontSize:40, marginBottom:12 }}>⚠️</div>
                <p style={{ fontSize:14, color:'#374151', lineHeight:1.6 }}>
                  ¿Eliminar la mesa{' '}
                  <strong>{sel?.identificador_mesa}</strong>?
                  Los pedidos históricos se desvincularán.
                </p>
              </div>
              <div style={s.modalFooter}>
                <button style={s.btnSecundario}
                  onClick={() => setModal(null)}>Cancelar</button>
                <button style={{ ...s.btnPrimario,
                                  background:'#DC2626' }}
                  onClick={handleEliminar}>Eliminar</button>
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
  toast:      { background:'#ECFDF5', color:'#059669',
                padding:'10px 14px', borderRadius:'8px',
                marginBottom:12, fontSize:13 },
  toastErr:   { background:'#FEF2F2', color:'#DC2626',
                padding:'10px 14px', borderRadius:'8px',
                marginBottom:12, fontSize:13 },
  estadoGrid: { display:'grid',
                gridTemplateColumns:'repeat(4,minmax(0,1fr))',
                gap:10, marginBottom:'1.5rem' },
  estadoCard: { borderRadius:'12px', padding:'16px',
                textAlign:'center', border:'1px solid',
                display:'flex', flexDirection:'column',
                alignItems:'center', gap:4 },
  mesasGrid:  { display:'grid',
                gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))',
                gap:12 },
  mesaCard:   { borderRadius:'14px', padding:'1rem',
                border:'2px solid', display:'flex',
                flexDirection:'column', alignItems:'center',
                gap:6, textAlign:'center',
                boxShadow:'0 1px 3px rgba(0,0,0,0.04)',
                transition:'all .15s' },
  mesaTop:    { width:'100%', display:'flex',
                justifyContent:'center' },
  mesaEstadoPill:{ fontSize:10, fontWeight:600,
                   padding:'2px 8px', borderRadius:'20px',
                   whiteSpace:'nowrap' },
  mesaAcciones:{ display:'flex', gap:6, marginTop:6 },
  mesaBtn:    { padding:'5px 10px', borderRadius:'7px',
                border:'none', cursor:'pointer', fontSize:12,
                fontWeight:500, transition:'all .15s' },
  empty:      { textAlign:'center', color:'#9CA3AF', padding:'3rem',
                background:'#fff', borderRadius:'12px',
                fontSize:14, border:'1px solid #E8EAF0' },
  overlay:    { position:'fixed', inset:0,
                background:'rgba(15,22,40,0.5)',
                display:'flex', alignItems:'center',
                justifyContent:'center', zIndex:200,
                padding:'1rem', backdropFilter:'blur(2px)' },
  modal:      { background:'#fff', borderRadius:'16px',
                width:'100%', maxWidth:540,
                maxHeight:'90vh', overflowY:'auto',
                boxShadow:'0 20px 60px rgba(0,0,0,0.15)' },
  modalHeader:{ display:'flex', justifyContent:'space-between',
                alignItems:'center', padding:'1.25rem 1.5rem',
                borderBottom:'1px solid #F3F4F6',
                position:'sticky', top:0,
                background:'#fff', zIndex:1 },
  modalTitulo:{ fontSize:16, fontWeight:700, color:'#0F1628', margin:0 },
  closeBtn:   { background:'#F3F4F6', border:'none',
                borderRadius:'50%', width:28, height:28,
                cursor:'pointer', color:'#6B7280', fontSize:14,
                display:'flex', alignItems:'center',
                justifyContent:'center' },
  modalBody:  { padding:'1.25rem 1.5rem' },
  label:      { fontSize:12, fontWeight:600, color:'#374151',
                display:'block', marginBottom:5 },
  input:      { width:'100%', padding:'9px 12px', borderRadius:'8px',
                border:'1px solid #E8EAF0', fontSize:13,
                color:'#0F1628', outline:'none' },
  estadoSelector:{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr',
                   gap:8 },
  estadoOpc:  { padding:'8px', borderRadius:'8px',
                border:'1.5px solid', cursor:'pointer',
                fontSize:11, fontWeight:500,
                transition:'all .15s' },
  modalFooter:{ display:'flex', gap:8, justifyContent:'flex-end',
                padding:'1rem 1.5rem',
                borderTop:'1px solid #F3F4F6',
                position:'sticky', bottom:0, background:'#fff' },
  btnPrimario:{ padding:'9px 20px', borderRadius:'8px',
                background:'#6366F1', color:'#fff',
                border:'none', cursor:'pointer',
                fontSize:13, fontWeight:600 },
  btnSecundario:{ padding:'9px 20px', borderRadius:'8px',
                  background:'#F3F4F6', color:'#6B7280',
                  border:'none', cursor:'pointer', fontSize:13 },
};
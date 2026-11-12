import { useEffect, useState } from 'react';
import { getRecetas, getNotificaciones,
         marcarNotifLeida, getDisponibilidad,
         cambiarEstado, getInsumos } from '../../../services/inventarioService';

export default function TabRecetasCocina() {
  const [recetas,  setRecetas]  = useState([]);
  const [notifs,   setNotifs]   = useState([]);
  const [dispon,   setDispon]   = useState([]);
  const [insumos,  setInsumos]  = useState([]);
  const [vista,    setVista]    = useState('recetas');
  const [formEst,  setFormEst]  = useState({
    id_insumo:'', cantidad:'', estado:'utilizado', motivo:''
  });
  const [msg,   setMsg]   = useState('');
  const [error, setError] = useState('');

  const cargar = () => {
    getRecetas().then(r => setRecetas(r.data));
    getNotificaciones().then(r => setNotifs(r.data));
    getDisponibilidad().then(r => setDispon(r.data));
    getInsumos().then(r =>
      setInsumos(r.data.filter(i => i.stock_utilizacion > 0))
    );
  };

  useEffect(() => {
    cargar();
    const iv = setInterval(() => {
      getNotificaciones().then(r => setNotifs(r.data));
    }, 15000);
    return () => clearInterval(iv);
  }, []);

  const mostrar = (m, err=false) => {
    err ? setError(m) : setMsg(m);
    setTimeout(() => { setMsg(''); setError(''); }, 3000);
  };

  const leerNotif = async (id) => {
    await marcarNotifLeida(id);
    setNotifs(notifs.filter(n => n.id_notificacion !== id));
  };

  const handleCambiarEstado = async () => {
    if (!formEst.id_insumo || !formEst.cantidad) {
      mostrar('Selecciona insumo y cantidad', true); return;
    }
    try {
      await cambiarEstado({
        id_insumo: formEst.id_insumo,
        cantidad:  formEst.cantidad,
        estado:    formEst.estado,
        motivo:    formEst.motivo,
      });
      mostrar(`Insumo marcado como ${formEst.estado}`);
      setFormEst({ id_insumo:'', cantidad:'', estado:'utilizado', motivo:'' });
      cargar();
    } catch (e) {
      mostrar(e.response?.data?.error || 'Error', true);
    }
  };

  return (
    <div>
      {msg   && <div style={s.toast}>{msg}</div>}
      {error && <div style={s.toastErr}>{error}</div>}

      {/* Notificaciones pendientes */}
      {notifs.length > 0 && (
        <div style={s.notifBanner}>
          <div style={s.notifTitle}>
            🔔 {notifs.length} notificación{notifs.length > 1 ? 'es' : ''} de recetas
          </div>
          {notifs.map(n => (
            <div key={n.id_notificacion} style={s.notifItem}>
              <span style={{ fontSize:13, color:'#854F0B', flex:1 }}>
                {n.mensaje}
              </span>
              <button style={s.notifBtn}
                onClick={() => leerNotif(n.id_notificacion)}>
                ✓ Visto
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Sub-navegación */}
      <div style={s.subNav}>
        {[
          { id:'recetas',     label:'📋 Recetas' },
          { id:'disponible',  label:'📊 Disponibilidad' },
          { id:'estado',      label:'🔄 Cambiar estado insumo' },
        ].map(v => (
          <button key={v.id} style={{
            ...s.subBtn,
            background: vista === v.id ? '#EF4444' : 'rgba(255,255,255,0.1)',
            color:      vista === v.id ? '#fff'    : '#8AADCA',
          }} onClick={() => setVista(v.id)}>
            {v.label}
          </button>
        ))}
      </div>

      {/* Recetas */}
      {vista === 'recetas' && (
        <div style={s.lista}>
          {recetas.map(r => (
            <div key={r.id_receta} style={s.recCard}>
              <div style={s.recTitle}>{r.producto_nombre}</div>
              {r.descripcion && (
                <div style={s.recDesc}>{r.descripcion}</div>
              )}
              <div style={s.ingLista}>
                {r.detalles.map(d => (
                  <div key={d.id_detalle_receta} style={s.ingRow}>
                    <span style={{ color:'#FAC775', fontWeight:600,
                                   fontSize:13 }}>
                      {d.cantidad_por_porcion} {d.unidad_medida}
                    </span>
                    <span style={{ fontSize:13, color:'#fff' }}>
                      {d.insumo_nombre}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Disponibilidad */}
      {vista === 'disponible' && (
        <div style={s.lista}>
          {dispon.map((d, i) => (
            <div key={i} style={{
              ...s.dispCard,
              borderLeftColor: d.porciones_posibles <= 5
                ? '#EF4444' : '#10B981',
            }}>
              <div style={s.dispRow}>
                <span style={{ fontSize:14, fontWeight:700,
                               color:'#fff' }}>
                  {d.producto}
                </span>
                <span style={{
                  fontSize:18, fontWeight:800,
                  color: d.porciones_posibles <= 5 ? '#EF4444'
                       : d.porciones_posibles <= 10 ? '#FAC775'
                       : '#10B981',
                }}>
                  {d.porciones_posibles} porciones
                </span>
              </div>
              {d.alertas.map((a, j) => (
                <div key={j} style={s.alertaRow}>
                  ⚠️ {a.insumo}: {a.stock} {a.unidad}
                  — solo {a.porciones} porciones posibles
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Cambiar estado de insumo */}
      {vista === 'estado' && (
        <div style={s.estadoForm}>
          <h3 style={{ color:'#fff', fontSize:15,
                       fontWeight:700, margin:'0 0 14px' }}>
            Cambiar estado de insumo
          </h3>
          <div style={{ marginBottom:12 }}>
            <label style={s.labelDark}>Insumo en utilización</label>
            <select style={s.inputDark} value={formEst.id_insumo}
              onChange={e => setFormEst({...formEst, id_insumo:e.target.value})}>
              <option value="">Seleccionar insumo</option>
              {insumos.map(i => (
                <option key={i.id_insumo} value={i.id_insumo}>
                  {i.nombre} — {i.stock_utilizacion} {i.unidad_medida}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={s.labelDark}>Nuevo estado</label>
            <div style={{ display:'flex', gap:8 }}>
              {[
                { v:'utilizado',    l:'✅ Utilizado'  },
                { v:'desperdiciado',l:'🗑️ Desperdiciado' },
              ].map(t => (
                <button key={t.v} style={{
                  flex:1, padding:'10px', borderRadius:'8px',
                  border:'1.5px solid',
                  background: formEst.estado === t.v
                    ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                  color:       formEst.estado === t.v ? '#fff' : '#8AADCA',
                  borderColor: formEst.estado === t.v ? '#fff' : '#2E3F52',
                  cursor:'pointer', fontSize:13,
                }} onClick={() => setFormEst({...formEst, estado:t.v})}>
                  {t.l}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={s.labelDark}>Cantidad</label>
            <input style={s.inputDark} type="number" step="0.01"
              value={formEst.cantidad}
              onChange={e => setFormEst({...formEst, cantidad:e.target.value})} />
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={s.labelDark}>Motivo (opcional)</label>
            <input style={s.inputDark} value={formEst.motivo}
              onChange={e => setFormEst({...formEst, motivo:e.target.value})} />
          </div>
          <button style={s.btnAccion} onClick={handleCambiarEstado}>
            Confirmar cambio de estado
          </button>
        </div>
      )}
    </div>
  );
}

const s = {
  toast:     { background:'#1A3A2A', color:'#9FE1CB', padding:'10px 14px', borderRadius:'8px', marginBottom:12, fontSize:13 },
  toastErr:  { background:'#3A1A1A', color:'#EF4444', padding:'10px 14px', borderRadius:'8px', marginBottom:12, fontSize:13 },
  notifBanner:{ background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:'10px', padding:'12px 14px', marginBottom:'1rem' },
  notifTitle:{ fontSize:13, fontWeight:700, color:'#FAC775', marginBottom:8 },
  notifItem: { display:'flex', alignItems:'center', gap:10, padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' },
  notifBtn:  { padding:'4px 12px', borderRadius:'6px', background:'rgba(245,158,11,0.2)', border:'1px solid #FAC775', color:'#FAC775', cursor:'pointer', fontSize:12 },
  subNav:    { display:'flex', gap:8, marginBottom:'1rem', flexWrap:'wrap' },
  subBtn:    { padding:'7px 14px', borderRadius:'20px', border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer', fontSize:12 },
  lista:     { display:'flex', flexDirection:'column', gap:10 },
  recCard:   { background:'rgba(255,255,255,0.05)', borderRadius:'12px', padding:'1rem', border:'1px solid rgba(255,255,255,0.08)' },
  recTitle:  { fontSize:15, fontWeight:700, color:'#fff', marginBottom:4 },
  recDesc:   { fontSize:12, color:'#8AADCA', marginBottom:10, fontStyle:'italic' },
  ingLista:  { display:'flex', flexDirection:'column', gap:6 },
  ingRow:    { display:'flex', alignItems:'center', gap:10 },
  dispCard:  { background:'rgba(255,255,255,0.05)', borderRadius:'12px', padding:'1rem', border:'1px solid rgba(255,255,255,0.08)', borderLeft:'4px solid' },
  dispRow:   { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 },
  alertaRow: { fontSize:12, color:'#FAC775', marginTop:4 },
  estadoForm:{ background:'rgba(255,255,255,0.05)', borderRadius:'12px', padding:'1.25rem', border:'1px solid rgba(255,255,255,0.08)', maxWidth:480 },
  labelDark: { fontSize:12, fontWeight:600, color:'#8AADCA', display:'block', marginBottom:5 },
  inputDark: { width:'100%', padding:'9px 12px', borderRadius:'8px', border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'#fff', fontSize:13, outline:'none' },
  btnAccion: { width:'100%', padding:'11px', borderRadius:'8px', background:'#EF4444', color:'#fff', border:'none', cursor:'pointer', fontSize:14, fontWeight:600 },
};
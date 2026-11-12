import { useEffect, useState } from 'react';
import { getMermas, crearMerma,
         getInsumos } from '../../../services/inventarioService';

export default function TabMerma() {
  const [mermas,  setMermas]  = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [modo,    setModo]    = useState('hoy');      // 'hoy' | 'todo' | 'rango'
  const [rango,   setRango]   = useState({ desde:'', hasta:'' });
  const [form,    setForm]    = useState({
    id_insumo:'', cantidad:'', tipo_merma:'sobrante', motivo:''
  });
  const [msg,   setMsg]   = useState('');
  const [error, setError] = useState('');

  const cargar = () => {
    const params = modo === 'todo'  ? { todo:'true' }
                 : modo === 'rango' ? { desde:rango.desde, hasta:rango.hasta }
                 : {};
    getMermas(params).then(r => setMermas(r.data));
  };

  useEffect(() => { cargar(); }, [modo, rango]);
  useEffect(() => { getInsumos().then(r => setInsumos(r.data)); }, []);

  const mostrar = (texto, err = false) => {
    err ? setError(texto) : setMsg(texto);
    setTimeout(() => { setMsg(''); setError(''); }, 3000);
  };

  const handleRegistrar = async () => {
    if (!form.id_insumo || !form.cantidad) {
      mostrar('Selecciona insumo y cantidad', true); return;
    }
    try {
      await crearMerma(form);
      mostrar('Merma registrada correctamente');
      setForm({ id_insumo:'', cantidad:'', tipo_merma:'sobrante', motivo:'' });
      cargar();
    } catch (e) {
      mostrar(e.response?.data?.error || 'Error al registrar', true);
    }
  };

  const suma = (tipo) => mermas
    .filter(x => x.tipo_merma === tipo)
    .reduce((acc, x) => acc + parseFloat(x.cantidad || 0), 0)
    .toFixed(2);

  return (
    <div>
      {msg   && <div style={s.toast}>{msg}</div>}
      {error && <div style={s.toastErr}>{error}</div>}

      {/* Selector de período */}
      <div style={s.periodo}>
        {[['hoy','Hoy'], ['todo','Todo el historial'], ['rango','Rango']].map(([v, l]) => (
          <button key={v} onClick={() => setModo(v)}
            style={{ ...s.periodoBtn,
              background: modo === v ? '#6366F1' : '#fff',
              color:      modo === v ? '#fff'    : '#6B7280' }}>
            {l}
          </button>
        ))}
        {modo === 'rango' && (<>
          <input type="date" style={s.fecha} value={rango.desde}
            onChange={e => setRango({ ...rango, desde:e.target.value })} />
          <input type="date" style={s.fecha} value={rango.hasta}
            onChange={e => setRango({ ...rango, hasta:e.target.value })} />
        </>)}
      </div>

      {/* Resumen */}
      <div style={s.resumen}>
        <div style={s.resCard}>
          <div style={{ fontSize:22, fontWeight:800, color:'#B45309' }}>{suma('sobrante')}</div>
          <div style={{ fontSize:12, color:'#B45309' }}>Sobrante</div>
        </div>
        <div style={s.resCard}>
          <div style={{ fontSize:22, fontWeight:800, color:'#DC2626' }}>{suma('desperdicio')}</div>
          <div style={{ fontSize:12, color:'#DC2626' }}>Desperdiciado</div>
        </div>
        <div style={s.resCard}>
          <div style={{ fontSize:22, fontWeight:800, color:'#0F1628' }}>{mermas.length}</div>
          <div style={{ fontSize:12, color:'#6B7280' }}>Registros</div>
        </div>
      </div>

      <div style={s.layout}>
        {/* Formulario */}
        <div style={s.formCard}>
          <h3 style={s.formTitle}>Registrar merma</h3>

          <div style={{ marginBottom:12 }}>
            <label style={s.label}>Insumo</label>
            <select style={s.input} value={form.id_insumo}
              onChange={e => setForm({ ...form, id_insumo:e.target.value })}>
              <option value="">Seleccionar insumo</option>
              {insumos.map(i => (
                <option key={i.id_insumo} value={i.id_insumo}>
                  {i.nombre} — {i.stock_utilizacion} en uso
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom:12 }}>
            <label style={s.label}>Tipo de merma</label>
            <div style={s.tipoRow}>
              {[
                { v:'sobrante',    l:'🟡 Sobrante',    c:'#B45309', bg:'#FFFBEB' },
                { v:'desperdicio', l:'🔴 Desperdicio', c:'#DC2626', bg:'#FEF2F2' },
              ].map(t => (
                <button key={t.v}
                  style={{ ...s.tipoBtn,
                    background:  form.tipo_merma === t.v ? t.bg : '#F9FAFB',
                    color:       form.tipo_merma === t.v ? t.c  : '#6B7280',
                    borderColor: form.tipo_merma === t.v ? t.c  : '#E8EAF0' }}
                  onClick={() => setForm({ ...form, tipo_merma:t.v })}>
                  {t.l}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom:12 }}>
            <label style={s.label}>Cantidad</label>
            <input style={s.input} type="number" step="0.01" value={form.cantidad}
              onChange={e => setForm({ ...form, cantidad:e.target.value })} />
          </div>

          <div style={{ marginBottom:16 }}>
            <label style={s.label}>Motivo (opcional)</label>
            <textarea style={{ ...s.input, minHeight:60, resize:'vertical' }}
              value={form.motivo}
              placeholder="ej: Vencimiento, preparación excesiva, accidente"
              onChange={e => setForm({ ...form, motivo:e.target.value })} />
          </div>

          <button style={s.btnRegistrar} onClick={handleRegistrar}>
            Registrar merma
          </button>
        </div>

        {/* Lista */}
        <div style={s.lista}>
          {mermas.map(item => (
            <div key={item.id_merma} style={s.mermaItem}>
              <span style={{ fontSize:11, color:'#9CA3AF', width:80, flexShrink:0 }}>
                {new Date(item.fecha_registro).toLocaleDateString('es-PE',
                  { day:'2-digit', month:'2-digit', year:'2-digit' })}
              </span>
              <span style={{ ...s.pill,
                background: item.tipo_merma === 'sobrante' ? '#FFFBEB' : '#FEF2F2',
                color:      item.tipo_merma === 'sobrante' ? '#B45309' : '#DC2626' }}>
                {item.tipo_merma}
              </span>
              <span style={{ flex:1, fontSize:13, color:'#374151' }}>
                {item.insumo_nombre}
              </span>
              <span style={{ fontSize:14, fontWeight:700, color:'#0F1628' }}>
                {item.cantidad}
              </span>
              {item.motivo && (
                <span style={{ fontSize:12, color:'#9CA3AF', fontStyle:'italic' }}>
                  — {item.motivo}
                </span>
              )}
            </div>
          ))}
          {mermas.length === 0 && (
            <div style={s.empty}>No hay mermas registradas en este período.</div>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  toast:    { background:'#ECFDF5', color:'#059669', padding:'10px 14px', borderRadius:8, marginBottom:12, fontSize:13 },
  toastErr: { background:'#FEF2F2', color:'#DC2626', padding:'10px 14px', borderRadius:8, marginBottom:12, fontSize:13 },
  periodo:  { display:'flex', gap:8, marginBottom:'1rem', flexWrap:'wrap', alignItems:'center' },
  periodoBtn:{ padding:'7px 14px', borderRadius:20, border:'1px solid #E8EAF0', cursor:'pointer', fontSize:13 },
  fecha:    { padding:'7px 10px', borderRadius:8, border:'1px solid #E8EAF0', fontSize:13 },
  resumen:  { display:'grid', gridTemplateColumns:'repeat(3,minmax(0,1fr))', gap:10, marginBottom:'1.25rem' },
  resCard:  { background:'#fff', borderRadius:12, padding:14, border:'1px solid #E8EAF0', textAlign:'center' },
  layout:   { display:'grid', gridTemplateColumns:'340px 1fr', gap:16 },
  formCard: { background:'#fff', borderRadius:12, padding:'1.25rem', border:'1px solid #E8EAF0' },
  formTitle:{ fontSize:15, fontWeight:700, color:'#0F1628', margin:'0 0 14px' },
  label:    { fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 },
  input:    { width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #E8EAF0', fontSize:13, color:'#0F1628', outline:'none' },
  tipoRow:  { display:'flex', gap:8 },
  tipoBtn:  { flex:1, padding:9, borderRadius:8, border:'1.5px solid', cursor:'pointer', fontSize:13, fontWeight:500 },
  btnRegistrar:{ width:'100%', padding:11, borderRadius:8, background:'#DC2626', color:'#fff', border:'none', cursor:'pointer', fontSize:14, fontWeight:600 },
  lista:    { display:'flex', flexDirection:'column', gap:8 },
  mermaItem:{ background:'#fff', borderRadius:10, padding:'12px 14px', border:'1px solid #E8EAF0', display:'flex', alignItems:'center', gap:10 },
  pill:     { fontSize:11, fontWeight:500, padding:'3px 10px', borderRadius:20, flexShrink:0 },
  empty:    { textAlign:'center', color:'#9CA3AF', padding:'2rem', fontSize:14 },
};
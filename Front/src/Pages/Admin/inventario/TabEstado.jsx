import { useEffect, useMemo, useState } from 'react';
import { getInsumos, getMovimientos,
         getDisponibilidad } from '../../../services/inventarioService';

const num      = (v) => parseFloat(v || 0);
const fmtNum   = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(2));
const codigo   = (id) => `INS-${String(id).padStart(4, '0')}`;
const hoyLocal = () => new Date().toLocaleDateString('en-CA');

const TONO = {
  rojo:  { bg:'#FDE8E8', fg:'#B42318', borde:'#EF4444' },
  ambar: { bg:'#FEF3C7', fg:'#92400E', borde:'#F59E0B' },
  azul:  { bg:'#E0ECFF', fg:'#1D4ED8', borde:'#3B82F6' },
  verde: { bg:'#DCFCE7', fg:'#166534', borde:'#10B981' },
  gris:  { bg:'#F3F4F6', fg:'#4B5563', borde:'#D1D5DB' },
};

const COLUMNAS = [
  { id:'almacen',       titulo:'En almacén',     sub:'Stock disponible · listo para usar',  color:'#3B82F6', icono:'🏬' },
  { id:'utilizacion',   titulo:'En utilización', sub:'En cocina · disponible para platos',  color:'#F59E0B', icono:'🍳' },
  { id:'utilizado',     titulo:'Utilizado',      sub:'Consumido hoy en la preparación',     color:'#10B981', icono:'✅' },
  { id:'desperdiciado', titulo:'Desperdiciado',  sub:'Pérdidas registradas hoy',            color:'#EF4444', icono:'🗑️' },
];

export default function TabEstado() {
  const [datos,   setDatos]   = useState({ insumos:[], movs:[], disp:[] });
  const [loading, setLoading] = useState(true);
  const [filtro,  setFiltro]  = useState('todos');

  const cargar = () => {
    const hoy = hoyLocal();
    Promise.all([
      getInsumos(),
      getMovimientos({ desde:hoy, hasta:hoy }),
      getDisponibilidad().catch(() => ({ data:[] })),
    ])
      .then(([i, m, d]) => setDatos({ insumos:i.data, movs:m.data, disp:d.data }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargar();
    const iv = setInterval(cargar, 20000);
    return () => clearInterval(iv);
  }, []);

  const tarjetas = useMemo(() => {
    const { insumos, movs, disp } = datos;

    // Consumo de hoy por insumo
    const consumo = {};
    movs.forEach(m => {
      if (m.tipo_movimiento !== 'utilizado' && m.tipo_movimiento !== 'desperdiciado') return;
      if (!consumo[m.id_insumo]) consumo[m.id_insumo] = { util:0, desp:0, nUtil:0, motivo:'' };
      const c = consumo[m.id_insumo];
      if (m.tipo_movimiento === 'utilizado') { c.util += num(m.cantidad); c.nUtil += 1; }
      else { c.desp += num(m.cantidad); if (!c.motivo && m.motivo) c.motivo = m.motivo; }
    });

    // Insumos que alcanzan para pocos platos (RFN44)
    const escasez = {};
    disp.forEach(d => (d.alertas || []).forEach(a => {
      escasez[a.insumo] = Math.min(escasez[a.insumo] ?? Infinity, a.porciones);
    }));

    const out = [];
    insumos.forEach(i => {
      const alm = num(i.stock_almacen);
      const uso = num(i.stock_utilizacion);
      const min = num(i.stock_minimo);
      const u   = i.unidad_medida;
      const c   = consumo[i.id_insumo] || { util:0, desp:0, nUtil:0, motivo:'' };
      const base = {
        idInsumo:i.id_insumo, codigo:codigo(i.id_insumo), nombre:i.nombre,
        sub:`${i.categoria} · ${i.tipo_almacenaje}`, unidad:u, categoria:i.categoria,
      };
      const apareceEnOtra = uso > 0 || c.util > 0 || c.desp > 0;

      // ── En almacén ──
      if (alm > 0 || min > 0 || !apareceEnOtra) {
        const pct = min > 0 ? Math.min(100, Math.round(alm / (min * 2) * 100))
                            : (alm > 0 ? 100 : 0);
        let pill, alerta, color, esAlerta = true;
        if (alm <= 0) {
          pill = ['Agotado', 'rojo'];
          alerta = ['rojo', `Sin stock en almacén${min > 0 ? ` · mínimo ${fmtNum(min)} ${u}` : ''}`];
          color = '#EF4444';
        } else if (min > 0 && alm <= min) {
          pill = ['Stock bajo', 'ambar'];
          alerta = ['ambar', `Bajo el mínimo (${fmtNum(min)} ${u})`];
          color = '#F59E0B';
        } else {
          pill = ['Disponible', 'azul'];
          alerta = ['azul', min > 0 ? `Mínimo de alerta: ${fmtNum(min)} ${u}` : 'Sin mínimo definido'];
          color = '#3B82F6'; esAlerta = false;
        }
        out.push({ ...base, columna:'almacen', valor:alm, pct, pill, alerta, color, esAlerta });
      }

      // ── En utilización ──
      if (uso > 0) {
        const consumido = c.util + c.desp;
        const pct = Math.round(uso / (uso + consumido) * 100);
        const n = escasez[i.nombre];
        let pill, alerta, color, esAlerta = false;
        if (n !== undefined) {
          pill   = n === 0 ? ['Insuficiente', 'rojo'] : ['Por agotarse', 'ambar'];
          alerta = [n === 0 ? 'rojo' : 'ambar',
                    n === 0 ? 'No alcanza para ningún plato'
                            : `Alcanza para ${n} plato${n === 1 ? '' : 's'}`];
          color = n === 0 ? '#EF4444' : '#F59E0B'; esAlerta = true;
        } else {
          pill = ['En uso', 'azul'];
          alerta = ['gris', consumido > 0 ? `Consumido hoy: ${fmtNum(consumido)} ${u}`
                                          : 'Sin consumo registrado hoy'];
          color = '#6366F1';
        }
        out.push({ ...base, columna:'utilizacion', valor:uso, pct, pill, alerta, color, esAlerta });
      }

      // ── Utilizado ──
      if (c.util > 0) {
        out.push({ ...base, columna:'utilizado', valor:c.util, pct:100,
          pill:['Utilizado', 'verde'],
          alerta:['gris', `${c.nUtil} registro${c.nUtil === 1 ? '' : 's'} hoy`],
          color:'#10B981', esAlerta:false });
      }

      // ── Desperdiciado ──
      if (c.desp > 0) {
        const share = Math.round(c.desp / (c.util + c.desp) * 100);
        const alto  = share >= 20;
        out.push({ ...base, columna:'desperdiciado', valor:c.desp, pct:share,
          pill:['Desperdicio', 'rojo'],
          alerta: alto
            ? ['rojo', `Alto desperdicio · ${share}% de lo consumido${c.motivo ? ` · ${c.motivo}` : ''}`]
            : ['gris', c.motivo ? `Motivo: ${c.motivo}` : 'Sin motivo registrado'],
          color:'#EF4444', esAlerta:alto });
      }
    });
    return out;
  }, [datos]);

  const categorias = [...new Set(datos.insumos.map(i => i.categoria))];
  const unicos     = (arr) => new Set(arr.map(t => t.idInsumo)).size;
  const visibles   = tarjetas.filter(t =>
    filtro === 'todos' ? true : filtro === 'alerta' ? t.esAlerta : t.categoria === filtro);

  if (loading) return <div style={s.vacio}>Cargando estado de insumos…</div>;

  return (
    <div>
      {/* Filtros */}
      <div style={s.barra}>
        <div style={s.chips}>
          <Chip activo={filtro === 'todos'}  onClick={() => setFiltro('todos')}
                label="Todos" n={unicos(tarjetas)} />
          <Chip activo={filtro === 'alerta'} onClick={() => setFiltro('alerta')}
                label="Con alerta" n={unicos(tarjetas.filter(t => t.esAlerta))} />
          {categorias.map(cat => (
            <Chip key={cat} activo={filtro === cat} onClick={() => setFiltro(cat)}
                  label={cat.charAt(0).toUpperCase() + cat.slice(1)}
                  n={unicos(tarjetas.filter(t => t.categoria === cat))} />
          ))}
        </div>
        <span style={s.nota}>
          Almacén y utilización muestran el stock actual · Utilizado y desperdiciado, el movimiento de hoy.
        </span>
      </div>

      {/* Tablero */}
      <div style={s.tablero}>
        {COLUMNAS.map(col => {
          const items = visibles.filter(t => t.columna === col.id);
          return (
            <div key={col.id} style={s.columna}>
              <div style={s.colHead}>
                <span style={{ ...s.dot, background:col.color }} />
                <span style={s.colTitulo}>{col.titulo}</span>
                <span style={s.colN}>{items.length}</span>
              </div>
              <div style={s.colSub}>{col.sub}</div>

              <div style={s.colLista}>
                {items.length === 0 && <div style={s.colVacio}>Sin insumos</div>}
                {items.map(t => <Tarjeta key={`${col.id}-${t.idInsumo}`} t={t} icono={col.icono} />)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Chip({ activo, onClick, label, n }) {
  return (
    <button onClick={onClick} style={{ ...s.chip,
      background: activo ? '#0F1628' : '#fff',
      color:      activo ? '#fff'    : '#374151',
      borderColor: activo ? '#0F1628' : '#E8EAF0' }}>
      {label} <span style={{ opacity:0.7, marginLeft:4 }}>{n}</span>
    </button>
  );
}

function Tarjeta({ t, icono }) {
  const pill  = TONO[t.pill[1]];
  const strip = TONO[t.alerta[0]];
  return (
    <div style={{ ...s.card, borderLeft:`4px solid ${pill.borde}` }}>
      <div style={s.cardTop}>
        <span style={s.codigo}>{t.codigo}</span>
        <span style={{ ...s.pill, background:pill.bg, color:pill.fg }}>{t.pill[0]}</span>
      </div>
      <div style={s.nombre}>{t.nombre}</div>
      <div style={s.sub}>{t.sub}</div>
      <div style={s.barRow}>
        <div style={s.barTrack}>
          <div style={{ ...s.barFill, width:`${t.pct}%`, background:t.color }} />
        </div>
        <span style={s.pct}>{t.pct}%</span>
      </div>
      <div style={s.cantidad}>{icono} {fmtNum(t.valor)} {t.unidad}</div>
      <div style={{ ...s.strip, background:strip.bg, color:strip.fg }}>{t.alerta[1]}</div>
    </div>
  );
}

const s = {
  vacio:    { textAlign:'center', color:'#9CA3AF', padding:'3rem', fontSize:14 },
  barra:    { display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap', marginBottom:'1rem' },
  chips:    { display:'flex', gap:8, flexWrap:'wrap' },
  chip:     { padding:'7px 14px', borderRadius:20, border:'1px solid', cursor:'pointer', fontSize:12, fontWeight:600 },
  nota:     { fontSize:11.5, color:'#9CA3AF', maxWidth:380, textAlign:'right' },
  tablero:  { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))', gap:14, alignItems:'start' },
  columna:  { background:'#F4F5FA', borderRadius:18, padding:'14px 12px' },
  colHead:  { display:'flex', alignItems:'center', gap:8, padding:'0 4px' },
  dot:      { width:9, height:9, borderRadius:'50%' },
  colTitulo:{ fontSize:14, fontWeight:700, color:'#0F1628', flex:1 },
  colN:     { background:'#fff', borderRadius:12, padding:'1px 9px', fontSize:12, fontWeight:700, color:'#374151' },
  colSub:   { fontSize:11.5, color:'#6B7280', padding:'3px 4px 12px' },
  colLista: { display:'flex', flexDirection:'column', gap:10, maxHeight:'62vh', overflowY:'auto' },
  colVacio: { textAlign:'center', color:'#9CA3AF', fontSize:12, padding:'1.5rem 0' },
  card:     { background:'#fff', borderRadius:14, padding:'12px 14px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' },
  cardTop:  { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 },
  codigo:   { fontSize:11, fontWeight:700, color:'#6B7280', letterSpacing:'.04em' },
  pill:     { fontSize:10.5, fontWeight:700, padding:'3px 10px', borderRadius:20 },
  nombre:   { fontSize:15, fontWeight:700, color:'#0F1628' },
  sub:      { fontSize:12, color:'#6B7280', margin:'2px 0 10px', textTransform:'capitalize' },
  barRow:   { display:'flex', alignItems:'center', gap:10, marginBottom:8 },
  barTrack: { flex:1, height:6, background:'#EEF0F5', borderRadius:6, overflow:'hidden' },
  barFill:  { height:'100%', borderRadius:6, transition:'width .4s ease' },
  pct:      { fontSize:12, fontWeight:700, color:'#374151', minWidth:34, textAlign:'right' },
  cantidad: { fontSize:12.5, color:'#4B5563', marginBottom:10 },
  strip:    { fontSize:11.5, fontWeight:600, padding:'7px 10px', borderRadius:8 },
};
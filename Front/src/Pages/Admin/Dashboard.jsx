import { useEffect, useState } from 'react';
import Layout from '../../components/admin/Layout';
import { getDashboard } from '../../services/adminService';

export default function Dashboard() {
  const [data, setData]   = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboard()
      .then(r => setData(r.data))
      .catch(() => setError('Error al cargar el dashboard'));
  }, []);

  if (!data) return (
    <Layout>
      <p style={{ color:'#888', textAlign:'center', marginTop:'3rem' }}>
        Cargando...
      </p>
    </Layout>
  );

  return (
    <Layout>
      <div style={s.page}>
        <div style={s.pageHeader}>
          <h1 style={s.titulo}>Dashboard</h1>
          <span style={s.fecha}>📅 {data.fecha}</span>
        </div>

        {error && <div style={s.error}>{error}</div>}

        {/* Tarjetas de métricas */}
        <div style={s.grid}>
          <Tarjeta titulo="Usuarios" color="#EEEDFE" borde="#534AB7"
            items={[
              { l:'Total',          v: data.usuarios.total },
              { l:'Administradores',v: data.usuarios.administradores },
              { l:'Meseros',        v: data.usuarios.meseros },
              { l:'Cocineros',      v: data.usuarios.cocineros },
              { l:'Cajeros',        v: data.usuarios.cajeros },
            ]}
          />
          <Tarjeta titulo="Productos" color="#E1F5EE" borde="#0F6E56"
            items={[
              { l:'Total',       v: data.productos.total },
              { l:'Disponibles', v: data.productos.disponibles },
              { l:'Entradas',    v: data.productos.por_categoria.entradas },
              { l:'Segundos',    v: data.productos.por_categoria.segundos },
              { l:'Bebidas',     v: data.productos.por_categoria.bebidas },
            ]}
          />
          <Tarjeta titulo="Mesas" color="#FAEEDA" borde="#854F0B"
            items={[
              { l:'Total',    v: data.mesas.total },
              { l:'Libres',   v: data.mesas.libres },
              { l:'Ocupadas', v: data.mesas.ocupadas },
            ]}
          />
          <Tarjeta titulo="Pedidos activos" color="#E6F1FB" borde="#185FA5"
            items={[
              { l:'Total',       v: data.pedidos.total },
              { l:'En cocina',   v: data.pedidos.en_cocina },
              { l:'Listos',      v: data.pedidos.listos },
              { l:'Despachados', v: data.pedidos.despachados },
            ]}
          />
          <Tarjeta titulo="Caja hoy" color="#FAECE7" borde="#993C1D"
            items={[
              { l:'Transacciones', v: data.pagos.total_hoy },
            ]}
          />
          <Tarjeta titulo="Reclamos" color="#EAF3DE" borde="#3B6D11"
            items={[
              { l:'Pendientes', v: data.reclamos.pendientes },
            ]}
          />
        </div>
      </div>
    </Layout>
  );
}

function Tarjeta({ titulo, color, borde, items }) {
  return (
    <div style={{ background:color, borderRadius:10, padding:'1rem 1.25rem',
                  borderLeft:`4px solid ${borde}` }}>
      <h3 style={{ margin:'0 0 10px', color:borde, fontSize:13,
                   textTransform:'uppercase', letterSpacing:'.05em' }}>
        {titulo}
      </h3>
      {items.map(i => (
        <div key={i.l} style={{ display:'flex', justifyContent:'space-between',
                                fontSize:13, padding:'4px 0',
                                borderBottom:'1px solid rgba(0,0,0,0.06)' }}>
          <span style={{ color:'#555' }}>{i.l}</span>
          <span style={{ fontWeight:700, fontSize:15 }}>{i.v}</span>
        </div>
      ))}
    </div>
  );
}

const s = {
  page:       { maxWidth:1100 },
  pageHeader: { display:'flex', justifyContent:'space-between',
                alignItems:'center', marginBottom:'1.5rem' },
  titulo:     { fontSize:22, fontWeight:700, color:'#1E2D40', margin:0 },
  fecha:      { fontSize:13, color:'#888' },
  grid:       { display:'grid',
                gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',
                gap:12 },
  error:      { background:'#FAECE7', color:'#993C1D', padding:'10px 14px',
                borderRadius:8, marginBottom:12, fontSize:13 },
};
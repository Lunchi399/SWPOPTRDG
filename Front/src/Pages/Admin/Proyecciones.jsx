import { useState } from 'react';
import Layout from '../../components/Admin/Layout';
import TabDashboard    from './proyecciones/TabDashboard';
import TabDemanda      from './proyecciones/TabDemanda';
import TabInsumos      from './proyecciones/TabInsumos';
import TabRentabilidad from './proyecciones/TabRentabilidad';
import TabFinanzas     from './proyecciones/TabFinanzas';
import TabCompras      from './proyecciones/TabCompras';
import TabPrecios      from './proyecciones/TabPrecios';
import TabGuardados    from './proyecciones/TabGuardados';

const TABS = [
  { id: 'dashboard',    label: '📊 Dashboard',     C: TabDashboard },
  { id: 'demanda',      label: '🍽️ Demanda',       C: TabDemanda },
  { id: 'insumos',      label: '📦 Insumos y gasto', C: TabInsumos },
  { id: 'rentabilidad', label: '💹 Rentabilidad',  C: TabRentabilidad },
  { id: 'finanzas',     label: '🏦 Ingresos y gastos', C: TabFinanzas },
  { id: 'compras',      label: '🛒 Plan de compras', C: TabCompras },
  { id: 'precios',      label: '🏷️ Precios',        C: TabPrecios },
  { id: 'guardados',    label: '🗂️ Guardados',      C: TabGuardados },
];

export default function Proyecciones() {
  const [tab, setTab] = useState('dashboard');
  const Activa = TABS.find(t => t.id === tab).C;
  return (
    <Layout>
      <div style={s.pagina}>
        <div style={s.header}>
          <span style={{ fontSize: 34 }}>📈</span>
          <div>
            <h1 style={s.titulo}>Proyecciones</h1>
            <p style={s.subtitulo}>Demanda, insumos, compras y rentabilidad estimada</p>
          </div>
        </div>
        <div style={s.tabs}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ ...s.tab, ...(tab === t.id ? s.tabActiva : {}) }}>{t.label}</button>
          ))}
        </div>
        <Activa key={tab} />
      </div>
    </Layout>
  );
}

const s = {
  pagina:    { padding: '2.5rem 2.75rem', minHeight: '100vh', background: '#F8F9FC', boxSizing: 'border-box' },
  header:    { display: 'flex', alignItems: 'center', gap: 14, marginBottom: '1.5rem' },
  titulo:    { fontSize: 28, fontWeight: 800, color: '#0F1628', margin: 0, letterSpacing: '-0.02em' },
  subtitulo: { fontSize: 14, color: '#6B7280', margin: '2px 0 0' },
  tabs:      { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1.5rem' },
  tab:       { padding: '10px 16px', borderRadius: 12, border: '1px solid #E6E9F2', background: '#fff', color: '#6B7280', cursor: 'pointer', fontSize: 13.5, fontWeight: 600 },
  tabActiva: { background: '#6366F1', color: '#fff', borderColor: '#6366F1' },
};

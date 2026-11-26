import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fmtFecha, fmtS } from './utilidades';

// Barras "real" vs "proyectado" a partir de [{fecha, valor, tipo}]
export function GraficoSerie({ serie, formato = fmtS, alto = 260 }) {
  const datos = serie.map(p => ({
    fecha: fmtFecha(p.fecha),
    real: p.tipo === 'real' ? p.valor : null,
    proyectado: p.tipo === 'proyectado' ? p.valor : null,
  }));
  return (
    <ResponsiveContainer width="100%" height={alto}>
      <BarChart data={datos}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E6E9F2" />
        <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v) => formato(v)} />
        <Legend />
        <Bar dataKey="real" name="Real" fill="#2563EB" radius={[4, 4, 0, 0]} />
        <Bar dataKey="proyectado" name="Proyectado" fill="#F59E0B" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Barras agrupadas por período (finanzas)
export function GraficoFinanzas({ periodos, alto = 280 }) {
  const datos = periodos.map(p => ({
    periodo: fmtFecha(p.periodo), Ingresos: p.ingresos, Compras: p.gastos_compras, Neto: p.resultado_neto,
  }));
  return (
    <ResponsiveContainer width="100%" height={alto}>
      <BarChart data={datos}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E6E9F2" />
        <XAxis dataKey="periodo" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v) => fmtS(v)} />
        <Legend />
        <Bar dataKey="Ingresos" fill="#10B981" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Compras" fill="#EF4444" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Neto" fill="#2563EB" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

import api from './api';

const auth = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('access')}` }
});

// CU15 — Pedidos listos para cobrar
export const getPedidosPorCobrar = () =>
  api.get('/caja/pedidos/', auth());

// CU15 — Calcular total con IGV
export const calcularTotal = (idPedido) =>
  api.get(`/caja/calcular/${idPedido}/`, auth());

// CU16 — Registrar pago
export const registrarPago = (data) =>
  api.post('/caja/pago/', data, auth());

// CU17 — Reclamo desde caja
export const crearReclamoCaja = (data) =>
  api.post('/caja/reclamo/', data, auth());

// CU16 — Cuadre de caja
export const getCuadreCaja = () =>
  api.get('/caja/cuadre/', auth());

// CU28 — Historial de pagos
export const getHistorialPagos = () =>
  api.get('/caja/historial/', auth());
import api from './api';

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('access')}` }
});

export const getPedidosPorMesa = ()       => api.get('/pedidos-por-mesa/', getAuthHeader());
export const registrarPago     = (data)   => api.post('/pagos/', data, getAuthHeader());
export const getCuadreCaja     = ()       => api.get('/cuadre-caja/', getAuthHeader());
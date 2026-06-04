import api from './api';

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('access')}` }
});

export const getPedidosPorMesa = () =>
  api.get('/pedidos-por-mesa/', getAuthHeader());

// Antes era registrarPago, ahora es registrarBoleta
export const registrarBoleta = (data) =>
  api.post('/boletas/', data, getAuthHeader());

export const getCuadreCaja = () =>
  api.get('/cuadre-caja/', getAuthHeader());
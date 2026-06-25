import api from './api';

const auth = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('access')}` }
});

// Cola de pedidos activos
export const getColaCocina    = ()     => api.get('/cocina/cola/', auth());

// Cambiar estado del pedido
export const cambiarEstado    = (id, accion) =>
  api.patch(`/pedidos/${id}/estado/`, { accion }, auth());

// Historial del turno
export const getHistorialCocina = ()   => api.get('/cocina/historial/', auth());

// Enviar alerta
export const enviarAlerta = (data)     => api.post('/cocina/alerta/', data, auth());
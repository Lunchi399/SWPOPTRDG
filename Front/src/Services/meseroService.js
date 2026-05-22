import api from './api';

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('access')}` }
});

// Mesas
export const getMesas         = ()         => api.get('/mesas/', getAuthHeader());
export const unirMesas        = (data)     => api.post('/mesas/unir/', data, getAuthHeader());
export const desunirMesa      = (id)       => api.post(`/mesas/${id}/desunir/`, {}, getAuthHeader());
export const finalizarServicio= (id)       => api.post(`/mesas/${id}/finalizar/`, {}, getAuthHeader());

// Pedidos
export const getPedidos       = ()         => api.get('/pedidos/', getAuthHeader());
export const crearPedido      = (data)     => api.post('/pedidos/', data, getAuthHeader());
export const getPedido        = (id)       => api.get(`/pedidos/${id}/`, getAuthHeader());
export const editarPedido     = (id, data) => api.put(`/pedidos/${id}/`, data, getAuthHeader());
export const confirmarPedido  = (id)       => api.patch(`/pedidos/${id}/`, { accion: 'confirmar' }, getAuthHeader());
export const despacharPedido  = (id)       => api.patch(`/pedidos/${id}/`, { accion: 'despachar' }, getAuthHeader());
export const cancelarPedido   = (id, motivo) => api.delete(`/pedidos/${id}/`, { ...getAuthHeader(), data: { motivo } });

// Reclamos e historial
export const crearReclamo     = (data)     => api.post('/reclamos/', data, getAuthHeader());
export const getHistorial     = ()         => api.get('/historial-pedidos/', getAuthHeader());
export const getPlatosDisponibles = () =>
  api.get('/platos/', { ...getAuthHeader(), params: { disponible: 'true' } });
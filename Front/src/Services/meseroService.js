import api from './api';

const auth = () => ({
  headers: { Authorization: `Bearer ${sessionStorage.getItem('access')}` }
});
// Mesas
export const getMesas          = ()     => api.get('/mesas/', auth());
export const unirMesas         = (data) => api.post('/mesas/unir/', data, auth());
export const desunirMesa       = (id)   => api.post(`/mesas/${id}/desunir/`, {}, auth());
export const finalizarServicio = (id)   => api.post(`/mesas/${id}/finalizar/`, {}, auth());

// Pedidos
export const getPedidos        = ()     => api.get('/pedidos/', auth());
export const crearPedido       = (data) => api.post('/pedidos/', data, auth());
export const getPedido         = (id)   => api.get(`/pedidos/${id}/`, auth());
export const cambiarEstado = (id, accion) =>
  api.patch(`/pedidos/${id}/estado/`, { accion }, auth());

export const despacharPedido = (id) =>
  api.patch(`/pedidos/${id}/estado/`, { accion: 'despachar' }, auth());

export const cancelarPedido = (id) =>
  api.patch(`/pedidos/${id}/estado/`, { accion: 'cancelar' }, auth());

// Productos disponibles
export const getProductosDisponibles = () =>
  api.get('/productos/', {
    ...auth(),
    params: { disponible: 'true' }
  });

// Reclamos
export const getReclamos  = ()     => api.get('/reclamos/', auth());
export const crearReclamo = (data) => api.post('/reclamos/', data, auth());

// Historial
export const getHistorial = () => api.get('/historial-pedidos/', auth());
import api from './api';

const auth = () => ({
  headers: {
    Authorization: `Bearer ${sessionStorage.getItem('access')}`
  }
});

// Turno del día
export const getTurno        = ()     => api.get('/inventario/turno/', auth());
export const abrirTurno      = ()     => api.post('/inventario/turno/', {}, auth());
export const cerrarTurno     = (id)   => api.patch(`/inventario/turno/${id}/cerrar/`, {}, auth());

// Insumos
export const getInsumos      = (params) => api.get('/inventario/insumos/', { ...auth(), params });
export const crearInsumo     = (data)   => api.post('/inventario/insumos/', data, auth());
export const editarInsumo    = (id, d)  => api.put(`/inventario/insumos/${id}/`, d, auth());
export const desactivarInsumo= (id)     => api.delete(`/inventario/insumos/${id}/`, auth());

// Estados y movimientos
export const getEstadoInsumos  = ()     => api.get('/inventario/estado/', auth());
export const moverInsumo       = (data) => api.post('/inventario/mover/', data, auth());
export const cambiarEstado     = (data) => api.post('/inventario/estado-insumo/', data, auth());
export const getMovimientos    = (params) => api.get('/inventario/movimientos/', { ...auth(), params });

// Pedidos de insumos
export const getPedidosInsumo  = (params) => api.get('/inventario/pedidos/', { ...auth(), params });
export const crearPedidoInsumo = (data)   => api.post('/inventario/pedidos/', data, auth());
export const marcarEntrega     = (id, data) => api.patch(`/inventario/pedidos/${id}/entregar/`, data, auth());

// Recetas
export const getRecetas        = ()       => api.get('/inventario/recetas/', auth());
export const crearReceta       = (data)   => api.post('/inventario/recetas/', data, auth());
export const editarReceta      = (id, d)  => api.put(`/inventario/recetas/${id}/`, d, auth());
export const desactivarReceta  = (id)     => api.delete(`/inventario/recetas/${id}/`, auth());
export const getDisponibilidad = ()       => api.get('/inventario/disponibilidad/', auth());

// Notificaciones de receta (para cocina)
export const getNotificaciones      = ()    => api.get('/inventario/notificaciones/', auth());
export const marcarNotifLeida       = (id)  => api.patch(`/inventario/notificaciones/${id}/leer/`, {}, auth());

// Merma
export const getMermas = (params) => api.get('/inventario/mermas/', { ...auth(), params });
export const crearMerma        = (data)   => api.post('/inventario/mermas/', data, auth());

// Dashboard
export const getDashboardInsumos = () => api.get('/inventario/dashboard/', auth());
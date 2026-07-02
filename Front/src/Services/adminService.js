import api from './api';

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${sessionStorage.getItem('access')}` }
});

// ── Usuarios ──────────────────────────────────────────────────
export const getUsuarios     = ()          => api.get('/usuarios/', getAuthHeader());
export const crearUsuario    = (data)      => api.post('/usuarios/', data, getAuthHeader());
export const editarUsuario   = (id, data)  => api.put(`/usuarios/${id}/`, data, getAuthHeader());
export const eliminarUsuario = (id)        => api.delete(`/usuarios/${id}/`, getAuthHeader());
// Reclamos
export const getReclamos = () =>
  api.get('/reclamos/', getAuthHeader());

export const cambiarEstadoReclamo = (id, estado) =>
  api.patch(`/reclamos/${id}/`, { estado }, getAuthHeader());

// ── Productos (antes Platos) ──────────────────────────────────
export const getProductos     = (params)   => api.get('/productos/', { ...getAuthHeader(), params });
export const crearProducto    = (data)     => api.post('/productos/', data, getAuthHeader());
export const editarProducto   = (id, data) => api.put(`/productos/${id}/`, data, getAuthHeader());
export const toggleProducto   = (id)       => api.patch(`/productos/${id}/`, {}, getAuthHeader());
export const eliminarProducto = (id)       => api.delete(`/productos/${id}/`, getAuthHeader());

// ── Mesas ─────────────────────────────────────────────────────
export const getMesas      = ()          => api.get('/mesas/', getAuthHeader());
export const crearMesa     = (data)      => api.post('/mesas/', data, getAuthHeader());
export const editarMesa    = (id, data)  => api.put(`/mesas/${id}/`, data, getAuthHeader());
export const desunirMesa   = (id)          => api.post(`/mesas/${id}/desunir/`, {}, getAuthHeader());
export const eliminarMesa  = (id)        => api.delete(`/mesas/${id}/`, getAuthHeader());

// ── Dashboard ─────────────────────────────────────────────────
export const getDashboard  = ()          => api.get('/dashboard/', getAuthHeader());
export const getEstadisticas = () =>
  api.get('/estadisticas/', getAuthHeader());
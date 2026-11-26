import api from './api';

const auth = (extra = {}) => ({
  headers: { Authorization: `Bearer ${sessionStorage.getItem('access')}` },
  ...extra,
});

// Reportes calculados (RFN49–RFN56)
export const getDashboardProy   = (params) => api.get('/proyecciones/dashboard/',        auth({ params }));
export const getDemanda         = (params) => api.get('/proyecciones/demanda/',          auth({ params }));
export const getConsumo         = (params) => api.get('/proyecciones/consumo-insumos/',  auth({ params }));
export const getGasto           = (params) => api.get('/proyecciones/gasto-compras/',    auth({ params }));
export const getRentabilidad    = (params) => api.get('/proyecciones/rentabilidad/',     auth({ params }));
export const getAlertasRent     = ()       => api.get('/proyecciones/alertas-rentabilidad/', auth());
export const getFinanzas        = (params) => api.get('/proyecciones/finanzas/',         auth({ params }));
export const getPlanCompras     = (params) => api.get('/proyecciones/plan-compras/',     auth({ params }));
export const getConfigProy      = ()       => api.get('/proyecciones/configuracion/',    auth());
export const putConfigProy      = (data)   => api.put('/proyecciones/configuracion/', data, auth());

// RFN60 — CSV del plan de compras (vivo o guardado)
export const descargarPlanCsv = (params) =>
  api.get('/proyecciones/plan-compras/', auth({ params: { ...params, formato: 'csv' }, responseType: 'blob' }));
export const descargarGuardadoCsv = (id) =>
  api.get(`/proyecciones/guardadas/${id}/`, auth({ params: { formato: 'csv' }, responseType: 'blob' }));

// RFN57 — precios
export const getPrecios         = ()           => api.get('/precios-insumo/', auth());
export const registrarPrecio    = (data)       => api.post('/precios-insumo/', data, auth());
export const getHistorialPrecios = (idInsumo)  => api.get(`/precios-insumo/${idInsumo}/historial/`, auth());

// RFN61 — guardados
export const getGuardadas       = (params) => api.get('/proyecciones/guardadas/', auth({ params }));
export const guardarProyeccion  = (data)   => api.post('/proyecciones/guardadas/', data, auth());
export const getGuardada        = (id)     => api.get(`/proyecciones/guardadas/${id}/`, auth());

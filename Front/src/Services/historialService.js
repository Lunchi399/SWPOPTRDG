import api from './api';

const token = () =>
  sessionStorage.getItem('access') || localStorage.getItem('access');
const auth = () => ({ headers: { Authorization: `Bearer ${token()}` } });

export const getHistorialGlobal = (params) =>api.get('/historial-global/', { ...auth(), params });
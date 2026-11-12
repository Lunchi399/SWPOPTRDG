// authService.js
import api from './api';

export const loginService = async (username, password) => {
  const response = await api.post('/login/', { username, password });

  // Guardar en sessionStorage
  sessionStorage.setItem('access',  response.data.access);
  sessionStorage.setItem('refresh', response.data.refresh);
  sessionStorage.setItem('usuario', JSON.stringify(response.data.usuario));

  return response.data;
};

export const logoutService = async () => {
  const refresh = sessionStorage.getItem('refresh');
  try {
    await api.post('/logout/', { refresh });
  } catch (e) { /* ignorar */ }
  sessionStorage.removeItem('access');
  sessionStorage.removeItem('refresh');
  sessionStorage.removeItem('usuario');
};

export const isAuthenticated = () =>
  !!sessionStorage.getItem('access');

export const getUsuario = () => {
  const u = sessionStorage.getItem('usuario');
  return u ? JSON.parse(u) : null;
};

export const getRol = () => {
  const u = getUsuario();
  if (!u) return null;
  return (u.Rol || u.rol || '').toLowerCase().trim();
};
import api from './api';

export const loginService = async (username, password) => {
  const response = await api.post('/login/', { username, password });
  // guarda los tokens en localStorage
  localStorage.setItem('access',  response.data.access);
  localStorage.setItem('refresh', response.data.refresh);
  localStorage.setItem('usuario', JSON.stringify(response.data.usuario));
  return response.data;
};

export const logoutService = async () => {
  const refresh = localStorage.getItem('refresh');
  await api.post('/logout/', { refresh });
  localStorage.removeItem('access');
  localStorage.removeItem('removeItem');
  localStorage.removeItem('usuario');
};

export const getUsuario = () => {
  return JSON.parse(localStorage.getItem('usuario'));
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('access');
};
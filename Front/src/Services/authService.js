import api from './api';

// Usamos sessionStorage para que cada pestaña tenga su propia sesión
const STORAGE = sessionStorage;

export const loginService = async (username, password) => {
  const response = await api.post('/login/', { username, password });

  STORAGE.setItem('access',  response.data.access);
  STORAGE.setItem('refresh', response.data.refresh);
  STORAGE.setItem('usuario', JSON.stringify(response.data.usuario));

  return response.data;
};

export const logoutService = async () => {
  try {
    const refresh = STORAGE.getItem('refresh');
    await api.post('/logout/', { refresh }, {
      headers: { Authorization: `Bearer ${STORAGE.getItem('access')}` }
    });
  } catch (e) {
    console.log('Error al cerrar sesión:', e);
  } finally {
    STORAGE.removeItem('access');
    STORAGE.removeItem('refresh');
    STORAGE.removeItem('usuario');
  }
};

export const getUsuario = () => {
  const u = STORAGE.getItem('usuario');
  return u ? JSON.parse(u) : null;
};

export const isAuthenticated = () => {
  return !!STORAGE.getItem('access');
};

export const getRol = () => {
  const u = getUsuario();
  if (!u) return null;
  return (u.Rol || u.rol || '').toLowerCase().trim();
};
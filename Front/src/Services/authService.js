import api from './api';

// CU01 — Login
export const loginService = async (username, password) => {
  const response = await api.post('/login/', { username, password });

  localStorage.setItem('access',  response.data.access);
  localStorage.setItem('refresh', response.data.refresh);
  localStorage.setItem('usuario', JSON.stringify(response.data.usuario));

  return response.data;
};

// CU02 — Logout
export const logoutService = async () => {
  try {
    const refresh = localStorage.getItem('refresh');
    await api.post('/logout/', { refresh }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access')}` }
    });
  } catch (e) {
    console.log('Error al cerrar sesión:', e);
  } finally {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('usuario');
  }
};

// Obtener usuario del localStorage
export const getUsuario = () => {
  const u = localStorage.getItem('usuario');
  return u ? JSON.parse(u) : null;
};

// Verificar si está autenticado
export const isAuthenticated = () => {
  return !!localStorage.getItem('access');
};

// Obtener rol del usuario
export const getRol = () => {
  const u = getUsuario();
  if (!u) return null;
  const rol = u.Rol || u.rol || '';
  return rol.toLowerCase().trim();  // ← siempre en minúscula
};
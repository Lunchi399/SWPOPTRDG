import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login      from './pages/Login';
import Dashboard  from './pages/admin/Dashboard';
import Usuarios   from './pages/admin/Usuarios';
import Productos  from './pages/admin/Productos';
import Mesas      from './pages/admin/Mesas';
import Reclamos   from './pages/admin/Reclamos';

import MeseroIndex from './pages/mesero/Index';
import { isAuthenticated } from './Services/authService';
import { getRol } from './Services/authService';

function RutaPrivada({ children, rolRequerido }) {
  if (!isAuthenticated()) return <Navigate to="/login" />;

  if (rolRequerido) {
    const rol = getRol();
    if (rol !== rolRequerido) return <Navigate to="/login" />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Admin — solo administrador puede entrar */}
        <Route path="/admin/dashboard"
          element={
            <RutaPrivada rolRequerido="administrador">
              <Dashboard />
            </RutaPrivada>
          }
        />
        <Route path="/admin/usuarios"
          element={
            <RutaPrivada rolRequerido="administrador">
              <Usuarios />
            </RutaPrivada>
          }
        />
        <Route path="/admin/productos"
          element={
            <RutaPrivada rolRequerido="administrador">
              <Productos />
            </RutaPrivada>
          }
        />
        <Route path="/admin/mesas"
          element={
            <RutaPrivada rolRequerido="administrador">
              <Mesas />
            </RutaPrivada>
          }
        />
        <Route path="/admin/reclamos"
          element={
            <RutaPrivada rolRequerido="administrador">
              <Reclamos />
            </RutaPrivada>
          }
        />

        {/* Mesero */}
        <Route path="/mesero/mesas"
          element={
            <RutaPrivada rolRequerido="mesero">
              <MeseroIndex />
            </RutaPrivada>
          }
        />

        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
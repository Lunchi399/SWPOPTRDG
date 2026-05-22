import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login      from './pages/Login';
import Dashboard  from './pages/admin/Dashboard';
import Usuarios   from './pages/admin/Usuarios';
import Productos  from './pages/admin/Productos';
import Mesas      from './pages/admin/Mesas';
import Reclamos   from './pages/admin/Reclamos';
import MesasMesero from './pages/mesero/Mesas';
import { isAuthenticated } from './services/authService';

function RutaPrivada({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Admin */}
        <Route path="/admin/dashboard"
          element={<RutaPrivada><Dashboard /></RutaPrivada>} />
        <Route path="/admin/usuarios"
          element={<RutaPrivada><Usuarios /></RutaPrivada>} />
        <Route path="/admin/productos"
          element={<RutaPrivada><Productos /></RutaPrivada>} />
        <Route path="/admin/mesas"
          element={<RutaPrivada><Mesas /></RutaPrivada>} />
        <Route path="/admin/reclamos"
          element={<RutaPrivada><Reclamos /></RutaPrivada>} />

        {/* Mesero */}
        <Route path="/mesero/mesas"
          element={<RutaPrivada><MesasMesero /></RutaPrivada>} />

        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
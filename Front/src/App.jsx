import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import { isAuthenticated, getUsuario } from './services/authService';

// ── Páginas Admin
import Dashboard from './pages/Admin/Dashboard';
// import Usuarios  from './pages/Admin/Usuarios';   // próximo
// import Carta     from './pages/Admin/Carta';       // próximo
// import Mesas     from './pages/Admin/Mesas';       // próximo
// import Pedidos   from './pages/Admin/Pedidos';     // próximo

// ── Protege rutas privadas
function RutaPrivada({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" />;
}

// ── Protege rutas por rol
function RutaRol({ rol, children }) {
  const usuario = getUsuario();
  if (!isAuthenticated()) return <Navigate to="/login" />;
  if (usuario?.rol !== rol) return <Navigate to="/login" />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Pública */}
        <Route path="/login" element={<Login />} />

        {/* ── ADMIN ── */}
        <Route
          path="/admin/dashboard"
          element={<RutaRol rol="administrador"><Dashboard /></RutaRol>}
        />
        {/* Las siguientes se irán descomentando cuando se creen:
        <Route path="/admin/usuarios" element={<RutaRol rol="administrador"><Usuarios /></RutaRol>} />
        <Route path="/admin/carta"    element={<RutaRol rol="administrador"><Carta /></RutaRol>} />
        <Route path="/admin/mesas"    element={<RutaRol rol="administrador"><Mesas /></RutaRol>} />
        <Route path="/admin/pedidos"  element={<RutaRol rol="administrador"><Pedidos /></RutaRol>} />
        */}

        {/* Raíz → login */}
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

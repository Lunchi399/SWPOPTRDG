import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import { isAuthenticated } from './services/authService';

// Protege rutas privadas
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
        {/* Aquí irán las rutas de cada módulo */}
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App; 
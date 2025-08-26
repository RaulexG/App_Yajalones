// src/App.jsx
import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import Login from './Login/Loginp';
import Layout from './layouts/Layout';

import Pasajeros from './pages/Pasajeros/Pasajeros';
import Paqueteria from './pages/Paquetes/Paquetes';
import Despachos from './pages/Despachos/DespachoTux';
import Choferes from './pages/Choferes/Choferes';
import Ajustes from './pages/Ajustes/Ajustes';

// Puerta de autenticación: consulta el token al proceso main (Electron)
function AuthGate({ children }) {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let unsubscribe = null;

    async function check() {
      const token = await window.auth?.getToken?.();
      setAuthed(!!token);
      setChecking(false);
    }

    // Suscribir a expiración de sesión
    if (window.auth?.onSessionExpired) {
      unsubscribe = window.auth.onSessionExpired(() => {
        setAuthed(false);
        setChecking(false);
        // Redirige a /login (HashRouter)
        window.location.hash = '#/login';
      });
    }

    check();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  if (checking) {
    // Puedes estilizar este loader como prefieras
    return <div className="h-screen grid place-items-center">Verificando sesión…</div>;
  }
  return authed ? children : <Navigate to="/login" replace />;
}

// Redirección condicional para la raíz y rutas inválidas
function SmartRedirect() {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let active = true;
    (async () => {
      const token = await window.auth?.getToken?.();
      if (!active) return;
      setAuthed(!!token);
      setChecking(false);
    })();
    return () => { active = false; };
  }, [location]);

  if (checking) return null;
  return authed ? <Navigate to="/pasajeros" replace /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Pública */}
        <Route path="/login" element={<Login />} />

        {/* Protegidas */}
        <Route
          path="/"
          element={
            <AuthGate>
              <Layout />
            </AuthGate>
          }
        >
          <Route path="pasajeros" element={<Pasajeros />} />
          <Route path="paqueteria" element={<Paqueteria />} />
          <Route path="despachos" element={<Despachos />} />
          <Route path="choferes" element={<Choferes />} />
          <Route path="ajustes" element={<Ajustes />} />
        </Route>

        {/* Raíz e inválidas → redirección inteligente */}
        <Route path="*" element={<SmartRedirect />} />
      </Routes>
    </HashRouter>
  );
}




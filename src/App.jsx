// src/App.jsx
import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';

import Login from './Login/Loginp';
import Layout from './layouts/Layout';

import Pasajeros from './pages/Pasajeros/Pasajeros';
import Paqueteria from './pages/Paquetes/Paquetes';
import DespachoYaja from './pages/Despachos/DespachoYaja';
import DespachoTux from './pages/Despachos/DespachoTux';
import Choferes from './pages/Choferes/Choferes';
import Ajustes from './pages/Ajustes/Ajustes';

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
    if (window.auth?.onSessionExpired) {
      unsubscribe = window.auth.onSessionExpired(() => {
        setAuthed(false);
        setChecking(false);
        window.location.hash = '#/login';
      });
    }
    check();
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  if (checking) return <div className="h-screen grid place-items-center">Verificando sesión…</div>;
  return authed ? children : <Navigate to="/login" replace />;
}

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

// Gate ÚNICO para decidir Yaja/Tux
function DespachosGate() {
  const navigate = useNavigate();
  const [done, setDone] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // espera a que exista la API (Electron o shim de web)
        const getUser = window.session?.getUser;
        if (!getUser) {
          // pequeño delay si aún no cargó el preload/shim
          await new Promise(r => setTimeout(r, 50));
        }
        const u = await window.session?.getUser?.();
        const t = u?.terminal;
        if (!alive) return;

        if (t === 'YAJALON') navigate('/despachos-yaja', { replace: true });
        else if (t === 'TUXTLA') navigate('/despachos-tux', { replace: true });
        else navigate('/pasajeros', { replace: true });
      } finally {
        if (alive) setDone(true);
      }
    })();
    return () => { alive = false; };
  }, [navigate]);

  return done ? null : <div className="p-4">Cargando despachos…</div>;
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
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
          <Route path="despachos" element={<DespachosGate />} />
          <Route path="despachos-yaja" element={<DespachoYaja />} />
          <Route path="despachos-tux" element={<DespachoTux />} />
          <Route path="choferes" element={<Choferes />} />
          <Route path="ajustes" element={<Ajustes />} />
        </Route>
        <Route path="*" element={<SmartRedirect />} />
      </Routes>
    </HashRouter>
  );
}


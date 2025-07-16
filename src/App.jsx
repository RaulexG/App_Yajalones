// src/App.jsx
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

import Login from './Login/Loginp';
import Layout from './layouts/Layout';

import Pasajeros from './pages/Pasajeros/Pasajeros';
import Paqueteria from './pages/Paquetes/Paquetes';
import Despachos from './pages/Despachos/Despachos';
import Choferes from './pages/Choferes/Choferes';
import Ajustes from './pages/Ajustes/Ajustes';

function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Ruta pública de login */}
        <Route path="/login" element={<Login />} />

        {/* Rutas protegidas bajo nuestro layout */}
        <Route element={<Layout />}>
          <Route path="/pasajeros" element={<Pasajeros />} />
          <Route path="/paqueteria" element={<Paqueteria />} />
          <Route path="/despachos" element={<Despachos />} />
          <Route path="/choferes" element={<Choferes />} />
          <Route path="/ajustes" element={<Ajustes />} />

          {/* Cualquier ruta no encontrada dentro del layout redirige a login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;



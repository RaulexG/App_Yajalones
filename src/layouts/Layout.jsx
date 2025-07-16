// src/layouts/Layout.jsx
import React, { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FiUsers, FiBox, FiTruck, FiUser, FiSettings } from 'react-icons/fi';

export default function Layout() {
  const navigate = useNavigate();

  // Si no hay token, lo manda al login
  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
    }
  }, [navigate]);

  const linkClass = ({ isActive }) =>
    isActive
      ? 'flex flex-col items-center px-4 py-2 text-yellow-300'
      : 'flex flex-col items-center px-4 py-2 text-white hover:text-yellow-200';

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Navbar */}
      <header className="bg-orange-600 flex items-center">
        <NavLink to="/pasajeros" className={linkClass}>
          <FiUsers size={24} />
          <span className="text-sm">Pasajeros</span>
        </NavLink>

        <NavLink to="/paqueteria" className={linkClass}>
          <FiBox size={24} />
          <span className="text-sm">Paquetería</span>
        </NavLink>

        <NavLink to="/despachos" className={linkClass}>
          <FiTruck size={24} />
          <span className="text-sm">Despachos</span>
        </NavLink>

        <NavLink to="/choferes" className={linkClass}>
          <FiUser size={24} />
          <span className="text-sm">Choferes</span>
        </NavLink>

        <NavLink to="/ajustes" className={linkClass}>
          <FiSettings size={24} />
          <span className="text-sm">Ajustes</span>
        </NavLink>

        <button
          onClick={handleLogout}
          className="ml-auto px-4 py-2 text-white hover:text-gray-200"
        >
          Cerrar sesión
        </button>
      </header>

      {/* Contenido */}
      <main className="flex-1 overflow-auto bg-gray-100 p-4">
        <Outlet />
      </main>
    </div>
  );
}


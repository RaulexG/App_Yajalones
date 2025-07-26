// src/Login/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/Login.svg';

export default function Login() {
  const [nombre, setNombre] = useState('');
  const [contrasena, setContrasena] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    if (nombre === 'admin' && contrasena === 'admin123') {
      localStorage.setItem('token', 'admin-token');
      navigate('/pasajeros');
    } else {
      alert('Credenciales incorrectas');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm">
        <img
          src={logo}
          alt="Yajalones"
          className="w-48 h-48 mx-auto mb-6"
        />
        <h2 className="text-2xl font-semibold text-center mb-6">Iniciar sesión</h2>

        <label className="block text-gray-700 text-sm font-medium mb-1">
          Usuario
        </label>
        <input
          type="text"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          className="w-full px-3 py-2 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
          placeholder="admin"
        />

        <label className="block text-gray-700 text-sm font-medium mb-1">
          Contraseña
        </label>
        <input
          type="password"
          value={contrasena}
          onChange={e => setContrasena(e.target.value)}
          className="w-full px-3 py-2 mb-6 border rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
          placeholder="admin123"
        />

        <button
          onClick={handleLogin}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          Entrar
        </button>
      </div>
    </div>
  );
}

// src/Login/Loginp.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/Login.svg';

export default function Login() {
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await window.auth?.login?.({ nombreUsuario, password });
      if (res?.ok) {
        // Opcional: cambiar título
        if (window.appBridge?.setTitle) {
          window.appBridge.setTitle('Yajalones');
        }
        navigate('/pasajeros', { replace: true });
      } else {
        setErrorMsg(res?.message || 'No se pudo iniciar sesión');
      }
    } catch {
      setErrorMsg('No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm">
        <img src={logo} alt="Yajalones" className="w-48 h-48 mx-auto mb-6" />
        <h2 className="text-2xl font-semibold text-center mb-6">Iniciar sesión</h2>

        <form onSubmit={handleLogin}>
          <label className="block text-gray-700 text-sm font-medium mb-1">
            Usuario
          </label>
          <input
            type="text"
            value={nombreUsuario}
            onChange={(e) => setNombreUsuario(e.target.value)}
            className="w-full px-3 py-2 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
            placeholder="Yajalon"
            autoFocus
          />

          <label className="block text-gray-700 text-sm font-medium mb-1">
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 mb-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
            placeholder="••••••••"
          />

          {errorMsg && (
            <p className="text-sm text-red-600 mb-3">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-medium py-2 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}

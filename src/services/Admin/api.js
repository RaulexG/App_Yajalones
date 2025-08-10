// src/services/Admin/api.js
import axios from 'axios';

// Base URL desde .env (fallback a localhost en dev)
const API_BASE = import.meta.env?.VITE_API_BASE || 'http://localhost:8081';

// Helper seguro para pedir token al proceso main (Electron)
// - No caches el token aquí: pídelo antes de cada request
async function getAuthToken() {
  // Si existe bridge de Electron
  if (typeof window !== 'undefined' && window.auth?.getToken) {
    try {
      const t = await window.auth.getToken();
      return t || null;
    } catch {
      return null;
    }
  }
  // Fallback solo dev (si aún no integras preload/main): intenta localStorage
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
}

// Instancia única
const instance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request: agrega Authorization si hay token
instance.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response: si llega 401, cierra sesión y navega a /login
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      try {
        // Intento de logout por Electron (si existe)
        if (window.auth?.logout) await window.auth.logout();
      } catch {}
      // Redirección suave a login (HashRouter)
      if (typeof window !== 'undefined') {
        window.location.hash = '#/login';
      }
    }
    return Promise.reject(error);
  }
);

export default instance;


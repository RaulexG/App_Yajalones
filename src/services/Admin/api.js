// src/services/Admin/api.js
import axios from 'axios';

const API_BASE = import.meta.env?.VITE_API_BASE || 'https://yajalones-app-81c1abc5059e.herokuapp.com';

async function getAuthToken() {
  if (typeof window !== 'undefined' && window.auth?.getToken) {
    try { const t = await window.auth.getToken(); return t || null; } catch { return null; }
  }
  try { return localStorage.getItem('token'); } catch { return null; } // solo dev web
}

const instance = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

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

instance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      try { if (window.auth?.logout) await window.auth.logout(); } catch {}
      if (typeof window !== 'undefined') window.location.hash = '#/login';
    }
    return Promise.reject(error);
  }
);

export default instance;

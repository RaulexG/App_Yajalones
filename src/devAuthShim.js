// src/devAuthShim.js
import axios from 'axios';

const API_BASE = import.meta.env?.VITE_API_BASE || 'http://localhost:8081';

// Detectar si estamos dentro de Electron (renderer)
const isElectron =
  typeof window !== 'undefined' &&
  !!(window.process && window.process.type);

if (!isElectron) {
  // Shim sólo para navegador (npm run dev)
  if (!window.auth) {
    window.auth = {
      // Login web: hace POST /inicioSesion y guarda token en localStorage
      login: async ({ nombreUsuario, password }) => {
        try {
          const { data } = await axios.post(`${API_BASE}/inicioSesion`, {
            nombreUsuario,
            password,
          }, { headers: { 'Content-Type': 'application/json' } });

          const token = data?.access_token;
          if (!token) return { ok: false, message: 'Respuesta inválida del servidor' };

          // Guardar temporalmente en localStorage (sólo DEV web)
          localStorage.setItem('token', token);
          return { ok: true };
        } catch (e) {
          // Si ves error de CORS aquí, necesitas habilitar CORS en el backend para http://localhost:5173 (o 5174)
          return { ok: false, message: 'Credenciales inválidas o servidor no disponible' };
        }
      },

      // Devuelve el token guardado en localStorage
      getToken: async () => {
        try { return localStorage.getItem('token'); } catch { return null; }
      },

      // Logout: limpia token
      logout: async () => {
        try { localStorage.removeItem('token'); } catch {}
        return true;
      },

      // En dev web no tenemos expiración automática desde main; dejamos no-op
      onSessionExpired: () => () => {},
    };
  }
}

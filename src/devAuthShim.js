// src/devAuthShim.js
import axios from 'axios';

const API_BASE = import.meta.env?.VITE_API_BASE || 'http://localhost:8081';

// Detectar si estamos corriendo dentro de Electron
const isElectron =
  typeof window !== 'undefined' &&
  !!(window.process && window.process.type);

// Solo aplica en WEB (no Electron)
if (!isElectron) {
  // Evita doble registro si se importara 2 veces
  if (!window.__DEV_AUTH_SHIM__) {
    window.__DEV_AUTH_SHIM__ = true;

    // ---- AUTH SHIM (solo para web dev) ----
    if (!window.auth) {
      window.auth = {
        login: async ({ nombreUsuario, password }) => {
          try {
            const { data } = await axios.post(
              `${API_BASE}/inicio-sesion`,
              { nombreUsuario, password },
              { headers: { 'Content-Type': 'application/json' } }
            );
            const token = data?.access_token;
            if (!token) return { ok: false, message: 'Respuesta inválida del servidor' };

            // Guardar en localStorage (solo web dev)
            localStorage.setItem('token', token);
            localStorage.setItem('last_username', nombreUsuario || '');
            return { ok: true };
          } catch {
            return {
              ok: false,
              message: 'Credenciales inválidas o servidor no disponible',
            };
          }
        },
        getToken: async () => {
          try {
            return localStorage.getItem('token');
          } catch {
            return null;
          }
        },
        logout: async () => {
          try {
            localStorage.removeItem('token');
            localStorage.removeItem('last_username');
          } catch {}
          return true;
        },
        // No-ops para que tu UI pueda suscribirse sin romperse en web
        onSessionExpired: () => () => {},
        onSessionClosed: () => () => {},
      };
    }

    // ---- SESSION SHIM (solo para web dev) ----
    if (!window.session) {
      window.session = {
        getUser: async () => {
          const u = (localStorage.getItem('last_username') || '').toLowerCase();
          return {
            username: u || null,
            terminal: u.includes('yajalon')
              ? 'YAJALON'
              : u.includes('tuxtla')
              ? 'TUXTLA'
              : null,
          };
        },
      };
    }
  }
}

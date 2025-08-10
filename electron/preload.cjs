// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Exponemos una API mínima y segura al renderer.
// Nada de tokens se expone directamente: todo va por IPC.
contextBridge.exposeInMainWorld('auth', {
  // Login: envía credenciales al proceso main; main hace la petición HTTP
  // y guarda el token (si es válido). Devuelve { ok: boolean, message?: string }.
  login: async ({ nombreUsuario, password }) => {
    try {
      const res = await ipcRenderer.invoke('auth:login', { nombreUsuario, password });
      return res; // { ok: true } o { ok: false, message: '...' }
    } catch (e) {
      return { ok: false, message: 'No se pudo iniciar sesión' };
    }
  },

  // Devuelve el token SÓLO si sigue vigente; si no, devuelve null.
  // El renderer NO debe cachearlo; pídelo antes de cada request.
  getToken: async () => {
    try {
      const token = await ipcRenderer.invoke('auth:getToken');
      return token || null;
    } catch {
      return null;
    }
  },

  // Cierra sesión (borra token y notifica al renderer).
  logout: async () => {
    try {
      await ipcRenderer.invoke('auth:logout');
      return true;
    } catch {
      return false;
    }
  },

  // Suscripción a expiración de sesión: el main emite este evento cuando
  // el JWT vence o se hace logout desde otro punto.
  onSessionExpired: (handler) => {
    const channel = 'auth:session-expired';
    const wrapped = (_event) => handler?.();
    ipcRenderer.removeAllListeners(channel);
    ipcRenderer.on(channel, wrapped);
    // devolvemos una función para desuscribir si la quieres usar
    return () => ipcRenderer.removeListener(channel, wrapped);
  }
});

// Opcional: también podemos exponer un canal simple para errores globales si lo necesitas
contextBridge.exposeInMainWorld('appBridge', {
  setTitle: (title) => ipcRenderer.invoke('app:set-title', title),
});

// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

/* ---------------- helpers ---------------- */
const safeInvoke = async (channel, payload) => {
  try { return await ipcRenderer.invoke(channel, payload); }
  catch (err) { return { ok: false, error: true, message: err?.message || 'Error' }; }
};

const safeSend = (channel, payload) => {
  try { ipcRenderer.send(channel, payload); return true; }
  catch { return false; }
};

const subscribe = (channel, handler) => {
  const wrapped = (_e, ...args) => { try { handler?.(...args); } catch {} };
  ipcRenderer.removeAllListeners(channel);
  ipcRenderer.on(channel, wrapped);
  return () => ipcRenderer.removeListener(channel, wrapped);
};

/* ---------------- runtime/env ---------------- */
contextBridge.exposeInMainWorld('runtime', {
  isElectron: true,
});

contextBridge.exposeInMainWorld('env', {
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
    v8: process.versions.v8,
  },
});

/* ---------------- auth bridge ---------------- */
contextBridge.exposeInMainWorld('auth', {
  login: async ({ nombreUsuario, password }) => {
    if (typeof nombreUsuario !== 'string' || typeof password !== 'string') {
      return { ok: false, message: 'Credenciales inválidas' };
    }
    const res = await safeInvoke('auth:login', { nombreUsuario, password });
    return res?.ok ? res : (res?.message ? res : { ok: false, message: 'No se pudo iniciar sesión' });
  },
  getToken: async () => {
    const res = await safeInvoke('auth:getToken');
    if (res?.error) return null;
    return res?.token ?? res ?? null;
  },
  logout: async () => {
    const res = await safeInvoke('auth:logout');
    return !res?.error;
  },
  // eventos desde main: se disparan al cerrar ventana / expirar / logout
  onSessionExpired: (handler) => subscribe('auth:session-expired', () => handler?.()),
  onSessionClosed:  (handler) => subscribe('auth:session-closed',  () => handler?.()),
});

/* ---------------- session bridge ---------------- */
contextBridge.exposeInMainWorld('session', {
  getUser: async () => {
    const res = await safeInvoke('session:getUser');
    return res?.error ? null : res ?? null;
  },
  getRole: async () => {
    const res = await safeInvoke('session:getRole');
    return res?.error ? null : res ?? null;
  },
  refresh: async () => {
    const res = await safeInvoke('session:refresh');
    return res?.error ? { ok: false } : (res ?? { ok: true });
  },
});

/* ---------------- app/window bridge ---------------- */
contextBridge.exposeInMainWorld('appBridge', {
  setTitle: (title) => safeInvoke('app:set-title', title),
  requestQuit: () => safeSend('app:request-quit'),
  onBeforeQuit: (handler) => subscribe('app:before-quit', handler),
  onWindowState: (handler) => subscribe('app:window-state', handler),
});

contextBridge.exposeInMainWorld('win', {
  minimize: () => safeSend('win:minimize'),
  maximize: () => safeSend('win:maximize'),
  unmaximize: () => safeSend('win:unmaximize'),
  close: () => safeSend('win:close'),
  isMaximized: async () => {
    const res = await safeInvoke('win:is-maximized');
    return !!res?.value;
  },
  onMaximize: (handler) => subscribe('win:maximize', handler),
  onUnmaximize: (handler) => subscribe('win:unmaximize', handler),
});

/* ---------------- pdf bridge ---------------- */
contextBridge.exposeInMainWorld('pdf', {
  saveHTML: async (html, suggestedName = 'CorteDia.pdf') => {
    if (typeof html !== 'string' || !html.trim()) return { ok: false, message: 'HTML inválido' };
    const res = await safeInvoke('pdf:save-html', { html, suggestedName });
    return res?.error ? { ok: false, message: 'No se pudo generar el PDF' } : res;
  },
  saveFromURL: async (url, suggestedName = 'CorteDia.pdf') => {
    const ok = typeof url === 'string' && (/^https?:\/\//i.test(url) || /^file:\/\//i.test(url) || /^data:/i.test(url));
    if (!ok) return { ok: false, message: 'URL inválida' };
    const res = await safeInvoke('pdf:save-url', { url, suggestedName });
    return res?.error ? { ok: false, message: 'No se pudo generar el PDF' } : res;
  },
  onProgress: (handler) => subscribe('pdf:progress', (p) => handler?.(p)),

  // Guardar PDF generado en el renderer (jsPDF) — acepta ArrayBuffer o TypedArray
  saveBuffer: async (data, suggestedName = 'CorteDia.pdf') => {
    try {
      const toArrayBuffer = (d) => {
        if (!d) return null;
        if (d instanceof ArrayBuffer) return d;
        if (ArrayBuffer.isView(d)) {
          // d es p.ej. Uint8Array: usar su buffer con el offset/length correcto
          return d.byteOffset === 0 && d.byteLength === d.buffer.byteLength
            ? d.buffer
            : d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength);
        }
        return null;
      };
      const ab = toArrayBuffer(data);
      if (!ab) return { ok: false, message: 'Dato inválido: se esperaba ArrayBuffer/TypedArray' };

      const res = await safeInvoke('save-pdf', { data: ab, filename: suggestedName });
      return res?.error ? { ok: false, message: 'No se pudo guardar el PDF' } : res;
    } catch (e) {
      return { ok: false, message: e?.message || 'No se pudo guardar el PDF' };
    }
  },
});

contextBridge.exposeInMainWorld('ticket', {
  imprimirPasajero: async (pasajero, viaje) => {
    // Usamos safeInvoke para manejar errores y respuesta
    return await safeInvoke('imprimir-ticket-pasajero', { pasajero, viaje });
  }
});

contextBridge.exposeInMainWorld('ticketPaquete', {
  imprimir: async (paquete, viaje) => {
    return await safeInvoke('imprimir-ticket-paquete', paquete, viaje);
  }
});

/* ---------------- net/store bridge ---------------- */
contextBridge.exposeInMainWorld('net', {
  isOnline: async () => {
    const res = await safeInvoke('net:is-online');
    return !!res?.value;
  },
  onStatus: (handler) => subscribe('net:status', (status) => handler?.(status)),
});

contextBridge.exposeInMainWorld('store', {
  get: async (key) => {
    const res = await safeInvoke('store:get', { key });
    return res?.error ? null : (res?.value ?? null);
  },
  set: async (key, value) => {
    const res = await safeInvoke('store:set', { key, value });
    return !res?.error;
  },
  onDidChange: (key, handler) => subscribe(`store:changed:${key}`, (v) => handler?.(v)),
});

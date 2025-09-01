// src/utils/electron.ts
const w = globalThis as any;

export const electron = {
  auth: w.auth ?? {
    login: async () => ({ ok: false, message: 'No disponible en web' }),
    getToken: async () => null,
    logout: async () => false,
    onSessionExpired: () => () => {},
    onSessionClosed: () => () => {},
  },
  session: w.session ?? {
    getUser: async () => null,
    getRole: async () => null,
    refresh: async () => ({ ok: false }),
  },
  appBridge: w.appBridge ?? {
    setTitle: async () => {},
    requestQuit: () => {},
    onBeforeQuit: () => () => {},
    onWindowState: () => () => {},
  },
  win: w.win ?? {
    minimize: () => {},
    maximize: () => {},
    unmaximize: () => {},
    close: () => {},
    isMaximized: async () => false,
    onMaximize: () => () => {},
    onUnmaximize: () => () => {},
  },
  pdf: w.pdf ?? {
    saveHTML: async () => ({ ok: false, message: 'No disponible en web' }),
    saveFromURL: async () => ({ ok: false, message: 'No disponible en web' }),
    onProgress: () => () => {},
  },
  net: w.net ?? {
    isOnline: async () => navigator.onLine,
    onStatus: () => () => {},
  },
  store: w.store ?? {
    get: async () => null,
    set: async () => false,
    onDidChange: () => () => {},
  },
};

export const isElectron = !!(w && w.process && w.process.versions && w.process.versions.electron);

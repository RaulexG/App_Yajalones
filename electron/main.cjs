// electron/main.js  (o main.cjs si así lo nombras)
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const axios = require('axios');

// ====== CONFIG ======
const isDev = !app.isPackaged;
// Usa la base del backend desde variable de entorno si existe
const API_BASE = process.env.VITE_API_BASE || 'http://localhost:8081';

// Ruta del ícono de la app (PNG/ICO). Reemplaza por tu archivo real.
// Sugerido: coloca un PNG (256x256) en electron/assets/yajalones.png
const APP_ICON = path.join(__dirname, 'assets', 'yajalones.ico');

// ====== AUTH STATE (en memoria, no en disco) ======
const authState = {
  token: null,
  exp: null,         // epoch seconds
  timer: null,       // setTimeout ref
};

// Decodifica el payload del JWT sin dependencias externas
function decodeJwtPayload(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(json); // { exp, sub, rol, ... }
  } catch {
    return null;
  }
}

function clearAuth(reason = 'logout') {
  authState.token = null;
  authState.exp = null;
  if (authState.timer) {
    clearTimeout(authState.timer);
    authState.timer = null;
  }
  // Notificar al renderer que la sesión terminó
  if (BrowserWindow.getAllWindows().length) {
    const win = BrowserWindow.getAllWindows()[0];
    win.webContents.send('auth:session-expired', { reason });
  }
}

function scheduleAutoLogout(exp) {
  if (!exp) return;
  const now = Math.floor(Date.now() / 1000);
  const ms = Math.max(0, (exp - now) * 1000);
  if (authState.timer) clearTimeout(authState.timer);
  authState.timer = setTimeout(() => {
    clearAuth('expired');
  }, ms);
}

// ====== WINDOW ======
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 900,
    minHeight: 600,
    show: false, // mostramos tras ready-to-show para evitar parpadeo
    title: 'Yajalones',
    icon: APP_ICON, // afecta icono de ventana y taskbar (en Windows usa .ico si prefieres)
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Carga dev o build
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    try {
      // Maximiza al abrir
      mainWindow.maximize();
      mainWindow.show();
    } catch {}
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // (Opcional) quitar menú
  mainWindow.removeMenu();
}

// ====== IPC: título app (por si desde renderer quieres cambiarlo) ======
ipcMain.handle('app:set-title', (_e, title) => {
  if (mainWindow && typeof title === 'string') {
    mainWindow.setTitle(title);
  }
});

// ====== IPC: AUTH ======

// Login: recibe credenciales, llama al backend y guarda el token en memoria
ipcMain.handle('auth:login', async (_event, { nombreUsuario, password }) => {
  try {
    const { data } = await axios.post(`${API_BASE}/inicioSesion`, {
      nombreUsuario,
      password,
    }, { headers: { 'Content-Type': 'application/json' } });

    const token = data && data.access_token;
    if (!token) {
      return { ok: false, message: 'Respuesta inválida del servidor' };
    }

    const payload = decodeJwtPayload(token);
    if (!payload || !payload.exp) {
      return { ok: false, message: 'Token inválido' };
    }

    // Guardar en memoria y programar auto-logout
    authState.token = token;
    authState.exp = payload.exp;
    scheduleAutoLogout(payload.exp);

    return { ok: true };
  } catch (err) {
    // Mensaje simple para no filtrar detalles internos
    return { ok: false, message: 'Credenciales inválidas o servidor no disponible' };
  }
});

// Devuelve token sólo si no está vencido
ipcMain.handle('auth:getToken', async () => {
  if (!authState.token || !authState.exp) return null;
  const now = Math.floor(Date.now() / 1000);
  if (authState.exp <= now) {
    clearAuth('expired');
    return null;
  }
  return authState.token;
});

// Logout explícito
ipcMain.handle('auth:logout', async () => {
  clearAuth('logout');
  return true;
});

// ====== APP LIFE ======
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  // Política: cerrar app = cerrar sesión (borramos token)
  clearAuth('app-closed');
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// electron/main.cjs
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const log = require('electron-log');
const path = require('path');
const axios = require('axios');
const { registerPDFIpc } = require('./pdf.cjs'); // IPCs de PDF
const { autoUpdater } = require("electron-updater");


const isDev = !app.isPackaged;
const API_BASE = process.env.VITE_API_BASE || 'http://localhost:8081';
const APP_ICON = path.join(__dirname, 'assets', 'icono.ico');

const authState = { token: null, exp: null, timer: null };
const currentUser = { username: null, terminal: null };

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';


// ------------ utilidades ------------
function decodeJwtPayload(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
  } catch { return null; }
}

function broadcast(channel, payload) {
  for (const w of BrowserWindow.getAllWindows()) {
    try { w.webContents.send(channel, payload); } catch {}
  }
}

function scheduleAutoLogout(exp) {
  if (!exp) return;
  const ms = Math.max(0, (exp - Math.floor(Date.now() / 1000)) * 1000);
  if (authState.timer) clearTimeout(authState.timer);
  authState.timer = setTimeout(() => clearAuth('expired'), ms);
}

let clearedOnce = false;
function clearAuth(reason = 'logout') {
  if (clearedOnce) return;         // evita doble ejecución
  clearedOnce = true;

  authState.token = null;
  authState.exp = null;
  if (authState.timer) { clearTimeout(authState.timer); authState.timer = null; }
  currentUser.username = null;
  currentUser.terminal = null;

  // notifica a TODOS los renderers
  broadcast('auth:session-expired', { reason });
  broadcast('auth:session-closed', { reason });
}

// ------------ ventana principal ------------
let mainWindow = null;
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 900,
    minHeight: 600,
    show: false,
    title: 'Yajalones',
    icon: APP_ICON,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.cjs'), // <-- usa el nombre real que tengas
    },
  });

  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    try { mainWindow.maximize(); mainWindow.show(); } catch {}
  });

  // 🔒 al cerrar la ventana, limpia sesión
  mainWindow.on('close', () => { clearAuth('window-closed'); });
  mainWindow.on('closed', () => { mainWindow = null; });
  mainWindow.removeMenu();
}

//------------- IPCs de ticket -------------
ipcMain.handle('imprimir-ticket-pasajero', async (_e, { pasajero, viaje }) => {
  // Genera el HTML del ticket
  const ticketHtml = `
    <div style="font-family: monospace; font-size: 14px;">
    <h2 style="text-align:center;">Los Yajalones</h2>
      <h2 style="text-align:center;">Pasajero</h2>
      <hr>
      <div>Folio: ${pasajero.folio ?? ''}</div>
      <div>Nombre: ${pasajero.nombre ?? ''} ${pasajero.apellido ?? ''}</div>
      <div>Asiento: ${pasajero.asiento ?? ''}</div>
      <div>Unidad: ${viaje?.unidad?.nombre ?? ''}</div>
      <div>Origen: ${viaje?.origen ?? ''}</div>
      <div>Destino: ${viaje?.destino ?? ''}</div>
      <div>Fecha: ${viaje?.fechaSalida ? new Date(viaje.fechaSalida).toLocaleDateString('es-MX') : ''}</div>
      <div>Hora: ${viaje?.fechaSalida ? new Date(viaje.fechaSalida).toLocaleTimeString('es-MX') : ''}</div>
      <div>Tipo: ${pasajero.tipo ?? ''}</div>
      <div>Pago: ${pasajero.tipoPago ?? ''}</div>
      <div>Importe: $${parseFloat(pasajero.importe ?? 0).toFixed(2)}</div>
      <hr>
      <div style="text-align:center;">¡Buen viaje!</div>
    </div>
  `;

  // Crea una ventana oculta para imprimir
  const printWindow = new BrowserWindow({
    show: false,
    webPreferences: { nodeIntegration: true }
  });

  printWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(ticketHtml));
  printWindow.webContents.on('did-finish-load', () => {
    printWindow.webContents.print({
      silent: false, // true para no mostrar diálogo
      printBackground: true,
      // deviceName: 'Nombre_de_tu_impresora' // Opcional: pon el nombre exacto de tu impresora
    }, () => {
      printWindow.close();
    });
  });

  return true;
});
//------------- IPCs de ticket Paquete-------------

ipcMain.handle("imprimir-html", async (_e, html) => {
  const win = new BrowserWindow({ show: true });
  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
  win.webContents.print({ silent: false, printBackground: true }, () => win.close());
  return true;
});

// ------------ IPCs no-PDF ------------
ipcMain.handle('app:set-title', (_e, t) => {
  if (mainWindow && typeof t === 'string') mainWindow.setTitle(t);
});

ipcMain.handle('auth:login', async (_e, { nombreUsuario, password }) => {
  try {
    const { data } = await axios.post(
      `${API_BASE}/inicio-sesion`,
      { nombreUsuario, password },
      { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
    );
    const token = data?.access_token;
    if (!token) return { ok: false, message: 'Respuesta inválida del servidor' };

    const payload = decodeJwtPayload(token);
    if (!payload?.exp) return { ok: false, message: 'Token inválido' };

    authState.token = token;
    authState.exp = payload.exp;
    scheduleAutoLogout(payload.exp);

    const username = String(nombreUsuario || '').toLowerCase();
    currentUser.username = username;
    currentUser.terminal =
      username.includes('yajalon') ? 'YAJALON' :
      username.includes('tuxtla') ? 'TUXTLA' : null;

    clearedOnce = false; // nueva sesión -> permite limpiar de nuevo
    return { ok: true };
  } catch {
    return { ok: false, message: 'Credenciales inválidas o servidor no disponible' };
  }
});

ipcMain.handle('auth:getToken', async () => {
  if (!authState.token || !authState.exp) return null;
  if (authState.exp <= Math.floor(Date.now() / 1000)) {
    clearAuth('expired');
    return null;
  }
  return authState.token;
});

ipcMain.handle('auth:logout', async () => {
  clearAuth('logout');
  return true;
});

ipcMain.handle('session:getUser', async () => {
  if (!authState.token) return null;
  return { ...currentUser };
});

// ------------ PDF ------------
registerPDFIpc();

// Auto actualizaciones
autoUpdater.on('checking-for-update', () => {
  log.info('Buscando actualizaciones...');
});
autoUpdater.on('update-available', (info) => {
  log.info('Actualización disponible:', info);
});
autoUpdater.on('update-not-available', () => {
  log.info('No hay actualizaciones.');
});
autoUpdater.on('error', (err) => {
  log.error('Error en autoUpdater:', err);
});
autoUpdater.on('download-progress', (progressObj) => {
  log.info(`Descargando actualización: ${progressObj.percent}%`);
});
autoUpdater.on('update-downloaded', () => {
  log.info('Actualización descargada, preguntando al usuario...');
  if (mainWindow) {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      buttons: ['Reiniciar ahora', 'Más tarde'],
      defaultId: 0,
      cancelId: 1,
      title: 'Actualización disponible',
      message: 'Se ha descargado una nueva versión. ¿Quieres reiniciar ahora para actualizar?',
      detail: 'Puedes reiniciar ahora para aplicar la actualización o hacerlo más tarde.'
    }).then(result => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
      // Si elige "Más tarde", no se reinicia y la actualización se aplicará al cerrar la app.
    });
  } else {
    autoUpdater.quitAndInstall();
  }
});

// Inicia la búsqueda de actualizaciones cuando la app esté lista
app.on('ready', () => {
  autoUpdater.checkForUpdatesAndNotify();
});

// ------------ ciclo de vida app ------------
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// al intentar salir (menú/sistema), notifica y limpia
app.on('before-quit', () => { clearAuth('before-quit'); });

// cuando no queden ventanas, limpia y termina
app.on('window-all-closed', () => {
  clearAuth('app-closed');
  if (process.platform !== 'darwin') app.quit();
});

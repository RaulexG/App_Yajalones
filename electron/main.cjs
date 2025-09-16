// electron/main.cjs
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const log = require('electron-log');
const path = require('path');
const axios = require('axios');
const { registerPDFIpc } = require('./pdf.cjs'); // IPCs de PDF
const { autoUpdater } = require("electron-updater");
const ThermalPrinter = require("node-thermal-printer").printer;
const PrinterTypes = require("node-thermal-printer").types;


const isDev = !app.isPackaged;
const API_BASE = process.env.VITE_API_BASE || 'https://yajalones-app-81c1abc5059e.herokuapp.com';
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
      sandbox: false,
      preload: path.join(__dirname, 'preload.cjs'), // <-- usa el nombre real que tengas
    },
  });

  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', async() => {
    try {await initPrinter(); mainWindow.maximize(); mainWindow.show(); } catch {}
  });

  // 🔒 al cerrar la ventana, limpia sesión
  mainWindow.on('close', () => { clearAuth('window-closed'); });
  mainWindow.on('closed', () => { mainWindow = null; });
  mainWindow.removeMenu();
}

async function detectarImpresora() {
  const ventana = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
  if (!ventana) return null;

  // 👇 espera la promesa
  const printers = await ventana.webContents.getPrintersAsync();

  console.log("🔍 Impresoras detectadas:", printers.map(p => p.name));

  const encontrada = printers.find(p =>
    /GTP|pos|58/i.test(p.name) // busca por nombre parcial
  );

  return encontrada ? `printer:"${encontrada.name}"` : null;
}


// ------------ Configuración impresora térmica ------------
let printer = null;

async function initPrinter() {
  const interfaceName = await detectarImpresora(); // "dummy" para modo simulación
  if (!interfaceName) {
    console.error("⚠️ No se detectó impresora térmica.");
    dialog.showErrorBox(
      "Impresora no encontrada",
      "No se detectó la impresora térmica (58mm). Verifica que esté conectada y encendida."
    );
    return;
  }

try {
  printer = new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface: interfaceName,
    options: { timeout: 5000 },
    width: 32,
    characterSet: "SLOVENIA",
    removeSpecialCharacters: false,
    lineCharacter: "-",
  });
  console.log("✅ Impresora inicializada:", interfaceName);
} catch (err) {
  console.error("❌ Error al inicializar impresora:", err);
  dialog.showErrorBox("Error de impresora", "No se pudo inicializar la impresora térmica.\n" + err.message);
  printer = null;
}

  
  console.log("✅ Impresora inicializada: " + interfaceName);
}

//------------- IPCs de ticket -------------
ipcMain.handle("imprimir-ticket-pasajero", async (_e, { pasajero, viaje }) => {
  try {
    if (!printer) throw new Error("La impresora térmica no está inicializada");

    // --- Construir ticket ---
    printer.alignCenter();
    printer.setTextDoubleHeight();
    printer.println(" Los Yajalones");
    printer.setTextNormal();
    printer.println(" TICKET DE PASAJERO");
    printer.drawLine();

    printer.alignLeft();
    printer.println(`Folio: ${pasajero.folio ?? ""}`);
    printer.println(`Nombre: ${pasajero.nombre ?? ""} ${pasajero.apellido ?? ""}`);
    printer.println(`Asiento: ${pasajero.asiento ?? ""}`);
    printer.println(`Unidad: ${viaje?.unidad?.nombre ?? ""}`);
    printer.println(`Origen: ${viaje?.origen ?? ""}`);
    printer.println(`Destino: ${viaje?.destino ?? ""}`);
    printer.println(
      `Fecha: ${
        viaje?.fechaSalida ? new Date(viaje.fechaSalida).toLocaleDateString("es-MX") : ""
      }`
    );
    printer.println(
      `Hora: ${
        viaje?.fechaSalida ? new Date(viaje.fechaSalida).toLocaleTimeString("es-MX") : ""
      }`
    );
    printer.println(`Tipo: ${pasajero.tipo ?? ""}`);
    printer.println(`Pago: ${pasajero.tipoPago ?? ""}`);
    printer.println(`Importe: $${parseFloat(pasajero.importe ?? 0).toFixed(2)}`);

    printer.drawLine();
    printer.alignCenter();
    printer.println("¡Buen viaje!");
    printer.cut();

    // --- Simulación / ejecución ---
    const buffer = printer.getBuffer();
    console.log("🖨️ ESC/POS generado:", buffer);
    console.log("🖨️ Texto plano:\n" + buffer.toString("ascii"));

    // Solo ejecuta si no estás en dummy
    if (printer.interface && printer.interface !== "dummy") {
      await printer.execute();
      return { ok: true };
    } else {
      return { ok: true, simulated: true };
    }
  } catch (err) {
    console.error("Error al imprimir ticket pasajero:", err);
    return { ok: false, error: err.message };
  }
});




//------------- IPCs de ticket Paquete-------------

ipcMain.handle("imprimir-html", async (_e, html) => {
  const win = new BrowserWindow({ show: false });
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
    setTimeout(() => initPrinter(), 2000);

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

// electron/pdf.cjs
const { BrowserWindow, dialog, ipcMain, shell } = require('electron');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

async function htmlToFileURL(html) {
  const tmpPath = path.join(os.tmpdir(), `yajalones-${Date.now()}.html`);
  await fs.writeFile(tmpPath, html, 'utf8');
  return { url: `file://${tmpPath.replace(/\\/g, '/')}`, tmpPath };
}

async function askSavePath(defaultName) {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Guardar PDF',
    defaultPath: defaultName || 'CorteDia.pdf',
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
  });
  if (canceled || !filePath) return null;
  return filePath;
}

async function printURLToPDF(url, defaultName /*, opts */) {
  const filePath = await askSavePath(defaultName);
  if (!filePath) return { ok: false, message: 'Guardado cancelado' };

  const win = new BrowserWindow({
    show: false,
    webPreferences: { sandbox: true },
  });

  try {
    await win.loadURL(url);
    const pdf = await win.webContents.printToPDF({
      printBackground: true,
      marginsType: 0,          // 0=default, 1=none, 2=minimum
      pageSize: 'Letter',      // ← usa 'Letter' para coincidir con jsPDF({format:'letter'})
      landscape: false,
      // preferCSSPageSize: true, // ← OPCIONAL: respeta @page { size: ... } del CSS
      // scaleFactor: 100,        // ← OPCIONAL: 100 = 100%
    });
    await fs.writeFile(filePath, pdf);
    try { await shell.openPath(filePath); } catch {}
    return { ok: true, path: filePath };
  } finally {
    win.destroy();
  }
}

function registerPDFIpc() {
  // HTML -> PDF (temporal + limpieza)
  ipcMain.handle('pdf:save-html', async (_e, { html, suggestedName }) => {
    try {
      if (typeof html !== 'string' || !html.trim()) {
        return { ok: false, message: 'HTML vacío o inválido' };
      }
      const { url, tmpPath } = await htmlToFileURL(html);
      try {
        return await printURLToPDF(url, suggestedName || 'CorteDia.pdf');
      } finally {
        try { await fs.unlink(tmpPath); } catch {}
      }
    } catch (err) {
      return { ok: false, message: err?.message || 'Error al generar PDF' };
    }
  });

  // URL -> PDF
  ipcMain.handle('pdf:save-url', async (_e, { url, suggestedName }) => {
    try {
      const valid =
        typeof url === 'string' &&
        (/^https?:\/\//i.test(url) || /^file:\/\//i.test(url) || /^data:/i.test(url));
      if (!valid) return { ok: false, message: 'URL inválida' };
      return await printURLToPDF(url, suggestedName || 'CorteDia.pdf');
    } catch (err) {
      return { ok: false, message: err?.message || 'Error al generar PDF' };
    }
  });

  // Guardar PDF crudo (ArrayBuffer/TypedArray desde jsPDF)
  ipcMain.handle('save-pdf', async (_evt, { data, filename }) => {
    try {
      if (!data || typeof data.byteLength !== 'number') {
        return { ok: false, message: 'Datos inválidos' };
      }
      const buffer = Buffer.from(data); // ArrayBuffer -> Buffer
      const filePath = await askSavePath(filename || 'CorteDia.pdf');
      if (!filePath) return { ok: false, canceled: true };

      await fs.writeFile(filePath, buffer);
      try { await shell.openPath(filePath); } catch {}
      return { ok: true, path: filePath };
    } catch (e) {
      return { ok: false, message: 'Error guardando PDF' };
    }
  });
}

module.exports = { registerPDFIpc };

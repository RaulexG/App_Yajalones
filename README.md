# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

* [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses Babel for Fast Refresh
* [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses SWC for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

---

## Contexto del proyecto

En esta fase construimos la **app de escritorio** para "Los Yajalones" con React, Vite, Tailwind CSS y Electron, consumiendo la API REST en Java/Spring Boot. Las funcionalidades incluyen venta de boletos, gestión de paquetería, registro de choferes/unidades y ajustes del sistema.

---

## Scripts disponibles

Después de clonar e instalar dependencias (`npm install`), usa:

* **`npm run dev`**: inicia el servidor de desarrollo de Vite con HMR.
* **`npm run electron`**: abre la app de escritorio conectada al servidor de Vite.

---

## 🛠4. Construcción para producción y generar `.exe`

### Instalar `electron-builder`

```bash
npm install --save-dev electron-builder
```

### Ejemplo de sección relevante en `package.json`

```jsonc
{
  "name": "yajalones-app",
  "version": "1.0.0",
  "private": true,
  "main": "electron/main.js",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "electron": "electron .",
    "build": "vite build",
    "dist": "electron-builder"
  },
  "devDependencies": {
    "electron-builder": "^26.0.12"
  },
  "build": {
    "appId": "com.yajalones.app",
    "productName": "Yajalones",
    "directories": {"output": "dist-electron"},
    "files": ["dist", "electron/**/*", "package.json"],
    "win": {"target": "nsis"}
  }
}
```

### Comandos de build

```bash
# Genera la carpeta de producción React
npm run build
# Empaqueta todo y genera .exe
npm run dist
```

### Evitar errores de firma en Windows

```powershell
$env:CSC_IDENTITY_AUTO_DISCOVERY="false"; npm run dist
```

> Al finalizar, encontrarás el instalador en:
>
> `dist-electron\Yajalones Setup <version>.exe` 

---



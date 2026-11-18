// Processo principal do Electron: abre a janela e atende o pedido de medição vindo da tela.
"use strict";

const { app, BrowserWindow, ipcMain, shell, clipboard } = require("electron");
const path = require("path");

let mainWin = null;

// No app instalado, o Chromium vem embutido em resources/ms-playwright. Em desenvolvimento,
// o Playwright usa o navegador instalado na máquina (variável não definida). Precisa vir
// antes de carregar a medição, que é quem usa o Playwright.
if (app.isPackaged) {
  process.env.PLAYWRIGHT_BROWSERS_PATH = path.join(process.resourcesPath, "ms-playwright");
}

const { runTest } = require("./src/run-test");

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 840,
    minWidth: 820,
    minHeight: 600,
    backgroundColor: "#0e1316",
    title: "Quantoleva",
    icon: path.join(__dirname, "build", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.setMenuBarVisibility(false);
  // Links externos abrem no navegador do sistema, não dentro do app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
  win.loadFile(path.join(__dirname, "renderer", "index.html"));
  mainWin = win;
}

// A tela chama window.api.measure(url); aqui a medição roda de verdade (Node + Chromium).
ipcMain.handle("measure", async (_event, url) => {
  try {
    const result = await runTest(url);
    return { ok: true, result };
  } catch (e) {
    return { ok: false, code: e.code || "internal", message: String(e.message || e) };
  }
});

// Ações sobre uma imagem: copiar a URL, abrir no navegador e baixar.
ipcMain.handle("copy-text", (_event, text) => { clipboard.writeText(String(text)); return true; });
ipcMain.handle("open-external", (_event, url) => shell.openExternal(url));
ipcMain.handle("download-url", (_event, url) => {
  if (mainWin) mainWin.webContents.downloadURL(url); // o Windows pergunta onde salvar
  return true;
});

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

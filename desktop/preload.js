// Ponte segura entre a tela e o processo principal. A tela só enxerga window.api.measure().
"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  measure: (url) => ipcRenderer.invoke("measure", url),
  copy: (text) => ipcRenderer.invoke("copy-text", text),
  openExternal: (url) => ipcRenderer.invoke("open-external", url),
  download: (url) => ipcRenderer.invoke("download-url", url),
});

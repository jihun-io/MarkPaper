const { ipcRenderer, contextBridge } = require("electron");

// 로드 확인 메시지
console.log("preload.js가 정상적으로 로드되었습니다.");

contextBridge.exposeInMainWorld("electronAPI", {
  createNewWindow: () => ipcRenderer.invoke("window:create"),
  printToPDF: () => ipcRenderer.invoke("print-to-pdf"),
  saveFile: (filePath, content) =>
    ipcRenderer.invoke("save-file", filePath, content),
  loadFile: () => ipcRenderer.invoke("load-file"),
  readFile: (filePath) => ipcRenderer.invoke("read-file", filePath),
  showSaveDialog: (options) => ipcRenderer.invoke("dialog:showSave", options),
  showOpenDialog: (options) => ipcRenderer.invoke("dialog:showOpen", options),
  showCloseConfirmation: () => ipcRenderer.invoke("show-close-confirmation"),
  onMenuOpen: (callback) =>
    ipcRenderer.on("menu:open", (event, filePath) => callback(filePath)),
  removeMenuOpenListener: () => ipcRenderer.removeAllListeners("menu:open"),
  onMenuSave: (callback) => ipcRenderer.on("menu:save", callback),
  onMenuSaveAs: (callback) => ipcRenderer.on("menu:saveAs", callback),
  removeMenuSaveListener: () => ipcRenderer.removeAllListeners("menu:save"),
  removeMenuSaveAsListener: () => ipcRenderer.removeAllListeners("menu:saveAs"),
  onMenuPrint: (callback) => ipcRenderer.on("menu:print", callback),
  removeMenuPrintListener: () => ipcRenderer.removeAllListeners("menu:print"),
  closeWindow: () => ipcRenderer.send("close-window"),
});

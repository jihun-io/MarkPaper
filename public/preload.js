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
});

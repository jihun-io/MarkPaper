const { ipcRenderer, contextBridge } = require("electron");

// 로드 확인 메시지
console.log("preload.js가 정상적으로 로드되었습니다.");

contextBridge.exposeInMainWorld("electronAPI", {
  printToPDF: () => ipcRenderer.send("print-to-pdf"),
});

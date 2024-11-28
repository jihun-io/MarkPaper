const { ipcRenderer, contextBridge } = require("electron");

// 로드 확인 메시지
console.log("preload.js가 정상적으로 로드되었습니다.");

contextBridge.exposeInMainWorld("electronAPI", {
  createNewWindow: () => ipcRenderer.invoke("window:create"),
  setWindowTitle: (title) => ipcRenderer.send("update-window-title", title),

  printToPDF: (pageSize) => ipcRenderer.invoke("print-to-pdf", pageSize),

  // 바이너리/텍스트 저장 지원
  saveFile: (filePath, content) =>
    ipcRenderer.invoke("save-file", filePath, content),

  loadFile: () => ipcRenderer.invoke("load-file"),

  // 바이너리 모드 옵션 추가
  readFile: (filePath, binary = false) =>
    ipcRenderer.invoke("read-file", filePath, binary),

  // 파일 다이얼로그 기본 필터 수정
  showSaveDialog: (options = {}) =>
    ipcRenderer.invoke("dialog:showSave", {
      filters: [
        { name: "MarkPaper", extensions: ["mp"] },
        { name: "Markdown", extensions: ["md"] },
      ],
      ...options,
    }),

  showOpenDialog: (options = {}) =>
    ipcRenderer.invoke("dialog:showOpen", {
      properties: ["openFile"],
      filters: [
        { name: "MarkPaper & Markdown", extensions: ["mp", "md"] },
        { name: "MarkPaper", extensions: ["mp"] },
        { name: "Markdown", extensions: ["md"] },
      ],
      ...options,
    }),

  showCloseConfirmation: () => ipcRenderer.invoke("show-close-confirmation"),

  // 메뉴 이벤트 리스너
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

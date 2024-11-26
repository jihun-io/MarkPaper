const { app, BrowserWindow, ipcMain, dialog, Menu } = require("electron");
const path = require("path");
const fs = require("fs").promises;

// 창 관리를 위한 배열
const windows = new Set();

// 새 창 생성 함수
function createWindow() {
  const newWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    title: "MarkPaper",
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, "preload.js"),
      enableRemoteModule: true,
    },
  });

  const startUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : `file://${path.join(__dirname, "../build/index.html")}`;

  newWindow.loadURL(startUrl);

  // 개발 환경에서 개발자 도구 열기
  if (process.env.NODE_ENV === "development") {
    newWindow.webContents.openDevTools();
  }

  // 창 추적
  windows.add(newWindow);

  // 창이 닫힐 때 Set에서 제거
  newWindow.on("closed", () => {
    windows.delete(newWindow);
  });

  return newWindow;
}

// 메뉴 템플릿 생성
function createMenuTemplate() {
  const template = [
    {
      label: "파일",
      role: "fileMenu",
      submenu: [
        {
          label: "새로운 윈도우",
          accelerator: "CmdOrCtrl+N",
          click: () => createWindow(),
        },
        { type: "separator" },
        {
          label: "인쇄",
          accelerator: "CmdOrCtrl+P",
          click: async (menuItem, browserWindow) => {
            const { success, path } =
              await browserWindow.webContents.printToPDF({});
            if (success) {
              console.log("PDF 파일 생성 성공:", path);
            }
          },
        },
      ],
    },
    {
      label: "편집",
      role: "editMenu",
      submenu: [
        { label: "실행 취소", role: "undo" },
        { label: "다시 실행", role: "redo" },
        { type: "separator" },
        { label: "오려두기", role: "cut" },
        { label: "복사하기", role: "copy" },
        { label: "붙여넣기", role: "paste" },
        { label: "삭제", role: "delete" },
        { type: "separator" },
        { label: "전체 선택", role: "selectAll" },
      ],
    },
    {
      label: "보기",
      role: "view",
      submenu: [
        { label: "전체 화면 시작", role: "togglefullscreen" },
        { label: "실제 크기", role: "resetZoom" },
        { label: "확대", role: "zoomIn" },
        { label: "축소", role: "zoomOut" },
      ],
    },
    {
      label: "윈도우",
      role: "window",
      submenu: [{ label: "최소화", role: "minimize" }],
    },
  ];

  // macOS에서는 애플리케이션 메뉴 추가
  if (process.platform === "darwin") {
    template.unshift({
      label: app.name,
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "services" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideothers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" },
      ],
    });
  }

  return template;
}

// Dock 메뉴 생성
function createDockMenu() {
  const dockMenu = Menu.buildFromTemplate([
    {
      label: "새로운 윈도우",
      click() {
        createWindow();
      },
    },
  ]);

  // macOS에서만 Dock 메뉴 설정
  if (process.platform === "darwin") {
    app.dock.setMenu(dockMenu);
  }
}

// 첫 번째 창은 app ready 이벤트에서 생성
app.on("ready", () => {
  process.env.LANG = "ko_KR.UTF-8";

  // 메뉴바 설정
  const menu = Menu.buildFromTemplate(createMenuTemplate());
  Menu.setApplicationMenu(menu);

  // Dock 메뉴 설정
  createDockMenu();

  // 첫 번째 창 생성
  createWindow();
});

// 새 창 생성 IPC 핸들러
ipcMain.handle("window:create", () => {
  createWindow();
});

ipcMain.handle("print-to-pdf", async (event) => {
  const pdfPath = path.join(app.getPath("documents"), "print.pdf");
  const browserWindow = BrowserWindow.fromWebContents(event.sender);

  try {
    const data = await browserWindow.webContents.printToPDF({});
    await fs.writeFile(pdfPath, data);

    const pdfWindow = new BrowserWindow({ width: 800, height: 600 });
    pdfWindow.title = "인쇄 및 저장";
    pdfWindow.loadURL("file://" + pdfPath);

    return { success: true, path: pdfPath };
  } catch (error) {
    console.error("PDF 생성 실패:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("save-file", async (event, filePath, content) => {
  try {
    await fs.writeFile(filePath, content, { encoding: "utf8" });
    return true;
  } catch (error) {
    console.error("파일 저장 에러:", error);
    throw error;
  }
});

ipcMain.handle("read-file", async (event, filePath) => {
  try {
    const content = await fs.readFile(filePath, { encoding: "utf8" });
    return content;
  } catch (error) {
    console.error("파일 읽기 에러:", error);
    throw error;
  }
});

ipcMain.handle("dialog:showSave", async (event, options) => {
  const result = await dialog.showSaveDialog({
    defaultPath: options.defaultPath,
    filters: options.filters,
  });
  return result;
});

ipcMain.handle("dialog:showOpen", async (event, options) => {
  return dialog.showOpenDialog({
    properties: options.properties,
    filters: options.filters,
  });
});

ipcMain.handle("show-close-confirmation", async () => {
  const { response } = await dialog.showMessageBox({
    type: "question",
    buttons: ["저장 후 종료", "저장하지 않고 종료", "취소"],
    defaultId: 0,
    title: "저장되지 않은 변경사항",
    message: "저장되지 않은 변경사항이 있습니다. 저장하시겠습니까?",
  });
  return response;
});

app.on("window-all-closed", () => {
  // Windows에서 모든 창이 닫히면 앱 종료
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

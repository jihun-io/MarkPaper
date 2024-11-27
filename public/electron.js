const { app, BrowserWindow, ipcMain, dialog, Menu } = require("electron");
const path = require("path");
const fs = require("fs").promises;

// 창 관리를 위한 배열
const windows = new Set();

// 파일 연결 설정
function setupFileAssociations() {
  // .md 파일 확장자 연결
  if (process.platform === "win32") {
    app.setAsDefaultProtocolClient("markdown");
  }
}

// 파일을 여는 함수
async function openFileInWindow(filePath, existingWindow = null) {
  let targetWindow = existingWindow;

  if (!targetWindow) {
    targetWindow = createWindow();
    await new Promise((resolve) =>
      targetWindow.webContents.once("did-finish-load", resolve)
    );
  }

  targetWindow.webContents.send("menu:open", filePath);
  return targetWindow;
}

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
          label: "신규...",
          accelerator: "CmdOrCtrl+N",
          click: () => createWindow(),
        },
        {
          label: "열기...",
          accelerator: "CmdOrCtrl+O",
          click: async (menuItem, browserWindow) => {
            const result = await dialog.showOpenDialog(browserWindow, {
              properties: ["openFile"],
              filters: [{ name: "Markdown 파일", extensions: ["md"] }],
            });
            if (!result.canceled && result.filePaths.length > 0) {
              const newWindow = createWindow();
              newWindow.webContents.once("did-finish-load", () => {
                newWindow.webContents.send("menu:open", result.filePaths[0]);
              });
            }
          },
        },
        { type: "separator" },
        {
          label: "저장",
          accelerator: "CmdOrCtrl+S",
          click: async (menuItem, browserWindow) => {
            if (browserWindow) {
              browserWindow.webContents.send("menu:save");
            }
          },
        },
        {
          label: "다른 이름으로 저장",
          accelerator: "CmdOrCtrl+Shift+S",
          click: async (menuItem, browserWindow) => {
            if (browserWindow) {
              browserWindow.webContents.send("menu:saveAs");
            }
          },
        },
        { type: "separator" },
        {
          label: "인쇄",
          accelerator: "CmdOrCtrl+P",
          click: async (menuItem, browserWindow) => {
            if (browserWindow) {
              // renderer 프로세스에 인쇄 이벤트 전송
              browserWindow.webContents.send("menu:print");
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
        { label: "MarkPaper에 관하여", role: "about" },
        { type: "separator" },
        { label: "서비스", role: "services" },
        { type: "separator" },
        { label: "숨기기", role: "hide" },
        { label: "기타 숨기기", role: "hideothers" },
        { label: "모두 표시", role: "unhide" },
        { type: "separator" },
        { label: "MarkPaper 종료", role: "quit" },
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

  // 파일 연결 설정
  setupFileAssociations();

  // 메뉴바 설정
  const menu = Menu.buildFromTemplate(createMenuTemplate());
  Menu.setApplicationMenu(menu);

  // Dock 메뉴 설정
  createDockMenu();

  // 시작 시 전달된 파일 경로가 있는지 확인
  const fileToOpen = process.argv.find((arg) => arg.endsWith(".md"));
  if (fileToOpen) {
    createWindow();
    openFileInWindow(fileToOpen);
  } else {
    createWindow();
  }
});

// 파일 연결 이벤트 처리
app.on("will-finish-launching", () => {
  // macOS에서 파일 더블클릭으로 열기
  app.on("open-file", (event, filePath) => {
    event.preventDefault();
    openFileInWindow(filePath);
  });

  // Windows에서 파일 더블클릭으로 열기
  app.on("second-instance", (event, commandLine) => {
    const fileToOpen = commandLine.find((arg) => arg.endsWith(".md"));
    if (fileToOpen) {
      openFileInWindow(fileToOpen);
    }
  });
});

// 중복 실행 방지
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

// 새 창 생성 IPC 핸들러
ipcMain.handle("window:create", () => {
  createWindow();
});

ipcMain.handle("print-to-pdf", async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return { success: false, error: "Window not found" };

  const pdfPath = path.join(app.getPath("documents"), "print.pdf");

  try {
    const data = await win.webContents.printToPDF({
      printBackground: true,
    });
    await fs.writeFile(pdfPath, data);

    const pdfWindow = new BrowserWindow({
      width: 800,
      height: 600,
      parent: win, // 부모 창 설정
    });
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
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return { canceled: true };

  return dialog.showSaveDialog(win, {
    defaultPath: options.defaultPath,
    filters: options.filters,
  });
});

ipcMain.handle("dialog:showOpen", async (event, options) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return { canceled: true };

  return dialog.showOpenDialog(win, {
    properties: options.properties,
    filters: options.filters,
  });
});

ipcMain.handle("show-close-confirmation", async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;

  const { response } = await dialog.showMessageBox(win, {
    type: "question",
    buttons: ["저장 후 닫기", "저장하지 않고 닫기", "취소"],
    defaultId: 0,
    title: "저장되지 않은 변경사항",
    message: "저장되지 않은 변경사항이 있습니다. 저장하시겠습니까?",
  });
  return response;
});

ipcMain.on("close-window", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.close();
  }
});

app.on("window-all-closed", () => {
  windows.clear(); // Set 초기화
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

const { app, BrowserWindow, ipcMain, dialog, Menu } = require("electron");
const path = require("path");
const fs = require("fs").promises;
const os = require("os");

// 창 관리를 위한 배열
const windows = new Set();

// 파일 연결 설정 함수
function setupFileAssociations() {
  if (process.platform === "win32") {
    app.setAsDefaultProtocolClient("markdown");
    // MP 파일 확장자 연결 추가
    app.setAsDefaultProtocolClient("markpaper");
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
              filters: [
                { name: "모든 지원 형식", extensions: ["mp", "md"] },
                { name: "MarkPaper 파일", extensions: ["mp"] },
                { name: "Markdown 파일", extensions: ["md"] },
              ],
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

// 파일 확장자 관련 이벤트 처리 수정
app.on("will-finish-launching", () => {
  // macOS에서 파일 더블클릭으로 열기
  app.on("open-file", (event, filePath) => {
    event.preventDefault();
    openFileInWindow(filePath);
  });

  // Windows에서 파일 더블클릭으로 열기
  app.on("second-instance", (event, commandLine) => {
    const fileToOpen = commandLine.find(
      (arg) => arg.endsWith(".md") || arg.endsWith(".mp")
    );
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

// 창 제목 변경 IPC 핸들러
ipcMain.on("update-window-title", (event, title) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.setTitle(title);
  }
});

ipcMain.handle("print-to-pdf", async (event, pageSize) => {
  console.log("Received page size:", pageSize);
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return { success: false, error: "Window not found" };

  // 창의 제목에서 파일명 추출
  let fileName = win.getTitle().replace(/\s*\*$/, "");

  // 파일 확장자를 .pdf로 변경
  const pdfFileName = fileName.replace(/\.(md|mp)$/, "") + ".pdf";
  const pdfPath = path.join(os.tmpdir(), pdfFileName);

  try {
    const data = await win.webContents.printToPDF({
      printBackground: true,
      pageSize: typeof pageSize === "string" ? pageSize : "A4",
    });
    await fs.writeFile(pdfPath, data);

    const pdfWindow = new BrowserWindow({
      width: 800,
      height: 600,
      parent: win,
    });
    // HTML viewer 페이지 로드 (PDF 경로를 쿼리 파라미터로 전달)
    const viewerPath = path.join(__dirname, "pdfViewer.html");
    pdfWindow.loadFile(viewerPath, {
      query: { pdf: `file://${pdfPath}` },
    });

    // 타이틀 유지를 위해 did-finish-load 이벤트에서 다시 설정
    pdfWindow.webContents.on("did-finish-load", () => {
      pdfWindow.setTitle(`${fileName} - 인쇄 미리 보기`);
    });

    // PDF 윈도우가 닫힐 때 임시 파일 삭제
    pdfWindow.on("closed", async () => {
      try {
        await fs.unlink(pdfPath);
        console.log("임시 PDF 파일 삭제됨:", pdfPath);
      } catch (err) {
        console.error("임시 파일 삭제 실패:", err);
      }
    });

    return { success: true, path: pdfPath };
  } catch (error) {
    // 에러 발생 시에도 임시 파일이 있다면 삭제 시도
    try {
      await fs.unlink(pdfPath);
    } catch (err) {
      // 삭제 실패는 무시
    }

    console.error("PDF 생성 실패:", error);
    return { success: false, error: error.message };
  }
});

// 파일 처리 IPC 핸들러 수정
ipcMain.handle("save-file", async (event, filePath, content) => {
  try {
    if (content instanceof Uint8Array || Buffer.isBuffer(content)) {
      // 바이너리 데이터(.mp 파일)
      await fs.writeFile(filePath, Buffer.from(content));
    } else if (content instanceof ArrayBuffer) {
      // ArrayBuffer(.mp 파일)
      await fs.writeFile(filePath, Buffer.from(content));
    } else if (typeof content === "string") {
      // 문자열(.md 파일)
      await fs.writeFile(filePath, content, { encoding: "utf8" });
    } else {
      // Blob 데이터(.mp 파일)
      const buffer = Buffer.from(await content.arrayBuffer());
      await fs.writeFile(filePath, buffer);
    }
    return true;
  } catch (error) {
    console.error("파일 저장 에러:", error);
    throw error;
  }
});

ipcMain.handle("read-file", async (event, filePath, binary = false) => {
  try {
    if (binary) {
      // 바이너리 모드로 읽기
      const content = await fs.readFile(filePath);
      return content;
    } else {
      // 텍스트 모드로 읽기
      const content = await fs.readFile(filePath, { encoding: "utf8" });
      return content;
    }
  } catch (error) {
    console.error("파일 읽기 에러:", error);
    throw error;
  }
});

// 저장 다이얼로그 핸들러 수정
ipcMain.handle("dialog:showSave", async (event, options) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return { canceled: true };

  const defaultOptions = {
    filters: [
      { name: "MarkPaper 파일", extensions: ["mp"] },
      { name: "Markdown 파일", extensions: ["md"] },
    ],
    ...options,
  };

  return dialog.showSaveDialog(win, defaultOptions);
});

// 열기 다이얼로그 핸들러 수정
ipcMain.handle("dialog:showOpen", async (event, options) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return { canceled: true };

  const defaultOptions = {
    properties: ["openFile"],
    filters: [
      { name: "모든 지원 형식", extensions: ["mp", "md"] },
      { name: "MarkPaper 파일", extensions: ["mp"] },
      { name: "Markdown 파일", extensions: ["md"] },
    ],
    ...options,
  };

  return dialog.showOpenDialog(win, defaultOptions);
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

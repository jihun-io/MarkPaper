const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs").promises; // promises API 사용

let mainWindow;

app.on("ready", () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, "preload.js"),
      enableRemoteModule: true,
    },
  });

  const startUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : `file://${__dirname}/index.html`;
  mainWindow.loadURL(startUrl);
  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }
});

ipcMain.on("print-to-pdf", (event) => {
  const pdfPath = path.join(app.getPath("documents"), "print.pdf");
  mainWindow.webContents
    .printToPDF({})
    .then((data) => {
      fs.writeFile(pdfPath, data, (error) => {
        if (error) throw error;
        const pdfWindow = new BrowserWindow({ width: 800, height: 600 });
        pdfWindow.loadURL("file://" + pdfPath);
      });
    })
    .catch((error) => {
      console.log(error);
    });
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

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

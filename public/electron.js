const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow;

app.on("ready", () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, "preload.js"),
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

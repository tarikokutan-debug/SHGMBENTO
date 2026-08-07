const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const { fork } = require("child_process");

let mainWindow = null;
let serverProcess = null;

const PORT = process.env.PORT || 3000;
const SERVER_URL = `http://localhost:${PORT}`;

function startLocalServer() {
  return new Promise((resolve) => {
    try {
      const serverScript = path.join(__dirname, "dist", "server.cjs");
      if (fs.existsSync(serverScript)) {
        console.log("[Electron] Starting bundled server directly in main process:", serverScript);
        process.env.NODE_ENV = "production";
        process.env.PORT = String(PORT);
        require(serverScript);
      } else {
        console.log("[Electron] Server script not found at dist/server.cjs");
      }
      setTimeout(resolve, 500);
    } catch (err) {
      console.error("[Electron] Failed to load local server module:", err);
      resolve();
    }
  });
}

async function createWindow() {
  await startLocalServer();

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "SHGM İzin Takip Sistemi - Masaüstü",
    icon: fs.existsSync(path.join(__dirname, "assets", "icon.png")) ? path.join(__dirname, "assets", "icon.png") : undefined,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "electron-preload.js"),
      webSecurity: false, // Allows local file loading & network UNC path access in desktop
    },
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    frame: true,
    autoHideMenuBar: false,
  });

  // Load app from local web server or fallback to local index.html
  mainWindow.loadURL(SERVER_URL).catch((err) => {
    console.warn("[Electron] loadURL failed, trying fallback to index.html:", err);
    const indexPath = path.join(__dirname, "dist", "index.html");
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
    } else {
      setTimeout(() => mainWindow.loadURL(SERVER_URL), 1000);
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Application menu configuration
  const menuTemplate = [
    {
      label: "Dosya",
      submenu: [
        {
          label: "Ortak Dosya Seç (Sunucu / Ağ Sürücüsü)...",
          accelerator: "CmdOrCtrl+O",
          click: async () => {
            if (!mainWindow) return;
            const result = await dialog.showOpenDialog(mainWindow, {
              title: "Ortak SHGM Veri Dosyasını Seçin",
              filters: [{ name: "JSON Veri Dosyası", extensions: ["json"] }],
              properties: ["openFile", "createDirectory"],
            });
            if (!result.canceled && result.filePaths.length > 0) {
              mainWindow.webContents.send("electron-selected-shared-file", result.filePaths[0]);
            }
          },
        },
        { type: "separator" },
        { label: "Çıkış", role: "quit" },
      ],
    },
    {
      label: "Düzenle",
      submenu: [
        { label: "Geri Al", role: "undo" },
        { label: "Yinele", role: "redo" },
        { type: "separator" },
        { label: "Kes", role: "cut" },
        { label: "Kopyala", role: "copy" },
        { label: "Yapıştır", role: "paste" },
        { label: "Tümünü Seç", role: "selectAll" },
        { label: "Sil", role: "delete" },
      ],
    },
    {
      label: "Görünüm",
      submenu: [
        { label: "Yenile", role: "reload" },
        { label: "Tam Ekran Yap", role: "togglefullscreen" },
        { type: "separator" },
        { label: "Geliştirici Araçları", role: "toggleDevTools" },
      ],
    },
    {
      label: "Yardım",
      submenu: [
        {
          label: "Sistem Hakkında",
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "SHGM İzin Takip Sistemi v5.6.2",
              message: "SHGM İzin Takip Sistemi Desktop Client",
              detail: "Mac ve Windows masaüstü sürümleri için 15 saniyede bir otomatik ortak klasör senkronizasyonu ile çalışır.",
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
}

// Electron IPC File Handlers
ipcMain.handle("select-shared-file", async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Ortak SHGM Veritabanı Dosyasını Seçin",
    filters: [{ name: "JSON Veri Dosyası", extensions: ["json"] }],
    properties: ["openFile", "promptToCreate"],
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

const fsPromises = fs.promises;

ipcMain.handle("read-local-json", async (event, filePath) => {
  try {
    const exists = await fsPromises.access(filePath).then(() => true).catch(() => false);
    if (exists) {
      const content = await fsPromises.readFile(filePath, "utf-8");
      const cleaned = content.trim().replace(/^\uFEFF/, "");
      const stat = await fsPromises.stat(filePath);
      return { success: true, data: JSON.parse(cleaned), lastModified: stat.mtimeMs };
    }
    return { success: false, error: "Dosya bulunamadı" };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle("write-local-json", async (event, filePath, data) => {
  try {
    const dir = path.dirname(filePath);
    await fsPromises.mkdir(dir, { recursive: true });

    const exists = await fsPromises.access(filePath).then(() => true).catch(() => false);

    // Safety guard against overwriting a populated file with empty data
    if (exists) {
      try {
        const existingRaw = (await fsPromises.readFile(filePath, "utf-8")).trim().replace(/^\uFEFF/, "");
        if (existingRaw.length > 50) {
          const existingData = JSON.parse(existingRaw);
          const existingFlights = Array.isArray(existingData) ? existingData : (existingData?.flights || []);
          const incomingFlights = Array.isArray(data) ? data : (data?.flights || []);

          if (existingFlights.length > 0 && incomingFlights.length === 0) {
            console.warn(`[IPC Safety Guard] Blocked overwrite of ${filePath}: Existing file has ${existingFlights.length} flights, incoming data is empty.`);
            return { success: false, error: "Güvenlik Engeli: Ortak dosyadaki mevcut uçuş verileri boş liste ile ezilemez." };
          }
        }
        // Automatic backup before overwrite
        await fsPromises.copyFile(filePath, filePath + ".bak");
      } catch (guardErr) {
        console.warn("[IPC Safety Guard Warning]", guardErr);
      }
    }

    const tmpPath = filePath + ".tmp";
    await fsPromises.writeFile(tmpPath, JSON.stringify(data, null, 2), "utf-8");
    await fsPromises.rename(tmpPath, filePath);

    const stat = await fsPromises.stat(filePath);
    return { success: true, lastModified: stat.mtimeMs };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

import { app, BrowserWindow, shell, Menu } from "electron";
import { join } from "path";
import { electronApp, is } from "@electron-toolkit/utils";
import { autoUpdater } from "electron-updater";
// Side-effect import: registers the `printer:*` IPC handlers (§8 — hardware
// access always happens in the main process, never the renderer).
import "./printer";

const PRELOAD_PATH = join(__dirname, "../preload/index.js");
const RENDERER_DIST = join(__dirname, "../renderer");
const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || "http://localhost:3449/";

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    autoHideMenuBar: false,
    show: false,
    icon: join(app.getAppPath(), "assets", "icon.png"),
    webPreferences: {
      preload: PRELOAD_PATH,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });

  if (is.dev) {
    void mainWindow.loadURL(DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    void mainWindow.loadFile(join(RENDERER_DIST, "index.html"));
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.lira.desktop-cashier");

  // Restart Electron when tsc -w rewrites dist/main (dev only).
  if (is.dev) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require("electron-reloader")(module, {
        ignore: ["node_modules", "src/renderer", "dist/renderer"],
      });
    } catch {
      /* electron-reloader optional */
    }
  }

  const menu = Menu.buildFromTemplate([
    {
      label: "Lyra Cashier",
      submenu: [
        { role: "about" },
        {
          label: "Check for Updates",
          click: () => void autoUpdater.checkForUpdatesAndNotify(),
        },
        { type: "separator" },
        { role: "services" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [{ role: "reload" }, { role: "toggleDevTools" }],
    },
  ]);
  Menu.setApplicationMenu(menu);

  createWindow();

  // Only check updates for real builds — dev has no app-update.yml.
  if (app.isPackaged) {
    void autoUpdater.checkForUpdatesAndNotify();
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  console.log("[main] desktop-cashier ready");
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});


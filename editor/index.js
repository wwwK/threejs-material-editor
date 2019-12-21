const electron = require("electron");
const { app, BrowserWindow, Menu } = require("electron");

function createWindow() { // 创建窗口

    let mainWindow = new BrowserWindow({

        title: "Inversion",
        show: false, center: true,
        autoHideMenuBar: true,
        width: 1333, height: 786,
        webPreferences: { nodeIntegration: false }

    });

    // 加载页面
    mainWindow.loadFile("index.html");

    // 当页面准备完成后显示
    mainWindow.once("ready-to-show", function () { mainWindow.show(); });

    // 打开开发者工具
    // mainWindow.webContents.openDevTools();

    // 关闭菜单栏
    Menu.setApplicationMenu(null);

    // 当窗口被关闭
    mainWindow.on("closed", function () { mainWindow = null; app.quit(); });
}

app.on("ready", createWindow);

const os = require('os');
const path = require('path');
const { app, BrowserWindow, Menu, ipcMain, shell,dialog } = require("electron");
const log = require("electron-log");
const imagemin = require('imagemin');
const imageminMozjpeg = require("imagemin-mozjpeg");
const imageminPngquant = require('imagemin-pngquant');
const slash = require('slash');

let mainWindow;
let aboutWindow;

const createMainWindow = () => {
    mainWindow = new BrowserWindow({
        fullscreen: false,
        resizable: false,
        center: true,
        autoHideMenuBar: true,
        title: "Shrink Images",
        width: 500,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true
        }
    });

    mainWindow.loadFile("app/index.html");

};

const createAboutWindow = () => {
    aboutWindow = new BrowserWindow({
        fullscreen: false,
        resizable: false,
        center: true,
        autoHideMenuBar: true,
        title: "About Shrink Images",
        width: 300,
        height: 300
    });

    aboutWindow.loadFile("app/about.html");

};

app.on('ready', () => {
    createMainWindow();

    const mainMenu = Menu.buildFromTemplate(menu);
    Menu.setApplicationMenu(mainMenu);
});

const menu = [
    {
        role: 'fileMenu'
    },
    {
        label: 'DevTools',
        submenu: [
            { role: 'reload' },
            { role: 'forceReload' },
            { role: 'toggleDevTools' },
            { type: 'separator' },
        ]
    },
    {
        role: 'help',
        submenu: [
            {
                label: 'About',
                click: createAboutWindow
            },
            {
                label: 'Learn More',
                click: async () => {
                    const { shell } = require('electron');
                    await shell.openExternal('https://electronjs.org');
                }
            }
        ]
    }
];

ipcMain.on('image:minimize', async (e, o) => {
    const outPath = await dialog.showOpenDialog({
        properties: ['openDirectory']
    });
    if(!outPath.canceled) {
        o.dest = slash(outPath.filePaths[0])
        shrinkImage(o)
    }
});

const shrinkImage = async ({ imagePath, quality, dest }) => {
    try {
        const pngQuality = quality / 100;
        const files = await imagemin([slash(imagePath)], {
            destination: dest,
            plugins: [
                imageminMozjpeg({ quality }),
                imageminPngquant({
                    quality: [pngQuality, pngQuality]
                })
            ]
        });

        log.info(files);
        mainWindow.webContents.send("image:done");
        shell.openPath(dest);

    } catch (err) {
        console.log(err);
        log.error(err);
    }
};

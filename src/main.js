// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { exec, spawn } = require("child_process");
const { protocol } = require('electron');
const url = require('url')
const { session } = require('electron');
const fs = require('fs')

let win;

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      nodeIntegration: true,
      // contextIsolation: false,
      // webSecurity: false,
      // nodeIntegrationInWorker: true,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  win = mainWindow;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [`default-src * 'self' data: gap: https://ssl.gstatic.com 'unsafe-eval'; style-src http://* 'self' 'unsafe-inline'; media-src * blob: your-custom-protocol: atom: file:`]
      }
    })
  })
  protocol.registerFileProtocol(
    'your-custom-protocol',
    fileHandler,
  );
  protocol.registerFileProtocol('atom', (request, callback) => {
    const filePath = url.fileURLToPath('file://' + request.url.slice('atom://'.length))
    console.log(filePath);
    if (!fs.existsSync(filePath)){
      callback({
        // -6 is FILE_NOT_FOUND
        // https://source.chromium.org/chromium/chromium/src/+/master:net/base/net_error_list.h
        error: -6 
      });
      return;
    }
    callback(filePath)
  })
  protocol.registerFileProtocol('file', (request, callback) => {
    const filePath = url.fileURLToPath(request.url)
    console.log(filePath)
    callback(filePath)
  });
  createWindow();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });


});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
ipcMain.handle("my-invokable-ipc", async (event, ...args) => {
  // console.log(args);
  var c = args[0].split(" ");
  var command = c.shift();
  const process = await spawn(command, c, { shell: true });
  // console.log(process);
  let result = "";
  process.stdout.on("data", (data) => {
    console.log(data);
    result += data.toString();
    // do something with the data here
    win.webContents.send('asynchronous-message', data.toString());
  });

  // process.stdout.on('drain', () => {
  //   console.log(args)
  //   win.webContents.send('asynchronous-message', result);
  //   // final checks (e.g. - expect) go here
  // })

  process.on("exit", () => {
    console.log(args);
    // win.webContents.send("asynchronous-message", result);
    // final checks (e.g. - expect) go here
  });
});



function fileHandler(req, callback){
  console.log(req);
  let requestedPath = req.url.replace('your-custom-protocol://', '')
  // Write some code to resolve path, calculate absolute path etc
  let check = true // Write some code here to check if you should return the file to renderer process

  if (!check){
    callback({
      // -6 is FILE_NOT_FOUND
      // https://source.chromium.org/chromium/chromium/src/+/master:net/base/net_error_list.h
      error: -6 
    });
    return;
  }
  console.log(requestedPath)
  callback({
    path: requestedPath
  });
}


// const { app, BrowserWindow } = require('electron');
// const path = require('path');

// // Handle creating/removing shortcuts on Windows when installing/uninstalling.
// // eslint-disable-next-line global-require
// if (require('electron-squirrel-startup')) {
//   app.quit();
// }

// const createWindow = () => {
//   // Create the browser window.
//   const mainWindow = new BrowserWindow({
//     width: 800,
//     height: 600,
//     webPreferences: {
//       preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
//     },
//   });

//   // and load the index.html of the app.
//   mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

//   // Open the DevTools.
//   mainWindow.webContents.openDevTools();
// };

// // This method will be called when Electron has finished
// // initialization and is ready to create browser windows.
// // Some APIs can only be used after this event occurs.
// app.on('ready', createWindow);

// // Quit when all windows are closed, except on macOS. There, it's common
// // for applications and their menu bar to stay active until the user quits
// // explicitly with Cmd + Q.
// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') {
//     app.quit();
//   }
// });

// app.on('activate', () => {
//   // On OS X it's common to re-create a window in the app when the
//   // dock icon is clicked and there are no other windows open.
//   if (BrowserWindow.getAllWindows().length === 0) {
//     createWindow();
//   }
// });

// // In this file you can include the rest of your app's specific main process
// // code. You can also put them in separate files and import them here.

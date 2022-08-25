// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { exec, spawn } = require("child_process");

let win;

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: true,
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  mainWindow.webContents.openDevTools()

  win = mainWindow;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
ipcMain.handle('my-invokable-ipc', async (event, ...args) => {
  console.log(args)
  var c = args[0].split(' ');
  var command = c.shift();
  const process = await spawn(command, c, {shell: true})
  console.log(process);
  let result = '';
  process.stdout.on('data', data => {
    console.log(data);
    result += data.toString();
    // do something with the data here
    // win.webContents.send('asynchronous-message', data.toString());
  })

  // process.stdout.on('drain', () => {
  //   console.log(args)
  //   win.webContents.send('asynchronous-message', result);
  //   // final checks (e.g. - expect) go here
  // })

  process.on('exit', () => {
    console.log(args)
    win.webContents.send('asynchronous-message', result);
    // final checks (e.g. - expect) go here
  })


})
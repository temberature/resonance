// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { app, BrowserWindow, ipcRenderer } = require("electron");
const { Dexie } = require("Dexie");
fs = require("fs/promises");
const { shell } = require("electron");
const { contextBridge } = require('electron')

window.addEventListener("DOMContentLoaded", () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector);
        if (element) element.innerText = text;
    };

    for (const type of ["chrome", "node", "electron"]) {
        replaceText(`${type}-version`, process.versions[type]);
    }
});

contextBridge.exposeInMainWorld(
    'myAPI',
    {
        desktop: true,
        ipcRenderer: ipcRenderer,
        ipcRendererInvoke: function () {
            return ipcRenderer.invoke.apply(ipcRenderer, arguments)
        },
        ipcRendererOn: function () {
            return ipcRenderer.on.apply(ipcRenderer, arguments);
        },
        fsReadFile: function() {
            return fs.readFile.apply(fs, arguments);
        },
        fsWriteFile: function() {
            return fs.writeFile.apply(fs, arguments);
        }

    }
)



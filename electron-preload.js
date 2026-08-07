const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,
  selectSharedFile: () => ipcRenderer.invoke("select-shared-file"),
  readLocalJson: (filePath) => ipcRenderer.invoke("read-local-json", filePath),
  writeLocalJson: (filePath, data) => ipcRenderer.invoke("write-local-json", filePath, data),
  getSystemUserInfo: () => ipcRenderer.invoke("get-system-user-info"),
  onSelectedSharedFile: (callback) => {
    ipcRenderer.on("electron-selected-shared-file", (event, filePath) => callback(filePath));
  },
});

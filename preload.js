const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  loadData: () => ipcRenderer.invoke('load-data'),
  saveData: (data) => ipcRenderer.invoke('save-data', data),
  searchImages: (options) => ipcRenderer.invoke('search-images', options),
  callAI: (options) => ipcRenderer.invoke('call-ai', options),
  copyImageToClipboard: (url) => ipcRenderer.invoke('copy-image-to-clipboard', { url }),
  saveWordFile: (options) => ipcRenderer.invoke('save-word-file', options),
  savePDFFile: (options) => ipcRenderer.invoke('save-pdf-file', options)
});

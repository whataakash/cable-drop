// Preload script — safely exposes ADB and Electron APIs to the React renderer

import { contextBridge, ipcRenderer, webFrame } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Zoom controller using Electron webFrame
const zoom = {
  zoomIn: () => {
    const next = Math.min(Number((webFrame.getZoomFactor() + 0.1).toFixed(1)), 2.0)
    webFrame.setZoomFactor(next)
    return next
  },
  zoomOut: () => {
    const next = Math.max(Number((webFrame.getZoomFactor() - 0.1).toFixed(1)), 0.6)
    webFrame.setZoomFactor(next)
    return next
  },
  resetZoom: () => {
    webFrame.setZoomFactor(1.0)
    return 1.0
  },
  getZoomFactor: () => Number(webFrame.getZoomFactor().toFixed(1))
}

// ADB API methods bridged through Electron IPC
const adb = {
  getPath: () => ipcRenderer.invoke('adb:getPath'),
  getVersion: () => ipcRenderer.invoke('adb:version'),
  getDevices: () => ipcRenderer.invoke('adb:devices'),
  startServer: () => ipcRenderer.invoke('adb:startServer'),
  killServer: () => ipcRenderer.invoke('adb:killServer'),
  listFiles: (deviceId, path) => ipcRenderer.invoke('adb:listFiles', deviceId, path),
  listDirectory: (deviceId, path) => ipcRenderer.invoke('adb:listFiles', deviceId, path),
  getStorageVolumes: (deviceId) => ipcRenderer.invoke('adb:getStorageVolumes', deviceId),
  getDeviceStorage: (deviceId) => ipcRenderer.invoke('adb:getDeviceStorage', deviceId),
  getDeviceBattery: (deviceId) => ipcRenderer.invoke('adb:getDeviceBattery', deviceId),
  pushFile: (deviceId, local, remote) => ipcRenderer.invoke('adb:pushFile', deviceId, local, remote),
  pullFile: (deviceId, remote, local) => ipcRenderer.invoke('adb:pullFile', deviceId, remote, local),
  cancelTransfer: () => ipcRenderer.invoke('adb:cancelTransfer'),
  makeDirectory: (deviceId, path) => ipcRenderer.invoke('adb:makeDirectory', deviceId, path),
  openFiles: () => ipcRenderer.invoke('dialog:openFiles'),
  openFolders: () => ipcRenderer.invoke('dialog:openFolders'),
  openDirectory: (defaultPath) => ipcRenderer.invoke('dialog:openDirectory', defaultPath),
  openPath: (folderPath) => ipcRenderer.invoke('shell:openPath', folderPath),
  getDefaultDownloads: () => ipcRenderer.invoke('system:getDefaultDownloads'),
  onProgress: (callback) => {
    ipcRenderer.removeAllListeners('adb:progress')
    ipcRenderer.on('adb:progress', (_, data) => callback(data))
  },
  removeProgressListener: () => ipcRenderer.removeAllListeners('adb:progress')
}

// Custom APIs for renderer
const api = {
  adb,
  zoom
}

// Expose APIs to window object in React
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('adb', adb)
    contextBridge.exposeInMainWorld('zoom', zoom)
  } catch (error) {
    console.error('Error exposing preload APIs:', error)
  }
} else {
  window.electron = electronAPI
  window.api = api
  window.adb = adb
  window.zoom = zoom
}

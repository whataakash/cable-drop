// Preload script — safely exposes ADB and Electron APIs to the React renderer

import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// ADB API methods bridged through Electron IPC
const adb = {
  getPath: () => ipcRenderer.invoke('adb:getPath'),
  getVersion: () => ipcRenderer.invoke('adb:version'),
  getDevices: () => ipcRenderer.invoke('adb:devices'),
  startServer: () => ipcRenderer.invoke('adb:startServer'),
  killServer: () => ipcRenderer.invoke('adb:killServer'),
  reconnect: (deviceId) => ipcRenderer.invoke('adb:reconnect', deviceId),
  listFiles: (deviceId, path) => ipcRenderer.invoke('adb:listFiles', deviceId, path),
  listDirectory: (deviceId, path) => ipcRenderer.invoke('adb:listFiles', deviceId, path),
  getStorageVolumes: (deviceId) => ipcRenderer.invoke('adb:getStorageVolumes', deviceId),
  pushFile: (deviceId, local, remote) => ipcRenderer.invoke('adb:pushFile', deviceId, local, remote),
  pullFile: (deviceId, remote, local) => ipcRenderer.invoke('adb:pullFile', deviceId, remote, local),
  openFiles: () => ipcRenderer.invoke('dialog:openFiles'),
  openFolders: () => ipcRenderer.invoke('dialog:openFolders'),
  openDirectory: (defaultPath) => ipcRenderer.invoke('dialog:openDirectory', defaultPath),
  openPath: (folderPath) => ipcRenderer.invoke('shell:openPath', folderPath),
  getDefaultDownloads: () => ipcRenderer.invoke('system:getDefaultDownloads'),
  raw: (args) => ipcRenderer.invoke('adb:raw', args)
}

// Custom APIs for renderer
const api = {
  adb
}

// Expose APIs to window object in React
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('adb', adb)
  } catch (error) {
    console.error('Error exposing preload APIs:', error)
  }
} else {
  window.electron = electronAPI
  window.api = api
  window.adb = adb
}

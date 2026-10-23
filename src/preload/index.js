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
  listFiles: (deviceId, path) => ipcRenderer.invoke('adb:listFiles', deviceId, path),
  pushFile: (deviceId, local, remote) => ipcRenderer.invoke('adb:pushFile', deviceId, local, remote),
  pullFile: (deviceId, remote, local) => ipcRenderer.invoke('adb:pullFile', deviceId, remote, local),
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

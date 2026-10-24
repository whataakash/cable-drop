// adb.js — Client-side ADB bridge for the React UI
// Communicates with the bundled ADB binary via Electron IPC

const getBridge = () => {
  if (typeof window !== 'undefined' && window.adb) {
    return window.adb
  }
  if (typeof window !== 'undefined' && window.api && window.api.adb) {
    return window.api.adb
  }
  return null
}

export const adb = {
  // Get path to bundled adb executable
  async getPath() {
    const bridge = getBridge()
    if (!bridge) throw new Error('ADB bridge is not available')
    return await bridge.getPath()
  },

  // Get ADB version string
  async getVersion() {
    const bridge = getBridge()
    if (!bridge) throw new Error('ADB bridge is not available')
    return await bridge.getVersion()
  },

  // Get list of connected Android devices
  async getDevices() {
    const bridge = getBridge()
    if (!bridge) return []
    return await bridge.getDevices()
  },

  // Start ADB daemon server
  async startServer() {
    const bridge = getBridge()
    if (!bridge) throw new Error('ADB bridge is not available')
    return await bridge.startServer()
  },

  // Kill ADB daemon server
  async killServer() {
    const bridge = getBridge()
    if (!bridge) throw new Error('ADB bridge is not available')
    return await bridge.killServer()
  },

  // Reprompt phone for RSA authorization
  async reprompt(deviceId) {
    return await adbReprompt(deviceId)
  },

  // Reconnect a specific device or all offline devices
  async reconnect(deviceId) {
    const bridge = getBridge()
    if (!bridge) throw new Error('ADB bridge is not available')
    return await bridge.reconnect(deviceId)
  },

  // List files on device path
  async listFiles(deviceId, path = '/sdcard') {
    const bridge = getBridge()
    if (!bridge) throw new Error('ADB bridge is not available')
    return await bridge.listFiles(deviceId, path)
  },

  // Alias for listFiles
  async listDirectory(deviceId, path = '/sdcard') {
    return await this.listFiles(deviceId, path)
  },

  // Get storage volumes on device (Internal Storage and external SD cards)
  async getStorageVolumes(deviceId) {
    const bridge = getBridge()
    if (bridge && bridge.getStorageVolumes) {
      try {
        const vols = await bridge.getStorageVolumes(deviceId)
        if (vols && vols.length > 0) return vols
      } catch (err) {
        console.warn('Bridge getStorageVolumes failed:', err)
      }
    }

    // Direct fallback: list /storage via listFiles
    try {
      const files = await this.listFiles(deviceId, '/storage')
      const volumes = [
        { id: 'internal', name: 'Internal Storage', path: '/sdcard', type: 'internal', icon: '💾' }
      ]
      for (const f of files) {
        if (f.name && f.name !== 'emulated' && f.name !== 'self' && !f.name.startsWith('.')) {
          volumes.push({
            id: f.name,
            name: 'SD Card',
            path: `/storage/${f.name}`,
            type: 'sdcard',
            icon: '💳'
          })
        }
      }
      return volumes
    } catch {
      return [{ id: 'internal', name: 'Internal Storage', path: '/sdcard', type: 'internal', icon: '💾' }]
    }
  },

  // Push file from Mac to Android
  async pushFile(deviceId, localPath, remotePath) {
    const bridge = getBridge()
    if (!bridge) throw new Error('ADB bridge is not available')
    return await bridge.pushFile(deviceId, localPath, remotePath)
  },

  // Pull file from Android to Mac
  async pullFile(deviceId, remotePath, localPath) {
    const bridge = getBridge()
    if (!bridge) throw new Error('ADB bridge is not available')
    return await bridge.pullFile(deviceId, remotePath, localPath)
  },

  // Pick files or folders from Mac using native Finder dialog
  async openFiles() {
    const bridge = getBridge()
    if (!bridge || !bridge.openFiles) return []
    return await bridge.openFiles()
  },

  // Pick entire folders from Mac using native Finder dialog
  async openFolders() {
    const bridge = getBridge()
    if (!bridge || !bridge.openFolders) return []
    return await bridge.openFolders()
  },

  // Pick folder on Mac using native Finder dialog
  async openDirectory(defaultPath) {
    const bridge = getBridge()
    if (!bridge || !bridge.openDirectory) return null
    return await bridge.openDirectory(defaultPath)
  },

  // Open directory in Mac Finder
  async openPath(folderPath) {
    const bridge = getBridge()
    if (!bridge || !bridge.openPath) return
    return await bridge.openPath(folderPath)
  },

  // Get default downloads path
  async getDefaultDownloads() {
    const bridge = getBridge()
    if (!bridge || !bridge.getDefaultDownloads) return '~/Downloads'
    return await bridge.getDefaultDownloads()
  },

  // Run custom ADB command arguments
  async raw(args) {
    const bridge = getBridge()
    if (!bridge) throw new Error('ADB bridge is not available')
    return await bridge.raw(args)
  }
}

// Reconnect a specific device to trigger the RSA prompt on that device only
export async function adbReprompt(deviceId) {
  try {
    if (deviceId) {
      console.log('[ADB] Reconnecting device for RSA prompt:', deviceId)
      await adb.reconnect(deviceId)
    } else {
      console.log('[ADB] Reconnecting offline devices...')
      await adb.reconnect()
    }
    await adb.getDevices()
  } catch (err) {
    console.error('Failed to reprompt ADB:', err)
  }
}



export default adb


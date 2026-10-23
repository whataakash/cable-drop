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

  // List files on device path
  async listFiles(deviceId, path = '/sdcard') {
    const bridge = getBridge()
    if (!bridge) throw new Error('ADB bridge is not available')
    return await bridge.listFiles(deviceId, path)
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

  // Run custom ADB command arguments
  async raw(args) {
    const bridge = getBridge()
    if (!bridge) throw new Error('ADB bridge is not available')
    return await bridge.raw(args)
  }
}

export default adb

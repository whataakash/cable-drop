// adb.js — ADB manager using the bundled Android SDK tools
// Uses the adb binary shipped inside build/platform-tools/adb.
// Uses Node child_process.spawn() to execute commands.

import { app, ipcMain } from 'electron'
import { join } from 'path'
import { existsSync, chmodSync } from 'fs'
import { spawn } from 'child_process'

// Locate the bundled ADB executable
export function getAdbPath() {
  const binaryName = process.platform === 'win32' ? 'adb.exe' : 'adb'

  // 1. In dev: inside build/platform-tools
  const devPath = join(app.getAppPath(), 'build', 'platform-tools', binaryName)

  // 2. In packaged production build: inside resources/platform-tools
  const prodPath = join(process.resourcesPath, 'platform-tools', binaryName)

  let adbPath = devPath
  if (app.isPackaged && existsSync(prodPath)) {
    adbPath = prodPath
  }

  // Ensure executable permissions on macOS / Linux
  if (process.platform !== 'win32' && existsSync(adbPath)) {
    try {
      chmodSync(adbPath, 0o755)
    } catch {
      // ignore if already executable
    }
  }

  return adbPath
}

// Run an ADB command using Node's child_process.spawn()
export function runAdb(args = []) {
  return new Promise((resolve, reject) => {
    const adbPath = getAdbPath()
    const child = spawn(adbPath, args)

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
    })

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    child.on('error', (err) => {
      reject(err)
    })

    child.on('close', (code) => {
      // If code is non-zero and no stdout was produced, treat as error
      if (code !== 0 && !stdout.trim()) {
        reject(new Error(stderr.trim() || `ADB exited with code ${code}`))
      } else {
        resolve(stdout.trim())
      }
    })
  })
}

// 1. Get ADB daemon version
export async function getAdbVersion() {
  try {
    const raw = await runAdb(['version'])
    const match = raw.match(/version\s+([\d.]+)/i)
    return match ? match[1] : '1.0.41'
  } catch (err) {
    console.error('Error getting ADB version:', err)
    return '1.0.41'
  }
}

// 2. Get connected devices using `adb devices -l`
// Retrieves the phone model for authorized devices
export async function getConnectedDevices() {
  try {
    const output = await runAdb(['devices', '-l'])
    const lines = output.split('\n')
    const devices = []

    // Skip the first line: "List of devices attached"
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      // Format example:
      // "6c6e0c7 device usb:51380224X product:phoenixin model:POCO_X2 device:phoenixin transport_id:5"
      // "6c6e0c7 unauthorized usb:51380224X transport_id:3"
      const parts = line.split(/\s+/)
      const id = parts[0]
      const state = parts[1] || 'unknown' // 'device' | 'unauthorized' | 'offline'

      let model = ''
      let product = ''

      for (let j = 2; j < parts.length; j++) {
        const [key, val] = parts[j].split(':')
        if (key && val) {
          if (key === 'model') model = val.replace(/_/g, ' ')
          if (key === 'product') product = val
        }
      }

      let manufacturer = ''

      // For authorized devices ('device'), fetch the phone model & manufacturer
      if (state === 'device') {
        try {
          const propModel = await runAdb(['-s', id, 'shell', 'getprop', 'ro.product.model'])
          if (propModel) model = propModel.trim()
        } catch {
          // Keep model from `adb devices -l`
        }

        try {
          const propMan = await runAdb(['-s', id, 'shell', 'getprop', 'ro.product.manufacturer'])
          if (propMan) manufacturer = propMan.trim()
        } catch {
          // ignore
        }
      }

      // Build clean display name without dummy strings
      let displayName = model
      if (manufacturer && model && !model.toLowerCase().includes(manufacturer.toLowerCase())) {
        displayName = `${manufacturer} ${model}`
      } else if (!displayName) {
        if (state === 'unauthorized') {
          displayName = 'Unauthorized Android Device'
        } else if (state === 'offline') {
          displayName = 'Offline Android Device'
        } else {
          displayName = 'Android Device'
        }
      }

      devices.push({
        id,
        serial: id,
        state, // 'device' (authorized), 'unauthorized', or 'offline'
        name: displayName,
        model: model || displayName,
        manufacturer,
        product
      })
    }

    return devices
  } catch (err) {
    console.error('Error fetching connected devices:', err)
    return []
  }
}

// 3. Start ADB daemon
export async function startAdbServer() {
  return await runAdb(['start-server'])
}

// 4. Kill ADB daemon
export async function killAdbServer() {
  return await runAdb(['kill-server'])
}

// Helper to run ADB targeting a specific device serial using spawn
export function runAdbDevice(deviceId, shellArgs = []) {
  return new Promise((resolve, reject) => {
    // Validate device serial
    if (!deviceId || typeof deviceId !== 'string' || !/^[a-zA-Z0-9.:_-]+$/.test(deviceId)) {
      return reject(new Error('Invalid or missing device serial'))
    }

    const adbPath = getAdbPath()
    const child = spawn(adbPath, ['-s', deviceId, ...shellArgs])

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
    })

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    child.on('error', (err) => {
      reject(err)
    })

    child.on('close', (code) => {
      const combined = (stdout + '\n' + stderr).trim()

      if (combined.includes('device unauthorized') || stderr.includes('device unauthorized')) {
        return reject(new Error('Device unauthorized. Please unlock phone and confirm USB debugging prompt.'))
      }
      if (combined.includes('device offline') || stderr.includes('device offline')) {
        return reject(new Error('Device is offline.'))
      }
      if (combined.includes('device not found') || stderr.includes('device not found') || (code !== 0 && combined.includes('not found') && !stdout.trim())) {
        return reject(new Error(`Device "${deviceId}" not found or disconnected.`))
      }
      if (code !== 0 && !stdout.trim()) {
        return reject(new Error(stderr.trim() || `Command failed with code ${code}`))
      }
      resolve(stdout.trim())
    })
  })
}

// 5. List contents of an Android directory using bundled ADB
export async function listDirectory(deviceId, remotePath = '/sdcard') {
  // Validate device serial
  if (!deviceId || typeof deviceId !== 'string' || !/^[a-zA-Z0-9.:_-]+$/.test(deviceId)) {
    throw new Error('Invalid or missing device serial')
  }

  // Validate directory path
  if (!remotePath || typeof remotePath !== 'string' || !remotePath.startsWith('/')) {
    throw new Error('Invalid directory path: must start with /')
  }

  // Reject shell command injection characters
  if (/[\0;&|`$\n\r]/.test(remotePath)) {
    throw new Error('Invalid characters in directory path')
  }

  // Normalize path and remove double slashes
  let cleanPath = remotePath.replace(/\/+/g, '/')
  if (cleanPath.length > 1 && cleanPath.endsWith('/')) {
    cleanPath = cleanPath.slice(0, -1)
  }

  // Add trailing slash so ls lists directory contents (especially for symlinks like /sdcard)
  const targetWithSlash = cleanPath === '/' ? '/' : cleanPath + '/'
  const safeArg = `"${targetWithSlash.replace(/"/g, '\\"')}"`

  const output = await runAdbDevice(deviceId, ['shell', 'ls', '-la', safeArg])

  // Check for shell errors returned in output
  if (output.includes('Permission denied')) {
    throw new Error(`Permission denied: cannot access ${cleanPath}`)
  }
  if (output.includes('No such file or directory')) {
    throw new Error(`Directory not found: ${cleanPath}`)
  }
  if (output.includes('Not a directory')) {
    throw new Error(`Not a directory: ${cleanPath}`)
  }

  const lines = output.split('\n')
  const files = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('total ')) continue

    // Mode regex: matches file permissions (e.g. drwxrwxrwx or -rw-r--r--)
    const modeMatch = trimmed.match(/^([bcdlps-][rwxstST-]{9})\s+/)
    if (!modeMatch) continue

    const permissions = modeMatch[1]
    const isFolder = permissions[0] === 'd'
    const isSymlink = permissions[0] === 'l'

    const rest = trimmed.slice(modeMatch[0].length).trim()

    let size = 0
    let date = ''
    let rawName = ''

    // Match ISO date format: YYYY-MM-DD HH:MM
    const dateTimeRegex = /\s+(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2}(?::\d{2})?)\s+(.+)$/
    const m = rest.match(dateTimeRegex)

    if (m) {
      date = `${m[1]} ${m[2]}`
      rawName = m[3]
      const beforeDate = rest.slice(0, m.index).trim().split(/\s+/)
      size = parseInt(beforeDate[beforeDate.length - 1], 10) || 0
    } else {
      // Fallback for Month Day format
      const legacyRegex = /\s+([A-Za-z]{3}\s+\d{1,2})\s+([\d:]{4,5}|\d{4})\s+(.+)$/
      const lm = rest.match(legacyRegex)
      if (lm) {
        date = `${lm[1]} ${lm[2]}`
        rawName = lm[3]
        const beforeDate = rest.slice(0, lm.index).trim().split(/\s+/)
        size = parseInt(beforeDate[beforeDate.length - 1], 10) || 0
      } else {
        const parts = rest.split(/\s+/)
        if (parts.length >= 4) {
          rawName = parts.slice(3).join(' ')
        } else {
          continue
        }
      }
    }

    let name = rawName
    if (isSymlink) {
      const arrowIdx = rawName.indexOf(' -> ')
      if (arrowIdx !== -1) {
        name = rawName.slice(0, arrowIdx).trim()
      }
    }

    // Skip current (.) and parent (..) directory entries
    if (name === '.' || name === '..') continue

    const fullPath = cleanPath === '/' ? `/${name}` : `${cleanPath}/${name}`

    files.push({
      name,
      fullPath,
      isFolder,
      size: isFolder ? 0 : size,
      date,
      permissions
    })
  }

  // Sort folders first, then files alphabetically
  files.sort((a, b) => {
    if (a.isFolder && !b.isFolder) return -1
    if (!a.isFolder && b.isFolder) return 1
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  })

  return files
}

// Register IPC handlers for Electron
export function setupAdbIpc() {
  ipcMain.handle('adb:getPath', () => getAdbPath())
  ipcMain.handle('adb:version', () => getAdbVersion())
  ipcMain.handle('adb:devices', () => getConnectedDevices())
  ipcMain.handle('adb:startServer', () => startAdbServer())
  ipcMain.handle('adb:killServer', () => killAdbServer())
  ipcMain.handle('adb:listFiles', (_, deviceId, path) => listDirectory(deviceId, path))
  ipcMain.handle('adb:listDirectory', (_, deviceId, path) => listDirectory(deviceId, path))
  ipcMain.handle('adb:raw', (_, args) => runAdb(args))
}

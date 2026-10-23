// SelectDirectoryModal — interactive GUI pop-up window for selecting target Android folders

import { useState, useEffect } from 'react'
import adb from '../adb'

function SelectDirectoryModal({ device, initialPath = '/sdcard/Download', onSelect, onClose }) {
  const [currentPath, setCurrentPath] = useState(initialPath || '/sdcard/Download')
  const [folders, setFolders] = useState([])
  const [volumes, setVolumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const deviceName = device?.name || device?.model || 'Android Device'

  // Load storage volumes (Internal Storage + external SD cards)
  useEffect(() => {
    if (device?.id) {
      adb.getStorageVolumes(device.id)
        .then((vols) => {
          if (vols && vols.length > 0) setVolumes(vols)
        })
        .catch(() => {})
    }
  }, [device?.id])

  // Load subdirectories for the given path
  async function loadFolders(path) {
    if (!device?.id) return
    setLoading(true)
    setError(null)

    try {
      const items = await adb.listFiles(device.id, path)
      // Filter only directories, excluding hidden . folders
      const subDirs = (items || [])
        .filter((item) => item.isFolder && !item.name.startsWith('.'))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))

      setFolders(subDirs)
      setCurrentPath(path)
    } catch (err) {
      console.warn('Could not read directory:', err)
      setError(err.message || 'Cannot access this folder')
      setFolders([])
    } finally {
      setLoading(false)
    }
  }

  // Load initial path on mount
  useEffect(() => {
    loadFolders(currentPath)
  }, [])

  // Navigate up one folder level
  function handleGoUp() {
    if (currentPath === '/sdcard' || currentPath === '/' || currentPath === '') return
    const parts = currentPath.split('/').filter(Boolean)
    parts.pop()
    const parentPath = '/' + parts.join('/')
    loadFolders(parentPath || '/sdcard')
  }

  // Friendly display for current path (e.g. Internal Storage/Download)
  function formatDisplayPath(path) {
    if (path.startsWith('/sdcard')) {
      return 'Internal Storage' + path.slice(7)
    }
    // Check if path starts with an external SD card
    for (const vol of volumes) {
      if (vol.type === 'sdcard' && path.startsWith(vol.path)) {
        return `${vol.name}${path.slice(vol.path.length)}`
      }
    }
    return path
  }

  // Common quick shortcuts
  const shortcuts = [
    { name: '📥 Download', path: '/sdcard/Download' },
    { name: '📷 DCIM', path: '/sdcard/DCIM' },
    { name: '📁 Documents', path: '/sdcard/Documents' },
    { name: '🖼 Pictures', path: '/sdcard/Pictures' },
    { name: '🎵 Music', path: '/sdcard/Music' },
    { name: '🎬 Movies', path: '/sdcard/Movies' }
  ]

  // Add SD Card shortcut if detected
  const sdCardVolume = volumes.find((v) => v.type === 'sdcard')

  return (
    <div className="directory-picker-overlay" onClick={onClose}>
      <div className="directory-picker-modal" onClick={(e) => e.stopPropagation()}>
        {/* header */}
        <div className="directory-picker-header">
          <div>
            <h4>📁 Choose Destination on Android</h4>
            <p className="text-muted text-sm" style={{ marginTop: '2px' }}>
              Target device: <strong>{deviceName}</strong>
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="directory-picker-body">
          {/* quick volume & folder shortcuts */}
          <div className="directory-picker-shortcuts">
            <button
              className={`directory-shortcut-btn ${currentPath === '/sdcard' ? 'active' : ''}`}
              onClick={() => loadFolders('/sdcard')}
            >
              💾 Internal Storage
            </button>
            {sdCardVolume && (
              <button
                className={`directory-shortcut-btn ${currentPath.startsWith(sdCardVolume.path) ? 'active' : ''}`}
                onClick={() => loadFolders(sdCardVolume.path)}
              >
                💳 SD Card
              </button>
            )}
            {shortcuts.map((sc) => (
              <button
                key={sc.path}
                className={`directory-shortcut-btn ${currentPath === sc.path ? 'active' : ''}`}
                onClick={() => loadFolders(sc.path)}
              >
                {sc.name}
              </button>
            ))}
          </div>

          {/* breadcrumb path bar */}
          <div className="directory-picker-breadcrumbs">
            <button
              className="btn btn-secondary"
              style={{ height: '22px', padding: '0 6px', fontSize: '11px' }}
              onClick={handleGoUp}
              disabled={currentPath === '/sdcard' || currentPath === '/'}
              title="Go to parent directory"
            >
              ↑ Up
            </button>
            <span>📍 {formatDisplayPath(currentPath)}</span>
          </div>

          {/* folder listing */}
          <div className="directory-folder-list">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                <span className="status-dot active" /> Loading directories...
              </div>
            ) : error ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--red)', fontSize: '13px' }}>
                ⚠ {error}
                <div style={{ marginTop: '8px' }}>
                  <button className="btn btn-secondary" style={{ fontSize: '11px' }} onClick={() => loadFolders('/sdcard')}>
                    Go to /sdcard
                  </button>
                </div>
              </div>
            ) : folders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)', fontSize: '12px' }}>
                <div>📁 No subfolders here</div>
                <div style={{ marginTop: '4px', opacity: 0.8 }}>
                  Files will be transferred into <strong>{formatDisplayPath(currentPath)}</strong>
                </div>
              </div>
            ) : (
              <ul>
                {folders.map((f) => (
                  <li
                    key={f.fullPath}
                    className="directory-folder-item"
                    onClick={() => loadFolders(f.fullPath)}
                    title={`Open ${f.name}`}
                  >
                    <span>📁</span>
                    <span style={{ fontWeight: 500 }}>{f.name}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>
                      ›
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* footer */}
        <div className="directory-picker-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              onSelect(currentPath)
              onClose()
            }}
          >
            ✓ Select This Folder
          </button>
        </div>
      </div>
    </div>
  )
}

export default SelectDirectoryModal

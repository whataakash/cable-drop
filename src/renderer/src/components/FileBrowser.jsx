// FileBrowser — table view of files and folders on the selected Android device
// Supports folder navigation, breadcrumbs, multi-device switching, and refreshing

import { useState, useEffect } from 'react'
import adb from '../adb'

// Map file extensions to clean display kinds and icons
function getFileInfo(name, isFolder) {
  if (isFolder) {
    return { type: 'Folder', icon: '📁' }
  }

  const dotIdx = name.lastIndexOf('.')
  const ext = dotIdx !== -1 ? name.slice(dotIdx + 1).toLowerCase() : ''

  switch (ext) {
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
    case 'heic':
    case 'heif':
      return { type: 'Image', icon: '🖼' }
    case 'mp4':
    case 'mov':
    case 'mkv':
    case 'avi':
    case 'webm':
      return { type: 'Video', icon: '🎬' }
    case 'mp3':
    case 'm4a':
    case 'flac':
    case 'wav':
    case 'ogg':
      return { type: 'Audio', icon: '🎵' }
    case 'pdf':
      return { type: 'PDF Document', icon: '📄' }
    case 'txt':
    case 'md':
    case 'json':
    case 'xml':
      return { type: 'Text Document', icon: '📝' }
    case 'doc':
    case 'docx':
    case 'xls':
    case 'xlsx':
    case 'ppt':
    case 'pptx':
      return { type: 'Office Document', icon: '📄' }
    case 'apk':
      return { type: 'Android App', icon: '📦' }
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
      return { type: 'Archive', icon: '🗜' }
    default:
      return { type: ext ? `${ext.toUpperCase()} File` : 'File', icon: '📄' }
  }
}

// Format raw byte sizes into human readable strings (KB, MB, GB)
function formatSize(bytes) {
  if (!bytes || bytes === 0) return '—'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let s = bytes
  let idx = 0
  while (s >= 1024 && idx < units.length - 1) {
    s /= 1024
    idx++
  }
  return `${s.toFixed(idx === 0 ? 0 : 1)} ${units[idx]}`
}

function FileBrowser({
  device,
  devices = [],
  onSelectDevice,
  initialPath = '/sdcard',
  onSendFiles,
  onReceiveFiles
}) {
  const [currentPath, setCurrentPath] = useState(initialPath || '/sdcard')
  // Navigation history tracking matching Windows File Explorer (back / forward list)
  const [navHistory, setNavHistory] = useState({
    entries: [initialPath || '/sdcard'],
    index: 0
  })
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState([])

  // Load directory contents for the active phone
  async function loadDirectory(path, addToHistory = true) {
    if (!device || !device.id) {
      setError('No device selected')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    setSelected([])

    try {
      const result = await adb.listFiles(device.id, path)
      setFiles(result || [])
      setCurrentPath(path)

      if (addToHistory) {
        setNavHistory((prev) => {
          // If already on this path at current index, don't duplicate
          if (prev.entries[prev.index] === path) {
            return prev
          }
          // Truncate any forward history past current index and append new path
          const nextEntries = [...prev.entries.slice(0, prev.index + 1), path]
          return {
            entries: nextEntries,
            index: nextEntries.length - 1
          }
        })
      }
    } catch (err) {
      console.error('Failed to list directory:', err)
      setError(err.message || 'Unable to access directory')
      setFiles([])
    } finally {
      setLoading(false)
    }
  }

  // Reload whenever the selected device changes
  useEffect(() => {
    if (device && device.id) {
      setNavHistory({
        entries: ['/sdcard'],
        index: 0
      })
      loadDirectory('/sdcard', false)
    }
  }, [device?.id])

  // Navigate into a folder
  function handleOpenFolder(folder) {
    if (folder.isFolder) {
      loadDirectory(folder.fullPath, true)
    }
  }

  // Back and Forward conditions matching Windows File Explorer
  const canGoBack = navHistory.index > 0
  const canGoForward = navHistory.index < navHistory.entries.length - 1
  const canGoUp = currentPath !== '/' && currentPath !== '/sdcard'

  // Navigate Back in history (like Windows File Explorer Back button)
  function handleGoBack() {
    if (!canGoBack) return
    const targetIndex = navHistory.index - 1
    const targetPath = navHistory.entries[targetIndex]
    setNavHistory((prev) => ({ ...prev, index: targetIndex }))
    loadDirectory(targetPath, false)
  }

  // Navigate Forward in history (like Windows File Explorer Forward button)
  function handleGoForward() {
    if (!canGoForward) return
    const targetIndex = navHistory.index + 1
    const targetPath = navHistory.entries[targetIndex]
    setNavHistory((prev) => ({ ...prev, index: targetIndex }))
    loadDirectory(targetPath, false)
  }

  // Navigate Up to parent directory
  function handleGoUp() {
    if (!canGoUp) return
    const parts = currentPath.split('/').filter(Boolean)
    parts.pop()
    const parentPath = '/' + parts.join('/')
    // In Windows File Explorer, pressing Up navigates to parent and adds to history
    loadDirectory(parentPath || '/sdcard', true)
  }

  // Windows File Explorer keyboard shortcuts (Alt+Left for Back, Alt+Right for Forward, Alt+Up for Up)
  useEffect(() => {
    function handleKeyDown(e) {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return

      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault()
        handleGoBack()
      } else if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault()
        handleGoForward()
      } else if (e.altKey && e.key === 'ArrowUp') {
        e.preventDefault()
        handleGoUp()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canGoBack, canGoForward, canGoUp, navHistory, currentPath])

  // Toggle selection of a file
  function toggleSelect(fullPath) {
    setSelected((prev) =>
      prev.includes(fullPath) ? prev.filter((p) => p !== fullPath) : [...prev, fullPath]
    )
  }

  // Toggle selecting all files in current view
  function toggleSelectAll() {
    if (selected.length === files.length) {
      setSelected([])
    } else {
      setSelected(files.map((f) => f.fullPath))
    }
  }

  // Helper to abstract Android system paths (e.g. sdcard -> Internal Storage)
  function formatSegmentName(segment) {
    if (segment === 'sdcard' || segment === 'emulated') {
      return 'Internal Storage'
    }
    return segment
  }

  // Build breadcrumb segments from currentPath
  function renderBreadcrumbs() {
    const parts = currentPath.split('/').filter(Boolean)
    const segments = []
    let accumulated = ''

    for (let i = 0; i < parts.length; i++) {
      accumulated += '/' + parts[i]
      const pathForSegment = accumulated
      const isLast = i === parts.length - 1
      const displayName = formatSegmentName(parts[i])

      segments.push(
        <span key={pathForSegment} style={{ display: 'inline-flex', alignItems: 'center' }}>
          {i > 0 && <span className="breadcrumb-sep">/</span>}
          <span
            className={`breadcrumb-segment ${isLast ? 'current' : ''}`}
            onClick={() => !isLast && loadDirectory(pathForSegment, true)}
          >
            {displayName}
          </span>
        </span>
      )
    }

    return (
      <div className="breadcrumb">
        <span
          className="breadcrumb-segment"
          onClick={canGoUp ? handleGoUp : undefined}
          style={{ opacity: canGoUp ? 1 : 0.4, cursor: canGoUp ? 'pointer' : 'default' }}
          title="Go to parent directory"
        >
          ↑ ..
        </span>
        <span className="breadcrumb-sep">/</span>
        {segments}
      </div>
    )
  }

  return (
    <div className="filebrowser">
      {/* top toolbar with Windows File Explorer style navigation */}
      <div className="filebrowser-toolbar">
        <button
          className="btn btn-secondary"
          onClick={handleGoBack}
          disabled={!canGoBack}
          title="Back (Alt+Left Arrow)"
        >
          ← Back
        </button>
        <button
          className="btn btn-secondary"
          onClick={handleGoForward}
          disabled={!canGoForward}
          title="Forward (Alt+Right Arrow)"
        >
          → Forward
        </button>
        <button
          className="btn btn-secondary"
          onClick={handleGoUp}
          disabled={!canGoUp}
          title="Up to parent folder (Alt+Up Arrow)"
        >
          ↑ Up
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => loadDirectory('/sdcard', true)}
          disabled={currentPath === '/sdcard'}
          title="Home (Internal Storage)"
        >
          ⌂ Home
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => loadDirectory(currentPath, false)}
          title="Refresh current folder"
        >
          ↻ Refresh
        </button>

        {/* Right-aligned action buttons */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="btn btn-primary" onClick={onSendFiles}>
            📤 Send to Phone
          </button>
          <button
            className="btn btn-secondary"
            onClick={onReceiveFiles}
            disabled={selected.length === 0}
          >
            📥 Save to Mac
          </button>

          {/* Device Switcher (shown when multiple devices are connected) */}
          {devices.length > 1 && (
            <select
              className="device-select-dropdown"
              value={device?.id}
              onChange={(e) => {
                const target = devices.find((d) => d.id === e.target.value)
                if (target && onSelectDevice) onSelectDevice(target)
              }}
            >
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  📱 {d.name} ({d.serial})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* breadcrumb path */}
      {renderBreadcrumbs()}

      {/* selection bar — appears when files are checked */}
      {selected.length > 0 && (
        <div className="selection-bar">
          <div className="selection-bar-left">
            ✅ {selected.length} {selected.length === 1 ? 'item' : 'items'} selected
          </div>
          <div className="selection-bar-actions">
            <button className="btn btn-primary" onClick={onReceiveFiles}>
              📥 Save to Mac
            </button>
            <button className="btn btn-secondary" onClick={() => setSelected([])}>
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Content states */}
      {loading ? (
        <div className="filebrowser-message">
          <span className="status-dot active" />
          <p className="filebrowser-message-text">Reading directory contents...</p>
        </div>
      ) : error ? (
        <div className="filebrowser-error">
          <span style={{ fontSize: '28px' }}>⚠</span>
          <p>{error}</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={() => loadDirectory(currentPath, false)}>
              ↻ Retry
            </button>
            <button className="btn btn-primary" onClick={() => loadDirectory('/sdcard', true)}>
              Go to Internal Storage
            </button>
          </div>
        </div>
      ) : files.length === 0 ? (
        <div className="filebrowser-message">
          <span className="filebrowser-message-icon">📂</span>
          <p className="filebrowser-message-text">This folder is empty</p>
        </div>
      ) : (
        <table className="file-table">
          <thead>
            <tr>
              <th style={{ width: 34 }}>
                <span
                  className={`checkbox ${selected.length === files.length && files.length > 0 ? 'checked' : ''}`}
                  onClick={toggleSelectAll}
                  style={{ cursor: 'pointer' }}
                >
                  {selected.length === files.length && files.length > 0 ? '✓' : ''}
                </span>
              </th>
              <th>Name</th>
              <th>Date Modified</th>
              <th>Kind</th>
              <th>Size</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => {
              const isSelected = selected.includes(file.fullPath)
              const info = getFileInfo(file.name, file.isFolder)

              return (
                <tr
                  key={file.fullPath}
                  className={isSelected ? 'selected' : ''}
                  onClick={() => {
                    if (file.isFolder) {
                      handleOpenFolder(file)
                    } else {
                      toggleSelect(file.fullPath)
                    }
                  }}
                >
                  <td onClick={(e) => e.stopPropagation()}>
                    <span
                      className={`checkbox ${isSelected ? 'checked' : ''}`}
                      onClick={() => toggleSelect(file.fullPath)}
                    >
                      {isSelected ? '✓' : ''}
                    </span>
                  </td>
                  <td>
                    <div className="file-name-cell">
                      <span className="file-icon">{info.icon}</span>
                      <span
                        style={{
                          fontWeight: file.isFolder ? 600 : 400,
                          color: file.isFolder ? 'var(--text-primary)' : 'var(--text-secondary)'
                        }}
                      >
                        {file.name === 'sdcard' ? 'Internal Storage' : file.name}
                      </span>
                    </div>
                  </td>
                  <td className="file-date">{file.date || '—'}</td>
                  <td className="text-muted">{info.type}</td>
                  <td className="file-size">{formatSize(file.size)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default FileBrowser

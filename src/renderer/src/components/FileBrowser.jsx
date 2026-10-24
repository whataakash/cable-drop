// FileBrowser — table view of files and folders on the selected Android device
// Supports folder navigation, breadcrumbs, multi-device switching, and refreshing

import { useState, useEffect } from 'react'
import adb from '../adb'
import { folderIcon, fileIcon, imageIcon, videoIcon, receiveIcon, receiveLightIcon } from '../assets/icons'

// Map file extensions to clean display kinds and icons
function getFileInfo(name, isFolder) {
  if (isFolder) return { type: 'Folder', icon: folderIcon }
  const ext = (name || '').split('.').pop().toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif'].includes(ext)) return { type: 'Image', icon: imageIcon }
  if (['mp4', 'mov', 'mkv', 'avi', 'webm'].includes(ext)) return { type: 'Video', icon: videoIcon }
  if (['mp3', 'm4a', 'flac', 'wav', 'ogg'].includes(ext)) return { type: 'Audio', icon: fileIcon }
  if (ext === 'pdf') return { type: 'PDF Document', icon: fileIcon }
  if (['txt', 'md', 'json', 'xml'].includes(ext)) return { type: 'Text Document', icon: fileIcon }
  if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) return { type: 'Office Document', icon: fileIcon }
  if (ext === 'apk') return { type: 'Android App', icon: fileIcon }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return { type: 'Archive', icon: fileIcon }
  return { type: ext ? `${ext.toUpperCase()} File` : 'File', icon: fileIcon }
}

// Format raw byte sizes into human readable strings (KB, MB, GB)
function formatSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
}

function FileBrowser({
  device,
  devices = [],
  onSelectDevice,
  initialPath = '/sdcard',
  onPathChange,
  onSelectionChange,
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
      onPathChange?.(path)

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
      const startPath = initialPath || '/sdcard'
      setNavHistory({
        entries: [startPath],
        index: 0
      })
      loadDirectory(startPath, false)
    }
  }, [device?.id])

  // Navigate when initialPath changes from outside (e.g. clicking SD Card on the sidebar)
  useEffect(() => {
    if (initialPath && initialPath !== currentPath) {
      loadDirectory(initialPath, true)
    }
  }, [initialPath])

  // Navigate into a folder
  function handleOpenFolder(folder) {
    if (folder.isFolder) {
      loadDirectory(folder.fullPath, true)
    }
  }

  // Determine if current path belongs to an external SD Card or Internal Storage
  const isExternalSd = currentPath.startsWith('/storage/') && !currentPath.startsWith('/storage/emulated')
  let volumeRoot = '/sdcard'
  let volumeName = 'Internal Storage'
  if (isExternalSd) {
    const parts = currentPath.split('/').filter(Boolean)
    if (parts.length >= 2) {
      volumeRoot = `/storage/${parts[1]}`
      volumeName = 'SD Card'
    }
  }

  // Back and Forward conditions matching Windows File Explorer
  const canGoBack = navHistory.index > 0
  const canGoForward = navHistory.index < navHistory.entries.length - 1
  const canGoUp = currentPath !== volumeRoot && currentPath !== '/'

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
    loadDirectory(parentPath || volumeRoot, true)
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

  // Report selection changes to parent component
  useEffect(() => {
    const selectedItems = files.filter((f) => selected.includes(f.fullPath))
    onSelectionChange?.(selectedItems)
  }, [selected, files])

  // Build breadcrumb segments with clean volume root (Internal Storage / SD Card)
  function renderBreadcrumbs() {
    const relPath = currentPath.startsWith(volumeRoot)
      ? currentPath.slice(volumeRoot.length)
      : currentPath
    const subParts = relPath.split('/').filter(Boolean)
    let accumulated = volumeRoot

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

        {/* Root volume segment */}
        <span
          className={`breadcrumb-segment ${subParts.length === 0 ? 'current' : ''}`}
          onClick={() => subParts.length > 0 && loadDirectory(volumeRoot, true)}
        >
          {volumeName}
        </span>

        {/* Sub-directories */}
        {subParts.map((part, idx) => {
          accumulated += '/' + part
          const targetPath = accumulated
          const isLast = idx === subParts.length - 1

          return (
            <span key={targetPath} style={{ display: 'inline-flex', alignItems: 'center' }}>
              <span className="breadcrumb-sep">/</span>
              <span
                className={`breadcrumb-segment ${isLast ? 'current' : ''}`}
                onClick={() => !isLast && loadDirectory(targetPath, true)}
              >
                {part}
              </span>
            </span>
          )
        })}
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
          onClick={() => loadDirectory(volumeRoot, true)}
          disabled={currentPath === volumeRoot}
          title={`Home (${volumeName})`}
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

        {/* Right-aligned device switcher */}
        {devices.length > 1 && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
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
          </div>
        )}
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
            <button
              className="btn btn-primary"
              onClick={() => {
                const selectedItems = files.filter((f) => selected.includes(f.fullPath))
                if (onReceiveFiles) onReceiveFiles(selectedItems)
              }}
            >
              <img src={receiveLightIcon} alt="" className="btn-icon" />
              Save to Mac
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
          <img src={folderIcon} alt="" style={{ width: 36, height: 36, opacity: 0.7, marginBottom: 8 }} />
          <p className="filebrowser-message-text">This folder is empty</p>
        </div>
      ) : (
        <div className="file-table-container">
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
                        <img src={info.icon} alt="" className="file-row-icon" style={{ marginRight: 8 }} />
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
        </div>
      )}
    </div>
  )
}

export default FileBrowser

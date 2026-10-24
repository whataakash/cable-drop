// ReceiveFilesModal — receives files from Android and drops them into Mac
// Exact reverse of SendFilesModal using the same UI language and structure

import { useState, useEffect } from 'react'
import adb from '../adb'
import { macIcon, mobileIcon, folderIcon, fileIcon, imageIcon, videoIcon, receiveLightIcon, arrowIcon } from '../assets/icons'
import FileBrowser from './FileBrowser'

function formatSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
}

function getFileIcon(filename, isFolder) {
  if (isFolder) return folderIcon
  const ext = (filename || '').split('.').pop().toLowerCase()
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'heic'].includes(ext)) return imageIcon
  if (['mp4', 'mov', 'mkv', 'avi'].includes(ext)) return videoIcon
  return fileIcon
}

function ReceiveFilesModal({ device, files = [], onClose, onLogTransfer }) {
  const [stagedFiles, setStagedFiles] = useState(files || [])
  const [saveLocation, setSaveLocation] = useState('')
  const [defaultSaveDir, setDefaultSaveDir] = useState('')
  const [hasCustomFolder, setHasCustomFolder] = useState(false)
  const [showBrowserModal, setShowBrowserModal] = useState(false)

  // Transfer execution states
  const [transferring, setTransferring] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentFileName, setCurrentFileName] = useState('')
  const [progressPercent, setProgressPercent] = useState(0)
  const [fileStatuses, setFileStatuses] = useState({})
  const [statsText, setStatsText] = useState('')
  const [completed, setCompleted] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  const deviceName = device?.name || device?.model || 'Android Device'

  // Update staged files if parent passes new files
  useEffect(() => {
    if (files && files.length > 0) {
      setStagedFiles(files)
    }
  }, [files])

  // Load default Downloads folder on Mac
  useEffect(() => {
    adb.getDefaultDownloads()
      .then((downloads) => {
        const folder = downloads ? `${downloads}/CableDrop` : '~/Downloads/CableDrop'
        setSaveLocation(folder)
        setDefaultSaveDir(folder)
      })
      .catch(() => {
        setSaveLocation('~/Downloads/CableDrop')
        setDefaultSaveDir('~/Downloads/CableDrop')
      })
  }, [])

  // Choose a destination folder on Mac using native Finder sheet
  async function handleChooseFolder() {
    if (transferring) return
    try {
      const chosen = await adb.openDirectory(saveLocation)
      if (chosen) {
        setSaveLocation(chosen)
        setHasCustomFolder(true)
      }
    } catch (err) {
      console.warn('Failed to choose Mac folder:', err)
    }
  }

  // Reset Mac destination folder back to default ~/Downloads/CableDrop
  function handleResetFolder() {
    if (transferring) return
    setSaveLocation(defaultSaveDir || '~/Downloads/CableDrop')
    setHasCustomFolder(false)
  }

  // Open the saved destination in macOS Finder
  function handleRevealInFinder() {
    if (saveLocation) {
      adb.openPath(saveLocation)
    }
  }

  // Remove individual file from stage
  function handleRemoveFile(path) {
    if (transferring) return
    setStagedFiles((prev) => prev.filter((f) => (f.fullPath || f.path) !== path))
  }

  // Clear all staged files
  function handleClearAll() {
    if (transferring) return
    setStagedFiles([])
    setFileStatuses({})
    setCompleted(false)
    setErrorMsg(null)
  }

  // Clean up progress listener on unmount
  useEffect(() => {
    return () => {
      adb.removeProgressListener()
    }
  }, [])

  // Execute adb pull sequentially for all staged files
  async function handleStartPull() {
    if (!device?.id || stagedFiles.length === 0 || transferring) return

    setTransferring(true)
    setErrorMsg(null)
    setCompleted(false)
    setProgressPercent(0)

    const total = stagedFiles.length
    const statuses = {}
    stagedFiles.forEach((f) => {
      statuses[f.fullPath || f.path] = 'waiting'
    })
    setFileStatuses(statuses)

    let currentFileIdx = 0

    // Listen for real-time progress from adb pull -p
    adb.onProgress((data) => {
      const val = typeof data === 'object' && data !== null ? data.percent : data
      const text = typeof data === 'object' && data !== null ? data.text : ''
      if (total === 1) {
        setProgressPercent(val)
      } else {
        const overall = Math.round(((currentFileIdx + val / 100) / total) * 100)
        setProgressPercent(overall)
      }
      if (text) {
        setStatsText(text)
      }
    })

    try {
      for (let i = 0; i < total; i++) {
        currentFileIdx = i
        const file = stagedFiles[i]
        const filePath = file.fullPath || file.path
        setCurrentIndex(i)
        setCurrentFileName(file.name)
        setFileStatuses((prev) => ({ ...prev, [filePath]: 'inFlight' }))
        const itemType = file.isFolder || file.isDirectory ? 'folder' : 'file'
        setStatsText(`Receiving ${itemType} ${i + 1} of ${total}: ${file.name}`)
        setProgressPercent(Math.round((i / total) * 100))

        const output = await adb.pullFile(device.id, filePath, saveLocation)
        setFileStatuses((prev) => ({ ...prev, [filePath]: 'done' }))
        if (output) {
          setStatsText(output)
        }
        if (onLogTransfer) {
          onLogTransfer({
            type: 'receive',
            deviceName: device?.name || device?.model || 'Android Device',
            deviceId: device?.id,
            fileName: file.name,
            fileSize: file.size,
            sourcePath: filePath,
            targetPath: saveLocation,
            status: 'completed',
            statsText: output || `${file.name} saved`
          })
        }
      }

      setProgressPercent(100)
      setCompleted(true)
      setStatsText(`All ${total} items received successfully!`)
    } catch (err) {
      console.error('Pull error:', err)
      setErrorMsg(err.message || 'File pull failed')
      const currentItem = stagedFiles[currentFileIdx]
      if (currentItem) {
        setFileStatuses((prev) => ({ ...prev, [currentItem.fullPath || currentItem.path]: 'error' }))
        if (onLogTransfer) {
          onLogTransfer({
            type: 'receive',
            deviceName: device?.name || device?.model || 'Android Device',
            deviceId: device?.id,
            fileName: currentItem.name,
            fileSize: currentItem.size,
            sourcePath: currentItem.fullPath || currentItem.path,
            targetPath: saveLocation,
            status: 'failed',
            error: err.message || 'Pull failed'
          })
        }
      }
    } finally {
      adb.removeProgressListener()
      setTransferring(false)
    }
  }

  // Storage type indicator (Internal Storage vs SD Card)
  const firstPath = stagedFiles[0]?.fullPath || stagedFiles[0]?.path || ''
  const isSdCard = firstPath.startsWith('/storage/') && !firstPath.startsWith('/storage/emulated')
  const storageType = isSdCard ? 'SD Card' : 'Internal Storage'

  // Friendly folder name for Mac destination
  const macFolderParts = saveLocation.split('/').filter(Boolean)
  const macFolderName = macFolderParts.length > 0 ? macFolderParts[macFolderParts.length - 1] : 'CableDrop'

  // Calculate total payload size
  const totalBytes = stagedFiles.reduce((acc, f) => acc + (f.size || 0), 0)

  return (
    <div className="modal-overlay" onClick={transferring ? undefined : onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* header */}
        <div className="modal-header">
          <div>
            <h3>Receive files from Mobile</h3>
            <p>using your Type C Cable</p>
          </div>
          <button className="modal-close" onClick={onClose} disabled={transferring}>✕</button>
        </div>

        <div className="modal-body">
          {/* transfer direction: Mobile -> MacBook */}
          <div
            className="transfer-direction"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              alignItems: 'center',
              width: '100%'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <img src={mobileIcon} alt="" className="inline-icon" />
                <span>{deviceName}</span>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                ({storageType})
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <img src={arrowIcon} alt="->" className="transfer-arrow-icon" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <img src={macIcon} alt="" className="inline-icon" />
                <span>Your MacBook</span>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>(Macintosh HD)</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <span className="badge ok">
                {completed ? 'COMPLETED' : transferring ? 'RECEIVING' : 'READY'}
              </span>
            </div>
          </div>

          {/* drop zones: left (Mobile payload) & right (Mac destination folder) */}
          <div style={{ display: 'flex', gap: 'var(--space-md)', width: '100%' }}>
            {/* Box 1: Files chosen from Mobile */}
            <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <div
                className={`drop-zone ${stagedFiles.length > 0 ? 'selected' : ''}`}
                style={{ cursor: transferring ? 'not-allowed' : 'pointer' }}
                onClick={transferring ? undefined : () => setShowBrowserModal(true)}
              >
                {stagedFiles.length === 0 ? (
                  <>
                    <img src={mobileIcon} alt="" className="drop-zone-svg" />
                    <div className="drop-zone-label">No files selected from Mobile</div>
                    <div className="drop-zone-sub text-muted">Click to browse & select files</div>
                  </>
                ) : (
                  <>
                    <div className="drop-zone-icon">✓</div>
                    <div className="drop-zone-label" style={{ color: 'var(--status-ok)' }}>
                      ✓ {stagedFiles.length} {stagedFiles.length === 1 ? 'item' : 'items'} chosen
                    </div>
                    <div className="drop-zone-sub text-muted">
                      Total payload: {formatSize(totalBytes)} · Click to change
                    </div>
                  </>
                )}
              </div>
              <div style={{ height: '24px', display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                {stagedFiles.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ height: '22px', fontSize: '11px', padding: '0 8px' }}
                    onClick={handleClearAll}
                    disabled={transferring}
                  >
                    Clear files
                  </button>
                )}
              </div>
            </div>

            {/* Box 2: Destination directory on Mac */}
            <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <div
                className={`drop-zone ${saveLocation ? 'selected' : ''}`}
                style={{ cursor: transferring ? 'not-allowed' : 'pointer' }}
                onClick={transferring ? undefined : handleChooseFolder}
              >
                {saveLocation ? (
                  <>
                    <img src={folderIcon} alt="" className="drop-zone-svg" />
                    <div className="drop-zone-label" style={{ color: 'var(--status-ok)' }}>
                      ✓ Save folder: {macFolderName}
                    </div>
                    <div className="drop-zone-sub text-muted" title={saveLocation}>
                      {saveLocation} · Click to change
                    </div>
                  </>
                ) : (
                  <>
                    <img src={macIcon} alt="" className="drop-zone-svg" />
                    <div className="drop-zone-label">Choose folder on Mac...</div>
                    <div className="drop-zone-sub text-muted">Select destination directory</div>
                  </>
                )}
              </div>
              <div style={{ height: '24px', display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                {hasCustomFolder && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ height: '22px', fontSize: '11px', padding: '0 8px' }}
                    onClick={handleResetFolder}
                    disabled={transferring}
                  >
                    Reset folder
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* staged file list */}
          <div>
            <div className="staged-header">
              <span>STAGED PAYLOAD ({stagedFiles.length} {stagedFiles.length === 1 ? 'ITEM' : 'ITEMS'})</span>
              {stagedFiles.length > 0 && (
                <button
                  className="btn btn-secondary"
                  style={{ height: 22, fontSize: 11 }}
                  onClick={handleClearAll}
                  disabled={transferring}
                >
                  Clear all
                </button>
              )}
            </div>

            {stagedFiles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                No files staged. Close this modal and select files in the browser first.
              </div>
            ) : (
              <ul className="staged-list" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                {stagedFiles.map((file) => {
                  const key = file.fullPath || file.path
                  const status = fileStatuses[key] || 'waiting'
                  const isFolder = file.isFolder || file.isDirectory

                  return (
                    <li key={key} className="staged-item">
                      <div className="staged-item-left">
                        <img src={getFileIcon(file.name, isFolder)} alt="" className="file-row-icon" />
                        <span title={key}>{file.name}</span>
                        {isFolder && (
                          <span className="badge" style={{ fontSize: '10px', padding: '1px 5px', opacity: 0.85 }}>FOLDER</span>
                        )}
                        {status === 'inFlight' && (
                          <span className="badge" style={{ color: 'var(--violet)' }}>IN FLIGHT</span>
                        )}
                        {status === 'done' && (
                          <span className="badge ok">SAVED ✓</span>
                        )}
                        {status === 'error' && (
                          <span className="badge error">FAILED ✕</span>
                        )}
                      </div>
                      <div className="staged-item-right">
                        <span className="staged-item-size">
                          {isFolder ? 'Folder' : formatSize(file.size)}
                        </span>
                        {!transferring && (
                          <button
                            className="staged-item-remove"
                            onClick={() => handleRemoveFile(key)}
                            title="Remove item"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* target directory on Mac */}
          <div className="target-dir">
            <div className="target-dir-label">SAVE LOCATION ON MAC</div>
            <div className="target-dir-row">
              <img src={folderIcon} alt="" className="inline-icon" />
              <span
                className="target-dir-path"
                title={saveLocation}
                style={{ cursor: transferring ? 'not-allowed' : 'pointer' }}
                onClick={transferring ? undefined : handleChooseFolder}
              >
                {saveLocation || '~/Downloads/CableDrop'}
              </span>
              {!transferring && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleChooseFolder}
                >
                  <img src={folderIcon} alt="" className="btn-icon" />
                  Choose folder on Mac...
                </button>
              )}
            </div>
          </div>

          {/* error alert */}
          {errorMsg && (
            <div style={{ color: 'var(--status-error)', fontSize: '12px', padding: '8px', background: 'var(--status-error-bg)', borderRadius: '6px', border: '1px solid var(--status-error)' }}>
              ⚠ {errorMsg}
            </div>
          )}

          {/* transfer progress (visible while transferring or completed) */}
          {(transferring || completed) && (
            <div className="transfer-progress">
              <div className="transfer-progress-label">
                <span>
                  <span className={`status-dot ${completed ? 'ok' : 'active'}`} />{' '}
                  {completed
                    ? 'Transfer complete!'
                    : `Receiving ${stagedFiles[currentIndex]?.isFolder ? 'folder' : 'file'} ${currentIndex + 1} of ${stagedFiles.length}: ${currentFileName}`}
                </span>
                <span>{progressPercent}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="transfer-progress-stats">
                <span>{statsText || '(ADB USB High-Speed Pipe)'}</span>
                <span>{completed ? 'Done' : 'Pulling...'}</span>
              </div>
            </div>
          )}
        </div>

        {/* footer */}
        <div className="modal-footer">
          <span className="text-muted text-sm">Powered by Cable-Drop</span>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button className="btn btn-secondary" onClick={onClose} disabled={transferring}>
              {completed ? 'Close' : 'Cancel'}
            </button>
            {completed && (
              <button className="btn btn-secondary" onClick={handleRevealInFinder}>
                🔍 Reveal in Finder
              </button>
            )}
            {!completed ? (
              <button
                className="btn btn-save-to-mac"
                onClick={handleStartPull}
                disabled={stagedFiles.length === 0 || transferring}
              >
                <img src={receiveLightIcon} alt="" className="btn-icon" />
                {transferring ? 'Receiving from Mobile...' : 'Receive to Mac'}
              </button>
            ) : (
              <button className="btn btn-primary" onClick={onClose}>
                Done ✓
              </button>
            )}
          </div>
        </div>
      </div>

      {showBrowserModal && (
        <div
          className="modal-overlay"
          style={{ zIndex: 120 }}
          onClick={() => setShowBrowserModal(false)}
        >
          <div
            className="modal"
            style={{
              width: '860px',
              maxWidth: '95vw',
              height: '620px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3>📱 Select Files on {deviceName}</h3>
                <p className="text-muted text-sm">Browse folders and select files to save to your Mac</p>
              </div>
              <button className="modal-close" onClick={() => setShowBrowserModal(false)}>✕</button>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '0 var(--space-md) var(--space-md)' }}>
              <FileBrowser
                device={device}
                initialPath="/sdcard"
                onReceiveFiles={(chosenItems) => {
                  setStagedFiles(chosenItems)
                  setShowBrowserModal(false)
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReceiveFilesModal

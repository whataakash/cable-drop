// ReceiveFilesModal — modal for pulling files from Android to Mac
// Executes adb pull commands to download selected files to Mac

import { useState, useEffect } from 'react'
import adb from '../adb'

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

function getFileIcon(filename, isFolder) {
  if (isFolder) return '📁'
  const ext = (filename || '').split('.').pop()?.toLowerCase()
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'heic'].includes(ext)) return '🖼'
  if (['mp4', 'mov', 'mkv', 'avi'].includes(ext)) return '🎬'
  if (['mp3', 'flac', 'wav', 'm4a', 'ogg'].includes(ext)) return '🎵'
  if (['pdf'].includes(ext)) return '📄'
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return '🗜'
  if (['apk'].includes(ext)) return '📦'
  if (['json', 'js', 'html', 'css', 'ts', 'xml', 'txt', 'md'].includes(ext)) return '📝'
  return '📄'
}

function ReceiveFilesModal({ device, files = [], onClose }) {
  const [saveLocation, setSaveLocation] = useState('')
  const [transferring, setTransferring] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentFileName, setCurrentFileName] = useState('')
  const [progressPercent, setProgressPercent] = useState(0)
  const [fileStatuses, setFileStatuses] = useState({})
  const [statsText, setStatsText] = useState('')
  const [completed, setCompleted] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  const deviceName = device?.name || device?.model || 'Android Device'

  // Load default Downloads directory on Mac
  useEffect(() => {
    adb.getDefaultDownloads()
      .then((downloads) => {
        if (downloads) {
          setSaveLocation(`${downloads}/CableDrop`)
        } else {
          setSaveLocation('~/Downloads/CableDrop')
        }
      })
      .catch(() => {
        setSaveLocation('~/Downloads/CableDrop')
      })
  }, [])

  // Calculate total size of selected payload
  const totalBytes = files.reduce((acc, f) => acc + (f.size || 0), 0)

  // Choose a custom save folder on Mac using native Finder picker
  async function handleChooseFolder() {
    if (transferring) return
    try {
      const chosen = await adb.openDirectory(saveLocation)
      if (chosen) {
        setSaveLocation(chosen)
      }
    } catch (err) {
      console.warn('Failed to select folder:', err)
    }
  }

  // Open the destination folder in macOS Finder
  function handleRevealInFinder() {
    if (saveLocation) {
      adb.openPath(saveLocation)
    }
  }

  // Execute adb pull sequentially for all selected files
  async function handleStartPull() {
    if (!device?.id || files.length === 0 || transferring) return

    setTransferring(true)
    setErrorMsg(null)
    setCompleted(false)
    setProgressPercent(0)

    const total = files.length
    const statuses = {}
    files.forEach((f) => {
      statuses[f.fullPath] = 'waiting'
    })
    setFileStatuses(statuses)

    try {
      for (let i = 0; i < total; i++) {
        const file = files[i]
        setCurrentIndex(i)
        setCurrentFileName(file.name)
        setFileStatuses((prev) => ({ ...prev, [file.fullPath]: 'pulling' }))
        setStatsText(`Receiving ${file.name} (${i + 1} of ${total})`)
        setProgressPercent(Math.round((i / total) * 100))

        const output = await adb.pullFile(device.id, file.fullPath, saveLocation)
        setFileStatuses((prev) => ({ ...prev, [file.fullPath]: 'done' }))
        if (output) {
          setStatsText(output)
        }
      }

      setProgressPercent(100)
      setCompleted(true)
      setStatsText(`Saved ${total} item${total === 1 ? '' : 's'} to ${saveLocation}`)
    } catch (err) {
      console.error('Pull error:', err)
      setErrorMsg(err.message || 'File pull failed')
      setFileStatuses((prev) => ({ ...prev, [files[currentIndex]?.fullPath]: 'error' }))
    } finally {
      setTransferring(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={transferring ? undefined : onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* header */}
        <div className="modal-header">
          <div>
            <h3>📥 Receive files from Android</h3>
            <p>Pull selected payload directly over high-speed USB-ADB daemon</p>
          </div>
          <button className="modal-close" onClick={onClose} disabled={transferring}>✕</button>
        </div>

        <div className="modal-body">
          {/* direction indicator */}
          <div className="transfer-direction">
            <span>📱 {deviceName}</span>
            <span className="status-dot ok" />
            <span className="text-muted">ADB STREAM PULL ↓</span>
            <span className="transfer-direction-arrow">→</span>
            <span>🖥 Mac Workstation</span>
            <span className="badge ok" style={{ marginLeft: 'auto' }}>
              {completed ? 'COMPLETED' : transferring ? 'RECEIVING' : 'READY'}
            </span>
          </div>

          {/* selected files list */}
          <div>
            <div className="staged-header">
              <span>Selected Files to Pull</span>
              <span className="badge">
                {files.length} {files.length === 1 ? 'item' : 'items'} selected from Android ({formatSize(totalBytes)})
              </span>
            </div>

            {files.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                No files selected. Close this modal and select files in the browser first.
              </div>
            ) : (
              <ul className="staged-list" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                {files.map((file) => {
                  const status = fileStatuses[file.fullPath] || 'waiting'
                  return (
                    <li key={file.fullPath} className="staged-item">
                      <div className="staged-item-left">
                        <span>{getFileIcon(file.name, file.isFolder)}</span>
                        <span title={file.fullPath}>{file.name}</span>
                        <span className="staged-item-size">{formatSize(file.size)}</span>
                      </div>
                      <span className="text-muted text-sm">
                        {status === 'waiting' && <span className="status-dot ok" />}
                        {status === 'waiting' && ' Ready to pull'}
                        {status === 'pulling' && (
                          <span className="badge" style={{ color: 'var(--violet)' }}>
                            RECEIVING...
                          </span>
                        )}
                        {status === 'done' && (
                          <span className="badge ok">SAVED ✓</span>
                        )}
                        {status === 'error' && (
                          <span className="badge error">FAILED ✕</span>
                        )}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* save location on mac */}
          <div className="target-dir">
            <div className="target-dir-label">Save location on Mac:</div>
            <div className="target-dir-row">
              <span>📁</span>
              <span className="target-dir-path" title={saveLocation}>{saveLocation || '~/Downloads/CableDrop'}</span>
              {!transferring && (
                <button className="btn btn-secondary" onClick={handleChooseFolder}>
                  📁 Choose folder on Mac...
                </button>
              )}
            </div>
          </div>

          {/* error alert */}
          {errorMsg && (
            <div style={{ color: 'var(--red)', fontSize: '12px', padding: '8px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px' }}>
              ⚠ {errorMsg}
            </div>
          )}

          {/* transfer progress (visible while transferring or completed) */}
          {(transferring || completed) && (
            <div className="transfer-progress">
              <div className="transfer-progress-label">
                <span>
                  <span className={`status-dot ${completed ? 'ok' : 'active'}`} />{' '}
                  {completed ? 'Transfer complete!' : `Receiving ${currentFileName} (${currentIndex + 1} of ${files.length})`}
                </span>
                <span>{progressPercent}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="transfer-progress-stats">
                <span>{statsText || '(Direct USB ADB Stream)'}</span>
                <span>{completed ? 'Done' : 'Receiving...'}</span>
              </div>
            </div>
          )}

          {/* info note */}
          <div className="text-muted text-sm">
            🛡 ADB fast pull protocol transfers files directly via high-speed USB.
          </div>
        </div>

        {/* footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={transferring}>
            {completed ? 'Close' : 'Cancel'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            {completed && (
              <button className="btn btn-secondary" onClick={handleRevealInFinder}>
                🔍 Reveal in Finder
              </button>
            )}
            {!completed ? (
              <button
                className="btn btn-primary"
                onClick={handleStartPull}
                disabled={files.length === 0 || transferring}
              >
                {transferring ? 'Receiving files...' : '📥 Save to Mac'}
              </button>
            ) : (
              <button className="btn btn-primary" onClick={onClose}>
                Done ✓
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReceiveFilesModal

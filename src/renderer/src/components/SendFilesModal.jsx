import { useState } from 'react'
import adb from '../adb'
import SelectDirectoryModal from './SelectDirectoryModal'

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

function getFileIcon(filename) {
  const ext = (filename || '').split('.').pop()?.toLowerCase()
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'heic'].includes(ext)) return '🖼'
  if (['mp4', 'mov', 'mkv', 'avi'].includes(ext)) return '🎬'
  if (['mp3', 'flac', 'wav', 'm4a', 'ogg'].includes(ext)) return '🎵'
  if (['pdf'].includes(ext)) return '📄'
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return '🗜'
  if (['apk'].includes(ext)) return '📦'
  if (['json', 'js', 'html', 'css', 'ts', 'xml', 'txt', 'md'].includes(ext)) return '{ }'
  return '📄'
}

function SendFilesModal({ device, targetDirectory = '/sdcard/Download', onClose, onSuccess }) {
  const [stagedFiles, setStagedFiles] = useState([])
  const [targetDir, setTargetDir] = useState(targetDirectory || '/sdcard/Download')
  const [showPickerModal, setShowPickerModal] = useState(false)

  // Transfer execution states
  const [transferring, setTransferring] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentFileName, setCurrentFileName] = useState('')
  const [progressPercent, setProgressPercent] = useState(0)
  const [fileStatuses, setFileStatuses] = useState({})
  const [transferStatsText, setTransferStatsText] = useState('')
  const [completed, setCompleted] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  const deviceName = device?.name || device?.model || 'Android Device'

  // Pick files using native macOS Finder file sheet
  async function handleChooseFiles() {
    try {
      const files = await adb.openFiles()
      if (files && files.length > 0) {
        addFilesToStage(files)
      }
    } catch (err) {
      console.warn('Failed to open file picker:', err)
    }
  }

  // Handle files dropped from Mac Finder
  function handleDrop(e) {
    e.preventDefault()
    e.stopPropagation()

    if (e.dataTransfer?.files?.length > 0) {
      const dropped = Array.from(e.dataTransfer.files).map((f) => ({
        path: f.path,
        name: f.name,
        size: f.size
      }))
      addFilesToStage(dropped)
    }
  }

  // Add files to staged list without duplicates
  function addFilesToStage(newFiles) {
    setStagedFiles((prev) => {
      const existingPaths = new Set(prev.map((f) => f.path))
      const unique = newFiles.filter((f) => f.path && !existingPaths.has(f.path))
      return [...prev, ...unique]
    })
  }

  // Remove individual file from stage
  function handleRemoveFile(path) {
    if (transferring) return
    setStagedFiles((prev) => prev.filter((f) => f.path !== path))
  }

  // Clear all staged files
  function handleClearAll() {
    if (transferring) return
    setStagedFiles([])
    setFileStatuses({})
    setCompleted(false)
    setErrorMsg(null)
  }

  // Execute adb push sequentially for all staged files
  async function handleStartPush() {
    if (!device?.id || stagedFiles.length === 0 || transferring) return

    setTransferring(true)
    setErrorMsg(null)
    setCompleted(false)
    setProgressPercent(0)

    const total = stagedFiles.length
    const statuses = {}
    stagedFiles.forEach((f) => {
      statuses[f.path] = 'waiting'
    })
    setFileStatuses(statuses)

    try {
      for (let i = 0; i < total; i++) {
        const file = stagedFiles[i]
        setCurrentIndex(i)
        setCurrentFileName(file.name)
        setFileStatuses((prev) => ({ ...prev, [file.path]: 'inFlight' }))
        setTransferStatsText(`Pushing file ${i + 1} of ${total}: ${file.name}`)
        setProgressPercent(Math.round((i / total) * 100))

        const output = await adb.pushFile(device.id, file.path, targetDir)
        setFileStatuses((prev) => ({ ...prev, [file.path]: 'done' }))
        if (output) {
          setTransferStatsText(output)
        }
      }

      setProgressPercent(100)
      setCompleted(true)
      setTransferStatsText(`All ${total} files pushed successfully!`)
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error('Push error:', err)
      setErrorMsg(err.message || 'File push failed')
      setFileStatuses((prev) => ({ ...prev, [stagedFiles[currentIndex]?.path]: 'error' }))
    } finally {
      setTransferring(false)
    }
  }

  // Friendly display for target folder (e.g. Internal Storage/Download)
  const displayTarget = targetDir.startsWith('/sdcard')
    ? 'Internal Storage' + targetDir.slice(7)
    : targetDir

  return (
    <div className="modal-overlay" onClick={transferring ? undefined : onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* header */}
        <div className="modal-header">
          <div>
            <h3>Send files to Android</h3>
            <p>ADB High-Speed Direct USB Pipe Mode</p>
          </div>
          <button className="modal-close" onClick={onClose} disabled={transferring}>✕</button>
        </div>

        <div className="modal-body">
          {/* transfer direction */}
          <div className="transfer-direction">
            <span>🖥 Mac Workstation (Local Finder)</span>
            <span className="transfer-direction-arrow">→</span>
            <span>📱 {deviceName} ({displayTarget})</span>
            <span className={`badge ${completed ? 'ok' : 'ok'}`} style={{ marginLeft: 'auto' }}>
              {completed ? 'COMPLETED' : transferring ? 'SENDING' : 'READY'}
            </span>
          </div>

          {/* drop zones for adding files */}
          <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
            <div
              className="drop-zone"
              style={{ flex: 1, cursor: transferring ? 'not-allowed' : 'pointer' }}
              onClick={transferring ? undefined : handleChooseFiles}
            >
              <div className="drop-zone-icon">📂</div>
              <div className="drop-zone-label">Choose files from Mac...</div>
              <div className="drop-zone-sub text-muted">Opens native Finder sheet</div>
            </div>
            <div
              className="drop-zone"
              style={{ flex: 1 }}
              onDragOver={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onDrop={handleDrop}
            >
              <div className="drop-zone-icon">📤</div>
              <div className="drop-zone-label">Drop files or directories anywhere</div>
              <div className="drop-zone-sub text-muted">Queues immediately for batch ADB streaming</div>
            </div>
          </div>

          {/* staged file list */}
          <div>
            <div className="staged-header">
              <span>STAGED PAYLOAD ({stagedFiles.length} {stagedFiles.length === 1 ? 'FILE' : 'FILES'})</span>
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
                No files staged yet. Click above or drag and drop files from Finder to send.
              </div>
            ) : (
              <ul className="staged-list" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                {stagedFiles.map((file) => {
                  const status = fileStatuses[file.path] || 'waiting'
                  return (
                    <li key={file.path} className="staged-item">
                      <div className="staged-item-left">
                        <span>{getFileIcon(file.name)}</span>
                        <span title={file.path}>{file.name}</span>
                        {status === 'inFlight' && (
                          <span className="badge" style={{ color: 'var(--violet)' }}>IN FLIGHT</span>
                        )}
                        {status === 'done' && (
                          <span className="badge ok">SENT ✓</span>
                        )}
                        {status === 'error' && (
                          <span className="badge error">FAILED ✕</span>
                        )}
                      </div>
                      <div className="staged-item-right">
                        <span className="staged-item-size">{formatSize(file.size)}</span>
                        {!transferring && (
                          <button
                            className="staged-item-remove"
                            onClick={() => handleRemoveFile(file.path)}
                            title="Remove file"
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

          {/* target directory */}
          <div className="target-dir">
            <div className="target-dir-label">TARGET ANDROID DIRECTORY</div>
            <div className="target-dir-row">
              <span>📁</span>
              <span className="target-dir-path" title={targetDir}>{displayTarget}</span>
              {!transferring && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPickerModal(true)}
                >
                  📁 Browse folders...
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
                  {completed ? 'Transfer complete!' : `Pushing file ${currentIndex + 1} of ${stagedFiles.length}: ${currentFileName}`}
                </span>
                <span>{progressPercent}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="transfer-progress-stats">
                <span>{transferStatsText || '(ADB USB High-Speed Pipe)'}</span>
                <span>{completed ? 'Done' : 'Pushing...'}</span>
              </div>
            </div>
          )}
        </div>

        {/* footer */}
        <div className="modal-footer">
          <span className="text-muted text-sm">🔒 ADB End-to-End Pipe Verified</span>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button className="btn btn-secondary" onClick={onClose} disabled={transferring}>
              {completed ? 'Close' : 'Cancel'}
            </button>
            {!completed ? (
              <button
                className="btn btn-primary"
                onClick={handleStartPush}
                disabled={stagedFiles.length === 0 || transferring}
              >
                {transferring ? 'Pushing files...' : '▶ Send files to Phone'}
              </button>
            ) : (
              <button className="btn btn-primary" onClick={onClose}>
                Done ✓
              </button>
            )}
          </div>
        </div>
      </div>

      {showPickerModal && (
        <SelectDirectoryModal
          device={device}
          initialPath={targetDir}
          onSelect={(chosenPath) => setTargetDir(chosenPath)}
          onClose={() => setShowPickerModal(false)}
        />
      )}
    </div>
  )
}

export default SendFilesModal

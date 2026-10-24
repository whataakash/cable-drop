import { useState, useEffect } from 'react'
import adb from '../adb'
import SelectDirectoryModal from './SelectDirectoryModal'
import { macIcon, mobileIcon, folderIcon, fileIcon, imageIcon, videoIcon, sendLightIcon, arrowIcon } from '../assets/icons'

function formatSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
}

function getFileIcon(filename, isDirectory) {
  if (isDirectory) return folderIcon
  const ext = (filename || '').split('.').pop().toLowerCase()
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'heic'].includes(ext)) return imageIcon
  if (['mp4', 'mov', 'mkv', 'avi'].includes(ext)) return videoIcon
  return fileIcon
}

function SendFilesModal({ device, targetDirectory = '/sdcard/Download', onClose, onSuccess }) {
  const [stagedFiles, setStagedFiles] = useState([])
  const [targetDir, setTargetDir] = useState(targetDirectory || '/sdcard/Download')
  const [hasChosenDir, setHasChosenDir] = useState(Boolean(targetDirectory))
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

  // Pick files or folders using native macOS Finder sheet
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

  // Clean up progress listener on unmount
  useEffect(() => {
    return () => {
      adb.removeProgressListener()
    }
  }, [])

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

    let currentFileIdx = 0

    // Listen for real-time progress from adb push -p
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
        setTransferStatsText(text)
      }
    })

    try {
      for (let i = 0; i < total; i++) {
        currentFileIdx = i
        const file = stagedFiles[i]
        setCurrentIndex(i)
        setCurrentFileName(file.name)
        setFileStatuses((prev) => ({ ...prev, [file.path]: 'inFlight' }))
        const itemType = file.isDirectory ? 'folder' : 'file'
        setTransferStatsText(`Pushing ${itemType} ${i + 1} of ${total}: ${file.name}`)
        setProgressPercent(Math.round((i / total) * 100))

        const output = await adb.pushFile(device.id, file.path, targetDir)
        setFileStatuses((prev) => ({ ...prev, [file.path]: 'done' }))
        if (output) {
          setTransferStatsText(output)
        }
      }

      setProgressPercent(100)
      setCompleted(true)
      setTransferStatsText(`All ${total} items pushed successfully!`)
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error('Push error:', err)
      setErrorMsg(err.message || 'File push failed')
      setFileStatuses((prev) => ({ ...prev, [stagedFiles[currentFileIdx]?.path]: 'error' }))
    } finally {
      adb.removeProgressListener()
      setTransferring(false)
    }
  }

  // Storage type (Internal Storage vs SD Card)
  const isSdCard = targetDir.startsWith('/storage/') && !targetDir.startsWith('/storage/emulated')
  const storageType = isSdCard ? 'SD Card' : 'Internal Storage'

  // Friendly display for target folder (e.g. Internal Storage/Download)
  const displayTarget = targetDir.startsWith('/sdcard')
    ? 'Internal Storage' + targetDir.slice(7)
    : targetDir

  const folderParts = targetDir.split('/').filter(Boolean)
  const folderName = folderParts.length > 0 ? folderParts[folderParts.length - 1] : 'Internal Storage'

  return (
    <div className="modal-overlay" onClick={transferring ? undefined : onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* header */}
        <div className="modal-header">
          <div>
            <h3>Send files to Mobile</h3>
            <p>using your Type C Cable</p>
          </div>
          <button className="modal-close" onClick={onClose} disabled={transferring}>✕</button>
        </div>

        <div className="modal-body">
          {/* transfer direction */}
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
                <img src={macIcon} alt="" className="inline-icon" />
                <span>Your MacBook</span>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>(Macintosh HD)</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <img src={arrowIcon} alt="->" className="transfer-arrow-icon" />
            </div>

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
              <span className={`badge ${completed ? 'ok' : 'ok'}`}>
                {completed ? 'COMPLETED' : transferring ? 'SENDING' : 'READY'}
              </span>
            </div>
          </div>

          {/* drop zones for adding files & selecting destination */}
          <div style={{ display: 'flex', gap: 'var(--space-md)', width: '100%' }}>
            <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <div
                className={`drop-zone ${stagedFiles.length > 0 ? 'selected' : ''}`}
                style={{ cursor: transferring ? 'not-allowed' : 'pointer' }}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onDrop={handleDrop}
                onClick={transferring ? undefined : handleChooseFiles}
              >
                {stagedFiles.length === 0 ? (
                  <>
                    <img src={folderIcon} alt="" className="drop-zone-svg" />
                    <div className="drop-zone-label">Choose files or folders from Mac...</div>
                    <div className="drop-zone-sub text-muted">Click or drag & drop to send</div>
                  </>
                ) : (
                  <>
                    <div className="drop-zone-icon">✓</div>
                    <div className="drop-zone-label" style={{ color: 'var(--status-ok)' }}>
                      ✓ {stagedFiles.length} {stagedFiles.length === 1 ? 'item' : 'items'} chosen
                    </div>
                    <div className="drop-zone-sub text-muted">Click to choose more</div>
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

            <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <div
                className={`drop-zone ${hasChosenDir ? 'selected' : ''}`}
                style={{ cursor: transferring ? 'not-allowed' : 'pointer' }}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onDrop={handleDrop}
                onClick={transferring ? undefined : () => setShowPickerModal(true)}
              >
                {hasChosenDir ? (
                  <>
                    <img src={folderIcon} alt="" className="drop-zone-svg" />
                    <div className="drop-zone-label" style={{ color: 'var(--status-ok)' }}>
                      ✓ Directory chosen: {folderName}
                    </div>
                    <div className="drop-zone-sub text-muted" title={displayTarget}>
                      {displayTarget} · Click to change
                    </div>
                  </>
                ) : (
                  <>
                    <img src={mobileIcon} alt="" className="drop-zone-svg" />
                    <div className="drop-zone-label">Browse folder on Phone...</div>
                    <div className="drop-zone-sub text-muted">Choose destination folder on mobile</div>
                  </>
                )}
              </div>
              <div style={{ height: '24px', display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                {hasChosenDir && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ height: '22px', fontSize: '11px', padding: '0 8px' }}
                    onClick={() => {
                      setHasChosenDir(false)
                      setTargetDir('/sdcard/Download')
                    }}
                    disabled={transferring}
                  >
                    Clear folder
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
                No files or folders staged yet. Choose files/folders above or drag and drop from Finder.
              </div>
            ) : (
              <ul className="staged-list" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                {stagedFiles.map((file) => {
                  const status = fileStatuses[file.path] || 'waiting'
                  return (
                    <li key={file.path} className="staged-item">
                      <div className="staged-item-left">
                        <img src={getFileIcon(file.name, file.isDirectory)} alt="" className="file-row-icon" />
                        <span title={file.path}>{file.name}</span>
                        {file.isDirectory && (
                          <span className="badge" style={{ fontSize: '10px', padding: '1px 5px', opacity: 0.85 }}>FOLDER</span>
                        )}
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
                        <span className="staged-item-size">{file.isDirectory ? 'Folder' : formatSize(file.size)}</span>
                        {!transferring && (
                          <button
                            className="staged-item-remove"
                            onClick={() => handleRemoveFile(file.path)}
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

          {/* target directory */}
          <div className="target-dir">
            <div className="target-dir-label">TARGET ANDROID DIRECTORY</div>
            <div className="target-dir-row">
              <img src={folderIcon} alt="" className="inline-icon" />
              <span
                className="target-dir-path"
                title={targetDir}
                style={{ cursor: transferring ? 'not-allowed' : 'pointer' }}
                onClick={transferring ? undefined : () => setShowPickerModal(true)}
              >
                {displayTarget}
              </span>
              {!transferring && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPickerModal(true)}
                >
                  <img src={folderIcon} alt="" className="btn-icon" />
                  Browse folders...
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
                  {completed ? 'Transfer complete!' : `Pushing ${stagedFiles[currentIndex]?.isDirectory ? 'folder' : 'file'} ${currentIndex + 1} of ${stagedFiles.length}: ${currentFileName}`}
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
          <span className="text-muted text-sm">Powered by Cable-Drop</span>
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
                <img src={sendLightIcon} alt="" className="btn-icon" />
                {transferring ? 'Pushing to Mobile...' : 'Send to Mobile'}
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
          onSelect={(chosenPath) => {
            setTargetDir(chosenPath)
            setHasChosenDir(true)
          }}
          onClose={() => setShowPickerModal(false)}
        />
      )}
    </div>
  )
}

export default SendFilesModal

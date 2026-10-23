// ReceiveFilesModal — modal for pulling files from Android to Mac
// Shows selected files, save location, and download progress

function ReceiveFilesModal({ onClose }) {
  // dummy selected files to pull
  const filesToPull = [
    { name: 'report_q3_final.pdf', size: '4.2 MB', status: 'Verified ADB stream', icon: '📄' },
    { name: 'vacation_tokyo_042.jpg', size: '8.6 MB', status: 'Thumbnail ready', icon: '🖼' },
    { name: 'screen_recording_demo.mp4', size: '235.6 MB', status: 'High-speed sync', icon: '🎬' }
  ]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* header */}
        <div className="modal-header">
          <div>
            <h3>📥 Receive files from Android</h3>
            <p>Pull selected payload directly over high-speed USB-ADB daemon</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* direction indicator */}
          <div className="transfer-direction">
            <span>📱 Google Pixel 8 Pro</span>
            <span className="status-dot ok" />
            <span className="text-muted">ADB STREAM PULL ↓</span>
            <span className="transfer-direction-arrow">→</span>
            <span>🖥 Mac Workstation</span>
          </div>

          {/* selected files list */}
          <div>
            <div className="staged-header">
              <span>Selected Files to Pull</span>
              <span className="badge">3 items selected from Android (248.4 MB)</span>
            </div>
            <ul className="staged-list">
              {filesToPull.map((file) => (
                <li key={file.name} className="staged-item">
                  <div className="staged-item-left">
                    <span>{file.icon}</span>
                    <span>{file.name}</span>
                    <span className="staged-item-size">{file.size}</span>
                  </div>
                  <span className="text-muted text-sm">
                    <span className="status-dot ok" /> {file.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* save location on mac */}
          <div className="target-dir">
            <div className="target-dir-label">Save location on Mac:</div>
            <div className="target-dir-row">
              <span>📁</span>
              <span className="target-dir-path">~/Downloads/CableDrop/2024-10-24/</span>
              <button className="btn btn-secondary">📁 Choose folder on Mac...</button>
            </div>
          </div>

          {/* transfer progress */}
          <div className="transfer-progress">
            <div className="transfer-progress-label">
              <span>Receiving screen_recording_demo.mp4</span>
              <span>82%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: '82%' }} />
            </div>
            <div className="transfer-progress-stats">
              <span>193 MB / 235.6 MB</span>
              <span>104 MB/s (USB 3.2 Gen 1)</span>
              <span>ETA: 0.4s</span>
            </div>
          </div>

          {/* info note */}
          <div className="text-muted text-sm">
            🛡 ADB fast pull protocol handles permissions seamlessly without root authorization.
          </div>
        </div>

        {/* footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <span className="text-muted text-sm">Press ⌘S to save</span>
            <button className="btn btn-primary">📥 Save to Mac</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReceiveFilesModal

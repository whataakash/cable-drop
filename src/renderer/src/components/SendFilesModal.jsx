// SendFilesModal — modal for sending files from Mac to Android
// Shows staged file list, target directory, and transfer progress

function SendFilesModal({ onClose }) {
  // dummy staged files
  const stagedFiles = [
    { name: 'design_system_tokens_v2.json', size: '420 KB', icon: '{ }' },
    { name: 'keynote_product_launch.key', size: '84.5 MB', icon: '📊' },
    { name: 'raw_b-roll_footage_4k.mov', size: '620.0 MB', icon: '🎬', inFlight: true },
    { name: 'offline_map_data.sqlite', size: '112.4 MB', icon: '💾' }
  ]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* header */}
        <div className="modal-header">
          <div>
            <h3>Send files to Android</h3>
            <p>ADB High-Speed Direct USB Pipe Mode</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* transfer direction */}
          <div className="transfer-direction">
            <span>🖥 Mac Workstation (Local Finder)</span>
            <span className="transfer-direction-arrow">→</span>
            <span>📱 Google Pixel 8 Pro (Internal Storage/Download)</span>
            <span className="badge ok" style={{ marginLeft: 'auto' }}>READY</span>
          </div>

          {/* drop zone for adding files */}
          <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
            <div className="drop-zone" style={{ flex: 1 }}>
              <div className="drop-zone-icon">📂</div>
              <div className="drop-zone-label">Choose files from Mac...</div>
              <div className="drop-zone-sub text-muted">Opens native Finder sheet</div>
            </div>
            <div className="drop-zone" style={{ flex: 1 }}>
              <div className="drop-zone-icon">📤</div>
              <div className="drop-zone-label">Drop files or directories anywhere</div>
              <div className="drop-zone-sub text-muted">Queues immediately for batch ADB streaming</div>
            </div>
          </div>

          {/* staged file list */}
          <div>
            <div className="staged-header">
              <span>STAGED PAYLOAD ({stagedFiles.length} FILES)</span>
              <button className="btn btn-secondary" style={{ height: 22, fontSize: 11 }}>
                Clear all
              </button>
            </div>
            <ul className="staged-list">
              {stagedFiles.map((file) => (
                <li key={file.name} className="staged-item">
                  <div className="staged-item-left">
                    <span>{file.icon}</span>
                    <span>{file.name}</span>
                    {file.inFlight && (
                      <span className="badge" style={{ color: 'var(--violet)' }}>IN FLIGHT</span>
                    )}
                  </div>
                  <div className="staged-item-right">
                    <span className="staged-item-size">{file.size}</span>
                    <button className="staged-item-remove">✕</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* target directory */}
          <div className="target-dir">
            <div className="target-dir-label">TARGET ANDROID DIRECTORY</div>
            <div className="target-dir-row">
              <span>📁</span>
              <span className="target-dir-path">Internal Storage/Download/ProductAssets/</span>
              <button className="btn btn-secondary">📁 Change destination directory...</button>
            </div>
          </div>

          {/* transfer progress */}
          <div className="transfer-progress">
            <div className="transfer-progress-label">
              <span>
                <span className="status-dot active" /> Pushing file 3 of 4: raw_b-roll_footage_4k.mov
              </span>
              <span>68%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: '68%' }} />
            </div>
            <div className="transfer-progress-stats">
              <span>(421 MB / 620 MB active payload)</span>
              <span>88.4 MB/s (Direct USB 3.2 Pipe)</span>
              <span>~4 seconds remaining</span>
            </div>
          </div>
        </div>

        {/* footer */}
        <div className="modal-footer">
          <span className="text-muted text-sm">🔒 ADB End-to-End Pipe Verified</span>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button className="btn btn-secondary" onClick={onClose}>Cancel Transfer</button>
            <button className="btn btn-primary">▶ Send files to Phone</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SendFilesModal

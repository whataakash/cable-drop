// ConnectedDevices — displays actual Android devices detected via ADB
// Shows phone model, authorization state, serial, and connection status

function ConnectedDevices({ devices = [], onBrowseFiles, onRescan }) {
  return (
    <div>
      {/* page header */}
      <div className="devices-header">
        <h2>
          Connected Devices
          <span className="badge ok">
            <span className="status-dot ok" /> {devices.length} {devices.length === 1 ? 'Device' : 'Devices'} Detected
          </span>
        </h2>
        <div className="devices-header-actions">
          <button className="btn btn-secondary" onClick={onRescan}>🔌 Rescan Bus</button>
        </div>
      </div>

      <p className="devices-header-sub">
        Manage local USB endpoints connected via ADB daemon.
      </p>

      {/* list of detected devices */}
      {devices.map((device) => {
        const isAuthorized = device.state === 'device'
        const isUnauthorized = device.state === 'unauthorized'

        return (
          <div key={device.id} className="device-card">
            <div className="device-card-top">
              <div className="device-card-info">
                <div className="device-card-icon">📱</div>
                <div>
                  <div className="device-card-name">
                    {device.name}
                    {isAuthorized && (
                      <span className="badge ok">
                        <span className="status-dot ok" /> Connected &amp; Authorized
                      </span>
                    )}
                    {isUnauthorized && (
                      <span className="badge warn">
                        <span className="status-dot warn" /> Unauthorized
                      </span>
                    )}
                    {device.state === 'offline' && (
                      <span className="badge error">
                        <span className="status-dot error" /> Device Offline
                      </span>
                    )}
                  </div>
                  <div className="device-card-meta">
                    Serial: {device.serial}
                    {device.product ? ` · Product: ${device.product}` : ''}
                    {' · USB'}
                  </div>
                </div>
              </div>
            </div>

            {/* action buttons */}
            <div className="device-card-actions">
              {isAuthorized ? (
                <button className="btn btn-primary" onClick={() => onBrowseFiles && onBrowseFiles(device)}>
                  📂 Browse Files ⌘B
                </button>
              ) : (
                <button className="btn btn-secondary" onClick={onRescan}>
                  🔑 Check Phone for RSA Prompt
                </button>
              )}
              <div className="device-card-actions-right">
                <button className="btn btn-secondary" onClick={onRescan}>
                  ↻ Refresh Status
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ConnectedDevices

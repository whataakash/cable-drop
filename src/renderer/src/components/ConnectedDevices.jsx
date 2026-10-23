// ConnectedDevices — displays actual Android devices detected via ADB
// Allows renaming device nicknames and navigating to file browser

import { useState } from 'react'
import { mobileIcon, folderLightIcon } from '../assets/icons'

function ConnectedDevices({ devices = [], onBrowseFiles, onRescan, onRenameDevice }) {
  // State for inline device renaming
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')

  // Begin editing device name
  function startEditing(device) {
    setEditingId(device.id)
    setEditName(device.name || '')
  }

  // Save new device name and exit editing mode
  function saveEditing(deviceId) {
    if (onRenameDevice) {
      onRenameDevice(deviceId, editName)
    }
    setEditingId(null)
  }

  // Cancel editing without saving
  function cancelEditing() {
    setEditingId(null)
  }

  return (
    <div className="connected-devices">
      {/* page header */}
      <div className="devices-header">
        <h2>
          Connected Devices
          <span className="badge ok">
            <span className="status-dot ok" /> {devices.length} {devices.length === 1 ? 'Device' : 'Devices'} Detected
          </span>
        </h2>
        <div className="devices-header-actions">
          <button className="btn btn-secondary" onClick={onRescan}>Re-Scan</button>
        </div>
      </div>

      {/* list of detected devices */}
      {devices.map((device) => {
        const isAuthorized = device.state === 'device'
        const isUnauthorized = device.state === 'unauthorized'
        const isEditing = editingId === device.id

        return (
          <div key={device.id} className="device-card">
            <div className="device-card-top">
              <div className="device-card-info">
                <div className="device-card-icon">
                  <img src={mobileIcon} alt="" style={{ width: 28, height: 28 }} />
                </div>
                <div>
                  <div className="device-card-name">
                    {isEditing ? (
                      <div className="rename-form">
                        <input
                          type="text"
                          className="rename-input"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEditing(device.id)
                            if (e.key === 'Escape') cancelEditing()
                          }}
                          autoFocus
                        />
                        <button
                          type="button"
                          className="rename-action-btn save"
                          onClick={() => saveEditing(device.id)}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="rename-action-btn"
                          onClick={cancelEditing}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <span>{device.name}</span>
                        <button
                          type="button"
                          className="rename-btn"
                          title="Rename device"
                          onClick={() => startEditing(device)}
                        >
                          ✎ Rename
                        </button>
                      </>
                    )}

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
                <button className="btn btn-primary btn-lg" onClick={() => onBrowseFiles && onBrowseFiles(device)}>
                  <img src={folderLightIcon} alt="" className="btn-icon" />
                  Browse Files
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

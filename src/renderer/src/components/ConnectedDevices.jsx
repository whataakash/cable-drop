// ConnectedDevices — displays actual Android devices detected via ADB
// Allows renaming device nicknames and navigating to file browser

import { useState, useEffect } from 'react'
import { mobileIcon, folderLightIcon } from '../assets/icons'
import { adb, adbReprompt } from '../adb'

function formatStorage(bytes) {
  if (!bytes || isNaN(bytes)) return '0 GB'
  const gb = bytes / (1024 * 1024 * 1024)
  if (gb >= 1) {
    return `${gb.toFixed(1)} GB`
  }
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(0)} MB`
}

function ConnectedDevices({
  devices = [],
  selectedDevice,
  onSelectDevice,
  onBrowseFiles,
  onRescan,
  onRenameDevice
}) {
  // State for inline device renaming
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')

  // State for live storage and battery stats per device
  const [deviceStats, setDeviceStats] = useState({})

  const currentPrimaryId = selectedDevice?.id || devices[0]?.id

  // Fetch device stats (storage via df -k /sdcard, battery via dumpsys battery)
  async function fetchStatsForDevices(devList) {
    const list = devList || devices
    const authorized = list.filter((d) => d.state === 'device')
    if (authorized.length === 0) return

    for (const dev of authorized) {
      setDeviceStats((prev) => ({
        ...prev,
        [dev.id]: {
          ...(prev[dev.id] || {}),
          loading: prev[dev.id]?.storage ? false : true
        }
      }))

      try {
        const [storage, battery] = await Promise.all([
          adb.getDeviceStorage(dev.id).catch(() => null),
          adb.getDeviceBattery(dev.id).catch(() => null)
        ])

        setDeviceStats((prev) => ({
          ...prev,
          [dev.id]: { storage, battery, loading: false }
        }))
      } catch (err) {
        console.warn('Could not query stats for device', dev.id, err)
        setDeviceStats((prev) => ({
          ...prev,
          [dev.id]: { ...(prev[dev.id] || {}), loading: false }
        }))
      }
    }
  }

  useEffect(() => {
    fetchStatsForDevices(devices)
  }, [devices])

  // Begin editing device name
  function startEditing(device) {
    setEditingId(device.id)
    setEditName(device.name || '')
  }

  // Rescan for connected devices via ADB and reprompt
  async function handleRescan() {
    await adbReprompt()
    if (onRescan) {
      onRescan()
    }
    fetchStatsForDevices(devices)
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
          {devices.length >= 2 && (
            <div className="primary-device-picker">
              <span className="primary-device-label">Primary device:</span>
              <div className="primary-device-select-wrap">
                <select
                  className="primary-device-select"
                  value={currentPrimaryId}
                  onChange={(e) => {
                    const chosen = devices.find((d) => d.id === e.target.value)
                    if (chosen && onSelectDevice) {
                      onSelectDevice(chosen)
                    }
                  }}
                  title="Choose primary device"
                >
                  {devices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name || d.model || d.serial}
                    </option>
                  ))}
                </select>
                <span className="primary-device-chevron">
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </div>
            </div>
          )}
          <button className="btn btn-secondary" onClick={handleRescan}>
            <span style={{ marginRight: 6 }}>↻</span>Re-Scan
          </button>
        </div>
      </div>

      {/* list of detected devices */}
      {devices.map((device) => {
        const isAuthorized = device.state === 'device'
        const isUnauthorized = device.state === 'unauthorized'
        const isEditing = editingId === device.id
        const isPrimary = currentPrimaryId === device.id

        const stats = deviceStats[device.id] || {}
        const storage = stats.storage
        const battery = stats.battery
        const statsLoading = stats.loading

        return (
          <div key={device.id} className={`device-card ${isPrimary && devices.length >= 2 ? 'is-primary' : ''}`}>
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
                    {devices.length >= 2 && isPrimary && (
                      <span className="badge primary-tag">Primary</span>
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

              {/* Battery indicator widget */}
              {isAuthorized && (
                <div className="device-card-top-right">
                  {statsLoading && !battery ? (
                    <div className="device-battery-loading">
                      <span className="status-dot active" />
                      <span>Reading stats...</span>
                    </div>
                  ) : battery && battery.percent !== null ? (
                    <div
                      className={`device-battery-widget ${battery.isCharging ? 'charging' : ''}`}
                      title={battery.statusText || (battery.isCharging ? 'Charging' : 'On Battery')}
                    >
                      <div className="battery-capsule-wrapper">
                        <div className="battery-capsule">
                          <div
                            className="battery-capsule-fill"
                            style={{
                              width: `${Math.min(Math.max(battery.percent, 8), 100)}%`,
                              background:
                                battery.percent <= 20
                                  ? '#FF5F56'
                                  : battery.isCharging
                                  ? '#5ED6C0'
                                  : 'var(--violet)'
                            }}
                          />
                        </div>
                        <div className="battery-capsule-nipple" />
                      </div>
                      <div className="battery-info-col">
                        <span className="battery-percent-text">{battery.percent}%</span>
                        {battery.isCharging && (
                          <span className="battery-charging-badge">⚡ {battery.statusText || 'Charging'}</span>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Storage Progress & Stats Section */}
            {isAuthorized && (
              <div className="device-storage-box">
                <div className="storage-box-header">
                  <div className="storage-box-title">
                    <span className="storage-title-icon"></span>
                    <span className="storage-title-name">Internal Storage</span>
                    {storage && (
                      <span className="storage-title-tag">
                        {storage.percentUsed}% used
                      </span>
                    )}
                  </div>
                  <div className="storage-box-summary">
                    {storage ? (
                      <>
                        <span className="storage-free-bold">{formatStorage(storage.availableBytes)}</span>
                        <span className="storage-label-dim"> available of </span>
                        <span className="storage-total-bold">{formatStorage(storage.totalBytes)}</span>
                      </>
                    ) : statsLoading ? (
                      <span className="storage-loading-msg">Reading storage...</span>
                    ) : (
                      <span className="storage-loading-msg">Storage info unavailable</span>
                    )}
                  </div>
                </div>

                <div className="storage-bar-track">
                  <div
                    className="storage-bar-segment"
                    style={{
                      width: storage ? `${Math.min(Math.max(storage.percentUsed, 3), 100)}%` : '0%',
                      background:
                        storage && storage.percentUsed >= 90
                          ? 'linear-gradient(90deg, var(--violet) 0%, #FF5F56 100%)'
                          : 'linear-gradient(90deg, var(--violet) 0%, #5ED6C0 100%)'
                    }}
                  />
                </div>

                {storage && (
                  <div className="storage-metrics-chips">
                    <div className="storage-chip">
                      <span className="storage-chip-dot used" />
                      <span className="storage-chip-text">
                        Used: {formatStorage(storage.usedBytes)}
                      </span>
                    </div>
                    <div className="storage-chip">
                      <span className="storage-chip-dot free" />
                      <span className="storage-chip-text">
                        Available: {formatStorage(storage.availableBytes)}
                      </span>
                    </div>
                    <div className="storage-chip">
                      <span className="storage-chip-dot total" />
                      <span className="storage-chip-text">
                        Total Capacity: {formatStorage(storage.totalBytes)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* action buttons */}
            <div className="device-card-actions">
              {isAuthorized ? (
                <button className="btn btn-primary btn-lg" onClick={() => onBrowseFiles && onBrowseFiles(device)}>
                  <img src={folderLightIcon} alt="" className="btn-icon" />
                  Browse Files
                </button>
              ) : (
                <button className="btn btn-secondary" onClick={handleRescan}>
                  🔑 Check Phone for RSA Prompt
                </button>
              )}
              <div className="device-card-actions-right">
                <button className="btn btn-secondary" onClick={handleRescan}>
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

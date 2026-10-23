// Sidebar — device info + volume shortcuts
// Allows switching active device and jumping directly to common Android folders

function Sidebar({ device, devices = [], onSelectDevice, activeFolder, onFolderClick }) {
  // Common storage folders mapped to standard Android paths
  const folders = [
    { name: 'Internal Storage', path: '/sdcard', icon: '💾' },
    { name: 'Downloads', path: '/sdcard/Download', icon: '📥' },
    { name: 'DCIM Camera', path: '/sdcard/DCIM', icon: '📷' },
    { name: 'Documents', path: '/sdcard/Documents', icon: '📄' },
    { name: 'Pictures', path: '/sdcard/Pictures', icon: '🖼' },
    { name: 'Music', path: '/sdcard/Music', icon: '🎵' },
    { name: 'Movies', path: '/sdcard/Movies', icon: '🎬' }
  ]

  if (!device) return null

  return (
    <div className="sidebar">
      {/* device info at top */}
      <div className="sidebar-device">
        {devices.length > 1 ? (
          <select
            className="device-select-dropdown"
            style={{ width: '100%', marginBottom: '4px' }}
            value={device.id}
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
        ) : (
          <div className="sidebar-device-name">
            <span className="status-dot ok" /> {device.name}
          </div>
        )}

        <div className="sidebar-device-sub">
          Serial: {device.serial || device.id}
        </div>
      </div>

      {/* volume shortcuts */}
      <div className="sidebar-section-title">
        {device.name.toUpperCase()} VOLUMES
      </div>
      {folders.map((folder) => (
        <div
          key={folder.name}
          className={`sidebar-item ${activeFolder === folder.path ? 'active' : ''}`}
          onClick={() => onFolderClick(folder.path)}
        >
          <span className="sidebar-item-icon">{folder.icon}</span>
          {folder.name}
        </div>
      ))}

      {/* footer with adb port status */}
      <div className="sidebar-footer">
        <span>⚙ Settings</span>
        <span>
          <span className="status-dot ok" /> adb:5037 ONLINE
        </span>
      </div>
    </div>
  )
}

export default Sidebar

// Sidebar — device info + storage volume shortcuts
// Shows connected device name, storage folders, and footer status

function Sidebar({ device, activeFolder, onFolderClick }) {
  // storage folders that appear on the device
  const folders = [
    { name: 'Internal Storage', icon: '💾' },
    { name: 'Downloads', icon: '📥' },
    { name: 'DCIM Camera', icon: '📷' },
    { name: 'Documents', icon: '📄' },
    { name: 'Pictures', icon: '🖼' },
    { name: 'Music', icon: '🎵' },
    { name: 'Movies', icon: '🎬' }
  ]

  return (
    <div className="sidebar">
      {/* device info at top */}
      <div className="sidebar-device">
        <div className="sidebar-device-name">
          <span className="status-dot ok" /> {device.name}
        </div>
        <div className="sidebar-device-sub">
          Serial: {device?.serial || device?.id || 'Connected'}
        </div>
      </div>

      {/* volume shortcuts */}
      <div className="sidebar-section-title">
        {device.name.toUpperCase()} VOLUMES
      </div>
      {folders.map((folder) => (
        <div
          key={folder.name}
          className={`sidebar-item ${activeFolder === folder.name ? 'active' : ''}`}
          onClick={() => onFolderClick(folder.name)}
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

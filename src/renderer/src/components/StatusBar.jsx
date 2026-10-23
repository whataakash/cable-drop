// StatusBar — bottom bar showing ADB daemon info and transport stats

function StatusBar({ daemonVersion, deviceCount }) {
  return (
    <div className="statusbar">
      <div className="statusbar-item">
        <span className="status-dot ok" />
        ADB Daemon {daemonVersion}
      </div>
      <div className="statusbar-item">
        {deviceCount > 0 ? '⚡ USB Connected' : 'Waiting for USB device'}
      </div>
      <div className="statusbar-right">
        {deviceCount} {deviceCount === 1 ? 'device' : 'devices'} active
      </div>
    </div>
  )
}

export default StatusBar

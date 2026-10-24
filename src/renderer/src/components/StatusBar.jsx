// StatusBar — bottom bar showing ADB daemon info and transport stats

function StatusBar({ daemonVersion, deviceCount }) {
  return (
    <div className="statusbar">
      <div className="statusbar-left">
        <div className="statusbar-item">
          <span className="status-dot ok" />
          {/* ADB Daemon {daemonVersion} */}
          ADB Ready
        </div>
        <div className="statusbar-item">
          {deviceCount > 0 ? '⚡️ USB Connected' : 'Waiting for your Android'}
        </div>
      </div>

      <div className="statusbar-center">
        Made with ♥ by @ whataakash
      </div>

      <div className="statusbar-right">
        {deviceCount === 0 ? 'No devices connected' : `${deviceCount} ${deviceCount === 1 ? 'device' : 'devices'} active`}
      </div>
    </div>
  )
}

export default StatusBar

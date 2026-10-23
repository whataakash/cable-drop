// Titlebar — macOS minimizer bar on top with app header below
// Left: Cable Drop logo + typed text + Devices/Files tabs
// Center: live connection status pill

import logo from '../assets/logo.png'
import { sendLightIcon, receiveIcon } from '../assets/icons'

function Titlebar({
  device,
  currentPage,
  onNavigate,
  onSendFiles,
  onReceiveFiles,
  selectedCount = 0
}) {
  const deviceName = device?.name || device?.model || 'Android Device'

  return (
    <header className="app-header">
      {/* 1. macOS traffic light / window drag bar */}
      <div className="mac-window-bar" />

      {/* 2. Main titlebar placed below the minimizer bar */}
      <div className="titlebar">
        {/* Left-aligned cluster: Brand logo + typed title + nav tabs */}
        <div className="titlebar-left">
          <div className="titlebar-brand">
            <img src={logo} alt="Cable Drop" className="titlebar-brand-icon" />
            <span className="titlebar-brand-title">Cable Drop</span>
          </div>

          <div className="titlebar-nav">
            <button
              className={`titlebar-tab ${currentPage === 'devices' ? 'active' : ''}`}
              onClick={() => onNavigate('devices')}
            >
              Devices
            </button>
            {device && (
              <button
                className={`titlebar-tab ${currentPage === 'files' ? 'active' : ''}`}
                onClick={() => onNavigate('files')}
              >
                Files
              </button>
            )}
          </div>
        </div>

        {/* Center-aligned status pill */}
        <div className="titlebar-status">
          {device ? (
            <>
              <span className="status-dot ok" />
              <span>connected to {deviceName}</span>
            </>
          ) : (
            <>
              <span className="status-dot active" />
              <span>Searching for USB devices...</span>
            </>
          )}
        </div>

        {/* Right-aligned action buttons */}
        <div className="titlebar-actions">
          <button
            className="btn btn-primary"
            onClick={onSendFiles}
            disabled={!device}
          >
            <img src={sendLightIcon} alt="" className="btn-icon" />
            Send to Phone
          </button>
          <button
            className="btn btn-secondary"
            onClick={onReceiveFiles}
            disabled={!device}
          >
            <img src={receiveIcon} alt="" className="btn-icon" />
            Save to Mac
          </button>
        </div>
      </div>
    </header>
  )
}

export default Titlebar

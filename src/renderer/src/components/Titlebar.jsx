// Titlebar — macOS-style top bar with nav tabs
// Shows app name, navigation, and status indicator

import logo from '../assets/logo.png'

function Titlebar({ currentPage, onNavigate }) {
  const tabs = ['Devices', 'Transfers', 'Logs']

  return (
    <div className="titlebar">
      {/* space for macOS traffic light buttons (close/minimize/maximize) */}
      <div className="titlebar-traffic-spacer" />

      <div className="titlebar-brand">
        <img src={logo} alt="CableDrop" className="titlebar-brand-icon" />
        <span>CableDrop</span>
      </div>

      {/* nav tabs */}
      <div className="titlebar-nav">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`titlebar-tab ${currentPage === tab.toLowerCase() ? 'active' : ''}`}
            onClick={() => onNavigate(tab.toLowerCase())}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="titlebar-spacer" />

      {/* center status pill */}
      <div className="titlebar-status">
        <span className="status-dot active" />
        Searching for USB devices...
      </div>

      <div className="titlebar-spacer" />

      {/* right-side buttons */}
      <div className="titlebar-right">
        <button className="btn btn-secondary">⌨ Terminal</button>
      </div>
    </div>
  )
}

export default Titlebar

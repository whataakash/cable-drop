// TransferLogs — tracks live session file transfers between macOS and Android
// Displays transfer direction, file names, destination path, speed/stats, and status
// Resets automatically when the app is re-launched

import { useState } from 'react'
import { sendLightIcon, receiveLightIcon } from '../assets/icons'

function formatTimestamp(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

// Break the line after the file path in ADB stats output
function formatStatsText(statsText) {
  if (!statsText) return null

  const colonIndex = statsText.indexOf(': ')
  if (colonIndex !== -1 && (statsText.startsWith('/') || statsText.startsWith('~') || statsText.includes('/'))) {
    const filePath = statsText.slice(0, colonIndex + 1)
    const rest = statsText.slice(colonIndex + 2)
    return (
      <span className="logs-stats-text">
        <span className="logs-stats-path">{filePath}</span>
        <br />
        <span className="logs-stats-details">{rest}</span>
      </span>
    )
  }

  return <span className="logs-stats-text">{statsText}</span>
}

function TransferLogs({ logs = [], onClear }) {
  const [filter, setFilter] = useState('all') // 'all' | 'send' | 'receive' | 'failed'

  const sentCount = logs.filter((l) => l.type === 'send').length
  const receivedCount = logs.filter((l) => l.type === 'receive').length
  const failedCount = logs.filter((l) => l.status === 'failed').length
  const completedCount = logs.filter((l) => l.status === 'completed').length

  const filteredLogs = logs.filter((l) => {
    if (filter === 'send') return l.type === 'send'
    if (filter === 'receive') return l.type === 'receive'
    if (filter === 'failed') return l.status === 'failed'
    return true
  })

  return (
    <div className="transfer-logs">
      {/* Top Header & Session Metrics */}
      <div className="logs-header">
        <div className="logs-header-left">
          <div className="logs-title-row">
            <h2>Transfer Activity Logs</h2>
            <span className="logs-badge">{logs.length} session items</span>
          </div>
          <p className="logs-subtitle">
            Keeps a log of file transfers between your Mac and Android. Automatically resets on app restart.
          </p>
        </div>

        {logs.length > 0 && (
          <button
            type="button"
            className="btn btn-secondary logs-clear-btn"
            onClick={onClear}
            title="Clear all session logs"
          >
            Clear Session
          </button>
        )}
      </div>

      {/* Metrics Bar */}
      <div className="logs-metrics-bar">
        <div className="logs-metric-card">
          <span className="logs-metric-label">Total Transferred</span>
          <span className="logs-metric-val">{logs.length}</span>
        </div>
        <div className="logs-metric-card">
          <span className="logs-metric-label">Sent to Android</span>
          <span className="logs-metric-val sent">↑ {sentCount}</span>
        </div>
        <div className="logs-metric-card">
          <span className="logs-metric-label">Saved to Mac</span>
          <span className="logs-metric-val received">↓ {receivedCount}</span>
        </div>
        <div className="logs-metric-card">
          <span className="logs-metric-label">Success Rate</span>
          <span className="logs-metric-val success">
            {logs.length > 0 ? `${Math.round((completedCount / logs.length) * 100)}%` : '100%'}
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="logs-filter-bar">
        <div className="logs-filters">
          <button
            type="button"
            className={`logs-filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Transfers ({logs.length})
          </button>
          <button
            type="button"
            className={`logs-filter-btn ${filter === 'send' ? 'active' : ''}`}
            onClick={() => setFilter('send')}
          >
            Sent ({sentCount})
          </button>
          <button
            type="button"
            className={`logs-filter-btn pull-btn ${filter === 'receive' ? 'active' : ''}`}
            onClick={() => setFilter('receive')}
          >
            Saved to Mac ({receivedCount})
          </button>
          {failedCount > 0 && (
            <button
              type="button"
              className={`logs-filter-btn failed ${filter === 'failed' ? 'active' : ''}`}
              onClick={() => setFilter('failed')}
            >
              Failed ({failedCount})
            </button>
          )}
        </div>
      </div>

      {/* Main Logs Table or Empty State */}
      <div className="logs-content">
        {filteredLogs.length === 0 ? (
          <div className="logs-empty">
            <div className="logs-empty-icon">⇄</div>
            <h3>No file transfers recorded yet</h3>
            <p>
              When you push files to your phone or pull them to your Mac, detailed records,
              destination paths, and transfer stats will appear here live.
            </p>
          </div>
        ) : (
          <div className="logs-table-container">
            <table className="logs-table">
              <thead>
                <tr>
                  <th style={{ width: '110px' }}>Time</th>
                  <th style={{ width: '130px' }}>Direction</th>
                  <th>File / Item</th>
                  <th>Destination</th>
                  <th style={{ width: '130px' }}>Device</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const isSend = log.type === 'send'
                  const isDone = log.status === 'completed'
                  const isFail = log.status === 'failed'

                  return (
                    <tr key={log.id} className={`logs-row ${log.status}`}>
                      <td className="logs-time-cell">
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td>
                        <span className={`logs-type-tag ${isSend ? 'send' : 'receive'}`}>
                          <img
                            src={isSend ? sendLightIcon : receiveLightIcon}
                            alt=""
                            className="logs-type-icon"
                          />
                          {isSend ? 'Push (Mac → Phone)' : 'Pull (Phone → Mac)'}
                        </span>
                      </td>
                      <td className="logs-file-cell">
                        <span className="logs-filename" title={log.fileName}>
                          {log.fileName}
                        </span>
                        {log.statsText && formatStatsText(log.statsText)}
                        {log.error && (
                          <span className="logs-error-text">{log.error}</span>
                        )}
                      </td>
                      <td className="logs-path-cell" title={log.targetPath}>
                        <code>{log.targetPath || '—'}</code>
                      </td>
                      <td className="logs-device-cell">
                        {log.deviceName || 'Android Device'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span
                          className={`logs-status-pill ${
                            isDone ? 'done' : isFail ? 'fail' : 'pending'
                          }`}
                        >
                          {isDone ? '✓ Completed' : isFail ? '✕ Failed' : '⋯ In Progress'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default TransferLogs
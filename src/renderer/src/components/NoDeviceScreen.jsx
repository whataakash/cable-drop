// NoDeviceScreen — shown when no authorized Android device is ready
// Displays 3 setup instruction cards and shows unauthorized banner if a device is plugged in

function NoDeviceScreen({ devices = [], onRescan }) {
  const unauthorizedDevice = devices.find((d) => d.state === 'unauthorized')

  return (
    <div className="no-device">
      {/* connection diagram */}
      <div className="welcome-diagram">
        <div className="welcome-diagram-node">
          <div className="welcome-diagram-node-icon">🖥</div>
          <span className="text-sm text-muted">macOS WORKSTATION</span>
        </div>
        <div className="welcome-diagram-line">
          <hr />
          USB
        </div>
        <div className="welcome-diagram-node">
          <div className="welcome-diagram-node-icon">📱</div>
          <span className="text-sm text-muted">ANDROID TARGET</span>
        </div>
      </div>

      <div className="badge">
        <span className="status-dot active" />
        DAEMON LISTENING ON PORT 5037
      </div>

      <h2>
        {unauthorizedDevice
          ? 'Device connected but unauthorized'
          : 'No Android device connected'}
      </h2>
      <p>
        {unauthorizedDevice
          ? 'Unlock your Android device and tap "Allow USB debugging" on the screen prompt.'
          : 'Attach an Android smartphone or tablet via a USB data cable to get started.'}
      </p>

      {/* unauthorized device banner — appears if a device is plugged in but unauthorized */}
      {unauthorizedDevice && (
        <div className="unauth-banner">
          <span style={{ fontSize: '24px' }}>📱</span>
          <div className="unauth-banner-text">
            <h4>
              Device detected but unauthorized:{' '}
              <span className="badge warn">
                <span className="status-dot warn" />
                {unauthorizedDevice.serial || unauthorizedDevice.id} (Unauthorized)
              </span>
            </h4>
            <p>
              Check your phone display now. Tap <strong>&quot;Allow USB debugging&quot;</strong> when
              prompted with the host RSA key to establish full access.
            </p>
          </div>
          <button
            className="btn btn-secondary"
            onClick={onRescan}
            style={{ marginLeft: 'auto', flexShrink: 0 }}
          >
            📱 Re-scan Authorization
          </button>
        </div>
      )}

      {/* 3 setup instruction cards */}
      <div className="setup-steps">
        <div className="setup-card">
          <div className="setup-card-header">
            <span className="setup-card-number">01</span>
            <span>🔌</span>
          </div>
          <h3>Connect via USB</h3>
          <p>
            Plug your Android phone directly into your Mac using a certified,
            data-capable USB cable. Avoid charge-only cables.
          </p>
          <div className="setup-card-footer">Data Cable Required</div>
        </div>

        <div className="setup-card">
          <div className="setup-card-header">
            <span className="setup-card-number">02</span>
            <span>📱</span>
          </div>
          <h3>Enable USB Debugging</h3>
          <p>
            On Android: go to <strong>Settings &gt; Developer options</strong> and
            toggle <strong>USB debugging</strong> to ON.
          </p>
          <div className="setup-card-footer">Tap Build Number 7x</div>
        </div>

        <div className="setup-card">
          <div className="setup-card-header">
            <span className="setup-card-number">03</span>
            <span>✅</span>
          </div>
          <h3>Authorize Mac Connection</h3>
          <p>
            Unlock your phone screen and confirm the prompt. Check
            &quot;Always allow from this computer&quot; for persistent access.
          </p>
          <div className="setup-card-footer">RSA Key Exchange</div>
        </div>
      </div>

      {/* action buttons */}
      <div className="no-device-actions">
        <button className="btn btn-primary" onClick={onRescan}>
          ↻ Check connection
        </button>
      </div>
    </div>
  )
}

export default NoDeviceScreen

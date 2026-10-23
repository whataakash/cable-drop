// WelcomeScreen — first thing the user sees while ADB daemon initializes
// Shows the brand hero, macOS<->Android diagram, and init checklist

import { useState, useEffect } from 'react'
import logo from '../assets/logo.png'
import { macIcon, mobileIcon } from '../assets/icons'

function WelcomeScreen({ onInitComplete }) {
  const [progress, setProgress] = useState(0)

  // fake the init progress for now — real ADB init will replace this
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer)
          // tell the parent we're done after a short delay
          setTimeout(() => onInitComplete(), 500)
          return 100
        }
        return prev + 2
      })
    }, 60)
    return () => clearInterval(timer)
  }, [onInitComplete])

  return (
    <div className="welcome">
      {/* app logo */}
      <img src={logo} alt="CableDrop" style={{ width: 80, height: 80, borderRadius: 16 }} />

      {/* hero text */}
      <h1>Your files. Between devices. Effortlessly.</h1>
      <p>Move files between your Mac and Android, without the terminal.</p>

      {/* connection diagram: Mac <----> Android */}
      <div className="welcome-diagram">
        <div className="welcome-diagram-node">
          <div className="welcome-diagram-node-icon">
            <img src={macIcon} alt="" style={{ width: 32, height: 32 }} />
          </div>
          <strong>macOS Host</strong>
          <div className="text-muted text-sm">darwin-arm64</div>
        </div>
        <div className="welcome-diagram-line">
          <hr />
          ⇄ libusb transport pipe
        </div>
        <div className="welcome-diagram-node">
          <div className="welcome-diagram-node-icon">
            <img src={mobileIcon} alt="" style={{ width: 32, height: 32 }} />
          </div>
          <strong>Android Target</strong>
          <div className="text-muted text-sm">ADB Polling...</div>
        </div>
      </div>

      {/* init steps checklist */}
      <div className="init-steps">
        <div className="init-step">
          <div className="init-step-left">
            <span className="status-dot ok" />
            Starting ADB daemon on Mac...
          </div>
          <span className="init-step-result">OK (0.12s)</span>
        </div>
        <div className="init-step">
          <div className="init-step-left">
            <span className="status-dot ok" />
            Scanning USB buses on Mac (MTP & ADB filter)...
          </div>
          <span className="init-step-result">OK (0.34s)</span>
        </div>
        <div className="init-step">
          <div className="init-step-left">
            <span className={`status-dot ${progress >= 100 ? 'ok' : 'off'}`} />
            Ready: Handshake initialized with device pipeline
          </div>
          <span className="init-step-result">PORT 5037</span>
        </div>
      </div>

      {/* progress bar */}
      <div className="init-progress">
        <div className="init-progress-label">
          <span>Initializing bridge engine v1.4.2...</span>
          <span>{progress}%</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <p className="text-muted text-sm">
        Automatically detecting connected devices · Press ⌘0 for offline mode
      </p>
    </div>
  )
}

export default WelcomeScreen

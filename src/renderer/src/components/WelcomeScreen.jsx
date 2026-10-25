// WelcomeScreen — first thing the user sees while ADB daemon initializes
// Shows the brand hero, macOS<->Android diagram, and init checklist

import { useState, useEffect, useRef } from 'react'
import logo from '../assets/logo.png'
import { macIcon, mobileIcon } from '../assets/icons'

function WelcomeScreen({ onInitComplete }) {
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const onCompleteRef = useRef(onInitComplete)
  onCompleteRef.current = onInitComplete

  const isPausedRef = useRef(isPaused)
  isPausedRef.current = isPaused

  // Initialization progress animation with pause/resume support
  useEffect(() => {
    if (isPaused) return

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer)
          if (!isPausedRef.current) {
            setTimeout(() => {
              if (!isPausedRef.current) {
                onCompleteRef.current?.()
              }
            }, 200)
          }
          return 100
        }
        return prev + 1
      })
    }, 28)

    return () => clearInterval(timer)
  }, [isPaused])

  // Handle manual proceed/continue
  function handleContinue() {
    onCompleteRef.current?.()
  }

  // Toggle pause/resume
  function handleTogglePause() {
    setIsPaused((prev) => !prev)
  }

  const step1Done = progress >= 30
  const step2Done = progress >= 70
  const step3Done = progress >= 100

  function renderStepIcon(isDone, isActive) {
    if (isDone) {
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="step-svg">
          <circle cx="9" cy="9" r="8" stroke="#45C99A" strokeWidth="1.6" />
          <path d="M5.5 9.2L7.8 11.5L12.5 6.8" stroke="#45C99A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    }
    if (isActive) {
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="step-svg">
          <circle cx="9" cy="9" r="8" stroke="#947CFF" strokeWidth="1.6" />
          <circle cx="9" cy="9" r="3.5" fill="#947CFF" />
        </svg>
      )
    }
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="step-svg">
        <circle cx="9" cy="9" r="8" stroke="var(--border-main)" strokeWidth="1.6" />
      </svg>
    )
  }

  return (
    <div className="welcome">
      {/* Top draggable region for macOS window controls */}
      <div className="welcome-drag-bar" />

      {/* app logo and title */}
      <div className="welcome-brand">
        <img src={logo} alt="CableDrop" className="welcome-logo" />
        <span className="welcome-brand-title">CABLE DROP</span>
      </div>

      {/* hero text */}
      <div className="welcome-tagline-badge">SECURE * FAST * OFFLINE</div>
      <p className="welcome-description">Your Android. Your Mac. One cable.</p>

      {/* connection diagram: Mac <----> Android */}
      <div className="welcome-diagram">
        <div className="welcome-diagram-node">
          <div className="welcome-diagram-node-icon">
            <img src={macIcon} alt="macOS" />
          </div>
          <strong className="welcome-node-label">macOS</strong>
        </div>

        <div className="welcome-diagram-line">
          <div className="welcome-wire-line" />
          <div className="welcome-chip">USB DEBUGGING & A LITTLE BIT OF MAGIC</div>
        </div>

        <div className="welcome-diagram-node">
          <div className="welcome-diagram-node-icon">
            <img src={mobileIcon} alt="Android" />
          </div>
          <strong className="welcome-node-label">Android</strong>
        </div>
      </div>

      {/* init steps checklist */}
      <div className="init-steps">
        <div className="init-step">
          <div className="init-step-left">
            {renderStepIcon(step1Done, !step1Done)}
            <div className="init-step-text">
              <span className="init-step-title">Waking up the Daemon...</span>
              <span className="init-step-subtitle">Getting the good stuff ready</span>
            </div>
          </div>
          <span className={`init-step-badge ${step1Done ? 'done' : 'pending'}`}>
            {step1Done ? 'DONE ✓' : 'WAITING'}
          </span>
        </div>

        <div className="init-step">
          <div className="init-step-left">
            {renderStepIcon(step2Done, step1Done && !step2Done)}
            <div className="init-step-text">
              <span className="init-step-title">Looking for your Android...</span>
              <span className="init-step-subtitle">Checking if it's awake</span>
            </div>
          </div>
          <span className={`init-step-badge ${step2Done ? 'done' : 'pending'}`}>
            {step2Done ? 'DONE ✓' : 'WAITING'}
          </span>
        </div>

        <div className="init-step">
          <div className="init-step-left">
            {renderStepIcon(step3Done, step2Done && !step3Done)}
            <div className="init-step-text">
              <span className="init-step-title">Preparing for Launch 🚀</span>
              <span className="init-step-subtitle">One last vibe check</span>
            </div>
          </div>
          <span className={`init-step-badge ${step3Done ? 'done' : 'pending'}`}>
            {step3Done ? 'DONE ✓' : 'PENDING'}
          </span>
        </div>
      </div>

      {/* progress bar & controls */}
      <div className="init-progress">
        <div className="init-progress-label">
          <span className="init-progress-title">Setup status</span>
          <span className="init-progress-percent">{progress}%</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Action buttons: Let's get this show on the road + Pause a bit */}
        <div className="welcome-actions">
          <button
            type="button"
            className="btn btn-primary welcome-road-btn"
            onClick={handleContinue}
          >
            ▶ Let&apos;s roll
          </button>

          <button
            type="button"
            className="welcome-skip-btn"
            onClick={handleTogglePause}
            title={isPaused ? "Resume initialization" : "Pause initialization to look around"}
          >
            {isPaused ? 'Resume ▶' : 'Pause a bit ⏸'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default WelcomeScreen

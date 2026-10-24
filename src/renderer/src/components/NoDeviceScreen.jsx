// NoDeviceScreen — shown when no authorized Android device is ready
// Features a high-fidelity vector schematic matching the wireframe architecture:
// macOS Workstation <--- [USB 3.2] ---> Android Target + Daemon status badge

import { mobileIcon } from '../assets/icons'
import { adbReprompt } from '../adb'
// import {logo} from '../assets/logo.png'
function NoDeviceScreen({ devices = [], onRescan }) {
  const unauthorizedDevice = devices.find((d) => d.state === 'unauthorized')

  return (
    <div className="no-device">
      {/* Wireframe Hero: macOS Workstation, USB 3.2 Cable, and Android Target */}
      <div className="no-device-hero">
        <svg
          className="schematic-diagram"
          viewBox="0 0 560 155"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Connecting Cable: curved dashed line flowing from Mac to USB chip to Phone */}
          <path
            className="schematic-cable"
            d="M 188 113 C 235 113, 252 58, 280 58"
            stroke="var(--violet)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            className="schematic-cable"
            d="M 326 58 C 354 58, 375 113, 412 113"
            stroke="var(--violet)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          {/* USB Chip floating in center of cable */}
          <g>
            <rect
              x="250"
              y="46"
              width="100"
              height="24"
              rx="6"
              fill="var(--bg-card)"
              stroke="var(--border-main)"
              strokeWidth="1.2"
            />
            <text
              x="303"
              y="62"
              textAnchor="middle"
              fontFamily="'Space Mono', monospace"
              fontSize="10"
              fontWeight="700"
              letterSpacing="0.08em"
              fill="var(--violet)"
            >
              CABLE DROP
            </text>
          </g>

          {/* Left: macOS Workstation */}
          <g>
            {/* Screen outer frame */}
            <rect
              x="46"
              y="18"
              width="136"
              height="92"
              rx="7"
              fill="var(--bg-card)"
              stroke="var(--border-main)"
              strokeWidth="1.5"
            />
            {/* Screen bezel & inner viewport */}
            <rect
              x="53"
              y="25"
              width="122"
              height="78"
              rx="4"
              fill="var(--bg-base)"
              stroke="var(--border-subtle)"
              strokeWidth="1"
            />
            {/* Window titlebar traffic lights */}
            <circle cx="61" cy="33" r="2.2" fill="#FF5F56" />
            <circle cx="68" cy="33" r="2.2" fill="#FFBD2E" />
            <circle cx="75" cy="33" r="2.2" fill="#27C93F" />
            {/* Window divider */}
            <line
              x1="53"
              y1="39"
              x2="175"
              y2="39"
              stroke="var(--border-subtle)"
              strokeWidth="0.8"
            />
            {/* Window wireframe components */}
            {/* Left sidebar block */}
            <rect
              x="58"
              y="44"
              width="24"
              height="53"
              rx="2"
              fill="none"
              stroke="var(--border-main)"
              strokeWidth="1"
            />
            {/* Top-left card */}
            <rect
              x="87"
              y="44"
              width="38"
              height="23"
              rx="2"
              fill="none"
              stroke="var(--border-main)"
              strokeWidth="1"
            />
            {/* Top-right card */}
            <rect
              x="130"
              y="44"
              width="40"
              height="23"
              rx="2"
              fill="none"
              stroke="var(--border-main)"
              strokeWidth="1"
            />
            {/* Bottom wide card */}
            <rect
              x="87"
              y="72"
              width="83"
              height="25"
              rx="2"
              fill="none"
              stroke="var(--border-main)"
              strokeWidth="1"
            />
            {/* Laptop base keyboard deck */}
            <rect
              x="36"
              y="110"
              width="156"
              height="6.5"
              rx="3"
              fill="var(--bg-surface-3)"
              stroke="var(--border-main)"
              strokeWidth="1.2"
            />
            {/* Notch */}
            <path
              d="M 104 110 L 124 110 L 122 113 L 106 113 Z"
              fill="var(--bg-base)"
            />
            {/* Workstation label */}
            <text
              x="114"
              y="138"
              textAnchor="middle"
              fontFamily="'Space Mono', monospace"
              fontSize="10.5"
              letterSpacing="0.1em"
              fill="var(--text-muted)"
            >
              MACBOOK
            </text>
          </g>

          {/* Right: Android Target */}
          <g>
            {/* Phone outer chassis */}
            <rect
              x="412"
              y="12"
              width="74"
              height="110"
              rx="15"
              fill="var(--bg-card)"
              stroke="var(--border-main)"
              strokeWidth="1.5"
            />
            {/* Screen bezel */}
            <rect
              x="418"
              y="18"
              width="62"
              height="98"
              rx="10"
              fill="var(--bg-base)"
              stroke="var(--border-subtle)"
              strokeWidth="1"
            />
            {/* Punch-hole camera */}
            <circle cx="449" cy="25" r="2.2" fill="var(--border-main)" />
            {/* Dashed wireframe prompt card */}
            <rect
              x="426"
              y="52"
              width="46"
              height="28"
              rx="6"
              fill="none"
              stroke="var(--violet)"
              strokeWidth="1.2"
              strokeDasharray="3 3"
            />
            {/* Prompt bar line */}
            <line
              x1="433"
              y1="66"
              x2="465"
              y2="66"
              stroke="var(--violet)"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            {/* Target label */}
            <text
              x="449"
              y="138"
              textAnchor="middle"
              fontFamily="'Space Mono', monospace"
              fontSize="10.5"
              letterSpacing="0.1em"
              fill="var(--text-muted)"
            >
              ANDROID
            </text>
          </g>
        </svg>

        {/* Daemon listening pill */}
        <div className="daemon-pill">
          <span className="daemon-dot" />
          <span className="daemon-pill-text">Ready to Connect</span>
        </div>

        {/* Main headings matching wireframe text */}
        <div className="no-device-info">
          <h2 className="no-device-title">
            {unauthorizedDevice
              ? 'Device connected but unauthorized'
              : 'No Android device connected'}
          </h2>
          <p className="no-device-description">
            {unauthorizedDevice
              ? 'Unlock your Android device and tap "Allow USB debugging" on the screen prompt.'
              : 'Perhaps, Your phone is playing hide-and-seek.'}
          </p>
        </div>
      </div>

      {/* Unauthorized device banner — appears if a device is plugged in but unauthorized */}
      {unauthorizedDevice && (
        <div className="unauth-banner">
          <img src={mobileIcon} alt="" style={{ width: 28, height: 28 }} />
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
            onClick={async () => {
              await adbReprompt()
              if (onRescan) onRescan()
            }}
            style={{ marginLeft: 'auto', flexShrink: 0 }}
          >
            <img src={mobileIcon} alt="" className="btn-icon" onClick={adbReprompt}/>
            Re-scan Authorization
          </button>
        </div>
      )}

      {/* 3 setup instruction cards */}
      <div className="setup-steps">
        <div className="setup-card">
          <div className="setup-card-header">
            <span className="setup-card-number">01</span>
            <span>📱</span>
          </div>
          <h3>Connect via USB</h3>
          <p>
            Plug your Android directly into your Mac using a
            USB cable. Avoid charge-only cables.
          </p>
          <div className="setup-card-footer">Data Cable Required</div>
        </div>

        <div className="setup-card">
          <div className="setup-card-header">
            <span className="setup-card-number">02</span>
            <img src={mobileIcon} alt="" style={{ width: 16, height: 16 }} />
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

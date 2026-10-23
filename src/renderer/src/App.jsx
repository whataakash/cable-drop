// App — main shell that manages screens and live ADB device state
// Uses real device detection from the bundled ADB binary

import { useState, useEffect } from 'react'

import Titlebar from './components/Titlebar'
import Sidebar from './components/Sidebar'
import StatusBar from './components/StatusBar'
import WelcomeScreen from './components/WelcomeScreen'
import NoDeviceScreen from './components/NoDeviceScreen'
import ConnectedDevices from './components/ConnectedDevices'
import FileBrowser from './components/FileBrowser'
import SendFilesModal from './components/SendFilesModal'
import ReceiveFilesModal from './components/ReceiveFilesModal'
import logo from './assets/logo.png'
import adb from './adb'

function App() {
  // Launch animation state: plays smooth logo animation on open
  const [isLaunching, setIsLaunching] = useState(true)
  const [splashFading, setSplashFading] = useState(false)

  // Screen state: 'no-device' | 'devices' | 'files'
  const [screen, setScreen] = useState('no-device')

  // Navigation tab state
  const [activeTab, setActiveTab] = useState('devices')

  // Selected folder in sidebar
  const [activeFolder, setActiveFolder] = useState('Internal Storage')

  // Modals
  const [showSendModal, setShowSendModal] = useState(false)
  const [showReceiveModal, setShowReceiveModal] = useState(false)

  // Real ADB state
  const [devices, setDevices] = useState([])
  const [daemonVersion, setDaemonVersion] = useState('1.0.41')
  const [selectedDevice, setSelectedDevice] = useState(null)

  // Fetch connected devices from bundled ADB
  async function refreshDevices() {
    try {
      const list = await adb.getDevices()
      setDevices(list)

      // Set active device
      const authorized = list.find((d) => d.state === 'device')
      if (authorized) {
        setSelectedDevice((prev) => (prev ? list.find((d) => d.id === prev.id) || authorized : authorized))
      } else if (list.length > 0) {
        setSelectedDevice(list[0])
      } else {
        setSelectedDevice(null)
      }

      return list
    } catch (err) {
      console.error('Failed to query ADB devices:', err)
      return []
    }
  }

  // Launch animation: brief display then smooth transition to main UI
  useEffect(() => {
    const fadeTimer = setTimeout(() => setSplashFading(true), 1200)
    const unmountTimer = setTimeout(() => setIsLaunching(false), 1600)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(unmountTimer)
    }
  }, [])

  // Load daemon info and poll devices in background
  useEffect(() => {
    adb.getVersion()
      .then((ver) => setDaemonVersion(ver))
      .catch((err) => console.warn('Could not read ADB version:', err))

    refreshDevices()

    // Poll every 2.5 seconds to detect device plug/unplug automatically
    const timer = setInterval(() => {
      refreshDevices()
    }, 2500)

    return () => clearInterval(timer)
  }, [])

  // Sync screen with real connection state
  useEffect(() => {
    const hasAuthorizedDevice = devices.some((d) => d.state === 'device')

    if (screen === 'devices' && !hasAuthorizedDevice) {
      setScreen('no-device')
    } else if (screen === 'no-device' && hasAuthorizedDevice) {
      setScreen('devices')
    }
  }, [devices, screen])

  const hasAuthorized = devices.some((d) => d.state === 'device')
  const showSidebar = hasAuthorized && (screen === 'devices' || screen === 'files')
  const activeDevice = selectedDevice || devices.find((d) => d.state === 'device') || null

  // Render main screen area
  function renderContent() {
    switch (screen) {
      case 'welcome':
        return <WelcomeScreen onInitComplete={() => setScreen('devices')} />
      case 'no-device':
        return <NoDeviceScreen devices={devices} onRescan={refreshDevices} />
      case 'devices':
        return (
          <ConnectedDevices
            devices={devices}
            onRescan={refreshDevices}
            onBrowseFiles={(dev) => {
              setSelectedDevice(dev)
              setScreen('files')
            }}
          />
        )
      case 'files':
        return (
          <FileBrowser
            device={activeDevice}
            onSendFiles={() => setShowSendModal(true)}
            onReceiveFiles={() => setShowReceiveModal(true)}
          />
        )
      default:
        return <NoDeviceScreen devices={devices} onRescan={refreshDevices} />
    }
  }

  // Handle top bar navigation
  function handleNavigate(tab) {
    setActiveTab(tab)
    if (tab === 'devices') {
      const hasAuth = devices.some((d) => d.state === 'device')
      setScreen(hasAuth ? 'devices' : 'no-device')
    }
  }

  return (
    <div className="app">
      {/* Launch animation splash overlay */}
      {isLaunching && (
        <div className={`launch-splash ${splashFading ? 'fade-out' : ''}`}>
          <img src={logo} alt="CableDrop" className="launch-splash-logo" />
        </div>
      )}

      <Titlebar currentPage={activeTab} onNavigate={handleNavigate} />

      <div className="app-body">
        {showSidebar && (
          <Sidebar
            device={activeDevice}
            activeFolder={activeFolder}
            onFolderClick={setActiveFolder}
          />
        )}

        <div className="main-content">{renderContent()}</div>
      </div>

      <StatusBar
        daemonVersion={daemonVersion}
        deviceCount={devices.filter((d) => d.state === 'device').length}
      />

      {showSendModal && <SendFilesModal onClose={() => setShowSendModal(false)} />}
      {showReceiveModal && <ReceiveFilesModal onClose={() => setShowReceiveModal(false)} />}
    </div>
  )
}

export default App

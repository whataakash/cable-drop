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

  // Selected folder path in file browser
  const [browserPath, setBrowserPath] = useState('/sdcard')

  // Detected storage volumes tracked individually per device: { [deviceId]: volumeList }
  const [deviceVolumes, setDeviceVolumes] = useState({})

  // Modals
  const [showSendModal, setShowSendModal] = useState(false)
  const [showReceiveModal, setShowReceiveModal] = useState(false)
  const [sendTargetDir, setSendTargetDir] = useState('/sdcard/Download')
  const [receiveFilesList, setReceiveFilesList] = useState([])
  const [selectedFiles, setSelectedFiles] = useState([])

  // Real ADB state
  const [devices, setDevices] = useState([])
  const [daemonVersion, setDaemonVersion] = useState('1.0.41')
  const [selectedDevice, setSelectedDevice] = useState(null)

  // Fetch connected devices from bundled ADB
  async function refreshDevices() {
    try {
      const list = await adb.getDevices()

      // Apply saved custom nicknames from localStorage
      const listWithNames = list.map((dev) => {
        const saved = localStorage.getItem('device_name_' + dev.id)
        return saved ? { ...dev, name: saved } : dev
      })

      setDevices(listWithNames)

      // Set active device
      const authorized = listWithNames.find((d) => d.state === 'device')
      if (authorized) {
        setSelectedDevice((prev) => (prev ? listWithNames.find((d) => d.id === prev.id) || authorized : authorized))

        // Query each authorized device's storage volumes individually
        listWithNames
          .filter((d) => d.state === 'device')
          .forEach((dev) => {
            adb.getStorageVolumes(dev.id)
              .then((vols) => {
                if (vols && vols.length > 0) {
                  setDeviceVolumes((prev) => ({ ...prev, [dev.id]: vols }))
                }
              })
              .catch(() => {})
          })
      } else {
        setSelectedDevice(null)
        setDeviceVolumes({})
        setScreen('no-device')
        setActiveTab('devices')
      }

      return listWithNames
    } catch (err) {
      console.error('Failed to query ADB devices:', err)
      setDevices([])
      setSelectedDevice(null)
      setDeviceVolumes({})
      setScreen('no-device')
      setActiveTab('devices')
      return []
    }
  }

  // Handle renaming a device and persisting it
  function handleRenameDevice(deviceId, newName) {
    const trimmed = newName.trim()
    if (trimmed) {
      localStorage.setItem('device_name_' + deviceId, trimmed)
    } else {
      localStorage.removeItem('device_name_' + deviceId)
    }

    setDevices((prev) =>
      prev.map((d) => (d.id === deviceId ? { ...d, name: trimmed || d.model || 'Android Device' } : d))
    )

    setSelectedDevice((prev) =>
      prev && prev.id === deviceId ? { ...prev, name: trimmed || prev.model || 'Android Device' } : prev
    )
  }

  // Switch the actively browsed device
  function handleSelectDevice(dev) {
    setSelectedDevice(dev)
    setBrowserPath('/sdcard')
    setSelectedFiles([])
  }

  // Launch animation: brief display then smooth transition to main UI
  useEffect(() => {
    const fadeTimer = setTimeout(() => setSplashFading(true), 1800)
    const unmountTimer = setTimeout(() => setIsLaunching(false), 2200)

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

    // Poll every 1 second to detect device plug/unplug immediately
    const timer = setInterval(() => {
      refreshDevices()
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Sync screen with real connection state
  useEffect(() => {
    const hasAuthorizedDevice = devices.some((d) => d.state === 'device')

    if (!hasAuthorizedDevice) {
      if (screen !== 'no-device') {
        setScreen('no-device')
        setActiveTab('devices')
      }
    } else if (screen === 'no-device' && hasAuthorizedDevice) {
      setScreen('devices')
      setActiveTab('devices')
    }
  }, [devices, screen])

  const authorizedDevices = devices.filter((d) => d.state === 'device')
  const activeDevice = selectedDevice || authorizedDevices[0] || null
  const hasAuthorized = authorizedDevices.length > 0
  const showSidebar = hasAuthorized && screen === 'files'

  const defaultVolumes = [
    { id: 'internal', name: 'Internal Storage', path: '/sdcard', type: 'internal', icon: '💾' }
  ]
  const currentVolumes = (activeDevice?.id && deviceVolumes[activeDevice.id]) || defaultVolumes

  // Query active device storage volumes when selected device changes
  useEffect(() => {
    if (activeDevice?.id && activeDevice.state === 'device') {
      adb.getStorageVolumes(activeDevice.id)
        .then((vols) => {
          if (vols && vols.length > 0) {
            setDeviceVolumes((prev) => ({ ...prev, [activeDevice.id]: vols }))
          }
        })
        .catch((err) => {
          console.warn('Could not query storage volumes:', err)
        })
    }
  }, [activeDevice?.id, activeDevice?.state])

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
            onRenameDevice={handleRenameDevice}
            onBrowseFiles={(dev) => {
              handleSelectDevice(dev)
              setActiveTab('files')
              setScreen('files')
            }}
          />
        )
      case 'files':
        return (
          <FileBrowser
            device={activeDevice}
            devices={authorizedDevices}
            onSelectDevice={handleSelectDevice}
            initialPath={browserPath}
            onPathChange={(path) => setBrowserPath(path)}
            onSelectionChange={(items) => setSelectedFiles(items || [])}
            onReceiveFiles={handleReceiveFromTitlebar}
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
    } else if (tab === 'files') {
      const hasAuth = devices.some((d) => d.state === 'device')
      if (hasAuth) {
        setScreen('files')
      } else {
        setScreen('no-device')
        setActiveTab('devices')
      }
    }
  }

  // Send to phone from titlebar button
  function handleSendFromTitlebar() {
    setSendTargetDir(browserPath || '/sdcard/Download')
    setShowSendModal(true)
  }

  // Save files to Mac from titlebar button
  function handleReceiveFromTitlebar(items) {
    const toReceive = Array.isArray(items) && items.length > 0 ? items : selectedFiles
    setReceiveFilesList(toReceive || [])
    setShowReceiveModal(true)
  }

  return (
    <div className="app">
      {/* Launch animation splash overlay */}
      {isLaunching && (
        <div className={`launch-splash ${splashFading ? 'fade-out' : ''}`}>
          <img src={logo} alt="CableDrop" className="launch-splash-logo" />
          <span className="launch-splash-title">CABLE DROP</span>
          <div className="launch-splash-tagline">
            AirDrop, over a cable.
            <br />
            Secure. Fast. Offline.
          </div>
        </div>
      )}

      <Titlebar
        device={activeDevice}
        currentPage={activeTab}
        onNavigate={handleNavigate}
        onSendFiles={handleSendFromTitlebar}
        onReceiveFiles={handleReceiveFromTitlebar}
        selectedCount={selectedFiles.length}
      />

      <div className="app-body">
        {showSidebar && (
          <Sidebar
            volumes={currentVolumes}
            currentPath={browserPath}
            onSelectVolume={(path) => {
              setBrowserPath(path)
              setScreen('files')
              setActiveTab('files')
            }}
          />
        )}
        <div className="main-content">{renderContent()}</div>
      </div>

      <StatusBar
        daemonVersion={daemonVersion}
        deviceCount={authorizedDevices.length}
      />

      {showSendModal && (
        <SendFilesModal
          device={activeDevice}
          targetDirectory={sendTargetDir}
          onClose={() => setShowSendModal(false)}
        />
      )}
      {showReceiveModal && (
        <ReceiveFilesModal
          device={activeDevice}
          files={receiveFilesList}
          onClose={() => setShowReceiveModal(false)}
        />
      )}
    </div>
  )
}

export default App

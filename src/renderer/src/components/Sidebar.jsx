// Sidebar — displays detected storage options: Internal Storage, and SD Card if available

function Sidebar({ volumes = [], currentPath = '/sdcard', onSelectVolume }) {
  // Check if a storage volume is active based on the current path
  function isVolumeActive(vol) {
    if (vol.type === 'internal') {
      return currentPath.startsWith('/sdcard') || currentPath.startsWith('/storage/emulated')
    }
    return currentPath.startsWith(vol.path)
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-section-title">STORAGE</div>
      {volumes.map((vol) => {
        const active = isVolumeActive(vol)
        return (
          <div
            key={vol.path}
            className={`sidebar-item ${active ? 'active' : ''}`}
            onClick={() => onSelectVolume && onSelectVolume(vol.path)}
          >
            <span className="sidebar-item-icon">{vol.icon}</span>
            <span>{vol.name}</span>
          </div>
        )
      })}
    </aside>
  )
}

export default Sidebar

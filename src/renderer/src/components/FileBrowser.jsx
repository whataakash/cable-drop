// FileBrowser — table view of files/folders on the Android device
// Shows breadcrumb path, file table with checkboxes, and selection bar

import { useState } from 'react'

function FileBrowser({ onSendFiles, onReceiveFiles }) {
  // dummy file data — will be replaced with real ADB ls output
  const files = [
    { name: 'DCIM_Backups', type: 'Folder', date: 'Oct 24, 2024, 2:15 PM', size: '12 items', icon: '📁' },
    { name: 'Documents_Archive', type: 'Folder', date: 'Oct 20, 2024, 11:04 AM', size: '8 items', icon: '📁' },
    { name: 'Telegram', type: 'Folder', date: 'Yesterday at 6:42 PM', size: '45 items', icon: '📁' },
    { name: 'report_q3_final.pdf', type: 'PDF Document', date: 'Today at 10:14 AM', size: '4.2 MB', icon: '📄' },
    { name: 'vacation_tokyo_042.jpg', type: 'JPEG Image', date: 'Oct 22, 2024, 4:30 PM', size: '8.6 MB', icon: '🖼' },
    { name: 'screen_recording_demo.mp4', type: 'MP4 Video', date: 'Oct 21, 2024, 1:15 PM', size: '235.6 MB', icon: '🎬' },
    { name: 'notes_meeting_sync.txt', type: 'Plain Text', date: 'Oct 18, 2024, 9:02 AM', size: '14 KB', icon: '📝' },
    { name: 'sample_dataset.csv', type: 'CSV Document', date: 'Oct 15, 2024, 5:20 PM', size: '1.8 MB', icon: '📊' },
    { name: 'app_release_v2.apk', type: 'Android Package', date: 'Oct 10, 2024, 3:12 PM', size: '48.1 MB', icon: '📦' }
  ]

  // track which rows are selected by index
  const [selected, setSelected] = useState([])

  // toggle a single file's selection
  function toggleSelect(index) {
    setSelected((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    )
  }

  return (
    <div className="filebrowser">
      {/* top toolbar */}
      <div className="filebrowser-toolbar">
        <button className="btn btn-primary" onClick={onSendFiles}>📤 Send to Phone</button>
        <button className="btn btn-secondary" onClick={onReceiveFiles}>📥 Save to Mac</button>
        <button className="btn btn-secondary">📁 New Folder</button>
        <button className="btn btn-secondary">↻</button>
      </div>

      {/* breadcrumb path */}
      <div className="breadcrumb">
        <span className="breadcrumb-segment">↑ ..</span>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-segment">sdcard</span>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-segment current">Download</span>
      </div>

      {/* selection bar — only visible when files are selected */}
      {selected.length > 0 && (
        <div className="selection-bar">
          <div className="selection-bar-left">
            ✅ {selected.length} items selected
          </div>
          <div className="selection-bar-actions">
            <button className="btn btn-primary" onClick={onReceiveFiles}>📥 Save to Mac</button>
            <button className="btn btn-secondary" style={{ color: 'var(--status-error)' }}>🗑 Delete</button>
            <button className="btn btn-secondary">📤 Share</button>
            <button className="btn btn-secondary">Deselect</button>
          </div>
        </div>
      )}

      {/* file table */}
      <table className="file-table">
        <thead>
          <tr>
            <th style={{ width: 30 }}></th>{/* checkbox column */}
            <th>Name</th>
            <th>Date Modified</th>
            <th>Kind</th>
            <th>Size</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file, i) => (
            <tr
              key={file.name}
              className={selected.includes(i) ? 'selected' : ''}
              onClick={() => toggleSelect(i)}
            >
              <td>
                <span className={`checkbox ${selected.includes(i) ? 'checked' : ''}`}>
                  {selected.includes(i) ? '✓' : ''}
                </span>
              </td>
              <td>
                <div className="file-name-cell">
                  <span className="file-icon">{file.icon}</span>
                  {file.name}
                </div>
              </td>
              <td className="file-date">{file.date}</td>
              <td className="text-muted">{file.type}</td>
              <td className="file-size">{file.size}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default FileBrowser

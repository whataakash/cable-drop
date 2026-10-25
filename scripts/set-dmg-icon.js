const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const distDir = path.resolve(__dirname, '../dist')
const iconPath = path.resolve(__dirname, '../build/icon.icns')

if (!fs.existsSync(distDir) || !fs.existsSync(iconPath)) {
  process.exit(0)
}

const dmgFiles = fs.readdirSync(distDir).filter((file) => file.endsWith('.dmg'))

for (const dmg of dmgFiles) {
  const fullDmgPath = path.join(distDir, dmg)
  try {
    const script = `
use framework "Cocoa"
set targetPath to "${fullDmgPath}"
set iconPath to "${iconPath}"
set theImage to current application's NSImage's alloc()'s initWithContentsOfFile:iconPath
current application's NSWorkspace's sharedWorkspace()'s setIcon:theImage forFile:targetPath options:0
`
    execSync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, { stdio: 'ignore' })
    console.log(`✓ Attached custom icon to ${dmg}`)
  } catch (err) {
    console.warn(`Could not set icon for ${dmg}:`, err.message)
  }
}

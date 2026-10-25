// This script ensures the packaged .app has a clean, valid ad-hoc code signature
// before electron-builder packages it into a DMG.
// Without this, macOS Sequoia / Sonoma flags the unsigned app as "damaged" instead of allowing security bypass.

const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

exports.default = async function (context) {
  const appPath = context.appOutDir
  const appName = fs.readdirSync(appPath).find((file) => file.endsWith('.app'))
  if (!appName) return

  const fullAppPath = path.join(appPath, appName)
  console.log(`Applying clean ad-hoc codesign to ${fullAppPath}...`)

  try {
    execSync(`codesign --force --deep --sign - "${fullAppPath}"`, { stdio: 'inherit' })
    console.log('✓ Successfully applied clean ad-hoc signature.')
  } catch (err) {
    console.warn('Failed to apply ad-hoc signature:', err.message)
  }
}

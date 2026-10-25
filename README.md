# CableDrop

AirDrop's DevMode alternative over USB cable. A native macOS app for fast, reliable file transfers between Mac and Android using ADB under the hood.

Download the latest `.dmg` from [GitHub Releases](https://github.com/whataakash/cable-drop/releases).

---

## Features

- **Bi-directional Transfers**: Send files and folders from Mac to Android, or browse and download files from Android to Mac.
- **Fast & Wired**: Direct USB-C transfer via ADB. No Wi-Fi, local network pairing, or cloud uploads needed.
- **Built-in Android File Browser**: Explore internal storage and SD card directories directly from your Mac.
- **Default Drop Folder**: Auto-creates and routes transfers to `/sdcard/Download/CableDrop`.
- **Live Transfer Stats**: Real-time progress bar, speed, byte counts, and cancellation support.
- **Device Dashboard**: Live battery percentage, storage analysis (internal storage), and custom device nicknames.
- **Session Transfer Logs**: In-memory log of transfers during your session.
- **Zero Setup**: Shipped with universal ADB binaries (Apple Silicon & Intel). No need to install Homebrew or Android platform-tools.

## Installation

1. Grab the latest `.dmg` installer from [Releases](https://github.com/whataakash/cable-drop/releases).
2. Open the DMG and drag **CableDrop** to your `/Applications` folder.
3. Enable **USB Debugging** on your Android device (*Settings → Developer Options → USB Debugging*).
4. Connect your phone via USB cable and tap **Allow** on the debugging prompt.

## Development

```bash
# Clone the repo
git clone https://github.com/whataakash/cable-drop.git
cd cable-drop

# Install dependencies
npm install

# Start in development mode
npm run dev

# Package macOS DMG installer
npm run build:dmg
```

## Tech Stack

- **Shell**: Electron + electron-vite
- **UI**: React 19 + Vanilla CSS
- **Bridge**: Bundled Android Debug Bridge (ADB)

## License

[MIT](LICENSE) © [whataakash](https://github.com/whataakash)

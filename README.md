# PixelArt Controller

Desktop application for controlling iPixel Color LED panels.

## About

This application provides an alternative way to control the [iPixel Color LED panel from Action](https://www.action.com/fr-fr/p/3217439/panneau-pixel-led/) without using the official app.

### Why this app?

The [official iPixel Color app](https://apps.apple.com/us/app/ipixel-color/id1562961996) has several limitations:
- **Age restriction**: Requires users to be 18+ years old
- **Privacy concerns**: Requests location/geolocation access
- **Platform limitations**: Mobile-only (iOS/Android)

PixelArt Controller solves these issues by:
- No age restrictions
- No location tracking or unnecessary permissions
- Cross-platform desktop support (macOS, Windows, Linux)
- Bundled backend for easy installation
- Open source and privacy-focused

## Features

- Cross-platform (macOS, Windows, Linux)
- Bundled backend (no separate installation required)
- BLE device control via pypixelcolor
- Text, images, pixel art, and animations
- Clock and special modes
- Real-time WebSocket updates

## Installation

Download the latest release for your platform from [Releases](https://github.com/<username>/pixelart-controller/releases):

- **macOS**: Download the `.dmg` file
- **Windows**: Download the `.exe` or `.msi` installer
- **Linux**: Download the `.deb` or `.AppImage` file

The application includes a bundled Python backend that starts automatically.

## Development

### Prerequisites

- **Node.js** 18+ and npm
- **Rust** (installed via [rustup](https://rustup.rs/))
- **Python** 3.11+

### Setup

```bash
npm install
cd python-backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt
```

### Run

**Terminal 1** - Backend:
```bash
cd python-backend && source venv/bin/activate && python src/main.py
```

**Terminal 2** - Frontend:
```bash
npm run tauri dev
```

### Build

Build the complete distributable application:

```bash
npm run build:all
```

This will:
1. Bundle the Python backend with PyInstaller
2. Build the Tauri application with the bundled backend
3. Create platform-specific installers in `src-tauri/target/release/bundle/`

## Architecture

- **Frontend**: Tauri v2 + React 19 + TypeScript
- **Backend**: Python FastAPI + pypixelcolor + bleak (BLE)
- **Packaging**: PyInstaller (backend) + Tauri bundler

### Project Structure

```
pixelart-controller/
├── src/                      # React frontend
├── src-tauri/               # Rust Tauri application
│   ├── resources/           # Bundled backend executable (auto-generated)
│   └── src/lib.rs           # Backend process manager
├── python-backend/          # Python FastAPI backend
│   ├── build.py             # PyInstaller build script
│   └── src/main.py          # Backend server
└── package.json             # Build scripts
```

## API Endpoints

### Health Check
- `GET /` - Backend health check

### Devices
- `GET /devices/scan` - Scan for BLE devices
- `POST /devices/connect` - Connect to device
- `POST /devices/disconnect` - Disconnect
- `GET /devices/status` - Connection status

### Panel Control
- `POST /panel/text` - Send text with animations
- `POST /panel/image` - Send image or GIF
- `POST /panel/mode/clock` - Clock mode
- `POST /panel/mode/rhythm` - Rhythm mode
- `POST /panel/mode/diy` - DIY mode
- `POST /panel/brightness` - Set brightness (0-100)
- `POST /panel/orientation` - Set orientation (0-3)

### WebSocket
- `WS /ws` - Real-time updates

## Troubleshooting

### Backend doesn't start
- Check `src-tauri/resources/backend` exists
- Rebuild: `npm run build:backend`
- Test directly: `./src-tauri/resources/backend`

### Port 8000 already in use
```bash
lsof -ti:8000 | xargs kill -9
```

### PyInstaller fails
```bash
pip install --upgrade pip pyinstaller
rm -rf python-backend/{build,dist}
```

### Tauri build fails
```bash
rustup update
cd src-tauri && cargo clean
```

## Platform-Specific Notes

### macOS
- Bluetooth permissions required (prompted automatically)
- "Unidentified developer" warning: Right-click → Open

### Windows
- Windows 10 build 16299+ required
- SmartScreen warning: "More info" → "Run anyway"

### Linux
- BlueZ 5.55+ required
- Add user to bluetooth group: `sudo usermod -a -G bluetooth $USER`

## License

MIT - see [LICENSE](LICENSE) file

## Credits

- [pypixelcolor](https://github.com/lucagoc/pypixelcolor) - iPixel Color control library
- [Tauri](https://tauri.app/) - Desktop framework
- [FastAPI](https://fastapi.tiangolo.com/) - Python web framework

# Building PixelArt Controller

This guide explains how to build PixelArt Controller from source on different platforms.

## Prerequisites

All platforms require:
- **Node.js** 18+ and npm
- **Rust** (install via [rustup](https://rustup.rs/))
- **Python** 3.11+

## macOS

### Additional Requirements
- Xcode Command Line Tools: `xcode-select --install`

### Build Steps

1. Clone and setup:
```bash
git clone https://github.com/VincentGourbin/pixelart-controller.git
cd pixelart-controller
npm install
```

2. Setup Python environment:
```bash
cd python-backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
```

3. Build backend executable:
```bash
npm run build:backend
```

This creates `src-tauri/resources/backend` (~19 MB)

4. Build Tauri application:
```bash
npm run tauri build
```

Outputs:
- `src-tauri/target/release/bundle/dmg/PixelArt Controller_0.1.0_universal.dmg`
- `src-tauri/target/release/bundle/macos/PixelArt Controller.app`

### Signing (Optional)

For distribution outside your machine:
```bash
export APPLE_SIGNING_IDENTITY="Developer ID Application: Your Name (TEAM_ID)"
npm run tauri build
```

## Windows

### Additional Requirements
- Visual Studio 2019+ with C++ build tools
- WebView2 (usually pre-installed on Windows 10+)

### Build Steps

1. Clone and setup:
```powershell
git clone https://github.com/VincentGourbin/pixelart-controller.git
cd pixelart-controller
npm install
```

2. Setup Python environment:
```powershell
cd python-backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

3. Build backend executable:
```powershell
npm run build:backend
```

This creates `src-tauri/resources/backend.exe`

4. Build Tauri application:
```powershell
npm run tauri build
```

Outputs:
- `src-tauri/target/release/bundle/msi/PixelArt Controller_0.1.0_x64_en-US.msi`
- `src-tauri/target/release/bundle/nsis/PixelArt Controller_0.1.0_x64-setup.exe`

## Linux

### Additional Requirements (Debian/Ubuntu)

```bash
sudo apt-get update
sudo apt-get install -y \
    libwebkit2gtk-4.1-dev \
    build-essential \
    curl \
    wget \
    file \
    libssl-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    libbluetooth-dev
```

### Build Steps

1. Clone and setup:
```bash
git clone https://github.com/VincentGourbin/pixelart-controller.git
cd pixelart-controller
npm install
```

2. Setup Python environment:
```bash
cd python-backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
```

3. Build backend executable:
```bash
npm run build:backend
```

This creates `src-tauri/resources/backend`

4. Build Tauri application:
```bash
npm run tauri build
```

Outputs:
- `src-tauri/target/release/bundle/deb/pixelart-controller_0.1.0_amd64.deb`
- `src-tauri/target/release/bundle/appimage/pixelart-controller_0.1.0_amd64.AppImage`

## Troubleshooting

### PyInstaller Build Fails

**Issue**: Import errors or missing modules

**Solution**:
```bash
cd python-backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install --upgrade pip pyinstaller
rm -rf build dist *.spec
python build.py
```

### Rust Compilation Errors

**Issue**: Cargo build fails

**Solution**:
```bash
rustup update
cd src-tauri
cargo clean
cd ..
npm run tauri build
```

### Backend Not Found at Runtime

**Issue**: Application starts but backend doesn't launch

**Solution**:
1. Verify backend exists: `ls -l src-tauri/resources/backend*`
2. Rebuild backend: `npm run build:backend`
3. Check executable permissions (Linux/macOS): `chmod +x src-tauri/resources/backend`

### Windows Defender / Antivirus Issues

**Issue**: PyInstaller executable flagged as malware

**Solution**:
- This is a common false positive with PyInstaller
- Add exception in Windows Defender for the `python-backend/dist` directory
- Consider code signing for distribution

## Build Optimization

### Smaller Backend Binary

Edit `python-backend/build.py` and add:
```python
"--exclude-module", "tkinter",
"--exclude-module", "matplotlib",
```

### Universal macOS Binary

By default, Tauri builds universal binaries (Intel + Apple Silicon).

To build for specific architecture only:
```bash
npm run tauri build -- --target aarch64-apple-darwin  # Apple Silicon only
npm run tauri build -- --target x86_64-apple-darwin   # Intel only
```

## CI/CD

See `.github/workflows/build.yml` for automated builds on:
- Push to `main` branch
- Tags matching `v*`

Artifacts are automatically uploaded to GitHub Releases.

## Development Builds

For faster development iteration:

```bash
# Backend only (faster than full PyInstaller)
cd python-backend && source venv/bin/activate && python src/main.py

# Frontend with hot reload
npm run tauri dev
```

## Cleaning Build Artifacts

```bash
# Clean all build artifacts
rm -rf \
    python-backend/dist \
    python-backend/build \
    python-backend/*.spec \
    src-tauri/target \
    src-tauri/resources/backend* \
    node_modules \
    dist

# Reinstall
npm install
cd python-backend && pip install -r requirements.txt
```

## Platform-Specific Notes

### macOS
- First build may take 5-10 minutes (compiles Rust dependencies)
- Universal binaries are ~40-50 MB
- Requires macOS 10.13+ to run

### Windows
- First build may take 10-15 minutes
- .msi installer is recommended for distribution
- Requires Windows 10 build 16299+ to run

### Linux
- AppImage is most portable format
- .deb is for Debian/Ubuntu-based distributions
- User must be in `bluetooth` group for BLE access

## Support

For build issues, check:
1. This guide's troubleshooting section
2. [GitHub Issues](https://github.com/VincentGourbin/pixelart-controller/issues)
3. Tauri documentation: https://tauri.app/
4. PyInstaller documentation: https://pyinstaller.org/

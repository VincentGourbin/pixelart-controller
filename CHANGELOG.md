# Changelog

All notable changes to PixelArt Controller will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2025-12-08

### Added
- Initial release of PixelArt Controller
- Cross-platform desktop application (macOS, Windows, Linux)
- Bundled Python backend with automatic startup
- BLE device scanning and connection
- Text mode with animations and fonts
- Image mode with PNG and GIF support
- Pixel art drawing mode
- Clock mode with 12h/24h format and date display
- Brightness and orientation controls
- Real-time WebSocket updates
- Modern dark-themed UI with Black Dashboard React
- Comprehensive build system with PyInstaller and Tauri
- GitHub Actions CI/CD for automated releases
- MIT License

### Technical Details
- **Frontend**: Tauri v2 + React 19 + TypeScript + Tailwind CSS
- **Backend**: Python 3.11 + FastAPI + pypixelcolor + bleak
- **Packaging**: PyInstaller (backend) + Tauri bundler (app)
- **Build**: Cross-platform support with single `npm run build:all` command

[Unreleased]: https://github.com/<username>/pixelart-controller/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/<username>/pixelart-controller/releases/tag/v0.1.0

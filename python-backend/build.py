#!/usr/bin/env python3
"""PyInstaller build script for PixelArt Controller backend"""
import sys
import platform
import subprocess
from pathlib import Path

PLATFORM = platform.system().lower()
BASE_DIR = Path(__file__).parent
SRC_DIR = BASE_DIR / "src"
DIST_DIR = BASE_DIR / "dist"
TAURI_RESOURCES_DIR = BASE_DIR.parent / "src-tauri" / "resources"

DIST_DIR.mkdir(exist_ok=True)
TAURI_RESOURCES_DIR.mkdir(exist_ok=True)

EXECUTABLE_NAME = "backend.exe" if PLATFORM == "windows" else "backend"

print(f"Building backend for {PLATFORM} -> {EXECUTABLE_NAME}")

pyinstaller_cmd = [
    "pyinstaller",
    "--onefile",
    "--name", "backend",
    "--clean",
    "--noconfirm",
    "--hidden-import", "uvicorn.logging",
    "--hidden-import", "uvicorn.loops.auto",
    "--hidden-import", "uvicorn.protocols.http.auto",
    "--hidden-import", "uvicorn.protocols.websockets.auto",
    "--hidden-import", "uvicorn.lifespan.on",
    "--hidden-import", "bleak",
    "--hidden-import", "pypixelcolor",
    str(SRC_DIR / "main.py")
]

result = subprocess.run(pyinstaller_cmd, cwd=BASE_DIR)
if result.returncode != 0:
    print("PyInstaller build failed!")
    sys.exit(1)

# Copy to Tauri resources
source_exe = DIST_DIR / ("backend.exe" if PLATFORM == "windows" else "backend")
target_exe = TAURI_RESOURCES_DIR / EXECUTABLE_NAME

if source_exe.exists():
    import shutil
    shutil.copy2(source_exe, target_exe)
    print(f"\n[OK] Backend copied to: {target_exe}")
    print(f"  Size: {target_exe.stat().st_size / 1024 / 1024:.2f} MB")
else:
    print(f"\n[ERROR] Executable not found at {source_exe}")
    sys.exit(1)

print("\nBackend build completed!")

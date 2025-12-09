# -*- mode: python ; coding: utf-8 -*-
import os
import sys
import site
from pathlib import Path
from PyInstaller.utils.hooks import collect_data_files

# Get the script directory (where backend.spec is located)
# SPECPATH is provided by PyInstaller and points to the directory containing the spec file
SPEC_DIR = Path(SPECPATH)
MAIN_SCRIPT = SPEC_DIR / 'src' / 'main.py'

# Collect pypixelcolor fonts from site-packages
pypixelcolor_fonts = []

# Try to find pypixelcolor fonts in site-packages
for site_dir in site.getsitepackages() + [site.getusersitepackages()]:
    if site_dir:
        fonts_dir = Path(site_dir) / 'pypixelcolor' / 'fonts'
        if fonts_dir.exists():
            print(f"Found pypixelcolor fonts at: {fonts_dir}")
            for font_file in fonts_dir.iterdir():
                if font_file.suffix in ('.ttf', '.otf'):
                    src = str(font_file)
                    dst = os.path.join('pypixelcolor', 'fonts')
                    pypixelcolor_fonts.append((src, dst))
            break

print(f"Collected {len(pypixelcolor_fonts)} font files")

a = Analysis(
    [str(MAIN_SCRIPT)],
    pathex=[],
    binaries=[],
    datas=pypixelcolor_fonts,
    hiddenimports=['uvicorn.logging', 'uvicorn.loops.auto', 'uvicorn.protocols.http.auto', 'uvicorn.protocols.websockets.auto', 'uvicorn.lifespan.on', 'bleak', 'pypixelcolor'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='backend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

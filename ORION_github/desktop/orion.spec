# -*- mode: python ; coding: utf-8 -*-
"""
O.R.I.O.N. PyInstaller Spec
Genera un ejecutable Windows de un solo archivo (onefile) o carpeta (onedir).
Uso: pyinstaller orion.spec
"""

import sys
import os
from pathlib import Path

BASE   = Path(SPECPATH)
SHARED = BASE / '..' / 'shared'

block_cipher = None

a = Analysis(
    [str(BASE / 'app.py')],
    pathex=[str(BASE), str(SHARED)],
    binaries=[],
    datas=[
        # Incluir el frontend web
        (str(BASE / 'frontend'), 'frontend'),
        # Incluir shared/core y plugins
        (str(SHARED / 'core'),    'core'),
        (str(SHARED / 'plugins'), 'plugins'),
        (str(SHARED / 'server.py'), '.'),
        (str(SHARED / 'config.py'), '.'),
    ],
    hiddenimports=[
        # FastAPI y uvicorn
        'uvicorn', 'uvicorn.logging', 'uvicorn.loops', 'uvicorn.loops.auto',
        'uvicorn.protocols', 'uvicorn.protocols.http', 'uvicorn.protocols.http.auto',
        'uvicorn.protocols.websockets', 'uvicorn.protocols.websockets.auto',
        'uvicorn.lifespan', 'uvicorn.lifespan.on',
        'fastapi', 'starlette',
        # O.R.I.O.N. core
        'core.llm', 'core.router', 'core.tts', 'core.stt',
        'core.function_executor', 'core.model_persistence', 'core.model_manager',
        'core.voice_assistant', 'core.weather', 'core.tasks',
        'core.calendar_manager', 'core.kasa_control', 'core.news',
        'core.settings_store',
        # Plugins
        'plugins', 'plugins.plugin_base',
        # ML
        'torch', 'transformers', 'accelerate', 'safetensors',
        # Audio
        'sounddevice', 'soundfile', 'numpy',
        # Otros
        'requests', 'httpx', 'duckduckgo_search', 'kasa',
        'webview',
    ],
    hookspath=[],
    runtime_hooks=[],
    excludes=['PySide6', 'PyQt6', 'tkinter'],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz, a.scripts, [],
    exclude_binaries=True,
    name        = 'ORION',
    debug       = False,
    bootloader_ignore_signals = False,
    strip       = False,
    upx         = True,
    console     = False,       # Sin ventana de consola
    icon        = None,        # Poner ruta a .ico aqui si tienes uno
)

coll = COLLECT(
    exe, a.binaries, a.zipfiles, a.datas,
    strip = False,
    upx   = True,
    upx_exclude = [],
    name  = 'ORION',
)

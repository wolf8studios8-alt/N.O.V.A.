"""
O.R.I.O.N. — Desktop (Windows EXE)
Usa pywebview para mostrar la interfaz web dentro de una ventana nativa.
El servidor FastAPI corre en background en el mismo proceso.
Empaquetado con PyInstaller — no requiere Python instalado ni permisos de admin.
"""
import sys
import os
import threading
import time

# Ajustar path para encontrar shared/
_BASE = os.path.dirname(os.path.abspath(__file__))
_SHARED = os.path.join(_BASE, '..', 'shared')
sys.path.insert(0, _SHARED)
sys.path.insert(0, _BASE)

from config import SERVER_PORT

# ── Arrancar servidor en background ──────────────────────────────────────────
def _start_server():
    import uvicorn
    from server import create_app
    frontend_dir = os.path.join(_BASE, 'frontend')
    app = create_app(frontend_dir=frontend_dir)
    uvicorn.run(app, host="127.0.0.1", port=SERVER_PORT,
                log_level="warning", access_log=False)

server_thread = threading.Thread(target=_start_server, daemon=True)
server_thread.start()

# Esperar a que el servidor arranque
time.sleep(2)

# ── Abrir ventana nativa con pywebview ────────────────────────────────────────
import webview

def _create_window():
    window = webview.create_window(
        title       = "O.R.I.O.N.",
        url         = f"http://127.0.0.1:{SERVER_PORT}",
        width       = 1440,
        height      = 900,
        min_size    = (800, 600),
        resizable   = True,
        fullscreen  = False,
        background_color = "#000000",
    )
    return window

if __name__ == "__main__":
    window = _create_window()
    webview.start(debug=False, private_mode=False)

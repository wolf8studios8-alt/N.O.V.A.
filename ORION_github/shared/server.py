"""
O.R.I.O.N. Shared FastAPI Server
Usado por: web (python main.py) y desktop (pywebview wrapper)
Incluye rutas de gestion de plugins.
"""
import asyncio, json, queue as _q, socket, time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Dict

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse

from config import SERVER_HOST, SERVER_PORT, VOICE_ASSISTANT_ENABLED, CYAN, RESET, GREEN, GRAY

_event_queue: _q.Queue = _q.Queue()

def _push(event: dict):
    _event_queue.put_nowait(event)


class ConnectionManager:
    def __init__(self): self.active: Dict[str, WebSocket] = {}
    async def connect(self, ws, cid):
        await ws.accept(); self.active[cid] = ws
    def disconnect(self, cid): self.active.pop(cid, None)
    async def send(self, cid, data):
        ws = self.active.get(cid)
        if ws:
            try: await ws.send_json(data)
            except: pass
    async def broadcast(self, data):
        for ws in list(self.active.values()):
            try: await ws.send_json(data)
            except: pass

manager = ConnectionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Cargar plugins
    from plugins import plugin_manager
    plugin_manager.discover_and_load()

    # IP local
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8",80)); ip = s.getsockname()[0]; s.close()
    except: ip = "localhost"

    print(f"{GREEN}O.R.I.O.N. online.{RESET}")
    print(f"{CYAN}  PC/Mac : http://localhost:{SERVER_PORT}{RESET}")
    print(f"{CYAN}  Red    : http://{ip}:{SERVER_PORT}{RESET}")

    # Registrar callbacks del voice assistant
    from core.voice_assistant import voice_assistant
    voice_assistant.on_wake_word(    lambda:     _push({"type":"wake_word"}))
    voice_assistant.on_speech(       lambda t:   _push({"type":"speech","text":t}))
    voice_assistant.on_processing_start(lambda:  _push({"type":"processing_start"}))
    voice_assistant.on_processing_finish(lambda: _push({"type":"processing_finish"}))
    voice_assistant.on_response(     lambda t:   _push({"type":"response","message":t}))
    voice_assistant.on_error(        lambda m:   _push({"type":"error","message":m}))
    voice_assistant.on_timer_set(    lambda s,l: _push({"type":"timer_set","seconds":s,"label":l}))

    if VOICE_ASSISTANT_ENABLED:
        import threading
        threading.Thread(target=lambda: voice_assistant.initialize() and voice_assistant.start(), daemon=True).start()

    bc = asyncio.create_task(_broadcast_loop())
    yield
    bc.cancel()


async def _broadcast_loop():
    while True:
        try:
            try: e = _event_queue.get_nowait(); e["ts"]=time.time(); await manager.broadcast(e)
            except _q.Empty: pass
            await asyncio.sleep(0.05)
        except asyncio.CancelledError: break


# ── APP ───────────────────────────────────────────────────────────────────────
def create_app(frontend_dir: str = None) -> FastAPI:
    app = FastAPI(title="O.R.I.O.N.", version="2.0.0", lifespan=lifespan)
    app.add_middleware(CORSMiddleware, allow_origins=["*"],
                       allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

    _frontend = Path(frontend_dir) if frontend_dir else Path(__file__).parent / "frontend"

    @app.get("/")
    async def ui():
        idx = _frontend / "index.html"
        return FileResponse(str(idx)) if idx.exists() else HTMLResponse("<h1>O.R.I.O.N.</h1>")

    @app.get("/health")
    async def health(): return {"status":"online","system":"O.R.I.O.N.","version":"2.0.0"}

    @app.get("/api/weather")
    async def weather():
        try:
            from core.weather import WeatherManager
            return WeatherManager().get_weather() or {"error":"no data"}
        except Exception as e: return {"error":str(e)}

    @app.get("/api/tasks")
    async def tasks():
        try:
            from core.tasks import TaskManager
            return {"tasks": TaskManager().get_tasks()}
        except Exception as e: return {"tasks":[],"error":str(e)}

    @app.get("/api/timers")
    async def timers():
        from core.function_executor import executor
        with executor._timer_lock:
            ts = [{"label":t.label,"remaining":t.remaining_seconds}
                  for t in executor.active_timers.values() if not t.is_expired]
        return {"timers": ts}

    # ── PLUGIN ROUTES ─────────────────────────────────────────────────────────
    @app.get("/api/plugins")
    async def list_plugins():
        from plugins import plugin_manager
        return {"plugins": plugin_manager.get_all_plugins_info()}

    @app.post("/api/plugins/reload/{plugin_id}")
    async def reload_plugin(plugin_id: str):
        from plugins import plugin_manager
        return {"message": plugin_manager.reload_plugin(plugin_id)}

    @app.post("/api/plugins/unload/{plugin_id}")
    async def unload_plugin(plugin_id: str):
        from plugins import plugin_manager
        return {"message": plugin_manager.unload_plugin(plugin_id)}

    # ── WEBSOCKET ─────────────────────────────────────────────────────────────
    @app.websocket("/ws/{cid}")
    async def ws_ep(ws: WebSocket, cid: str):
        await manager.connect(ws, cid)
        await manager.send(cid,{"type":"system","message":"O.R.I.O.N. en linea. Todos los sistemas nominales, Sir.","ts":time.time()})
        try:
            while True:
                raw = await ws.receive_text()
                p   = json.loads(raw)
                if p.get("type") == "command":
                    t = p.get("text","").strip()
                    if t: asyncio.create_task(_handle_command(cid, t))
                elif p.get("type") == "ping":
                    await manager.send(cid, {"type":"pong","ts":time.time()})
                elif p.get("type") == "voice_toggle":
                    from core.voice_assistant import voice_assistant
                    if p.get("active"): voice_assistant.start()
                    else: voice_assistant.stop()
        except WebSocketDisconnect: manager.disconnect(cid)
        except Exception as e: print(f"{GRAY}WS error: {e}{RESET}"); manager.disconnect(cid)

    return app


async def _handle_command(cid: str, text: str):
    await manager.send(cid, {"type":"ack","message":"Procesando, Sir...","ts":time.time()})
    loop = asyncio.get_event_loop()
    result = {"response":"","done":False}
    ev = asyncio.Event()

    def _run():
        from core.voice_assistant import voice_assistant
        old_r = voice_assistant._on_response_cb
        old_e = voice_assistant._on_error_cb
        def on_r(m): result["response"]=m; result["done"]=True; loop.call_soon_threadsafe(ev.set)
        def on_e(m): result["response"]=f"Error: {m}"; result["done"]=True; loop.call_soon_threadsafe(ev.set)
        voice_assistant._on_response_cb = on_r
        voice_assistant._on_error_cb    = on_e
        voice_assistant.process_text(text)
        import time as _t
        for _ in range(600):
            if result["done"]: break
            _t.sleep(0.1)
        voice_assistant._on_response_cb = old_r
        voice_assistant._on_error_cb    = old_e

    import threading; threading.Thread(target=_run, daemon=True).start()
    try: await asyncio.wait_for(ev.wait(), timeout=60)
    except asyncio.TimeoutError: result["response"]="Timeout, Sir."
    await manager.send(cid, {"type":"response","message":result["response"],"ts":time.time()})

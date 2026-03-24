"""
O.R.I.O.N. — Shared Configuration
Usado por: web, desktop (exe), mobile (apk via server)
"""
import os, pathlib
from dotenv import load_dotenv
load_dotenv()

# ── LLM Ollama ────────────────────────────────────────────────────────────────
RESPONDER_MODEL  = "qwen3:1.7b"
OLLAMA_URL       = "http://localhost:11434/api"
LOCAL_ROUTER_PATH= "./merged_model"
HF_ROUTER_REPO   = "nlouis/pocket-ai-router"
MAX_HISTORY      = 20

# ── TTS Piper ─────────────────────────────────────────────────────────────────
TTS_VOICE_MODEL  = "en_GB-northern_english_male-medium"
TTS_MODEL_URL    = "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/northern_english_male/medium/en_GB-northern_english_male-medium.onnx"
TTS_CONFIG_URL   = "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/northern_english_male/medium/en_GB-northern_english_male-medium.onnx.json"

# ── STT RealTimeSTT ───────────────────────────────────────────────────────────
REALTIMESTT_MODEL        = "base"
WAKE_WORD                = "orion"
WAKE_WORD_SENSITIVITY    = 0.4
WAKE_WORD_CONFIRMATION_COUNT = 1
STT_SAMPLE_RATE          = 16000
STT_CHUNK_SIZE           = 4096
STT_RECORD_TIMEOUT       = 5.0
STT_MODEL_PATH           = None
STT_USE_WHISPER          = False
WHISPER_MODEL_SIZE       = "base"
WAKE_WORD_DETECTION_METHOD = "transcription"
USE_PORCUPINE_WAKE_WORD  = False
PORCUPINE_ACCESS_KEY     = None

# ── Voice Assistant ───────────────────────────────────────────────────────────
VOICE_ASSISTANT_ENABLED  = True
QWEN_TIMEOUT_SECONDS     = 300
QWEN_KEEP_ALIVE          = "5m"

# ── Server ────────────────────────────────────────────────────────────────────
SERVER_HOST = "0.0.0.0"
SERVER_PORT = int(os.getenv("ORION_PORT", "8080"))

# ── Data paths (sin admin, carpeta del usuario) ───────────────────────────────
_HOME    = pathlib.Path.home()
DATA_DIR = _HOME / ".orion" / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

DB_CHAT     = str(DATA_DIR / "chat_history.db")
DB_TASKS    = str(DATA_DIR / "tasks.db")
DB_CALENDAR = str(DATA_DIR / "calendar.db")

# ── Plugins ───────────────────────────────────────────────────────────────────
PLUGINS_DIR = str(_HOME / ".orion" / "plugins")
pathlib.Path(PLUGINS_DIR).mkdir(parents=True, exist_ok=True)

# ── Console colors ────────────────────────────────────────────────────────────
GRAY   = "\033[90m"; RESET = "\033[0m"; CYAN = "\033[36m"
GREEN  = "\033[32m"; YELLOW= "\033[33m"; BOLD = "\033[1m"

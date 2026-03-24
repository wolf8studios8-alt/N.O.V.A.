"""
O.R.I.O.N. Voice Assistant — Plugin-aware, sin PySide6
STT → FunctionGemma → [Plugin?] → Qwen/Ollama → Piper TTS
"""
import threading, json, requests
from typing import Optional, Callable
from config import RESPONDER_MODEL, OLLAMA_URL, MAX_HISTORY, GRAY, RESET, CYAN, GREEN, WAKE_WORD
from core.stt import STTListener
from core.llm import route_query, should_bypass_router, http_session
from core.model_persistence import ensure_qwen_loaded, mark_qwen_used
from core.tts import tts, SentenceBuffer
from core.function_executor import executor as function_executor

ACTION_FUNCTIONS = {"control_light","set_timer","set_alarm","create_calendar_event","add_task","web_search"}


class VoiceAssistant:
    def __init__(self):
        self.stt_listener: Optional[STTListener] = None
        self.running = False
        self.messages = [{'role':'system','content':
            'You are O.R.I.O.N. (Omnidirectional Reasoning & Intelligent Operations Network). '
            'Respond in short, complete sentences. Keep responses concise. Address the user as Sir.'}]
        self._on_wake_word_cb = None
        self._on_speech_cb    = None
        self._on_proc_start   = None
        self._on_proc_finish  = None
        self._on_response_cb  = None
        self._on_error_cb     = None
        self._on_timer_set_cb = None

    def on_wake_word(self, fn):      self._on_wake_word_cb = fn
    def on_speech(self, fn):         self._on_speech_cb    = fn
    def on_processing_start(self,fn):self._on_proc_start   = fn
    def on_processing_finish(self,fn):self._on_proc_finish = fn
    def on_response(self, fn):       self._on_response_cb  = fn
    def on_error(self, fn):          self._on_error_cb     = fn
    def on_timer_set(self, fn):      self._on_timer_set_cb = fn

    def _emit(self, cb, *args):
        if cb:
            try: cb(*args)
            except: pass

    def initialize(self) -> bool:
        try:
            self.stt_listener = STTListener(
                wake_word_callback=self._handle_wake_word,
                speech_callback=self._handle_speech)
            if not self.stt_listener.initialize(): return False
            if not tts.piper_exe: tts.initialize()
            return True
        except Exception as e:
            print(f"{GRAY}[VA] Init error: {e}{RESET}"); return False

    def start(self):
        if self.running: return
        if not self.stt_listener:
            if not self.initialize(): return
        self.running = True
        self.stt_listener.start()
        print(f"{CYAN}[VA] Listening. Wake word: '{GREEN}{WAKE_WORD}{RESET}{CYAN}'.{RESET}")

    def stop(self):
        self.running = False
        if self.stt_listener: self.stt_listener.stop()

    def _handle_wake_word(self):
        self._emit(self._on_wake_word_cb)

    def _handle_speech(self, text: str):
        text = text.lower().replace("orion","").strip()
        if not text: return
        self._emit(self._on_speech_cb, text)
        self._emit(self._on_proc_start)
        threading.Thread(target=self._process, args=(text,), daemon=True).start()

    def process_text(self, text: str):
        """Proceso directo desde chat web (sin voz)."""
        self._emit(self._on_proc_start)
        threading.Thread(target=self._process, args=(text,), daemon=True).start()

    def _process(self, text: str):
        try:
            # 1. Comprobar si un plugin puede manejar la peticion
            from plugins import plugin_manager
            func_name, params = (None, {})
            if should_bypass_router(text):
                func_name, params = "nonthinking", {"prompt": text}
            else:
                func_name, params = route_query(text)

            # 2. Plugin override: si el plugin manager tiene esta funcion, va al plugin
            if plugin_manager.can_handle(func_name):
                result = plugin_manager.execute(func_name, params)
                self._generate_with_context(func_name, result, text)
                return

            # 3. Flujo normal (igual que A.D.A.)
            if func_name in ACTION_FUNCTIONS:
                result = function_executor.execute(func_name, params)
                if func_name == "set_timer" and result.get("success"):
                    d = result.get("data", {})
                    self._emit(self._on_timer_set_cb, d.get("seconds",0), d.get("label","Timer"))
                self._generate_with_context(func_name, result, text)
            elif func_name == "get_system_info":
                result = function_executor.execute(func_name, params)
                self._generate_with_context(func_name, result, text, thinking=True)
            elif func_name in ("thinking","nonthinking"):
                self._stream_qwen(text, func_name=="thinking")
            else:
                self._stream_qwen(text, False)
        except Exception as e:
            self._emit(self._on_error_cb, str(e))
            self._emit(self._on_proc_finish)

    def _generate_with_context(self, func_name, result, user_text, thinking=False):
        try:
            if not ensure_qwen_loaded():
                self._emit(self._on_proc_finish); return
            mark_qwen_used()
            msg = result.get("message","")
            ctx = f"Function {func_name} result: {msg}"
            if len(self.messages) > MAX_HISTORY:
                self.messages = [self.messages[0]] + self.messages[-(MAX_HISTORY-1):]
            self.messages.append({'role':'user','content':f"{ctx}\n\nUser asked: {user_text}\n\nRespond naturally."})
            payload = {"model":RESPONDER_MODEL,"messages":self.messages,"stream":True,"think":thinking,"keep_alive":"5m"}
            buf = SentenceBuffer(); full = ""
            with http_session.post(f"{OLLAMA_URL}/chat", json=payload, stream=True) as r:
                r.raise_for_status()
                for line in r.iter_lines():
                    if line:
                        try:
                            c = json.loads(line.decode())["message"].get("content","")
                            if c: full+=c; [tts.queue_sentence(s) for s in buf.add(c)]
                        except: pass
            rem = buf.flush()
            if rem: tts.queue_sentence(rem)
            self.messages.append({'role':'assistant','content':full})
            mark_qwen_used()
            self._emit(self._on_response_cb, full)
            self._emit(self._on_proc_finish)
        except Exception as e:
            print(f"{GRAY}[VA] Context error: {e}{RESET}")
            self._emit(self._on_proc_finish)

    def _stream_qwen(self, text: str, thinking: bool):
        try:
            if not ensure_qwen_loaded():
                self._emit(self._on_proc_finish); return
            mark_qwen_used()
            if len(self.messages) > MAX_HISTORY:
                self.messages = [self.messages[0]] + self.messages[-(MAX_HISTORY-1):]
            self.messages.append({'role':'user','content':text})
            payload = {"model":RESPONDER_MODEL,"messages":self.messages,"stream":True,"think":thinking,"keep_alive":"5m"}
            buf = SentenceBuffer(); full = ""
            with http_session.post(f"{OLLAMA_URL}/chat", json=payload, stream=True) as r:
                r.raise_for_status()
                for line in r.iter_lines():
                    if line:
                        try:
                            c = json.loads(line.decode())["message"].get("content","")
                            if c: full+=c; [tts.queue_sentence(s) for s in buf.add(c)]
                        except: pass
            rem = buf.flush()
            if rem: tts.queue_sentence(rem)
            self.messages.append({'role':'assistant','content':full})
            mark_qwen_used()
            self._emit(self._on_response_cb, full)
            self._emit(self._on_proc_finish)
        except Exception as e:
            print(f"{GRAY}[VA] Stream error: {e}{RESET}")
            self._emit(self._on_proc_finish)


voice_assistant = VoiceAssistant()

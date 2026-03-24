"""O.R.I.O.N. Settings Store"""
import json
from pathlib import Path

_path = Path.home() / ".orion" / "settings.json"
_path.parent.mkdir(parents=True, exist_ok=True)
_data = {}
if _path.exists():
    try: _data = json.loads(_path.read_text())
    except: pass

class _Settings:
    def get(self, key, default=None): return _data.get(key, default)
    def set(self, key, value):
        _data[key] = value
        _path.write_text(json.dumps(_data, indent=2))
    def get_all(self): return dict(_data)

settings = _Settings()

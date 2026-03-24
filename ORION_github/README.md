# O.R.I.O.N.
## Omnidirectional Reasoning & Intelligent Operations Network — v2.0.0

> Asistente de IA agéntico multimodal. Misma base que A.D.A., renombrado y expandido a tres plataformas con sistema de plugins.

---

## Estructura del repositorio

```
orion/
├── shared/              # Código compartido por todas las plataformas
│   ├── core/            # Modelos originales intactos (Qwen, FunctionGemma, Piper, STT, Kasa...)
│   ├── plugins/         # Sistema de plugins + plugin de ejemplo
│   │   ├── __init__.py          → PluginManager
│   │   ├── plugin_base.py       → Clase base ORIONPlugin
│   │   └── example_plugin/      → Plugin de ejemplo listo para copiar
│   ├── frontend/        # Interfaz HUD (la misma en las 3 plataformas)
│   ├── server.py        # FastAPI app compartida
│   └── config.py        # Configuración centralizada
│
├── web/                 # Versión web (navegador)
│   ├── main.py
│   ├── requirements.txt
│   └── start.bat
│
├── desktop/             # Versión escritorio → EXE Windows
│   ├── app.py
│   ├── orion.spec       → PyInstaller
│   ├── build.bat        → Genera el EXE
│   └── requirements.txt
│
└── mobile/              # Proyecto Android Studio → APK
    ├── app/
    │   └── src/main/
    │       ├── java/com/orion/app/
    │       │   ├── MainActivity.kt
    │       │   └── ORIONBridge.kt
    │       ├── res/
    │       └── AndroidManifest.xml
    ├── build.gradle
    └── settings.gradle
```

---

## Cómo funciona la conexión entre plataformas

```
PC (servidor O.R.I.O.N. corriendo)
        │
        │  WebSocket ws://[IP]:8080
        │
   ┌────┴────┐
   │         │
  APK      EXE       ← Ambos se conectan al mismo servidor
 (WebView)  (pywebview)
   │         │
   └────┬────┘
        │
   Misma UI (index.html)
   Mismos datos (SQLite en ~/.orion/)
   Mismos plugins
```

El APK y el EXE son **clientes WebView** que se conectan al servidor Python. Los datos están sincronizados porque usan la misma base de datos.

---

## Requisitos previos

- **Python 3.10+**
- **Ollama** instalado y corriendo: https://ollama.com
- Modelo descargado: `ollama pull qwen3:1.7b`
- El modelo FunctionGemma router se descarga automáticamente de HuggingFace

---

## Inicio rápido

### Web (navegador)
```bash
cd web
pip install -r requirements.txt --user
python main.py
# Abre http://localhost:8080
# Desde móvil en la misma WiFi: http://[TU-IP]:8080
```

### Desktop (EXE)
```bash
cd desktop
pip install -r requirements.txt --user
# Para correr directamente:
python app.py
# Para generar el EXE:
build.bat
```

### Mobile (APK)
1. Abre la carpeta `mobile/` en **Android Studio**
2. Conecta tu móvil o usa el emulador
3. Pulsa **Run** (▶)
4. En la app, introduce la IP de tu PC: `http://192.168.X.X:8080`

---

## Sistema de Plugins

### Crear un plugin nuevo

1. Copia `shared/plugins/example_plugin/` y renómbrala
2. Edita `manifest.json`:
```json
{
  "id":          "mi_plugin",
  "name":        "Mi Plugin",
  "version":     "1.0.0",
  "description": "Lo que hace mi plugin",
  "author":      "Tu nombre",
  "enabled":     true
}
```
3. Edita `plugin.py`:
```python
from plugins.plugin_base import ORIONPlugin

class MiPlugin(ORIONPlugin):
    def register_functions(self):
        return [{
            "name": "mi_funcion",
            "description": "Cuando Gemma debe usar esta funcion",
            "parameters": {
                "type": "object",
                "properties": {
                    "param": {"type": "string", "description": "..."}
                },
                "required": ["param"]
            }
        }]

    def execute(self, func_name, params):
        return {"success": True, "message": f"Resultado: {params['param']}"}
```
4. Reinicia O.R.I.O.N. o usa el botón **GESTIONAR → ↻ RECARGAR** en la UI

Los plugins también se pueden instalar en `~/.orion/plugins/` sin modificar el código fuente.

---

## Modelos utilizados (sin cambios respecto a A.D.A.)

| Componente | Modelo | Dónde corre |
|---|---|---|
| LLM respondedor | Qwen3 1.7b via Ollama | Local (CPU/GPU) |
| Router de intenciones | FunctionGemma (HuggingFace) | Local |
| TTS | Piper (northern_english_male) | Local |
| STT + Wake Word | RealTimeSTT + Porcupine | Local |
| IoT | python-kasa | Red local |
| Búsqueda web | DuckDuckGo | Internet |
| Clima | Open-Meteo | Internet |

---

## Variables de entorno (.env)

```env
ORION_PORT=8080
WEATHER_LAT=40.7128
WEATHER_LON=-74.0060
```

---

*O.R.I.O.N. — Built to serve, Sir.*

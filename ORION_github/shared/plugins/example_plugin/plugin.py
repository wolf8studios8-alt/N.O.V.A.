"""
O.R.I.O.N. Example Plugin
Demuestra como crear un plugin funcional.
Copia esta carpeta, renombrala y modifica a tu gusto.
"""

import datetime
from typing import Any, Dict, List
from plugins.plugin_base import ORIONPlugin


class ExamplePlugin(ORIONPlugin):
    """
    Plugin de ejemplo con dos funciones:
    - get_joke: cuenta un chiste
    - get_quote: devuelve una frase motivacional
    """

    def on_load(self):
        print("[ExamplePlugin] Plugin cargado correctamente.")

    def on_unload(self):
        print("[ExamplePlugin] Plugin descargado.")

    def register_functions(self) -> List[Dict[str, Any]]:
        return [
            {
                "name":        "get_joke",
                "description": "Tells a joke. Use when user asks for a joke or something funny.",
                "parameters":  {
                    "type":       "object",
                    "properties": {
                        "topic": {
                            "type":        "string",
                            "description": "Optional joke topic (tech, science, random)"
                        }
                    },
                    "required": []
                }
            },
            {
                "name":        "get_quote",
                "description": "Returns an inspirational quote. Use when user needs motivation or asks for a quote.",
                "parameters":  {
                    "type":       "object",
                    "properties": {
                        "category": {
                            "type":        "string",
                            "description": "Quote category: success, science, life"
                        }
                    },
                    "required": []
                }
            }
        ]

    def execute(self, func_name: str, params: Dict[str, Any]) -> Dict[str, Any]:
        if func_name == "get_joke":
            return self._get_joke(params)
        elif func_name == "get_quote":
            return self._get_quote(params)
        return {"success": False, "message": f"Funcion desconocida: {func_name}"}

    def _get_joke(self, params: dict) -> dict:
        topic = params.get("topic", "random").lower()
        jokes = {
            "tech": "Why do programmers prefer dark mode? Because light attracts bugs, Sir.",
            "science": "A neutron walks into a bar and asks: 'How much for a beer?' The bartender says: 'For you, no charge.'",
            "random": "I told my computer I needed a break. Now it won't stop sending me Kit-Kat ads.",
        }
        joke = jokes.get(topic, jokes["random"])
        return {"success": True, "message": joke, "data": {"topic": topic}}

    def _get_quote(self, params: dict) -> dict:
        category = params.get("category", "success").lower()
        quotes = {
            "success": "The only way to do great work is to love what you do. — Steve Jobs",
            "science": "The important thing is not to stop questioning. — Albert Einstein",
            "life":    "In the middle of every difficulty lies opportunity. — Albert Einstein",
        }
        quote = quotes.get(category, quotes["success"])
        return {"success": True, "message": quote, "data": {"category": category}}

"""
O.R.I.O.N. Plugin Base Class
Todos los plugins deben heredar de ORIONPlugin e implementar sus metodos.

Ejemplo minimo:
    class MiPlugin(ORIONPlugin):
        def register_functions(self):
            return [{"name": "mi_funcion", "description": "..."}]
        def execute(self, func_name, params):
            return {"success": True, "message": "Hola!"}
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List


class ORIONPlugin(ABC):
    """
    Clase base para todos los plugins de O.R.I.O.N.
    
    Para crear un plugin:
    1. Crea una carpeta en plugins/ con el nombre de tu plugin
    2. Crea manifest.json con los metadatos
    3. Crea plugin.py con tu clase que hereda de ORIONPlugin
    4. Reinicia O.R.I.O.N. o usa /api/plugins/reload/{nombre}
    """

    plugin_id: str = ""   # Asignado automaticamente por el PluginManager

    # ── CICLO DE VIDA ──────────────────────────────────────────────────────────

    def on_load(self):
        """Llamado cuando el plugin es cargado. Inicializar recursos aqui."""
        pass

    def on_unload(self):
        """Llamado cuando el plugin es descargado. Limpiar recursos aqui."""
        pass

    # ── FUNCIONES ──────────────────────────────────────────────────────────────

    @abstractmethod
    def register_functions(self) -> List[Dict[str, Any]]:
        """
        Devuelve la lista de funciones que este plugin expone al router.
        
        Formato de cada funcion (JSON Schema compatible con FunctionGemma):
        {
            "name": "nombre_funcion",
            "description": "descripcion clara de cuando usar esta funcion",
            "parameters": {
                "type": "object",
                "properties": {
                    "param1": {"type": "string", "description": "..."},
                    "param2": {"type": "integer", "description": "..."}
                },
                "required": ["param1"]
            }
        }
        """
        raise NotImplementedError

    @abstractmethod
    def execute(self, func_name: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Ejecuta una funcion del plugin.
        
        Returns:
            {
                "success": bool,
                "message": str,   # Texto que vera el usuario
                "data": Any       # Datos adicionales opcionales
            }
        """
        raise NotImplementedError

    # ── UTILIDADES (opcionales, se pueden sobreescribir) ───────────────────────

    def get_info(self) -> Dict[str, str]:
        """Informacion basica del plugin."""
        return {
            "id":          self.plugin_id,
            "class":       self.__class__.__name__,
            "functions":   [f["name"] for f in self.register_functions()],
        }

"""
O.R.I.O.N. Plugin System
Carga plugins desde ~/.orion/plugins/ y del directorio plugins/ del proyecto.
Funciona en EXE, APK (via servidor) y web.
"""

import importlib.util
import inspect
import json
import logging
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional, Any

from plugins.plugin_base import ORIONPlugin

log = logging.getLogger("orion.plugins")


class PluginManager:
    """
    Gestor central de plugins de O.R.I.O.N.
    
    Un plugin es una carpeta en plugins/ que contiene:
      - manifest.json  → metadatos (nombre, version, descripcion, autor)
      - plugin.py      → clase que hereda de ORIONPlugin
    
    El plugin manager:
      1. Escanea las carpetas de plugins al arrancar
      2. Carga cada plugin de forma segura (aislado en try/except)
      3. Registra las funciones del plugin en el router de O.R.I.O.N.
      4. Expone /api/plugins para que la UI los gestione
    """

    def __init__(self):
        self._plugins: Dict[str, ORIONPlugin] = {}
        self._manifests: Dict[str, dict]       = {}
        self._search_paths: List[Path]         = []
        self._registered_functions: Dict[str, ORIONPlugin] = {}

        # Directorios de busqueda
        from config import PLUGINS_DIR
        self._search_paths.append(Path(PLUGINS_DIR))                 # ~/.orion/plugins/
        self._search_paths.append(Path(__file__).parent)             # ./plugins/ del proyecto

        log.info("PluginManager inicializado.")
        log.info(f"Rutas de busqueda: {[str(p) for p in self._search_paths]}")

    # ── CARGA ──────────────────────────────────────────────────────────────────

    def discover_and_load(self):
        """Escanea todas las rutas y carga todos los plugins encontrados."""
        for path in self._search_paths:
            if not path.exists():
                continue
            for item in path.iterdir():
                if item.is_dir() and (item / "plugin.py").exists():
                    self._load_plugin(item)

        log.info(f"Plugins cargados: {list(self._plugins.keys())}")
        return self

    def _load_plugin(self, folder: Path):
        """Carga un plugin desde su carpeta."""
        plugin_id = folder.name

        # Leer manifest
        manifest_path = folder / "manifest.json"
        manifest = {}
        if manifest_path.exists():
            try:
                manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            except Exception as e:
                log.warning(f"[{plugin_id}] manifest.json invalido: {e}")

        manifest.setdefault("id",          plugin_id)
        manifest.setdefault("name",        plugin_id)
        manifest.setdefault("version",     "1.0.0")
        manifest.setdefault("description", "Sin descripcion")
        manifest.setdefault("author",      "Desconocido")
        manifest.setdefault("enabled",     True)

        if not manifest.get("enabled", True):
            log.info(f"[{plugin_id}] Deshabilitado en manifest, omitiendo.")
            return

        # Importar plugin.py
        plugin_file = folder / "plugin.py"
        try:
            spec   = importlib.util.spec_from_file_location(f"orion_plugin_{plugin_id}", plugin_file)
            module = importlib.util.module_from_spec(spec)
            sys.modules[f"orion_plugin_{plugin_id}"] = module
            spec.loader.exec_module(module)

            # Buscar la clase que hereda de ORIONPlugin
            plugin_class = None
            for _, obj in inspect.getmembers(module, inspect.isclass):
                if issubclass(obj, ORIONPlugin) and obj is not ORIONPlugin:
                    plugin_class = obj
                    break

            if not plugin_class:
                log.warning(f"[{plugin_id}] No se encontro clase ORIONPlugin en plugin.py")
                return

            instance = plugin_class()
            instance.plugin_id = plugin_id
            instance.on_load()

            self._plugins[plugin_id]    = instance
            self._manifests[plugin_id]  = manifest

            # Registrar funciones
            for fn in instance.register_functions():
                fn_name = fn.get("name", "")
                if fn_name:
                    self._registered_functions[fn_name] = instance
                    log.info(f"[{plugin_id}] Funcion registrada: {fn_name}")

            log.info(f"[{plugin_id}] Plugin cargado: {manifest['name']} v{manifest['version']}")

        except Exception as e:
            log.error(f"[{plugin_id}] Error al cargar: {e}")
            import traceback; traceback.print_exc()

    # ── EJECUCION ──────────────────────────────────────────────────────────────

    def can_handle(self, func_name: str) -> bool:
        """Devuelve True si algun plugin registra esta funcion."""
        return func_name in self._registered_functions

    def execute(self, func_name: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Ejecuta una funcion de plugin."""
        plugin = self._registered_functions.get(func_name)
        if not plugin:
            return {"success": False, "message": f"Funcion de plugin '{func_name}' no encontrada."}
        try:
            return plugin.execute(func_name, params)
        except Exception as e:
            log.error(f"Error ejecutando plugin {func_name}: {e}")
            return {"success": False, "message": str(e)}

    # ── INFORMACION ────────────────────────────────────────────────────────────

    def get_all_plugins_info(self) -> List[dict]:
        """Devuelve info de todos los plugins para la UI."""
        result = []
        for pid, manifest in self._manifests.items():
            plugin  = self._plugins.get(pid)
            fns     = plugin.register_functions() if plugin else []
            result.append({
                **manifest,
                "loaded":    pid in self._plugins,
                "functions": [f.get("name") for f in fns],
            })
        return result

    def get_all_function_schemas(self) -> List[dict]:
        """Devuelve todos los schemas de funciones de plugins (para el router)."""
        schemas = []
        for plugin in self._plugins.values():
            schemas.extend(plugin.register_functions())
        return schemas

    def reload_plugin(self, plugin_id: str) -> str:
        """Recarga un plugin en caliente."""
        if plugin_id in self._plugins:
            try:
                self._plugins[plugin_id].on_unload()
            except Exception:
                pass
            # Limpiar funciones del plugin
            self._registered_functions = {
                k: v for k, v in self._registered_functions.items()
                if v is not self._plugins[plugin_id]
            }
            del self._plugins[plugin_id]

        for path in self._search_paths:
            folder = path / plugin_id
            if folder.exists():
                self._load_plugin(folder)
                return f"Plugin '{plugin_id}' recargado."
        return f"Plugin '{plugin_id}' no encontrado."

    def unload_plugin(self, plugin_id: str) -> str:
        """Descarga un plugin."""
        plugin = self._plugins.get(plugin_id)
        if not plugin:
            return f"Plugin '{plugin_id}' no estaba cargado."
        try:
            plugin.on_unload()
        except Exception:
            pass
        self._registered_functions = {
            k: v for k, v in self._registered_functions.items() if v is not plugin
        }
        del self._plugins[plugin_id]
        return f"Plugin '{plugin_id}' descargado."


# Instancia global
plugin_manager = PluginManager()

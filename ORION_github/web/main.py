"""
O.R.I.O.N. — Web Version
Arranca el servidor FastAPI accesible desde cualquier navegador en la red.
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'shared'))

import uvicorn
from server import create_app
from config import SERVER_HOST, SERVER_PORT

app = create_app(frontend_dir=os.path.join(os.path.dirname(__file__), 'frontend'))

if __name__ == "__main__":
    uvicorn.run("main:app", host=SERVER_HOST, port=SERVER_PORT, reload=False, log_level="info")

@echo off
chcp 65001 >nul
echo O.R.I.O.N. Web — Iniciando...
pip install -r requirements.txt --user -q
python main.py
pause

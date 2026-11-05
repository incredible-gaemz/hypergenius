@echo off
echo Starting PONG MOD on http://localhost:3001 ...
start "" http://localhost:3001
python -m http.server 3001
pause

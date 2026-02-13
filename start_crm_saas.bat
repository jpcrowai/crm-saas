@echo off
REM ==== BACKEND (Python/FastAPI) ====
cd backend

IF NOT EXIST "venv" (
    echo Criando ambiente virtual...
    python -m venv venv
)

REM Activate venv (this only affects current session if called, but we are in bat)
call venv\Scripts\activate.bat

echo Instalando dependencias...
pip install -r requirements.txt

echo Iniciando backend...
start "Backend CRM" cmd /k "call venv\Scripts\activate.bat && uvicorn app.main:app --reload --port 8000"

REM ==== FRONTEND (React/Vite) ====
cd ../frontend

IF NOT EXIST "node_modules" (
    echo Instalando dependencias do frontend...
    npm install
)

echo Iniciando frontend...
start "Frontend CRM" cmd /k "set VITE_API_URL=http://localhost:8000 && npm run dev"

cd ..
echo Backend e frontend iniciados.
pause

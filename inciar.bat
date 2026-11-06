@echo off
echo Iniciando aplicação React com Vite...
echo.

REM 1. Navega para a pasta do projeto
cd /d "C:\App-Aluguel-fev2026"

REM 2. Instala dependências se necessário
if not exist node_modules (
    echo Instalando dependências...
    npm install
)

REM 3. Inicia o servidor Vite em segundo plano
echo Iniciando servidor Vite na porta 5173...
start "Servidor Vite" cmd /k "npm run dev"

REM 4. Aguarda o servidor iniciar
echo Aguardando servidor iniciar...
timeout /t 5 /nobreak >nul

REM 5. Abre o Edge com a aplicação
echo Abrindo Microsoft Edge...
start msedge "http://localhost:5173"

echo.
echo Pronto! A aplicação está rodando.
echo Servidor: http://localhost:5173
echo Pressione qualquer tecla para fechar este console...
pause >nul
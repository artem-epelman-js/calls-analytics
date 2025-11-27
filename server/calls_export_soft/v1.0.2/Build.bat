@echo off
setlocal

:: ===============================
:: Проверка прав администратора
:: ===============================
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"
if '%errorlevel%' NEQ '0' (
    echo [ERROR] Батник должен быть запущен от имени администратора!
    pause
    exit /b 1
)

:: ===============================
:: Пути
:: ===============================
set "SCRIPT_DIR=%~dp0"
set "PS_SCRIPT=%SCRIPT_DIR%ExportCalls.ps1"
set "EXE_FILE=%SCRIPT_DIR%ExportCalls.exe"
set "TASK_NAME=ExportCalls"

:: ===============================
:: Принудительное закрытие EXE, если запущен
:: ===============================
taskkill /IM ExportCalls.exe /F >nul 2>&1

:: ===============================
:: Установка ps2exe если нет
:: ===============================
powershell -Command "if (-not (Get-Module -ListAvailable -Name ps2exe)) { Install-Module -Name ps2exe -Scope CurrentUser -Force -AllowClobber }"

:: ===============================
:: Сборка EXE
:: ===============================
powershell -Command ^
"Set-ExecutionPolicy Bypass -Scope Process -Force; ^
 Import-Module ps2exe; ^
 Invoke-PS2EXE -InputFile '%PS_SCRIPT%' -OutputFile '%EXE_FILE%' -NoConsole"

:: ===============================
:: Создание/замена задачи планировщика
:: ===============================
schtasks /Query /TN "%TASK_NAME%" >nul 2>&1
if %ERRORLEVEL%==0 schtasks /Delete /TN "%TASK_NAME%" /F
schtasks /Create /SC ONLOGON /RL HIGHEST /TN "%TASK_NAME%" /TR "\"%EXE_FILE%\"" /F

:: ===============================
:: Добавление ярлыка в автозагрузку пользователя
:: ===============================
set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT=%STARTUP_DIR%\ExportCalls.lnk"

powershell -Command ^
"$WshShell = New-Object -ComObject WScript.Shell; ^
$Shortcut = $WshShell.CreateShortcut('%SHORTCUT%'); ^
$Shortcut.TargetPath = '%EXE_FILE%'; ^
$Shortcut.WorkingDirectory = '%SCRIPT_DIR%'; ^
$Shortcut.WindowStyle = 7; ^
$Shortcut.Save()"

:: ===============================
:: Финальное сообщение
:: ===============================
if exist "%EXE_FILE%" (
    echo [SUCCESS] EXE успешно создан: %EXE_FILE%
    echo Задача в планировщике создана: %TASK_NAME%
    echo Ярлык в автозагрузке добавлен: %SHORTCUT%
) else (
    echo [ERROR] Не удалось создать EXE.
)

pause
endlocal

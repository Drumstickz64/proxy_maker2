@echo off
setlocal

rem Get the directory of the script
set "script_dir=%~dp0"

rem Check if node_modules directory exists
if exist "%script_dir%node_modules" (
    pnpm run gen
) else (
    echo installing dependencies.
    pnpm i
    pnpm run gen
)


endlocal
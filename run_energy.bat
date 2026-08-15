@echo off
cd /d "%~dp0"

REM IDE ÍRHATSZ KÉZI DÁTUMOT:
REM formátum: YYYY-MM-DD
set MANUAL_DATE=2026-08-14
REM set MANUAL_DATE=2026-08-06

if defined MANUAL_DATE (
    set DATE=%MANUAL_DATE%
) else (
    for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set dt=%%I
    set DATE=%dt:~0,4%-%dt:~4,2%-%dt:~6,2%
)

echo Lekert datum: %DATE%

node callData.js %DATE%

pause
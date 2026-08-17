@echo off
cd /d "C:\Users\Kristof\Desktop\MIX\szelnap"

echo Git add...
git add .

git diff --cached --quiet

if errorlevel 1 (
    echo Commit...
    git commit -m "Automatic update"

    echo Push...
    git push origin main
) else (
    echo Nincs valtozas.
)

echo.
echo Kesz.
pause
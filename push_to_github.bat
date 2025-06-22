@echo off
echo Setting up GitHub repository for StickyCP9...

REM Check if Git is installed
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo Git is not installed or not in the PATH. Please install Git first.
    goto :EOF
)

REM Initialize Git repository if not already initialized
if not exist .git (
    git init
    echo Git repository initialized.
)

REM Add Git remote if not already added
git remote -v | findstr "origin" >nul
if %errorlevel% neq 0 (
    git remote add origin https://github.com/SasidharPV/StickyCP9.git
    echo Remote 'origin' added: https://github.com/SasidharPV/StickyCP9.git
) else (
    echo Remote 'origin' already exists.
)

REM Add all files
git add .
echo Files staged for commit.

REM Prompt for commit message
set /p commit_message=Enter commit message (or press Enter for default): 

if "%commit_message%"=="" (
    set commit_message=Update StickyCP9 application
)

REM Commit changes
git commit -m "%commit_message%"
echo Changes committed with message: %commit_message%

REM Create and push to v1 branch
echo Creating and pushing to v1 branch...
git checkout -b v1
git push -u origin v1

echo.
echo Process completed. Check above for any errors.
echo If this is your first push, you may need to authenticate with GitHub.
echo Visit your v1 branch at: https://github.com/SasidharPV/StickyCP9/tree/v1
echo.
echo To deploy your app to GitHub Pages, run the deploy_to_github_pages.bat script.
echo Once deployed, your app will be available at: https://SasidharPV.github.io/StickyCP9/

pause

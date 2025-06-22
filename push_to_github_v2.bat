@echo off
echo Setting up GitHub repository for StickyCP9 v2 branch...

REM Check if Git is installed
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo Git is not installed or not in the PATH. Please install Git first.
    goto :EOF
)

REM Check if we're on the v2 branch
for /f "tokens=*" %%a in ('git branch --show-current') do set current_branch=%%a
if not "%current_branch%"=="v2" (
    echo Switching to v2 branch...
    git checkout v2 2>nul
    if %errorlevel% neq 0 (
        echo Failed to switch to v2 branch. Please resolve any git issues first.
        goto :EOF
    )
)

REM Add all files
git add .
echo Files staged for commit.

REM Prompt for commit message
set /p commit_message=Enter commit message (or press Enter for default): 

if "%commit_message%"=="" (
    set commit_message=Update StickyCP9 with real OAuth implementation
)

REM Commit changes
git commit -m "%commit_message%"
echo Changes committed with message: %commit_message%

REM Push to GitHub
echo Pushing to GitHub...
git push -u origin v2

echo.
echo Process completed. Check above for any errors.
echo If this is your first push of the v2 branch, you may need to authenticate with GitHub.
echo Visit your v2 branch at: https://github.com/SasidharPV/StickyCP9/tree/v2
echo.
echo IMPORTANT: To enable GitHub Pages for v2, please do these steps:
echo 1. Go to https://github.com/SasidharPV/StickyCP9/settings/pages
echo 2. Under "Build and deployment", select "GitHub Actions" as the source
echo 3. Update the workflow file to use the v2 branch
echo 4. After a few minutes, your site will be available at: https://SasidharPV.github.io/StickyCP9/

pause

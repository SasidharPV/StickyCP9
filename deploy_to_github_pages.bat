@echo off
echo Deploying StickyCP9 to GitHub Pages...

REM Check if Git is installed
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo Git is not installed or not in the PATH. Please install Git first.
    goto :EOF
)

REM Check if we're on the v1 branch
for /f "tokens=*" %%a in ('git branch --show-current') do set current_branch=%%a
if not "%current_branch%"=="v1" (
    echo Switching to v1 branch...
    git checkout v1 2>nul
    if %errorlevel% neq 0 (
        echo Failed to switch to v1 branch. Please resolve any git issues first.
        goto :EOF
    )
)

REM Add all files
git add .
echo Files staged for commit.

REM Prompt for commit message
set /p commit_message=Enter commit message (or press Enter for default): 

if "%commit_message%"=="" (
    set commit_message=Update StickyCP9 application for GitHub Pages
)

REM Commit changes
git commit -m "%commit_message%"
echo Changes committed with message: %commit_message%

REM Push to GitHub to trigger GitHub Pages deployment
echo Pushing to GitHub to trigger deployment...
git push origin v1

echo.
echo Push completed. GitHub Actions should now deploy your site.
echo Visit your GitHub repository's Actions tab to see the deployment progress.
echo Once deployment is complete, your site will be available at:
echo https://SasidharPV.github.io/StickyCP9/

pause

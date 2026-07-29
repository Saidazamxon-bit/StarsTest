@echo off
setlocal
cd /d c:\Users\User\Downloads\StarsTest-fixed
set LOG=c:\temp\git_setup.log
if not exist c:\temp mkdir c:\temp >nul 2>&1
(
  echo === Git setup start ===
  git init
  git config user.name "Copilot"
  git config user.email "copilot@example.com"
  git branch -M main
  git remote remove origin 2>nul
  git remote add origin https://github.com/Saidazamxon-bit/StarsTest.git
  git add .
  git commit -m "Initial local deployment setup"
  git push -u origin main
  echo === Git setup end ===
) > "%LOG%" 2>&1
exit /b 0

@echo off
REM This batch file is used to run tauri dev with MSVC environment
REM Call vcvars64.bat to set up MSVC environment
call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
REM Now run the command
cd /d "C:\Users\10129\Desktop\Projects\DailyMentalMath"
npm run tauri dev

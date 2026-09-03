@echo off
setlocal enabledelayedexpansion
title Kirana Cart - One-click APK build
cd /d "%~dp0"

echo ============================================================
echo   Kirana Cart - one-click Android APK build (Windows)
echo ============================================================
echo.

:: ---------- 1. Node ----------
where node >nul 2>nul
if errorlevel 1 (
  echo [FAIL] Node.js not found. Install it from https://nodejs.org
  echo        then close this window and double-click build-apk.bat again.
  goto :fail
)

:: ---------- 2. Java (JDK 17+, bundled with Android Studio) ----------
if defined JAVA_HOME if exist "%JAVA_HOME%\bin\java.exe" goto :java_ok
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
if exist "%JAVA_HOME%\bin\java.exe" goto :java_ok
set "JAVA_HOME=%LOCALAPPDATA%\Programs\Android Studio\jbr"
if exist "%JAVA_HOME%\bin\java.exe" goto :java_ok
echo [FAIL] No JDK found. Install Android Studio from
echo        https://developer.android.com/studio (it bundles the JDK + SDK),
echo        then double-click build-apk.bat again.
goto :fail
:java_ok
echo [ok] Java:  %JAVA_HOME%

:: ---------- 3. Android SDK ----------
if defined ANDROID_HOME if exist "%ANDROID_HOME%\platform-tools" goto :sdk_ok
set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
if exist "%ANDROID_HOME%\platform-tools" goto :sdk_ok
echo [FAIL] Android SDK not found. Open Android Studio once and let it
echo        finish its first-run setup (it downloads the SDK), then
echo        double-click build-apk.bat again.
goto :fail
:sdk_ok
echo [ok] SDK:   %ANDROID_HOME%

:: ---------- 4. Accept SDK licenses (first run only) ----------
if exist "%ANDROID_HOME%\cmdline-tools\latest\bin\sdkmanager.bat" (
  echo [..] Accepting Android SDK licenses...
  (for /L %%i in (1,1,25) do @echo y) | "%ANDROID_HOME%\cmdline-tools\latest\bin\sdkmanager.bat" --licenses >nul 2>nul
)

echo.
echo [1/5] Installing project dependencies...
call npm install
if errorlevel 1 goto :fail

echo.
echo [2/5] Building the web app into dist\ ...
call npm run build
if errorlevel 1 goto :fail

if not exist "android\" (
  echo.
  echo [3/5] Creating the Android project (first time only)...
  call npx cap add android
  if errorlevel 1 goto :fail
) else (
  echo.
  echo [3/5] Android project already exists - skipping cap add.
)

echo.
echo [4/5] Syncing web build into Android...
call npx cap sync android
if errorlevel 1 goto :fail

echo.
echo [5/5] Compiling the APK with Gradle (first run downloads a lot -
echo       can take several minutes)...
cd android
call gradlew.bat assembleDebug --no-daemon
if errorlevel 1 (
  echo.
  echo [FAIL] Gradle failed. If it mentions Java, re-run with:
  echo        gradlew.bat assembleDebug -Dorg.gradle.java.home="%JAVA_HOME%"
  goto :fail
)

echo.
echo ============================================================
echo   SUCCESS! Your APK is ready:
echo.
echo   %CD%\app\build\outputs\apk\debug\app-debug.apk
echo.
echo   Install it on your phone: copy the file to the phone and open
echo   it (allow "Install unknown apps"), or run:
echo        adb install app\build\outputs\apk\debug\app-debug.apk
echo ============================================================
echo.
explorer "app\build\outputs\apk\debug"
pause
exit /b 0

:fail
echo.
echo Build stopped. Read the [FAIL] message above, fix it, and
echo double-click build-apk.bat again - it resumes where needed.
echo.
pause
exit /b 1

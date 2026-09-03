#!/usr/bin/env bash
# Kirana Cart - one-click Android APK build (macOS / Linux)
set -e
cd "$(dirname "$0")"

echo "============================================================"
echo "  Kirana Cart - one-click Android APK build"
echo "============================================================"

command -v node >/dev/null || { echo "[FAIL] Install Node.js first (https://nodejs.org)"; exit 1; }

# --- Java (bundled with Android Studio) ---
if [ -z "$JAVA_HOME" ] || [ ! -x "$JAVA_HOME/bin/java" ]; then
  for j in \
    "/Applications/Android Studio.app/Contents/jbr/Contents/Home" \
    "$HOME/Applications/Android Studio.app/Contents/jbr/Contents/Home" \
    "$HOME/Android/android-studio/jbr" \
    "/opt/android-studio/jbr"; do
    if [ -x "$j/bin/java" ]; then export JAVA_HOME="$j"; break; fi
  done
fi
[ -x "${JAVA_HOME:-}/bin/java" ] || { echo "[FAIL] No JDK found - install Android Studio (bundles JDK + SDK)"; exit 1; }
echo "[ok] Java: $JAVA_HOME"

# --- Android SDK ---
if [ -z "$ANDROID_HOME" ]; then
  for s in "$HOME/Library/Android/sdk" "$HOME/Android/Sdk"; do
    [ -d "$s/platform-tools" ] && export ANDROID_HOME="$s" && break
  done
fi
[ -n "${ANDROID_HOME:-}" ] || { echo "[FAIL] Android SDK not found - open Android Studio once and finish first-run setup"; exit 1; }
echo "[ok] SDK:  $ANDROID_HOME"

# --- licenses (first run only) ---
SM="$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager"
[ -x "$SM" ] && yes | "$SM" --licenses >/dev/null 2>&1 || true

echo; echo "[1/5] Installing dependencies..."
npm install

echo; echo "[2/5] Building web app..."
npm run build

if [ ! -d android ]; then
  echo; echo "[3/5] Creating Android project (first time only)..."
  npx cap add android
else
  echo; echo "[3/5] Android project exists - skipping cap add."
fi

echo; echo "[4/5] Syncing into Android..."
npx cap sync android

echo; echo "[5/5] Compiling APK (first run downloads a lot)..."
cd android
chmod +x gradlew
./gradlew assembleDebug --no-daemon

echo
echo "============================================================"
echo "  SUCCESS! Your APK is ready:"
echo "  $(pwd)/app/build/outputs/apk/debug/app-debug.apk"
echo "============================================================"

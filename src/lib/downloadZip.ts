/// <reference types="vite/client" />
import JSZip from "jszip";

/* Bundles the real project files into a downloadable source archive so the
   app can be compiled into an Android APK on the user's machine. */

const sourceFiles = import.meta.glob(
  [
    "/src/**/*",
    "/public/**/*.{webmanifest,js,svg,txt}",
    "/index.html",
    "/package.json",
    "/tsconfig.json",
    "/vite.config.js",
    "/capacitor.config.json",
  ],
  { query: "?raw", import: "default" },
) as Record<string, () => Promise<string>>;

const GITIGNORE = `node_modules
dist
android
.gradle
*.log
.DS_Store
local.properties
`;

const README = `# Kirana Cart — Grocery Scanner & Expense Tracker

Offline-first grocery scanner with live running total, budgets, price
history, checklists and on-device trip history. PKR / INR / USD / EUR / GBP.

## Run locally (web)

    npm install
    npm run dev        # opens http://localhost:5173

## Compile the Android APK

Prerequisites: Android Studio (bundles the SDK + JDK 17), then once:

    setx ANDROID_HOME "%LOCALAPPDATA%\\Android\\Sdk"
    setx JAVA_HOME "C:\\Program Files\\Android\\Android Studio\\jbr"

Restart the terminal, then in this folder:

    npm install
    npm run build
    npx cap add android
    npx cap sync
    cd android
    gradlew.bat assembleDebug

Your APK:

    android\\app\\build\\outputs\\apk\\debug\\app-debug.apk

Install it with:  adb install app\\build\\outputs\\apk\\debug\\app-debug.apk

If Gradle can't find Java:

    gradlew.bat assembleDebug -Dorg.gradle.java.home="C:\\Program Files\\Android\\Android Studio\\jbr"

## Notes

- The barcode scanner is a camera-simulated demo. For real capture in the
  APK, swap src/screens/Scanner.tsx internals for ML Kit + CameraX —
  everything downstream (lookup, pricing, totals, history) is unchanged.
- The product database seam lives in src/lib/catalog.ts (swap the API
  provider there, e.g. Open Food Facts).
- All money math is integer-minor-units (no float errors).
- Data lives in localStorage on the device; nothing leaves it.
`;

export async function downloadProjectZip(): Promise<{ name: string; count: number }> {
  const zip = new JSZip();
  const root = zip.folder("kirana-cart");
  if (!root) throw new Error("zip failed");

  let count = 0;
  for (const [path, load] of Object.entries(sourceFiles)) {
    if (path.includes("node_modules") || path.includes("dist/")) continue;
    root.file(path.replace(/^\//, ""), await load());
    count++;
  }

  // binary asset — fetched at runtime instead of raw-bundled
  try {
    const icon = await fetch("/icon-512.png");
    if (icon.ok) {
      root.file("public/icon-512.png", await icon.blob());
      count++;
    }
  } catch {
    /* icon is optional */
  }

  root.file("README.md", README);
  root.file(".gitignore", GITIGNORE);
  count += 2;

  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  const name = "kirana-cart-source.zip";
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 5000);
  return { name, count };
}

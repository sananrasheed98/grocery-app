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
    "/package-lock.json",
    "/tsconfig.json",
    "/vite.config.js",
    "/capacitor.config.json",
    "/build-apk.bat",
    "/build-apk.sh",
    "/README.md",
    "/.github/workflows/android.yml",
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

const UPLOAD_MD = `# Upload to GitHub & get your APK (no Android Studio needed)

1. Go to https://github.com and sign in (free).
2. Click  +  ->  New repository.  Name it e.g. "kirana-cart".
   Keep it PRIVATE.  Do NOT tick "Add a README".  Click  Create repository.
3. On the new repo page click  "uploading an existing file".
4. Drag the CONTENTS of this unzipped folder into the box
   (select all files inside the folder, not the folder itself).
5. Press  Commit changes.
6. Open the  Actions  tab ->  "Build Android APK"  ->  Run workflow.
7. After a few minutes the run finishes. Open it and download the
   artifact  kirana-cart-debug-apk.  That contains your app-debug.apk.
8. Copy the .apk to your phone and open it to install
   (allow "Install unknown apps" when asked).

The workflow file that does the compiling lives at
.github/workflows/android.yml in this folder.
`;

const README = `# Kirana Cart — Grocery Scanner & Expense Tracker

Offline-first grocery scanner with live running total, budgets, price
history, checklists and on-device trip history. PKR / INR / USD / EUR / GBP.

## Run locally (web)

    npm install
    npm run dev        # opens http://localhost:5173

## Compile the Android APK

### Route A - one click (needs Android Studio installed once)

1. Install Android Studio from https://developer.android.com/studio
   (it bundles the JDK + Android SDK). Open it once and let the
   first-run setup finish downloading the SDK.
2. Double-click  **build-apk.bat**  (Windows) or run  **./build-apk.sh**
   (macOS / Linux) in this folder.

The script finds Java and the SDK, accepts licenses, builds everything
and opens the folder containing your APK:

    android\\app\\build\\outputs\\apk\\debug\\app-debug.apk

### Route B - build in the cloud with GitHub (no Android Studio needed)

1. Create a free account on https://github.com and click **New repository**
   (any name, keep it Private, create it).
2. Open the repo, click **uploading an existing file**, drag the
   *contents* of this unzipped folder into the box, and commit.
3. Go to the **Actions** tab -> **Build Android APK** -> **Run workflow**.
4. When it finishes (a few minutes), open the run and download the
   **kirana-cart-debug.apk** artifact. That file is your app.

### Manual commands (if you prefer the terminal)

    npm install
    npm run build
    npx cap add android
    npx cap sync
    cd android
    gradlew.bat assembleDebug        (Windows)
    ./gradlew assembleDebug          (macOS / Linux)

If Gradle can't find Java:

    gradlew.bat assembleDebug -Dorg.gradle.java.home="C:\\Program Files\\Android\\Android Studio\\jbr"

Install the APK on your phone by copying the file over and opening it
(allow "Install unknown apps"), or:  adb install app-debug.apk

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
  root.file("UPLOAD-TO-GITHUB.md", UPLOAD_MD);
  count += 3;

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

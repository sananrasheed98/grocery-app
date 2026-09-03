# Kirana Cart — Grocery Scanner & Expense Tracker

Offline-first grocery shopping companion: scan products, enter prices, watch the
running total, stay under budget, and keep price history — all on-device.

## Features

- Barcode scanner flow (EAN-13 / UPC with real check digits) + manual entry fallback
- Live running total on every screen (hidden while the camera is open)
- Price × quantity entry with integer money math (no float errors)
- Duplicate-product handling (increase qty / separate line / cancel)
- Budget tracker with green / amber / red states
- Shopping checklist that auto-ticks when a product is scanned
- Receipt-style checkout with discounts, tax and extra charges
- On-device trip history with stats (week / month / average / most expensive)
- Per-product price history with trend sparkline
- Bill verification: capture the printed bill and highlight mismatches vs your list
- Currencies: INR · PKR · USD · EUR · GBP — dark / light / system themes
- JSON / CSV export & import, offline mode, session auto-restore

## Run locally (web)

```
npm install
npm run dev
```

## Compile the Android APK

### Route A — one click (needs Android Studio installed once)

1. Install Android Studio from <https://developer.android.com/studio>
   (bundles the JDK + SDK). Open it once and let first-run setup finish.
2. Double-click **`build-apk.bat`** (Windows) or run **`./build-apk.sh`**
   (macOS / Linux) in this folder.

The script locates Java and the SDK, accepts licenses, builds everything and
opens the folder containing your APK:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Route B — compile in the cloud with GitHub Actions (no Android Studio)

1. Create a repo on <https://github.com> (any name, Private is fine).
2. Upload the **contents** of this folder to the repo (drag & drop on the
   repo page works).
3. Open the **Actions** tab → **Build Android APK** → **Run workflow**.
4. When it finishes, download the **kirana-cart-debug.apk** artifact.

### Manual commands

```
npm install
npm run build
npx cap add android
npx cap sync
cd android
gradlew.bat assembleDebug     # Windows
./gradlew assembleDebug       # macOS / Linux
```

## Notes

- The scanner is a camera-simulated demo. For real capture in the APK, swap
  the internals of `src/screens/Scanner.tsx` for ML Kit + CameraX —
  everything downstream (lookup, pricing, totals, history) is unchanged.
- The product database seam lives in `src/lib/catalog.ts`
  (swap the provider, e.g. Open Food Facts).
- All data lives in localStorage on the device; nothing leaves it.

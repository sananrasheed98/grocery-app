import { useEffect, useRef, useState } from "react";
import { beep, buzz, cx, isValidBarcode } from "../lib/core";
import { demoShelf, fullCode, randomProduct } from "../lib/catalog";
import { useStore } from "../lib/store";
import { EanBarcode } from "../components/ProductArt";
import { ICamera, ICameraOff, IFlash, IKey, IScan, IX } from "../components/Icons";
import { useToast } from "../components/ui";

export function Scanner({ onDetect, onClose }: { onDetect: (code: string) => void; onClose: () => void }) {
  const { state, setSettings } = useStore();
  const { push } = useToast();
  const [torch, setTorch] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const [manualErr, setManualErr] = useState("");
  const [permOpen, setPermOpen] = useState(!state.settings.cameraAllowed);
  const busy = useRef(false);
  const autoFired = useRef(false);

  const allowed = state.settings.cameraAllowed;

  const detect = (code: string) => {
    if (busy.current) return; // debounce accidental double scans
    busy.current = true;
    setFlash(code);
    beep(state.settings.sound);
    buzz(state.settings.vibrate, [40, 40, 60]);
    window.setTimeout(() => onDetect(code), 620);
  };

  /* demo auto-detection shortly after the viewfinder opens */
  useEffect(() => {
    if (!allowed || !state.settings.autoScan || autoFired.current) return;
    autoFired.current = true;
    const t = window.setTimeout(() => detect(fullCode(randomProduct())), 2400);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed, state.settings.autoScan]);

  const submitManual = () => {
    const code = manual.trim();
    if (!isValidBarcode(code)) {
      setManualErr("Enter a valid EAN-13, EAN-8 or UPC code (8 or 12–13 digits).");
      buzz(state.settings.vibrate, 80);
      return;
    }
    setManualErr("");
    detect(code);
  };

  const corners = "absolute h-7 w-7 border-[#7ee2b0]";

  return (
    <div className="anim-fade absolute inset-0 z-50 flex flex-col bg-[#060a08] text-[#e9f3ec]">
      {/* top bar */}
      <div className="flex items-center justify-between px-4 pb-1 pt-3">
        <button onClick={onClose} className="press flex h-10 w-10 items-center justify-center rounded-full bg-white/10" aria-label="Close scanner">
          <IX size={18} />
        </button>
        <div className="flex items-center gap-2 font-display text-[15px] font-bold tracking-wide">
          <IScan size={17} className="text-[#7ee2b0]" />
          SCANNER
        </div>
        <button
          onClick={() => {
            setTorch((t) => !t);
            buzz(state.settings.vibrate, 25);
          }}
          className={cx(
            "press flex h-10 w-10 items-center justify-center rounded-full",
            torch ? "bg-[#f2c94c] text-[#241a04]" : "bg-white/10 text-white/80",
          )}
          aria-label="Toggle flashlight"
        >
          <IFlash size={18} />
        </button>
      </div>

      {/* viewfinder */}
      <div className="relative mx-4 mt-2 flex-1 overflow-hidden rounded-[20px] border border-white/10">
        <div
          className={cx(
            "absolute inset-0 transition-all duration-500",
            torch ? "brightness-[1.75]" : "",
          )}
          style={{
            background:
              "radial-gradient(120% 90% at 50% 30%, #17301f 0%, #0c1a12 45%, #060d09 100%)",
          }}
        >
          <div className="vf-grid absolute inset-0" />
          {/* faint shelf silhouettes */}
          <svg viewBox="0 0 320 300" className="absolute inset-x-0 bottom-0 w-full opacity-[0.16]">
            <rect x="14" y="170" width="34" height="70" rx="5" fill="#9fd8b4" />
            <rect x="58" y="140" width="30" height="100" rx="6" fill="#9fd8b4" />
            <circle cx="122" cy="205" r="32" fill="#9fd8b4" />
            <rect x="170" y="160" width="40" height="80" rx="8" fill="#9fd8b4" />
            <rect x="222" y="130" width="26" height="110" rx="5" fill="#9fd8b4" />
            <rect x="258" y="175" width="48" height="65" rx="9" fill="#9fd8b4" />
            <rect x="0" y="240" width="320" height="5" fill="#9fd8b4" />
          </svg>
          <div className="absolute inset-0" style={{ boxShadow: "inset 0 0 90px rgba(0,0,0,0.75)" }} />
        </div>

        {flash ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0a1a11]/70">
            <div className="vf-flash absolute inset-0" />
            <div className="anim-pop flex h-14 w-14 items-center justify-center rounded-full bg-[#45c482] text-[#062315]">
              <IScan size={26} />
            </div>
            <p className="font-mono text-[15px] font-semibold tracking-[0.18em]">{flash}</p>
            <p className="text-[12px] text-[#9fd8b4]">Barcode detected — looking up product…</p>
          </div>
        ) : allowed ? (
          <>
            <span className={cx(corners, "left-4 top-4 rounded-tl-md border-l-[3px] border-t-[3px]")} />
            <span className={cx(corners, "right-4 top-4 rounded-tr-md border-r-[3px] border-t-[3px]")} />
            <span className={cx(corners, "bottom-4 left-4 rounded-bl-md border-b-[3px] border-l-[3px]")} />
            <span className={cx(corners, "bottom-4 right-4 rounded-br-md border-b-[3px] border-r-[3px]")} />
            <div className="laser" />
            <div className="absolute inset-x-0 bottom-5 text-center">
              <p className="text-[12.5px] font-medium text-white/75">
                {state.settings.autoScan ? "Scanning… align a barcode inside the frame" : "Point the camera at a barcode"}
              </p>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
              <ICameraOff size={26} className="text-white/70" />
            </div>
            <p className="font-display text-[16px] font-bold">Camera is off</p>
            <p className="text-[12.5px] leading-relaxed text-white/60">
              Enable the camera to scan, or fall back to typing the barcode under the pack.
            </p>
            <button
              onClick={() => setPermOpen(true)}
              className="press mt-1 flex items-center gap-2 rounded-full bg-[#45c482] px-5 py-2.5 text-[13px] font-bold text-[#062315]"
            >
              <ICamera size={16} /> Enable camera
            </button>
          </div>
        )}
      </div>

      {/* demo shelf + manual entry */}
      <div className="px-4 pb-4 pt-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-white/45">
            Demo shelf · tap a pack to scan
          </p>
          <button
            onClick={() => detect(fullCode(randomProduct()))}
            className="press rounded-full border border-white/15 px-3 py-1 text-[11px] font-semibold text-[#9fd8b4]"
          >
            Surprise me
          </button>
        </div>
        <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1">
          {demoShelf().map((p) => {
            const code = fullCode(p);
            return (
              <button
                key={p.id}
                onClick={() => detect(code)}
                className="press w-[118px] flex-none rounded-[12px] border border-white/12 bg-white/[0.07] p-2.5 text-left hover:bg-white/[0.12]"
              >
                <EanBarcode code={code} height={22} digits={false} className="text-[#e9f3ec]" />
                <p className="mt-1.5 truncate text-[11px] font-semibold text-white/85">{p.name}</p>
                <p className="text-[10px] text-white/40">{p.pack}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-3">
          <div className={cx(
            "flex items-center gap-2 rounded-[13px] border bg-white/[0.07] px-3 py-2.5",
            manualErr ? "border-[#e0705f]" : "border-white/12 focus-within:border-[#45c482]/70",
          )}>
            <IKey size={16} className="flex-none text-white/40" />
            <input
              value={manual}
              onChange={(e) => {
                setManual(e.target.value.replace(/\D/g, "").slice(0, 13));
                setManualErr("");
              }}
              onKeyDown={(e) => e.key === "Enter" && submitManual()}
              inputMode="numeric"
              placeholder="Type barcode manually…"
              className="w-full bg-transparent font-mono text-[14px] tracking-wider text-white placeholder:text-white/30"
              aria-label="Manual barcode entry"
            />
            <button
              onClick={submitManual}
              className="press rounded-full bg-[#45c482] px-3.5 py-1.5 text-[12px] font-bold text-[#062315]"
            >
              Look up
            </button>
          </div>
          {manualErr && <p className="mt-1.5 text-[11.5px] text-[#f0a196]">{manualErr}</p>}
        </div>
      </div>

      {/* permission rationale */}
      {permOpen && (
        <div className="absolute inset-0 z-10 flex items-end justify-center">
          <button aria-label="Dismiss" className="anim-fade absolute inset-0 w-full bg-black/60" onClick={() => setPermOpen(false)} />
          <div className="anim-rise relative m-4 w-full rounded-[20px] border border-white/10 bg-[#0f1a13] p-5">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-[#45c482]/15 text-[#7ee2b0]">
                <ICamera size={22} />
              </div>
              <div>
                <h3 className="font-display text-[16px] font-bold text-white">Allow camera access?</h3>
                <p className="mt-1 text-[12.5px] leading-relaxed text-white/60">
                  Kirana Cart uses the camera <strong className="text-white/85">only</strong> to read barcodes while you shop.
                  Frames are processed on-device and never uploaded. You can switch to manual entry any time.
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-2.5">
              <button
                onClick={() => setPermOpen(false)}
                className="press flex-1 rounded-full border border-white/15 py-2.5 text-[13px] font-semibold text-white/70"
              >
                Not now
              </button>
              <button
                onClick={() => {
                  setSettings({ cameraAllowed: true });
                  setPermOpen(false);
                  autoFired.current = true;
                  push("Camera enabled — happy scanning");
                }}
                className="press flex-1 rounded-full bg-[#45c482] py-2.5 text-[13px] font-bold text-[#062315]"
              >
                Allow camera
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

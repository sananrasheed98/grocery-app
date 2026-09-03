import { useRef, useState } from "react";
import type { CurrencyCode } from "../lib/core";
import { CURRENCY_SYMBOL, cx, parseMoney } from "../lib/core";
import { downloadProjectZip } from "../lib/downloadZip";
import { useStore } from "../lib/store";
import {
  ICamera,
  IDownload,
  IInfo,
  IScan,
  IShield,
  ISound,
  ITrash,
  IUpload,
  IVibrate,
  IWifiOff,
} from "../components/Icons";
import { Modal, MoneyInput, Seg, SectionLabel, Stepper, Toggle, useToast } from "../components/ui";

const m2s = (m: number) => (m === 0 ? "" : (m / 100).toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1"));

function download(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function SettingsTab() {
  const store = useStore();
  const { state } = store;
  const s = state.settings;
  const { push } = useToast();
  const [budgetRaw, setBudgetRaw] = useState(m2s(s.budget));
  const [clearOpen, setClearOpen] = useState(false);
  const [zipping, setZipping] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const commitBudget = (raw: string) => {
    setBudgetRaw(raw);
    const v = parseMoney(raw);
    store.setSettings({ budget: v ?? 0 });
  };

  const onImportFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      const text = await f.text();
      if (store.importJSON(text)) push("Data imported — welcome back");
      else push("That file doesn’t look like a Kirana Cart export", "err");
    } catch {
      push("Couldn’t read that file", "err");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const Row = ({ icon, label, hint, children }: { icon: React.ReactNode; label: string; hint?: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-surface text-soft ring-1 ring-line">{icon}</span>
        <div className="min-w-0">
          <p className="text-[13.5px] font-bold leading-tight">{label}</p>
          {hint && <p className="mt-0.5 text-[11px] leading-snug text-faint">{hint}</p>}
        </div>
      </div>
      {children}
    </div>
  );

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-2 pt-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-faint">Tuned to your store</p>
        <h1 className="font-display text-[24px] font-extrabold leading-tight">Settings</h1>
      </div>

      <div className="stagger flex-1 space-y-3 overflow-y-auto px-5 pb-6 scroll-thin">
        <div>
          <SectionLabel>Money</SectionLabel>
          <div className="divide-y divide-line rounded-[16px] border border-line bg-raise">
            <div className="px-4 py-3">
              <p className="mb-2 text-[13.5px] font-bold">Currency</p>
              <Seg<CurrencyCode>
                value={s.currency}
                onChange={(c) => { store.setSettings({ currency: c }); push(`Currency set to ${CURRENCY_SYMBOL[c]}`); }}
                options={[
                  { v: "INR", label: "₹ INR" },
                  { v: "PKR", label: "Rs PKR" },
                  { v: "USD", label: "$ USD" },
                  { v: "EUR", label: "€ EUR" },
                  { v: "GBP", label: "£ GBP" },
                ]}
              />
            </div>
            <div className="px-4 py-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[13.5px] font-bold">Default budget</p>
                <div className="flex gap-1.5">
                  {[100000, 250000, 500000].map((v) => (
                    <button key={v} onClick={() => commitBudget(m2s(v))}
                      className="press rounded-full bg-surface px-2.5 py-1 font-mono text-[10.5px] font-semibold text-soft ring-1 ring-line">
                      {v / 100 / 1000}k
                    </button>
                  ))}
                  <button onClick={() => commitBudget("")}
                    className="press rounded-full bg-surface px-2.5 py-1 font-mono text-[10.5px] font-semibold text-soft ring-1 ring-line">
                    off
                  </button>
                </div>
              </div>
              <MoneyInput raw={budgetRaw} onRaw={commitBudget} currency={s.currency} placeholder="No budget" />
              <p className="mt-1.5 text-[11px] text-faint">Green under 70%, amber as you approach it, red when crossed.</p>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-[13.5px] font-bold">Default quantity</p>
              <Stepper value={s.defaultQty} onChange={(v) => store.setSettings({ defaultQty: v })} min={1} max={12} />
            </div>
          </div>
        </div>

        <div>
          <SectionLabel>Appearance</SectionLabel>
          <div className="rounded-[16px] border border-line bg-raise px-4 py-3">
            <Seg
              value={s.theme}
              onChange={(t) => store.setSettings({ theme: t })}
              options={[
                { v: "system" as const, label: "System" },
                { v: "light" as const, label: "Light" },
                { v: "dark" as const, label: "Dark" },
              ]}
            />
          </div>
        </div>

        <div>
          <SectionLabel>Scanner & feedback</SectionLabel>
          <div className="divide-y divide-line rounded-[16px] border border-line bg-raise">
            <Row icon={<IScan size={15} />} label="Auto-detect demo" hint="Simulated camera locks onto a barcode a moment after opening">
              <Toggle on={s.autoScan} onChange={(v) => store.setSettings({ autoScan: v })} label="Auto scan" />
            </Row>
            <Row icon={<ISound size={15} />} label="Scan sound" hint="Short chirp on a successful read">
              <Toggle on={s.sound} onChange={(v) => store.setSettings({ sound: v })} label="Sound" />
            </Row>
            <Row icon={<IVibrate size={15} />} label="Vibration" hint="Haptic tick when a barcode is captured">
              <Toggle on={s.vibrate} onChange={(v) => store.setSettings({ vibrate: v })} label="Vibration" />
            </Row>
            <Row icon={<ICamera size={15} />} label="Camera permission" hint={s.cameraAllowed ? "Granted — scanner viewfinder is live" : "Denied — manual entry still works"}>
              <Toggle on={s.cameraAllowed} onChange={(v) => store.setSettings({ cameraAllowed: v })} label="Camera" />
            </Row>
          </div>
        </div>

        <div>
          <SectionLabel>Connection</SectionLabel>
          <div className="rounded-[16px] border border-line bg-raise">
            <Row icon={<IWifiOff size={15} />} label="Simulate no internet" hint="Product lookups fail — manual entry keeps the flow moving, totals never stop">
              <Toggle on={s.offline} onChange={(v) => { store.setSettings({ offline: v }); push(v ? "Offline mode on — lookups will fail" : "Back online", v ? "warn" : "ok"); }} label="Offline" />
            </Row>
          </div>
        </div>

        <div>
          <SectionLabel>Data</SectionLabel>
          <div className="divide-y divide-line rounded-[16px] border border-line bg-raise">
            <div className="grid grid-cols-2 gap-2.5 p-4">
              <button onClick={() => { download("kirana-cart-backup.json", store.exportJSON(), "application/json"); push("Backup exported"); }}
                className="press flex items-center justify-center gap-2 rounded-full border border-line bg-surface py-2.5 text-[12.5px] font-bold text-soft">
                <IDownload size={15} /> Export JSON
              </button>
              <button onClick={() => { download("kirana-cart-history.csv", store.exportCSV(), "text/csv"); push("CSV exported"); }}
                className="press flex items-center justify-center gap-2 rounded-full border border-line bg-surface py-2.5 text-[12.5px] font-bold text-soft">
                <IDownload size={15} /> Export CSV
              </button>
              <button onClick={() => fileRef.current?.click()}
                className="press flex items-center justify-center gap-2 rounded-full border border-line bg-surface py-2.5 text-[12.5px] font-bold text-soft">
                <IUpload size={15} /> Import JSON
              </button>
              <button onClick={() => setClearOpen(true)}
                className="press flex items-center justify-center gap-2 rounded-full border border-danger/35 bg-danger-soft py-2.5 text-[12.5px] font-bold text-danger">
                <ITrash size={15} /> Clear history
              </button>
              <input ref={fileRef} type="file" accept="application/json,.json" className="hidden"
                onChange={(e) => onImportFile(e.target.files?.[0])} />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[16px] border border-brand/25 bg-brand-soft">
          <div className="p-4">
            <div className="flex items-center gap-2">
              <IDownload size={16} className="text-brand" />
              <p className="font-display text-[14px] font-bold text-brand-deep dark:text-brand">Take the source with you</p>
            </div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-brand-deep/85 dark:text-brand/80">
              Full project ZIP with two routes to the APK:
            </p>
            <ul className="mt-1.5 space-y-1 text-[11.5px] leading-relaxed text-brand-deep/85 dark:text-brand/80">
              <li><strong>One click</strong> — install Android Studio once, then double-click <span className="font-mono text-[10.5px]">build-apk.bat</span>. It does the rest and opens the APK folder.</li>
              <li><strong>No Android Studio</strong> — upload the unzipped folder to a GitHub repo; the included Actions workflow compiles the APK in the cloud.</li>
            </ul>
          </div>
          <div className="px-4 pb-4">
            <button
              disabled={zipping}
              onClick={async () => {
                setZipping(true);
                try {
                  const { name, count } = await downloadProjectZip();
                  push(`${name} saved — ${count} files zipped`);
                } catch {
                  push("Couldn’t build the ZIP — try again", "err");
                } finally {
                  setZipping(false);
                }
              }}
              className="press flex w-full items-center justify-center gap-2 rounded-full bg-brand py-3 text-[13.5px] font-bold text-white shadow-lg shadow-brand/25 disabled:opacity-70"
            >
              <IDownload size={16} className={cx(zipping && "animate-bounce")} />
              {zipping ? "Zipping project…" : "Download project files (.zip)"}
            </button>
          </div>
        </div>

        <div className="rounded-[16px] border border-line bg-raise p-4">
          <div className="flex items-center gap-2">
            <IShield size={16} className="text-brand" />
            <p className="font-display text-[14px] font-bold">Privacy</p>
          </div>
          <p className="mt-1.5 text-[12px] leading-relaxed text-soft">
            Everything — baskets, trips, price history, checklists — lives in this device’s local storage.
            When you scan, <strong className="text-ink">only the barcode digits</strong> are sent to the product database;
            nothing about you, your location or your spending is attached.
          </p>
        </div>

        <div className="rounded-[16px] border border-line bg-raise p-4">
          <div className="flex items-center gap-2">
            <IInfo size={16} className="text-faint" />
            <p className="font-display text-[14px] font-bold">About</p>
          </div>
          <p className="mt-1.5 text-[12px] leading-relaxed text-soft">
            Kirana Cart v1.0 · offline-first grocery scanner. Your unfinished basket restores automatically if the app
            closes mid-shop. The product lookup is a replaceable API seam (<span className="font-mono text-[11px]">lib/catalog.ts</span>) —
            point it at Open Food Facts, GS1 or your own service.
          </p>
        </div>
      </div>

      <Modal
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        title="Clear all history?"
        actions={
          <>
            <button onClick={() => setClearOpen(false)} className="press flex-1 rounded-full border border-line bg-surface py-2.5 text-[13px] font-semibold text-soft">
              Cancel
            </button>
            <button onClick={() => { store.clearHistory(); setClearOpen(false); push("History cleared", "warn"); }}
              className="press flex-1 rounded-full bg-danger py-2.5 text-[13px] font-bold text-white">
              Clear everything
            </button>
          </>
        }
      >
        All {state.trips.length} saved trip{state.trips.length === 1 ? "" : "s"} will be removed from this device. The current basket is untouched.
      </Modal>
    </div>
  );
}

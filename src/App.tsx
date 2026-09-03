import { useEffect, useState, type ReactNode } from "react";
import { cx, fmtMoney } from "./lib/core";
import { downloadProjectZip } from "./lib/downloadZip";
import { AppProvider, cartSubtotal, cartUnits, useStore } from "./lib/store";
import { ToastProvider } from "./components/ui";
import { EanBarcode } from "./components/ProductArt";
import {
  IBasket,
  IClock,
  IDownload,
  IGear,
  IListChecks,
  IReceipt,
  IScan,
  IWallet,
  IWifiOff,
} from "./components/Icons";
import { Scanner } from "./screens/Scanner";
import { AddFlow } from "./screens/AddFlow";
import { ShopTab } from "./screens/ShopTab";
import { Checkout } from "./screens/Checkout";
import { HistoryTab, TripDetail } from "./screens/HistoryTab";
import { ListsTab } from "./screens/ListsTab";
import { SettingsTab } from "./screens/SettingsTab";
import { BillCamera, BillCompare } from "./screens/BillCheck";
import type { BillResult } from "./lib/billcheck";

type Tab = "shop" | "lists" | "history" | "settings";
type Screen =
  | { t: "add"; code: string; k: number }
  | { t: "checkout" }
  | { t: "trip"; id: string }
  | { t: "billcam" }
  | { t: "compare"; res: BillResult; k: number };

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}

/* ============================== shell ============================== */

function Shell() {
  const store = useStore();
  const { state, isDark } = store;
  const [tab, setTab] = useState<Tab>("shop");
  const [stack, setStack] = useState<Screen[]>([]);
  const [scannerOpen, setScannerOpen] = useState(false);

  const total = cartSubtotal(state.cart);
  const units = cartUnits(state.cart);
  const top = stack[stack.length - 1];

  const openScanner = () => {
    setStack([]);
    setScannerOpen(true);
  };
  const push = (s: Screen) => setStack((st) => [...st, s]);
  const pop = () => setStack((st) => st.slice(0, -1));

  /* keyboard: S = scan, Esc = back */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        openScanner();
      } else if (e.key === "Escape") {
        if (scannerOpen) setScannerOpen(false);
        else pop();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannerOpen]);

  let content: ReactNode;
  if (top) {
    if (top.t === "add")
      content = (
        <AddFlow
          key={top.k}
          barcode={top.code}
          onBack={pop}
          onScanNext={() => { setStack([]); setTab("shop"); setScannerOpen(true); }}
          onViewList={() => { setStack([]); setTab("shop"); }}
        />
      );
    else if (top.t === "checkout")
      content = (
        <Checkout
          onBack={pop}
          onGoHistory={() => { setStack([]); setTab("history"); }}
          onVerify={() => push({ t: "billcam" })}
        />
      );
    else if (top.t === "billcam")
      content = (
        <BillCamera
          onClose={pop}
          onDone={(res) => setStack([{ t: "compare", res, k: Date.now() }])}
        />
      );
    else if (top.t === "compare")
      content = (
        <BillCompare
          result={top.res}
          onRetake={() => setStack([{ t: "billcam" }])}
          onDone={() => setStack([])}
        />
      );
    else {
      const trip = state.trips.find((t) => t.id === top.id);
      content = trip ? (
        <TripDetail trip={trip} onBack={pop} onDelete={(id) => { store.deleteTrip(id); setStack([]); }} />
      ) : (
        <HistoryTab onOpenTrip={(id) => push({ t: "trip", id })} />
      );
    }
  } else {
    content =
      tab === "shop" ? (
        <ShopTab
          onScan={openScanner}
          onCheckout={() => push({ t: "checkout" })}
          onVerify={() => push({ t: "billcam" })}
          onProduct={(code) => push({ t: "add", code, k: Date.now() })}
          onGoLists={() => setTab("lists")}
          onGoHistory={() => setTab("history")}
        />
      ) : tab === "lists" ? (
        <ListsTab />
      ) : tab === "history" ? (
        <HistoryTab onOpenTrip={(id) => push({ t: "trip", id })} />
      ) : (
        <SettingsTab />
      );
  }

  const isCamera = scannerOpen || top?.t === "billcam";
  const showTotal = !isCamera && top?.t !== "checkout" && top?.t !== "compare";
  const mainKey = scannerOpen
    ? "scan"
    : top
      ? top.t === "add"
        ? `add${top.k}`
        : top.t === "trip"
          ? `trip${top.id}`
          : top.t === "compare"
            ? `compare${top.k}`
            : top.t
      : tab;

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden sm:gap-14 sm:px-8 lg:gap-20">
      <Ambient />

      {/* desktop side rail */}
      <aside className="relative z-10 hidden w-[300px] flex-none flex-col lg:flex">
        <div className="flex items-center gap-3.5">
          <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#146b43] text-[#eafff3] shadow-lg shadow-[#146b43]/40">
            <IBasket size={25} />
          </span>
          <div>
            <p className="font-display text-[30px] font-extrabold leading-none text-[#f0f6ef]">
              Kirana<span className="text-[#45c482]">Cart</span>
            </p>
            <p className="mt-1 text-[11.5px] font-semibold tracking-wide text-[#7d917f]">
              Grocery scanner · expense tracker
            </p>
          </div>
        </div>

        <p className="mt-5 text-[13px] leading-relaxed text-[#93a596]">
          Scan the pack, type the price, and the running total — with budget warnings and price
          memory — does the rest. Built for one-handed shopping.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2.5">
          <RailStat label="Live total" value={fmtMoney(total, state.settings.currency)} icon={<IWallet size={14} />} />
          <RailStat label="In basket" value={`${units} item${units === 1 ? "" : "s"}`} icon={<IBasket size={14} />} />
          <RailStat label="Trips saved" value={String(state.trips.length)} icon={<IClock size={14} />} />
          <RailStat
            label="List to buy"
            value={`${state.checklist.filter((c) => !c.done).length} left`}
            icon={<IListChecks size={14} />}
          />
        </div>

        <div className="mt-6 space-y-2.5 border-t border-white/8 pt-5 text-[12px] text-[#7d917f]">
          {[
            [<IScan key="i" size={14} />, "EAN-13 / UPC scanner · real check digits"],
            [<IReceipt key="i" size={14} />, "Receipt checkout → on-device history"],
            [<IWifiOff key="i" size={14} />, "Offline-first · session auto-restores"],
          ].map(([ic, txt], i) => (
            <p key={i} className="flex items-center gap-2.5">
              <span className="text-[#45c482]">{ic}</span>
              {txt}
            </p>
          ))}
        </div>

        <RailDownload />

        <p className="mt-6 text-[11px] text-[#5c6e5e]">
          <kbd className="rounded-md border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-[#93a596]">S</kbd>{" "}
          open scanner ·{" "}
          <kbd className="rounded-md border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-[#93a596]">Esc</kbd>{" "}
          back · camera scanning is simulated with demo barcodes
        </p>
      </aside>

      {/* phone */}
      <div
        className={cx(
          "relative z-10 flex h-dvh w-full flex-col overflow-hidden bg-surface text-ink transition-colors duration-300",
          "sm:h-[min(860px,94dvh)] sm:w-[396px] sm:flex-none sm:rounded-[42px] sm:border-[6px] sm:border-[#060a08] sm:shadow-[0_50px_140px_-20px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.07)]",
          isDark && "dark",
        )}
      >
        <ToastProvider>
          <StatusBar hidden={scannerOpen} />
          <main key={mainKey} className="anim-fade min-h-0 flex-1">
            {content}
          </main>
          {showTotal && <TotalBar onCheckout={() => push({ t: "checkout" })} />}
          <BottomNav tab={tab} onSelect={(t) => { setTab(t); setStack([]); }} hidden={scannerOpen} />
          {scannerOpen && (
            <Scanner
              onClose={() => setScannerOpen(false)}
              onDetect={(code) => {
                setScannerOpen(false);
                push({ t: "add", code, k: Date.now() });
              }}
            />
          )}
        </ToastProvider>
      </div>
    </div>
  );
}

/* ============================== bits ============================== */

function RailDownload() {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  return (
    <button
      disabled={state === "busy"}
      onClick={async () => {
        setState("busy");
        try {
          await downloadProjectZip();
          setState("done");
          window.setTimeout(() => setState("idle"), 4000);
        } catch {
          setState("idle");
        }
      }}
      className="press mt-6 flex items-center justify-center gap-2.5 rounded-full border border-[#45c482]/30 bg-[#45c482]/10 py-3 text-[13px] font-bold text-[#8fe6ba] transition-colors hover:bg-[#45c482]/20"
    >
      <IDownload size={16} className={cx(state === "busy" && "animate-bounce")} />
      {state === "busy" ? "Zipping project…" : state === "done" ? "Saved — check Downloads" : "Download app files (.zip)"}
    </button>
  );
}

function RailStat({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="rounded-[14px] border border-white/8 bg-white/[0.04] px-3.5 py-3">
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#5c6e5e]">
        <span className="text-[#45c482]">{icon}</span> {label}
      </p>
      <p key={value} className="anim-total mt-1 truncate font-mono text-[16px] font-bold tabular-nums text-[#e7efe7]">
        {value}
      </p>
    </div>
  );
}

function StatusBar({ hidden }: { hidden: boolean }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 20_000);
    return () => window.clearInterval(t);
  }, []);
  if (hidden) return null;
  return (
    <div className="flex h-9 flex-none items-center justify-between px-7">
      <span className="font-mono text-[12.5px] font-semibold tabular-nums">
        {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
      </span>
      <span className="flex items-center gap-1.5 text-ink/80">
        <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor" aria-hidden>
          <rect x="0" y="7" width="2.6" height="4" rx="0.8" />
          <rect x="4.1" y="5" width="2.6" height="6" rx="0.8" />
          <rect x="8.2" y="2.6" width="2.6" height="8.4" rx="0.8" />
          <rect x="12.3" y="0" width="2.6" height="11" rx="0.8" opacity="0.35" />
        </svg>
        <svg width="15" height="11" viewBox="0 0 24 18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
          <path d="M2.5 6.5a14 14 0 0 1 19 0" />
          <path d="M5.8 10.2a9 9 0 0 1 12.4 0" />
          <path d="M9.2 13.8a4.4 4.4 0 0 1 5.6 0" />
          <circle cx="12" cy="16.6" r="1.1" fill="currentColor" stroke="none" />
        </svg>
        <svg width="22" height="11" viewBox="0 0 25 12" aria-hidden>
          <rect x="0.5" y="0.5" width="20" height="11" rx="3" fill="none" stroke="currentColor" opacity="0.5" />
          <rect x="2.5" y="2.5" width="13" height="7" rx="1.6" fill="currentColor" />
          <rect x="22" y="3.5" width="2.5" height="5" rx="1.2" fill="currentColor" opacity="0.5" />
        </svg>
      </span>
    </div>
  );
}

function TotalBar({ onCheckout }: { onCheckout: () => void }) {
  const { state } = useStore();
  const cur = state.settings.currency;
  const total = cartSubtotal(state.cart);
  const units = cartUnits(state.cart);
  const over = state.settings.budget > 0 && total > state.settings.budget;
  return (
    <div className="flex-none border-t border-line bg-raise/95 px-5 py-2.5 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-faint">Shopping total</p>
          <div className="flex items-baseline gap-2">
            <p key={total} className="anim-total truncate font-mono text-[22px] font-bold leading-tight tabular-nums">
              {fmtMoney(total, cur)}
            </p>
            <span className="flex-none font-mono text-[11px] text-faint tabular-nums">
              {units} item{units === 1 ? "" : "s"}
            </span>
          </div>
        </div>
        <button
          onClick={onCheckout}
          disabled={units === 0}
          className={cx(
            "press flex flex-none items-center gap-2 rounded-full py-2.5 pl-4 pr-3.5 text-[13px] font-bold text-white shadow-lg",
            units === 0
              ? "cursor-not-allowed bg-line text-faint shadow-none"
              : over
                ? "bg-danger shadow-danger/25"
                : "bg-brand shadow-brand/25",
          )}
          aria-label="Go to checkout"
        >
          <span>Checkout</span>
          <IReceipt size={16} />
        </button>
      </div>
    </div>
  );
}

function BottomNav({ tab, onSelect, hidden }: { tab: Tab; onSelect: (t: Tab) => void; hidden: boolean }) {
  if (hidden) return null;
  const items: Array<{ id: Tab; label: string; icon: ReactNode }> = [
    { id: "shop", label: "Shop", icon: <IBasket size={21} /> },
    { id: "lists", label: "Lists", icon: <IListChecks size={21} /> },
    { id: "history", label: "History", icon: <IClock size={21} /> },
    { id: "settings", label: "Settings", icon: <IGear size={21} /> },
  ];
  return (
    <nav className="flex flex-none border-t border-line bg-raise pb-[max(10px,env(safe-area-inset-bottom))] pt-1.5">
      {items.map((it) => {
        const active = tab === it.id;
        return (
          <button key={it.id} onClick={() => onSelect(it.id)} className="press relative flex flex-1 flex-col items-center gap-0.5 py-1.5" aria-label={it.label}>
            <span className={cx("absolute -top-1.5 h-[3px] w-8 rounded-full transition-all", active ? "bg-brand opacity-100" : "opacity-0")} />
            <span className={cx("transition-colors", active ? "text-brand" : "text-faint")}>{it.icon}</span>
            <span className={cx("text-[10.5px] font-bold", active ? "text-brand" : "text-faint")}>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function Ambient() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 60% at 18% 12%, rgba(20,107,67,0.22), transparent 60%), radial-gradient(60% 55% at 85% 88%, rgba(227,180,78,0.09), transparent 60%), radial-gradient(90% 90% at 50% 50%, #0e1712 0%, #090e0b 100%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(233,243,236,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(233,243,236,0.5) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      {[
        { pos: { top: "12%", left: "8%" }, rot: "-8deg", d: "7s" },
        { pos: { top: "66%", left: "6%" }, rot: "5deg", d: "9s" },
        { pos: { top: "20%", right: "7%" }, rot: "7deg", d: "8s" },
        { pos: { top: "72%", right: "10%" }, rot: "-5deg", d: "10s" },
      ].map((g, i) => (
        <div
          key={i}
          className="absolute hidden w-[150px] rounded-[12px] border border-white/8 bg-white/[0.03] p-3 opacity-70 sm:block"
          style={{ ...g.pos, animation: `floaty ${g.d} ease-in-out infinite`, "--rot": g.rot } as unknown as React.CSSProperties}
        >
          <EanBarcode code={`890103089102${i}`} height={26} digits={false} className="text-white/25" />
          <div className="mt-2 space-y-1.5">
            <div className="h-1.5 w-3/4 rounded bg-white/10" />
            <div className="h-1.5 w-1/2 rounded bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

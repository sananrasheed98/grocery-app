import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CURRENCY_SYMBOL, cx, type CurrencyCode } from "../lib/core";
import { ICheck, IMinus, IPlus, IX } from "./Icons";

/* ---------------- toasts ---------------- */

export interface Toast {
  id: number;
  msg: string;
  kind: "ok" | "warn" | "err";
}
const ToastCtx = createContext<{ push: (msg: string, kind?: Toast["kind"]) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(1);
  const push = useCallback((msg: string, kind: Toast["kind"] = "ok") => {
    const id = idRef.current++;
    setToasts((t) => [...t.slice(-2), { id, msg, kind }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2700);
  }, []);
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-[132px] z-[70] flex flex-col items-center gap-2 px-6"
        data-toast-host=""
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cx(
              "anim-rise flex max-w-full items-center gap-2 rounded-full border px-4 py-2.5 text-[13px] font-medium shadow-lg",
              t.kind === "ok" && "border-brand/25 bg-brand text-white shadow-brand/30",
              t.kind === "warn" && "border-amber/30 bg-amber text-[#241a04] shadow-amber/20",
              t.kind === "err" && "border-danger/30 bg-danger text-white shadow-danger/20",
            )}
          >
            {t.kind === "ok" && <ICheck size={15} />}
            {t.kind === "warn" && <IX size={15} />}
            {t.kind === "err" && <IX size={15} />}
            <span className="truncate">{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => {
  const v = useContext(ToastCtx);
  if (!v) throw new Error("no toast ctx");
  return v;
};

/* ---------------- bottom sheet ---------------- */

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-[60]">
      <button aria-label="Close" onClick={onClose} className="anim-fade absolute inset-0 w-full bg-black/55" />
      <div className="anim-sheet absolute inset-x-0 bottom-0 max-h-[88%] overflow-y-auto scroll-thin rounded-t-[22px] border-t border-line bg-raise pb-5 shadow-[0_-12px_40px_rgba(0,0,0,0.28)]">
        <div className="sticky top-0 z-10 bg-raise pt-2.5">
          <div className="mx-auto h-1.5 w-10 rounded-full bg-line" />
          <div className="flex items-center justify-between px-5 pt-3 pb-1">
            <h3 className="font-display text-[17px] font-bold">{title}</h3>
            <button
              onClick={onClose}
              className="press rounded-full border border-line bg-surface p-1.5 text-soft"
              aria-label="Close sheet"
            >
              <IX size={15} />
            </button>
          </div>
        </div>
        <div className="px-5 pt-2">{children}</div>
      </div>
    </div>
  );
}

/* ---------------- confirm modal ---------------- */

export function Modal({
  open,
  onClose,
  title,
  children,
  actions,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  actions: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-[65] flex items-center justify-center p-6">
      <button aria-label="Close" onClick={onClose} className="anim-fade absolute inset-0 w-full bg-black/55" />
      <div className="anim-pop relative w-full max-w-[320px] rounded-[18px] border border-line bg-raise p-5 shadow-2xl">
        <h3 className="font-display text-[17px] font-bold">{title}</h3>
        <div className="mt-2 text-[13.5px] leading-relaxed text-soft">{children}</div>
        <div className="mt-5 flex gap-2.5">{actions}</div>
      </div>
    </div>
  );
}

/* ---------------- controls ---------------- */

export function Stepper({
  value,
  onChange,
  min = 1,
  max = 99,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="inline-flex items-center rounded-full border border-line bg-surface">
      <button
        className="press flex h-10 w-10 items-center justify-center rounded-full text-soft disabled:opacity-30"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease quantity"
      >
        <IMinus size={16} />
      </button>
      <span key={value} className="anim-pop w-9 text-center font-mono text-[15px] font-semibold tabular-nums">
        {value}
      </span>
      <button
        className="press flex h-10 w-10 items-center justify-center rounded-full text-soft disabled:opacity-30"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        <IPlus size={16} />
      </button>
    </div>
  );
}

export function MoneyInput({
  raw,
  onRaw,
  currency,
  big,
  placeholder = "0",
  invalid,
}: {
  raw: string;
  onRaw: (v: string) => void;
  currency: CurrencyCode;
  big?: boolean;
  placeholder?: string;
  invalid?: boolean;
}) {
  return (
    <div
      className={cx(
        "flex items-center gap-1 rounded-[14px] border bg-surface transition-colors focus-within:border-brand",
        invalid ? "border-danger" : "border-line",
        big ? "px-4 py-3.5" : "px-3 py-2.5",
      )}
    >
      <span className={cx("font-mono font-semibold text-faint", big ? "text-[22px]" : "text-[15px]")}>
        {CURRENCY_SYMBOL[currency]}
      </span>
      <input
        value={raw}
        inputMode="decimal"
        placeholder={placeholder}
        onChange={(e) => {
          const v = e.target.value.replace(/[^0-9.]/g, "");
          const parts = v.split(".");
          onRaw((parts[0]?.slice(0, 7) ?? "") + (parts[1] !== undefined ? "." + parts[1].slice(0, 2) : ""));
        }}
        className={cx(
          "w-full bg-transparent font-mono font-semibold tabular-nums text-ink placeholder:text-faint",
          big ? "text-[28px]" : "text-[16px]",
        )}
        aria-label="Amount"
      />
    </div>
  );
}

export function Seg<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ v: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-full border border-line bg-surface p-1">
      {options.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={cx(
            "press flex-1 rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors",
            value === o.v ? "bg-raise text-ink shadow-sm ring-1 ring-line" : "text-soft",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cx(
        "relative h-[26px] w-[46px] flex-none rounded-full transition-colors",
        on ? "bg-brand" : "bg-line",
      )}
    >
      <span
        className={cx(
          "absolute top-[3px] h-5 w-5 rounded-full bg-white shadow transition-all",
          on ? "left-[23px]" : "left-[3px]",
        )}
      />
    </button>
  );
}

/* ---------------- tiny chart ---------------- */

export function Sparkline({ points, color }: { points: number[]; color: string }) {
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const W = 150;
  const H = 38;
  const xy = points.map((p, i) => [
    (i / (points.length - 1)) * (W - 10) + 5,
    H - 6 - ((p - min) / span) * (H - 12),
  ]);
  const d = xy.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = xy[xy.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[38px] w-full">
      <path d={`${d} L${last[0]},${H} L${last[0] - 0},${H}`} stroke="none" fill={color} opacity="0.12" />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeDasharray="260" className="[animation:drawline_0.9s_ease_both]" />
      <circle cx={last[0]} cy={last[1]} r="3" fill={color} />
    </svg>
  );
}

/* ---------------- misc ---------------- */

export function EmptyState({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="anim-rise flex flex-col items-center rounded-[16px] border border-dashed border-line bg-surface/60 px-6 py-9 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand">{icon}</div>
      <p className="font-display mt-3.5 text-[15px] font-bold">{title}</p>
      <p className="mt-1 max-w-[230px] text-[12.5px] leading-relaxed text-soft">{body}</p>
    </div>
  );
}

export function SectionLabel({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-2.5 flex items-end justify-between px-0.5">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-faint">{children}</p>
      {right}
    </div>
  );
}

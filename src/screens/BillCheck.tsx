import { useEffect, useRef, useState } from "react";
import type { BillResult } from "../lib/billcheck";
import { simulateBillRead } from "../lib/billcheck";
import { beep, buzz, cx, fmtMoney } from "../lib/core";
import { useStore } from "../lib/store";
import {
  IAlert,
  IBack,
  ICamera,
  ICameraOff,
  ICheck,
  IFlash,
  IRefresh,
} from "../components/Icons";

const READ_STEPS = ["Aligning bill…", "Extracting lines…", "Matching your list…"];

/* ========================= bill camera ========================= */

export function BillCamera({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: (r: BillResult) => void;
}) {
  const { state, setSettings } = useStore();
  const cart = state.cart;
  const allowed = state.settings.cameraAllowed;
  const [phase, setPhase] = useState<"idle" | "reading">("idle");
  const [flash, setFlash] = useState(false);
  const [step, setStep] = useState(0);
  const fired = useRef(false);

  const capture = () => {
    if (fired.current) return;
    fired.current = true;
    beep(state.settings.sound);
    buzz(state.settings.vibrate, [60, 40, 90]);
    setPhase("reading");
    window.setTimeout(() => onDone(simulateBillRead(cart)), 2300);
  };

  /* auto-capture, mirroring the barcode scanner preference */
  useEffect(() => {
    if (!state.settings.autoScan || !allowed) return;
    const t = window.setTimeout(capture, 3200);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed]);

  useEffect(() => {
    if (phase !== "reading") return;
    const t = window.setInterval(() => setStep((s) => (s + 1) % READ_STEPS.length), 750);
    return () => window.clearInterval(t);
  }, [phase]);

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-[#070b09] text-white">
      {/* top bar */}
      <div className="flex items-center justify-between px-4 pt-4">
        <button onClick={onClose} className="press flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white" aria-label="Close bill camera">
          <IBack size={18} />
        </button>
        <div className="text-center">
          <p className="font-display text-[15px] font-bold leading-tight">Bill camera</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">receipt check</p>
        </div>
        <button
          onClick={() => setFlash((f) => !f)}
          disabled={!allowed || phase === "reading"}
          className={cx("press flex h-10 w-10 items-center justify-center rounded-full disabled:opacity-40", flash ? "bg-[#e3b44e] text-[#241a04]" : "bg-white/10 text-white")}
          aria-label="Toggle flash"
        >
          <IFlash size={17} />
        </button>
      </div>

      {/* viewfinder */}
      <div className="vf-grid relative flex flex-1 items-center justify-center overflow-hidden">
        {/* ambient glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(60% 45% at 50% 42%, rgba(69,196,130,0.10), transparent 70%)" }}
        />

        <div className="relative">
          {/* tall receipt frame */}
          <div className={cx("relative h-[318px] w-[232px]", phase === "reading" && "vf-flash")}>
            {[
              "left-0 top-0 border-l-[3px] border-t-[3px] rounded-tl-[10px]",
              "right-0 top-0 border-r-[3px] border-t-[3px] rounded-tr-[10px]",
              "left-0 bottom-0 border-l-[3px] border-b-[3px] rounded-bl-[10px]",
              "right-0 bottom-0 border-r-[3px] border-b-[3px] rounded-br-[10px]",
            ].map((c) => (
              <span key={c} className={cx("absolute h-7 w-7 border-[#45c482]", c)} />
            ))}

            {/* ghost receipt */}
            <div className="absolute inset-x-5 inset-y-4 overflow-hidden rounded-[6px] bg-[#f6f3e6]/[0.08] ring-1 ring-white/10">
              <div className="space-y-2 p-3.5">
                {cart.slice(0, 8).map((i, n) => (
                  <div key={i.id} className="flex items-center gap-2">
                    <div className={cx("h-1.5 rounded bg-white/25", phase === "reading" && "shimmer")} style={{ width: `${52 + ((n * 17) % 36)}%` }} />
                    <div className="ml-auto h-1.5 w-6 rounded bg-white/25" />
                  </div>
                ))}
                {cart.length === 0 && <div className="h-1.5 w-2/3 rounded bg-white/15" />}
                <div className="border-t border-dashed border-white/20 pt-2">
                  <div className="ml-auto h-2 w-12 rounded bg-white/35" />
                </div>
              </div>
            </div>

            {/* reading laser */}
            {phase === "reading" && <div className="laser" style={{ left: "6%", right: "6%" }} />}
          </div>

          {/* caption */}
          <div className="mt-5 text-center">
            {phase === "reading" ? (
              <>
                <p key={step} className="anim-fade font-mono text-[13px] font-semibold text-[#45c482]">
                  {READ_STEPS[step]}
                </p>
                <p className="mt-1 font-mono text-[10.5px] text-white/40">comparing {cart.length} list item{cart.length === 1 ? "" : "s"} line by line</p>
              </>
            ) : (
              <>
                <p className="text-[13px] font-semibold text-white/85">Fit the entire bill inside the frame</p>
                <p className="mt-1 font-mono text-[10.5px] text-white/40">long receipts welcome — hold steady</p>
              </>
            )}
          </div>
        </div>

        {/* permission card */}
        {!allowed && (
          <div className="anim-rise absolute inset-x-5 bottom-4 rounded-[18px] border border-white/10 bg-[#101813]/95 p-4 backdrop-blur">
            <div className="flex items-center gap-2.5">
              <ICameraOff size={18} className="text-[#e3b44e]" />
              <p className="font-display text-[14.5px] font-bold">Allow camera access?</p>
            </div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-white/60">
              The camera reads your printed bill <strong className="text-white/85">only while this screen is open</strong> — nothing is uploaded anywhere.
            </p>
            <div className="mt-3 flex gap-2.5">
              <button
                onClick={() => setSettings({ cameraAllowed: true })}
                className="press flex-1 rounded-full bg-[#45c482] py-2.5 text-[13px] font-bold text-[#062315]"
              >
                Allow camera
              </button>
              <button onClick={capture} className="press flex-1 rounded-full border border-white/15 py-2.5 text-[13px] font-semibold text-white/80">
                Use sample bill
              </button>
            </div>
          </div>
        )}
      </div>

      {/* bottom controls */}
      <div className="flex flex-none items-center justify-center gap-8 pb-8 pt-3">
        <div className="w-12" />
        <button
          onClick={capture}
          disabled={!allowed || phase === "reading"}
          className="press group relative flex h-[70px] w-[70px] items-center justify-center rounded-full border-4 border-white/85 disabled:opacity-50"
          aria-label="Capture bill"
        >
          <span
            className={cx(
              "absolute inset-1 rounded-full transition-all",
              phase === "reading" ? "animate-ping bg-[#45c482]/35" : "bg-white group-active:scale-90",
            )}
          />
          <ICamera size={26} className={cx("relative", phase === "reading" ? "text-[#45c482]" : "text-[#101813]")} />
        </button>
        <div className="flex w-12 flex-col items-center gap-1">
          <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[10px] text-white/60">{cart.length}</span>
          <span className="text-[9px] uppercase tracking-wider text-white/40">items</span>
        </div>
      </div>
    </div>
  );
}

/* ========================= comparison ========================= */

export function BillCompare({
  result,
  onRetake,
  onDone,
}: {
  result: BillResult;
  onRetake: () => void;
  onDone: () => void;
}) {
  const { state } = useStore();
  const cur = state.settings.currency;
  const { lines, missing, diff, billTotal, listTotal, matchedCount } = result;
  const issues = lines.filter((l) => l.status !== "match").length;
  const total = lines.length;

  const verdict =
    diff > 0
      ? { label: "Overcharged", tone: "danger" as const, note: `The bill asks for ${fmtMoney(diff, cur)} more than your list.` }
      : diff < 0
        ? { label: "Undercharged", tone: "amber" as const, note: `${fmtMoney(-diff, cur)} less than your list — an item may not have scanned.` }
        : { label: "Verified", tone: "brand" as const, note: "Every printed line matches the price you noted." };

  const toneCls = {
    danger: { text: "text-danger", bg: "bg-danger", soft: "bg-danger-soft", ring: "border-danger/40" },
    amber: { text: "text-amber", bg: "bg-amber", soft: "bg-amber-soft", ring: "border-amber/40" },
    brand: { text: "text-brand", bg: "bg-brand", soft: "bg-brand-soft", ring: "border-brand/40" },
  }[verdict.tone];

  const sign = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${fmtMoney(Math.abs(n), cur)}`;

  return (
    <div className="anim-rise flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 pb-2 pt-4">
        <button onClick={onDone} className="press flex h-10 w-10 items-center justify-center rounded-full border border-line bg-raise text-soft" aria-label="Back to shop">
          <IBack size={18} />
        </button>
        <div className="min-w-0">
          <h1 className="font-display text-[17px] font-bold leading-tight">Bill Check</h1>
          <p className="font-mono text-[10.5px] text-faint tabular-nums">{total} lines read · compared with your list</p>
        </div>
        <span className={cx("ml-auto rounded-full px-2.5 py-1 font-mono text-[10.5px] font-bold tabular-nums", toneCls.soft, toneCls.text)}>
          {matchedCount}/{total} match
        </span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-5 scroll-thin">
        {/* verdict receipt */}
        <div>
          <div className="tear-t" />
          <div className="relative overflow-hidden bg-paper px-5 py-4 text-paper-ink ring-1 ring-black/5">
            <p className="text-center font-mono text-[10px] tracking-[0.3em] text-paper-ink/50">· BILL CHECK ·</p>
            <div className="mt-3 space-y-1.5 font-mono text-[12.5px] tabular-nums">
              <div className="flex justify-between">
                <span className="text-paper-ink/65">Your list total</span>
                <span className="font-bold">{fmtMoney(listTotal, cur)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-paper-ink/65">Printed bill total</span>
                <span className="font-bold">{fmtMoney(billTotal, cur)}</span>
              </div>
            </div>
            <div className="my-2.5 border-t border-dashed border-paper-ink/30" />
            <div className="flex items-baseline justify-between">
              <span className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-paper-ink/55">Difference</span>
              <span className={cx("font-mono text-[22px] font-bold tabular-nums", diff === 0 ? "text-[#146b43]" : diff > 0 ? "text-[#bb4a3d]" : "text-[#a8720d]")}>
                {sign(diff)}
              </span>
            </div>

            {/* rubber stamp */}
            <span
              className={cx(
                "absolute right-3 top-3 -rotate-12 rounded-[6px] border-2 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] opacity-80",
                diff === 0 ? "border-[#146b43] text-[#146b43]" : diff > 0 ? "border-[#bb4a3d] text-[#bb4a3d]" : "border-[#a8720d] text-[#a8720d]",
              )}
            >
              {verdict.label}
            </span>
          </div>
          <div className="tear-b" />
        </div>

        <p className={cx("px-1 text-[12px] font-semibold", toneCls.text)}>{verdict.note}</p>

        {/* match meter */}
        <div className="rounded-[14px] border border-line bg-raise p-3.5">
          <div className="flex justify-between text-[11px] font-bold text-soft">
            <span className="uppercase tracking-[0.12em] text-faint">Lines verified</span>
            <span className="font-mono tabular-nums">{matchedCount} of {total}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface ring-1 ring-line">
            <div className="h-full rounded-full bg-brand transition-all duration-700" style={{ width: `${total ? (matchedCount / total) * 100 : 0}%` }} />
          </div>
        </div>

        {/* line-by-line */}
        <div className="stagger overflow-hidden rounded-[16px] border border-line bg-raise">
          {lines.map((l, idx) => {
            const bad = l.status === "price";
            const warn = l.status === "qty" || l.status === "extra";
            return (
              <div key={l.id} className={cx("px-3.5 py-3", idx > 0 && "border-t border-line", bad && "bg-danger-soft/55", warn && "bg-amber-soft/45")}>
                <div className="flex items-center gap-2.5">
                  <span
                    className={cx(
                      "flex h-6 w-6 flex-none items-center justify-center rounded-full",
                      l.status === "match" && "bg-brand-soft text-brand",
                      bad && "bg-danger text-white",
                      warn && "bg-amber text-[#241a04]",
                    )}
                  >
                    {l.status === "match" ? <ICheck size={13} /> : <IAlert size={13} />}
                  </span>
                  <p className="min-w-0 flex-1 truncate font-mono text-[12px] font-bold tracking-tight">{l.name}</p>
                  <span className={cx("flex-none font-mono text-[13.5px] font-bold tabular-nums", bad ? "text-danger" : warn ? "text-amber" : "")}>
                    {fmtMoney(l.lineTotal, cur)}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2 pl-[34px]">
                  <p className="min-w-0 truncate text-[11.5px] text-soft">
                    {l.status === "extra" ? (
                      <>Not in your list · {l.qty} × {fmtMoney(l.unitPrice, cur)}</>
                    ) : (
                      <>
                        matches <strong className="text-ink">{l.matchedName}</strong> · yours {fmtMoney(l.expectedTotal, cur)}
                        {l.qty > 1 && <> · {l.qty} × {fmtMoney(l.unitPrice, cur)}</>}
                      </>
                    )}
                  </p>
                  {l.delta !== 0 && (
                    <span className={cx("flex-none rounded-full px-2 py-0.5 font-mono text-[10.5px] font-bold tabular-nums", bad ? "bg-danger text-white" : "bg-amber text-[#241a04]")}>
                      {sign(l.delta)}
                    </span>
                  )}
                  {l.status === "match" && (
                    <span className="flex-none rounded-full bg-brand-soft px-2 py-0.5 font-mono text-[10.5px] font-bold text-brand">OK</span>
                  )}
                </div>
                {l.reason && (
                  <p className="mt-1 pl-[34px] text-[11px] italic text-faint">{l.reason}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* missing items */}
        {missing.length > 0 && (
          <div>
            <p className="mb-2 px-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-faint">On your list, never printed</p>
            <div className="overflow-hidden rounded-[16px] border border-brand/25 bg-brand-soft/50">
              {missing.map((m, idx) => (
                <div key={m.id} className={cx("flex items-center gap-2.5 px-3.5 py-3", idx > 0 && "border-t border-brand/15")}>
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full border-2 border-brand text-brand">
                    <IAlert size={12} />
                  </span>
                  <p className="min-w-0 flex-1 truncate text-[12.5px] font-bold">{m.name}</p>
                  <span className="font-mono text-[11.5px] font-bold tabular-nums text-brand">−{fmtMoney(m.unitPrice * m.qty, cur)} not charged</span>
                </div>
              ))}
            </div>
            <p className="mt-1.5 px-1 text-[11px] text-faint">Either a freebie or a missed scan — worth a glance before you leave the counter.</p>
          </div>
        )}

        {/* actions */}
        <div className="flex gap-2.5 pt-1">
          <button onClick={onRetake} className="press flex flex-1 items-center justify-center gap-2 rounded-full border border-line bg-raise py-3 text-[13px] font-bold text-soft">
            <IRefresh size={16} /> Retake photo
          </button>
          <button onClick={onDone} className="press flex flex-1 items-center justify-center gap-2 rounded-full bg-brand py-3 text-[13px] font-bold text-white shadow-lg shadow-brand/25">
            <ICheck size={16} /> Done
          </button>
        </div>
      </div>
    </div>
  );
}

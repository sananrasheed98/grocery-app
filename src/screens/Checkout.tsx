import { useState } from "react";
import confetti from "canvas-confetti";
import { fmtMoney, parseMoney } from "../lib/core";
import { cartSubtotal, cartUnits, useStore } from "../lib/store";
import { IAlert, IBack, ICheck, IClock } from "../components/Icons";
import { MoneyInput, useToast } from "../components/ui";

const m2s = (m: number) => (m === 0 ? "" : (m / 100).toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1"));

export function Checkout({ onBack, onGoHistory }: { onBack: () => void; onGoHistory: () => void }) {
  const store = useStore();
  const { state } = store;
  const { push } = useToast();
  const cur = state.settings.currency;
  const [done, setDone] = useState<{ total: number; count: number } | null>(null);
  const [dRaw, setDRaw] = useState(m2s(state.extras.discount));
  const [tRaw, setTRaw] = useState(m2s(state.extras.tax));
  const [xRaw, setXRaw] = useState(m2s(state.extras.extra));

  const subtotal = cartSubtotal(state.cart);
  const units = cartUnits(state.cart);
  const discount = parseMoney(dRaw) ?? 0;
  const tax = parseMoney(tRaw) ?? 0;
  const extra = parseMoney(xRaw) ?? 0;
  const total = Math.max(0, subtotal + tax + extra - discount);
  const budget = state.settings.budget;

  const finish = () => {
    store.setExtras({ discount, tax, extra });
    const trip = store.finishTrip();
    if (!trip) {
      push("Nothing to save — the basket is empty", "err");
      return;
    }
    setDone({ total: trip.total, count: cartUnits(trip.items) });
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.65 },
      colors: ["#146b43", "#45c482", "#f2c94c", "#fbf9ef"],
      disableForReducedMotion: true,
    });
  };

  if (done)
    return (
      <div className="flex h-full flex-col items-center justify-center px-8 pb-10 text-center">
        <div className="anim-pop flex h-20 w-20 items-center justify-center rounded-full bg-brand text-white shadow-xl shadow-brand/30">
          <ICheck size={38} />
        </div>
        <h2 className="font-display mt-5 text-[22px] font-bold">Shopping saved</h2>
        <p className="mt-1.5 text-[13.5px] text-soft">
          {done.count} item{done.count === 1 ? "" : "s"} · trip stored on-device
        </p>
        <p className="mt-3 rounded-full bg-surface px-5 py-2 font-mono text-[19px] font-bold tabular-nums ring-1 ring-line">
          {fmtMoney(done.total, cur)}
        </p>
        <p className="mt-2 text-[11.5px] text-faint">Prices were recorded to each product’s history.</p>
        <div className="mt-8 flex w-full max-w-[270px] flex-col gap-2.5">
          <button onClick={onBack} className="press rounded-full bg-brand py-3.5 text-[14.5px] font-bold text-white shadow-lg shadow-brand/25">
            Start New Shopping
          </button>
          <button onClick={onGoHistory} className="press flex items-center justify-center gap-2 rounded-full border border-line bg-raise py-3 text-[13.5px] font-semibold text-soft">
            <IClock size={16} /> View History
          </button>
        </div>
      </div>
    );

  if (state.cart.length === 0)
    return (
      <div className="flex h-full flex-col items-center justify-center px-8 pb-10 text-center">
        <h2 className="font-display text-[19px] font-bold">Nothing to check out</h2>
        <p className="mt-1.5 max-w-[250px] text-[13px] leading-relaxed text-soft">
          Scan a few products first — the summary, discounts and final total will appear here.
        </p>
        <button onClick={onBack} className="press mt-6 rounded-full bg-brand px-6 py-3 text-[13.5px] font-bold text-white">
          Back to basket
        </button>
      </div>
    );

  return (
    <div className="anim-rise flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 pb-2 pt-4">
        <button onClick={onBack} className="press flex h-10 w-10 items-center justify-center rounded-full border border-line bg-raise text-soft" aria-label="Back">
          <IBack size={18} />
        </button>
        <div>
          <h1 className="font-display text-[17px] font-bold leading-tight">Shopping Summary</h1>
          <p className="text-[11px] text-faint">{units} item{units === 1 ? "" : "s"} · {state.cart.length} product{state.cart.length === 1 ? "" : "s"}</p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-5 scroll-thin">
        <div className="overflow-hidden rounded-[16px] border border-line bg-raise">
          {state.cart.map((i, idx) => (
            <div key={i.id} className={idx > 0 ? "flex items-center justify-between border-t border-line px-4 py-2.5" : "flex items-center justify-between px-4 py-2.5"}>
              <span className="min-w-0 truncate pr-3 text-[13px] font-semibold">{i.name}</span>
              <span className="flex-none font-mono text-[12px] tabular-nums text-soft">
                {i.qty} × {fmtMoney(i.unitPrice, cur)} = <strong className="text-ink">{fmtMoney(i.unitPrice * i.qty, cur)}</strong>
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {(
            [
              ["Discount", dRaw, setDRaw, "discount"],
              ["Tax", tRaw, setTRaw, "tax"],
              ["Charges", xRaw, setXRaw, "extra"],
            ] as const
          ).map(([label, raw, set, field]) => (
            <div key={label}>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-faint">{label}</p>
              <MoneyInput
                raw={raw}
                onRaw={(v) => {
                  set(v);
                  store.setExtras({ [field]: parseMoney(v) ?? 0 });
                }}
                currency={cur}
                placeholder="0"
              />
            </div>
          ))}
        </div>

        {/* receipt */}
        <div>
          <div className="tear-t" />
          <div className="bg-paper px-5 py-4 text-paper-ink ring-1 ring-black/5">
            <p className="text-center font-mono text-[10.5px] tracking-[0.3em] text-paper-ink/50">· KIRANA CART ·</p>
            <div className="mt-3 space-y-1.5 font-mono text-[12.5px] tabular-nums">
              <div className="flex justify-between"><span>Subtotal</span><span>{fmtMoney(subtotal, cur)}</span></div>
              {discount > 0 && (
                <div className="flex justify-between text-brand"><span>Discounts</span><span>− {fmtMoney(discount, cur)}</span></div>
              )}
              {tax > 0 && (
                <div className="flex justify-between"><span>Tax</span><span>+ {fmtMoney(tax, cur)}</span></div>
              )}
              {extra > 0 && (
                <div className="flex justify-between"><span>Additional charges</span><span>+ {fmtMoney(extra, cur)}</span></div>
              )}
            </div>
            <div className="my-3 border-t border-dashed border-paper-ink/30" />
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-paper-ink/55">Estimated total</span>
              <span key={total} className="anim-total font-mono text-[26px] font-bold tabular-nums">{fmtMoney(total, cur)}</span>
            </div>
            {budget > 0 && total > budget && (
              <p className="mt-2.5 flex items-center gap-1.5 rounded-[10px] bg-danger/10 px-3 py-2 text-[11.5px] font-bold text-danger">
                <IAlert size={14} /> Over budget by {fmtMoney(total - budget, cur)}
              </p>
            )}
          </div>
          <div className="tear-b" />
        </div>

        <button onClick={finish} className="press w-full rounded-full bg-brand py-4 text-[15px] font-bold text-white shadow-lg shadow-brand/25">
          Finish Shopping
        </button>
        <p className="pb-1 text-center text-[11px] text-faint">
          The trip is saved to on-device history — it works fully offline.
        </p>
      </div>
    </div>
  );
}

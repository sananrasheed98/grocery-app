import { useMemo, useState } from "react";
import type { Trip } from "../lib/core";
import { cx, fmtDay, fmtDayFull, fmtMoney, inLast7Days, inThisMonth, timeAgo } from "../lib/core";
import { useStore } from "../lib/store";
import { ProductArt } from "../components/ProductArt";
import { IBack, IChevR, IReceipt, ISearch, IStar, ITrash } from "../components/Icons";
import { EmptyState, Modal, useToast } from "../components/ui";

export function HistoryTab({ onOpenTrip }: { onOpenTrip: (id: string) => void }) {
  const { state } = useStore();
  const cur = state.settings.currency;
  const [q, setQ] = useState("");

  const trips = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return state.trips;
    return state.trips.filter(
      (t) =>
        t.items.some(
          (i) => i.name.toLowerCase().includes(query) || i.brand.toLowerCase().includes(query),
        ),
    );
  }, [state.trips, q]);

  const week = state.trips.filter((t) => inLast7Days(t.date)).reduce((s, t) => s + t.total, 0);
  const month = state.trips.filter((t) => inThisMonth(t.date)).reduce((s, t) => s + t.total, 0);
  const avg = state.trips.length ? Math.round(state.trips.reduce((s, t) => s + t.total, 0) / state.trips.length) : 0;

  const priciest = useMemo(() => {
    let best: { name: string; total: number; date: number } | null = null;
    for (const t of state.trips)
      for (const i of t.items) {
        const line = i.unitPrice * i.qty;
        if (!best || line > best.total) best = { name: i.name, total: line, date: t.date };
      }
    return best;
  }, [state.trips]);

  const frequent = useMemo(() => {
    const m = new Map<string, { name: string; art: string; n: number }>();
    for (const t of state.trips)
      for (const i of t.items) {
        const e = m.get(i.barcode);
        if (e) e.n += i.qty;
        else m.set(i.barcode, { name: i.name, art: i.art, n: i.qty });
      }
    return [...m.values()].sort((a, b) => b.n - a.n).slice(0, 5);
  }, [state.trips]);

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-2 pt-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-faint">On-device · private</p>
        <h1 className="font-display text-[24px] font-extrabold leading-tight">History</h1>
        <div className="mt-3 flex items-center gap-2 rounded-full border border-line bg-raise px-3.5 py-2.5 focus-within:border-brand">
          <ISearch size={16} className="text-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search trips by product or brand…"
            className="w-full bg-transparent text-[13.5px] placeholder:text-faint"
          />
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 pb-6 scroll-thin">
        {state.trips.length === 0 ? (
          <EmptyState
            icon={<IReceipt size={22} />}
            title="No shopping trips yet"
            body="Finish a shopping session from the checkout screen and it will be archived here with full price detail."
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                ["This week", week],
                ["This month", month],
                ["Average bill", avg],
              ].map(([label, v]) => (
                <div key={label as string} className="rounded-[15px] border border-line bg-raise p-3.5">
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.13em] text-faint">{label as string}</p>
                  <p className="mt-1 font-mono text-[19px] font-bold tabular-nums">{fmtMoney(v as number, cur)}</p>
                </div>
              ))}
              <div className="rounded-[15px] border border-line bg-raise p-3.5">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.13em] text-faint">Trips saved</p>
                <p className="mt-1 font-mono text-[19px] font-bold tabular-nums">{state.trips.length}</p>
              </div>
            </div>

            {priciest && (
              <div className="flex items-center gap-3 rounded-[15px] border border-amber/25 bg-amber-soft px-4 py-3">
                <IStar size={18} className="flex-none text-amber" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.13em] text-amber/80">Most expensive purchase</p>
                  <p className="truncate text-[13px] font-bold text-amber">{priciest.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[15px] font-bold tabular-nums text-amber">{fmtMoney(priciest.total, cur)}</p>
                  <p className="text-[10.5px] text-amber/70">{timeAgo(priciest.date)}</p>
                </div>
              </div>
            )}

            {frequent.length > 0 && (
              <div className="rounded-[15px] border border-line bg-raise p-3.5">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.13em] text-faint">Most bought</p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {frequent.map((f) => (
                    <span key={f.name} className="flex items-center gap-1.5 rounded-full bg-surface py-1 pl-1 pr-2.5 ring-1 ring-line">
                      <span className="h-5 w-5 overflow-hidden rounded-full"><ProductArt art={f.art} /></span>
                      <span className="text-[11.5px] font-semibold">{f.name.split(" ").slice(0, 2).join(" ")}</span>
                      <span className="font-mono text-[10.5px] text-faint">×{f.n}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-1">
              <p className="mb-2 px-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-faint">
                {trips.length} trip{trips.length === 1 ? "" : "s"}{q && ` matching “${q}”`}
              </p>
              <div className="space-y-2.5">
                {trips.map((t) => {
                  const arts = [...new Set(t.items.map((i) => i.art))].slice(0, 4);
                  return (
                    <button
                      key={t.id}
                      onClick={() => onOpenTrip(t.id)}
                      className="press flex w-full items-center gap-3 rounded-[15px] border border-line bg-raise p-3.5 text-left hover:border-brand/40"
                    >
                      <div className="flex -space-x-2.5">
                        {arts.map((a, i) => (
                          <span key={i} className="h-9 w-9 overflow-hidden rounded-full ring-2 ring-raise">
                            <ProductArt art={a} />
                          </span>
                        ))}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] font-bold">{fmtDay(t.date)}</p>
                        <p className="mt-0.5 font-mono text-[10.5px] text-faint tabular-nums">
                          {t.items.length} product{t.items.length === 1 ? "" : "s"} · {timeAgo(t.date)}
                        </p>
                      </div>
                      <span className="font-mono text-[15px] font-bold tabular-nums">{fmtMoney(t.total, cur)}</span>
                      <IChevR size={15} className="text-faint" />
                    </button>
                  );
                })}
              </div>
              {trips.length === 0 && (
                <p className="py-6 text-center text-[12.5px] text-faint">No trips match that search.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ================= trip detail ================= */

export function TripDetail({ trip, onBack, onDelete }: { trip: Trip; onBack: () => void; onDelete: (id: string) => void }) {
  const { state } = useStore();
  const { push } = useToast();
  const cur = state.settings.currency;
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="anim-rise flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 pb-2 pt-4">
        <button onClick={onBack} className="press flex h-10 w-10 items-center justify-center rounded-full border border-line bg-raise text-soft" aria-label="Back">
          <IBack size={18} />
        </button>
        <div className="min-w-0">
          <h1 className="font-display truncate text-[17px] font-bold leading-tight">Shopping trip</h1>
          <p className="text-[11px] text-faint">{fmtDayFull(trip.date)}</p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-5 scroll-thin">
        <div>
          <div className="tear-t" />
          <div className="bg-paper px-5 py-4 text-paper-ink ring-1 ring-black/5">
            <p className="text-center font-mono text-[10.5px] tracking-[0.3em] text-paper-ink/50">· KIRANA CART ·</p>
            <p className="mt-0.5 text-center font-mono text-[10.5px] text-paper-ink/50">{fmtDayFull(trip.date)}</p>
            <div className="mt-3 space-y-2">
              {trip.items.map((i) => (
                <div key={i.id} className="flex items-baseline justify-between gap-3 font-mono text-[12px] tabular-nums">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{i.name}</span>
                    <span className="text-paper-ink/55">{i.qty} × {fmtMoney(i.unitPrice, cur)}</span>
                  </span>
                  <span className="flex-none font-bold">{fmtMoney(i.unitPrice * i.qty, cur)}</span>
                </div>
              ))}
            </div>
            <div className="my-3 border-t border-dashed border-paper-ink/30" />
            <div className="space-y-1 font-mono text-[12px] tabular-nums">
              <div className="flex justify-between"><span>Subtotal</span><span>{fmtMoney(trip.subtotal, cur)}</span></div>
              {trip.discount > 0 && <div className="flex justify-between"><span>Discounts</span><span>− {fmtMoney(trip.discount, cur)}</span></div>}
              {trip.tax > 0 && <div className="flex justify-between"><span>Tax</span><span>+ {fmtMoney(trip.tax, cur)}</span></div>}
              {trip.extra > 0 && <div className="flex justify-between"><span>Charges</span><span>+ {fmtMoney(trip.extra, cur)}</span></div>}
            </div>
            <div className="my-3 border-t border-dashed border-paper-ink/30" />
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-paper-ink/55">Total paid</span>
              <span className="font-mono text-[24px] font-bold tabular-nums">{fmtMoney(trip.total, cur)}</span>
            </div>
            <p className="mt-3 text-center font-mono text-[10px] tracking-[0.2em] text-paper-ink/45">THANK YOU · COME AGAIN</p>
          </div>
          <div className="tear-b" />
        </div>

        <div className="overflow-hidden rounded-[16px] border border-line bg-raise">
          {trip.items.map((i, idx) => (
            <div key={i.id} className={cx("flex items-center gap-3 px-3.5 py-3", idx > 0 && "border-t border-line")}>
              <div className="h-10 w-10 flex-none overflow-hidden rounded-[9px] ring-1 ring-line">
                <ProductArt art={i.art} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold leading-tight">{i.name}</p>
                <p className="text-[11px] text-soft">{i.brand || "Unbranded"} · {i.pack || "—"}</p>
                {i.note && <p className="mt-0.5 truncate text-[11px] italic text-amber">“{i.note}”</p>}
              </div>
              <span className="font-mono text-[12.5px] font-bold tabular-nums">{fmtMoney(i.unitPrice * i.qty, cur)}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => setConfirm(true)}
          className="press mx-auto flex items-center gap-2 rounded-full border border-danger/35 bg-danger-soft px-5 py-2.5 text-[12.5px] font-bold text-danger"
        >
          <ITrash size={15} /> Delete this trip
        </button>
      </div>

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Delete trip?"
        actions={
          <>
            <button onClick={() => setConfirm(false)} className="press flex-1 rounded-full border border-line bg-surface py-2.5 text-[13px] font-semibold text-soft">
              Keep it
            </button>
            <button
              onClick={() => { onDelete(trip.id); push("Trip deleted", "warn"); }}
              className="press flex-1 rounded-full bg-danger py-2.5 text-[13px] font-bold text-white"
            >
              Delete
            </button>
          </>
        }
      >
        This removes the trip from history. Recorded price points stay, so price trends remain accurate.
      </Modal>
    </div>
  );
}

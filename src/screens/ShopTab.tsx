import { useEffect, useMemo, useState } from "react";
import type { CartItem } from "../lib/core";
import { buzz, cx, fmtMoney, parseMoney, uid } from "../lib/core";
import { productByCode } from "../lib/catalog";
import { cartSubtotal, cartUnits, useStore } from "../lib/store";
import { ProductArt } from "../components/ProductArt";
import { ProductCard } from "./AddFlow";
import {
  IBasket,
  IBell,
  ICamera,
  IChevR,
  IListChecks,
  IMoon,
  IPencil,
  IPlus,
  IScan,
  ISearch,
  IStar,
  ISun,
  ITrash,
  IWallet,
} from "../components/Icons";
import { EmptyState, Modal, MoneyInput, SectionLabel, Sheet, Stepper, useToast } from "../components/ui";

const m2s = (m: number) =>
  (m / 100).toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");

export function ShopTab({
  onScan,
  onCheckout,
  onVerify,
  onProduct,
  onGoLists,
  onGoHistory,
}: {
  onScan: () => void;
  onCheckout: () => void;
  onVerify: () => void;
  onProduct: (code: string) => void;
  onGoLists: () => void;
  onGoHistory: () => void;
}) {
  const store = useStore();
  const { state, isDark } = store;
  const { push } = useToast();
  const cur = state.settings.currency;
  const spent = cartSubtotal(state.cart);
  const units = cartUnits(state.cart);
  const [freshOpen, setFreshOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const budget = state.settings.budget;
  const ratio = budget > 0 ? spent / budget : 0;
  const tone = ratio > 1 ? "danger" : ratio >= 0.7 ? "amber" : "brand";

  const remainingChecks = state.checklist.filter((c) => !c.done).length;

  const freq = useMemo(() => {
    const counts = new Map<string, { item: CartItem; n: number }>();
    for (const t of state.trips)
      for (const i of t.items) {
        const e = counts.get(i.barcode);
        if (e) e.n += i.qty;
        else counts.set(i.barcode, { item: i, n: i.qty });
      }
    return [...counts.values()].sort((a, b) => b.n - a.n).slice(0, 6);
  }, [state.trips]);

  const quickAdd = (entry: { item: CartItem }) => {
    const hist = state.priceHistory[entry.item.barcode];
    const price = hist?.length ? hist[hist.length - 1].price : entry.item.unitPrice;
    const item: CartItem = { ...entry.item, id: uid(), unitPrice: price, qty: 1, addedAt: Date.now(), note: undefined };
    store.addItem(item);
    const matched = store.matchChecklist(item.name, [item.name.toLowerCase()]);
    push(`${item.name} added at ${fmtMoney(price, cur)}`);
    if (matched) window.setTimeout(() => push(`Checklist: “${matched}” ticked off`, "warn"), 350);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto scroll-thin pb-6">
        {/* header */}
        <div className="flex items-start justify-between px-5 pb-1 pt-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-faint">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
            </p>
            <h1 className="font-display text-[24px] font-extrabold leading-tight">Today’s Shopping</h1>
          </div>
          <button
            onClick={() => store.setSettings({ theme: isDark ? "light" : "dark" })}
            className="press mt-1 flex h-10 w-10 items-center justify-center rounded-full border border-line bg-raise text-soft"
            aria-label="Toggle theme"
          >
            {isDark ? <ISun size={17} /> : <IMoon size={17} />}
          </button>
        </div>

        <div className="stagger space-y-3 px-5 pt-3">
          {/* budget */}
          {budget > 0 && (
            <div className="rounded-[16px] border border-line bg-raise p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[12px] font-semibold text-soft">
                  <IWallet size={15} className={cx(tone === "danger" ? "text-danger" : tone === "amber" ? "text-amber" : "text-brand")} />
                  Budget {fmtMoney(budget, cur)}
                </div>
                <span className={cx(
                  "font-mono text-[12px] font-bold tabular-nums",
                  tone === "danger" ? "text-danger" : tone === "amber" ? "text-amber" : "text-brand",
                )}>
                  {ratio > 1
                    ? `Over by ${fmtMoney(spent - budget, cur)}`
                    : `${fmtMoney(budget - spent, cur)} left`}
                </span>
              </div>
              <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-surface ring-1 ring-line">
                <div
                  className={cx(
                    "h-full rounded-full transition-all duration-700 ease-out",
                    tone === "danger" ? "bg-danger" : tone === "amber" ? "bg-amber" : "bg-brand",
                  )}
                  style={{ width: `${Math.min(100, ratio * 100)}%` }}
                />
              </div>
              {ratio > 1 && (
                <p className="mt-2 text-[11.5px] font-semibold text-danger">
                  You’ve crossed your budget — maybe drop something back on the shelf?
                </p>
              )}
            </div>
          )}

          {/* receipt total */}
          <div>
            <button onClick={onCheckout} className="press block w-full text-left">
              <div className="rounded-t-[16px] bg-paper px-5 pb-4 pt-4 text-paper-ink ring-1 ring-black/5">
                <div className="flex items-center justify-between">
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-paper-ink/55">Shopping total</p>
                  <span className="flex items-center gap-1 rounded-full bg-paper-ink/[0.07] px-2.5 py-1 text-[11px] font-bold">
                    Checkout <IChevR size={13} />
                  </span>
                </div>
                <p key={spent} className="anim-total mt-1.5 font-mono text-[34px] font-bold leading-none tracking-tight tabular-nums">
                  {fmtMoney(spent, cur)}
                </p>
                <p className="mt-2 font-mono text-[11px] text-paper-ink/60 tabular-nums">
                  {units} item{units === 1 ? "" : "s"} · {state.cart.length} product{state.cart.length === 1 ? "" : "s"} · live total
                </p>
              </div>
              <div className="tear-b" />
            </button>
          </div>

          {/* primary scan action */}
          <button
            onClick={onScan}
            className="press group flex w-full items-center justify-center gap-3 rounded-full bg-brand py-4 text-[15.5px] font-bold text-white shadow-xl shadow-brand/30"
          >
            <IScan size={21} className="transition-transform group-hover:scale-110" />
            Scan Product
            <kbd className="hidden rounded-md bg-white/15 px-1.5 py-0.5 font-mono text-[10.5px] sm:inline">S</kbd>
          </button>

          {/* quick chips */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            <button onClick={onGoLists} className="press flex flex-none items-center gap-2 rounded-full border border-line bg-raise px-3.5 py-2 text-[12px] font-semibold text-soft">
              <IListChecks size={15} className="text-brand" />
              {remainingChecks > 0 ? `${remainingChecks} list item${remainingChecks === 1 ? "" : "s"} to buy` : "Checklist complete"}
            </button>
            {state.cart.length > 0 && (
              <button onClick={onVerify} className="press flex flex-none items-center gap-2 rounded-full border border-amber/30 bg-amber-soft px-3.5 py-2 text-[12px] font-bold text-amber">
                <ICamera size={14} />
                Verify bill
              </button>
            )}
            {state.reminders[0] && (
              <button onClick={onGoLists} className="press flex flex-none items-center gap-2 rounded-full border border-line bg-raise px-3.5 py-2 text-[12px] font-semibold text-soft">
                <IBell size={14} className="text-amber" />
                <span className="max-w-[150px] truncate">{state.reminders[0].text}</span>
              </button>
            )}
            <button onClick={onGoHistory} className="press flex flex-none items-center gap-2 rounded-full border border-line bg-raise px-3.5 py-2 text-[12px] font-semibold text-soft">
              <IChevR size={14} className="text-faint" />
              {state.trips.length} trip{state.trips.length === 1 ? "" : "s"} saved
            </button>
          </div>

          {/* basket */}
          <div className="pt-1">
            <SectionLabel
              right={
                state.cart.length > 0 ? (
                  <span className="font-mono text-[10.5px] text-faint tabular-nums">
                    {state.cart.length} line{state.cart.length === 1 ? "" : "s"} · {units} unit{units === 1 ? "" : "s"}
                  </span>
                ) : undefined
              }
            >
              In your basket
            </SectionLabel>
            {state.cart.length === 0 ? (
              <EmptyState
                icon={<IBasket size={22} />}
                title="Your basket is empty"
                body="Point the camera at any pack — price lookup, totals and budget tracking are on."
              />
            ) : (
              <div className="space-y-2.5">
                {state.cart.length >= 3 && (
                  <div className="flex items-center gap-2 rounded-full border border-line bg-raise px-3.5 py-2 focus-within:border-brand">
                    <ISearch size={15} className="flex-none text-faint" />
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Search this basket…"
                      className="w-full bg-transparent text-[13px] placeholder:text-faint"
                    />
                    {q && (
                      <button onClick={() => setQ("")} className="text-[11px] font-bold text-faint">
                        clear
                      </button>
                    )}
                  </div>
                )}
                {(() => {
                  const query = q.trim().toLowerCase();
                  const visible = query
                    ? state.cart.filter(
                        (i) =>
                          i.name.toLowerCase().includes(query) ||
                          i.brand.toLowerCase().includes(query),
                      )
                    : state.cart;
                  if (visible.length === 0)
                    return (
                      <p className="rounded-[14px] border border-dashed border-line px-4 py-5 text-center text-[12.5px] text-faint">
                        Nothing in the basket matches “{q}”.
                      </p>
                    );
                  return (
                    <div className="overflow-hidden rounded-[16px] border border-line bg-raise">
                      {visible.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => setEditId(item.id)}
                    className={cx(
                      "press flex w-full items-center gap-3 px-3.5 py-3 text-left hover:bg-surface",
                      idx > 0 && "border-t border-line",
                    )}
                  >
                    <div className="h-11 w-11 flex-none overflow-hidden rounded-[10px] ring-1 ring-line">
                      <ProductArt art={item.art} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-bold leading-tight">{item.name}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-faint tabular-nums">
                        {item.qty} × {fmtMoney(item.unitPrice, cur)}
                        {item.note && <span className="ml-1.5 text-amber">· note</span>}
                      </p>
                    </div>
                    <span className="font-mono text-[13.5px] font-bold tabular-nums">
                      {fmtMoney(item.unitPrice * item.qty, cur)}
                    </span>
                    <IChevR size={15} className="flex-none text-faint" />
                      </button>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* frequent items */}
          {freq.length > 0 && (
            <div className="pt-1">
              <SectionLabel>
                <span className="inline-flex items-center gap-1.5">
                  <IStar size={12} className="text-amber" /> Frequent — tap to re-add
                </span>
              </SectionLabel>
              <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
                {freq.map(({ item, n }) => {
                  const hist = state.priceHistory[item.barcode];
                  const price = hist?.length ? hist[hist.length - 1].price : item.unitPrice;
                  return (
                    <button
                      key={item.barcode}
                      onClick={() => quickAdd({ item })}
                      className="press flex flex-none items-center gap-2.5 rounded-[14px] border border-line bg-raise py-2 pl-2 pr-3"
                    >
                      <div className="h-9 w-9 overflow-hidden rounded-[8px] ring-1 ring-line">
                        <ProductArt art={item.art} />
                      </div>
                      <div className="text-left">
                        <p className="max-w-[110px] truncate text-[12px] font-bold leading-tight">{item.name}</p>
                        <p className="font-mono text-[10.5px] text-faint tabular-nums">
                          {fmtMoney(price, cur)} · ×{n} bought
                        </p>
                      </div>
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-soft text-brand">
                        <IPlus size={13} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* new shopping */}
          <button
            onClick={() => (state.cart.length ? setFreshOpen(true) : push("Basket is already empty — scan away"))}
            className="press w-full rounded-full border border-line bg-raise py-3 text-[13px] font-semibold text-soft"
          >
            Start New Shopping
          </button>
        </div>
      </div>

      <EditSheet id={editId} onClose={() => setEditId(null)} onProduct={onProduct} />

      <Modal
        open={freshOpen}
        onClose={() => setFreshOpen(false)}
        title="Start a fresh basket?"
        actions={
          <>
            <button
              onClick={() => { setFreshOpen(false); onCheckout(); }}
              className="press flex-1 rounded-full bg-brand py-2.5 text-[13px] font-bold text-white"
            >
              Finish & save
            </button>
            <button
              onClick={() => { store.startNew(); setFreshOpen(false); push("Basket cleared"); }}
              className="press flex-1 rounded-full border border-danger/40 bg-danger-soft py-2.5 text-[13px] font-bold text-danger"
            >
              Clear list
            </button>
          </>
        }
      >
        Your current basket has {units} item{units === 1 ? "" : "s"} worth {fmtMoney(spent, cur)}. Save it to history first, or throw it away?
      </Modal>
    </div>
  );
}

/* ---------------- edit / details sheet ---------------- */

function EditSheet({
  id,
  onClose,
  onProduct,
}: {
  id: string | null;
  onClose: () => void;
  onProduct: (code: string) => void;
}) {
  const store = useStore();
  const { state } = store;
  const { push } = useToast();
  const cur = state.settings.currency;
  const item = state.cart.find((c) => c.id === id) ?? null;

  const [priceRaw, setPriceRaw] = useState("");
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [view, setView] = useState<"edit" | "details">("edit");
  const [confirmRm, setConfirmRm] = useState(false);

  useEffect(() => {
    if (item) {
      setPriceRaw(m2s(item.unitPrice));
      setQty(item.qty);
      setNote(item.note ?? "");
      setView("edit");
      setConfirmRm(false);
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!item) return <Sheet open={false} onClose={onClose}>{null}</Sheet>;

  const price = parseMoney(priceRaw);
  const product = productByCode(item.barcode);
  const draft = {
    name: item.name,
    brand: item.brand,
    pack: item.pack,
    category: item.category,
    art: item.art,
    tags: [item.name.toLowerCase()],
    manual: !!item.manual,
  };

  const save = () => {
    if (price === null || price <= 0) {
      buzz(state.settings.vibrate, 70);
      push("That price doesn’t look right", "err");
      return;
    }
    store.updateItem(item.id, { unitPrice: price, qty, note: note.trim() || undefined });
    push("Item updated — total recalculated");
    onClose();
  };

  const remove = () => {
    if (!confirmRm) {
      setConfirmRm(true);
      window.setTimeout(() => setConfirmRm(false), 2600);
      return;
    }
    store.removeItem(item.id);
    push(`${item.name} removed from basket`, "warn");
    onClose();
  };

  return (
    <Sheet open onClose={onClose} title={view === "edit" ? "Edit item" : "Product details"}>
      {view === "edit" ? (
        <div className="space-y-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 flex-none overflow-hidden rounded-[10px] ring-1 ring-line">
              <ProductArt art={item.art} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[14.5px] font-bold">{item.name}</p>
              <p className="text-[11.5px] text-soft">{item.brand || "Unbranded"} · {item.pack || "—"}</p>
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-faint">Unit price</p>
            <MoneyInput raw={priceRaw} onRaw={setPriceRaw} currency={cur} />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-faint">Quantity</p>
            <Stepper value={qty} onChange={setQty} />
          </div>

          <div>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-faint">Note</p>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Buy low-fat version next time"
              className="w-full rounded-[13px] border border-line bg-surface px-3.5 py-2.5 text-[13.5px] placeholder:text-faint focus:border-brand"
            />
          </div>

          <div className="flex items-center justify-between rounded-[13px] bg-surface px-4 py-3 ring-1 ring-line">
            <span className="font-mono text-[12.5px] text-soft tabular-nums">
              {price ? fmtMoney(price, cur) : "—"} × {qty}
            </span>
            <span className="font-mono text-[16px] font-bold tabular-nums">
              {price ? fmtMoney(price * qty, cur) : "—"}
            </span>
          </div>

          <div className="flex gap-2.5">
            <button onClick={save} className="press flex-1 rounded-full bg-brand py-3 text-[13.5px] font-bold text-white">
              Save changes
            </button>
            <button onClick={() => setView("details")} className="press rounded-full border border-line bg-surface px-4 py-3 text-[13px] font-semibold text-soft">
              Details
            </button>
          </div>
          <div className="flex gap-2.5 pb-1">
            <button
              onClick={() => { onClose(); onProduct(item.barcode); }}
              className="press flex flex-1 items-center justify-center gap-2 rounded-full border border-line bg-surface py-2.5 text-[12.5px] font-semibold text-soft"
            >
              <IScan size={15} /> Rescan
            </button>
            <button
              onClick={remove}
              className={cx(
                "press flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-[12.5px] font-bold",
                confirmRm ? "bg-danger text-white" : "border border-danger/35 bg-danger-soft text-danger",
              )}
            >
              <ITrash size={15} /> {confirmRm ? "Tap again to confirm" : "Remove"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 pb-2">
          {product ? (
            <ProductCard product={product} draft={draft} barcode={item.barcode} />
          ) : (
            <div className="rounded-[14px] border border-line bg-surface p-4 text-[12.5px] leading-relaxed text-soft">
              This was added manually, so there’s no database record yet — just your own price history.
              <div className="mt-2 flex items-center gap-2 font-mono text-[11px] text-faint">
                <IPencil size={13} /> barcode {item.barcode}
              </div>
            </div>
          )}
          <button onClick={() => setView("edit")} className="press w-full rounded-full border border-line bg-surface py-2.5 text-[13px] font-semibold text-soft">
            Back to editing
          </button>
        </div>
      )}
    </Sheet>
  );
}

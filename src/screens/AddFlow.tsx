import { useEffect, useRef, useState } from "react";
import type { CartItem, Category, Product } from "../lib/core";
import { buzz, cx, fmtDay, fmtMoney, parseMoney, timeAgo, uid } from "../lib/core";
import { fullCode, lookupBarcode } from "../lib/catalog";
import { useStore } from "../lib/store";
import { EanBarcode, ProductArt } from "../components/ProductArt";
import {
  IArrowDn,
  IArrowUp,
  IBack,
  ICheck,
  IListChecks,
  IRefresh,
  IScan,
  IWifiOff,
} from "../components/Icons";
import { Modal, MoneyInput, Sparkline, Stepper, useToast } from "../components/ui";

type Phase = "loading" | "found" | "manual" | "offline" | "price" | "done";

export interface Draft {
  name: string;
  brand: string;
  pack: string;
  category: Category;
  art: string;
  tags: string[];
  manual: boolean;
}

const CAT_STYLE: Record<Category, string> = {
  Dairy: "bg-[#dbe9f6] text-[#2f6fa8]",
  Bakery: "bg-[#f4e5c8] text-[#96650f]",
  Staples: "bg-[#e0ecdb] text-[#3f7a4e]",
  Snacks: "bg-[#f7e3d7] text-[#b45a2e]",
  Beverages: "bg-[#e9e2f2] text-[#6d4fa3]",
  "Personal Care": "bg-[#ddefea] text-[#2e7d6b]",
};

const m2s = (m: number) =>
  (m / 100).toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");

const CATEGORIES: Category[] = ["Dairy", "Bakery", "Staples", "Snacks", "Beverages", "Personal Care"];

/* ================= product info card ================= */

export function ProductCard({ product, draft, barcode }: { product?: Product; draft: Draft; barcode: string }) {
  const { state } = useStore();
  const cur = state.settings.currency;
  const points = state.priceHistory[barcode] ?? [];
  const last = points[points.length - 1];

  return (
    <div className="anim-rise overflow-hidden rounded-[18px] border border-line bg-raise">
      <div className="flex gap-4 p-4">
        <div className="h-[76px] w-[76px] flex-none overflow-hidden rounded-[14px] shadow-sm ring-1 ring-line">
          <ProductArt art={draft.art} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-display text-[17px] font-bold leading-snug">{draft.name}</h2>
            <span className={cx("mt-0.5 flex-none rounded-full px-2 py-0.5 text-[10.5px] font-bold", CAT_STYLE[draft.category])}>
              {draft.category}
            </span>
          </div>
          <p className="mt-0.5 text-[12.5px] text-soft">
            {draft.brand || "Unbranded"} · {draft.pack || "—"}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {product && (
              <span className="rounded-full bg-surface px-2 py-0.5 font-mono text-[10.5px] font-semibold text-soft ring-1 ring-line">
                MRP {fmtMoney(product.mrp, cur)}
              </span>
            )}
            {last && (
              <span className="rounded-full bg-brand-soft px-2 py-0.5 font-mono text-[10.5px] font-semibold text-brand-deep">
                Last paid {fmtMoney(last.price, cur)} · {timeAgo(last.date)}
              </span>
            )}
            {draft.manual && (
              <span className="rounded-full bg-amber-soft px-2 py-0.5 text-[10.5px] font-bold text-amber">
                Entered manually
              </span>
            )}
          </div>
        </div>
      </div>

      {/* barcode on receipt paper */}
      <div className="mx-4 mb-4 rounded-[12px] bg-paper px-4 pb-2.5 pt-3 text-paper-ink ring-1 ring-black/5">
        <EanBarcode code={barcode} />
      </div>

      {product?.nutrition && (
        <div className="border-t border-line px-4 py-3.5">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-faint">
            Nutrition · per 100 g
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {[
              ["Energy", `${product.nutrition.kcal} kcal`],
              ["Protein", `${product.nutrition.protein} g`],
              ["Carbs", `${product.nutrition.carbs} g`],
              ["Fat", `${product.nutrition.fat} g`],
              ...(product.nutrition.sugar !== undefined ? [["Sugar", `${product.nutrition.sugar} g`]] : []),
              ...(product.nutrition.fibre !== undefined ? [["Fibre", `${product.nutrition.fibre} g`]] : []),
            ].map(([k, v]) => (
              <div key={k} className="rounded-[10px] bg-surface px-2.5 py-2 ring-1 ring-line">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-faint">{k}</p>
                <p className="mt-0.5 font-mono text-[13px] font-semibold tabular-nums">{v}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {product?.ingredients && (
        <div className="border-t border-line px-4 py-3.5">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-faint">Ingredients</p>
          <p className="mt-1 text-[12px] leading-relaxed text-soft">{product.ingredients}</p>
        </div>
      )}

      {points.length >= 2 && (
        <div className="border-t border-line px-4 py-3.5">
          <div className="flex items-center justify-between">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-faint">Price trend</p>
            <span className="font-mono text-[10.5px] text-faint">{points.length} records</span>
          </div>
          <Sparkline points={points.map((p) => p.price)} color="var(--c-brand)" />
        </div>
      )}
    </div>
  );
}

/* ================= main flow ================= */

export function AddFlow({
  barcode,
  onBack,
  onScanNext,
  onViewList,
}: {
  barcode: string;
  onBack: () => void;
  onScanNext: () => void;
  onViewList: () => void;
}) {
  const store = useStore();
  const { state } = store;
  const { push } = useToast();
  const cur = state.settings.currency;

  const [phase, setPhase] = useState<Phase>("loading");
  const [product, setProduct] = useState<Product | null>(null);
  const [retry, setRetry] = useState(0);
  const [mName, setMName] = useState("");
  const [mBrand, setMBrand] = useState("");
  const [mPack, setMPack] = useState("");
  const [mCat, setMCat] = useState<Category>("Staples");
  const [mErr, setMErr] = useState("");
  const [priceRaw, setPriceRaw] = useState("");
  const [priceTouched, setPriceTouched] = useState(false);
  const [qty, setQty] = useState(state.settings.defaultQty);
  const [note, setNote] = useState("");
  const [dupOpen, setDupOpen] = useState(false);
  const [pending, setPending] = useState<CartItem | null>(null);
  const [doneInfo, setDoneInfo] = useState<{ name: string; qty: number; total: number } | null>(null);
  const ranOnce = useRef(false);

  const points = state.priceHistory[barcode] ?? [];
  const last = points[points.length - 1];
  const price = parseMoney(priceRaw);
  const priceBad = priceTouched && (price === null || price <= 0);
  const itemTotal = price && price > 0 ? price * qty : null;
  const existing = state.cart.find((c) => c.barcode === barcode);

  const draft: Draft = product
    ? {
        name: product.name,
        brand: product.brand,
        pack: product.pack,
        category: product.category,
        art: product.art,
        tags: product.tags,
        manual: false,
      }
    : {
        name: mName.trim(),
        brand: mBrand.trim(),
        pack: mPack.trim(),
        category: mCat,
        art: "basket",
        tags: [mName.trim().toLowerCase()],
        manual: true,
      };

  /* -------- lookup (swap-in point for the real API) -------- */
  useEffect(() => {
    let alive = true;
    if (!ranOnce.current) ranOnce.current = true;
    setPhase("loading");
    setProduct(null);
    lookupBarcode(barcode, state.settings.offline).then((res) => {
      if (!alive) return;
      if (res.status === "offline") setPhase("offline");
      else if (res.status === "found") {
        setProduct(res.product);
        setPhase("found");
      } else setPhase("manual");
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barcode, retry]);

  const startManual = () => {
    setMErr("");
    setPhase("manual");
  };

  const continueFromManual = () => {
    if (!mName.trim()) {
      setMErr("Give the product a name — even “Loose tomatoes 1 kg” works.");
      buzz(state.settings.vibrate, 70);
      return;
    }
    setPhase("price");
  };

  const commit = (item: CartItem, silentMerge = false) => {
    if (silentMerge) {
      const ex = existing!;
      store.mergeQty(ex.id, item.qty);
      setDoneInfo({ name: ex.name, qty: ex.qty + item.qty, total: ex.unitPrice * (ex.qty + item.qty) });
    } else {
      store.addItem(item);
      setDoneInfo({ name: item.name, qty: item.qty, total: item.unitPrice * item.qty });
      const matched = store.matchChecklist(item.name, draft.tags);
      if (matched)
        window.setTimeout(() => push(`Checklist: “${matched}” ticked off`, "warn"), 350);
    }
    buzz(state.settings.vibrate, [30, 30, 30]);
    setDupOpen(false);
    setPending(null);
    setPhase("done");
  };

  const tryAdd = () => {
    setPriceTouched(true);
    if (price === null || price <= 0) {
      buzz(state.settings.vibrate, 80);
      push("Enter the price you paid first", "err");
      return;
    }
    const item: CartItem = {
      id: uid(),
      barcode,
      name: draft.name,
      brand: draft.brand,
      pack: draft.pack,
      category: draft.category,
      art: draft.art,
      unitPrice: price,
      qty,
      note: note.trim() || undefined,
      addedAt: Date.now(),
      manual: draft.manual,
    };
    if (existing) {
      setPending(item);
      setDupOpen(true);
    } else commit(item);
  };

  const header = (title: string) => (
    <div className="flex items-center gap-2 px-4 pb-3 pt-4">
      <button onClick={onBack} className="press flex h-10 w-10 items-center justify-center rounded-full border border-line bg-raise text-soft" aria-label="Back">
        <IBack size={18} />
      </button>
      <div>
        <h1 className="font-display text-[17px] font-bold leading-tight">{title}</h1>
        <p className="font-mono text-[10.5px] tracking-[0.14em] text-faint">{barcode}</p>
      </div>
    </div>
  );

  const delta = price && last ? price - last.price : null;

  return (
    <div className="anim-rise flex h-full flex-col">
      {phase === "loading" && (
        <>
          {header("Looking up product")}
          <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-6 scroll-thin">
            <div className="rounded-[18px] border border-line bg-raise p-4">
              <div className="flex gap-4">
                <div className="shimmer h-[76px] w-[76px] flex-none rounded-[14px]" />
                <div className="flex-1 space-y-2.5 pt-1">
                  <div className="shimmer h-4 w-3/4 rounded-full" />
                  <div className="shimmer h-3 w-1/2 rounded-full" />
                  <div className="shimmer h-3 w-2/3 rounded-full" />
                </div>
              </div>
              <div className="mx-auto mt-5 max-w-[200px] text-faint">
                <EanBarcode code={barcode} height={26} />
              </div>
            </div>
            <div className="shimmer h-24 rounded-[16px]" />
            <p className="pt-1 text-center text-[12px] text-faint">
              Querying product database… works offline too — you can always type it in yourself.
            </p>
          </div>
        </>
      )}

      {phase === "offline" && (
        <>
          {header("No connection")}
          <div className="flex flex-1 flex-col items-center justify-center px-8 pb-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger-soft text-danger">
              <IWifiOff size={30} />
            </div>
            <h2 className="font-display mt-4 text-[18px] font-bold">Can’t reach the product database</h2>
            <p className="mt-1.5 max-w-[260px] text-[13px] leading-relaxed text-soft">
              No problem — nothing is lost. Enter the product by hand now; details can refresh next time you’re online.
            </p>
            <div className="mt-6 flex w-full max-w-[260px] flex-col gap-2.5">
              <button onClick={startManual} className="press rounded-full bg-brand py-3 text-[14px] font-bold text-white shadow-lg shadow-brand/25">
                Enter product manually
              </button>
              <button onClick={() => setRetry((r) => r + 1)} className="press flex items-center justify-center gap-2 rounded-full border border-line bg-raise py-3 text-[13.5px] font-semibold text-soft">
                <IRefresh size={16} /> Retry lookup
              </button>
            </div>
          </div>
        </>
      )}

      {phase === "found" && product && (
        <>
          {header("Product found")}
          <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-4 scroll-thin">
            <ProductCard product={product} draft={draft} barcode={barcode} />
            <button
              onClick={() => setPhase("price")}
              className="press w-full rounded-full bg-brand py-3.5 text-[14.5px] font-bold text-white shadow-lg shadow-brand/25"
            >
              Continue — enter price paid
            </button>
            <button onClick={startManual} className="press w-full rounded-full border border-line bg-raise py-3 text-[13px] font-semibold text-soft">
              Not the right product? Enter manually
            </button>
          </div>
        </>
      )}

      {phase === "manual" && (
        <>
          {header("Product not found")}
          <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-6 scroll-thin">
            <div className="flex items-start gap-2.5 rounded-[14px] border border-amber/25 bg-amber-soft px-4 py-3">
              <IScan size={16} className="mt-0.5 flex-none text-amber" />
              <p className="text-[12.5px] leading-relaxed text-amber">
                This barcode isn’t in the database yet. Add it yourself — it takes ten seconds and you’ll never lose the item.
              </p>
            </div>
            <div className="space-y-3 rounded-[18px] border border-line bg-raise p-4">
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-faint">Product name *</span>
                <input
                  value={mName}
                  onChange={(e) => { setMName(e.target.value); setMErr(""); }}
                  placeholder="e.g. Loose tomatoes"
                  className={cx(
                    "w-full rounded-[13px] border bg-surface px-3.5 py-3 text-[15px] placeholder:text-faint focus:border-brand",
                    mErr ? "border-danger" : "border-line",
                  )}
                />
                {mErr && <span className="mt-1.5 block text-[11.5px] text-danger">{mErr}</span>}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-faint">Brand</span>
                  <input value={mBrand} onChange={(e) => setMBrand(e.target.value)} placeholder="Optional"
                    className="w-full rounded-[13px] border border-line bg-surface px-3.5 py-3 text-[15px] placeholder:text-faint focus:border-brand" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-faint">Pack size</span>
                  <input value={mPack} onChange={(e) => setMPack(e.target.value)} placeholder="e.g. 1 kg"
                    className="w-full rounded-[13px] border border-line bg-surface px-3.5 py-3 text-[15px] placeholder:text-faint focus:border-brand" />
                </label>
              </div>
              <div>
                <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-faint">Category</span>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((c) => (
                    <button key={c} onClick={() => setMCat(c)}
                      className={cx(
                        "press rounded-full border px-3 py-1.5 text-[12px] font-semibold",
                        mCat === c ? "border-brand bg-brand text-white" : "border-line bg-surface text-soft",
                      )}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={continueFromManual} className="press w-full rounded-full bg-brand py-3.5 text-[14.5px] font-bold text-white shadow-lg shadow-brand/25">
              Save & enter price
            </button>
          </div>
        </>
      )}

      {phase === "price" && (
        <>
          {header("How much did you pay?")}
          <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-4 scroll-thin">
            <div className="flex items-center gap-3 rounded-[16px] border border-line bg-raise p-3">
              <div className="h-12 w-12 flex-none overflow-hidden rounded-[10px] ring-1 ring-line">
                <ProductArt art={draft.art} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-bold">{draft.name}</p>
                <p className="text-[11.5px] text-soft">{draft.brand || "Unbranded"} · {draft.pack || "no pack size"}</p>
              </div>
            </div>

            <div className="rounded-[18px] border border-line bg-raise p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-faint">Price per unit · {cur}</p>
                <div className="flex gap-1.5">
                  {product && (
                    <button onClick={() => setPriceRaw(m2s(product.mrp))}
                      className="press rounded-full bg-surface px-2.5 py-1 font-mono text-[10.5px] font-semibold text-soft ring-1 ring-line">
                      MRP {m2s(product.mrp)}
                    </button>
                  )}
                  {last && (
                    <button onClick={() => setPriceRaw(m2s(last.price))}
                      className="press rounded-full bg-brand-soft px-2.5 py-1 font-mono text-[10.5px] font-semibold text-brand-deep">
                      Last {m2s(last.price)}
                    </button>
                  )}
                </div>
              </div>
              <MoneyInput raw={priceRaw} onRaw={(v) => { setPriceRaw(v); setPriceTouched(true); }} currency={cur} big invalid={priceBad} />
              {priceBad && <p className="mt-1.5 text-[11.5px] text-danger">Enter a valid price greater than zero.</p>}

              {last && (
                <div className="mt-3 rounded-[12px] bg-surface px-3.5 py-2.5 ring-1 ring-line">
                  {delta === null || delta === 0 ? (
                    <p className="text-[12px] font-semibold text-soft">
                      Same as last time ({fmtMoney(last.price, cur)} · {timeAgo(last.date)})
                    </p>
                  ) : (
                    <p className={cx("flex items-center gap-1.5 text-[12px] font-bold", delta > 0 ? "text-amber" : "text-brand")}>
                      {delta > 0 ? <IArrowUp size={14} /> : <IArrowDn size={14} />}
                      {fmtMoney(Math.abs(delta), cur)} {delta > 0 ? "higher" : "lower"} than last time ({fmtMoney(last.price, cur)})
                    </p>
                  )}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-faint">Quantity</p>
                  <p className="mt-0.5 text-[11.5px] text-faint">default {state.settings.defaultQty}</p>
                </div>
                <Stepper value={qty} onChange={setQty} />
              </div>

              <div className="mt-4 border-t border-dashed border-line pt-3.5">
                <div className="flex items-center justify-between text-[13px] text-soft">
                  <span className="font-mono tabular-nums">{price ? fmtMoney(price, cur) : "—"} × {qty}</span>
                  <span className="font-display text-[17px] font-bold text-ink tabular-nums">
                    {itemTotal ? fmtMoney(itemTotal, cur) : "—"}
                  </span>
                </div>
              </div>

              <label className="mt-4 block">
                <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-faint">Note (optional)</span>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Buy low-fat version next time"
                  className="w-full rounded-[13px] border border-line bg-surface px-3.5 py-2.5 text-[13.5px] placeholder:text-faint focus:border-brand"
                />
              </label>
            </div>

            {existing && (
              <p className="flex items-center gap-2 rounded-[12px] bg-amber-soft px-3.5 py-2.5 text-[12px] font-semibold text-amber">
                <IListChecks size={15} /> Already in your basket — you’ll be asked how to handle it.
              </p>
            )}

            <button onClick={tryAdd} className="press w-full rounded-full bg-brand py-4 text-[15px] font-bold text-white shadow-lg shadow-brand/25">
              Add to Shopping List
            </button>
          </div>
        </>
      )}

      {phase === "done" && doneInfo && (
        <div className="flex flex-1 flex-col items-center justify-center px-8 pb-10 text-center">
          <div className="anim-pop flex h-20 w-20 items-center justify-center rounded-full bg-brand text-white shadow-xl shadow-brand/30">
            <ICheck size={38} />
          </div>
          <h2 className="font-display mt-5 text-[22px] font-bold">Added to basket</h2>
          <p className="mt-1 text-[13.5px] text-soft">{doneInfo.name}</p>
          <p className="mt-3 rounded-full bg-surface px-4 py-1.5 font-mono text-[15px] font-bold tabular-nums ring-1 ring-line">
            {doneInfo.qty} × → {fmtMoney(doneInfo.total, cur)}
          </p>
          <div className="mt-8 flex w-full max-w-[270px] flex-col gap-2.5">
            <button onClick={onScanNext} className="press flex items-center justify-center gap-2 rounded-full bg-brand py-3.5 text-[14.5px] font-bold text-white shadow-lg shadow-brand/25">
              <IScan size={18} /> Scan Next Item
            </button>
            <button onClick={onViewList} className="press rounded-full border border-line bg-raise py-3 text-[13.5px] font-semibold text-soft">
              View Shopping List
            </button>
          </div>
        </div>
      )}

      {/* duplicate handling */}
      <Modal
        open={dupOpen}
        onClose={() => { setDupOpen(false); setPending(null); }}
        title="Already in your basket"
        actions={
          <>
            <button
              onClick={() => pending && commit(pending, true)}
              className="press flex-1 rounded-full bg-brand py-2.5 text-[13px] font-bold text-white"
            >
              Increase quantity
            </button>
            <button
              onClick={() => pending && commit(pending)}
              className="press flex-1 rounded-full border border-line bg-surface py-2.5 text-[13px] font-semibold text-soft"
            >
              Separate item
            </button>
          </>
        }
      >
        You already added <strong className="text-ink">{existing?.name}</strong> ({existing?.qty} in basket).
        Increase its quantity by {pending?.qty}, or add this as a separate line?
        <button
          onClick={() => { setDupOpen(false); setPending(null); }}
          className="press mt-3 w-full rounded-full border border-line py-2 text-[12px] font-semibold text-faint"
        >
          Cancel
        </button>
      </Modal>
    </div>
  );
}

/* re-export helper so other screens can open product pages for saved codes */
export const codeFor = (p: Product) => fullCode(p);

import type { CartItem } from "./core";
import { uid } from "./core";
import { productByCode } from "./catalog";

/* ------------------------------------------------------------------ */
/* Bill verification engine.                                           */
/* simulateBillRead() stands in for on-device OCR (ML Kit Text         */
/* Recognition on Android) — it "reads" the captured receipt and       */
/* reconciles every printed line against the user's shopping list.     */
/* ------------------------------------------------------------------ */

export type LineStatus = "match" | "price" | "qty" | "extra";

export interface BillLine {
  id: string;
  /** exactly as printed on the receipt */
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  status: LineStatus;
  /** the item in your list this line matched, if any */
  matchedName?: string;
  matchedPack?: string;
  /** what your list says this line should cost */
  expectedTotal: number;
  /** printed total − expected total (minor units) */
  delta: number;
  /** human-readable reason for a mismatch */
  reason?: string;
}

export interface BillResult {
  lines: BillLine[];
  /** items on your list that never appear on the bill */
  missing: CartItem[];
  billTotal: number;
  listTotal: number;
  diff: number;
  matchedCount: number;
  capturedAt: number;
}

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

/** Receipt printers shout: "AMUL TAAZA MILK 500ML" */
function receiptName(item: CartItem): string {
  const base = `${item.brand ? item.brand + " " : ""}${item.name}`.toUpperCase();
  const pack = (item.pack || "").toUpperCase();
  const full = pack && !base.includes(pack) ? `${base} ${pack}` : base;
  return full.length > 34 ? full.slice(0, 33) + "…" : full;
}

export function simulateBillRead(cart: CartItem[]): BillResult {
  const lines: BillLine[] = [];
  const missing: CartItem[] = [];
  let priceGlitch = false;
  let qtyGlitch = false;

  // Occasionally the cashier misses an item entirely (it goes free).
  const dropIdx =
    cart.length >= 4 && Math.random() < 0.28
      ? Math.floor(Math.random() * cart.length)
      : -1;

  cart.forEach((item, idx) => {
    if (idx === dropIdx) {
      missing.push(item);
      return;
    }
    const product = productByCode(item.barcode);
    const r = Math.random();
    let qty = item.qty;
    let unit = item.unitPrice;
    let status: LineStatus = "match";
    let reason: string | undefined;

    if (!priceGlitch && product && product.mrp > item.unitPrice && r < 0.5) {
      unit = product.mrp;
      status = "price";
      priceGlitch = true;
      reason = `Charged MRP ${item.pack ? "instead of the shelf price you noted" : ""}`.trim();
    } else if (!qtyGlitch && item.qty < 5 && r >= 0.5 && r < 0.68) {
      qty = item.qty + 1;
      status = "qty";
      qtyGlitch = true;
      reason = "Scanned one extra time";
    }

    const expected = item.unitPrice * item.qty;
    const lineTotal = unit * qty;
    lines.push({
      id: uid(),
      name: receiptName(item),
      qty,
      unitPrice: unit,
      lineTotal,
      status,
      matchedName: item.name,
      matchedPack: item.pack,
      expectedTotal: expected,
      delta: lineTotal - expected,
      reason,
    });
  });

  // Bigger baskets almost always hide at least one discrepancy.
  const hasIssue = lines.some((l) => l.delta !== 0) || missing.length > 0;
  if (!hasIssue && lines.length >= 3) {
    const biggest = lines.reduce((a, b) => (b.lineTotal > a.lineTotal ? b : a));
    const bump = pick([500, 1000, 1500, 2000]);
    biggest.unitPrice += bump;
    biggest.lineTotal = biggest.unitPrice * biggest.qty;
    biggest.delta = biggest.lineTotal - biggest.expectedTotal;
    biggest.status = "price";
    biggest.reason = "Printed higher than the price you paid";
  }

  // The classic surprise line.
  if (Math.random() < 0.32) {
    const fee = pick([500, 1000, 1500, 2000]);
    lines.push({
      id: uid(),
      name: pick(["CARRY BAG / SHOPPER", "POLYTHENE BAG", "PAPER BAG CHARGE"]),
      qty: 1,
      unitPrice: fee,
      lineTotal: fee,
      status: "extra",
      expectedTotal: 0,
      delta: fee,
      reason: "Not in your list — bag or packaging charge",
    });
  }

  const billTotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const listTotal = cart.reduce((s, i) => s + i.unitPrice * i.qty, 0);

  return {
    lines,
    missing,
    billTotal,
    listTotal,
    diff: billTotal - listTotal,
    matchedCount: lines.filter((l) => l.status === "match").length,
    capturedAt: Date.now(),
  };
}

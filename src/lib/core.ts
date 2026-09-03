/* ------------------------------------------------------------------ */
/* Core domain types + pure helpers.                                   */
/* All money is stored as INTEGER minor units (paise / cents) so the   */
/* app never touches floating point arithmetic.                        */
/* ------------------------------------------------------------------ */

export type Category =
  | "Dairy"
  | "Bakery"
  | "Staples"
  | "Snacks"
  | "Beverages"
  | "Personal Care";

export type CurrencyCode = "INR" | "PKR" | "USD" | "EUR" | "GBP";

export interface Product {
  id: string;
  /** first 12 digits — the 13th check digit is derived */
  barcode12: string;
  name: string;
  brand: string;
  pack: string;
  category: Category;
  art: string;
  /** reference MRP in minor units */
  mrp: number;
  ingredients?: string;
  nutrition?: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
    sugar?: number;
    fibre?: number;
  };
  /** lowercase words used for checklist auto-matching */
  tags: string[];
}

export interface CartItem {
  id: string;
  barcode: string;
  name: string;
  brand: string;
  pack: string;
  category: Category;
  art: string;
  unitPrice: number;
  qty: number;
  note?: string;
  addedAt: number;
  manual?: boolean;
}

export interface Trip {
  id: string;
  date: number;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  extra: number;
  total: number;
}

export interface ChecklistItem {
  id: string;
  name: string;
  done: boolean;
}

export interface Reminder {
  id: string;
  text: string;
}

export interface PricePoint {
  price: number;
  date: number;
}

export type ThemeMode = "system" | "light" | "dark";

export interface Settings {
  currency: CurrencyCode;
  /** 0 = budget off */
  budget: number;
  theme: ThemeMode;
  sound: boolean;
  vibrate: boolean;
  defaultQty: number;
  /** demo scanner auto-detects a barcode shortly after opening */
  autoScan: boolean;
  /** demo: force the product API to fail (offline mode) */
  offline: boolean;
  cameraAllowed: boolean;
}

export interface CheckoutExtras {
  discount: number;
  tax: number;
  extra: number;
}

/* ---------------- ids ---------------- */

export const uid = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);

/* ---------------- money ---------------- */

const LOCALE: Record<CurrencyCode, string> = {
  INR: "en-IN",
  PKR: "en-PK",
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
};

export function fmtMoney(minor: number, cur: CurrencyCode): string {
  const hasPaise = Math.abs(minor) % 100 !== 0;
  return new Intl.NumberFormat(LOCALE[cur], {
    style: "currency",
    currency: cur,
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: hasPaise ? 2 : 0,
  }).format(minor / 100);
}

export const CURRENCY_SYMBOL: Record<CurrencyCode, string> = {
  INR: "₹",
  PKR: "Rs",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

/** "450" | "450.5" | "1,200.25" → minor units, or null when invalid */
export function parseMoney(raw: string): number | null {
  const s = raw.replace(/[^0-9.]/g, "");
  if (!s || s === ".") return null;
  const parts = s.split(".");
  if (parts.length > 2) return null;
  const whole = parseInt(parts[0] || "0", 10);
  const frac = parts[1] ? parts[1].slice(0, 2).padEnd(2, "0") : "00";
  const v = whole * 100 + parseInt(frac, 10);
  return Number.isFinite(v) && v >= 0 ? v : null;
}

/* ---------------- dates ---------------- */

const DAY = 86_400_000;

export function fmtDay(ts: number): string {
  return new Date(ts).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
export function fmtDayFull(ts: number): string {
  return new Date(ts).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
export function timeAgo(ts: number): string {
  const d = Date.now() - ts;
  if (d < DAY) {
    const h = Math.floor(d / 3_600_000);
    if (h < 1) return "today";
    return `${h}h ago`;
  }
  const days = Math.floor(d / DAY);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  const w = Math.floor(days / 7);
  return w === 1 ? "last week" : `${w} weeks ago`;
}
export const inLast7Days = (ts: number) => Date.now() - ts < 7 * DAY;
export const inThisMonth = (ts: number) => {
  const a = new Date(ts);
  const b = new Date();
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
};

/* ---------------- EAN-13 (real encoding, real check digit) -------- */

export function eanCheckDigit(d12: string): number {
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(d12[i]) * (i % 2 === 0 ? 1 : 3);
  return (10 - (sum % 10)) % 10;
}
export const ean13 = (b12: string) => b12 + String(eanCheckDigit(b12));

const L = [
  "0001101", "0011001", "0010011", "0111101", "0100011",
  "0110001", "0101111", "0111011", "0110111", "0001011",
];
const R = [
  "1110010", "1100110", "1101100", "1000010", "1011100",
  "1001110", "1010000", "1000100", "1001000", "1110100",
];
const G = R.map((c) => c.split("").reverse().join(""));
const PARITY = [
  "LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG",
  "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL",
];

/** EAN-13 module bit string (95 modules) */
export function eanBits(code13: string): string {
  const d = code13.replace(/\D/g, "").padEnd(13, "0").slice(0, 13);
  const parity = PARITY[Number(d[0])];
  let left = "";
  for (let i = 0; i < 6; i++) {
    const digit = Number(d[i + 1]);
    left += parity[i] === "L" ? L[digit] : G[digit];
  }
  let right = "";
  for (let i = 0; i < 6; i++) right += R[Number(d[i + 7])];
  return "101" + left + "01010" + right + "101";
}

export const isValidBarcode = (s: string) =>
  /^\d{8}$/.test(s) || /^\d{12,13}$/.test(s);

/* ---------------- misc ---------------- */

export const cx = (...p: Array<string | false | null | undefined>) =>
  p.filter(Boolean).join(" ");

export const normalize = (s: string) => s.trim().toLowerCase();

export function beep(enabled: boolean) {
  if (!enabled) return;
  try {
    const Ctx = window.AudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "square";
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(1560, ctx.currentTime + 0.09);
    g.gain.setValueAtTime(0.06, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.16);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.17);
    setTimeout(() => ctx.close(), 400);
  } catch {
    /* audio unavailable — ignore */
  }
}

export function buzz(enabled: boolean, pattern: number | number[] = 55) {
  if (!enabled) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* no vibration support */
  }
}

export const STORAGE_KEY = "kirana-cart-v1";

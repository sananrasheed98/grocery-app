import type {
  CartItem,
  ChecklistItem,
  PricePoint,
  Product,
  Reminder,
  Trip,
} from "./core";
import { ean13, uid } from "./core";

/* ------------------------------------------------------------------ */
/* Embedded product database.                                          */
/*                                                                     */
/* `lookupBarcode` is the single seam where a real API (Open Food      */
/* Facts, GS1, UPCitemdb…) would plug in — swap the body, keep the     */
/* LookupResult contract, and nothing else in the app changes.         */
/* ------------------------------------------------------------------ */

const P = (
  id: string,
  barcode12: string,
  name: string,
  brand: string,
  pack: string,
  category: Product["category"],
  art: string,
  mrp: number,
  tags: string[],
  ingredients?: string,
  nutrition?: Product["nutrition"],
): Product => ({ id, barcode12, name, brand, pack, category, art, mrp, tags, ingredients, nutrition });

export const PRODUCTS: Product[] = [
  P("milk", "890103089102", "Amul Taaza Toned Milk", "Amul", "500 ml pouch", "Dairy", "milk", 2800,
    ["milk", "doodh", "toned"],
    "Pasteurised toned milk, vitamin A & D fortification",
    { kcal: 58, protein: 3.1, carbs: 4.5, fat: 3.0, sugar: 4.5 }),
  P("bread", "890149110012", "Whole Wheat Brown Bread", "Britannia", "400 g loaf", "Bakery", "bread", 4500,
    ["bread", "pav", "wheat loaf"],
    "Whole wheat flour (62%), water, sugar, gluten, yeast, salt, emulsifier (471)",
    { kcal: 248, protein: 8.6, carbs: 45, fat: 3.2, sugar: 5.1, fibre: 6.4 }),
  P("eggs", "890604553012", "Farm Eggs — Dozen", "Eggoz", "12 × ~58 g", "Dairy", "eggs", 8500,
    ["eggs", "anda", "eggoz"],
    "Antibiotic-free farm eggs, UV sanitised"),
  P("rice", "890181110052", "Super Basmati Rice", "India Gate", "5 kg bag", "Staples", "rice", 42000,
    ["rice", "chawal", "basmati"],
    "100% super basmati rice, aged 12 months",
    { kcal: 352, protein: 7.1, carbs: 78.2, fat: 0.6, fibre: 1.4 }),
  P("oil", "890108800511", "Refined Sunflower Oil", "Fortune", "1 L pouch", "Staples", "oil", 14500,
    ["oil", "tel", "sunflower", "cooking oil"],
    "Refined sunflower oil, vitamin E",
    { kcal: 884, protein: 0, carbs: 0, fat: 100 }),
  P("atta", "890172511312", "Chakki Fresh Atta", "Aashirvaad", "5 kg pack", "Staples", "atta", 26500,
    ["atta", "flour", "wheat", "chakki"],
    "100% whole wheat chakki ground flour",
    { kcal: 340, protein: 12, carbs: 69, fat: 2, fibre: 11 }),
  P("dal", "890172512831", "Unpolished Toor Dal", "Tata Sampann", "1 kg pack", "Staples", "dal", 16500,
    ["dal", "toor", "arhar", "lentil"],
    "Unpolished toor (arhar) dal, 5% high-protein",
    { kcal: 348, protein: 22.3, carbs: 59, fat: 1.4, fibre: 15 }),
  P("sugar", "890172513422", "Fine Crystal Sugar", "Madhur", "1 kg pack", "Staples", "sugar", 4600,
    ["sugar", "chini", "cheeni"],
    "Refined crystal sugar",
    { kcal: 400, protein: 0, carbs: 100, fat: 0 }),
  P("salt", "890172514053", "Iodised Salt", "Tata Salt", "1 kg pack", "Staples", "salt", 2800,
    ["salt", "namak", "iodised"],
    "Vacuum evaporated iodised salt",
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }),
  P("tea", "890172515611", "Premium Assam Tea", "Tata Gold", "500 g pack", "Beverages", "tea", 29000,
    ["tea", "chai", "assam"],
    "100% pure Assam orthodox tea, long leaves",
    { kcal: 2, protein: 0, carbs: 0.4, fat: 0 }),
  P("coffee", "890172516281", "Classic Instant Coffee", "Nescafé", "50 g jar", "Beverages", "coffee", 17500,
    ["coffee", "nescafe", "instant"],
    "100% pure instant coffee",
    { kcal: 3, protein: 0.2, carbs: 0.6, fat: 0 }),
  P("biscuit", "890172517845", "Marie Gold Biscuits", "Britannia", "250 g pack", "Snacks", "biscuit", 3500,
    ["biscuit", "marie", "cookie"],
    "Wheat flour, sugar, palm oil, milk solids, raising agents",
    { kcal: 443, protein: 7.4, carbs: 74, fat: 12, sugar: 22 }),
  P("noodles", "890172518490", "2-Minute Masala Noodles", "Maggi", "4 × 70 g pack", "Snacks", "noodles", 6000,
    ["noodles", "maggi", "ramen"],
    "Wheat flour, palm oil, salt, masala tastemaker (onion, garlic, spices)",
    { kcal: 448, protein: 9.2, carbs: 63, fat: 16 }),
  P("cheese", "890172519034", "Processed Cheese Slices", "Amul", "200 g · 10 slices", "Dairy", "cheese", 15500,
    ["cheese", "paneer slice"],
    "Cheese, milk solids, emulsifying salts, salt",
    { kcal: 312, protein: 18, carbs: 6, fat: 25 }),
  P("wash", "890172520112", "pH-Balanced Handwash", "Dettol", "750 ml refill", "Personal Care", "wash", 19900,
    ["handwash", "soap", "dettol", "wash"],
    "Aqua, surfactants, chloroxylenol, glycerin, fragrance"),
  P("paste", "890172521776", "Strong Teeth Toothpaste", "Colgate", "200 g pack", "Personal Care", "paste", 11000,
    ["toothpaste", "colgate", "paste"],
    "Calcium carbonate, sorbitol, sodium fluoride (1000 ppm)"),
];

const byId = new Map(PRODUCTS.map((p) => [p.id, p]));
const byCode = new Map<string, Product>();
for (const p of PRODUCTS) {
  byCode.set(ean13(p.barcode12), p);
  byCode.set(p.barcode12, p);
}

export const fullCode = (p: Product) => ean13(p.barcode12);
export const productById = (id: string) => byId.get(id);
export const productByCode = (code: string) => byCode.get(code);

/* ---------------- API layer (swap-in point) ---------------- */

export type LookupResult =
  | { status: "found"; product: Product }
  | { status: "not-found" }
  | { status: "offline" };

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Resolve a barcode to product info. Replace the body of this function
 * with a fetch() to your preferred product API — the rest of the app only
 * consumes `LookupResult`.
 */
export async function lookupBarcode(
  code: string,
  simulateOffline: boolean,
): Promise<LookupResult> {
  await wait(650 + Math.random() * 550); // realistic network latency
  if (simulateOffline) return { status: "offline" };
  const hit = byCode.get(code.replace(/\D/g, ""));
  return hit ? { status: "found", product: hit } : { status: "not-found" };
}

export const demoShelf = (): Product[] => {
  const picks = ["milk", "bread", "eggs", "rice", "oil", "tea"];
  return picks.map((id) => byId.get(id)!).filter(Boolean);
};

export const randomProduct = (): Product =>
  PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];

/* ---------------- seed data (first run only) ---------------- */

const DAY = 86_400_000;

function mkItem(id: string, price: number, qty: number, daysAgo: number): CartItem {
  const p = byId.get(id)!;
  return {
    id: uid(),
    barcode: fullCode(p),
    name: p.name,
    brand: p.brand,
    pack: p.pack,
    category: p.category,
    art: p.art,
    unitPrice: price,
    qty,
    addedAt: Date.now() - daysAgo * DAY,
  };
}

function mkTrip(items: CartItem[], daysAgo: number): Trip {
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  return {
    id: uid(),
    date: Date.now() - daysAgo * DAY - 3_600_000 * (daysAgo % 5),
    items,
    subtotal,
    discount: 0,
    tax: 0,
    extra: 0,
    total: subtotal,
  };
}

export function seedTrips(): Trip[] {
  return [
    mkTrip(
      [
        mkItem("rice", 42000, 1, 16),
        mkItem("oil", 13900, 1, 16),
        mkItem("atta", 25900, 1, 16),
        mkItem("dal", 15900, 1, 16),
        mkItem("tea", 28000, 1, 16),
        mkItem("sugar", 4400, 1, 16),
        mkItem("salt", 2800, 1, 16),
      ],
      16,
    ),
    mkTrip(
      [
        mkItem("milk", 2700, 2, 9),
        mkItem("eggs", 8200, 1, 9),
        mkItem("bread", 4000, 2, 9),
        mkItem("biscuit", 3500, 1, 9),
        mkItem("coffee", 17500, 1, 9),
        mkItem("wash", 18900, 1, 9),
      ],
      9,
    ),
    mkTrip(
      [
        mkItem("milk", 2800, 1, 2),
        mkItem("eggs", 8500, 1, 2),
        mkItem("bread", 4500, 1, 2),
        mkItem("noodles", 6000, 1, 2),
        mkItem("paste", 10900, 1, 2),
        mkItem("dal", 16500, 1, 2),
      ],
      2,
    ),
  ];
}

export function seedPriceHistory(trips: Trip[]): Record<string, PricePoint[]> {
  const hist: Record<string, PricePoint[]> = {};
  const push = (bc: string, price: number, date: number) => {
    (hist[bc] ??= []).push({ price, date });
  };
  for (const t of trips) for (const i of t.items) push(i.barcode, i.unitPrice, t.date);
  const now = Date.now();
  push(fullCode(byId.get("milk")!), 2600, now - 30 * DAY);
  push(fullCode(byId.get("eggs")!), 7900, now - 30 * DAY);
  push(fullCode(byId.get("bread")!), 3800, now - 30 * DAY);
  push(fullCode(byId.get("dal")!), 15200, now - 32 * DAY);
  for (const k of Object.keys(hist)) hist[k].sort((a, b) => a.date - b.date);
  return hist;
}

export function seedChecklist(): ChecklistItem[] {
  return [
    { id: uid(), name: "Milk", done: true },
    { id: uid(), name: "Eggs", done: true },
    { id: uid(), name: "Bread", done: false },
    { id: uid(), name: "Rice", done: false },
    { id: uid(), name: "Cooking oil", done: false },
    { id: uid(), name: "Toor dal", done: false },
  ];
}

export function seedReminders(): Reminder[] {
  return [{ id: uid(), text: "Weekly grocery run — Sunday 10 AM" }];
}

export function seedCart(): CartItem[] {
  const a = mkItem("milk", 2800, 2, 0);
  const b = mkItem("cheese", 15500, 1, 0);
  a.addedAt = Date.now() - 12 * 60_000;
  b.addedAt = Date.now() - 6 * 60_000;
  return [a, b];
}

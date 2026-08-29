import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  CartItem,
  CheckoutExtras,
  ChecklistItem,
  PricePoint,
  Reminder,
  Settings,
  Trip,
} from "./core";
import { STORAGE_KEY, normalize, uid } from "./core";
import {
  seedCart,
  seedChecklist,
  seedPriceHistory,
  seedReminders,
  seedTrips,
} from "./catalog";

export interface AppState {
  settings: Settings;
  cart: CartItem[];
  trips: Trip[];
  checklist: ChecklistItem[];
  reminders: Reminder[];
  priceHistory: Record<string, PricePoint[]>;
  extras: CheckoutExtras;
}

const DEFAULT_SETTINGS: Settings = {
  currency: "INR",
  budget: 250000,
  theme: "system",
  sound: true,
  vibrate: true,
  defaultQty: 1,
  autoScan: true,
  offline: false,
  cameraAllowed: false,
};

function freshState(): AppState {
  const trips = seedTrips();
  return {
    settings: { ...DEFAULT_SETTINGS },
    cart: seedCart(),
    trips,
    checklist: seedChecklist(),
    reminders: seedReminders(),
    priceHistory: seedPriceHistory(trips),
    extras: { discount: 0, tax: 0, extra: 0 },
  };
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshState();
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed || !Array.isArray(parsed.cart) || !parsed.settings) return freshState();
    return {
      ...freshState(),
      ...parsed,
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
      extras: {
        discount: parsed.extras?.discount ?? 0,
        tax: parsed.extras?.tax ?? 0,
        extra: parsed.extras?.extra ?? 0,
      },
    };
  } catch {
    return freshState();
  }
}

/* ---------------- derived helpers ---------------- */

export const cartUnits = (cart: CartItem[]) => cart.reduce((s, i) => s + i.qty, 0);
export const cartSubtotal = (cart: CartItem[]) =>
  cart.reduce((s, i) => s + i.unitPrice * i.qty, 0);

interface StoreApi {
  state: AppState;
  isDark: boolean;
  setSettings: (p: Partial<Settings>) => void;
  addItem: (item: CartItem) => void;
  mergeQty: (id: string, delta: number) => void;
  updateItem: (id: string, p: Partial<CartItem>) => void;
  removeItem: (id: string) => void;
  setExtras: (p: Partial<CheckoutExtras>) => void;
  finishTrip: () => Trip | null;
  startNew: () => void;
  addCheck: (name: string) => void;
  toggleCheck: (id: string) => void;
  removeCheck: (id: string) => void;
  resetChecks: () => void;
  /** marks a matching pending checklist item bought; returns its name */
  matchChecklist: (name: string, tags: string[]) => string | null;
  addReminder: (text: string) => void;
  removeReminder: (id: string) => void;
  deleteTrip: (id: string) => void;
  clearHistory: () => void;
  exportJSON: () => string;
  exportCSV: () => string;
  importJSON: (raw: string) => boolean;
}

const Ctx = createContext<StoreApi | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState);
  const [isDark, setIsDark] = useState(false);
  const saveT = useRef<number | undefined>(undefined);

  /* persist (debounced) */
  useEffect(() => {
    window.clearTimeout(saveT.current);
    saveT.current = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        /* storage full/blocked — app keeps working in memory */
      }
    }, 250);
    return () => window.clearTimeout(saveT.current);
  }, [state]);

  /* theme resolution */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () =>
      setIsDark(state.settings.theme === "dark" || (state.settings.theme === "system" && mq.matches));
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, [state.settings.theme]);

  const setSettings = useCallback(
    (p: Partial<Settings>) => setState((s) => ({ ...s, settings: { ...s.settings, ...p } })),
    [],
  );
  const addItem = useCallback(
    (item: CartItem) => setState((s) => ({ ...s, cart: [...s.cart, item] })),
    [],
  );
  const mergeQty = useCallback(
    (id: string, delta: number) =>
      setState((s) => ({
        ...s,
        cart: s.cart.map((i) => (i.id === id ? { ...i, qty: Math.min(99, Math.max(1, i.qty + delta)) } : i)),
      })),
    [],
  );
  const updateItem = useCallback(
    (id: string, p: Partial<CartItem>) =>
      setState((s) => ({ ...s, cart: s.cart.map((i) => (i.id === id ? { ...i, ...p } : i)) })),
    [],
  );
  const removeItem = useCallback(
    (id: string) => setState((s) => ({ ...s, cart: s.cart.filter((i) => i.id !== id) })),
    [],
  );
  const setExtras = useCallback(
    (p: Partial<CheckoutExtras>) => setState((s) => ({ ...s, extras: { ...s.extras, ...p } })),
    [],
  );

  const finishTrip = useCallback((): Trip | null => {
    let trip: Trip | null = null;
    setState((s) => {
      if (s.cart.length === 0) return s;
      const subtotal = cartSubtotal(s.cart);
      trip = {
        id: uid(),
        date: Date.now(),
        items: s.cart,
        subtotal,
        discount: s.extras.discount,
        tax: s.extras.tax,
        extra: s.extras.extra,
        total: Math.max(0, subtotal + s.extras.tax + s.extras.extra - s.extras.discount),
      };
      const hist = { ...s.priceHistory };
      for (const i of s.cart) {
        const list = [...(hist[i.barcode] ?? []), { price: i.unitPrice, date: trip.date }];
        hist[i.barcode] = list.slice(-14);
      }
      return {
        ...s,
        trips: [trip, ...s.trips],
        cart: [],
        extras: { discount: 0, tax: 0, extra: 0 },
        priceHistory: hist,
      };
    });
    return trip;
  }, []);

  const startNew = useCallback(
    () => setState((s) => ({ ...s, cart: [], extras: { discount: 0, tax: 0, extra: 0 } })),
    [],
  );

  const addCheck = useCallback(
    (name: string) =>
      setState((s) =>
        s.checklist.some((c) => normalize(c.name) === normalize(name))
          ? s
          : { ...s, checklist: [...s.checklist, { id: uid(), name: name.trim(), done: false }] },
      ),
    [],
  );
  const toggleCheck = useCallback(
    (id: string) =>
      setState((s) => ({
        ...s,
        checklist: s.checklist.map((c) => (c.id === id ? { ...c, done: !c.done } : c)),
      })),
    [],
  );
  const removeCheck = useCallback(
    (id: string) => setState((s) => ({ ...s, checklist: s.checklist.filter((c) => c.id !== id) })),
    [],
  );
  const resetChecks = useCallback(
    () => setState((s) => ({ ...s, checklist: s.checklist.map((c) => ({ ...c, done: false })) })),
    [],
  );

  const matchChecklist = useCallback((name: string, tags: string[]): string | null => {
    let matched: ChecklistItem | null = null;
    setState((s) => {
      const n = normalize(name);
      const found = s.checklist.find(
        (c) =>
          !c.done &&
          (normalize(c.name) === n ||
            n.includes(normalize(c.name)) ||
            normalize(c.name).includes(n) ||
            tags.some((t) => normalize(c.name) === normalize(t))),
      );
      if (!found) return s;
      matched = found;
      return {
        ...s,
        checklist: s.checklist.map((c) => (c.id === found.id ? { ...c, done: true } : c)),
      };
    });
    return matched ? (matched as ChecklistItem).name : null;
  }, []);

  const addReminder = useCallback(
    (text: string) =>
      setState((s) => ({ ...s, reminders: [...s.reminders, { id: uid(), text: text.trim() }] })),
    [],
  );
  const removeReminder = useCallback(
    (id: string) => setState((s) => ({ ...s, reminders: s.reminders.filter((r) => r.id !== id) })),
    [],
  );
  const deleteTrip = useCallback(
    (id: string) => setState((s) => ({ ...s, trips: s.trips.filter((t) => t.id !== id) })),
    [],
  );
  const clearHistory = useCallback(
    () => setState((s) => ({ ...s, trips: [] })),
    [],
  );

  const exportJSON = useCallback(() => JSON.stringify(state, null, 2), [state]);

  const exportCSV = useCallback(() => {
    const rows = [["trip_date", "product", "brand", "barcode", "category", "qty", "unit_price_minor", "line_total_minor"]];
    for (const t of state.trips)
      for (const i of t.items)
        rows.push([
          new Date(t.date).toISOString(),
          `"${i.name.replace(/"/g, '""')}"`,
          `"${i.brand.replace(/"/g, '""')}"`,
          i.barcode,
          i.category,
          String(i.qty),
          String(i.unitPrice),
          String(i.unitPrice * i.qty),
        ]);
    return rows.map((r) => r.join(",")).join("\n");
  }, [state.trips]);

  const importJSON = useCallback((raw: string): boolean => {
    try {
      const parsed = JSON.parse(raw) as AppState;
      if (!parsed || !Array.isArray(parsed.cart) || !Array.isArray(parsed.trips) || !parsed.settings)
        return false;
      setState({
        ...freshState(),
        ...parsed,
        settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
        extras: {
          discount: parsed.extras?.discount ?? 0,
          tax: parsed.extras?.tax ?? 0,
          extra: parsed.extras?.extra ?? 0,
        },
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  const api = useMemo<StoreApi>(
    () => ({
      state,
      isDark,
      setSettings,
      addItem,
      mergeQty,
      updateItem,
      removeItem,
      setExtras,
      finishTrip,
      startNew,
      addCheck,
      toggleCheck,
      removeCheck,
      resetChecks,
      matchChecklist,
      addReminder,
      removeReminder,
      deleteTrip,
      clearHistory,
      exportJSON,
      exportCSV,
      importJSON,
    }),
    [state, isDark, setSettings, addItem, mergeQty, updateItem, removeItem, setExtras, finishTrip, startNew, addCheck, toggleCheck, removeCheck, resetChecks, matchChecklist, addReminder, removeReminder, deleteTrip, clearHistory, exportJSON, exportCSV, importJSON],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useStore(): StoreApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore outside provider");
  return v;
}

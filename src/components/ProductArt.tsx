import { eanBits } from "../lib/core";
import type { ReactNode } from "react";

/* Flat vector grocery illustrations — one per product. */

function A({ bg, children }: { bg: string; children: ReactNode }) {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full" role="img" aria-hidden>
      <rect width="64" height="64" rx="15" fill={bg} />
      {children}
    </svg>
  );
}

const ART: Record<string, (key: string) => ReactNode> = {
  milk: () => (
    <A bg="#d8e7f4">
      <path d="M23 20h18v30a2 2 0 0 1-2 2H25a2 2 0 0 1-2-2V20Z" fill="#fdfdfd" />
      <path d="M23 20 26 12h12l3 8H23Z" fill="#4f86b6" />
      <rect x="28" y="8" width="8" height="5" rx="2" fill="#33618c" />
      <rect x="23" y="31" width="18" height="10" fill="#2f6fa8" />
      <path d="M25 36c2-2.4 4-2.4 6 0s4 2.4 6 0" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </A>
  ),
  bread: () => (
    <A bg="#f3e3c6">
      <path d="M14 30c0-6 5-11 12-12h12c7 1 12 6 12 12 0 3-2 5-4 6v10a2 2 0 0 1-2 2H18a2 2 0 0 1-2-2V36c-2-1-4-3-2-6Z" fill="#d9922f" />
      <path d="M14 30c0-6 5-11 12-12h12c7 1 12 6 12 12 0 2.6-1.6 4.5-3.4 5.6H17.4C15.6 34.5 14 32.6 14 30Z" fill="#e8b15c" />
      <path d="M24 23l-3 8M33 21l-3 10M42 23l-3 8" stroke="#c07f22" strokeWidth="2" strokeLinecap="round" />
    </A>
  ),
  eggs: () => (
    <A bg="#efe0cf">
      <rect x="12" y="34" width="40" height="14" rx="4" fill="#9fb6c9" />
      <ellipse cx="21" cy="30" rx="7" ry="9" fill="#fbf3e2" stroke="#e2c9a2" strokeWidth="1.5" />
      <ellipse cx="32" cy="27" rx="7" ry="9" fill="#fdf7ea" stroke="#e2c9a2" strokeWidth="1.5" />
      <ellipse cx="43" cy="30" rx="7" ry="9" fill="#fbf3e2" stroke="#e2c9a2" strokeWidth="1.5" />
      <rect x="12" y="40" width="40" height="3" fill="#8aa3b8" />
    </A>
  ),
  rice: () => (
    <A bg="#e4ead8">
      <path d="M20 16h24l3 8v26a2 2 0 0 1-2 2H19a2 2 0 0 1-2-2V24l3-8Z" fill="#e9dcbd" />
      <path d="M20 16c4 3 20 3 24 0l1.5 4c-7 3.4-21.5 3.4-27 0L20 16Z" fill="#d4bd8d" />
      <rect x="22" y="30" width="20" height="12" rx="2" fill="#fdfaf1" />
      <ellipse cx="27" cy="36" rx="1.6" ry="2.6" fill="#cbb27f" transform="rotate(-20 27 36)" />
      <ellipse cx="32" cy="35" rx="1.6" ry="2.6" fill="#cbb27f" />
      <ellipse cx="37" cy="36" rx="1.6" ry="2.6" fill="#cbb27f" transform="rotate(20 37 36)" />
    </A>
  ),
  oil: () => (
    <A bg="#f9ecc8">
      <rect x="25" y="6" width="10" height="7" rx="2" fill="#2f6fa8" />
      <path d="M24 13h12l3 9v27a3 3 0 0 1-3 3H24a3 3 0 0 1-3-3V22l3-9Z" fill="#f2c230" opacity="0.9" />
      <path d="M21 30h18v10H21z" fill="#fdf6de" />
      <circle cx="30" cy="35" r="3.4" fill="none" stroke="#e0a514" strokeWidth="2" />
      <path d="M39 22c3 0 5 2.5 5 6" stroke="#e0a514" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </A>
  ),
  atta: () => (
    <A bg="#efe6cf">
      <path d="M19 18h26l3 6v24a2 2 0 0 1-2 2H18a2 2 0 0 1-2-2V24l3-6Z" fill="#d9b36a" />
      <path d="M19 18c5 2.6 21 2.6 26 0l1.8 3.6c-7.6 3.2-22.2 3.2-29.6 0L19 18Z" fill="#c39a4d" />
      <path d="M32 28v16M32 32l-5-3M32 32l5-3M32 38l-5-3M32 38l5-3" stroke="#f4ead2" strokeWidth="2" strokeLinecap="round" />
    </A>
  ),
  dal: () => (
    <A bg="#efe2d2">
      <rect x="17" y="14" width="30" height="38" rx="4" fill="#e8a13c" />
      <rect x="17" y="14" width="30" height="9" rx="4" fill="#cf7f22" />
      <rect x="23" y="29" width="18" height="15" rx="7.5" fill="#fdf3e0" />
      <circle cx="28" cy="34" r="2" fill="#e0a53a" />
      <circle cx="34" cy="37" r="2" fill="#d18f24" />
      <circle cx="36" cy="32" r="2" fill="#e0a53a" />
      <circle cx="30" cy="39.5" r="2" fill="#d18f24" />
    </A>
  ),
  sugar: () => (
    <A bg="#e3edf1">
      <path d="M18 16h28l2 6v24a2 2 0 0 1-2 2H18a2 2 0 0 1-2-2V22l2-6Z" fill="#f7fafc" />
      <path d="M18 16c5 2.4 23 2.4 28 0l1.3 4c-8 3-23.6 3-30.6 0L18 16Z" fill="#dbe6ec" />
      <rect x="16" y="31" width="32" height="9" fill="#3f7fb5" />
      <rect x="27" y="23" width="4.5" height="4.5" rx="1" fill="#cfe0ec" transform="rotate(8 29 25)" />
      <rect x="33" y="22.5" width="4.5" height="4.5" rx="1" fill="#bcd3e4" transform="rotate(-8 35 25)" />
    </A>
  ),
  salt: () => (
    <A bg="#ddeaf0">
      <rect x="19" y="13" width="26" height="39" rx="3" fill="#fbfdfe" />
      <path d="M19 13h26v8c-8 3.4-18 3.4-26 0v-8Z" fill="#3f7fb5" />
      <path d="M19 40l26-12v9L19 49v-9Z" fill="#7fb0d4" />
      <circle cx="26" cy="28" r="1.2" fill="#b9cfdd" />
      <circle cx="32" cy="30" r="1.2" fill="#b9cfdd" />
      <circle cx="38" cy="27" r="1.2" fill="#b9cfdd" />
    </A>
  ),
  tea: () => (
    <A bg="#e6dfd8">
      <rect x="16" y="18" width="32" height="32" rx="3" fill="#b34a32" />
      <rect x="16" y="18" width="32" height="8" rx="3" fill="#8f3823" />
      <rect x="21" y="30" width="22" height="13" rx="2" fill="#f6ead2" />
      <path d="M25 36c2.5-2.6 5-2.6 7.5 0s5 2.6 7.5 0" stroke="#b34a32" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M30 10c-1.5 2 1.5 3 0 5M36 10c-1.5 2 1.5 3 0 5" stroke="#a8988a" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </A>
  ),
  coffee: () => (
    <A bg="#e9e1d7">
      <rect x="21" y="16" width="22" height="7" rx="2.5" fill="#3c2a1b" />
      <path d="M20 23h24l-1.6 27a2.4 2.4 0 0 1-2.4 2.2H24a2.4 2.4 0 0 1-2.4-2.2L20 23Z" fill="#7a4a2e" />
      <path d="M22.5 30h19l-1 15h-17l-1-15Z" fill="#f2e8dc" />
      <ellipse cx="28" cy="37" rx="2.4" ry="3.4" fill="#5b3823" transform="rotate(-18 28 37)" />
      <ellipse cx="36" cy="38" rx="2.4" ry="3.4" fill="#5b3823" transform="rotate(14 36 38)" />
      <path d="M28 34.5v5M36 35.5v5" stroke="#f2e8dc" strokeWidth="1.2" strokeLinecap="round" />
    </A>
  ),
  biscuit: () => (
    <A bg="#f4e7d3">
      <circle cx="32" cy="33" r="16" fill="#d9a441" />
      <circle cx="32" cy="33" r="12.5" fill="none" stroke="#c48f2e" strokeWidth="1.4" strokeDasharray="3 3" />
      <circle cx="27" cy="28" r="1.7" fill="#8a5a2b" />
      <circle cx="37" cy="30" r="1.7" fill="#8a5a2b" />
      <circle cx="30" cy="38" r="1.7" fill="#8a5a2b" />
      <circle cx="38" cy="37" r="1.4" fill="#8a5a2b" />
      <circle cx="25" cy="35" r="1.4" fill="#8a5a2b" />
    </A>
  ),
  noodles: () => (
    <A bg="#fbe3da">
      <path d="M16 24h32l-3.4 25a3 3 0 0 1-3 2.6H22.4a3 3 0 0 1-3-2.6L16 24Z" fill="#e2574c" />
      <path d="M17.3 33h29.4l-1 8H18.3l-1-8Z" fill="#fdf3e7" />
      <path d="M21 20c3-3 5 2 8-1s5 2 8-1 4-1 6-2" stroke="#f0c987" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M25 16c2-2 4 1 6-1s4 1 6-1" stroke="#f0c987" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </A>
  ),
  cheese: () => (
    <A bg="#f7eccd">
      <path d="M12 40 46 22c4 3 6 7 6 12v6H12v-0Z" fill="#f2c94c" />
      <path d="M12 40h40v6a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2v-6Z" fill="#e3af2e" />
      <circle cx="26" cy="37" r="3" fill="#d99f1f" />
      <circle cx="37" cy="32" r="2.3" fill="#d99f1f" />
      <circle cx="44" cy="38" r="1.8" fill="#d99f1f" />
    </A>
  ),
  wash: () => (
    <A bg="#d9eee5">
      <rect x="24" y="24" width="16" height="28" rx="5" fill="#2e9e77" />
      <rect x="29" y="14" width="6" height="11" fill="#22795a" />
      <path d="M29 14v-3h12" stroke="#22795a" strokeWidth="4" strokeLinecap="round" fill="none" />
      <rect x="27" y="33" width="10" height="10" rx="3" fill="#eafaf3" />
      <circle cx="47" cy="20" r="2.4" fill="#bfe6d6" />
      <circle cx="50" cy="27" r="1.6" fill="#bfe6d6" />
      <circle cx="16" cy="24" r="1.8" fill="#bfe6d6" />
    </A>
  ),
  paste: () => (
    <A bg="#dbe8f4">
      <rect x="12" y="20" width="16" height="30" rx="2" fill="#2f6fa8" />
      <rect x="15" y="26" width="10" height="4" fill="#dbe8f4" />
      <path d="M34 18h12l2 30a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3l-2-30Z" fill="#e8564a" />
      <rect x="36" y="12" width="8" height="6" rx="1.5" fill="#b23a31" />
      <path d="M36 34h10" stroke="#fdf0ee" strokeWidth="2.4" strokeLinecap="round" />
    </A>
  ),
  basket: () => (
    <A bg="#e0ead9">
      <path d="M14 26h36l-3.4 20a4 4 0 0 1-3.9 3.3H21.3A4 4 0 0 1 17.4 46L14 26Z" fill="#4c8f63" />
      <path d="m20 26 6-11M44 26l-6-11" stroke="#3c7350" strokeWidth="3" strokeLinecap="round" />
      <path d="M22 32v10M28 32v10M34 32v10M40 32v10" stroke="#6fae85" strokeWidth="2.6" strokeLinecap="round" />
    </A>
  ),
};

export function ProductArt({
  art,
  className,
}: {
  art: string;
  className?: string;
}) {
  const fn = ART[art] ?? ART.basket;
  return <div className={className}>{fn(art)}</div>;
}

/* ---------- real EAN-13 barcode ---------- */

export function EanBarcode({
  code,
  height = 34,
  className,
  digits = true,
}: {
  code: string;
  height?: number;
  className?: string;
  digits?: boolean;
}) {
  const bits = eanBits(code);
  const bars: Array<{ x: number; w: number }> = [];
  let run = 0;
  for (let i = 0; i < bits.length; i++) {
    if (bits[i] === "1") run++;
    else {
      if (run) bars.push({ x: (i - run) * 2, w: run * 2 });
      run = 0;
    }
  }
  if (run) bars.push({ x: (bits.length - run) * 2, w: run * 2 });
  const d = code.replace(/\D/g, "");
  return (
    <svg
      viewBox={`0 0 190 ${digits ? height + 13 : height}`}
      className={className}
      style={{ width: "100%" }}
      aria-label={`Barcode ${d}`}
    >
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={0} width={b.w} height={height} fill="currentColor" />
      ))}
      {digits && d.length >= 13 && (
        <text
          y={height + 11}
          fontSize="11"
          fontFamily="var(--font-mono)"
          fill="currentColor"
          letterSpacing="1"
        >
          <tspan x="0">{d[0]}</tspan>
          <tspan x="28">{d.slice(1, 7)}</tspan>
          <tspan x="104">{d.slice(7, 13)}</tspan>
        </text>
      )}
    </svg>
  );
}

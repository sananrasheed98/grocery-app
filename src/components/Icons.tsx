import type { ReactNode, SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

const mk =
  (nodes: ReactNode, filled = false) =>
  ({ size = 20, ...rest }: P) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      {nodes}
    </svg>
  );

export const IScan = mk(
  <>
    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    <path d="M7 8v8M10 8v8M13 8v5M13 16h.01M17 8v8" />
  </>,
);
export const ICart = mk(
  <>
    <circle cx="9" cy="20" r="1.4" />
    <circle cx="17" cy="20" r="1.4" />
    <path d="M2.5 3h2.2l2.4 12.2a1.6 1.6 0 0 0 1.6 1.3h7.9a1.6 1.6 0 0 0 1.6-1.2L20.5 7H6" />
  </>,
);
export const IListChecks = mk(
  <>
    <path d="m3 6.5 1.5 1.5L7 5.5" />
    <path d="m3 12.5 1.5 1.5L7 11.5" />
    <path d="m3 18.5 1.5 1.5L7 17.5" />
    <path d="M11 7h10M11 13h10M11 19h10" />
  </>,
);
export const IClock = mk(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.2 1.8" />
  </>,
);
export const IGear = mk(
  <>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.09a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.09a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1Z" />
  </>,
);
export const IFlash = mk(<path d="M13 2 4.5 13.5H11L9.5 22 19 9.5h-6.5L13 2Z" />);
export const IPlus = mk(<path d="M12 5v14M5 12h14" />);
export const IMinus = mk(<path d="M5 12h14" />);
export const ITrash = mk(
  <>
    <path d="M3 6h18" />
    <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
    <path d="M19 6l-.8 14a2 2 0 0 1-2 1.9H7.8a2 2 0 0 1-2-1.9L5 6" />
    <path d="M10 11v6M14 11v6" />
  </>,
);
export const IPencil = mk(
  <>
    <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
  </>,
);
export const ICheck = mk(<path d="m4.5 12.5 5 5 10-11" />);
export const IX = mk(<path d="M6 6l12 12M18 6 6 18" />);
export const IBack = mk(
  <>
    <path d="M19 12H5" />
    <path d="m11 18-6-6 6-6" />
  </>,
);
export const IChevR = mk(<path d="m9 6 6 6-6 6" />);
export const IChevD = mk(<path d="m6 9 6 6 6-6" />);
export const ISearch = mk(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m20.5 20.5-3.8-3.8" />
  </>,
);
export const ISun = mk(
  <>
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2.5v2M12 19.5v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2.5 12h2M19.5 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </>,
);
export const IMoon = mk(<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z" />);
export const IDownload = mk(
  <>
    <path d="M12 3v12" />
    <path d="m7 10 5 5 5-5" />
    <path d="M4 20h16" />
  </>,
);
export const IUpload = mk(
  <>
    <path d="M12 15V3" />
    <path d="m7 8 5-5 5 5" />
    <path d="M4 20h16" />
  </>,
);
export const IAlert = mk(
  <>
    <path d="M12 3 1.8 20.2h20.4L12 3Z" />
    <path d="M12 10v4M12 17.5h.01" />
  </>,
);
export const IInfo = mk(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 7.5h.01" />
  </>,
);
export const ISpark = mk(
  <>
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
    <path d="M12 8.5 13.2 11l2.6 1-2.6 1L12 15.5 10.8 13l-2.6-1 2.6-1L12 8.5Z" />
  </>,
);
export const ITag = mk(
  <>
    <path d="M3 3h7.6a2 2 0 0 1 1.4.6l8.4 8.4a2 2 0 0 1 0 2.8l-5.6 5.6a2 2 0 0 1-2.8 0L3.6 12A2 2 0 0 1 3 10.6V3Z" />
    <circle cx="8" cy="8" r="1.4" />
  </>,
);
export const ICamera = mk(
  <>
    <path d="M4 7h2.6L8.5 4.5h7L17.4 7H20a1.5 1.5 0 0 1 1.5 1.5V18a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 18V8.5A1.5 1.5 0 0 1 4 7Z" />
    <circle cx="12" cy="13" r="3.6" />
  </>,
);
export const ICameraOff = mk(
  <>
    <path d="M2.5 2.5l19 19" />
    <path d="M9.5 4.5h6l1.9 2.5H20a1.5 1.5 0 0 1 1.5 1.5V16M6.6 7H4A1.5 1.5 0 0 0 2.5 8.5V18A1.5 1.5 0 0 0 4 19.5h13" />
    <path d="M9.7 10.6a3.6 3.6 0 0 0 4.9 5" />
  </>,
);
export const IVibrate = mk(
  <>
    <rect x="8" y="4" width="8" height="16" rx="2" />
    <path d="M4 9v6M20 9v6M1.5 11v2M22.5 11v2" />
  </>,
);
export const ISound = mk(
  <>
    <path d="M11 5 6.5 9H3v6h3.5L11 19V5Z" />
    <path d="M15 9.3a4 4 0 0 1 0 5.4M17.8 6.5a8 8 0 0 1 0 11" />
  </>,
);
export const IReceipt = mk(
  <>
    <path d="M5 3h14v18l-2.3-1.6L14.4 21l-2.4-1.6L9.6 21l-2.3-1.6L5 21V3Z" />
    <path d="M9 7.5h6M9 11h6M9 14.5h4" />
  </>,
);
export const IBasket = mk(
  <>
    <path d="m5 9 2.5-5M19 9l-2.5-5" />
    <path d="M2.8 9h18.4l-1.7 10a2 2 0 0 1-2 1.7H6.5a2 2 0 0 1-2-1.7L2.8 9Z" />
    <path d="M8.5 13v3.5M12 13v3.5M15.5 13v3.5" />
  </>,
);
export const ICalendar = mk(
  <>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </>,
);
export const IStar = mk(
  <path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6L12 16.8l-5.4 2.8 1.1-6L3.2 9.4l6.1-.8L12 3Z" />,
);
export const IWifiOff = mk(
  <>
    <path d="M2.5 2.5l19 19" />
    <path d="M5 9.5A12 12 0 0 1 9 7.6M12.5 7a12 12 0 0 1 6.5 2.5M8.5 13a7 7 0 0 1 2.6-1.3M14.5 12.4c.7.4 1.4.9 2 1.5M12 18.5h.01" />
  </>,
);
export const IRefresh = mk(
  <>
    <path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1" />
    <path d="M20.5 3v5h-5" />
  </>,
);
export const IWallet = mk(
  <>
    <path d="M3 7a2 2 0 0 1 2-2h13v3" />
    <path d="M3 7v11a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1H5a2 2 0 0 1-2-1Z" />
    <path d="M16.5 13.5h.01" />
  </>,
);
export const IArrowUp = mk(<path d="M12 19V5M6 11l6-6 6 6" />);
export const IArrowDn = mk(<path d="M12 5v14M6 13l6 6 6-6" />);
export const IBell = mk(
  <>
    <path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
    <path d="M10 19a2 2 0 0 0 4 0" />
  </>,
);
export const IShield = mk(
  <>
    <path d="M12 3 5 6v5c0 4.5 3 8.4 7 10 4-1.6 7-5.5 7-10V6l-7-3Z" />
    <path d="m9 11.5 2.2 2.2L15.5 9" />
  </>,
);
export const IKey = mk(
  <>
    <rect x="3" y="8" width="18" height="8" rx="2" />
    <path d="M7 12h.01M11 12h.01M15 12h6" />
  </>,
);

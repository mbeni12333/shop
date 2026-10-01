import type { ReactNode, SVGProps } from 'react';

export type IconName =
  | 'univers'
  | 'pc-fixes'
  | 'portables'
  | 'processeurs'
  | 'cartes-graphiques'
  | 'cartes-meres'
  | 'ram'
  | 'ssd'
  | 'boitiers'
  | 'alimentations'
  | 'refroidissement'
  | 'ecrans'
  | 'claviers'
  | 'souris'
  | 'casques'
  | 'cart'
  | 'chevron'
  | 'menu'
  | 'close'
  | 'guide'
  | 'book'
  | 'export';
const drawings: Record<IconName, ReactNode> = {
  univers: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  'pc-fixes': (
    <>
      <rect x="5" y="2.5" width="14" height="19" rx="2" />
      <path d="M8 6h8M8 9h8M8 17h4" />
      <circle cx="15.5" cy="17.5" r="1" />
    </>
  ),
  portables: (
    <>
      <rect x="4" y="3" width="16" height="12" rx="1.5" />
      <path d="m4 15-2 5h20l-2-5M9 18h6" />
    </>
  ),
  processeurs: (
    <>
      <rect x="5" y="5" width="14" height="14" rx="2" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
      <path d="M8 2v3m4-3v3m4-3v3M8 19v3m4-3v3m4-3v3M2 8h3m-3 4h3m-3 4h3m14-8h3m-3 4h3m-3 4h3" />
    </>
  ),
  'cartes-graphiques': (
    <>
      <rect x="3" y="6" width="18" height="12" rx="1.5" />
      <circle cx="8.5" cy="12" r="3" />
      <circle cx="16" cy="12" r="3" />
      <path d="M7 18v3h9v-3M1 4v16" />
    </>
  ),
  'cartes-meres': (
    <>
      <rect x="4" y="2" width="16" height="20" rx="1.5" />
      <rect x="7" y="6" width="6" height="6" rx="1" />
      <path d="M16 5v9m2-9v9M7 16h10M7 19h7" />
    </>
  ),
  ram: (
    <>
      <path d="M2 7h20v10H2zM5 17v3m3-3v3m4-3v3m4-3v3m3-3v3" />
      <rect x="5" y="10" width="5" height="4" rx=".5" />
      <rect x="14" y="10" width="5" height="4" rx=".5" />
    </>
  ),
  ssd: (
    <>
      <rect x="2" y="7" width="20" height="10" rx="1" />
      <rect x="5" y="10" width="5" height="4" rx=".5" />
      <path d="M13 10h4m-4 3h4m3-6v10" />
    </>
  ),
  boitiers: (
    <>
      <path d="m5 4 11-2 4 3v15l-11 2-4-3zM5 4l4 3 11-2M9 7v15" />
      <path d="M13 9h4m-4 4h4m-4 4h4" />
    </>
  ),
  alimentations: (
    <>
      <rect x="3" y="4" width="18" height="14" rx="1.5" />
      <circle cx="10" cy="11" r="4" />
      <path d="M10 7v8m-4-4h8m3-3h1m-1 3h1m-1 3h1M7 18v3h10v-3" />
    </>
  ),
  refroidissement: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 10c-6-5-7 2-2 2m4 0c5-6-2-7-2-2m0 4c6 5 7-2 2-2m-4 0c-5 6 2 7 2 2" />
    </>
  ),
  ecrans: (
    <>
      <rect x="2" y="3" width="20" height="14" rx="1.5" />
      <path d="M12 17v4m-5 0h10M5 13h14" />
    </>
  ),
  claviers: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M5 9h1m3 0h1m3 0h1m3 0h2M5 12h1m3 0h1m3 0h1m3 0h2M6 16h12" />
    </>
  ),
  souris: (
    <>
      <rect x="6" y="2" width="12" height="20" rx="6" />
      <path d="M12 2v7m-6 1h12" />
      <path d="M12 5v1" strokeWidth="2.5" />
    </>
  ),
  casques: (
    <>
      <path d="M3 13v-2a9 9 0 0 1 18 0v2M17 20h-5" />
      <rect x="3" y="11" width="4" height="8" rx="2" />
      <rect x="17" y="11" width="4" height="8" rx="2" />
      <path d="M19 19c0 2-2 3-5 3" />
    </>
  ),
  cart: (
    <>
      <path d="M2 3h3l3 13h11l3-9H6M9 12h10" />
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="19" cy="20" r="1.4" />
    </>
  ),
  chevron: <path d="m7 10 5 5 5-5" />,
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  guide: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5z" />
    </>
  ),
  book: (
    <>
      <path d="M12 5C9 3 5 3 2 4v16c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1v16" />
    </>
  ),
  export: (
    <>
      <path d="M2 5h12v12H2zM14 9h4l4 4v4h-8" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
    </>
  ),
};
export default function Icon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: IconName }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {drawings[name]}
    </svg>
  );
}

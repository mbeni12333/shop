import {
  BookOpen,
  ArrowUpRight,
  Check,
  Box,
  ChevronDown,
  CircuitBoard,
  Cpu,
  Gpu,
  HardDrive,
  Headphones,
  Keyboard,
  Laptop,
  LayoutGrid,
  MemoryStick,
  Menu,
  Monitor,
  Mouse,
  PlugZap,
  Search,
  Server,
  ShoppingBasket,
  SlidersHorizontal,
  Truck,
  Wind,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { SVGProps } from 'react';

/**
 * The design system draws a 1.7 stroke on a 24 grid; lucide defaults to 2, so
 * every glyph is normalised here instead of at each call site.
 */
const drawings = {
  univers: LayoutGrid,
  'pc-fixes': Server,
  portables: Laptop,
  processeurs: Cpu,
  'cartes-graphiques': Gpu,
  'cartes-meres': CircuitBoard,
  ram: MemoryStick,
  ssd: HardDrive,
  boitiers: Box,
  alimentations: PlugZap,
  refroidissement: Wind,
  ecrans: Monitor,
  claviers: Keyboard,
  souris: Mouse,
  casques: Headphones,
  cart: ShoppingBasket,
  chevron: ChevronDown,
  menu: Menu,
  close: X,
  search: Search,
  filters: SlidersHorizontal,
  book: BookOpen,
  export: Truck,
  arrow: ArrowUpRight,
  check: Check,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof drawings;

export default function Icon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: IconName }) {
  const Glyph = drawings[name];
  return (
    <Glyph
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.7}
      aria-hidden
      focusable={false}
      {...props}
    />
  );
}

import { useState, type ReactNode } from 'react';

import { Button } from '@/edoctor/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/edoctor/ui/sheet';
import Icon from './Icon';
import { useIsDesktop } from './useMediaQuery';

export const filtersLabel = 'Filtres';

/**
 * Desktop keeps the filters in a sticky sidebar; on small screens the very same
 * controls move into a sheet instead of the previous toggle hack, so no filter
 * markup is duplicated in the DOM at any breakpoint.
 */
export default function FilterPanel({
  children,
  resultCount,
  hasFilters,
  activeCount = 0,
}: {
  children: ReactNode;
  resultCount: number;
  hasFilters: boolean;
  activeCount?: number;
}) {
  const isDesktop = useIsDesktop();
  const [open, setOpen] = useState(false);

  if (isDesktop)
    return (
      <aside className="catalog-sidebar" aria-label={filtersLabel}>
        <h2 className="filters-heading">{filtersLabel}</h2>
        <div className="filters">{children}</div>
      </aside>
    );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="secondary" className="filters-open-button">
          <Icon name="filters" />
          {filtersLabel}
          {hasFilters && (
            <span className="facet-selected-count">{activeCount}</span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="filters-sheet p-0 gap-0">
        <SheetTitle>{filtersLabel}</SheetTitle>
        <SheetDescription className="sr-only">
          Affinez les produits par marque, budget et caractéristiques.
        </SheetDescription>
        <div className="filters">{children}</div>
        <div className="filters-sheet-footer">
          <Button className="w-full" onClick={() => setOpen(false)}>
            Voir les {resultCount} produit{resultCount !== 1 ? 's' : ''}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

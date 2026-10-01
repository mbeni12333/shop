import { useId, useState, type ReactNode } from 'react';

export default function FilterPanel({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <aside className="catalog-sidebar" aria-label="Filtres des produits">
      <h2 className="filters-heading">Affiner la sélection</h2>
      <button
        type="button"
        className="filters-toggle"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        Affiner la sélection <span aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      <div id={id} className={`filters ${open ? 'is-open' : ''}`}>
        {children}
      </div>
    </aside>
  );
}

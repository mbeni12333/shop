import { useEffect, useId, useState } from 'react';

import { Input } from '@/edoctor/ui/input';
import { Label } from '@/edoctor/ui/label';

export default function BasketQuantity({
  name,
  value,
  onChange,
}: {
  name: string;
  value: number;
  onChange: (quantity: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  const [error, setError] = useState('');
  const errorId = useId();
  const inputId = useId();
  useEffect(() => {
    setDraft(String(value));
  }, [value]);
  const valid = (text: string) =>
    /^\d+$/.test(text) && Number(text) >= 1 && Number(text) <= 20;
  return (
    <div className="basket-quantity">
      <div className="filter-field">
        <Label htmlFor={inputId}>Quantité</Label>
        <Input
          id={inputId}
          aria-label={`Quantité ${name}`}
          type="number"
          inputMode="numeric"
          min="1"
          max="20"
          step="1"
          value={draft}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => {
            const next = event.target.value;
            setDraft(next);
            setError('');
            if (valid(next)) onChange(Number(next));
          }}
          onBlur={() => {
            if (!valid(draft)) {
              setDraft(String(value));
              setError('Choisissez un nombre entier entre 1 et 20.');
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
          }}
        />
      </div>
      {error && (
        <p id={errorId} role="status" className="quantity-error">
          {error}
        </p>
      )}
    </div>
  );
}

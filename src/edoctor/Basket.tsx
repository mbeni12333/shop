import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { BasketLine } from './model';
import {
  BASKET_STORAGE_KEY,
  normalizeBasket,
  readBasket,
} from './basket-storage';
const Context = createContext<{
  lines: BasketLine[];
  ready: boolean;
  add: (line: BasketLine) => void;
  quantity: (index: number, quantity: number) => void;
  clear: () => void;
}>({
  lines: [],
  ready: false,
  add: () => {},
  quantity: () => {},
  clear: () => {},
});
export function BasketProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<BasketLine[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      setLines(readBasket(localStorage.getItem(BASKET_STORAGE_KEY)));
    } catch {
      /* Corrupt or unavailable local storage starts a fresh basket. */
    }
    setReady(true);
    const sync = (event: StorageEvent) => {
      // A clear in another tab also clears this basket; unrelated keys do not.
      if (event.key !== null && event.key !== BASKET_STORAGE_KEY) return;
      try {
        if (event.storageArea === localStorage)
          setLines(readBasket(event.newValue));
      } catch {
        /* Storage may be unavailable in restricted browsers. */
      }
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem(BASKET_STORAGE_KEY, JSON.stringify(lines));
      } catch {
        /* The current session still works. */
      }
    }
  }, [lines, ready]);
  return (
    <Context.Provider
      value={{
        lines,
        ready,
        clear: () => setLines([]),
        quantity: (index, n) => {
          if (!Number.isInteger(n) || n < 0 || n > 20) return;
          setLines((current) =>
            current.flatMap((l, i) =>
              i !== index ? [l] : n > 0 ? [{ ...l, quantity: n }] : [],
            ),
          );
        },
        add: (line) =>
          setLines((current) => normalizeBasket([...current, line])),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useBasket = () => useContext(Context);

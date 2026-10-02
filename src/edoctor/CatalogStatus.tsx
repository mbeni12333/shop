import { useEffect, useState } from 'react';
export default function CatalogStatus() {
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/catalog-status', { signal: controller.signal })
      .then((r) => setUnavailable(!r.ok))
      .catch(() => {});
    return () => controller.abort();
  }, []);
  return unavailable ? (
    <p role="status" className="wrap notice">
      Le catalogue est momentanément indisponible. Contactez-nous pour préparer
      votre sélection.
    </p>
  ) : null;
}

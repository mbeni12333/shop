export type ConversionEvent =
  'search' | 'product_open' | 'filter_change' | 'add_to_cart';

/** The host supplies a consented collector. No network, identifiers or search text. */
export function trackConversion(
  event: ConversionEvent,
  detail: { count?: number; source?: 'header' | 'catalog' | 'product' } = {},
) {
  if (typeof window === 'undefined') return;
  try {
    if (window.localStorage.getItem('edoctor-analytics-consent') !== 'granted')
      return;
  } catch {
    return;
  }
  window.dispatchEvent(
    new CustomEvent('edoctor:conversion', { detail: { event, ...detail } }),
  );
}

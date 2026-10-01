import type { BasketLine } from './model';

export const BASKET_STORAGE_KEY = 'edoctor-basket-v1';

// Browser storage is untrusted. Prices here are indicative only; WooCommerce
// recalculates them before payment, independently of this normalization.
export function normalizeBasket(value: unknown): BasketLine[] {
  if (!Array.isArray(value)) return [];
  const result = new Map<string, BasketLine>();
  for (const candidate of value) {
    if (!candidate || typeof candidate !== 'object') continue;
    const { productId, variationId, quantity, name, price } = candidate;
    if (
      !Number.isSafeInteger(productId) ||
      productId <= 0 ||
      !Number.isSafeInteger(variationId) ||
      variationId < 0 ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      quantity > 20 ||
      typeof name !== 'string' ||
      !name.trim()
    )
      continue;
    const normalizedPrice =
      typeof price === 'number' &&
      Number.isFinite(price) &&
      price >= 0 &&
      Number.isSafeInteger(Math.round(price * 100))
        ? price
        : null;
    const key = `${productId}:${variationId}`;
    const existing = result.get(key);
    if (existing) {
      existing.quantity = Math.min(20, existing.quantity + quantity);
      if (existing.price !== normalizedPrice) existing.price = null;
    } else if (result.size < 50) {
      result.set(key, {
        productId,
        variationId,
        quantity,
        name: name.trim().slice(0, 200),
        price: normalizedPrice,
      });
    }
  }
  return [...result.values()];
}

export function readBasket(serialized: string | null): BasketLine[] {
  try {
    return normalizeBasket(JSON.parse(serialized || '[]'));
  } catch {
    return [];
  }
}

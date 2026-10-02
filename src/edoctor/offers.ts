import type { Product } from './model';

export const OFFER_FILTER =
  'onSale = true AND stock = true AND purchasable = true AND price >= 0';
export const isCurrentOffer = (product: Product) =>
  product.onSale === true &&
  product.price !== null &&
  product.stock &&
  product.purchasable;

export function currentOffers(products: Product[]) {
  return products
    .filter(isCurrentOffer)
    .sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
}

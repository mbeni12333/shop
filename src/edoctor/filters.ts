/** Stable WooCommerce attribute name shared by the storefront and search index. */
export const attributeKey = (label: string) =>
  `spec_${label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .trim()
    .replace(/[^a-z0-9]+/g, '_')}`;

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateLines, equalSecret } from '../src/edoctor/security';
test('accepts distinct simple and variable lines', () =>
  assert.equal(
    validateLines([
      { productId: 1, variationId: 0, quantity: 1 },
      { productId: 2, variationId: 3, quantity: 20 },
    ]),
    true,
  ));
test('rejects malformed, duplicate, oversized and fractional baskets', () => {
  for (const value of [
    null,
    [],
    [{ productId: 1, variationId: 0, quantity: 0 }],
    [{ productId: 1, variationId: 0, quantity: 21 }],
    [{ productId: '1', variationId: 0, quantity: 1 }],
    [{ productId: 1, variationId: 0, quantity: 1.5 }],
    [
      { productId: 1, variationId: 0, quantity: 1 },
      { productId: 1, variationId: 0, quantity: 2 },
    ],
    Array.from({ length: 51 }, (_, i) => ({
      productId: i + 1,
      variationId: 0,
      quantity: 1,
    })),
  ])
    assert.equal(validateLines(value), false);
});
test('secret comparison rejects different content and lengths', () => {
  assert.equal(equalSecret('abc', 'abc'), true);
  assert.equal(equalSecret('abc', 'abd'), false);
  assert.equal(equalSecret('abc', 'ab'), false);
});

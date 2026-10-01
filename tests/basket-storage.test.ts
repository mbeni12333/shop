import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeBasket, readBasket } from '../src/edoctor/basket-storage';
import { validateLines } from '../src/edoctor/security';

const line = {
  productId: 1,
  variationId: 0,
  quantity: 2,
  name: '  Produit test  ',
  price: 125,
};
test('basket restores valid lines independently of corrupt neighbours', () => {
  const restored = normalizeBasket([
    null,
    42,
    'invalid',
    {},
    line,
    { ...line, productId: Number.MAX_SAFE_INTEGER + 1 },
    { ...line, quantity: 1.5 },
  ]);
  assert.deepEqual(restored, [{ ...line, name: 'Produit test' }]);
  assert.equal(validateLines(restored), true);
  assert.deepEqual(readBasket('{broken'), []);
  assert.deepEqual(readBasket('{"lines":[]}'), []);
});
test('invalid indicative prices become unknown without discarding products', () => {
  for (const price of [undefined, '125', -1, Infinity, NaN, Number.MAX_VALUE]) {
    assert.equal(normalizeBasket([{ ...line, price }])[0].price, null);
  }
  assert.equal(normalizeBasket([{ ...line, price: 0 }])[0].price, 0);
});
test('duplicates merge safely while variations remain separate and conflicting prices become unknown', () => {
  const restored = normalizeBasket([
    line,
    { ...line, quantity: 19, price: 130 },
    { ...line, variationId: 10 },
  ]);
  assert.equal(restored.length, 2);
  assert.equal(restored[0].quantity, 20);
  assert.equal(restored[0].price, null);
  assert.equal(restored[1].price, 125);
  assert.equal(validateLines(restored), true);
});
test('basket limits unique lines and drops unexpected persisted data', () => {
  const source = Array.from({ length: 60 }, (_, i) => ({
    ...line,
    productId: i + 1,
    injected: 'discard',
  }));
  const restored = normalizeBasket(source);
  assert.equal(restored.length, 50);
  assert.equal('injected' in restored[0], false);
  assert.equal(validateLines(restored), true);
  assert.equal(source[0].name, '  Produit test  ');
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import checkout from '../src/pages/api/checkout';
test('checkout refuses cross-origin requests and signs only reference lines', async () => {
  process.env.NEXT_PUBLIC_SITE_URL = 'https://shop.example';
  process.env.WORDPRESS_URL = 'https://checkout.example';
  process.env.CHECKOUT_SECRET = 'a'.repeat(40);
  let code = 200;
  let body: any;
  const res: any = {
    setHeader() {},
    status(n: number) {
      code = n;
      return this;
    },
    json(v: any) {
      body = v;
      return this;
    },
  };
  await checkout(
    {
      method: 'POST',
      headers: { origin: 'https://other.example' },
      body: { lines: [] },
    } as any,
    res,
  );
  assert.equal(code, 403);
  code = 200;
  await checkout(
    {
      method: 'POST',
      headers: { origin: 'https://shop.example' },
      body: { lines: [{ productId: 1, variationId: 0, quantity: 1 }] },
    } as any,
    res,
  );
  assert.equal(code, 200);
  assert.equal(body.url, 'https://checkout.example/?edoctor_checkout=1');
  const [payload, signature] = body.token.split('.');
  assert.equal(
    signature,
    createHmac('sha256', process.env.CHECKOUT_SECRET)
      .update(payload)
      .digest('hex'),
  );
  const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString());
  assert.ok(decoded.exp > Date.now() / 1000);
  assert.equal(decoded.lines[0].productId, 1);
});

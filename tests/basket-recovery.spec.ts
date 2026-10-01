import { test, expect } from '@playwright/test';

const line = {
  productId: 101,
  variationId: 0,
  quantity: 2,
  name: 'Produit de test conservé',
  price: 125,
};
test('corrupt browser storage preserves valid basket lines and avoids misleading totals', async ({
  page,
}) => {
  await page.goto('/');
  await page.evaluate(
    (value) => localStorage.setItem('edoctor-basket-v1', JSON.stringify(value)),
    [
      null,
      line,
      { ...line, quantity: 3 },
      { ...line, productId: 102, name: 'Prix à vérifier', price: 'invalid' },
    ],
  );
  await page.goto('/panier');
  await expect(page.locator('.basket-lines article')).toHaveCount(2);
  await expect(page.getByLabel(`Quantité ${line.name}`)).toHaveValue('5');
  await expect(page.locator('.basket-total')).toContainText('À confirmer');
  await expect(page.locator('.basket-lines')).not.toContainText('NaN');
  await page
    .getByRole('button', { name: 'Retirer Prix à vérifier', exact: true })
    .click();
  await expect(page.locator('.basket-total')).toContainText('625');
  await page.reload();
  await expect(page.getByLabel(`Quantité ${line.name}`)).toHaveValue('5');
});

test('same-origin tabs synchronize quantity, ignore unrelated storage and remove deleted lines', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await page.evaluate(
    (value) =>
      localStorage.setItem('edoctor-basket-v1', JSON.stringify([value])),
    line,
  );
  await page.goto('/panier');
  const other = await context.newPage();
  await other.goto('/panier');
  const label = `Quantité ${line.name}`;
  await expect(other.getByLabel(label)).toHaveValue('2');
  await page.getByLabel(label).fill('4');
  await expect(other.getByLabel(label)).toHaveValue('4');
  await other.evaluate(() =>
    window.addEventListener('storage', (event) => {
      if (event.key === 'unrelated-test-key')
        document.documentElement.dataset.unrelatedStorageObserved = 'yes';
    }),
  );
  await page.evaluate(() =>
    localStorage.setItem('unrelated-test-key', 'ignored'),
  );
  await expect(other.locator('html')).toHaveAttribute(
    'data-unrelated-storage-observed',
    'yes',
  );
  await expect(other.getByLabel(label)).toHaveValue('4');
  await other
    .getByRole('button', { name: `Retirer ${line.name}`, exact: true })
    .click();
  await expect(page.getByText('Votre panier est encore vide.')).toBeVisible();
  await other.evaluate(
    (value) =>
      localStorage.setItem('edoctor-basket-v1', JSON.stringify([value])),
    line,
  );
  await expect(page.getByLabel(label)).toHaveValue('2');
  await other.evaluate(() => localStorage.clear());
  await expect(page.getByText('Votre panier est encore vide.')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Votre panier est encore vide.')).toBeVisible();
  await other.close();
});

import { test, expect, type Page } from '@playwright/test';
async function filters(page: Page) {
  const toggle = page.getByRole('button', { name: /^Affiner la sélection/ });
  if (
    (await toggle.isVisible()) &&
    (await toggle.getAttribute('aria-expanded')) === 'false'
  )
    await toggle.click();
}

test('all researched references are displayed, filter live and retain URL selections', async ({
  page,
}) => {
  await page.goto('/produits');
  await expect(page.locator('.product-card')).toHaveCount(45);
  await filters(page);
  await page
    .getByRole('combobox', { name: 'Catégorie', exact: true })
    .selectOption('processeurs');
  await expect(page.locator('.product-card')).toHaveCount(9);
  await page
    .getByRole('combobox', { name: 'Marque', exact: true })
    .selectOption('AMD');
  await page
    .getByRole('combobox', { name: 'Gamme', exact: true })
    .selectOption('Milieu de gamme');
  await expect(page.locator('.product-card')).toHaveCount(2);
  await expect(page).toHaveURL(/gamme=Milieu/);
  await page.reload();
  await filters(page);
  await expect(
    page.getByRole('combobox', { name: 'Marque', exact: true }),
  ).toHaveValue('AMD');
  await expect(page.locator('.product-card')).toHaveCount(2);
  await expect(page.getByLabel('Budget maximum HT')).toBeDisabled();
  await page
    .getByRole('button', { name: 'Effacer les filtres', exact: true })
    .click();
  await expect(page.locator('.product-card')).toHaveCount(45);
  await page.screenshot({
    path: `test-results/research-grid-${test.info().project.name}.png`,
    fullPage: false,
  });
});
test('research product details expose exact source specs and never enable checkout', async ({
  page,
  request,
}) => {
  await page.goto('/categorie/refroidissement');
  await expect(page.locator('.product-card')).toHaveCount(9);
  await page.getByRole('link', { name: /Noctua NH-D15 G2 Standard/ }).click();
  await expect(
    page.getByRole('heading', {
      name: 'Noctua NH-D15 G2 Standard',
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator('.detail-picture img')).toHaveAttribute(
    'src',
    /research-products/,
  );
  await expect(page.locator('.detail-picture img')).not.toHaveJSProperty(
    'naturalWidth',
    0,
  );
  await expect(
    page.getByRole('button', { name: 'Ajouter au panier' }),
  ).toBeDisabled();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'noindex,follow',
  );
  await expect(
    page.getByRole('heading', { name: 'Référence et sources.' }),
  ).toBeVisible();
  const response = await request.post('/api/checkout', {
    headers: { Origin: 'http://127.0.0.1:3113' },
    data: { lines: [{ productId: 1, variationId: 0, quantity: 1 }] },
  });
  expect(response.status()).toBe(503);
  expect((await response.json()).error).toContain('aperçu');
});
test('researched search works without a search backend', async ({ page }) => {
  await page.goto('/recherche?q=AM5');
  await expect(page.locator('.product-card')).toHaveCount(13);
  await filters(page);
  const search = page.getByRole('searchbox', {
    name: 'Recherche dans la sélection',
  });
  await search.fill('');
  await search.pressSequentially('NH-D15');
  await expect(search).toHaveValue('NH-D15');
  await expect(page.locator('.product-card')).toHaveCount(1);
  await expect(page.locator('.product-card h3')).toHaveText(
    'Noctua NH-D15 G2 Standard',
  );
  await expect(page).toHaveURL(/q=NH-D15/);
  await page.reload();
  await filters(page);
  await expect(search).toHaveValue('NH-D15');
  await expect(page.locator('.product-card')).toHaveCount(1);
});
test('wide layout, compact breadcrumbs and complete hero artwork match the revised design', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('.hero-visual img')).toHaveAttribute(
    'src',
    '/brand/hardware-setup.svg',
  );
  await expect(page.locator('.hero-visual img')).not.toHaveJSProperty(
    'naturalWidth',
    0,
  );
  await expect(page.locator('.advice-banner img')).toHaveAttribute(
    'src',
    /ed-welcome/,
  );
  await page.goto('/categorie/processeurs');
  const header = await page.locator('.site-header').boundingBox();
  const crumb = await page.locator('.breadcrumbs').boundingBox();
  expect(crumb!.y - (header!.y + header!.height)).toBeLessThanOrEqual(25);
  if (test.info().project.name === 'research-desktop') {
    const content = await page.locator('main > .wrap').boundingBox();
    expect(content!.width).toBeGreaterThan(1800);
    const sidebar = await page.locator('.catalog-sidebar').boundingBox();
    const results = await page.locator('.catalog-results').boundingBox();
    expect(sidebar!.x + sidebar!.width).toBeLessThan(results!.x);
    expect(Math.abs(sidebar!.y - results!.y)).toBeLessThan(2);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    ),
  ).toBe(false);
  await page.screenshot({
    path: `test-results/research-category-${test.info().project.name}.png`,
    fullPage: false,
  });
});

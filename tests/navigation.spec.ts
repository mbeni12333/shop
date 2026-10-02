import { test, expect, type Page } from '@playwright/test';

// During setup, the fourteen editorial universes remain explorable. Connected
// WooCommerce taxonomy is covered by the isolated catalog fixture suite.

async function revealNavigation(page: Page) {
  const toggle = page.getByRole('button', { name: 'Ouvrir le menu' });
  if (await toggle.isVisible()) {
    if ((await toggle.getAttribute('aria-expanded')) === 'false')
      await toggle.click();
    await expect(page.getByRole('dialog')).toBeVisible();
  }
}

test('the local preview retains illustrated universe navigation', async ({
  page,
}) => {
  await page.goto('/');
  await revealNavigation(page);
  const nav = page
    .getByRole('navigation', { name: 'Navigation principale' })
    .filter({ visible: true });
  await expect(
    nav.getByRole('button', { name: 'Tous les univers', exact: true }),
  ).toBeVisible();
  for (const label of ['Composants', 'Périphériques'])
    await expect(
      nav.getByRole('button', { name: label, exact: true }),
    ).toBeVisible();
  for (const path of [
    '/blog',
    '/livraison',
    '/panier',
    '/contact',
    '/categories',
  ])
    await expect(page.locator(`a[href="${path}"]`).first()).toBeAttached();
  await expect(page).not.toHaveURL(/categorie/);
});

test('cart stays visible and usable from 320px through tablet and desktop widths', async ({
  page,
}) => {
  await page.goto('/');
  for (const width of [320, 393, 768, 1024, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const cart = page.locator('.basket-link');
    const search = page.getByRole('combobox', {
      name: 'Rechercher un produit',
    });
    await expect(search).toBeVisible();
    await expect(cart).toBeVisible();
    await expect(cart.locator('svg')).toHaveAttribute('viewBox', '0 0 24 24');
    await expect(cart.locator('svg')).toHaveCSS('width', '24px');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      ),
      `Overflow at ${width}px`,
    ).toBe(false);
    const bounds = await cart.boundingBox();
    expect(bounds?.height).toBeGreaterThanOrEqual(44);
    const searchBounds = await search.boundingBox();
    expect(Math.abs((searchBounds?.y ?? 0) - (bounds?.y ?? 0))).toBeLessThan(4);
  }
  await page.locator('.basket-link').click();
  await expect(page).toHaveURL(/\/panier$/);
});

test('every public illustration resolves and the universe artwork is consistent', async ({
  page,
}) => {
  const broken: string[] = [];
  for (const art of [
    'alimentations',
    'boitiers',
    'cartes-graphiques',
    'cartes-meres',
    'casques',
    'claviers',
    'ecrans',
    'pc-fixes',
    'portables',
    'processeurs',
    'ram',
    'refroidissement',
    'souris',
    'ssd',
    'univers',
  ]) {
    const response = await page.request.get(`/univers/vector/${art}.svg`);
    if (!response.ok()) {
      broken.push(`${art}.svg → ${response.status()}`);
      continue;
    }
    const body = await response.text();
    if (!/viewBox/.test(body)) broken.push(`${art}.svg → no viewBox`);
  }
  expect(broken, `Unusable universe artwork: ${broken.join(', ')}`).toEqual([]);
});

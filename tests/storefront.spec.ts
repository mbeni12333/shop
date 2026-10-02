import { test, expect } from '@playwright/test';

// The fixture projects run without a WooCommerce backend, so the storefront
// must degrade honestly: an empty catalogue and no invented content.
test('homepage retains the fourteen editorial universes during setup', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('.hero')).toHaveCSS(
    'background-color',
    'rgb(242, 237, 252)',
  );
  await expect(page.locator('html')).toHaveCSS('font-family', /Segoe UI/);
  await expect(
    page.getByRole('heading', { name: /Votre prochain/, level: 1 }),
  ).toBeVisible();
  await page.locator('.home-universes .text-link').click();
  await expect(page).toHaveURL(/\/categories$/);
  await expect(page.locator('.category-directory>a')).toHaveCount(14);
  expect(errors).toEqual([]);
});

test('the mobile menu opens in a dialog and closes on Escape', async ({
  page,
}) => {
  await page.setViewportSize({ width: 420, height: 780 });
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Ouvrir le menu' });
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(
    page.getByRole('navigation', { name: 'Navigation principale' }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
});

// The filter sheet needs a non-empty catalogue to exist at all; that case is
// covered by the catalog fixture suite against real Woo-shaped data.
test('an empty catalogue offers a way out instead of a dead end', async ({
  page,
}) => {
  await page.goto('/produits');
  await expect(page.locator('.empty-state')).toBeVisible();
  await expect(page.getByText(/Aucun produit disponible/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Filtres' })).toHaveCount(0);
});

test('the removed Norwegian routes are gone', async ({ request }) => {
  for (const path of ['/produkter', '/handlekurv', '/kasse', '/min-konto']) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), path).toBe(404);
  }
});

test('unconfigured forms fail honestly and search falls back to the grid', async ({
  page,
}) => {
  await page.goto('/contact');
  await page.getByLabel('Votre nom').fill('Test EDoctor');
  await page.getByLabel('Votre adresse e-mail').fill('test@example.com');
  await page
    .getByLabel('Votre projet')
    .fill('Je souhaite comparer deux ordinateurs.');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /Envoyer ma demande/ }).click();
  await expect(page.getByRole('status')).toContainText(/pas encore connecté/);
  await page
    .getByRole('combobox', { name: 'Rechercher un produit', exact: true })
    .click();
  await page
    .getByRole('combobox', { name: 'Rechercher un produit' })
    .fill('SSD');
  await page.getByRole('option', { name: /Voir tous les résultats/ }).click();
  await expect(page).toHaveURL(/\/recherche\?q=SSD$/);
});

test('public pages have French metadata and no horizontal overflow', async ({
  page,
}) => {
  for (const path of [
    '/',
    '/categories',
    '/produits',
    '/blog',
    '/contact',
    '/livraison',
    '/paiement',
    '/garanties',
    '/mentions-legales',
    '/confidentialite',
    '/conditions',
    '/compte',
  ]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    );
    expect(overflow, `${path} horizontal overflow`).toBe(false);
  }
  await page.goto('/');
  await page.screenshot({
    path: `test-results/home-${test.info().project.name}.png`,
    fullPage: true,
  });
});

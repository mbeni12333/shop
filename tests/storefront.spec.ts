import { test, expect } from '@playwright/test';
test('homepage, navigation, categories and advice work without backend', async ({
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
  await page.getByRole('link', { name: 'Explorer la boutique' }).click();
  await expect(page.locator('.category-directory>a')).toHaveCount(14);
  await page.locator('.category-directory>a').first().click();
  await expect(
    page.getByRole('heading', { name: 'PC fixes', exact: true }),
  ).toBeVisible();
  await page.goto('/guide');
  await page.getByRole('button', { name: /Voir les choix/ }).click();
  await expect(page.getByRole('heading', { name: /Affinons/ })).toBeVisible();
  expect(errors).toEqual([]);
});
test('mobile menu, empty basket and legacy redirects', async ({
  page,
  request,
}) => {
  for (const [oldPath, destination] of [
    ['/produkter', '/produits'],
    ['/produkt/exemple', '/produit/exemple'],
    ['/kategorier', '/categories'],
    ['/kategori/ram', '/categorie/ram'],
    ['/handlekurv', '/panier'],
    ['/kasse', '/panier'],
    ['/min-konto', '/compte'],
    ['/logg-inn', '/compte'],
  ]) {
    const response = await request.get(oldPath, { maxRedirects: 0 });
    expect(response.status(), oldPath).toBe(308);
    expect(response.headers().location, oldPath).toBe(destination);
  }
  await page.goto('/');
  if (
    await page.getByRole('button', { name: 'Menu', exact: true }).isVisible()
  ) {
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await expect(
      page.getByRole('navigation', { name: 'Navigation principale' }),
    ).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(
      page.getByRole('navigation', { name: 'Navigation principale' }),
    ).toBeHidden();
  }
  await page.goto('/handlekurv');
  await expect(page).toHaveURL(/\/panier$/);
  await expect(page.getByText('Votre panier est encore vide.')).toBeVisible();
});
test('unconfigured forms fail honestly and search has a fallback', async ({
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
  await page.getByLabel('Rechercher un produit', { exact: true }).fill('SSD');
  await page.getByRole('button', { name: 'Rechercher', exact: true }).click();
  await expect(page).toHaveURL(/\/recherche\?q=SSD$/);
  if (await page.locator('.research-notice').isVisible())
    await expect(page.locator('.product-card')).toHaveCount(9);
  else await expect(page.getByText(/La recherche se prépare/)).toBeVisible();
});
test('public pages have French metadata and no horizontal overflow', async ({
  page,
}) => {
  for (const path of [
    '/',
    '/categories',
    '/guide',
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

import { test, expect } from '@playwright/test';

test('official search adapter renders responsive filters and handles unavailable search', async ({
  page,
}) => {
  const hits = ['AlphaTest', 'BetaTest'].map((brand, index) => ({
    id: 800 + index,
    slug: `recherche-fictive-${index}`,
    sku: `TEST-SEARCH-${index}`,
    name: `Produit de test ${brand}`,
    brand,
    category: 'processeurs',
    tier: 'Milieu de gamme',
    description: 'Référence fictive pour vérifier la recherche.',
    attributes: { Socket: 'AM5' },
    price: null,
    stock: false,
    purchasable: false,
    image: '',
    uses: [],
    variations: [],
  }));
  let filteredRequest = false;
  let unavailable = false;
  await page.route('http://127.0.0.1:3111/multi-search', async (route) => {
    if (unavailable) {
      await route.fulfill({
        status: 503,
        json: { message: 'Fixture offline' },
      });
      return;
    }
    const { queries } = route.request().postDataJSON();
    await route.fulfill({
      json: {
        results: queries.map((query: { filter?: unknown; q?: string }) => {
          const refined = JSON.stringify(query.filter || '').includes(
            'AlphaTest',
          );
          filteredRequest ||= refined;
          const result = refined ? hits.slice(0, 1) : hits;
          return {
            indexUid: 'products',
            hits: result,
            query: query.q || '',
            processingTimeMs: 1,
            page: 1,
            hitsPerPage: 20,
            totalPages: 1,
            totalHits: result.length,
            facetDistribution: {
              category: { processeurs: 2 },
              brand: { AlphaTest: 1, BetaTest: 1 },
              tier: { 'Milieu de gamme': 2 },
            },
          };
        }),
      },
    });
  });
  await page.goto('/recherche?q=test');
  await expect(
    page.getByRole('searchbox', { name: 'Rechercher dans le catalogue' }),
  ).toBeVisible();
  await expect(page.locator('.product-card')).toHaveCount(2);
  await expect(page.locator('.ais-SearchBox-form')).toHaveCSS(
    'display',
    'flex',
  );
  await expect(page.locator('.ais-Hits-list')).toHaveCSS('display', 'grid');
  const toggle = page.getByRole('button', { name: /^Affiner la sélection/ });
  if (await toggle.isVisible()) await toggle.click();
  await page
    .getByRole('group', { name: 'Marque', exact: true })
    .getByRole('checkbox', { name: /AlphaTest/ })
    .check();
  await expect(page.locator('.product-card')).toHaveCount(1);
  expect(filteredRequest).toBe(true);
  await page
    .getByRole('button', { name: 'Effacer les filtres', exact: true })
    .click();
  await expect(page.locator('.product-card')).toHaveCount(2);
  if (test.info().project.name === 'catalog-desktop') {
    const sidebar = await page.locator('.catalog-sidebar').boundingBox();
    const results = await page.locator('.catalog-results').boundingBox();
    expect(sidebar!.x + sidebar!.width).toBeLessThan(results!.x);
    const firstCard = await page.locator('.product-card').first().boundingBox();
    const secondCard = await page.locator('.product-card').nth(1).boundingBox();
    expect(secondCard!.x).toBeGreaterThan(firstCard!.x);
  }
  await page.screenshot({
    path: `test-results/search-adapter-${test.info().project.name}.png`,
    fullPage: true,
  });
  unavailable = true;
  await page.reload();
  await expect(
    page.getByText(
      'La recherche est momentanément indisponible. Consultez les catégories ou réessayez.',
      { exact: true },
    ),
  ).toBeVisible();
});

test('category facets combine, survive reload, reset and keep filtered URLs unindexed', async ({
  page,
}) => {
  await page.goto('/categorie/processeurs');
  await expect(page.locator('.product-card')).toHaveCount(4);
  const filtersToggle = page.getByRole('button', {
    name: /^Affiner la sélection/,
  });
  if (await filtersToggle.isVisible()) await filtersToggle.click();
  const categoryTrail = JSON.parse(
    (await page.locator('#breadcrumb-schema').textContent()) || '{}',
  );
  expect(categoryTrail['@type']).toBe('BreadcrumbList');
  expect(
    categoryTrail.itemListElement.map(
      (item: { name: string; position: number }) => [item.name, item.position],
    ),
  ).toEqual([
    ['Accueil', 1],
    ['Univers', 2],
    ['Processeurs', 3],
  ]);
  expect(categoryTrail.itemListElement.at(-1).item).toBe(
    'http://127.0.0.1:3112/categorie/processeurs',
  );
  await page.screenshot({
    path: `test-results/category-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page
    .getByRole('combobox', { name: 'Socket', exact: true })
    .selectOption('AM5');
  await expect(page).toHaveURL(/spec_socket=AM5/);
  await page.getByLabel('Budget maximum HT').fill('250');
  await expect(page.locator('.product-card')).toHaveCount(1);
  await expect(page.locator('.product-card h3')).toHaveText(
    'Processeur test AM5',
  );
  await expect(page).toHaveURL(/budget=250/);
  await page.reload();
  if (await filtersToggle.isVisible()) await filtersToggle.click();
  await expect(
    page.getByRole('combobox', { name: 'Socket', exact: true }),
  ).toHaveValue('AM5');
  await expect(page.locator('.product-card')).toHaveCount(1);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'noindex,follow',
  );
  await page.getByLabel('Budget maximum HT').fill('10');
  await expect(
    page.getByRole('heading', { name: 'Aucun produit avec ces critères.' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Voir toute la sélection' }).click();
  await expect(page.locator('.product-card')).toHaveCount(4);
  await expect(page).toHaveURL(/\/categorie\/processeurs$/);
});

test('simple product basket persists, changes quantity and refuses unconfigured checkout', async ({
  page,
}) => {
  await page.goto('/produit/test-2');
  await expect(
    page.getByRole('heading', { name: 'Processeur test AM5', exact: true }),
  ).toBeVisible();
  const productTrail = JSON.parse(
    (await page.locator('#breadcrumb-schema').textContent()) || '{}',
  );
  expect(productTrail.itemListElement.at(-1)).toMatchObject({
    name: 'Processeur test AM5',
    item: 'http://127.0.0.1:3112/produit/test-2',
  });
  await expect(
    page
      .getByRole('navigation', { name: 'Fil d’Ariane' })
      .getByRole('link', { name: 'Processeurs', exact: true }),
  ).toHaveAttribute('href', '/categorie/processeurs');
  await page.screenshot({
    path: `test-results/product-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Ajouter au panier' }).click();
  await page.getByRole('link', { name: 'Voir mon panier' }).click();
  await expect(page.locator('.basket-lines article')).toHaveCount(1);
  await page.getByLabel('Quantité Processeur test AM5').fill('2');
  await page.reload();
  await expect(page.getByLabel('Quantité Processeur test AM5')).toHaveValue(
    '2',
  );
  await expect(page.locator('.basket-total')).toContainText('460');
  const quantity = page.getByLabel('Quantité Processeur test AM5');
  await quantity.fill('');
  await expect(page.locator('.basket-lines article')).toHaveCount(1);
  await quantity.fill('3');
  await expect(page.locator('.basket-total')).toContainText('690');
  await quantity.fill('1.5');
  await quantity.press('Tab');
  await expect(quantity).toHaveValue('3');
  await expect(quantity).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByRole('status')).toContainText(
    'nombre entier entre 1 et 20',
  );
  await quantity.fill('21');
  await quantity.press('Tab');
  await expect(quantity).toHaveValue('3');
  await page.screenshot({
    path: `test-results/basket-quantity-${test.info().project.name}.png`,
    fullPage: true,
  });
  await quantity.fill('2');
  await expect(quantity).not.toHaveAttribute('aria-invalid', 'true');
  await page
    .getByRole('button', { name: /Continuer vers le paiement/ })
    .click();
  await expect(page.locator('main').getByRole('alert')).toContainText(
    'Le paiement se prépare',
  );
  await page
    .getByRole('button', { name: 'Retirer Processeur test AM5', exact: true })
    .click();
  await expect(page.getByText('Votre panier est encore vide.')).toBeVisible();
});

test('variation must be chosen and its own price/reference enter the basket', async ({
  page,
}) => {
  await page.goto('/produit/test-5');
  const add = page.getByRole('button', { name: 'Ajouter au panier' });
  await expect(add).toBeDisabled();
  await expect(page.locator('option[value="53"]')).toHaveJSProperty(
    'disabled',
    true,
  );
  await page
    .getByRole('combobox', { name: 'Configuration', exact: true })
    .selectOption('52');
  await expect(page.locator('.detail-price')).toContainText('950');
  await add.click();
  const lines = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('edoctor-basket-v1') || '[]'),
  );
  expect(lines[0]).toMatchObject({
    productId: 5,
    variationId: 52,
    quantity: 1,
    price: 950,
  });
  await page.goto('/produit/test-6');
  await expect(add).toBeDisabled();
});

test('Arabic article isolates technical French and strips executable HTML', async ({
  page,
}) => {
  await page.goto('/blog/article-arabe-test');
  const article = page.locator('article.prose');
  await expect(article).toHaveAttribute('lang', 'ar');
  await expect(article).toHaveAttribute('dir', 'rtl');
  await expect(article).toHaveCSS('direction', 'rtl');
  await expect(article.locator('bdi[dir="ltr"]')).toHaveAttribute('dir', 'ltr');
  await expect(article.locator('bdi[dir="ltr"]')).toContainText(
    'Ryzen 7 — 32 Go — 120 Hz',
  );
  expect(
    await page.evaluate(
      () => (window as unknown as { fixtureUnsafe?: boolean }).fixtureUnsafe,
    ),
  ).toBeUndefined();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    ),
  ).toBe(false);
  await page.screenshot({
    path: `test-results/article-${test.info().project.name}.png`,
    fullPage: true,
  });
});

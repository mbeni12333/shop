import { test, expect, type Page } from '@playwright/test';

test('the design remains usable at 390, 768, 1024 and 1440 pixels', async ({
  page,
}) => {
  test.skip(
    test.info().project.name.includes('mobile'),
    'responsive sweep runs once',
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const width of [390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [
      '/',
      '/categorie/processeurs',
      '/produit/test-2',
      '/panier',
    ]) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      if (path.includes('categorie'))
        await expect(page.locator('.catalog-layout')).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        ),
        `${path} at ${width}px`,
      ).toBe(false);
    }
    await page.goto('/');
    const height = await page
      .locator('.site-header')
      .evaluate((element) => element.getBoundingClientRect().height);
    await page
      .getByRole('link', { name: 'Code source · AGPL-3.0' })
      .scrollIntoViewIfNeeded();
    expect(
      await page
        .locator('.site-header')
        .evaluate((element) => element.getBoundingClientRect().height),
    ).toBe(height);
    await page.screenshot({ path: `test-results/responsive-${width}.png` });
  }
  expect(errors).toEqual([]);
});

test('search suggestions support keyboard selection, Escape and a service failure', async ({
  page,
}) => {
  await page.goto('/');
  const trigger = page.getByRole('combobox', {
    name: 'Rechercher un produit',
    exact: true,
  });
  await trigger.click();
  const input = page.getByRole('combobox', { name: 'Rechercher un produit' });
  await input.fill('FIXTURE-2');
  await expect(
    page.getByRole('option', { name: /Processeur test AM5/ }),
  ).toBeVisible();
  await input.press('Escape');
  await expect(page.locator('.search-suggestions')).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await input.fill('FIXTURE-2');
  await expect(
    page.getByRole('option', { name: /Processeur test AM5/ }),
  ).toBeVisible();
  await input.press('Home');
  await expect(
    page.getByRole('option', { name: /Processeur test AM5/ }),
  ).toHaveAttribute('data-selected', 'true');
  await input.press('ArrowDown');
  await expect(
    page.getByRole('option', { name: /Voir tous les résultats/ }),
  ).toHaveAttribute('data-selected', 'true');
  await input.press('ArrowUp');
  await expect(
    page.getByRole('option', { name: /Processeur test AM5/ }),
  ).toHaveAttribute('data-selected', 'true');
  await input.press('Enter');
  await expect(page).toHaveURL(/\/produit\/test-2$/);
  await page.route('**/api/search', (route) =>
    route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }),
  );
  await trigger.click();
  await input.fill('inaccessible');
  await expect(
    page.locator('.search-suggestions').getByRole('alert'),
  ).toContainText('La recherche est indisponible');
  await input.press('Escape');
  await expect(trigger).toBeFocused();
});

test('shared filters restore through browser history and zero selections remain removable', async ({
  page,
}) => {
  await page.goto('/produits?marque=Autre+marque+test&gamme=Milieu+de+gamme');
  await openFilters(page);
  await page.getByRole('button', { name: 'Gamme', exact: true }).click();
  const selected = page
    .getByRole('group', { name: 'Gamme', exact: true })
    .getByRole('checkbox', { name: 'Milieu de gamme' });
  await expect(selected).toBeChecked();
  await expect(selected).toBeEnabled();
  await selected.uncheck();
  await expect(page).toHaveURL(/marque=Autre/);
  await expect(page).not.toHaveURL(/gamme=/);
  await expect(page.locator('.product-card')).toHaveCount(1);
  await page.goBack();
  await expect(page).toHaveURL(/gamme=Milieu/);
  await expect(page.locator('.product-card')).toHaveCount(0);
  await page.goForward();
  await expect(page.locator('.product-card')).toHaveCount(1);
});

test('reduced motion and rapid panel reversal leave navigation operable', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('[data-hero-part]')).toHaveCount(4);
  for (const part of await page.locator('[data-hero-part]').all()) {
    await expect(part).toHaveCSS('opacity', '1');
    await expect(part).toHaveCSS('transform', 'none');
  }
  const trigger = page.getByRole('combobox', {
    name: 'Rechercher un produit',
    exact: true,
  });
  for (let attempt = 0; attempt < 3; attempt++) {
    await trigger.click();
    await page
      .getByRole('combobox', { name: 'Rechercher un produit' })
      .press('Escape');
    await expect(trigger).toBeFocused();
  }
  await page.getByRole('link', { name: 'Explorer la boutique' }).click();
  await expect(page).toHaveURL(/\/categories$/);
});

async function openFilters(page: Page) {
  await expect(page.locator('.catalog-layout')).toBeVisible();
  const toggle = page.getByRole('button', { name: /^Filtres/ });
  if (await toggle.isVisible()) await toggle.click();
}

async function revealNavigation(page: Page) {
  const toggle = page.getByRole('button', { name: 'Ouvrir le menu' });
  if (await toggle.isVisible()) {
    if ((await toggle.getAttribute('aria-expanded')) === 'false')
      await toggle.click();
    await expect(page.getByRole('dialog')).toBeVisible();
  }
  // The header keeps a permanent navigation and a sheet copy; only one is
  // reachable, so scope every panel lookup to that single instance.
  return page
    .getByRole('navigation', { name: 'Navigation principale' })
    .filter({ visible: true });
}

test('WooCommerce categories drive the directory and the navigation', async ({
  page,
}) => {
  await page.goto('/categories');
  await expect(page.locator('.category-directory>a')).toHaveCount(3);
  await expect(
    page.getByRole('heading', { name: 'PC fixes', exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: `test-results/categories-${test.info().project.name}.png`,
    fullPage: true,
  });
});

test('the mega-menus expose the live taxonomy and never open onto nothing', async ({
  page,
}) => {
  await page.goto('/');
  const nav = await revealNavigation(page);

  await nav
    .getByRole('button', { name: 'Tous les univers', exact: true })
    .click();
  const universGrid = nav.locator('[id$="-univers"] .nav-category-grid');
  await expect(universGrid.locator('a')).toHaveCount(3);
  for (const name of ['PC fixes', 'Portables', 'Processeurs'])
    await expect(
      universGrid.getByRole('link', { name: new RegExp(`^${name}`) }),
    ).toBeVisible();
  // Every category is illustrated by a real asset resolved over HTTP.
  for (const image of await nav
    .locator('[id$="-univers"] .nav-category-art img')
    .all())
    await expect
      .poll(() =>
        image.evaluate((element) => (element as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);

  await nav.getByRole('button', { name: 'Composants', exact: true }).click();
  await expect(nav.locator('[id$="-univers"] .nav-category-grid')).toHaveCount(
    0,
  );
  const composantsGrid = nav.locator('[id$="-composants"] .nav-category-grid');
  await expect(composantsGrid.locator('a')).toHaveCount(1);
  await expect(
    composantsGrid.getByRole('link', { name: /^Processeurs/ }),
  ).toBeVisible();
  await composantsGrid.getByRole('link', { name: /^Processeurs/ }).click();
  await expect(page).toHaveURL(/\/categorie\/processeurs$/);

  // "Périphériques" holds nothing in this taxonomy, so it must not be offered.
  await page.goto('/');
  const freshNav = await revealNavigation(page);
  await expect(
    freshNav.getByRole('button', { name: 'Périphériques', exact: true }),
  ).toHaveCount(0);
});

test('mega-menu triggers behave as keyboard disclosures', async ({ page }) => {
  test.skip(
    test.info().project.name.includes('mobile'),
    'the mobile navigation is a sheet, not a menubar',
  );
  await page.goto('/');
  await page.setViewportSize({ width: 1440, height: 1000 });
  const nav = await revealNavigation(page);
  const trigger = nav.getByRole('button', { name: 'Composants', exact: true });
  const panel = nav.locator('[id$="-composants"]');
  const grid = panel.locator('.nav-category-grid');
  await trigger.focus();
  await trigger.press('Enter');
  await expect(grid).toBeVisible();
  // The entry key only applies once the disclosure is open, and Radix decides
  // whether focus lands on the panel or on its first link.
  await trigger.press('ArrowDown');
  await expect
    .poll(() =>
      trigger.evaluate((element) => {
        const active = element.ownerDocument.activeElement;
        return (
          active !== element &&
          active instanceof HTMLElement &&
          !!active.closest('[id$="-composants"]')
        );
      }),
    )
    .toBe(true);
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(grid).toHaveCount(0);
  await trigger.click();
  await expect(grid).toBeVisible();
  await page.getByRole('heading', { level: 1 }).click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(grid).toHaveCount(0);
});

test('a product filed in several categories keeps every link', async ({
  page,
}) => {
  await page.goto('/produit/test-7');
  await expect(
    page.getByRole('heading', { name: 'Processeur test polyvalent' }),
  ).toBeVisible();
  const trail = JSON.parse(
    (await page.locator('#breadcrumb-schema').textContent()) || '{}',
  );
  expect(trail.itemListElement.at(-1)).toMatchObject({
    name: 'Processeur test polyvalent',
  });
  for (const href of ['/categorie/processeurs', '/categorie/pc-fixes'])
    await expect(page.locator(`a[href="${href}"]`).first()).toBeAttached();
});

test('facets combine, survive reload, reset and keep filtered URLs unindexed', async ({
  page,
}) => {
  await page.goto('/categorie/processeurs');
  await expect(page.locator('.product-card')).toHaveCount(5);
  const filtersToggle = page.getByRole('button', {
    name: /^Filtres/,
  });
  await openFilters(page);
  // On small screens the sheet covers the results, so it is dismissed through
  // its own footer before anything in the result area is asserted.
  const closeSheet = async () => {
    const done = page.getByRole('button', {
      name: /^Voir les \d+ (produit|résultat)/,
    });
    if (await done.isVisible()) await done.click();
  };

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

  await page.getByRole('button', { name: 'Socket', exact: true }).click();
  await page
    .getByRole('group', { name: 'Socket', exact: true })
    .getByRole('checkbox', { name: 'AM5' })
    .check();
  await expect(page).toHaveURL(/spec_socket=AM5/);
  await expect(page.locator('.product-card')).toHaveCount(3);

  // Two socket values are OR-combined inside one repeatable facet.
  await page
    .getByRole('group', { name: 'Socket', exact: true })
    .getByRole('checkbox', { name: 'LGA1851' })
    .check();
  await expect(page).toHaveURL(/spec_socket=AM5&spec_socket=LGA1851/);
  await expect(page.locator('.product-card')).toHaveCount(4);

  // The removable badge is the affordance for dropping a single value, leaving
  // only the LGA1851 product.
  await closeSheet();
  await page
    .getByRole('button', { name: 'Retirer le filtre Socket : AM5' })
    .click();
  await expect(page).toHaveURL(/spec_socket=LGA1851/);
  await expect(page.locator('.product-card')).toHaveCount(1);

  await page.reload();
  await openFilters(page);
  await page.getByRole('button', { name: /^Socket/ }).click();
  await expect(page).toHaveURL(/spec_socket=LGA1851/);
  await expect(
    page
      .getByRole('group', { name: 'Socket', exact: true })
      .getByRole('checkbox', { name: 'LGA1851' }),
  ).toBeChecked();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'noindex,follow',
  );

  await closeSheet();
  await page.getByRole('button', { name: 'Tout effacer' }).click();
  await expect(page.locator('.product-card')).toHaveCount(5);
  await expect(page).toHaveURL(/\/categorie\/processeurs$/);

  if (test.info().project.name === 'catalog-desktop') {
    const sidebar = await page.locator('.catalog-sidebar').boundingBox();
    const results = await page.locator('.catalog-results').boundingBox();
    expect(sidebar!.x + sidebar!.width).toBeLessThan(results!.x);
    const firstCard = await page.locator('.product-card').first().boundingBox();
    const secondCard = await page.locator('.product-card').nth(1).boundingBox();
    expect(secondCard!.x).toBeGreaterThan(firstCard!.x);
  }
});

test('the price slider narrows the catalogue and drives the budget parameter', async ({
  page,
}) => {
  await page.goto('/produits');
  await openFilters(page);
  const slider = page.getByRole('slider', { name: /Budget maximum HT/ });
  await expect(slider).toBeVisible();
  await expect(slider).toHaveAttribute('aria-valuemin', /\d+/);
  // Radix sliders expose keyboard interaction, which keeps the test honest.
  await slider.focus();
  for (let step = 0; step < 40; step++) await slider.press('ArrowLeft');
  await expect(page).toHaveURL(/budget=/);

  // Derive the expectation from the fixture prices instead of hardcoding it:
  // every displayed card must sit at or below the budget carried by the URL.
  const budget = Number(new URL(page.url()).searchParams.get('budget') || '0');
  expect(budget).toBeLessThan(600);
  const prices = await page.locator('.product-card strong').allTextContents();
  expect(prices.length).toBeGreaterThan(0);
  for (const price of prices) {
    const amount = Number(price.replace(/[^\d,]/g, '').replace(',', '.'));
    expect(amount).toBeLessThanOrEqual(budget);
  }
});

test('an empty selection explains itself and offers a way forward', async ({
  page,
}) => {
  await page.goto('/produits?marque=Autre+marque+test&gamme=Milieu+de+gamme');
  await expect(page.locator('.catalog-layout')).toBeVisible();
  await expect(
    page.getByText('Aucun produit avec ces critères.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Voir toute la sélection' }).click();
  await expect(page.locator('.product-card')).toHaveCount(7);
  await expect(page).toHaveURL(/\/produits$/);
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
  await expect(page.getByText('Sélectionnez une configuration')).toBeVisible();

  await page
    .getByRole('combobox', { name: 'Configuration', exact: true })
    .click();
  const unavailable = page.getByRole('option', { name: /64 Go/ });
  await expect(unavailable).toHaveAttribute('aria-disabled', 'true');
  await page.getByRole('option', { name: /32 Go/ }).click();
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
  await expect(
    page.getByRole('button', { name: 'Ajouter au panier' }),
  ).toBeDisabled();
});

test('articles stay French and never execute injected markup', async ({
  page,
}) => {
  await page.goto('/blog/article-test');
  const article = page.locator('article.prose');
  await expect(article).toHaveAttribute('lang', 'fr');
  // The Arabic/RTL bridge is gone, so no dir attribute may leak back in.
  await expect(article).not.toHaveAttribute('dir', /.*/);
  await expect(article.locator('[dir="rtl"]')).toHaveCount(0);
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

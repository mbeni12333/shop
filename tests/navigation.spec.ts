import { test, expect, type Page } from '@playwright/test';

async function revealNavigation(page: Page) {
  const menu = page.getByRole('button', { name: 'Menu', exact: true });
  if (
    (await menu.isVisible()) &&
    (await menu.getAttribute('aria-expanded')) === 'false'
  )
    await menu.click();
}

test('category navigation exposes every universe and the correct component/peripheral families', async ({
  page,
}) => {
  await page.goto('/');
  await revealNavigation(page);
  const nav = page.getByRole('navigation', { name: 'Navigation principale' });
  await nav
    .getByRole('button', { name: 'Tous les univers', exact: true })
    .click();
  await expect(page.locator('#nav-univers .nav-category-grid a')).toHaveCount(
    14,
  );
  const artwork = page.locator('#nav-univers .nav-category-art img');
  await expect(artwork).toHaveCount(14);
  for (const image of await artwork.all()) {
    await expect(image).toHaveAttribute('src', /\/univers\/vector\/.+\.svg$/);
    await expect
      .poll(() =>
        image.evaluate((element) => (element as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);
  }
  await nav.getByRole('button', { name: 'Composants', exact: true }).click();
  await expect(page.locator('#nav-univers')).toHaveCount(0);
  await expect(
    page.locator('#nav-composants .nav-category-grid a'),
  ).toHaveCount(8);
  for (const name of [
    'Processeurs',
    'Cartes graphiques',
    'Cartes mères',
    'Mémoire RAM',
    'Stockage SSD',
    'Boîtiers',
    'Alimentations',
    'Refroidissement',
  ]) {
    await expect(
      page
        .locator('#nav-composants')
        .getByRole('link', { name: new RegExp(`^${name}`) }),
    ).toBeVisible();
  }
  await page.screenshot({
    path: `test-results/navigation-components-${test.info().project.name}.png`,
    fullPage: false,
  });
  await nav.getByRole('button', { name: 'Périphériques', exact: true }).click();
  await expect(
    page.locator('#nav-peripheriques .nav-category-grid a'),
  ).toHaveCount(4);
  await nav.getByRole('button', { name: 'Composants', exact: true }).click();
  await page
    .locator('#nav-composants')
    .getByRole('link', { name: /^Mémoire RAM/ })
    .click();
  await expect(page).toHaveURL(/\/categorie\/ram$/);
  await expect(
    page.getByRole('heading', { name: 'Mémoire RAM', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.nav-panel')).toHaveCount(0);
});

test('dropdown keyboard focus, Escape and outside click behave as disclosures', async ({
  page,
}) => {
  await page.goto('/');
  await revealNavigation(page);
  const trigger = page.getByRole('button', { name: 'Composants', exact: true });
  await trigger.focus();
  await trigger.press('ArrowDown');
  await expect(
    page.locator('#nav-composants .nav-category-grid a').first(),
  ).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.click();
  await page.locator('.announcement').click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

test('cart stays visible and usable from 320px through tablet and desktop widths', async ({
  page,
}) => {
  await page.goto('/');
  for (const width of [320, 393, 768, 1024, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const cart = page.locator('.basket-link');
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
  }
  await page.locator('.basket-link').click();
  await expect(page).toHaveURL(/\/panier$/);
});

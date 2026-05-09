import { test, expect } from '@playwright/test';

test.describe('Exercise list', () => {
  test('loads the exercises page and shows all fixture exercises', async ({ page }) => {
    await page.goto('/exercises');
    await expect(page).toHaveURL(/\/exercises$/);

    const names = ['hello_world', 'compile_error', 'args_exercise', 'sandbox'];
    for (const name of names) {
      await expect(page.getByText(name, { exact: true })).toBeVisible();
    }
  });

  test('each exercise card links to the correct URL', async ({ page }) => {
    await page.goto('/exercises');
    const link = page.getByRole('link', { name: /hello_world/i }).first();
    await expect(link).toHaveAttribute('href', '/exercises/hello_world');
  });

  test('shows the Vercises brand header', async ({ page }) => {
    await page.goto('/exercises');
    await expect(page.getByText('Vercises')).toBeVisible();
  });
});

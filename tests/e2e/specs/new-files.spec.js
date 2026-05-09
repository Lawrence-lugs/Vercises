import { test, expect } from '@playwright/test';

test.describe('New file creation (allow_new_files)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/exercises');
    await page.evaluate(() => localStorage.clear());
  });

  test('+ button is visible on the sandbox exercise', async ({ page }) => {
    await page.goto('/exercises/sandbox');
    await expect(page.getByRole('button', { name: 'sandbox.v' })).toBeVisible({ timeout: 15_000 });

    const addButton = page.locator('button[aria-label="New file"]');
    await expect(addButton).toBeVisible();
  });

  test('+ button is NOT visible on hello_world (allow_new_files: false)', async ({ page }) => {
    await page.goto('/exercises/hello_world');
    await expect(page.getByRole('button', { name: 'hello_world.v' })).toBeVisible({ timeout: 15_000 });

    const addButton = page.locator('button[aria-label="New file"]');
    await expect(addButton).not.toBeVisible();
  });

  test('clicking + creates a new tab with a typed filename', async ({ page }) => {
    await page.goto('/exercises/sandbox');
    await expect(page.getByRole('button', { name: 'sandbox.v' })).toBeVisible({ timeout: 15_000 });

    await page.locator('button[aria-label="New file"]').click();

    // A text input appears for the filename
    const nameInput = page.locator('input[placeholder="filename.v"]');
    await expect(nameInput).toBeVisible({ timeout: 3_000 });

    await nameInput.type('my_new_module.v');
    await nameInput.press('Enter');

    // The new tab should appear
    await expect(page.getByRole('button', { name: 'my_new_module.v' }).first()).toBeVisible({ timeout: 5_000 });
  });

  test('pressing Escape cancels new-file creation', async ({ page }) => {
    await page.goto('/exercises/sandbox');
    await expect(page.getByRole('button', { name: 'sandbox.v' })).toBeVisible({ timeout: 15_000 });

    await page.locator('button[aria-label="New file"]').click();
    const nameInput = page.locator('input[placeholder="filename.v"]');
    await expect(nameInput).toBeVisible({ timeout: 3_000 });

    await nameInput.press('Escape');

    // Input disappears; sandbox.v tab is still there
    await expect(nameInput).not.toBeVisible({ timeout: 3_000 });
    await expect(page.getByRole('button', { name: 'sandbox.v' })).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';

test.describe('Exercise view — instructions and editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/exercises/hello_world');
    // Wait for API response
    await page.waitForFunction(() => document.title !== '' || true);
    await page.waitForSelector('.monaco-editor, [data-testid]', { timeout: 15_000 }).catch(() => {});
  });

  test('shows the instructions pane with exercise content', async ({ page }) => {
    await expect(page.getByText(/Hello World/i)).toBeVisible({ timeout: 10_000 });
  });

  test('loads the editor with the visible source file tab', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'hello_world.v' })).toBeVisible({ timeout: 10_000 });
  });

  test('does NOT show a tab for the hidden testbench file', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'tb_hello_world.v' })).not.toBeVisible();
  });

  test('shows the Run button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /run/i })).toBeVisible();
  });
});

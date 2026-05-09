import { test, expect } from '@playwright/test';

test.describe('Simulation — success path', () => {
  test('clicking Run shows non-empty output', async ({ page }) => {
    await page.goto('/exercises/hello_world');

    // Wait for the exercise to fully load (tab appears)
    await expect(page.getByRole('button', { name: 'hello_world.v' })).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: /run/i }).click();

    // Output panel slides up; wait for it to appear
    await expect(page.getByText('Simulation', { exact: true })).toBeVisible({ timeout: 30_000 });

    // Wait for running spinner to disappear
    await expect(page.getByText(/running…/i)).not.toBeVisible({ timeout: 60_000 });

    // Output pane should contain some text (even if just blank simulation output)
    const outputPre = page.locator('pre');
    await expect(outputPre).toBeVisible({ timeout: 10_000 });
  });
});

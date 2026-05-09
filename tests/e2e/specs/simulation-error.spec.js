import { test, expect } from '@playwright/test';

test.describe('Simulation — compile error path', () => {
  test('broken Verilog produces an error in the output pane', async ({ page }) => {
    await page.goto('/exercises/compile_error');
    await expect(page.getByRole('button', { name: 'broken.v' })).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: /run/i }).click();

    // Wait for running spinner to disappear
    await expect(page.getByText(/running…/i)).not.toBeVisible({ timeout: 60_000 });

    // iverilog writes compile errors to stderr which is captured in output
    const output = page.locator('pre');
    await expect(output).toBeVisible({ timeout: 10_000 });
    await expect(output).toContainText(/error/i, { timeout: 5_000 });
  });
});

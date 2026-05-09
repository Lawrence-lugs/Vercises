import { test, expect } from '@playwright/test';

test.describe('Waveform viewer', () => {
  test('Waveform tab is present after a successful simulation', async ({ page }) => {
    await page.goto('/exercises/hello_world');
    await expect(page.getByRole('button', { name: 'hello_world.v' })).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: /run/i }).click();

    // Wait for simulation to finish
    await expect(page.getByText(/running…/i)).not.toBeVisible({ timeout: 60_000 });

    // The Waveform tab button should be visible in the panel
    const waveformTab = page.getByRole('button', { name: /waveform/i });
    await expect(waveformTab).toBeVisible({ timeout: 10_000 });
  });

  test('clicking Waveform tab shows the Surfer iframe', async ({ page }) => {
    await page.goto('/exercises/hello_world');
    await expect(page.getByRole('button', { name: 'hello_world.v' })).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: /run/i }).click();
    await expect(page.getByText(/running…/i)).not.toBeVisible({ timeout: 60_000 });

    await page.getByRole('button', { name: /waveform/i }).click();

    // The Surfer iframe must be present and visible
    const iframe = page.locator('iframe[title="Waveform Viewer"]');
    await expect(iframe).toBeVisible({ timeout: 10_000 });
  });
});

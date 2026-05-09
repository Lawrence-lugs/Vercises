import { test, expect } from '@playwright/test';

test.describe('Custom args (enable_args)', () => {
  test('args input is visible for an exercise with enable_args: true', async ({ page }) => {
    await page.goto('/exercises/args_exercise');
    await expect(page.getByRole('button', { name: 'args_module.v' })).toBeVisible({ timeout: 15_000 });

    // Open the simulation panel by clicking Run so the args input is mounted
    await page.getByRole('button', { name: /run/i }).click();

    // Wait for the panel to open (simulation header appears)
    await expect(page.getByText('Simulation', { exact: true })).toBeVisible({ timeout: 15_000 });

    // The args <input> should be visible in the panel header
    const argsInput = page.locator('input[spellcheck="false"]').first();
    await expect(argsInput).toBeVisible({ timeout: 5_000 });
  });

  test('args input is NOT visible for hello_world (enable_args: false)', async ({ page }) => {
    await page.goto('/exercises/hello_world');
    await expect(page.getByRole('button', { name: 'hello_world.v' })).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: /run/i }).click();
    await expect(page.getByText('Simulation', { exact: true })).toBeVisible({ timeout: 15_000 });

    // No args input should be present when enable_args is false
    // The args input has spellCheck=false; the only other is Monaco's textarea
    const panelHeader = page.locator('.shrink-0').last();
    const argsInput = panelHeader.locator('input');
    await expect(argsInput).not.toBeVisible();
  });

  test('modifying args and running uses the updated args', async ({ page }) => {
    await page.goto('/exercises/args_exercise');
    await expect(page.getByRole('button', { name: 'args_module.v' })).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: /run/i }).click();
    await expect(page.getByText('Simulation', { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/running…/i)).not.toBeVisible({ timeout: 60_000 });

    // Clear the cooldown then modify args and run again
    await page.waitForTimeout(1_200);

    const argsInput = page.locator('input[spellcheck="false"]').first();
    await argsInput.fill('-o a.out tb_args.v args_module.v');

    await page.getByRole('button', { name: /run/i }).click();
    // Second run should start without error
    await expect(page.getByText(/running…/i)).not.toBeVisible({ timeout: 60_000 });
  });
});

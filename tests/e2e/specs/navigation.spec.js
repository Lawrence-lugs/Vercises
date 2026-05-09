import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('navigating from exercise back to list shows all exercises', async ({ page }) => {
    await page.goto('/exercises/hello_world');
    await expect(page.getByRole('button', { name: 'hello_world.v' })).toBeVisible({ timeout: 15_000 });

    // Click the "Vercises" brand link in the header to go back to the list
    await page.getByRole('link', { name: /vercises/i }).first().click();

    await expect(page).toHaveURL(/\/exercises$/);
    await expect(page.getByText('hello_world', { exact: true })).toBeVisible();
  });

  test('navigating from list to a second exercise loads it correctly', async ({ page }) => {
    await page.goto('/exercises');
    await page.getByRole('link', { name: /args_exercise/i }).first().click();

    await expect(page).toHaveURL(/\/exercises\/args_exercise/);
    await expect(page.getByRole('button', { name: 'args_module.v' })).toBeVisible({ timeout: 15_000 });
  });

  test('navigating between two exercises updates the exercise label', async ({ page }) => {
    await page.goto('/exercises/hello_world');
    await expect(page.getByTestId('exercise-label')).toHaveText('Hello_world', { timeout: 10_000 });

    await page.goto('/exercises/args_exercise');
    await expect(page.getByTestId('exercise-label')).toHaveText('Args_exercise', { timeout: 10_000 });
  });
});

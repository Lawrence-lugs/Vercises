import { test, expect } from '@playwright/test';

// Session persistence only applies to exercises with allow_new_files: true.
// The sandbox fixture has that enabled, so we use it here.
test.describe('Session persistence (localStorage)', () => {
  const EXERCISE = 'sandbox';
  const EDITED_CONTENT = '// session persistence test ' + Date.now();

  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each run to avoid cross-test contamination
    await page.goto('/exercises');
    await page.evaluate(() => localStorage.clear());
  });

  test('edited code survives a page reload', async ({ page }) => {
    await page.goto(`/exercises/${EXERCISE}`);
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 15_000 });

    // Set content via Monaco's JS API — keyboard.type() is unreliable with Monaco
    // because Monaco processes key events asynchronously and drops characters at
    // default speed. setValue() on the model is synchronous and always correct.
    await page.evaluate((content) => {
      const models = window.monaco?.editor?.getModels();
      if (!models || models.length === 0) throw new Error('No Monaco models found');
      models[0].setValue(content);
    }, EDITED_CONTENT);

    // Wait for React's onChange → setTabs → useEffect chain to write localStorage
    await page.waitForFunction(
      (key) => localStorage.getItem(key) !== null,
      `vercises-session-${EXERCISE}`,
      { timeout: 5000 }
    );

    // Reload the page
    await page.reload();

    // Re-open the same exercise (page reloads to same URL)
    await page.goto(`/exercises/${EXERCISE}`);
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 15_000 });

    // Verify the session was restored via localStorage
    const stored = await page.evaluate(
      (key) => localStorage.getItem(key),
      `vercises-session-${EXERCISE}`
    );
    expect(stored).not.toBeNull();
    const session = JSON.parse(stored);
    expect(JSON.stringify(session)).toContain('session persistence test');
  });
});

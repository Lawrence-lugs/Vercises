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

    // Click into the Monaco editor and replace all content
    const editor = page.locator('.monaco-editor').first();
    await editor.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.type(EDITED_CONTENT);

    // Wait a tick for the onChange handler to fire and persist to localStorage
    await page.waitForTimeout(500);

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

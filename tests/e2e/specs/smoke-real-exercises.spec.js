// smoke-real-exercises.spec.js
// Runs against the REAL exercises mount (docker-compose.local.yml / docker-compose.yml).
// In CI this is the "smoke-real" Playwright project which only runs manually or on schedule.
// It verifies that every exercise in exercises/ loads without a 500 error.

import { test, expect, request } from '@playwright/test';

const EXERCISES_API = 'http://localhost:3000';

test.describe('Smoke — real exercises', () => {
  let exerciseNames = [];

  test.beforeAll(async () => {
    const ctx = await request.newContext();
    const res = await ctx.get(`${EXERCISES_API}/api/exercises`);
    const data = await res.json();
    exerciseNames = data.exercises ?? [];
    await ctx.dispose();
  });

  test('at least one real exercise is returned', () => {
    expect(exerciseNames.length).toBeGreaterThan(0);
  });

  // Dynamically generate one test per exercise
  for (let i = 0; i < 20; i++) {
    // Exercises are discovered at runtime; we use a loop placeholder capped at 20
    test(`exercise ${i} loads without error`, async ({ page }) => {
      if (i >= exerciseNames.length) test.skip();
      const name = exerciseNames[i];
      await page.goto(`/exercises/${name}`);
      // Page must not show a server error
      await expect(page.locator('body')).not.toContainText(/500|Internal Server Error/i, {
        timeout: 15_000,
      });
      // The exercise API must not return an error
      const res = await page.request.get(`${EXERCISES_API}/api/exercise/${name}`);
      expect(res.status()).toBe(200);
    });
  }
});

import { test, expect } from '@playwright/test';

/**
 * Simulation success fixtures.
 *
 * Each entry is an independent, self-contained e2e exercise that exercises one
 * simulation-command family.  Adding support for a new sim tool (verilator,
 * yosys-then-verilator, librelane-then-iverilog, …) means:
 *   1. Create tests/e2e/fixtures/exercises/<name>/ with config.json + sources.
 *   2. Add a row here.
 *
 * Fields:
 *   exercise    — directory name under fixtures/exercises/ (and the URL path)
 *   tab         — a file-tab button name to wait for before clicking Run
 *   simCmd      — label used in the test title (human-readable)
 */
const SIMULATION_FIXTURES = [
  {
    exercise: 'hello_world',
    tab:      'hello_world.v',
    simCmd:   'iverilog',
  },
  {
    exercise: 'yosys_gates',
    tab:      'and2.v',
    simCmd:   'yosys-then-ivlog',
  },
  // Add new sim-command families here ↓
];

/** Wait for a simulation run to finish and return the <pre> output locator. */
async function runSimulation(page) {
  await page.getByRole('button', { name: /run/i }).click();
  await expect(page.getByText('Simulation', { exact: true })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/running…/i)).not.toBeVisible({ timeout: 60_000 });
  return page.locator('pre');
}

for (const { exercise, tab, simCmd } of SIMULATION_FIXTURES) {
  test.describe(`Simulation — success path (${simCmd})`, () => {
    test(`first run produces output [${exercise}]`, async ({ page }) => {
      await page.goto(`/exercises/${exercise}`);
      await expect(page.getByRole('button', { name: tab })).toBeVisible({ timeout: 15_000 });

      const output = await runSimulation(page);
      await expect(output).toBeVisible({ timeout: 10_000 });
    });

    test(`second run succeeds without permission errors [${exercise}]`, async ({ page }) => {
      // Regression: server used to write files as root (0o644); the sim container
      // (UID 1000) could not overwrite artefacts (e.g. netlist.v) on a second run.
      await page.goto(`/exercises/${exercise}`);
      await expect(page.getByRole('button', { name: tab })).toBeVisible({ timeout: 15_000 });

      // First run
      await runSimulation(page);

      // Brief cooldown so the debounce guard doesn't swallow the second click
      await page.waitForTimeout(1_200);

      // Second run — must complete without an error in the output
      const output = await runSimulation(page);
      await expect(output).toBeVisible({ timeout: 10_000 });
      await expect(output).not.toContainText(/permission denied/i);
      await expect(output).not.toContainText(/eacces/i);
    });
  });
}

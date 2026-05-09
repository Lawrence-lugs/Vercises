#!/usr/bin/env node
'use strict';

/**
 * scripts/test-local.js
 *
 * Runs the full CI test suite locally in one command:
 *   npm run test:local
 *
 * Requires Docker to be running. Builds the sim image, spins up the test
 * compose stack, runs every test suite, then tears the stack down — even
 * on failure or Ctrl-C.
 *
 * Suite order mirrors .github/workflows/test.yml:
 *   1. Lint (ESLint + Prettier)
 *   2. Docker security audit
 *   3. Unit tests — server
 *   4. Unit tests — client
 *   5. Build vercises-sim Docker image
 *   6. API integration tests  (stack up → wait → test → stack down)
 *   7. Playwright E2E tests   (stack up → wait → test → stack down)
 */

const { spawnSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const isWindows = process.platform === 'win32';

let dockerStarted = false;

// ── Helpers ───────────────────────────────────────────────────────────────────

function run(cmd, args) {
  console.log(`\n\x1b[36m▶  ${[cmd, ...args].join(' ')}\x1b[0m`);
  const result = spawnSync(cmd, args, {
    stdio: 'inherit',
    cwd: ROOT,
    shell: isWindows,
  });
  const code = result.status ?? 1;
  if (code !== 0) {
    const err = new Error(`Failed: ${[cmd, ...args].join(' ')} (exit ${code})`);
    err.code = code;
    throw err;
  }
}

function teardown() {
  if (!dockerStarted) return;
  console.log('\n\x1b[33m▶  Stopping Docker stack…\x1b[0m');
  spawnSync('docker', ['compose', '-f', 'docker-compose.test.yml', 'down'], {
    stdio: 'inherit',
    cwd: ROOT,
    shell: isWindows,
  });
}

process.on('SIGINT', () => {
  console.log('\n\x1b[33mInterrupted — cleaning up…\x1b[0m');
  teardown();
  process.exit(130);
});

process.on('SIGTERM', () => {
  teardown();
  process.exit(143);
});

// ── Test runner ───────────────────────────────────────────────────────────────

let failed = false;

try {
  // ── Static checks (no Docker needed) ─────────────────────────────────────
  run('npm', ['run', 'test:lint']);
  run('node', ['scripts/check-docker-hardening.js']);
  run('npm', ['run', 'test:unit:server']);
  run('npm', ['run', 'test:unit:client']);

  // ── Build the simulator image ─────────────────────────────────────────────
  run('docker', ['build', '-t', 'vercises-sim:latest', '-f', 'sim/Dockerfile', '.']);

  // ── Bring up the test stack ───────────────────────────────────────────────
  run('docker', ['compose', '-f', 'docker-compose.test.yml', 'up', '-d']);
  dockerStarted = true;

  // ── API integration tests ─────────────────────────────────────────────────
  run('npx', ['wait-on', '-t', '60000', 'http://localhost:3000/api/exercises']);
  run('npm', ['run', 'test:api']);

  // ── Playwright E2E tests ──────────────────────────────────────────────────
  run('npx', ['wait-on', '-t', '120000', 'tcp:localhost:5173']);
  run('npx', ['playwright', 'install', '--with-deps', 'chromium']);
  run('npx', ['playwright', 'test', '--project=chromium']);
} catch (err) {
  console.error(`\n\x1b[31m✗  ${err.message}\x1b[0m`);
  failed = true;
} finally {
  teardown();
}

if (failed) {
  console.error('\n\x1b[31m❌  Test run failed.\x1b[0m\n');
  process.exit(1);
} else {
  console.log('\n\x1b[32m✅  All tests passed.\x1b[0m\n');
}

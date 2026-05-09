#!/usr/bin/env node
'use strict';

/**
 * check-docker-hardening.js
 *
 * Verifies that all required security constraints are still present in
 * server/simulator.js. Exits 1 if any invariant is missing so that CI
 * blocks the build before it reaches the deploy step.
 *
 * Run:  node scripts/check-docker-hardening.js
 */

const fs = require('fs');
const path = require('path');

const SIMULATOR_PATH = path.resolve(__dirname, '../server/simulator.js');
const source = fs.readFileSync(SIMULATOR_PATH, 'utf8');

// Each entry describes one required security property.
// 'pattern' is tested against the WHOLE file so it survives minor reformatting.
// Add new entries here when you add new hardening — never remove existing ones.
const REQUIRED_HARDENING = [
  { label: 'network isolation          (NetworkMode: none)',      pattern: /NetworkMode:\s*['"]none['"]/ },
  { label: 'read-only root filesystem   (ReadonlyRootfs: true)',  pattern: /ReadonlyRootfs:\s*true/ },
  { label: 'capability drop ALL        (CapDrop: [ALL])',         pattern: /CapDrop:\s*\[['"]ALL['"]\]/ },
  { label: 'no-new-privileges secopt   (SecurityOpt)',            pattern: /no-new-privileges/ },
  { label: 'memory limit               (Memory:)',                pattern: /Memory:\s*\d/ },
  { label: 'CPU limit                  (NanoCpus:)',              pattern: /NanoCpus:\s*\d/ },
  { label: 'PID limit                  (PidsLimit:)',             pattern: /PidsLimit:\s*\d/ },
  { label: 'non-root user              (User: 1000:1000)',        pattern: /User:\s*['"]1000:1000['"]/ },
  { label: 'noexec tmpfs on /tmp       (noexec)',                 pattern: /noexec/ },
];

// Also verify that the whitelist exports are present — removing them would break tests
const REQUIRED_EXPORTS = [
  { label: 'SIM_CMD_WHITELIST exported', pattern: /SIM_CMD_WHITELIST/ },
  { label: 'RUN_CMD_WHITELIST exported', pattern: /RUN_CMD_WHITELIST/ },
  { label: 'validateSimCmd exported',    pattern: /validateSimCmd/ },
  { label: 'validateRunCmd exported',    pattern: /validateRunCmd/ },
];

let failed = false;

console.log(`Checking Docker hardening invariants in ${SIMULATOR_PATH}\n`);

for (const { label, pattern } of [...REQUIRED_HARDENING, ...REQUIRED_EXPORTS]) {
  if (pattern.test(source)) {
    console.log(`  ✓  ${label}`);
  } else {
    console.error(`  ✗  MISSING: ${label}`);
    failed = true;
  }
}

if (failed) {
  console.error('\n[FAIL] Docker hardening regression detected — one or more invariants are missing.');
  console.error('       Review server/simulator.js and restore the missing constraints before merging.\n');
  process.exit(1);
} else {
  console.log('\n[PASS] All Docker hardening invariants present.\n');
  process.exit(0);
}

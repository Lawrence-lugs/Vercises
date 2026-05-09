'use strict';

/**
 * simulator.js — ephemeral-container simulation orchestrator
 *
 * Each call to runSimulation() spawns at most two short-lived `vercises-sim`
 * containers (compile stage, then run stage) via the Docker socket, shares
 * user files through a per-request bind-mounted temp directory on the host,
 * and destroys every container when done regardless of outcome.
 *
 * Security properties of each container:
 *   --network none         (NetworkMode: 'none')
 *   --read-only            (ReadonlyRootfs: true)
 *   --cap-drop ALL         (CapDrop: ['ALL'])
 *   --no-new-privileges    (SecurityOpt: ['no-new-privileges'])
 *   --tmpfs /tmp           (Tmpfs: { '/tmp': '...' })
 *   --memory 256m          (Memory: 256MB)
 *   --cpus 0.5             (NanoCpus: 500000000)
 *   --pids-limit 64        (PidsLimit: 64)
 *   --user 1000:1000       (User: '1000:1000')
 *
 * Environment variables:
 *   SIM_IMAGE              Docker image for simulation (default: vercises-sim:latest)
 *   SIM_TIMEOUT_MS         Kill timeout per container in ms (default: 30000)
 *   MAX_CONCURRENT_SIMS    Max simultaneous simulations (default: 5)
 */

const Docker = require('dockerode');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const { PassThrough } = require('stream');

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

const SIM_IMAGE = process.env.SIM_IMAGE || 'vercises-sim:latest';
const TIMEOUT_MS = parseInt(process.env.SIM_TIMEOUT_MS || '30000', 10);
const MAX_CONCURRENT = parseInt(process.env.MAX_CONCURRENT_SIMS || '5', 10);

// Allowed first tokens for simulation commands
const SIM_CMD_WHITELIST = ['iverilog', 'yosys-then-ivlog'];
// Allowed first tokens for run commands.
// './something' is intentionally BLOCKED: the compiled binary lives on a bind-mounted
// volume that inherits noexec from Docker Desktop's WSL2 /tmp filesystem.
// 'vvp' reads the iverilog output as data (bytecode), not as an exec()-ed binary,
// so noexec does not apply. This is also more secure: no user-compiled ELF is ever exec()-ed.
const RUN_CMD_WHITELIST = ['vvp'];

/**
 * Validate the simulation (compile) command. Throws { status: 400 } if the
 * first token is not in SIM_CMD_WHITELIST. Safe to call with null/undefined.
 */
function validateSimCmd(simCmd) {
  if (!simCmd) return;
  const simBin = simCmd.trim().split(/\s+/)[0];
  if (!SIM_CMD_WHITELIST.includes(simBin)) {
    const err = new Error(`Simulation command '${simBin}' is not allowed.`);
    err.status = 400;
    throw err;
  }
}

/**
 * Validate the run command. Throws { status: 400 } if the first token is not
 * in RUN_CMD_WHITELIST. Safe to call with null/undefined.
 */
function validateRunCmd(runCmd) {
  if (!runCmd) return;
  const runBin = runCmd.trim().split(/\s+/)[0];
  if (!RUN_CMD_WHITELIST.includes(runBin)) {
    const err = new Error(
      `Run command '${runBin}' is not allowed. Allowed: ${RUN_CMD_WHITELIST.join(', ')}.`
    );
    err.status = 400;
    throw err;
  }
}

let activeSims = 0;

/**
 * Shared HostConfig hardening applied to every simulation container.
 * Binds is set per-call.
 */
function buildHostConfig(workDir) {
  return {
    Memory: 256 * 1024 * 1024,
    NanoCpus: 500000000,
    PidsLimit: 64,
    ReadonlyRootfs: true,
    CapDrop: ['ALL'],
    SecurityOpt: ['no-new-privileges'],
    Tmpfs: { '/tmp': 'rw,noexec,nosuid,size=67108864' },
    NetworkMode: 'none',
    Binds: [`${workDir}:/workspace:rw`],
  };
}

/**
 * Spawn one ephemeral container and wait for it to finish.
 *
 * Output collection strategy:
 *   - Attach to the container BEFORE start (so no early output is missed).
 *   - Wait for the attach stream's 'end' event (guaranteed to fire after the
 *     container process exits and Docker flushes all buffered output).
 *   - Only THEN call container.wait() for the exit code and container.remove().
 *
 * This avoids the race condition in the naive wait()-then-destroy() pattern,
 * and avoids the container.logs() Buffer/stream ambiguity in dockerode v4.
 *
 * @param {string[]} cmdArray  argv array — never passed through a shell
 * @param {string}   workDir   absolute host path bound to /workspace inside the container
 * @returns {{ output: string, exitCode: number, timedOut: boolean }}
 */
async function runContainer(cmdArray, workDir) {
  const container = await docker.createContainer({
    Image: SIM_IMAGE,
    Cmd: cmdArray,
    WorkingDir: '/workspace',
    User: '1000:1000',
    HostConfig: buildHostConfig(workDir),
  });

  // Attach BEFORE start — ensures we receive output even from very fast-exiting containers
  const logStream = await container.attach({ stream: true, stdout: true, stderr: true });

  const parts = [];
  const stdoutPass = new PassThrough();
  const stderrPass = new PassThrough();
  stdoutPass.on('data', (c) => parts.push(c.toString('utf8')));
  stderrPass.on('data', (c) => parts.push(c.toString('utf8')));
  docker.modem.demuxStream(logStream, stdoutPass, stderrPass);

  // Resolves only after Docker closes the attach stream, which happens when the
  // container's process exits and all buffered output has been delivered.
  const streamDone = new Promise((resolve) => {
    logStream.on('end', resolve);
    logStream.on('close', resolve);
  });

  await container.start();

  let timedOut = false;
  const killTimer = setTimeout(async () => {
    timedOut = true;
    try {
      await container.kill();
    } catch (_) {
      /* already exited */
    }
    // Killing the container closes its streams, which resolves streamDone above.
  }, TIMEOUT_MS);

  // Wait until ALL output has arrived before reading parts[]
  await streamDone;
  clearTimeout(killTimer);

  // Container is now in 'exited' state (not yet removed) — wait() returns immediately
  let exitCode = -1;
  try {
    const result = await container.wait();
    exitCode = result.StatusCode;
  } catch (_) {
    /* ignore if somehow already removed */
  }

  try {
    await container.remove({ force: true });
  } catch (_) {
    /* already removed */
  }

  const output = parts.join('');
  if (timedOut)
    return {
      output: output + '\nError: simulation timed out after 30 seconds\n',
      exitCode,
      timedOut,
    };
  return { output, exitCode, timedOut };
}

/**
 * Kill and remove any leftover vercises-sim containers from a previous crash.
 * Called once on server startup.
 */
async function cleanupOrphans() {
  try {
    const containers = await docker.listContainers({
      filters: JSON.stringify({ ancestor: [SIM_IMAGE] }),
    });
    for (const info of containers) {
      const c = docker.getContainer(info.Id);
      try {
        await c.kill();
      } catch (_) {}
      try {
        await c.remove({ force: true });
      } catch (_) {}
    }
    if (containers.length > 0) {
      console.log(`[simulator] Cleaned up ${containers.length} orphan simulation container(s)`);
    }
  } catch (err) {
    console.error('[simulator] Orphan cleanup failed:', err.message);
  }
}

/**
 * Run a full simulation request in an ephemeral container pair.
 *
 * @param {{ files: Array<{name:string,content:string}>, simCmd: string, runCmd: string }} opts
 * @returns {{ output: string, vcd: string|null, vcd_content: string|null, netlist_content: string|null }}
 * @throws {{ status: 429 }} when MAX_CONCURRENT_SIMS is exceeded
 * @throws {{ status: 400, message: string }} on validation errors
 */
async function runSimulation({ files, simCmd, runCmd }) {
  validateSimCmd(simCmd);
  validateRunCmd(runCmd);

  // Concurrency gate
  if (activeSims >= MAX_CONCURRENT) {
    const err = new Error('Too many concurrent simulations. Try again shortly.');
    err.status = 429;
    throw err;
  }

  activeSims++;
  // Per-request temp dir — unique UUID prevents any cross-request interference
  const reqId = randomUUID();
  const workDir = path.join('/tmp', `vercises-req-${reqId}`);
  fs.mkdirSync(workDir, { recursive: true });
  // Allow UID 1000 (sim user inside containers) to write outputs (a.out, VCD, netlist.v)
  // back into the shared temp dir. The server runs as root; mode must be world-writable.
  fs.chmodSync(workDir, 0o777);

  try {
    // Write all user-supplied files into the temp dir
    for (const file of files) {
      fs.writeFileSync(path.join(workDir, path.basename(file.name)), file.content);
    }

    let output = '';
    let compilationFailed = false;

    // Stage 1: compile / synthesise
    if (simCmd) {
      const simParts = simCmd.trim().split(/\s+/);
      console.log(`[simulator] ${reqId} compile: ${simParts.join(' ')}`);
      const result = await runContainer(simParts, workDir);
      output += result.output;
      if (result.exitCode !== 0) compilationFailed = true;
    }

    // Stage 2: execute compiled binary
    if (runCmd && !compilationFailed) {
      const runParts = runCmd.trim().split(/\s+/);
      console.log(`[simulator] ${reqId} run: ${runParts.join(' ')}`);
      const result = await runContainer(runParts, workDir);
      output += result.output;
    }

    // Collect output artefacts from the shared temp dir
    const vcdFile = findVcdFile(workDir);
    let vcdContent = null;
    if (vcdFile) {
      try {
        vcdContent = fs.readFileSync(path.join(workDir, vcdFile), 'utf8');
      } catch (_) {}
    }

    let netlistContent = null;
    const netlistPath = path.join(workDir, 'netlist.v');
    if (fs.existsSync(netlistPath)) {
      try {
        netlistContent = fs.readFileSync(netlistPath, 'utf8');
      } catch (_) {}
    }

    return { output, vcd: vcdFile, vcd_content: vcdContent, netlist_content: netlistContent };
  } finally {
    activeSims--;
    try {
      fs.rmSync(workDir, { recursive: true, force: true });
    } catch (_) {}
  }
}

function findVcdFile(dir) {
  for (const fname of fs.readdirSync(dir)) {
    if (fname.endsWith('.vcd')) return fname;
  }
  return null;
}

module.exports = {
  runSimulation,
  cleanupOrphans,
  validateSimCmd,
  validateRunCmd,
  SIM_CMD_WHITELIST,
  RUN_CMD_WHITELIST,
};

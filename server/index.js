const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const util = require('util');
const listExercises = require('./listExercises');

const execFilePromise = util.promisify(execFile);

// Allowed simulation commands (first token only)
const SIM_CMD_WHITELIST = ['iverilog', 'yosys-then-ivlog'];
// Allowed run commands: must be a relative path (e.g. ./a.out, ./build/a.out)
const RUN_CMD_PATTERN = /^\.\//;

const app = express();
const PORT = 3000;

// Utility function to find any .vcd file in a directory
function findVcdFile(dir) {
  const files = fs.readdirSync(dir);
  for (const fname of files) {
    if (fname.endsWith('.vcd')) {
      return fname;
    }
  }
  return null;
}

// Expose assets in exercises folder as static files so that markdown renders properly
// app.use(express.static(path.join('/app/exercises')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

// List all exercises
app.get('/api/exercises', (req, res) => {
  console.log('Listing all exercises...');
  res.json({ exercises: listExercises() });
});

// Serve index.html for all non-API, non-static routes
app.get(/^\/(?!api\/|public\/).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve exercise files and instructions
app.get('/api/exercise/:exercise', async (req, res) => {
  const exercise = req.params.exercise;
  const exDir = path.join('/app/exercises', exercise);

  console.log('Attempting to serve exercise from path:', exDir);

  if (!fs.existsSync(path.join('/app/exercises'))) {
    console.error('Exercises directory does not exist:', path.join('/app/exercises'));
    return res.status(500).json({ error: 'Exercises directory not found on server' });
  }

  if (!fs.existsSync(exDir)) return res.status(404).json({ error: 'Exercise not found' });

  // Parse config.json
  let config = {};
  const configPath = path.join(exDir, 'config.json');
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (err) {
      console.warn(`Warning: Could not parse config.json for exercise ${exercise}:`, err.message);
    }
  }

  const files = [];
  let instructions = '';
  for (const fname of fs.readdirSync(exDir)) {
    const fpath = path.join(exDir, fname);
    if (fs.statSync(fpath).isFile()) {
      if (fname === 'instructions.md') {
        instructions = fs.readFileSync(fpath, 'utf8');
      } else if ((fname.endsWith('.v') || fname.endsWith('.txt')) && !(config.hidden || []).includes(fname)) {
        files.push({ name: fname, content: fs.readFileSync(fpath, 'utf8') });
      }
    }
  }
  res.json({ files, instructions, config });
});

app.post('/api/simulate', async (req, res) => {
  const { files, simCmd, runCmd } = req.body;

  if (!Array.isArray(files)) {
    return res.status(400).json({ error: 'Missing or invalid fields: files array required.' });
  }

  // Validate simCmd if provided
  if (simCmd) {
    const simBin = simCmd.trim().split(/\s+/)[0];
    if (!SIM_CMD_WHITELIST.includes(simBin)) {
      return res.status(400).json({ error: `Simulation command '${simBin}' is not allowed.` });
    }
  }

  // Validate runCmd if provided
  if (runCmd) {
    const runBin = runCmd.trim().split(/\s+/)[0];
    if (!RUN_CMD_PATTERN.test(runBin)) {
      return res.status(400).json({ error: `Run command '${runBin}' is not allowed. Must be a relative path (e.g. ./a.out).` });
    }
  }

  // Log for debug
  console.log(files);

  const workDir = path.join('/tmp', 'vercises-tmp');
  if (!fs.existsSync(workDir)) fs.mkdirSync(workDir);
  // Write files
  for (const file of files) {
    fs.writeFileSync(path.join(workDir, file.name), file.content);
  }

  let output = '';
  let compilationFailed = false;

  // Run simulation/synthesis command (skipped when simCmd is empty)
  if (simCmd) {
    const simParts = simCmd.trim().split(/\s+/);
    try {
      const { stdout, stderr } = await execFilePromise(simParts[0], simParts.slice(1), { cwd: workDir });
      output += stdout;
      output += stderr;
    } catch (err) {
      output += err.stderr || '';
      output += err.stdout || '';
      if (!err.stderr && !err.stdout) output += `Error: ${err.message}\n`;
      compilationFailed = true;
    }
  }

  // Print the contents of the temporary directory for debugging
  console.log('Temporary directory contents:', fs.readdirSync(workDir));

  // Run the output binary (skipped when runCmd is empty or compilation failed)
  if (runCmd && !compilationFailed) {
    const runParts = runCmd.trim().split(/\s+/);
    try {
      const { stdout, stderr } = await execFilePromise(runParts[0], runParts.slice(1), { cwd: workDir });
      output += stdout;
      output += stderr;
    } catch (err) {
      output += err.stderr || '';
      output += err.stdout || '';
      if (!err.stderr && !err.stdout) output += `Error: ${err.message}\n`;
    }
  }

  // Find any .vcd file in the workDir
  const vcdFile = findVcdFile(workDir);

  // Read VCD content before the temp dir is removed
  let vcdContent = null;
  if (vcdFile) {
    const vcdPath = path.join(workDir, vcdFile);
    try {
      vcdContent = fs.readFileSync(vcdPath, 'utf8');
    } catch (e) {
      console.error('Could not read VCD file:', e.message);
    }
  }

  // Read gate-level netlist if produced (e.g. by yosys-then-ivlog)
  let netlistContent = null;
  const netlistPath = path.join(workDir, 'netlist.v');
  if (fs.existsSync(netlistPath)) {
    try {
      netlistContent = fs.readFileSync(netlistPath, 'utf8');
    } catch (e) {
      console.error('Could not read netlist.v:', e.message);
    }
  }

  res.json({ output, vcd: vcdFile, vcd_content: vcdContent, netlist_content: netlistContent });

  // Remove the entire temp directory instead of individual files
  try {
    fs.rmSync(workDir, { recursive: true, force: true });
  } catch (err) {
    console.error('Failed to remove temp directory:', err.message);
  }

});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

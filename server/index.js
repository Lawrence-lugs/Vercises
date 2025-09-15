
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const listExercises = require('./listExercises');

const app = express();
const PORT = 3000;

// Expose assets in exercises folder as static files so that markdown renders properly
app.use(express.static(path.join('/app/exercises')));

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

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
  let hiddenFiles = [];
  let simCommand = 'iverilog -o a.out *.v'; // Default simulation command for Verilog
  let runCommand = './a.out';

  const configPath = path.join(exDir, 'config.json');
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      hiddenFiles = config.hidden || [];
      simCommand = config.simulation_command || simCommand;
      runCommand = config.run_command || runCommand;
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
      } else if ((fname.endsWith('.v') || fname.endsWith('.txt')) && !hiddenFiles.includes(fname)) {
        files.push({ name: fname, content: fs.readFileSync(fpath, 'utf8') });
      }
      
    }
  }
  res.json({ files, instructions, simCommand, runCommand });
});

app.post('/api/simulate', async (req, res) => {
  const { files, simCmd, runCmd = './a.out' } = req.body;
  const util = require('util');
  const execPromise = util.promisify(exec);
  const workDir = path.join('/tmp','vercises-tmp');
  if (!fs.existsSync(workDir)) fs.mkdirSync(workDir);
  // Write files
  for (const file of files) {
    fs.writeFileSync(path.join(workDir, file.name), file.content);
  }

  let output = '';
  let compilationFailed = false;

  try {
    // Run simulation (compile)
    const { stdout, stderr } = await execPromise(simCmd, { cwd: workDir });
    output += stdout;
    output += stderr;
  } catch (err) {
    output += `Error: ${err.message}\n`;
    compilationFailed = true;
  }

  // Print the contents of the temporary directory for debugging
  console.log('Temporary directory contents:', fs.readdirSync(workDir));

  if (!compilationFailed && fs.existsSync(path.join(workDir, 'a.out'))) {
    try {
      const { stdout, stderr } = await execPromise(runCmd, { cwd: workDir });
      output += stdout;
      output += stderr;
    } catch (err) {
      output += `Error: ${err.message}\n`;
    }
  } else {
    output += 'Simulation command failed, skipping execution.\n';
  }
  res.json({ output });
  for (const file of files) {
    fs.unlinkSync(path.join(workDir, file.name));
  }
  // Optionally, clean up a.out
  if (fs.existsSync(path.join(workDir, 'a.out'))) {
    fs.unlinkSync(path.join(workDir, 'a.out'));
  }

});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

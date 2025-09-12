
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const listExercises = require('./listExercises');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// List all exercises
app.get('/api/exercises', (req, res) => {
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

  const files = [];
  let instructions = '';
  for (const fname of fs.readdirSync(exDir)) {
    const fpath = path.join(exDir, fname);
    if (fs.statSync(fpath).isFile()) {
      if (fname === 'instructions.md') {
        instructions = fs.readFileSync(fpath, 'utf8');
      } else if (fname.endsWith('.v') || fname.endsWith('.txt')) {
        files.push({ name: fname, content: fs.readFileSync(fpath, 'utf8') });
      }
    }
  }
  res.json({ files, instructions });
});

app.post('/api/simulate', async (req, res) => {
  const { files, simCmd } = req.body;
  const util = require('util');
  const execPromise = util.promisify(exec);
  const workDir = path.join('/tmp','vercises-tmp');
  if (!fs.existsSync(workDir)) fs.mkdirSync(workDir);
  // Write files
  for (const file of files) {
    fs.writeFileSync(path.join(workDir, file.name), file.content);
  }

  console.log('Am a live code update again');

  let output = '';
  let runCommand = './a.out'; // Default output executable for iverilog
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
      const { stdout, stderr } = await execPromise(runCommand, { cwd: workDir });
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

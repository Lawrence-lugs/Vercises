
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
  const exDir = path.join(__dirname, '..', 'exercises', exercise);
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
  const workDir = path.join(__dirname, 'tmp');
  if (!fs.existsSync(workDir)) fs.mkdirSync(workDir);
  // Write files
  for (const file of files) {
    fs.writeFileSync(path.join(workDir, file.name), file.content);
  }
  // Run simulation
  exec(simCmd, { cwd: workDir }, (err, stdout, stderr) => {
    let output = '';
    if (err) output += `Error: ${err.message}\n`;
    output += stdout;
    output += stderr;
    // Clean up
    for (const file of files) {
      fs.unlinkSync(path.join(workDir, file.name));
    }
    res.json({ output });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const listExercises = require('./listExercises');
const { runSimulation, cleanupOrphans } = require('./simulator');

const app = express();
const PORT = 3000;

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
      } else if (
        (fname.endsWith('.v') || fname.endsWith('.txt')) &&
        !(config.hidden || []).includes(fname)
      ) {
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

  try {
    const result = await runSimulation({ files, simCmd, runCmd });
    res.json(result);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Internal server error' });
  }
});

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    cleanupOrphans();
  });
}

module.exports = { app };

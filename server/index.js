const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = 80;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

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

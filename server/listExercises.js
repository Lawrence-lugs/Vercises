const fs = require('fs');
const path = require('path');

function listExercises() {
  const exRoot = path.join(__dirname, '..', 'exercises');
  if (!fs.existsSync(exRoot)) return [];
  return fs.readdirSync(exRoot).filter(f => {
    const exPath = path.join(exRoot, f);
    return fs.statSync(exPath).isDirectory();
  });
}

module.exports = listExercises;

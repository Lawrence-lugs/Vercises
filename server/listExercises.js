const fs = require('fs');
const path = require('path');

function listExercises() {
  const exRoot = path.join('/app/exercises');
  if (!fs.existsSync(exRoot)) return [];

  console.log('Exercises directory contents:', fs.readdirSync(exRoot));
  
  return fs.readdirSync(exRoot).filter(f => {
    const exPath = path.join(exRoot, f);
    return fs.statSync(exPath).isDirectory();
  });
}

module.exports = listExercises;

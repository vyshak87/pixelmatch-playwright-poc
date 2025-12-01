import fs from 'fs';
import path from 'path';

function cleanDir(dir) {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach(file => {
      fs.unlinkSync(path.join(dir, file));
    });
  }
}

async function globalSetup() {
  cleanDir('actual');
  cleanDir('diff');

  if (fs.existsSync('reports/ai')) {
    fs.readdirSync('reports/ai').forEach(file => {
      fs.unlinkSync(path.join('reports/ai', file));
    });
  }

  console.log("Cleaned: actual/, diff/, reports/ai/");
}

export default globalSetup;

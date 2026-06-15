import fs from 'fs';
import path from 'path';

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of list) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getFiles(fullPath));
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = getFiles(path.join(process.cwd(), 'src'));
let issues = [];

files.forEach(f => {
  const code = fs.readFileSync(f, 'utf8');
  if (code.includes('useEffect(') && code.includes('setTimeout(')) {
    // let's print them to analyze.
    issues.push(f);
  }
});

console.log(issues.join('\n'));

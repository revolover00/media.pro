import fs from 'fs';
import path from 'path';

function fixCreateObjectURL(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      fixCreateObjectURL(fullPath);
    } else if (entry.isFile() && fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const beforeStr = "a.click();";
      
      // If the file does not have removeChild, it's not our target or we can just replace a.click() with cleanup.
      // E.g., CSVEditor.tsx: 
      // a.click();
      // setTimeout(() => URL.revokeObjectURL(url), 100); -> or downloadUrl.
      
      // Let's replace: `a.click();` with `a.click();\n    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(a.href); }, 1000);` 
      // Wait, some files might already have `document.body.removeChild(a);` so we must carefully remove the next line if it is `document.body.removeChild(a);`.
      
      let changed = false;
      
      // 1. ChartGenerator: a.click(); document.body.removeChild(a);
      content = content.replace(/a\.click\(\);\s*document\.body\.removeChild\(a\);/g, () => {
        changed = true;
        return "a.click();\n    document.body.removeChild(a);\n    setTimeout(() => URL.revokeObjectURL(a.href), 1000);";
      });
      
      // 2. CSVEditor: a.click(); (no removeChild)
      content = content.replace(/a\.click\(\);\s*(?!(?:\s*document\.body\.removeChild|\s*setTimeout))/g, () => {
        changed = true;
        return "a.click();\n    document.body.removeChild(a);\n    setTimeout(() => URL.revokeObjectURL(a.href), 1000);";
      });

      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log('Fixed:', fullPath);
      }
    }
  }
}

fixCreateObjectURL(path.join(process.cwd(), 'src', 'components', 'tools'));

import fs from 'fs';
import path from 'path';

function fixPdfTools() {
  const dir = path.join(process.cwd(), 'src', 'components', 'tools', 'pdf');
  const files = fs.readdirSync(dir);
  
  for (const f of files) {
    if (!f.endsWith('.tsx')) continue;
    
    const fullPath = path.join(dir, f);
    let content = fs.readFileSync(fullPath, 'utf8');

    // Add cleanup useEffect if `result` state exists
    if (content.includes('const [result, setResult]')) {
      if (!content.includes('URL.revokeObjectURL(result.url)')) {
        content = content.replace(
          /(const \[result, setResult\] = useState.*?;)/, 
          "$1\n\n  useEffect(() => {\n    return () => {\n      if (result && result.url) URL.revokeObjectURL(result.url);\n    };\n  }, [result]);\n"
        );
        
        fs.writeFileSync(fullPath, content);
        console.log('Fixed:', f);
      }
    }
  }
}

fixPdfTools();

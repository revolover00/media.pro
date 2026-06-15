import fs from 'fs';
import path from 'path';

function fixMessedUpPdfs() {
  const dir = path.join(process.cwd(), 'src', 'components', 'tools', 'pdf');
  const files = fs.readdirSync(dir);
  
  for (const f of files) {
    if (!f.endsWith('.tsx')) continue;
    
    const fullPath = path.join(dir, f);
    let content = fs.readFileSync(fullPath, 'utf8');

    // Remove the bad injection block
    content = content.replace(/\n\n  useEffect\(\(\) => \{\n    return \(\) => \{\n      if \(result && result\.url\) URL\.revokeObjectURL\(result\.url\);\n    \};\n  \}, \[result\]\);\n/g, '');

    // Now fix the split. In PDFUnlock:
    // const [result, setResult] = useState<{ blob: Blob; url: string; size: number } | null>(null);
    content = content.replace(/useState<\{ blob: Blob;\s*url: string; size: number \}/g, "useState<{ blob: Blob; url: string; size: number }");

    // Re-apply the correct useEffect AFTER the semicolon that finishes `(null);`
    if (content.match(/useState<\{ blob: Blob; url: string; size: number \} \| null>\(null\);/)) {
        content = content.replace(
        /(useState<\{ blob: Blob; url: string; size: number \} \| null>\(null\);)/, 
        "$1\n\n  useEffect(() => {\n    return () => {\n      if (result && result.url) URL.revokeObjectURL(result.url);\n    };\n  }, [result]);\n"
        );
    } else {
        // Find specifically const [result, setResult] = useState<any>(null); pattern
        content = content.replace(
            /(const \[result, setResult\] = useState.*?\(null\);)/, 
            "$1\n\n  useEffect(() => {\n    return () => {\n      if (result && result.url) URL.revokeObjectURL(result.url);\n    };\n  }, [result]);\n"
        );
    }
  
    fs.writeFileSync(fullPath, content);
  }
}

fixMessedUpPdfs();

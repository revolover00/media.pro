const fs = require('fs');
let code = fs.readFileSync('src/components/tools/utilities/UniversalConverter.tsx', 'utf8');

// Replace escaped backticks with real ones, and escaped $ with real ones if they exist
code = code.replace(/\\`/g, '`').replace(/\\\$/g, '$');

fs.writeFileSync('src/components/tools/utilities/UniversalConverter.tsx', code);
console.log('Fixed UniversalConverter');

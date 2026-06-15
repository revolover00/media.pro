const fs = require('fs');

let tr = fs.readFileSync('src/translations.ts', 'utf8');
tr = tr.replace('shareMenu: "بوابة المشاركة والروابط الآمنة 🔗",', 'shareMenu: "بوابة المشاركة والروابط الآمنة 🔗",\n      universalConverter: "المحول الشامل لكافة التنسيقات 🔄",');
tr = tr.replace('shareMenu: "Secure Sharing Link Gateway 🔗",', 'shareMenu: "Secure Sharing Link Gateway 🔗",\n      universalConverter: "Universal File Format Converter 🔄",');
fs.writeFileSync('src/translations.ts', tr);

let types = fs.readFileSync('src/types.ts', 'utf8');
types = types.replace("  | 'share-menu'", "  | 'share-menu'\n  | 'universal-converter'");
fs.writeFileSync('src/types.ts', types);

let dash = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');
if (!dash.includes("RefreshCw")) { dash = dash.replace("import {", "import { RefreshCw,"); fs.writeFileSync("src/components/Dashboard.tsx", dash); }

let side = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');
if (!side.includes("RefreshCw")) { side = side.replace("import {", "import { RefreshCw,"); fs.writeFileSync("src/components/Sidebar.tsx", side); }

console.log('done updating translations, types, imports');

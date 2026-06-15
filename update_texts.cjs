const fs = require('fs');
const dashboardPath = 'src/components/Dashboard.tsx';
const sidebarPath = 'src/components/Sidebar.tsx';
const pdfToolsPath = 'src/components/PdfTools.tsx';

let dContent = fs.readFileSync(dashboardPath, 'utf8');
dContent = dContent.replace(
  /تحويل امتدادات الصور المختلفة مثل PNG, JPG, WebP، مع حفظ الجودة\./,
  "تحويل جميع امتدادات وملفات الصور المتاحة (أي نوع لأي نوع) بحرية."
);
dContent = dContent.replace(
  /Convert image extensions \(PNG, JPG, WebP\) instantly while preserving fine quality\./,
  "Convert all image formats from any to any entirely instantly."
);
fs.writeFileSync(dashboardPath, dContent);

if (fs.existsSync(sidebarPath)) {
  let sContent = fs.readFileSync(sidebarPath, 'utf8');
  sContent = sContent.replace(
    /تحويل امتدادات الصور المختلفة مثل PNG, JPG, WebP، مع حفظ الجودة\./,
    "تحويل جميع امتدادات وملفات الصور المتاحة (أي نوع لأي نوع) بحرية."
  );
  sContent = sContent.replace(
    /Convert image extensions \(PNG, JPG, WebP\) instantly while preserving fine quality\./,
    "Convert all image formats from any to any entirely instantly."
  );
  fs.writeFileSync(sidebarPath, sContent);
}

// In PdfTools.tsx, we can change the PDF image converter to accept all images.
// Actually, it converts PDF pages to Images or something?
// Let's check PdfTools.tsx.

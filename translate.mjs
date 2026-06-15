import fs from 'fs';
import path from 'path';

// Let's do a simple translation in PdfTools.tsx
const pdfPath = path.join(process.cwd(), 'src/components/PdfTools.tsx');
let pdfHtml = fs.readFileSync(pdfPath, 'utf8');

// Ensure lang is destructured
if (!pdfHtml.includes('const isAr = lang === \'ar\';')) {
  pdfHtml = pdfHtml.replace('export const PdfTools: React.FC<PdfToolsProps> = ({ toolType, onAddHistoryItem }) => {', 'export const PdfTools: React.FC<PdfToolsProps> = ({ toolType, onAddHistoryItem, lang = "ar" }) => {\n  const isAr = lang === "ar";');
  
  // also add lang to PdfToolsProps
  pdfHtml = pdfHtml.replace('export interface PdfToolsProps {', 'export interface PdfToolsProps {\n  lang?: "ar" | "en";');
}

const translations = [
  ['📚 دمج ملفات PDF المتعددة', "{isAr ? '📚 دمج ملفات PDF المتعددة' : '📚 Merge Multiple PDF Files'}"],
  ['✂️ تقسيم ملف PDF وتنزيل الأوراق', "{isAr ? '✂️ تقسيم ملف PDF وتنزيل الأوراق' : '✂️ Split PDF and Extract Pages'}"],
  ['🖼️ تحويل صفحات PDF إلى صور JPG', "{isAr ? '🖼️ تحويل صفحات PDF إلى صور JPG' : '🖼️ Convert PDF Pages to JPG Images'}"],
  ['ارفع ملفاتك هنا للمُعالجة السريعة', "{isAr ? 'ارفع ملفاتك هنا للمُعالجة السريعة' : 'Upload your files here for fast processing'}"],
  ['تحديد ملفات PDF', "{isAr ? 'تحديد ملفات PDF' : 'Select PDF Files'}"],
  ['تحديد ملف PDF للتقسيم', "{isAr ? 'تحديد ملف PDF للتقسيم' : 'Select PDF File to Split'}"],
  ['تحديد ملف PDF للتحويل', "{isAr ? 'تحديد ملف PDF للتحويل' : 'Select PDF File to Convert'}"],
  ['تم دمج ملفاتك بنجاح باهر!', "{isAr ? 'تم دمج ملفاتك بنجاح باهر!' : 'Your files have been successfully merged!'}"],
  ['الحجم الإجمالي للملف الناتج:', "{isAr ? 'الحجم الإجمالي للملف الناتج:' : 'Total Output File Size:'}"],
  ['تحميل الملف المدمج', "{isAr ? 'تحميل الملف المدمج' : 'Download Merged File'}"],
  ['تم تقسيم الملف بنجاح!', "{isAr ? 'تم تقسيم الملف بنجاح!' : 'File successfully split!'}"],
  ['تم التصدير والاستخراج إلى:', "{isAr ? 'تم التصدير والاستخراج إلى:' : 'Exported and extracted to:'}"],
  ['تحميل الملف المجتزأ', "{isAr ? 'تحميل الملف المجتزأ' : 'Download Extracted File'}"],
  ['نجاح تحويل الأوراق إلى صور', "{isAr ? 'نجاح تحويل الأوراق إلى صور' : 'Pages successfully converted to images'}"],
  ['عذراً، لم يتم العثور على أي ملفات PDF صحيحة.', "isAr ? 'عذراً، لم يتم العثور على أي ملفات PDF صحيحة.' : 'Sorry, no valid PDF files found.'"],
  ['يرجى رفع ملفين كحد أدنى لدمج الملفات', "isAr ? 'يرجى رفع ملفين كحد أدنى لدمج الملفات' : 'Please upload at least 2 files to merge'"],
];

for(const [ar, en] of translations) {
  // If it's pure text wrapper vs string literal wrapper
  if (en.startsWith('{')) {
    pdfHtml = pdfHtml.replace(new RegExp(ar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), en);
  } else {
    pdfHtml = pdfHtml.replace(new RegExp("'" + ar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "'", 'g'), en);
  }
}

fs.writeFileSync(pdfPath, pdfHtml);
console.log('Translated PdfTools');

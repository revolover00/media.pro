'use client';

import React, { useState } from 'react';
import { 
  GitCompare, 
  Trash2, 
  FileText, 
  FileImage, 
  Layers, 
  CheckCircle, 
  AlertCircle, 
  Info,
  Scale,
  Plus,
  ArrowRightLeft,
  Minimize2,
  RefreshCw,
  Sliders,
  Type
} from 'lucide-react';

interface FileComparatorProps {
  lang: 'ar' | 'en';
}

interface ImageMetadata {
  name: string;
  size: number;
  width: number;
  height: number;
  preview: string;
}

interface PdfMetadata {
  name: string;
  size: number;
  pages: number;
}

export const FileComparator: React.FC<FileComparatorProps> = ({ lang }) => {
  const isAr = lang === 'ar';
  
  const [compareType, setCompareType] = useState<'image' | 'pdf' | 'text'>('image');

  // Image metrics
  const [imgA, setImgA] = useState<ImageMetadata | null>(null);
  const [imgB, setImgB] = useState<ImageMetadata | null>(null);

  // PDF metrics
  const [pdfA, setPdfA] = useState<PdfMetadata | null>(null);
  const [pdfB, setPdfB] = useState<PdfMetadata | null>(null);

  // Text diff values
  const [textA, setTextA] = useState<string>('');
  const [textB, setTextB] = useState<string>('');
  const [diffResult, setDiffResult] = useState<{ type: 'same' | 'added' | 'removed' | 'changed'; text: string; num: number }[]>([]);

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 KB';
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 'A' | 'B') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const metadata: ImageMetadata = {
          name: file.name,
          size: file.size,
          width: img.naturalWidth,
          height: img.naturalHeight,
          preview: reader.result as string
        };
        if (side === 'A') setImgA(metadata);
        else setImgB(metadata);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 'A' | 'B') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const textDecoder = new TextDecoder('ascii');
      const text = textDecoder.decode(new Uint8Array(reader.result as ArrayBuffer));
      
      const pageTypeMatches = text.match(/\/Type\s*\/Page\b/g);
      let pages = pageTypeMatches ? pageTypeMatches.length : 1;
      
      const countMatch = text.match(/\/Count\s+(\d+)/);
      if (countMatch && countMatch[1]) {
        pages = parseInt(countMatch[1], 10);
      }

      const meta: PdfMetadata = {
        name: file.name,
        size: file.size,
        pages: pages
      };

      if (side === 'A') setPdfA(meta);
      else setPdfB(meta);
    };
    reader.readAsArrayBuffer(file);
  };

  const performTextDiff = () => {
    const linesA = textA.split('\n');
    const linesB = textB.split('\n');
    const diffs: { type: 'same' | 'added' | 'removed' | 'changed'; text: string; num: number }[] = [];
    
    const maxLines = Math.max(linesA.length, linesB.length);
    for (let i = 0; i < maxLines; i++) {
      const lineA = linesA[i];
      const lineB = linesB[i];

      if (lineA === lineB) {
        if (lineA !== undefined) {
          diffs.push({ type: 'same', text: lineA, num: i + 1 });
        }
      } else if (lineA !== undefined && lineB === undefined) {
        diffs.push({ type: 'removed', text: `- ${lineA}`, num: i + 1 });
      } else if (lineA === undefined && lineB !== undefined) {
        diffs.push({ type: 'added', text: `+ ${lineB}`, num: i + 1 });
      } else {
        diffs.push({ type: 'changed', text: `≠ ${lineB} (Original: ${lineA})`, num: i + 1 });
      }
    }
    setDiffResult(diffs);
  };

  const clearWorkspace = () => {
    setImgA(null);
    setImgB(null);
    setPdfA(null);
    setPdfB(null);
    setTextA('');
    setTextB('');
    setDiffResult([]);
  };

  return (
    <div id="file-comparator" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-5 sm:p-6 shadow-sm space-y-6 text-slate-705 dark:text-slate-205">
      
      {/* Header layout */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-50 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-purple-600/10 p-3 rounded-2xl text-purple-600">
            <GitCompare className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isAr ? 'مقارن ومحلل فروقات الملفات الثنائية' : 'Twin File & Text Comparator'}
            </h2>
            <p className="text-xs text-slate-400">
              {isAr ? 'قارن بين صورتين أو ملفي مستندات بي دي اف أو تحقق من فروق السطور سطر بسطر للأكواد' : 'Evaluate physical dimensions of images, PDF metadata metrics, and line insertion/deletion in text.'}
            </p>
          </div>
        </div>

        <button
          onClick={clearWorkspace}
          className="text-xs font-bold text-rose-500 hover:underline border-0 bg-transparent cursor-pointer"
        >
          {isAr ? 'إعادة تعيين' : 'Reset Comparator'}
        </button>
      </div>

      {/* Selector tab buttons */}
      <div className="grid grid-cols-3 gap-1.5 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-100 dark:border-slate-850 text-xs font-bold font-sans">
        {[
          { id: 'image', label: isAr ? 'الصور' : 'Images', icon: FileImage },
          { id: 'pdf', label: isAr ? 'مستندات PDF' : 'PDFs', icon: Layers },
          { id: 'text', label: isAr ? 'النصوص والأكواد' : 'Text', icon: FileText }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setCompareType(t.id as any)}
            className={`py-1.5 rounded-lg cursor-pointer transition border-0 flex items-center justify-center gap-1.5 ${compareType === t.id ? 'bg-slate-900 text-white dark:bg-slate-850 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <t.icon className="w-4 h-4" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {compareType === 'image' && (
        <div className="space-y-6 text-xs text-right">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Image Source A */}
            <div className="border border-slate-100 dark:border-slate-800 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/20 space-y-3">
              <span className="font-bold text-slate-450 block">{isAr ? 'الصورة الأولى (A):' : 'Image (A):'}</span>
              
              {imgA ? (
                <div className="space-y-3">
                  <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
                    <img src={imgA.preview} alt="A" className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-800 dark:text-white truncate">{imgA.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {imgA.width}x{imgA.height} px | {formatSize(imgA.size)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="aspect-video border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center">
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'A')} className="hidden" id="comp-a" />
                  <label htmlFor="comp-a" className="cursor-pointer font-bold text-purple-600 flex flex-col items-center gap-1 hover:underline">
                    <Plus className="w-6 h-6 animate-pulse" />
                    <span>{isAr ? 'اختر صورة أ' : 'Select Image A'}</span>
                  </label>
                </div>
              )}
            </div>

            {/* Image Source B */}
            <div className="border border-slate-100 dark:border-slate-800 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/20 space-y-3">
              <span className="font-bold text-slate-450 block">{isAr ? 'الصورة الثانية (B):' : 'Image (B):'}</span>
              
              {imgB ? (
                <div className="space-y-3">
                  <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
                    <img src={imgB.preview} alt="B" className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-800 dark:text-white truncate">{imgB.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {imgB.width}x{imgB.height} px | {formatSize(imgB.size)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="aspect-video border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center">
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'B')} className="hidden" id="comp-b" />
                  <label htmlFor="comp-b" className="cursor-pointer font-bold text-purple-600 flex flex-col items-center gap-1 hover:underline">
                    <Plus className="w-6 h-6 animate-pulse" />
                    <span>{isAr ? 'اختر صورة ب' : 'Select Image B'}</span>
                  </label>
                </div>
              )}
            </div>

          </div>

          {/* Quick analytic analysis */}
          {imgA && imgB && (
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-2.5">
              <span className="font-bold text-purple-600 block">{isAr ? '📊 تقرير الفروق الهندسية المكتشفة:' : '📊 Geometric Difference Report:'}</span>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-slate-400">{isAr ? 'فرق المساحة الفيزيائية البكسلية:' : 'Aspect & Dimension Match:'}</p>
                  <p className="font-bold font-sans">
                    {imgA.width === imgB.width && imgA.height === imgB.height 
                      ? (isAr ? '✅ متطابقة دقة العرض والطول' : '✅ Matches exactly')
                      : (isAr ? `❌ مختلفة الأبعاد (${imgA.width}x${imgA.height} vs ${imgB.width}x${imgB.height})` : `❌ Mismatch dimensions`)}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-slate-400">{isAr ? 'فرق حجم التخزين للبيانات:' : 'Byte foot-print difference:'}</p>
                  <p className="font-bold font-sans">
                    {imgA.size === imgB.size 
                      ? (isAr ? '✅ متطابقة الحجيم' : '✅ Size identical')
                      : (isAr ? `تغيير بمقدار: ${(Math.abs(imgA.size - imgB.size) / 1024).toFixed(1)} KB` : `Variance: ${(Math.abs(imgA.size - imgB.size) / 1024).toFixed(1)} KB`)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {compareType === 'pdf' && (
        <div className="space-y-6 text-xs text-right">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* PDF A */}
            <div className="border border-slate-100 dark:border-slate-800 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/10 space-y-3">
              <span className="font-bold text-slate-450 block">{isAr ? 'ملف PDF الأول (A):' : 'PDF Document A:'}</span>
              {pdfA ? (
                <div className="p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                  <p className="font-bold truncate text-slate-800 dark:text-white">{pdfA.name}</p>
                  <p className="text-slate-400">{formatSize(pdfA.size)} | {pdfA.pages} {isAr ? 'صفحات مقدرة' : 'estimated pages'}</p>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
                  <input type="file" accept=".pdf" onChange={(e) => handlePdfUpload(e, 'A')} className="hidden" id="comp-pdf-a" />
                  <label htmlFor="comp-pdf-a" className="cursor-pointer font-bold text-purple-600 flex flex-col items-center gap-1 hover:underline">
                    <Plus className="w-6 h-6 animate-pulse" />
                    <span>{isAr ? 'رفع ملف PDF الأول' : 'Upload PDF A'}</span>
                  </label>
                </div>
              )}
            </div>

            {/* PDF B */}
            <div className="border border-slate-100 dark:border-slate-800 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/10 space-y-3">
              <span className="font-bold text-slate-450 block">{isAr ? 'ملف PDF الثاني (B):' : 'PDF Document B:'}</span>
              {pdfB ? (
                <div className="p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                  <p className="font-bold truncate text-slate-800 dark:text-white">{pdfB.name}</p>
                  <p className="text-slate-400">{formatSize(pdfB.size)} | {pdfB.pages} {isAr ? 'صفحات مقدرة' : 'estimated pages'}</p>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
                  <input type="file" accept=".pdf" onChange={(e) => handlePdfUpload(e, 'B')} className="hidden" id="comp-pdf-b" />
                  <label htmlFor="comp-pdf-b" className="cursor-pointer font-bold text-purple-600 flex flex-col items-center gap-1 hover:underline">
                    <Plus className="w-6 h-6 animate-pulse" />
                    <span>{isAr ? 'رفع ملف PDF الثاني' : 'Upload PDF B'}</span>
                  </label>
                </div>
              )}
            </div>

          </div>

          {pdfA && pdfB && (
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-2">
              <span className="font-bold text-purple-600 block">{isAr ? '📊 مقارنة المستندات المهيكلة:' : '📊 PDF Metric Compare:'}</span>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400">{isAr ? 'مقارنة الصفحات الحقيقية:' : 'Pages variance:'}</p>
                  <p className="font-bold">
                    {pdfA.pages === pdfB.pages 
                      ? (isAr ? '✅ متطابقة عدد الصفحات تماماً' : '✅ Pages match')
                      : (isAr ? `⚠️ مختلفة (${pdfA.pages} vs ${pdfB.pages} صفحات)` : `⚠️ Variant Page layout`)}
                  </p>
                </div>

                <div>
                  <p className="text-slate-450">{isAr ? 'التخزين:' : 'Disk Size:'}</p>
                  <p className="font-bold">
                    {pdfA.size === pdfB.size 
                      ? (isAr ? '✅ متطابق البايتات ثنائياً' : '✅ Size exact')
                      : (isAr ? `تغيير في الحجم: ${(Math.abs(pdfA.size - pdfB.size) / 1024).toFixed(1)} KB` : `Size variant`)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {compareType === 'text' && (
        <div className="space-y-4 text-xs font-sans">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-1">
              <label className="font-bold text-slate-450 text-right block">{isAr ? 'صيغة النص الأول (A):' : 'Text Input A:'}</label>
              <textarea
                value={textA}
                onChange={(e) => setTextA(e.target.value)}
                rows={4}
                placeholder="Paste original code/text..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 focus:ring-1 focus:ring-purple-500 font-mono text-[11px]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-450 text-right block">{isAr ? 'صيغة النص المقارن المحدث (B):' : 'Revisited Text B:'}</label>
              <textarea
                value={textB}
                onChange={(e) => setTextB(e.target.value)}
                rows={4}
                placeholder="Paste new revisions/text..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 focus:ring-1 focus:ring-purple-500 font-mono text-[11px]"
              />
            </div>

          </div>

          <button
            onClick={performTextDiff}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl cursor-pointer border-0 shadow text-xs"
          >
            {isAr ? 'احسب وفك فروق الأسطر البرمجية' : 'Compare Line Diff'}
          </button>

          {diffResult.length > 0 && (
            <div className="bg-slate-950 text-slate-350 p-4 rounded-xl border border-slate-850 space-y-2">
              <span className="font-bold text-purple-400 block text-right">
                {isAr ? '🔍 نتيجة مقارنة الفروق السطرية (Line-by-line Difference):' : '🔍 Line-by-line Diff Report:'}
              </span>
              
              <div className="space-y-1 max-h-[220px] overflow-y-auto font-mono text-[10px] text-left leading-relaxed">
                {diffResult.map((line, idx) => {
                  let colorClass = 'text-slate-400';
                  if (line.type === 'added') colorClass = 'text-emerald-400 bg-emerald-950/30 font-bold';
                  if (line.type === 'removed') colorClass = 'text-rose-400 bg-rose-950/30';
                  if (line.type === 'changed') colorClass = 'text-amber-400 bg-amber-950/20';

                  return (
                    <div key={idx} className={`p-1 rounded flex gap-2 ${colorClass}`}>
                      <span className="select-none text-slate-600 w-5 text-right">{line.num}</span>
                      <span className="whitespace-pre">{line.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};

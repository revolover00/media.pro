import React, { useState } from 'react';
import { 
  Columns, 
  Sparkles, 
  FileText, 
  FileImage, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  Scale,
  GitCompare,
  Plus
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
  const [compareType, setCompareType] = useState<'image' | 'pdf' | 'text'>('image');

  // Image inputs
  const [imgA, setImgA] = useState<ImageMetadata | null>(null);
  const [imgB, setImgB] = useState<ImageMetadata | null>(null);

  // PDF inputs
  const [pdfA, setPdfA] = useState<PdfMetadata | null>(null);
  const [pdfB, setPdfB] = useState<PdfMetadata | null>(null);

  // Text inputs
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

  // Basic line-by-line diff algorithm
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

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-purple-100 dark:border-slate-700 shadow-sm space-y-6">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-50 dark:border-slate-700 pb-5">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-purple-600 to-indigo-600 p-2.5 rounded-2xl text-white shadow-md">
            <GitCompare className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg text-slate-950 dark:text-white flex items-center gap-2">
              {lang === 'ar' ? 'مقارن الملفات والبيانات المتطور' : 'Multi-Format File Comparator'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'ar'
                ? 'قارن بوضوح الفوارق الجمالية والبيانات الرقمية بين صورتين، ملفي PDF، أو حدد التعديلات السطرية للشيفرات والنصوص بدقة.'
                : 'Compare visual traits side-by-side across twin images, evaluate document disparities, compute sentence additions or subtractions.'}</p>
          </div>
        </div>
      </div>

      {/* Select Category */}
      <div className="flex justify-center">
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-150 dark:border-slate-800">
          {[
            { id: 'image', labelAr: 'مقارنة صور', labelEn: 'Compare Images', icon: FileImage },
            { id: 'pdf', labelAr: 'مقارنة PDF', labelEn: 'Compare PDFs', icon: Layers },
            { id: 'text', labelAr: 'مقارنة نصوص', labelEn: 'Compare Text', icon: FileText }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCompareType(tab.id as any)}
              className={`py-2 px-4 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${compareType === tab.id ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-500 hover:text-slate-705 dark:hover:text-slate-300'}`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{lang === 'ar' ? tab.labelAr : tab.labelEn}</span>
            </button>
          ))}
        </div>
      </div>

      {/* WORKSPACES */}
      {compareType === 'image' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Image A */}
            <div className="border border-slate-150 dark:border-slate-850 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/10 space-y-3">
              <span className="text-[10px] font-black tracking-widest text-purple-600 uppercase block">IMAGE SOURCE (A)</span>
              {imgA ? (
                <div className="space-y-3">
                  <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200">
                    <img src={imgA.preview} className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="font-extrabold text-slate-700 dark:text-slate-200 truncate">{imgA.name}</p>
                    <p className="text-slate-400">Dimensions: {imgA.width}x{imgA.height} px | Size: {formatSize(imgA.size)}</p>
                  </div>
                </div>
              ) : (
                <div className="aspect-video border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-4">
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'A')} className="hidden" id="comp-img-a" />
                  <label htmlFor="comp-img-a" className="cursor-pointer text-xs font-bold text-purple-600 flex flex-col items-center gap-1.5 hover:underline">
                    <Plus className="w-6 h-6" />
                    <span>{lang === 'ar' ? 'تحميل الصورة أ' : 'Upload Image (A)'}</span>
                  </label>
                </div>
              )}
            </div>

            {/* Image B */}
            <div className="border border-slate-150 dark:border-slate-850 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/10 space-y-3">
              <span className="text-[10px] font-black tracking-widest text-purple-600 uppercase block">IMAGE SOURCE (B)</span>
              {imgB ? (
                <div className="space-y-3">
                  <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200">
                    <img src={imgB.preview} className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="font-extrabold text-slate-700 dark:text-slate-200 truncate">{imgB.name}</p>
                    <p className="text-slate-400">Dimensions: {imgB.width}x{imgB.height} px | Size: {formatSize(imgB.size)}</p>
                  </div>
                </div>
              ) : (
                <div className="aspect-video border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-4">
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'B')} className="hidden" id="comp-img-b" />
                  <label htmlFor="comp-img-b" className="cursor-pointer text-xs font-bold text-purple-600 flex flex-col items-center gap-1.5 hover:underline">
                    <Plus className="w-6 h-6" />
                    <span>{lang === 'ar' ? 'تحميل الصورة ب' : 'Upload Image (B)'}</span>
                  </label>
                </div>
              )}
            </div>

          </div>

          {/* Image comparison analysis table */}
          {imgA && imgB && (
            <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-755 rounded-2xl p-5 space-y-4">
              <h3 className="font-extrabold text-xs text-slate-705 dark:text-slate-350 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <Scale className="w-4 h-4 text-purple-600" />
                <span>{lang === 'ar' ? 'جدول الفروقات والتحليل المتكامل' : 'Quantitative Metrics Comparison Table'}</span>
              </h3>

              <div className="space-y-2 text-xs">
                {/* Metric Dimensions */}
                <div className="grid grid-cols-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-450">{lang === 'ar' ? 'دقة الصورة (Dimensions)' : 'Native dimensions'}</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{imgA.width}x{imgA.height}</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-slate-800 dark:text-slate-200">{imgB.width}x{imgB.height}</span>
                    {imgA.width === imgB.width && imgA.height === imgB.height ? (
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-600 font-bold px-1.5 py-0.5 rounded leading-none">{lang === 'ar' ? 'متطابقة' : 'Identical'}</span>
                    ) : (
                      <span className="text-[9px] bg-amber-500/10 text-amber-600 font-bold px-1.5 py-0.5 rounded leading-none">{lang === 'ar' ? 'مختلفة' : 'Mismatched'}</span>
                    )}
                  </div>
                </div>

                {/* Metric byte size */}
                <div className="grid grid-cols-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-450">{lang === 'ar' ? 'حجم الملف (File size)' : 'Total file size'}</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{formatSize(imgA.size)}</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-slate-800 dark:text-slate-200">{formatSize(imgB.size)}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded leading-none ${imgA.size === imgB.size ? 'bg-emerald-500/10 text-emerald-600' : 'bg-purple-500/10 text-purple-600'}`}>
                      {imgA.size === imgB.size 
                        ? (lang === 'ar' ? 'متساوية' : 'Equal') 
                        : (lang === 'ar' ? `فرق ${formatSize(Math.abs(imgA.size - imgB.size))}` : `${formatSize(Math.abs(imgA.size - imgB.size))} difference`)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {compareType === 'pdf' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PDF A */}
            <div className="border border-slate-150 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/10 space-y-3">
              <span className="text-[10px] font-black tracking-widest text-purple-600 uppercase block">PDF SOURCE (A)</span>
              {pdfA ? (
                <div className="space-y-1.5 text-xs">
                  <p className="font-extrabold text-slate-800 truncate">{pdfA.name}</p>
                  <p className="text-slate-400">Pages detected: {pdfA.pages} | Size: {formatSize(pdfA.size)}</p>
                </div>
              ) : (
                <div className="border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900">
                  <input type="file" accept=".pdf" onChange={(e) => handlePdfUpload(e, 'A')} className="hidden" id="comp-pdf-a" />
                  <label htmlFor="comp-pdf-a" className="cursor-pointer text-xs font-bold text-purple-600 flex flex-col items-center gap-1.5 hover:underline">
                    <Plus className="w-6 h-6" />
                    <span>{lang === 'ar' ? 'تحميل مستند PDF أ' : 'Upload PDF (A)'}</span>
                  </label>
                </div>
              )}
            </div>

            {/* PDF B */}
            <div className="border border-slate-150 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/10 space-y-3">
              <span className="text-[10px] font-black tracking-widest text-purple-600 uppercase block">PDF SOURCE (B)</span>
              {pdfB ? (
                <div className="space-y-1.5 text-xs">
                  <p className="font-extrabold text-slate-800 truncate">{pdfB.name}</p>
                  <p className="text-slate-400">Pages detected: {pdfB.pages} | Size: {formatSize(pdfB.size)}</p>
                </div>
              ) : (
                <div className="border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900">
                  <input type="file" accept=".pdf" onChange={(e) => handlePdfUpload(e, 'B')} className="hidden" id="comp-pdf-b" />
                  <label htmlFor="comp-pdf-b" className="cursor-pointer text-xs font-bold text-purple-600 flex flex-col items-center gap-1.5 hover:underline">
                    <Plus className="w-6 h-6" />
                    <span>{lang === 'ar' ? 'تحميل مستند PDF ب' : 'Upload PDF (B)'}</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {pdfA && pdfB && (
            <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-150 rounded-2xl p-5 space-y-4">
              <h3 className="font-extrabold text-xs text-slate-705 dark:text-slate-350 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <Scale className="w-4 h-4 text-purple-600" />
                <span>{lang === 'ar' ? 'مقارنة فهارس مستندات PDF' : 'PDF Document Matrix Disparities'}</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-450">{lang === 'ar' ? 'عدد الصفحات' : 'Number of pages'}</span>
                  <span className="font-mono text-slate-850 dark:text-slate-150">{pdfA.pages}</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-slate-850 dark:text-slate-150">{pdfB.pages}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded leading-none ${pdfA.pages === pdfB.pages ? 'bg-emerald-500/10 text-emerald-600' : 'bg-purple-500/10 text-purple-600'}`}>
                      {pdfA.pages === pdfB.pages ? (lang === 'ar' ? 'متطابقة' : 'Identical') : (lang === 'ar' ? 'اختلاف عدد الصفحات' : 'Discrepant Page Count')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-450">{lang === 'ar' ? 'حجم المستند الكلي' : 'Document weight size'}</span>
                  <span className="font-mono text-slate-850 dark:text-slate-150">{formatSize(pdfA.size)}</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-slate-850 dark:text-slate-150">{formatSize(pdfB.size)}</span>
                    <span className="text-[9px] bg-purple-500/10 text-purple-600 font-bold px-1.5 py-0.5 rounded leading-none">
                      {lang === 'ar' ? `فرق ${formatSize(Math.abs(pdfA.size - pdfB.size))}` : `${formatSize(Math.abs(pdfA.size - pdfB.size))} space ratio`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {compareType === 'text' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">TEXT ELEMENT (A)</label>
              <textarea
                value={textA}
                onChange={(e) => setTextA(e.target.value)}
                rows={6}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-755 text-xs p-3 rounded-2xl font-mono leading-relaxed"
                placeholder={lang === 'ar' ? 'الصق النص الأول هنا للمقارنة...' : 'Paste primary draft code or text here...'}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">TEXT ELEMENT (B)</label>
              <textarea
                value={textB}
                onChange={(e) => setTextB(e.target.value)}
                rows={6}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-755 text-xs p-3 rounded-2xl font-mono leading-relaxed"
                placeholder={lang === 'ar' ? 'الصق النص الثاني هنا للتحقق...' : 'Paste modified code or variant here...'}
              />
            </div>

          </div>

          <div className="flex justify-center">
            <button
              onClick={performTextDiff}
              className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs py-2.5 px-6 rounded-xl shadow cursor-pointer transition-colors"
            >
              <GitCompare className="w-4 h-4" />
              <span>{lang === 'ar' ? 'احسب فروق النصوص السطرية' : 'Compare Line-by-Line Changes'}</span>
            </button>
          </div>

          {diffResult.length > 0 && (
            <div className="bg-slate-950 p-4.5 rounded-2xl space-y-2 border border-slate-800 shadow-inner">
              <h4 className="text-slate-350 text-[10px] font-mono leading-none border-b border-slate-850 pb-2 flex items-center gap-1.5">
                <Columns className="w-4 h-4 text-emerald-500" />
                <span>{lang === 'ar' ? 'مخرجات الفروقات المعلمة بالألوان' : 'Highlighted Comparison Outputs'}</span>
              </h4>

              <div className="font-mono text-xs max-h-[300px] overflow-y-auto space-y-1 select-text">
                {diffResult.map((line, idx) => {
                  let colorClass = "text-slate-400";
                  let bgClass = "bg-transparent";
                  if (line.type === 'added') {
                    colorClass = "text-emerald-400 font-bold";
                    bgClass = "bg-emerald-950/20 px-1.5 rounded";
                  } else if (line.type === 'removed') {
                    colorClass = "text-rose-450 font-bold line-through";
                    bgClass = "bg-rose-950/20 px-1.5 rounded";
                  } else if (line.type === 'changed') {
                    colorClass = "text-purple-400 font-bold";
                    bgClass = "bg-purple-950/20 px-1.5 rounded";
                  }

                  return (
                    <div key={idx} className={`flex items-start gap-3 py-0.5 leading-relaxed ${bgClass}`}>
                      <span className="w-8 shrink-0 text-slate-600 text-right select-none">{line.num}</span>
                      <pre className={`whitespace-pre-wrap break-all ${colorClass}`}>{line.text}</pre>
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

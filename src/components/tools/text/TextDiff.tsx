
import React, { useState, useRef, useEffect } from 'react';
import { 
  GitCompare, 
  Upload, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Trash2, 
  Columns, 
  Layers, 
  Copy, 
  Check, 
  Printer, 
  Maximize2 
} from 'lucide-react';
import { diffLines, diffWords, diffChars, Change } from 'diff';
import { HistoryItem } from '../../../types';

interface TextDiffProps {
  lang: 'ar' | 'en';
  onAddHistoryItem?: (item: any, blob?: Blob) => void;
}

export const TextDiff: React.FC<TextDiffProps> = ({ lang, onAddHistoryItem }) => {
  const isAr = lang === 'ar';

  const [originalText, setOriginalText] = useState<string>('');
  const [modifiedText, setModifiedText] = useState<string>('');
  
  const [diffType, setDiffType] = useState<'lines' | 'words' | 'chars'>('lines');
  const [displayMode, setDisplayMode] = useState<'split' | 'unified'>('split');
  
  const [changes, setChanges] = useState<Change[]>([]);
  const [diffStats, setDiffStats] = useState({ added: 0, removed: 0, unchanged: 0 });
  const [activeDiffIndex, setActiveDiffIndex] = useState<number>(-1);
  const [copied, setCopied] = useState<boolean>(false);

  // File upload refs
  const originalFileRef = useRef<HTMLInputElement>(null);
  const modifiedFileRef = useRef<HTMLInputElement>(null);

  // References to diff element containers for navigation scrolling
  const diffElementsRef = useRef<(HTMLSpanElement | HTMLDivElement | null)[]>([]);

  // Execute diff comparison
  const handleCompare = () => {
    let result: Change[] = [];
    if (diffType === 'lines') {
      result = diffLines(originalText, modifiedText);
    } else if (diffType === 'words') {
      result = diffWords(originalText, modifiedText);
    } else {
      result = diffChars(originalText, modifiedText);
    }

    setChanges(result);

    // Calculate stats
    let added = 0;
    let removed = 0;
    let unchanged = 0;

    result.forEach((part) => {
      if (part.added) added += part.count || 1;
      else if (part.removed) removed += part.count || 1;
      else unchanged += part.count || 1;
    });

    setDiffStats({ added, removed, unchanged });
    setActiveDiffIndex(-1); // Reset active pointer

    // Save to historical logs
    if (onAddHistoryItem && (originalText.trim() || modifiedText.trim())) {
      const summaryBlob = new Blob([
        `Original:\n${originalText}\n\nModified:\n${modifiedText}`
      ], { type: 'text/plain' });

      onAddHistoryItem(
        {
          action: isAr ? 'مقارنة النصوص وتتبع الفروقات' : 'Text comparison & diff analysis',
          fileName: `diff_${Date.now()}.txt`,
          originalSize: originalText.length + modifiedText.length,
          processedSize: summaryBlob.size,
          type: 'text'
        },
        summaryBlob
      );
    }
  };

  // Run automatically when text or type changes
  useEffect(() => {
    handleCompare();
  }, [originalText, modifiedText, diffType]);

  // Handle files
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'original' | 'modified') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string || '';
      if (target === 'original') setOriginalText(text);
      else setModifiedText(text);
    };
    reader.readAsText(file);
  };

  // Find index of added/removed parts for navigation
  const diffChangesList = changes
    .map((change, idx) => ({ change, index: idx }))
    .filter(item => item.change.added || item.change.removed);

  const navigateDiff = (direction: 'next' | 'prev') => {
    if (diffChangesList.length === 0) return;

    let nextIndex = activeDiffIndex;
    if (direction === 'next') {
      nextIndex = activeDiffIndex < diffChangesList.length - 1 ? activeDiffIndex + 1 : 0;
    } else {
      nextIndex = activeDiffIndex > 0 ? activeDiffIndex - 1 : diffChangesList.length - 1;
    }

    setActiveDiffIndex(nextIndex);
    const targetElementIdx = diffChangesList[nextIndex].index;
    const element = diffElementsRef.current[targetElementIdx];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Copy results
  const copyAsPlainText = () => {
    const textOut = changes.map(part => {
      const prefix = part.added ? '[+] ' : part.removed ? '[-] ' : '    ';
      return part.value.split('\n').map(line => line ? `${prefix}${line}` : '').join('\n');
    }).join('');

    navigator.clipboard.writeText(textOut);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export as styled print/HTML
  const handleExportHTML = () => {
    const originalEscaped = originalText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const modifiedEscaped = modifiedText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    let diffContentHTML = '';
    changes.forEach((part) => {
      const colorClass = part.added 
        ? 'bg-green-100 text-green-800 border-l-4 border-green-500' 
        : part.removed 
          ? 'bg-red-100 text-red-800 line-through border-l-4 border-red-500' 
          : 'text-gray-700';
      
      const lines = part.value.replace(/</g, '&lt;').replace(/>/g, '&gt;').split('\n');
      lines.forEach(line => {
        if (line) {
          diffContentHTML += `<div class="p-1 px-3 my-0.5 rounded ${colorClass} font-mono text-sm">${line}</div>`;
        }
      });
    });

    const htmlTemplate = `
      <!DOCTYPE html>
      <html dir="${isAr ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="utf-8">
        <title>${isAr ? 'تقرير مقارنة النصوص' : 'Text Comparison Report'}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @media print {
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body class="bg-gray-50 text-gray-900 p-8 font-sans">
        <div class="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div class="flex items-center justify-between border-b pb-4 mb-6">
            <div>
              <h1 class="text-2xl font-black text-purple-800">${isAr ? 'فلتر مقارنة النصوص • FileForge Pro' : 'FileForge Pro • Text Diff Analysis'}</h1>
              <p class="text-xs text-gray-500 mt-1">${isAr ? 'تم الإنشاء في:' : 'Generated on:'} ${new Date().toLocaleString()}</p>
            </div>
            <button onclick="window.print()" class="no-print bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-all">
              ${isAr ? 'طباعة التقرير / حفظ كـ PDF' : 'Print / Save to PDF'}
            </button>
          </div>

          <div class="grid grid-cols-3 gap-4 mb-6">
            <div class="bg-green-50 p-4 rounded-xl border border-green-100 text-center">
              <span class="block text-xs font-bold text-green-600 uppercase">${isAr ? 'المضافات' : 'Additions'}</span>
              <span class="text-xl font-black text-green-700">${diffStats.added}</span>
            </div>
            <div class="bg-red-50 p-4 rounded-xl border border-red-100 text-center">
              <span class="block text-xs font-bold text-red-600 uppercase">${isAr ? 'المحذوفات' : 'Deletions'}</span>
              <span class="text-xl font-black text-red-700">${diffStats.removed}</span>
            </div>
            <div class="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
              <span class="block text-xs font-bold text-gray-500 uppercase">${isAr ? 'المتطابق' : 'Unchanged'}</span>
              <span class="text-xl font-black text-gray-700">${diffStats.unchanged}</span>
            </div>
          </div>

          <h2 class="text-md font-bold mb-3">${isAr ? 'معاينة الفروقات الكلية:' : 'Bake diff results preview:'}</h2>
          <div class="p-4 bg-gray-900 rounded-xl overflow-x-auto text-left ltr" style="direction: ltr !important">
            ${diffContentHTML}
          </div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlTemplate], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `text_diff_${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 text-right" style={{ direction: isAr ? 'rtl' : 'ltr' }}>
      {/* Title block */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-purple-100 dark:border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-2xl">
            <GitCompare className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {isAr ? '🔍 مقارنة وتحديد فروقات النصوص والملفات' : '🔍 File & Text Diff Comparator'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {isAr 
                ? 'قارن بين ملفين أو نصين تفرعياً، واحصل على تحليل دقيق للسطور أو الكلمات المضافة والمحذوفة بدقة متناهية.'
                : 'Compare two text snippets or text files side-by-side or unified. Detailed additions, deletions, and stats.'}
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Inputs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Original Document Panel */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-750 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-550" />
              <h3 className="text-xs font-black text-slate-800 dark:text-white">{isAr ? 'النص الأصلي (قبل التعديل)' : 'Original Text (Source)'}</h3>
            </div>
            
            <button
              onClick={() => originalFileRef.current?.click()}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl text-[10px] font-bold text-slate-650 dark:text-slate-350 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isAr ? 'رفع ملف' : 'Upload File'}</span>
            </button>
            <input 
              type="file" 
              ref={originalFileRef} 
              className="hidden" 
              accept=".txt,.md,.json,.js,.tsx,.html,.css" 
              onChange={(e) => handleFileUpload(e, 'original')}
            />
          </div>

          <textarea
            value={originalText}
            onChange={(e) => setOriginalText(e.target.value)}
            className="w-full h-48 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-mono focus:ring-2 focus:ring-purple-600/30 text-left"
            placeholder={isAr ? 'أدخل أو ألصق النص الأصلي للتحليل...' : 'Paste your original text segment here...'}
            style={{ direction: 'ltr' }}
          />

          <div className="flex justify-between items-center text-[10px] text-slate-400">
            <span>{isAr ? `الحروف: ${originalText.length}` : `Chars: ${originalText.length}`}</span>
            {originalText && (
              <button 
                onClick={() => setOriginalText('')}
                className="text-red-500 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>{isAr ? 'تنظيف' : 'Clear'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Modified Document Panel */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-750 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <h3 className="text-xs font-black text-slate-800 dark:text-white">{isAr ? 'النص المعدل (بعد التعديل)' : 'Modified Text (Revision)'}</h3>
            </div>
            
            <button
              onClick={() => modifiedFileRef.current?.click()}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl text-[10px] font-bold text-slate-650 dark:text-slate-350 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isAr ? 'رفع ملف' : 'Upload File'}</span>
            </button>
            <input 
              type="file" 
              ref={modifiedFileRef} 
              className="hidden" 
              accept=".txt,.md,.json,.js,.tsx,.html,.css" 
              onChange={(e) => handleFileUpload(e, 'modified')}
            />
          </div>

          <textarea
            value={modifiedText}
            onChange={(e) => setModifiedText(e.target.value)}
            className="w-full h-48 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-mono focus:ring-2 focus:ring-purple-600/30 text-left"
            placeholder={isAr ? 'أدخل أو ألصق النص المعدل لمقارنته باليسار...' : 'Paste modified text segment to compare...'}
            style={{ direction: 'ltr' }}
          />

          <div className="flex justify-between items-center text-[10px] text-slate-400">
            <span>{isAr ? `الحروف: ${modifiedText.length}` : `Chars: ${modifiedText.length}`}</span>
            {modifiedText && (
              <button 
                onClick={() => setModifiedText('')}
                className="text-red-500 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>{isAr ? 'تنظيف' : 'Clear'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Preferences Actions Toolbar */}
      <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-3xl flex flex-wrap items-center justify-between gap-4 border border-slate-100 dark:border-slate-800">
        {/* Toggle options */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="space-y-1">
            <span className="block text-[9px] font-black text-slate-405 uppercase">{isAr ? 'مستوى الفحص' : 'Compare Unit'}</span>
            <div className="inline-flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-xs border border-slate-105">
              {[
                { id: 'lines', label: isAr ? 'أعمدة/سطور' : 'Lines' },
                { id: 'words', label: isAr ? 'كلمات' : 'Words' },
                { id: 'chars', label: isAr ? 'رموز' : 'Chars' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setDiffType(opt.id as any)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${diffType === opt.id ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <span className="block text-[9px] font-black text-slate-405 uppercase">{isAr ? 'نمط العرض' : 'Display Mode'}</span>
            <div className="inline-flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-xs border border-slate-105">
              <button
                onClick={() => setDisplayMode('split')}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${displayMode === 'split' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>{isAr ? 'جنباً إلى جنب' : 'Side-by-Side'}</span>
              </button>
              <button
                onClick={() => setDisplayMode('unified')}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${displayMode === 'unified' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{isAr ? 'عرض موحّد' : 'Unified'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Diff navigations list */}
        {diffChangesList.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-bold">
              {isAr ? `تعديلات: ${activeDiffIndex >= 0 ? activeDiffIndex + 1 : '0'} من ${diffChangesList.length}` : `Diff: ${activeDiffIndex >= 0 ? activeDiffIndex + 1 : '0'} of ${diffChangesList.length}`}
            </span>
            <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-105">
              <button
                onClick={() => navigateDiff('prev')}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 border-r border-slate-205 cursor-pointer text-slate-600 dark:text-slate-300"
                title={isAr ? 'السابق' : 'Previous diff'}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigateDiff('next')}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer text-slate-600 dark:text-slate-300"
                title={isAr ? 'التالي' : 'Next diff'}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Analysed stats layout bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 text-center">
          <span className="block text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase">{isAr ? 'المضافات (مضاف)' : 'Words/Lines Added'}</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{diffStats.added}</span>
        </div>
        <div className="bg-red-50/50 dark:bg-red-950/20 p-4 rounded-2xl border border-red-100 dark:border-red-900/40 text-center">
          <span className="block text-[10px] font-black text-red-650 dark:text-red-400 uppercase">{isAr ? 'المحذوفات (محذوف)' : 'Words/Lines Removed'}</span>
          <span className="text-2xl font-black text-red-600 dark:text-red-400">{diffStats.removed}</span>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 text-center">
          <span className="block text-[10px] font-black text-slate-400 uppercase">{isAr ? 'المطابق (دون تغيير)' : 'Unchanged Block size'}</span>
          <span className="text-2xl font-black text-slate-750 dark:text-slate-200">{diffStats.unchanged}</span>
        </div>
      </div>

      {/* Diff Result Viewer Panel */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-750 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-750 pb-3">
          <h4 className="text-sm font-black text-slate-800 dark:text-white">{isAr ? 'مستخرج الفروقات الناتج:' : 'Visual Diff Output Result:'}</h4>
          <div className="flex items-center gap-2">
            <button
              onClick={copyAsPlainText}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-950 text-[10px] font-bold text-slate-600 dark:text-slate-350 border border-slate-105 rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ كمخطط' : 'Copy diff map')}</span>
            </button>

            <button
              onClick={handleExportHTML}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-550 text-white text-[10px] font-bold rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors shadow-sm"
              style={{ paddingLeft: '14px', paddingRight: '14px' }}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isAr ? 'تصدير وثيقة PDF' : 'Print / Export to PDF'}</span>
            </button>
          </div>
        </div>

        {displayMode === 'split' ? (
          /* Split View Screen */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Col Original Deleted */}
            <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl overflow-auto max-h-[460px] font-mono text-xs whitespace-pre-wrap text-left ltr" style={{ direction: 'ltr' }}>
              {changes.map((part, index) => {
                const isRemoved = part.removed;
                const isAdded = part.added;
                if (isAdded) return null; // original list skips added items

                const bgStyle = isRemoved ? 'bg-red-950/80 text-red-300 border-l-2 border-red-500 font-bold block px-2 py-0.5 my-0.5 rounded' : 'block px-2 text-slate-400';
                const prefix = isRemoved ? '- ' : '  ';

                return (
                  <span 
                    key={`o-${index}`}
                    ref={(el) => { diffElementsRef.current[index] = el; }}
                    className={`${bgStyle} ${activeDiffIndex >= 0 && diffChangesList[activeDiffIndex]?.index === index ? 'ring-2 ring-purple-500 ring-offset-1 ring-offset-slate-900' : ''}`}
                  >
                    {part.value.split('\n').map((line, lidx) => line || lidx < part.value.split('\n').length - 1 ? `${prefix}${line}\n` : '')}
                  </span>
                );
              })}
            </div>

            {/* Right Col Modified Added */}
            <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl overflow-auto max-h-[460px] font-mono text-xs whitespace-pre-wrap text-left ltr" style={{ direction: 'ltr' }}>
              {changes.map((part, index) => {
                const isRemoved = part.removed;
                const isAdded = part.added;
                if (isRemoved) return null; // modified list skips deleted items

                const bgStyle = isAdded ? 'bg-emerald-950/80 text-emerald-300 border-l-2 border-emerald-500 font-bold block px-2 py-0.5 my-0.5 rounded' : 'block px-2 text-slate-400';
                const prefix = isAdded ? '+ ' : '  ';

                return (
                  <span 
                    key={`m-${index}`}
                    className={`${bgStyle} ${activeDiffIndex >= 0 && diffChangesList[activeDiffIndex]?.index === index ? 'ring-2 ring-purple-500 ring-offset-1 ring-offset-slate-900' : ''}`}
                  >
                    {part.value.split('\n').map((line, lidx) => line || lidx < part.value.split('\n').length - 1 ? `${prefix}${line}\n` : '')}
                  </span>
                );
              })}
            </div>
          </div>
        ) : (
          /* Unified line-by-line Screen */
          <div className="p-5 bg-slate-910 bg-slate-900 text-slate-100 rounded-2xl overflow-auto max-h-[460px] font-mono text-xs whitespace-pre-wrap text-left ltr" style={{ direction: 'ltr' }}>
            {changes.map((part, index) => {
              const bgStyle = part.added 
                ? 'bg-emerald-950/80 text-emerald-300 border-l-2 border-emerald-500 block px-2 my-0.5 rounded py-0.5' 
                : part.removed 
                  ? 'bg-red-950/80 text-red-300 border-l-2 border-red-500 line-through block px-2 my-0.5 rounded py-0.5' 
                  : 'text-slate-400 block px-2';

              const prefix = part.added ? '+ ' : part.removed ? '- ' : '  ';

              return (
                <div 
                  key={`u-${index}`}
                  ref={(el) => { diffElementsRef.current[index] = el; }}
                  className={`${bgStyle} ${activeDiffIndex >= 0 && diffChangesList[activeDiffIndex]?.index === index ? 'ring-2 ring-purple-500 ring-offset-1 ring-offset-slate-900' : ''}`}
                >
                  {part.value.split('\n').map((line, lidx) => line || lidx < part.value.split('\n').length - 1 ? `${prefix}${line}\n` : '')}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

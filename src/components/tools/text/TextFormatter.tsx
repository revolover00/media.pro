
import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Trash2, 
  Copy, 
  Check, 
  AlignLeft, 
  ListOrdered, 
  ArrowUpDown, 
  RefreshCw,
  Space,
  Baseline,
  ChevronDown,
  BookOpen
} from 'lucide-react';
import { HistoryItem } from '../../../types';

interface TextFormatterProps {
  lang: 'ar' | 'en';
  onAddHistoryItem?: (item: any, blob?: Blob) => void;
}

export const TextFormatter: React.FC<TextFormatterProps> = ({ lang, onAddHistoryItem }) => {
  const isAr = lang === 'ar';

  const [text, setText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Statistics
  const [stats, setStats] = useState({
    chars: 0,
    charsNoSpaces: 0,
    words: 0,
    lines: 0,
    paragraphs: 0
  });

  // Calculate statistics on text updates
  useEffect(() => {
    if (!text.trim()) {
      setStats({ chars: 0, charsNoSpaces: 0, words: 0, lines: 0, paragraphs: 0 });
      return;
    }

    const chars = text.length;
    const charsNoSpaces = text.replace(/\s/g, '').length;
    
    // Words count splits non-empty sequences
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    
    // Lines count handles both win/unix breaks
    const lines = text.split(/\r?\n/).length;
    
    // Paragraphs split double carriage breaks
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;

    setStats({ chars, charsNoSpaces, words, lines, paragraphs });
  }, [text]);

  const triggerCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 1. Cleaning tools
  const removeExtraSpaces = () => {
    // Replace multiple spaces inside with a single space, trim margins
    const cleaned = text.split('\n').map(line => line.replace(/\s+/g, ' ').trim()).join('\n');
    setText(cleaned);
    logHistoryAction(isAr ? 'إزالة الفراغات الزائدة' : 'Remove duplicate spaces');
  };

  const removeEmptyLines = () => {
    const cleaned = text.split(/\r?\n/).filter(line => line.trim().length > 0).join('\n');
    setText(cleaned);
    logHistoryAction(isAr ? 'تنظيف الأسطر الفارغة' : 'Purge blank lines');
  };

  const removeIndentations = () => {
    const cleaned = text.split(/\r?\n/).map(line => line.trimStart()).join('\n');
    setText(cleaned);
    logHistoryAction(isAr ? 'إزالة المسافات البادئة' : 'Strip leading indentations');
  };

  // 2. Case transformations
  const handleCase = (type: 'upper' | 'lower' | 'title' | 'sentence') => {
    if (!text) return;
    
    let processed = '';
    if (type === 'upper') {
      processed = text.toUpperCase();
    } else if (type === 'lower') {
      processed = text.toLowerCase();
    } else if (type === 'title') {
      processed = text.replace(/\b\w/g, c => c.toUpperCase());
    } else if (type === 'sentence') {
      processed = text.split(/([.!?]\s*)/).map((segment, idx, arr) => {
        // Only capitalize starting segment words following punctuation
        if (idx % 2 === 0 && segment.length > 0) {
          return segment.charAt(0).toUpperCase() + segment.slice(1);
        }
        return segment;
      }).join('');
    }

    setText(processed);
    logHistoryAction(isAr ? `تغيير حالة الأحرف إلى ${type}` : `Change letter casing to ${type}`);
  };

  // 3. Line operations
  const addLineNumbers = () => {
    const paddedLines = text.split(/\r?\n/).map((line, idx) => {
      const num = String(idx + 1).padStart(3, '0');
      return `${num} | ${line}`;
    }).join('\n');
    setText(paddedLines);
    logHistoryAction(isAr ? 'إدراج ترقيم للسطور' : 'Inject line numbers');
  };

  const removeLineNumbers = () => {
    const cleaned = text.split(/\r?\n/).map(line => {
      // Regular expr matches starting digits like "001 | Content" or "1. Content"
      return line.replace(/^\d+[\s|.]+\s*/, '');
    }).join('\n');
    setText(cleaned);
    logHistoryAction(isAr ? 'تجريد ترقيم السطور' : 'Strip line numbers');
  };

  const removeDuplicates = () => {
    const array = text.split(/\r?\n/);
    const unique = Array.from(new Set(array));
    setText(unique.join('\n'));
    logHistoryAction(isAr ? 'إزالة الأسطر المكررة' : 'Deduplicate lines');
  };

  const sortAlphabetically = () => {
    const array = text.split(/\r?\n/);
    array.sort((a, b) => a.localeCompare(b, isAr ? 'ar' : 'en'));
    setText(array.join('\n'));
    logHistoryAction(isAr ? 'ترتيب النص أبجدياً' : 'Sort lines alphabetically');
  };

  const reverseOrder = () => {
    const array = text.split(/\r?\n/);
    array.reverse();
    setText(array.join('\n'));
    logHistoryAction(isAr ? 'عكس ترتيب السطور' : 'Reverse lines list order');
  };

  const logHistoryAction = (actionLabel: string) => {
    if (onAddHistoryItem && text.trim()) {
      const logBlob = new Blob([text], { type: 'text/plain' });
      onAddHistoryItem(
        {
          action: actionLabel,
          fileName: `formatted_${Date.now()}.txt`,
          originalSize: text.length,
          processedSize: text.length,
          type: 'text'
        },
        logBlob
      );
    }
  };

  return (
    <div className="space-y-6 text-right" style={{ direction: isAr ? 'rtl' : 'ltr' }}>
      {/* Title block */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-purple-100 dark:border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-2xl">
            <AlignLeft className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {isAr ? '✍️ منسق ومصحح النصوص الذكي' : '✍️ Advanced Text Formatter & Editor'}
            </h2>
            <p className="text-xs text-slate-405 mt-1">
              {isAr 
                ? 'نظّف نصوصك، رتب السطور أبجدياً، تخلّص من السطور الفارغة والمكررة، وحوّل الأنماط بمثالية وبأداء فوري متميز.'
                : 'Sanitize trailing whitespace, remove blank duplicate entries, inject line margins, sort rows, and inspect analytics.'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Counter Bar Layout */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: isAr ? 'الكلمات' : 'Words', val: stats.words },
          { label: isAr ? 'الحروف كلياً' : 'Chars Total', val: stats.chars },
          { label: isAr ? 'الحروف دون فراغ' : 'Chars (No spaces)', val: stats.charsNoSpaces },
          { label: isAr ? 'الأسطر' : 'Lines', val: stats.lines },
          { label: isAr ? 'الفقرات' : 'Paragraphs', val: stats.paragraphs },
        ].map((item, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-750 text-center shadow-xs">
            <span className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1">{item.label}</span>
            <span className="text-lg font-black text-slate-800 dark:text-white font-mono">{item.val}</span>
          </div>
        ))}
      </div>

      {/* Workspace split columns layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Text Input Area Container - span 8 */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-750 space-y-4">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-xs font-black text-slate-800 dark:text-white inline-flex items-center gap-1.55">
              <FileText className="w-4 h-4 text-purple-600" />
              <span>{isAr ? 'مساحة العمل وصندوق الكتابة' : 'Text Sandbox Workspace'}</span>
            </h3>

            <div className="flex items-center gap-2">
              <button
                onClick={triggerCopy}
                disabled={!text}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-950 text-[10px] font-bold text-slate-650 dark:text-slate-300 border border-slate-205 dark:border-slate-800 rounded-xl cursor-pointer inline-flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ النص' : 'Copy Text')}</span>
              </button>

              <button
                onClick={() => setText('')}
                disabled={!text}
                className="px-3 py-1.5 text-[10px] font-bold text-red-500 border border-red-150 rounded-xl cursor-pointer inline-flex items-center gap-1.5 transition-all disabled:opacity-50 hover:bg-red-50/50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isAr ? 'تفريغ' : 'Clear'}</span>
              </button>
            </div>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-[380px] p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-mono focus:ring-2 focus:ring-purple-600/30 text-right leading-relaxed"
            placeholder={isAr ? 'أدخل أو انسخ النص المطلوب تعديله وتنسيقه هنا...' : 'Input or paste your documents here to format and adjust...'}
            style={{ direction: isAr ? 'rtl' : 'ltr' }}
          />
        </div>

        {/* Toolbar Configurations side column - span 4 */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-750 space-y-6">
          
          {/* Cleaning tools section */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 pb-2 border-b border-slate-100 dark:border-slate-750">
              {isAr ? '🧼 أدوات التنظيف والمسافات' : '🧼 Sanitize & Clean Whitespace'}
            </h4>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={removeExtraSpaces}
                className="w-full py-2 px-3 text-right text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-155 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-350 cursor-pointer flex items-center justify-between"
              >
                <span>{isAr ? 'إزالة الفراغات الزائدة' : 'Deduplicate Inner Empty Spaces'}</span>
                <Space className="w-3.5 h-3.5 text-purple-600" />
              </button>
              <button
                onClick={removeEmptyLines}
                className="w-full py-2 px-3 text-right text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-155 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-350 cursor-pointer flex items-center justify-between"
              >
                <span>{isAr ? 'التخلص من الأسطر الفارغة' : 'Purge All Empty Lines'}</span>
                <Baseline className="w-3.5 h-3.5 text-purple-600" />
              </button>
              <button
                onClick={removeIndentations}
                className="w-full py-2 px-3 text-right text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-155 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-350 cursor-pointer flex items-center justify-between"
              >
                <span>{isAr ? 'مسح المسافات البادئة' : 'Remove Front Indentations'}</span>
                <Space className="w-3.5 h-3.5 text-purple-600" />
              </button>
            </div>
          </div>

          {/* Letter casing section */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 pb-2 border-b border-slate-100 dark:border-slate-750">
              {isAr ? '🔤 حالة وتنسيق الحروف (إنجليزي)' : '🔤 Letter Casing Translations'}
            </h4>
            <div className="grid grid-cols-2 gap-2 text-center font-bold">
              <button
                onClick={() => handleCase('upper')}
                className="py-2 px-3.5 border border-slate-155 dark:border-slate-800 rounded-xl text-xs hover:bg-purple-600 hover:text-white transition-all cursor-pointer text-slate-700 dark:text-slate-300"
              >
                UPPERCASE
              </button>
              <button
                onClick={() => handleCase('lower')}
                className="py-2 px-3.5 border border-slate-155 dark:border-slate-800 rounded-xl text-xs hover:bg-purple-600 hover:text-white transition-all cursor-pointer text-slate-700 dark:text-slate-300"
              >
                lowercase
              </button>
              <button
                onClick={() => handleCase('title')}
                className="py-2 px-3.5 border border-slate-155 dark:border-slate-800 rounded-xl text-xs hover:bg-purple-600 hover:text-white transition-all cursor-pointer text-slate-700 dark:text-slate-300"
              >
                Title Case
              </button>
              <button
                onClick={() => handleCase('sentence')}
                className="py-2 px-3.5 border border-slate-155 dark:border-slate-800 rounded-xl text-xs hover:bg-purple-600 hover:text-white transition-all cursor-pointer text-slate-700 dark:text-slate-300"
              >
                Sentence Case
              </button>
            </div>
          </div>

          {/* Line operations section */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 pb-2 border-b border-slate-100 dark:border-slate-750">
              {isAr ? '📋 أدوات وترتيب السطور' : '📋 Manage & Sequence Lines'}
            </h4>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={addLineNumbers}
                className="w-full py-2 px-3 text-right text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-155 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-350 cursor-pointer flex items-center justify-between"
              >
                <span>{isAr ? 'إضافة أرقام السطور (001)' : 'Add Line Margins/Numbers (001)'}</span>
                <ListOrdered className="w-3.5 h-3.5 text-purple-600" />
              </button>
              <button
                onClick={removeLineNumbers}
                className="w-full py-2 px-3 text-right text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-155 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-350 cursor-pointer flex items-center justify-between"
              >
                <span>{isAr ? 'حذف أرقام السطور' : 'Strip Embedded Line Numbers'}</span>
                <ListOrdered className="w-3.5 h-3.5 text-purple-600" />
              </button>
              <button
                onClick={removeDuplicates}
                className="w-full py-2 px-3 text-right text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-155 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-350 cursor-pointer flex items-center justify-between"
              >
                <span>{isAr ? 'إزالة السطور المكررة' : 'De-Duplicate Rows'}</span>
                <RefreshCw className="w-3.5 h-3.5 text-purple-600" />
              </button>
              <button
                onClick={sortAlphabetically}
                className="w-full py-2 px-3 text-right text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-155 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-350 cursor-pointer flex items-center justify-between"
              >
                <span>{isAr ? 'ترتيب أبجدي تصاعدي' : 'Sort Alphabetically A-Z'}</span>
                <ArrowUpDown className="w-3.5 h-3.5 text-purple-600" />
              </button>
              <button
                onClick={reverseOrder}
                className="w-full py-2 px-3 text-right text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-155 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-350 cursor-pointer flex items-center justify-between"
              >
                <span>{isAr ? 'عكس ترتيب السطور الكلي' : 'Reverse Entire Lines Sequence'}</span>
                <ArrowUpDown className="w-3.5 h-3.5 text-purple-600" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { 
  Braces, 
  Trash2, 
  Copy, 
  Download, 
  Check, 
  Search, 
  Wand2, 
  ChevronRight, 
  ChevronDown, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';

interface JSONFormatterProps {
  lang: 'ar' | 'en';
  onAddHistoryItem?: (item: any, blob?: Blob) => void;
}

export const JSONFormatter: React.FC<JSONFormatterProps> = ({ lang, onAddHistoryItem }) => {
  const isAr = lang === 'ar';
  
  const [rawJson, setRawJson] = useState<string>(
    '{\n  "appName": "FileForge Pro",\n  "version": 1.0,\n  "supportedTypes": ["csv", "xlsx", "pdf", "json"],\n  "features": {\n    "locale": "ar",\n    "offlineEnabled": true,\n    "systemModules": [\n      {"id": 1, "name": "Converter"},\n      {"id": 2, "name": "Extractor"}\n    ]\n  }\n}'
  );
  const [formattedJson, setFormattedJson] = useState<string>('');
  const [parsedObject, setParsedObject] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['root']));
  const [errorState, setErrorState] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string>('');

  // Auto parsing loop
  useEffect(() => {
    if (!rawJson.trim()) {
      setFormattedJson('');
      setParsedObject(null);
      setErrorState(null);
      return;
    }

    try {
      const parsed = JSON.parse(rawJson);
      setParsedObject(parsed);
      setFormattedJson(JSON.stringify(parsed, null, 2));
      setErrorState(null);
    } catch (e: any) {
      setErrorState(e.message);
      setParsedObject(null);
    }
  }, [rawJson]);

  const showLocalToast = (msg: string) => {
    setCopiedText(msg);
    setTimeout(() => setCopiedText(''), 3500);
  };

  const copyPath = (path: string) => {
    navigator.clipboard.writeText(path);
    showLocalToast(isAr ? `تم نسخ مسار المفتاح: ${path}` : `Copied query path: ${path}`);
  };

  const copyResult = () => {
    navigator.clipboard.writeText(formattedJson);
    showLocalToast(isAr ? 'تم نسخ الـ JSON المنسق!' : 'Formatted JSON copied!');
  };

  const downloadJson = () => {
    if (!formattedJson) return;
    const blob = new Blob([formattedJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `formatted_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);

    if (onAddHistoryItem) {
      onAddHistoryItem({
        action: isAr ? 'تنسيق وترميم ملف JSON' : 'JSON Standard Format',
        fileName: `formatted_${Date.now()}.json`,
        originalSize: rawJson.length,
        processedSize: blob.size,
        type: 'text'
      }, blob);
    }
  };

  // Repair malformed JSON structure
  const handleRepairJson = () => {
    let repaired = rawJson.trim();
    if (!repaired) return;

    try {
      // 1. Convert curly typographic quotes to straight double quotes
      repaired = repaired
        .replace(/[\u201c\u201d]/g, '"')
        .replace(/[\u2018\u2019]/g, "'");

      // 2. Wrap unquoted keys with double quotes
      // Matches word character-based keys before colons (e.g. { appName: 1 }) -> { "appName": 1 }
      repaired = repaired.replace(/([{,]\s*)([a-zA-Z0-9_\-]+)\s*:/g, '$1"$2":');

      // 3. Convert single quoted quotes around values to double quotes
      repaired = repaired.replace(/'([^']*)'/g, '"$1"');

      // 4. Remove trailing commas before matching brace bounds
      repaired = repaired.replace(/,([\s\r\n]*[}\]])/g, '$1');

      // 5. Try resolving simple missing matching terminal braces
      const openedBraces = (repaired.match(/{/g) || []).length;
      const closedBraces = (repaired.match(/}/g) || []).length;
      if (openedBraces > closedBraces) {
        repaired += '}'.repeat(openedBraces - closedBraces);
      }

      const openedBrackets = (repaired.match(/\[/g) || []).length;
      const closedBrackets = (repaired.match(/\]/g) || []).length;
      if (openedBrackets > closedBrackets) {
        repaired += ']'.repeat(openedBrackets - closedBrackets);
      }

      // Check if repair works
      JSON.parse(repaired);
      setRawJson(repaired);
      showLocalToast(isAr ? 'تم ترميم وتصليح بناء الـ JSON بنجاح!' : 'JSON syntactic repair succeeded!');
    } catch (err: any) {
      showLocalToast(isAr ? 'لم نتمكن من إصلاح التلف بالكامل تلقائياً.' : 'Unable to fully fix this. Please check manually.');
    }
  };

  const togglePath = (path: string) => {
    const nextset = new Set(expandedPaths);
    if (nextset.has(path)) {
      nextset.delete(path);
    } else {
      nextset.add(path);
    }
    setExpandedPaths(nextset);
  };

  const expandAll = (obj: any, path = 'root') => {
    const paths = new Set<string>();
    const recurse = (val: any, curPath: string) => {
      paths.add(curPath);
      if (val && typeof val === 'object') {
        Object.entries(val).forEach(([k, v]) => {
          recurse(v, `${curPath}.${k}`);
        });
      }
    };
    recurse(obj, path);
    setExpandedPaths(paths);
  };

  const collapseAll = () => {
    setExpandedPaths(new Set(['root']));
  };

  // Node tree generation
  const renderTreeNode = (val: any, keyName: string | null, parentPath: string): React.ReactNode => {
    const currentPath = keyName !== null ? `${parentPath}.${keyName}` : parentPath;
    const isExpanded = expandedPaths.has(currentPath);
    const displayKey = keyName !== null ? `"${keyName}": ` : '';

    if (val === null) {
      return (
        <div key={currentPath} className="pl-6 py-0.5 select-all flex items-center gap-1 leading-normal font-mono text-xs">
          {keyName !== null && <span className="text-purple-600 dark:text-purple-300">{displayKey}</span>}
          <span className="text-slate-400 font-bold">null</span>
        </div>
      );
    }

    if (typeof val === 'boolean') {
      return (
        <div key={currentPath} className="pl-6 py-0.5 select-all flex items-center gap-1 leading-normal font-mono text-xs">
          {keyName !== null && <span className="text-purple-600 dark:text-purple-300">{displayKey}</span>}
          <span className="text-amber-600 dark:text-amber-400 font-bold">{val ? 'true' : 'false'}</span>
        </div>
      );
    }

    if (typeof val === 'number') {
      return (
        <div key={currentPath} className="pl-6 py-0.5 select-all flex items-center gap-1 leading-normal font-mono text-xs">
          {keyName !== null && <span className="text-purple-600 dark:text-purple-300">{displayKey}</span>}
          <span className="text-emerald-600 dark:text-emerald-400 font-mono font-medium">{val}</span>
        </div>
      );
    }

    if (typeof val === 'string') {
      const cleanPathVal = currentPath.replace('root.', '');
      const queryMatch = searchQuery && (
        val.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (keyName && keyName.toLowerCase().includes(searchQuery.toLowerCase()))
      );

      return (
        <div 
          key={currentPath} 
          onClick={() => copyPath(cleanPathVal)}
          title={isAr ? 'انقر لنسخ مسار المفتاح' : 'Click to copy JSON path'}
          className={`pl-6 py-0.5 cursor-pointer hover:bg-purple-50/50 dark:hover:bg-purple-950/20 rounded font-mono text-xs flex items-center justify-between group leading-normal transition-all ${queryMatch ? 'bg-amber-100 dark:bg-amber-950 px-1 py-0.5 rounded' : ''}`}
        >
          <div className="select-all">
            {keyName !== null && <span className="text-purple-600 dark:text-purple-300">{displayKey}</span>}
            <span className="text-orange-650 dark:text-amber-500 font-medium">"{val}"</span>
          </div>
          <span className="opacity-0 group-hover:opacity-100 text-[10px] text-purple-400 flex items-center gap-1 self-center">
            <Copy className="w-3 h-3" />
            <span className="font-sans">{isAr ? 'نسخ المسار' : 'Copy path'}</span>
          </span>
        </div>
      );
    }

    // Array logic
    if (Array.isArray(val)) {
      const cleanPathVal = currentPath.replace('root.', '');
      const isEmpty = val.length === 0;

      return (
        <div key={currentPath} className="pl-4 py-0.5 leading-normal">
          <div 
            onClick={() => togglePath(currentPath)}
            className="flex items-center gap-1 cursor-pointer font-mono text-xs text-slate-800 dark:text-slate-200 select-none hover:text-purple-500 py-0.5"
          >
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
            {keyName !== null && <span className="text-purple-600 dark:text-purple-300">{displayKey}</span>}
            <span className="font-bold text-slate-500">[</span>
            {!isExpanded && <span className="text-slate-400 text-[10px]"> ... {val.length} items </span>}
            <span className="font-bold text-slate-500">]</span>
            <span 
              onClick={(e) => { e.stopPropagation(); copyPath(cleanPathVal); }}
              className="ml-2 text-[10px] opacity-0 hover:opacity-100 text-purple-400 cursor-pointer flex items-center gap-0.5"
            >
              <Copy className="w-2.5 h-2.5" />
            </span>
          </div>

          {isExpanded && !isEmpty && (
            <div className="border-l border-slate-150-inset pl-3 ml-2 space-y-0.5">
              {val.map((item, index) => renderTreeNode(item, String(index), currentPath))}
            </div>
          )}
        </div>
      );
    }

    // Object tree
    if (typeof val === 'object') {
      const cleanPathVal = currentPath.replace('root.', '');
      const entries = Object.entries(val);
      const isEmpty = entries.length === 0;

      return (
        <div key={currentPath} className="pl-4 py-0.5 leading-normal">
          <div 
            onClick={() => togglePath(currentPath)}
            className="flex items-center gap-1 cursor-pointer font-mono text-xs text-slate-800 dark:text-slate-200 select-none hover:text-purple-500 py-0.5"
          >
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
            {keyName !== null && <span className="text-purple-600 dark:text-purple-300">{displayKey}</span>}
            <span className="font-bold text-slate-500">{'{'}</span>
            {!isExpanded && <span className="text-slate-400 text-[10px]"> ... {entries.length} properties </span>}
            <span className="font-bold text-slate-500">{'}'}</span>
            <span 
              onClick={(e) => { e.stopPropagation(); copyPath(cleanPathVal); }}
              className="ml-2 text-[10px] opacity-0 hover:opacity-100 text-purple-400 cursor-pointer flex items-center gap-0.5"
            >
              <Copy className="w-2.5 h-2.5" />
            </span>
          </div>

          {isExpanded && !isEmpty && (
            <div className="border-l border-slate-200 dark:border-slate-800 pl-3 ml-2 space-y-0.5">
              {entries.map(([k, v]) => renderTreeNode(v, k, currentPath))}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div id="json-formatter-container" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-5 sm:p-6 shadow-sm space-y-6 text-slate-700 dark:text-slate-200">
      
      {/* Copied dialog notification */}
      {copiedText && (
        <div className="fixed bottom-6 right-6 bg-slate-900 dark:bg-slate-800 text-white py-2.5 px-5 rounded-2xl shadow-lg border border-slate-700 text-xs font-bold animate-slideUp z-50 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{copiedText}</span>
        </div>
      )}

      {/* Header block */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-50 dark:border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-purple-550/10 p-3 rounded-2xl text-purple-600 dark:bg-purple-550/20 dark:text-purple-300">
            <Braces className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isAr ? 'منسق ومحرر JSON التفاعلي' : 'Interactive JSON Formatter & Parser'}
            </h2>
            <p className="text-xs text-slate-400">
              {isAr ? 'تصحيح الـ JSON غير المنسق أو التالف تلقائياً، تصفّح الشجرة البرمجية للمفاتيح، والنسخ المباشر للمسارات' : 'Auto format structural JSON, repair broken copy-pasts, search nodes, and export results file'}
            </p>
          </div>
        </div>
      </div>

      {/* Split visual work areas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Input raw block */}
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <Braces className="w-4 h-4 text-purple-500" />
              {isAr ? 'البيانات الخام والمدخلات' : 'Raw Input / Code Block'}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleRepairJson}
                className="px-2.5 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 text-[11px] font-bold cursor-pointer flex items-center gap-1 border-0"
                title={isAr ? 'إصلاح التنسيق والتلف التلقائي' : 'Repair syntax errors'}
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>{isAr ? 'ترميم الفراغات وبناء الجملة' : 'Fix & Repair Syntax'}</span>
              </button>
              <button
                onClick={() => setRawJson('')}
                className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-650 rounded cursor-pointer border-0"
                title={isAr ? 'تفريغ المدخلات' : 'Clear all'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <textarea
            value={rawJson}
            onChange={(e) => setRawJson(e.target.value)}
            placeholder={isAr ? 'لصق أو كتابة كود JSON هنا لتنسيقه...' : 'Paste raw or mangled JSON here...'}
            className="w-full h-[360px] bg-slate-50 dark:bg-slate-950 font-mono text-xs p-4 rounded-2xl border border-slate-200 dark:border-slate-800 focus:ring-1 focus:ring-purple-400 focus:outline-none leading-relaxed text-slate-800 dark:text-purple-30"
          />

          {errorState ? (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 p-3 rounded-xl flex items-start gap-2 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="font-mono">
                <strong>{isAr ? 'خطأ في بناء الجملة (Syntax Error):' : 'Syntax Error:'}</strong> {errorState}
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 p-3 rounded-xl flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
              <Check className="w-4 h-4" />
              <span>{isAr ? 'بناء الجملة سليم (Valid JSON Structure)' : 'Syntactically valid JSON code'}</span>
            </div>
          )}
        </div>

        {/* Tree visualizer / output parsed results */}
        <div className="flex flex-col space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-500" />
              {isAr ? 'مستعرض الشجرة التفاعلي' : 'Interactive Syntax Tree Viewer'}
            </span>
            {parsedObject && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => expandAll(parsedObject)}
                  className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-650 dark:text-slate-300 text-[10px] font-bold border-0 cursor-pointer"
                >
                  {isAr ? 'توسيع الكل' : 'Expand All'}
                </button>
                <button
                  onClick={collapseAll}
                  className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-650 dark:text-slate-300 text-[10px] font-bold border-0 cursor-pointer"
                >
                  {isAr ? 'طي الكل' : 'Collapse All'}
                </button>
              </div>
            )}
          </div>

          <div className="border border-slate-250-inset dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950 p-4 min-h-[360px] h-[360px] overflow-y-auto space-y-1">
            {parsedObject ? (
              <div className="text-xs leading-normal select-text">
                {/* Search query field on tree */}
                <div className="mb-3 relative max-w-xs ml-auto sticky top-0 bg-slate-50 dark:bg-slate-950 py-1 border-b border-slate-200 dark:border-slate-800 z-10">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute top-2.5 left-2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isAr ? 'تصفية وبحث داخل العقد...' : 'Search structure keys...'}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-1 px-3 pl-8 text-[11px] focus:outline-none"
                  />
                </div>

                {/* Render root */}
                {renderTreeNode(parsedObject, null, 'root')}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400">
                <Braces className="w-10 h-10 text-slate-350 dark:text-slate-700 mb-2 animate-bounce" />
                <span className="text-xs">
                  {isAr 
                    ? 'اكتب JSON صالح في الجانب الأيسر لعرض الشجرة التفاعلية' 
                    : 'Awaiting clean JSON code on the left to spawn the interactive tree view'}
                </span>
              </div>
            )}
          </div>

          {/* Formatter download strip toolbar */}
          {parsedObject && (
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-[10px] text-slate-400">
                {isAr ? 'انقر على أي مستند لنسخ مساره البرمجي' : 'Click any value query path to bind it immediately'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyResult}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-650 dark:text-white cursor-pointer font-bold flex items-center gap-1 border-0 transition"
                  title={isAr ? 'نسخ الكود كاملاً' : 'Copy standard JSON'}
                >
                  <Copy className="w-3.5 h-3.5 text-purple-500" />
                  <span>{isAr ? 'نسخ الجملة' : 'Copy'}</span>
                </button>
                <button
                  onClick={downloadJson}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-755 text-white cursor-pointer font-bold flex items-center gap-1 border-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تحميل ملف JSON' : 'Export File'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

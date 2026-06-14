'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Mail, 
  Phone, 
  Link as LinkIcon, 
  Hash, 
  AtSign, 
  Calendar, 
  Download, 
  Copy, 
  Trash2, 
  Cpu, 
  Check, 
  FileJson,
  LayoutGrid
} from 'lucide-react';

interface DataExtractorProps {
  lang: 'ar' | 'en';
  onAddHistoryItem?: (item: any, blob?: Blob) => void;
}

interface ExtractedData {
  emails: string[];
  phones: string[];
  urls: string[];
  hashtags: string[];
  mentions: string[];
  dates: string[];
}

export const DataExtractor: React.FC<DataExtractorProps> = ({ lang, onAddHistoryItem }) => {
  const isAr = lang === 'ar';
  
  const [textInput, setTextInput] = useState<string>(
    isAr 
      ? "مرحباً بجميع أعضاء فريق @FileForge! نود الإشارة إلى مواعيد تسليم التقارير الجديدة بتاريخ 2026/06/15 و 14-06-2026. \nلمزيد من الاستفسار تواصلوا مع الدعم والمالية عبر البريد: finance@forge.pro و support@fileforge.pro أو الاتصال الهاتفي على أرقامنا: +966501234567 أو 01001234567.\nتابعوا هاشتاجات العمل المشترك لتبقوا مطلعين: #مطورين_العرب و #عمل_مستمر.\nتفضلوا بزيارة موقعنا للمخطط الكامل: https://www.fileforge.pro/roadmap أو https://docs.forge.pro."
      : "Hello @FileForge team! Please send all documents by 2026-06-15 or 14/06/2026.\nFor urgent questions, mail our representatives at finance@forge.pro and hello@forge.org, or dial global metrics at +1-555-019-2831 or +966500445566.\nCheck updates on #FileForge2026 and #OnDeviceAI hashtags!\nFull spec manifests hosted on: https://www.fileforge.pro/manifest or https://docs.forge.org/sdk."
  );

  const [copiedText, setCopiedText] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<keyof ExtractedData>('emails');

  const showLocalToast = (msg: string) => {
    setCopiedText(msg);
    setTimeout(() => setCopiedText(''), 3000);
  };

  // Real-time Extraction Engines
  const extractData = (): ExtractedData => {
    const text = textInput || '';

    // Robust Regex
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    // International & local phone templates (+ sign, dashes, spaces)
    const phoneRegex = /(?:\+?\d{1,3}[-. ]?)?\(?\d{2,3}\)?[-. ]?\d{3,4}[-. ]?\d{3,4}/g;
    const urlRegex = /https?:\/\/[a-zA-Z0-9-\._~:\/\?#\[\]@!\$&'\(\)\*\+,;=%]+/g;
    // Multi-language Arabic & English hashtags
    const hashtagsRegex = /#[\w\u0600-\u06FF]+/g;
    // Mention tags
    const mentionsRegex = /@[\w\u0600-\u06FF]+/g;
    // ISO/US/Generic dates format patterns
    const datesRegex = /\b\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\b|\b\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}\b/g;

    const findUnique = (regex: RegExp): string[] => {
      const matches = text.match(regex) || [];
      return Array.from(new Set(matches.map(m => m.trim())));
    };

    // Filter potential phone false-positives (mostly numbers inside dates)
    const rawPhones = findUnique(phoneRegex);
    const filteredPhones = rawPhones.filter(p => {
      // Must contain at least 7 digits to be valid
      const digits = p.replace(/\D/g, '');
      return digits.length >= 7 && digits.length <= 15 && !p.includes('/');
    });

    return {
      emails: findUnique(emailRegex),
      phones: filteredPhones,
      urls: findUnique(urlRegex),
      hashtags: findUnique(hashtagsRegex),
      mentions: findUnique(mentionsRegex),
      dates: findUnique(datesRegex)
    };
  };

  const results = extractData();
  const activeList = results[selectedTab];

  const totalCount = 
    results.emails.length + 
    results.phones.length + 
    results.urls.length + 
    results.hashtags.length + 
    results.mentions.length + 
    results.dates.length;

  const copyItem = (item: string) => {
    navigator.clipboard.writeText(item);
    showLocalToast(isAr ? 'تم نسخ اللفظ بنجاح!' : 'Copied successfully!');
  };

  const copyCurrentList = () => {
    if (activeList.length === 0) return;
    navigator.clipboard.writeText(activeList.join('\n'));
    showLocalToast(isAr ? 'تم نسخ كافة عناصر المجموعة الحالية!' : 'All items in current block copied!');
  };

  const exportCurrentList = () => {
    if (activeList.length === 0) return;
    const blob = new Blob([activeList.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTab}_extracted_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const exportAllAsJSON = () => {
    const jsonStr = JSON.stringify(results, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extracted_data_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showLocalToast(isAr ? 'تم تصدير ملف البيانات الإجمالي الحاضر!' : 'All parsed modules exported as JSON!');

    if (onAddHistoryItem) {
      onAddHistoryItem({
        action: isAr ? 'استخراج بيانات نصية تفصيلية' : 'Unstructured Data Extractor Engine',
        fileName: `extracted_data_${Date.now()}.json`,
        originalSize: textInput.length,
        processedSize: blob.size,
        type: 'text'
      }, blob);
    }
  };

  // Tab definitions
  const TABS = [
    { id: 'emails', icon: Mail, labelAr: 'الإيميلات', labelEn: 'Emails', count: results.emails.length, color: 'text-violet-500' },
    { id: 'phones', icon: Phone, labelAr: 'الهواتف', labelEn: 'Phones', count: results.phones.length, color: 'text-emerald-500' },
    { id: 'urls', icon: LinkIcon, labelAr: 'الروابط', labelEn: 'URLs', count: results.urls.length, color: 'text-blue-500' },
    { id: 'hashtags', icon: Hash, labelAr: 'الهاشتاج', labelEn: 'Hashtags', count: results.hashtags.length, color: 'text-rose-500' },
    { id: 'mentions', icon: AtSign, labelAr: 'الإشارات', labelEn: 'Mentions', count: results.mentions.length, color: 'text-amber-500' },
    { id: 'dates', icon: Calendar, labelAr: 'التواريخ', labelEn: 'Dates', count: results.dates.length, color: 'text-indigo-500' }
  ];

  return (
    <div id="data-extractor-container" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-5 sm:p-6 shadow-sm space-y-6 text-slate-700 dark:text-slate-200">
      
      {/* Toast Alert pop up */}
      {copiedText && (
        <div className="fixed bottom-6 right-6 bg-slate-900 dark:bg-slate-800 text-white py-2.5 px-5 rounded-2xl shadow-lg border border-slate-700 text-xs font-bold animate-slideUp z-50 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{copiedText}</span>
        </div>
      )}

      {/* Main Title block */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-50 dark:border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500/10 p-3 rounded-2xl text-indigo-500 dark:bg-indigo-500/20">
            <Cpu className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isAr ? 'مستخرج النصوص والبيانات الفوري' : 'Automated Deep Data Token Extractor'}
            </h2>
            <p className="text-xs text-slate-400">
              {isAr ? 'الصق الكتل النصية الكبيرة وسيقوم المعالج بفحص وعزل الإيميلات والهواتف والروابط والتواريخ ببراعة' : 'Paste large blocks of unorganized text to instantly capture, clean, and catalog contact keys'}
            </p>
          </div>
        </div>

        {/* Export All triggers */}
        <button
          onClick={exportAllAsJSON}
          disabled={totalCount === 0}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5 border-0 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <FileJson className="w-4 h-4" />
          <span>{isAr ? 'تصدير الكل كـ JSON' : 'Export All as JSON'}</span>
        </button>
      </div>

      {/* Inputs / Output layout blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Drag paste Text Area */}
        <div className="lg:col-span-6 flex flex-col space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-500" />
              {isAr ? 'النص والمستند المراد فحصه' : 'Paste Raw / Log Buffer'}
            </span>
            <button
              onClick={() => setTextInput('')}
              className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded cursor-pointer border-0"
              title={isAr ? 'تفريغ المدخلات' : 'Clear raw'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={isAr ? 'الصق كود السجل، مراسلات البريد، أو أية نصوص عشوائية هنا للاستخراج الفوري...' : 'Paste unstructured text, config files, email headers, or logs here...'}
            className="w-full h-[320px] bg-slate-50 dark:bg-slate-950 font-sans text-xs p-4 leading-relaxed text-slate-800 dark:text-slate-300 rounded-3xl border border-slate-200 dark:border-slate-850 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />

          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold bg-slate-50 dark:bg-slate-800/20 py-2.5 px-4 rounded-xl">
            <LayoutGrid className="w-4 h-4 text-indigo-500 animate-pulse" />
            <span>
              {isAr 
                ? `اكتمل المعالجة المحلية • تم رصد ${totalCount} عنصراً مؤهلاً في النص` 
                : `Local indexing complete • Isolated ${totalCount} valid data matches`}
            </span>
          </div>
        </div>

        {/* Right Side: Tabular Categorizations */}
        <div className="lg:col-span-6 flex flex-col space-y-3">
          
          {/* Tab buttons rows */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {TABS.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = selectedTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer ${isActive ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-400 shadow-sm' : 'bg-slate-50/50 hover:bg-slate-100/50 border-slate-100 dark:bg-slate-900/40 dark:border-slate-800/80'}`}
                >
                  <TabIcon className={`w-4 h-4 ${tab.color} mb-1`} />
                  <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{isAr ? tab.labelAr : tab.labelEn}</span>
                  <span className="text-[11px] font-mono font-bold mt-0.5 px-1.5 bg-slate-200/50 dark:bg-slate-800 rounded-full">{tab.count}</span>
                </button>
              );
            })}
          </div>

          {/* Results frame */}
          <div className="border border-slate-100 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 h-[255px] overflow-y-auto space-y-1.5 shadow-inner">
            {activeList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4 text-slate-400">
                <FileText className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-1.5" />
                <span className="text-xs">
                  {isAr 
                    ? `لا توجد نتائج في قسم "${TABS.find(t => t.id === selectedTab)?.labelAr}"` 
                    : `No records isolated for "${TABS.find(t => t.id === selectedTab)?.labelEn}" category`}
                </span>
              </div>
            ) : (
              activeList.map((item, idx) => (
                <div 
                  key={idx} 
                  onClick={() => copyItem(item)}
                  title={isAr ? 'انقر للنسخ' : 'Click to copy'}
                  className="group flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-indigo-50/20 border border-slate-150/70 dark:border-slate-800 cursor-pointer transition"
                >
                  <span className="text-xs font-mono select-all text-slate-800 dark:text-slate-200 truncate pr-4">
                    {item}
                  </span>
                  <button className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-500 rounded cursor-pointer border-0 transition-opacity">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Current Category utilities */}
          {activeList.length > 0 && (
            <div className="flex items-center justify-end gap-2 text-xs pt-1">
              <button
                onClick={copyCurrentList}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-white cursor-pointer font-bold flex items-center gap-1 border-0"
              >
                <Copy className="w-4 h-4 text-indigo-500" />
                <span>{isAr ? 'نسخ القائمة' : 'Copy Block'}</span>
              </button>
              <button
                onClick={exportCurrentList}
                className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-650 dark:bg-indigo-950/20 dark:text-indigo-300 dark:hover:bg-indigo-950/45 cursor-pointer font-bold flex items-center gap-1 border-0"
              >
                <Download className="w-4 h-4" />
                <span>{isAr ? 'حفظ المجموعة' : 'Save group'}</span>
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

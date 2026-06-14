'use client';

import React, { useState, useMemo } from 'react';
import { 
  History, 
  Trash2, 
  Download, 
  Search, 
  RotateCcw, 
  Database,
  Grid,
  FileCheck,
  Cpu,
  Bookmark,
  Share2,
  CheckCircle,
  FileAudio,
  FileImage,
  Layers,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { HistoryItem } from '../../../types';

interface HistoryDashboardProps {
  lang: 'ar' | 'en';
  historyList: HistoryItem[];
  onClearHistory: () => void;
  onRemoveHistoryItem: (id: string) => void;
  onReplayItem?: (item: HistoryItem) => void;
}

export const HistoryDashboard: React.FC<HistoryDashboardProps> = ({
  lang,
  historyList,
  onClearHistory,
  onRemoveHistoryItem,
  onReplayItem
}) => {
  const isAr = lang === 'ar';
  
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string>('');

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const getMimeIcon = (type: string) => {
    switch (type) {
      case 'image': return <FileImage className="w-4 h-4 text-purple-500" />;
      case 'pdf': return <Layers className="w-4 h-4 text-indigo-500" />;
      case 'ai': return <Cpu className="w-4 h-4 text-emerald-500 animate-pulse" />;
      case 'video': return <FileAudio className="w-4 h-4 text-rose-500" />;
      default: return <History className="w-4 h-4 text-slate-400" />;
    }
  };

  // Telemetry computation
  const stats = useMemo(() => {
    const totalProcessed = historyList.length;
    
    // Sum size savings
    let totalSavingsBytes = 0;
    const toolCounts: Record<string, number> = {};

    historyList.forEach(item => {
      if (item.originalSize && item.processedSize) {
        const diff = item.originalSize - item.processedSize;
        if (diff > 0) totalSavingsBytes += diff;
      }
      
      const actionName = item.action || 'Unknown Widget';
      toolCounts[actionName] = (toolCounts[actionName] || 0) + 1;
    });

    let popularTool = isAr ? 'لا يوجد' : 'None yet';
    let maxCount = 0;
    Object.entries(toolCounts).forEach(([tool, cnt]) => {
      if (cnt > maxCount) {
        maxCount = cnt;
        popularTool = tool;
      }
    });

    // Formatting savings size beautifully
    const formatSavings = (bytes: number): string => {
      if (bytes <= 0) return '0 KB';
      const k = 1024;
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      const sizes = ['B', 'KB', 'MB', 'GB'];
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return {
      count: totalProcessed,
      savings: formatSavings(totalSavingsBytes),
      popular: popularTool
    };
  }, [historyList, isAr]);

  // Filters logic
  const filteredItems = useMemo(() => {
    return historyList.filter(item => {
      const matchesSearch = item.fileName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (item.action?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      
      if (activeFilter === 'all') return matchesSearch;
      if (activeFilter === 'image' && item.type === 'image') return matchesSearch;
      if (activeFilter === 'pdf' && item.type === 'pdf') return matchesSearch;
      if (activeFilter === 'ai' && item.type === 'ai') return matchesSearch;
      if (activeFilter === 'media' && item.type === 'video') return matchesSearch;
      if (activeFilter === 'other' && !['image', 'pdf', 'ai', 'video'].includes(item.type || '')) return matchesSearch;

      return false;
    }).slice(0, 100); // Max 100 records limit
  }, [historyList, activeFilter, searchTerm]);

  // Export CSV helper
  const handleExportCSV = () => {
    if (historyList.length === 0) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    // headers
    csvContent += "Action/Tool,File Name,Timestamp,Original Size (Bytes),Processed Size (Bytes),Category\r\n";

    historyList.forEach(item => {
      const row = [
        `"${item.action || 'FileForge Operation'}"`,
        `"${item.fileName}"`,
        `"${item.timestamp}"`,
        item.originalSize || 0,
        item.processedSize || 0,
        `"${item.type || 'other'}"`
      ].join(',');
      csvContent += row + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `fileforge_telemetry_history_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast(isAr ? 'تم تصدير سجل المعالجة كـ CSV!' : 'Successfully raw logged values as CSV.');
  };

  return (
    <div id="history-dashboard" className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-6 text-slate-700 dark:text-slate-200">
      
      {/* Toast notifications */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-900 border border-slate-700 text-white py-2.5 px-4 rounded-xl shadow-lg animate-slideUp">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold">{toastMsg}</span>
        </div>
      )}

      {/* Confirmation Overlays */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full border border-slate-105 space-y-4 animate-scaleUp">
            <h3 className="font-bold text-sm text-rose-500 flex items-center gap-2">
              <Trash2 className="w-5 h-5 animate-pulse" />
              <span>{isAr ? 'حذف كافة السجلات؟' : 'Purge All Database Records?'}</span>
            </h3>
            <p className="text-xs text-slate-450 leading-relaxed">
              {isAr 
                ? 'سيتم تصفير لوحة معلومات السجل ومسح الهستغرام بالكامل محلياً. لا يمكن مراجعة العمليات السابقة بعد ذلك.' 
                : 'This clears memory transaction caches completely. Irreversible action.'}
            </p>
            <div className="flex justify-end gap-2 text-xs">
              <button 
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-xl cursor-pointer border-0"
              >
                {isAr ? 'تراجع' : 'Abort'}
              </button>
              <button 
                onClick={() => {
                  onClearHistory();
                  setShowConfirm(false);
                  triggerToast(isAr ? 'تم إخلاء الفهرس!' : 'Deleted cache records.');
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl cursor-pointer border-0"
              >
                {isAr ? 'تصفير السجل' : 'Wipe Database'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header layout */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-50 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-rose-500/10 p-3 rounded-2xl text-rose-500">
            <History className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-slate-900 dark:text-white">
              {isAr ? 'لوحة السجلات والإحصاء المتقدم' : 'Local Operations Logging & Analytics Dashboard'}
            </h2>
            <p className="text-xs text-slate-400">
              {isAr ? 'راقب مؤشرات الاستخدام الحية، واحتفظ بسلسلة البيانات المعالجة الآمنة بمعدل تصفح محلي ١٠٠٪' : 'Review local telemetry registers, calculate device storage optimizations, and re-run widgets.'}
            </p>
          </div>
        </div>

        {historyList.length > 0 && (
          <div className="flex gap-2 text-xs">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-705 dark:text-white font-bold rounded-xl cursor-pointer transition border-0 hover:bg-slate-200"
            >
              {isAr ? 'تصدير كـ CSV' : 'Export Logs as CSV'}
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              className="px-3.5 py-2 bg-rose-600 text-white font-bold rounded-xl cursor-pointer transition border-0 hover:bg-rose-700"
            >
              {isAr ? 'مسح الكل' : 'Wipe All Records'}
            </button>
          </div>
        )}
      </div>

      {/* Quick Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 p-4 rounded-2xl flex items-center gap-3">
          <div className="bg-purple-500/10 p-3 rounded-xl text-purple-500 shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">{isAr ? 'العمليات المكتملة' : 'Telemetry count'}</span>
            <span className="text-sm font-black text-slate-800 dark:text-white mt-1 block">{stats.count}</span>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 p-4 rounded-2xl flex items-center gap-3">
          <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-500 shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">{isAr ? 'إجمالي المساحة الموفرة' : 'Byte Savings'}</span>
            <span className="text-sm font-black text-slate-800 dark:text-white mt-1 block">{stats.savings}</span>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 p-4 rounded-2xl flex items-center gap-3">
          <div className="bg-amber-500/10 p-3 rounded-xl text-amber-500 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">{isAr ? 'الأكثر استخداماً' : 'Popular utility'}</span>
            <span className="text-[11px] font-black text-slate-800 dark:text-white mt-1 block truncate font-sans">{stats.popular}</span>
          </div>
        </div>

      </div>

      {/* Search and Category Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isAr ? 'ابحث في السجلات عن الملف أو الأداة...' : 'Find logged elements by tool title...'}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs focus:ring-1 focus:ring-rose-500"
            />
          </div>

          {/* Filtering buttons */}
          <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-150 dark:border-slate-850 text-[10px] font-bold overflow-x-auto gap-0.5">
            {[
              { id: 'all', label: isAr ? 'الكل' : 'All' },
              { id: 'image', label: isAr ? 'صور' : 'Images' },
              { id: 'pdf', label: isAr ? 'مستندات PDF' : 'PDF' },
              { id: 'ai', label: isAr ? 'ذكاء اصطناعي' : 'AI' },
              { id: 'media', label: isAr ? 'فيديو ووسائط' : 'Video' },
              { id: 'other', label: isAr ? 'أخرى' : 'Others' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`py-1 px-3 rounded-lg cursor-pointer transition border-0 ${activeFilter === tab.id ? 'bg-white dark:bg-slate-850 text-rose-550 dark:text-white shadow-xs font-bold' : 'text-slate-400'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

        </div>

        {/* Logging List */}
        {filteredItems.length > 0 ? (
          <div className="space-y-3.5 max-h-[350px] overflow-y-auto">
            {filteredItems.map((item) => (
              <div 
                key={item.id}
                className="bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-rose-500/20 transition text-xs"
              >
                <div className="flex items-center gap-3 truncate w-full sm:w-auto">
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800 shrink-0">
                    {getMimeIcon(item.type || 'other')}
                  </div>
                  <div className="truncate text-right">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-850 dark:text-white">{item.action || 'FileForge Pro Action'}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({item.timestamp})</span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-450 truncate mt-0.5 max-w-xs">{item.fileName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 shrink-0 self-end sm:self-auto text-[10px] font-bold">
                  {item.originalSize && (
                    <span className="text-slate-400 font-mono">
                      {isAr ? 'الحجم: ' : 'Size: '}
                      {(item.originalSize / 1024 / 1024).toFixed(2)} MB
                    </span>
                  )}

                  <div className="flex items-center gap-1.5">
                    
                    {onReplayItem && (
                      <button
                        onClick={() => onReplayItem(item)}
                        title={isAr ? 'إعادة الإطلاق' : 'Relaunch widget'}
                        className="p-1 px-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-205 rounded border-0 text-slate-500 cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{isAr ? 'إعادة' : 'Rerun'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        onRemoveHistoryItem(item.id);
                        triggerToast(isAr ? 'تمت إزالة السجل' : 'Removed index item.');
                      }}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded border-0 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-slate-100 dark:border-slate-850 rounded-2xl p-8 text-center text-slate-400 text-xs">
            <History className="w-8 h-8 text-slate-350 dark:text-slate-800 mx-auto mb-2" />
            <p className="font-bold">{isAr ? 'لم يعثر على أي عمليات مطابقة للفيلتر!' : 'No logging sequence match criteria.'}</p>
          </div>
        )}
      </div>

    </div>
  );
};

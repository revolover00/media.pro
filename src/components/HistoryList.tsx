import React, { useState } from 'react';
import { 
  Trash2, 
  History, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  Sparkles,
  TrendingDown,
  X,
  Eye,
  ArrowLeftRight
} from 'lucide-react';
import { HistoryItem } from '../types';
import { formatBytes } from '../utils/imageUtils';
import { translations } from '../translations';

interface HistoryListProps {
  history: HistoryItem[];
  onClearHistory: () => void;
  onDeleteHistoryItem: (id: string) => void;
  lang: 'ar' | 'en';
}

export const HistoryList: React.FC<HistoryListProps> = ({
  history,
  onClearHistory,
  onDeleteHistoryItem,
  lang
}) => {
  const t = translations[lang];

  // Modals for Comparison View
  const [comparingItem, setComparingItem] = useState<HistoryItem | null>(null);
  const [sliderPosition, setSliderPosition] = useState<number>(50);

  // Compute overall files stats
  const totalOriginalSize = history.reduce((sum, item) => sum + item.originalSize, 0);
  const totalProcessedSize = history.reduce((sum, item) => sum + item.processedSize, 0);
  const sizeSaved = totalOriginalSize - totalProcessedSize;
  const savingPercentage = totalOriginalSize > 0 
    ? Math.round((sizeSaved / totalOriginalSize) * 100) 
    : 0;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderPosition(parseInt(e.target.value));
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-800 dark:text-slate-100">
      
      {/* Overview Stat Cards */}
      {history.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-gradient-to-br from-purple-900 to-purple-950 p-5 rounded-3xl text-white shadow-md flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-200">{t.history.statOps}</p>
              <h3 className="text-2xl font-bold font-mono mt-1">{history.length} {lang === 'ar' ? 'عمليات' : 'ops'}</h3>
              <p className="text-[10px] text-purple-350">{t.history.statOpsSub}</p>
            </div>
            <div className="bg-white/10 p-3 rounded-2xl text-purple-300">
              <History className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-purple-100/60 dark:border-slate-700/50 p-5 rounded-3xl shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-bold">{t.history.statOrig}</p>
              <h3 className="text-xl font-bold font-mono text-gray-800 dark:text-slate-200 mt-1">{formatBytes(totalOriginalSize)}</h3>
              <p className="text-[10px] text-gray-450 mt-1">{lang === 'ar' ? 'الحجم الكلي قبل المعالجات والتحوير' : 'Total size before core adjustments'}</p>
            </div>
            <div className="bg-purple-100 dark:bg-slate-700/50 p-3 rounded-2xl text-purple-650 dark:text-purple-300">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-purple-100/60 dark:border-slate-700/50 p-5 rounded-3xl shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-800 dark:text-emerald-400 font-bold">{t.history.statSaved}</p>
              <h3 className="text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                {sizeSaved > 0 ? `+${formatBytes(sizeSaved)}` : '0 Bytes'}
              </h3>
              <p className="text-[10px] text-emerald-500 font-bold mt-1">{lang === 'ar' ? `وفر في مساحتك بنسبة ${savingPercentage}%` : `Saved up to ${savingPercentage}% on your device`}</p>
            </div>
            <div className="bg-emerald-100 dark:bg-slate-700/50 p-3 rounded-2xl text-emerald-600 dark:text-emerald-400">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* Main Operations table list card */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-purple-100/60 dark:border-slate-700/50 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-50 dark:border-slate-700/50 pb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-purple-600" />
            <h3 className="font-extrabold text-purple-950 dark:text-white text-base">{t.history.title}</h3>
          </div>
          {history.length > 0 && (
            <button
              onClick={onClearHistory}
              className="flex items-center justify-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-550/10 hover:bg-red-100 dark:hover:bg-red-950/20 px-4 py-2.5 rounded-xl transition-all cursor-pointer border-0 shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              <span>{t.history.clearAll}</span>
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-12 space-y-4">
            <div className="bg-purple-100 dark:bg-slate-700/50 text-purple-650 dark:text-purple-305 p-4 rounded-full">
              <Sparkles className="w-10 h-10 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-gray-800 dark:text-white">{t.history.empty}</h4>
              <p className="text-xs text-gray-400 dark:text-gray-300 max-w-sm">{t.history.emptySub}</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-purple-50 dark:border-slate-700/30 text-gray-450 dark:text-slate-400 font-bold">
                  <th className="pb-3 text-right">{t.history.colAction}</th>
                  <th className="pb-3 text-right">{t.history.colFile}</th>
                  <th className="pb-3 text-right">{t.history.colPrevSize}</th>
                  <th className="pb-3 text-right">{t.history.colNewSize}</th>
                  <th className="pb-3 text-right">{t.history.colDate}</th>
                  <th className="pb-3 text-center">{t.history.colTools}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50/50 dark:divide-slate-700/20">
                {history.map((item) => (
                  <tr key={item.id} className="group hover:bg-purple-550/5 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="py-4 font-bold">
                      <div className="flex items-center gap-2.5">
                        {item.type === 'pdf' ? (
                          <div className="bg-red-100 dark:bg-red-550/10 text-red-650 dark:text-red-400 p-2 rounded-xl">
                            <FileText className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="bg-purple-100 dark:bg-purple-550/10 text-purple-650 dark:text-purple-400 p-2 rounded-xl">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                        <span className="font-extrabold text-gray-800 dark:text-white">{item.action}</span>
                      </div>
                    </td>
                    <td className="py-4 text-gray-600 dark:text-gray-300 font-semibold">
                      <p className="truncate max-w-[170px]" title={item.fileName}>{item.fileName}</p>
                    </td>
                    <td className="py-4 text-gray-450 dark:text-gray-400 font-mono font-bold">{formatBytes(item.originalSize)}</td>
                    <td className="py-4 font-mono font-extrabold text-purple-700 dark:text-purple-300">{formatBytes(item.processedSize)}</td>
                    <td className="py-4 text-gray-400 dark:text-gray-400 font-bold">
                      {new Date(item.timestamp).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: 'numeric',
                        month: 'numeric'
                      })}
                    </td>
                    <td className="py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 shrink-0">
                        {/* Compare Before vs After Button (Images only) */}
                        {item.type === 'image' && item.originalUrl && item.downloadUrl && item.downloadUrl !== '#' && (
                          <button
                            onClick={() => setComparingItem(item)}
                            className="p-2 text-purple-600 hover:text-purple-700 bg-purple-50 dark:bg-purple-500/10 dark:text-purple-300 rounded-xl cursor-pointer"
                            title={t.history.btnCompare}
                          >
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                        
                        <a
                          href={item.downloadUrl}
                          download={item.fileName}
                          className={`p-2 text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-555/10 dark:text-emerald-400 rounded-xl transition-all ${item.downloadUrl === '#' ? 'opacity-30 pointer-events-none' : ''}`}
                          title={t.history.btnDownload}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>

                        <button
                          onClick={() => onDeleteHistoryItem(item.id)}
                          className="p-2 text-red-500 hover:text-red-750 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl cursor-pointer"
                          title={t.history.btnDelete}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Visual Comparison Modal */}
      {comparingItem && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-purple-100 dark:border-slate-700 max-w-2xl w-full p-6 space-y-5 animate-fadeIn">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-150 dark:border-slate-700 pb-3">
              <h3 className="font-extrabold text-base text-purple-950 dark:text-white flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-purple-600" />
                <span>{t.history.compareTitle}</span>
              </h3>
              <button 
                onClick={() => setComparingItem(null)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub details */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-gray-100 dark:border-slate-800 text-xs text-gray-500 dark:text-gray-300">
              <p>• {t.history.colFile}: <strong className="text-gray-800 dark:text-white font-mono break-all">{comparingItem.fileName}</strong></p>
              <p>• {lang === 'ar' ? 'مساحة الحجم الموفرة:' : 'Space Saved:'} <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{(comparingItem.originalSize - comparingItem.processedSize) > 0 ? formatBytes(comparingItem.originalSize - comparingItem.processedSize) : '0 B'}</strong></p>
            </div>

            {/* Slider Comparison Area */}
            <div className="relative aspect-video w-full max-h-[360px] bg-slate-950 rounded-2xl overflow-hidden select-none border border-slate-800">
              {/* Processed (After) on Background */}
              <img 
                src={comparingItem.downloadUrl} 
                alt="After" 
                className="w-full h-full object-contain absolute inset-0 pointer-events-none"
              />
              <div className="absolute bottom-3 left-3 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-md z-10 opacity-75">
                {t.history.processed}
              </div>

              {/* Original (Before) on Foreground with clip */}
              <div 
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
              >
                <img 
                  src={comparingItem.originalUrl} 
                  alt="Before" 
                  className="w-full h-full object-contain absolute inset-0 pointer-events-none"
                />
                <div className="absolute bottom-3 right-3 bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded-md z-10 opacity-75">
                  {t.history.original}
                </div>
              </div>

              {/* Slider Controller line */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-white z-20 cursor-ew-resize pointer-events-none"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-purple-650 text-white border-2 border-white rounded-full flex items-center justify-center shadow-lg pointer-events-none z-30">
                  <ArrowLeftRight className="w-3.5 h-3.5 text-white" />
                </div>
              </div>

              {/* Handle mouse adjustments via input layer overlay */}
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={sliderPosition} 
                onChange={handleSliderChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-40"
              />
            </div>

            {/* Bottom tools details info */}
            <div className="flex justify-between items-center text-xs text-gray-405">
              <span>{t.history.original} ({formatBytes(comparingItem.originalSize)})</span>
              <span className="font-bold text-purple-600">{sliderPosition}% / {100 - sliderPosition}%</span>
              <span>{t.history.processed} ({formatBytes(comparingItem.processedSize)})</span>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setComparingItem(null)}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-2.5 px-6 rounded-xl cursor-pointer"
              >
                {lang === 'ar' ? 'فهمت' : 'Done'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

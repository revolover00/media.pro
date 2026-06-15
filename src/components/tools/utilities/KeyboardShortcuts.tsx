
import React, { useState, useEffect } from 'react';
import { 
  Keyboard, 
  Search, 
  X, 
  CornerDownLeft, 
  ArrowUp, 
  Bookmark, 
  HelpCircle,
  Command,
  Monitor
} from 'lucide-react';

interface KeyboardShortcutsProps {
  lang: 'ar' | 'en';
  isOpen: boolean;
  onClose: () => void;
  onSelectTab?: (tabId: string) => void;
}

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ 
  lang, 
  isOpen, 
  onClose,
  onSelectTab
}) => {
  const isAr = lang === 'ar';
  const [searchTerm, setSearchTerm] = useState<string>('');

  const shortcutsList = [
    { keys: ['Ctrl', 'K'], descAr: 'فتح / إغلاق دليل الاختصارات هذا', descEn: 'Toggle search and shortcut panel', cat: 'navigation' },
    { keys: ['Ctrl', '/'], descAr: 'فتح دليل الاختصارات هذا بسرعة', descEn: 'Alternate shortcut guide toggle', cat: 'navigation' },
    { keys: ['Alt', 'F'], descAr: 'الانتقال المباشر لأدوات المفضلة', descEn: 'Jump to Favorites dashboard', cat: 'quick_tabs' },
    { keys: ['Alt', 'H'], descAr: 'الانتقال المباشر للوحة السجلات', descEn: 'Jump to History logging page', cat: 'quick_tabs' },
    { keys: ['Alt', 'S'], descAr: 'تغيير لغة العرض للعربية / الإنجليزية', descEn: 'Toggle app language (AR/EN)', cat: 'preferences' },
    { keys: ['Alt', 'E'], descAr: 'فتح أداة تشفير الملفات AES', descEn: 'Open AES File Encryptor Tool', cat: 'security' },
    { keys: ['Alt', 'N'], descAr: 'فتح أداة تسمية الدفعات', descEn: 'Open Batch Batch Renamer', cat: 'utilities' },
    { keys: ['Alt', 'C'], descAr: 'فتح مقارن الملفات الثنائية', descEn: 'Open Twin File Comparator', cat: 'utilities' },
    { keys: ['Esc'], descAr: 'إغلاق أي نافذة مبوبة أو منبثقة مفتوحة', descEn: 'Close any active overlay popup', cat: 'utility' }
  ];

  // Listen to global key listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle shortcut menu
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K' || e.key === '/')) {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open panel
          onClose(); // safety close
          // trigger open by setting state on parent if needed
        }
      }

      // Check alt key triggers
      if (e.altKey && onSelectTab) {
        if (e.key === 'f' || e.key === 'F') {
          e.preventDefault();
          onSelectTab('favorites-manager');
        }
        if (e.key === 'h' || e.key === 'H') {
          e.preventDefault();
          onSelectTab('history-dashboard');
        }
        if (e.key === 'e' || e.key === 'E') {
          e.preventDefault();
          onSelectTab('file-encryptor');
        }
        if (e.key === 'n' || e.key === 'N') {
          e.preventDefault();
          onSelectTab('batch-renamer');
        }
        if (e.key === 'c' || e.key === 'C') {
          e.preventDefault();
          onSelectTab('file-comparator');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onSelectTab]);

  const filteredShortcuts = shortcutsList.filter(item => {
    return (
      (isAr ? item.descAr : item.descEn).toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.keys.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      
      <div className="bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl max-w-md w-full relative space-y-4 animate-scaleUp text-slate-705 dark:text-slate-200 text-xs">
        
        {/* Dismiss */}
        <button 
          onClick={onClose}
          className="absolute left-4 top-4 p-1 rounded-lg hover:bg-slate-105 cursor-pointer text-slate-400 border-0 bg-transparent"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 border-b border-slate-50 dark:border-slate-805 pb-3">
          <Keyboard className="w-5 h-5 text-purple-600 animate-pulse" />
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              {isAr ? 'دليل زوايا ومفاتيح الاختصارات السريعة' : 'Keyboard Shortcuts Cheat-sheet'}
            </h3>
            <p className="text-[10px] text-slate-400">
              {isAr ? 'انتقل كالبرق بين أدوات ومربعات المنصة بنقرات سهلة ومباشرة' : 'Navigate through panels instantly and save operation time'}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isAr ? 'ابحث عن اختصار محدد...' : 'Find key controls...'}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl py-1.5 pl-8 pr-3 text-[11px] focus:ring-1 focus:ring-purple-500"
          />
        </div>

        {/* Shortcuts list layout */}
        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-0.5">
          {filteredShortcuts.map((item, index) => (
            <div 
              key={index} 
              className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-950 rounded-xl transition border-b border-slate-100 last:border-0"
            >
              <div className="flex gap-1 items-center font-sans tracking-tight">
                {item.keys.map((key, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span className="text-slate-350">+</span>}
                    <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 rounded text-[9px] font-mono font-bold text-slate-800 dark:text-slate-300 shadow-sm leading-none">
                      {key}
                    </kbd>
                  </React.Fragment>
                ))}
              </div>

              <span className="text-slate-500 dark:text-slate-300 font-medium text-right text-[11px] truncate max-w-[240px]">
                {isAr ? item.descAr : item.descEn}
              </span>
            </div>
          ))}

          {filteredShortcuts.length === 0 && (
            <p className="text-center text-slate-400">{isAr ? 'لا توجد اختصارات تطابق البحث.' : 'No items match filter criteria.'}</p>
          )}
        </div>

        {/* Bottom Help info */}
        <div className="bg-purple-600/5 p-3 rounded-2xl border border-purple-600/10 flex items-start gap-1.5 leading-relaxed text-[10px] text-purple-600">
          <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <p>{isAr ? 'تلميح: انتقل بين المفضلة واللوحة في ثانية، اضغط على زر [Alt] بشكل دائم لدمج المفاتيح!' : 'Shortcut tip: Use Alt trigger parameters for navigation globally across all devices.'}</p>
        </div>

      </div>

    </div>
  );
};

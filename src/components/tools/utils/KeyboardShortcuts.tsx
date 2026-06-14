import React, { useState, useEffect } from 'react';
import { 
  Keyboard, 
  Search, 
  Moon, 
  History, 
  Settings, 
  HelpCircle, 
  X,
  Command
} from 'lucide-react';
import { TabId } from '../../../types';

interface KeyboardShortcutsProps {
  lang: 'ar' | 'en';
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  onFocusSearchField?: () => void;
}

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  lang,
  activeTab,
  setActiveTab,
  onToggleTheme,
  onOpenSettings,
  onFocusSearchField
}) => {
  const [showPanel, setShowPanel] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Intercept Ctrl modifier keydown events
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'k':
            e.preventDefault();
            if (onFocusSearchField) onFocusSearchField();
            break;
          case 'd':
            e.preventDefault();
            onToggleTheme();
            break;
          case 'h':
            e.preventDefault();
            setActiveTab('history');
            break;
          case ',':
            e.preventDefault();
            onOpenSettings();
            break;
          case '/':
            e.preventDefault();
            setShowPanel((prev) => !prev);
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setActiveTab, onToggleTheme, onOpenSettings, onFocusSearchField]);

  return (
    <>
      {/* Visual toggle badge / Floating help controller */}
      <button
        onClick={() => setShowPanel(true)}
        className="fixed bottom-6 left-6 z-40 bg-slate-900/90 dark:bg-slate-100/90 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg border border-slate-750 cursor-pointer hover:scale-105 transition-all text-xs font-bold gap-1"
        title={lang === 'ar' ? 'مساعد التصفح الفوري (Ctrl+/)' : 'Workspace Actions Help (Ctrl+/)'}
      >
        <Keyboard className="w-5 h-5" />
      </button>

      {showPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-purple-500/20">
            
            {/* Header info bar */}
            <div className="p-4.5 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Command className="w-4 h-4 text-purple-600" />
                <span className="font-extrabold text-xs text-slate-800 dark:text-white">{lang === 'ar' ? 'مفاتيح واختصارات التصفح والمساعد' : 'Global Keyboard Navigation Map'}</span>
              </div>
              <button 
                onClick={() => setShowPanel(false)}
                className="text-slate-400 hover:text-slate-650 cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List keys */}
            <div className="p-5.5 space-y-4">
              
              <div className="space-y-2.5">
                {[
                  { keys: 'Ctrl + K', labelAr: 'التركيز على شريط البحث الفوري', labelEn: 'Focus universal search bar', icon: Search },
                  { keys: 'Ctrl + D', labelAr: 'مبادلة الوضع الداكن والنهاري', labelEn: 'Toggle theme night/day', icon: Moon },
                  { keys: 'Ctrl + H', labelAr: 'الذهاب لجدول السجل والإحصائيات', labelEn: 'Open operation logs history', icon: History },
                  { keys: 'Ctrl + ,', labelAr: 'افتح مستند الإعدادات العامة', labelEn: 'Display general properties', icon: Settings },
                  { keys: 'Ctrl + /', labelAr: 'إظهار / إغلاق واجهة الاختصارات', labelEn: 'Show shortcut help overlays', icon: HelpCircle }
                ].map((row, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-850">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="bg-purple-100 dark:bg-slate-800 text-purple-600 p-1.5 rounded-lg">
                        <row.icon className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-xs text-slate-750 dark:text-slate-300">
                        {lang === 'ar' ? row.labelAr : row.labelEn}
                      </span>
                    </div>

                    <kbd className="font-mono bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 py-1 px-2.5 rounded-md text-[10px] font-extrabold shadow-sm border border-slate-300 dark:border-slate-700">
                      {row.keys}
                    </kbd>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <button
                  onClick={() => setShowPanel(false)}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs py-2 px-6 rounded-xl shadow cursor-pointer transition-colors"
                >
                  {lang === 'ar' ? 'فهمت ذلك!' : 'Got it!'}
                </button>
              </div>

            </div>

          </div>
        </div>
      )}
    </>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Onboarding } from './components/tools/utilities/Onboarding';
import { KeyboardShortcuts } from './components/tools/utilities/KeyboardShortcuts';
import { renderActiveTab } from './routes/renderActiveTab';

import { TabId, HistoryItem, AppSettings } from './types';
import { translations } from './translations';
import { 
  FileText, 
  HelpCircle, 
  Settings, 
  ChevronLeft, 
  CheckCircle, 
  ShieldCheck, 
  Sparkles,
  Zap,
  HardDrive,
  Sun,
  Moon,
  Languages,
  CheckCircle2,
  AlertCircle,
  X,
  Star,
  Menu
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // Store processed file blobs in memory for session-active downloads
  const blobRegistryRef = useRef<Record<string, { blob: Blob; url: string }>>({});

  // App settings
  const [settings, setSettings] = useState<AppSettings>({
    defaultQuality: 80,
    defaultCompressRatio: 70,
    maintainAspectRatio: true,
    historyLimit: 20,
    language: 'ar',
    theme: 'dark',
    captionModel: 'Xenova/vit-gpt2-image-captioning',
    summaryModel: 'Xenova/distilbart-cnn-6-6',
    qaModel: 'Xenova/bert-base-multilingual-cased-question-answering'
  });
  
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [showShortcuts, setShowShortcuts] = useState<boolean>(false);
  
  // Toast notifications state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  // Helper to trigger toast
  const showToast = (message: string, type: 'success' | 'error') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const toggleFavorite = (tabId: string) => {
    let updatedFavorites;
    if (favorites.includes(tabId)) {
      updatedFavorites = favorites.filter(id => id !== tabId);
      showToast(
        settings.language === 'ar' ? 'تمت الإزالة من المفضلة' : 'Removed from favorites', 
        'success'
      );
    } else {
      updatedFavorites = [...favorites, tabId];
      showToast(
        settings.language === 'ar' ? 'تمت الإضافة إلى المفضلة' : 'Added to favorites', 
        'success'
      );
    }
    setFavorites(updatedFavorites);
    localStorage.setItem('promedia_favorites', JSON.stringify(updatedFavorites));
  };

  // Initialize and load state
  useEffect(() => {
    // Load settings
    const storedSettings = localStorage.getItem('promedia_settings');
    let finalSettings = settings;
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        finalSettings = { ...settings, ...parsed };
        setSettings(finalSettings);
      } catch (e) {
        console.error('Error loading settings', e);
      }
    }

    // Load onboarding state
    const onboarded = localStorage.getItem('fileforge_onboarded');
    if (onboarded !== 'true') {
      setShowOnboarding(true);
    }

    // Load favorites
    const storedFavorites = localStorage.getItem('promedia_favorites');
    if (storedFavorites) {
      try {
        setFavorites(JSON.parse(storedFavorites));
      } catch (e) {
        console.error('Error loading favorites', e);
      }
    }

    // Apply translation values, document direction and dark mode class
    const isEn = finalSettings.language === 'en';
    document.documentElement.dir = isEn ? 'ltr' : 'rtl';
    document.documentElement.lang = finalSettings.language;
    document.title = isEn ? 'ProMedia — Professional File Processor' : 'برو ميديا — معالج الملفات الاحترافي';
    
    const isDarkTheme = finalSettings.theme === 'dark';
    document.documentElement.classList.toggle('dark', isDarkTheme);

    // Load history metadata
    const storedHistory = localStorage.getItem('promedia_history');
    if (storedHistory) {
      try {
        const metadataList = JSON.parse(storedHistory) as Omit<HistoryItem, 'downloadUrl'>[];
        // Rebuild session history
        const rebuilt: HistoryItem[] = metadataList.map(item => {
          return {
            ...item,
            downloadUrl: '#' // Metadatas are persistent, blobs are session-only
          };
        });
        setHistory(rebuilt);
      } catch (e) {
        console.error('Error loading history', e);
      }
    }

    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  // Redirect overlay tabs instantly to dialog popups
  useEffect(() => {
    if (activeTab === 'keyboard-shortcuts') {
      setShowShortcuts(true);
      setActiveTab('dashboard');
    } else if (activeTab === 'onboarding') {
      setShowOnboarding(true);
      setActiveTab('dashboard');
    }
  }, [activeTab]);

  // Sync settings helper
  const handleSaveSettings = (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('promedia_settings', JSON.stringify(updated));

    // Side-effects on change
    if (newSettings.language) {
      const isEn = newSettings.language === 'en';
      document.documentElement.dir = isEn ? 'ltr' : 'rtl';
      document.documentElement.lang = newSettings.language;
      document.title = isEn ? 'ProMedia — Professional File Processor' : 'برو ميديا — معالج الملفات الاحترافي';
    }

    if (newSettings.theme) {
      document.documentElement.classList.toggle('dark', newSettings.theme === 'dark');
    }
  };

  // Add items with in-memory Blobs tracking & before-after comparing URLs
  const handleAddHistoryItem = (
    itemData: any,
    blob?: Blob,
    originalBlobOrUrl?: Blob | string
  ): string => {
    let id = itemData.id || ('hist_' + Math.random().toString(36).substr(2, 9));
    const timestamp = itemData.timestamp || new Date().toISOString();
    let blobUrl = itemData.downloadUrl || '';

    if (blob) {
      blobUrl = URL.createObjectURL(blob);
      blobRegistryRef.current[id] = { blob, url: blobUrl };
    }

    let originalUrl = itemData.originalUrl || '';
    if (originalBlobOrUrl) {
      if (originalBlobOrUrl instanceof Blob) {
        originalUrl = URL.createObjectURL(originalBlobOrUrl);
      } else {
        originalUrl = originalBlobOrUrl;
      }
      blobRegistryRef.current[id + '_orig'] = { 
        blob: originalBlobOrUrl instanceof Blob ? originalBlobOrUrl : (blob || new Blob([])), 
        url: originalUrl 
      };
    }

    const newItem: HistoryItem = {
      ...itemData,
      id,
      timestamp,
      downloadUrl: blobUrl,
      originalUrl: originalUrl || undefined
    };

    const updatedHistory = [newItem, ...history].slice(0, settings.historyLimit);
    setHistory(updatedHistory);
    // Suppress general toast. Individual tools will show success message
    // Save only metadata to localStorage to prevent quota overflow
    const metadataList = updatedHistory.map(({ id, action, fileName, timestamp, originalSize, processedSize, type, originalUrl }) => ({
      id, action, fileName, timestamp, originalSize, processedSize, type, originalUrl
    }));
    localStorage.setItem('promedia_history', JSON.stringify(metadataList));

    return id;
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);

    // Revoke URL if exists
    if (blobRegistryRef.current[id]) {
      URL.revokeObjectURL(blobRegistryRef.current[id].url);
      delete blobRegistryRef.current[id];
    }
    if (blobRegistryRef.current[id + '_orig']) {
      URL.revokeObjectURL(blobRegistryRef.current[id + '_orig'].url);
      delete blobRegistryRef.current[id + '_orig'];
    }

    const metadataList = updated.map(({ id, action, fileName, timestamp, originalSize, processedSize, type, originalUrl }) => ({
      id, action, fileName, timestamp, originalSize, processedSize, type, originalUrl
    }));
    localStorage.setItem('promedia_history', JSON.stringify(metadataList));
    showToast(
      settings.language === 'ar' ? 'تم حذف السجل بنجاح' : 'History deleted', 
      'success'
    );
  };

  const handleClearHistory = () => {
    // Revoke all session URLs
    Object.values(blobRegistryRef.current).forEach((item: any) => {
      URL.revokeObjectURL(item.url);
    });
    blobRegistryRef.current = {};

    setHistory([]);
    localStorage.removeItem('promedia_history');
    showToast(
      settings.language === 'ar' ? 'تم تفريغ كافة سجل العمليات' : 'Operations log cleared', 
      'success'
    );
  };

  // Resolve download triggers cleanly
  const getDownloadUrlForHistoryItem = (item: HistoryItem) => {
    if (blobRegistryRef.current[item.id]) {
      return blobRegistryRef.current[item.id].url;
    }
    return item.downloadUrl || '#';
  };

  const getOriginalUrlForHistoryItem = (item: HistoryItem) => {
    if (blobRegistryRef.current[item.id + '_orig']) {
      return blobRegistryRef.current[item.id + '_orig'].url;
    }
    return item.originalUrl || '';
  };

  const processedHistory = history.map(item => {
    const activeUrl = getDownloadUrlForHistoryItem(item);
    const activeOrigUrl = getOriginalUrlForHistoryItem(item);
    return {
      ...item,
      downloadUrl: activeUrl,
      originalUrl: activeOrigUrl || undefined
    };
  });

  const lang = settings.language;
  const t = translations[lang];

  return (
    <div className={`flex min-h-screen font-sans tracking-wide antialiased ${settings.theme === 'dark' ? 'dark bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Onboarding Dialog */}
      {showOnboarding && (
        <Onboarding 
          lang={lang} 
          onCompleteOnboarding={(selectedTools) => {
            setFavorites(selectedTools);
            localStorage.setItem('promedia_favorites', JSON.stringify(selectedTools));
            setShowOnboarding(false);
          }} 
          onClose={() => setShowOnboarding(false)} 
        />
      )}

      {/* Global Shortcut Event Handlers & Cheat-Sheet */}
      <KeyboardShortcuts 
        lang={lang} 
        isOpen={showShortcuts} 
        onClose={() => setShowShortcuts(false)} 
        onSelectTab={(tabId) => {
          setActiveTab(tabId as TabId);
          setShowShortcuts(false);
        }}
      />

      {/* Toast Alert Banner */}
      {toast && (
        <div id="toast-notify" className="fixed bottom-6 left-6 z-50 flex items-center gap-3 bg-slate-900 dark:bg-purple-950 text-white py-3.5 px-6 rounded-2xl shadow-2xl border border-purple-500/30 animate-slideIn">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span className="text-xs font-bold font-sans">{toast.message}</span>
          <button 
            onClick={() => setToast(null)} 
            className="p-1 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sidebar navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        lang={lang}
        favorites={favorites}
      />

      {/* Main Workspace Frame */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header Controls bar */}
        <header className="bg-white dark:bg-slate-800 border-b border-purple-100/50 dark:border-slate-700/40 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm transition-colors">
          <div className="flex items-center gap-2.5 md:gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="bg-purple-50 dark:bg-slate-700 p-2.5 rounded-2xl md:hidden text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-slate-600 transition-colors cursor-pointer"
              title="القائمة"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-extrabold text-base md:text-lg text-purple-950 dark:text-white flex items-center gap-2">
                <span>{t.headerTitle}</span>
                {activeTab !== 'dashboard' && activeTab !== 'history' && (
                  <button 
                    onClick={() => toggleFavorite(activeTab)}
                    className="p-1 rounded-full text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                    title={favorites.includes(activeTab) ? t.favoriteAdded : t.addFavorite}
                  >
                    <Star className={`w-4 h-4 ${favorites.includes(activeTab) ? 'fill-amber-400' : ''}`} />
                  </button>
                )}
              </h1>
              <p className="text-[11px] text-gray-400 dark:text-slate-300 mt-0.5">{t.headerSub}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3.5">
            {/* Quick Banner indicating local privacy */}
            <div className="hidden lg:flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-850 dark:text-emerald-300 py-1.5 px-3.5 rounded-xl border border-emerald-100 dark:border-emerald-900/30 text-xs font-bold">
              <ShieldCheck className="w-[18px] h-[18px] text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{t.localPrivacyBadge}</span>
            </div>

            {/* Quick switches (Theme & Language) */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
              <button
                onClick={() => handleSaveSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
                className="p-2 text-slate-500 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-300 rounded-lg transition-all cursor-pointer"
                title={settings.theme === 'dark' ? 'الوضع المضيء' : 'الوضع المظلم'}
              >
                {settings.theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
              </button>

              <button
                onClick={() => handleSaveSettings({ language: settings.language === 'ar' ? 'en' : 'ar' })}
                className="p-2 text-slate-500 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-300 rounded-lg transition-all cursor-pointer text-xs font-bold flex items-center gap-1"
                title="تغيير اللغة العربية / English"
              >
                <Languages className="w-4 h-4" />
                <span>{settings.language === 'ar' ? 'EN' : 'عربي'}</span>
              </button>
            </div>

            {/* Settings button trigger */}
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="p-2.5 text-gray-500 dark:text-slate-300 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-slate-700 rounded-xl transition-all border border-gray-200 dark:border-slate-600 cursor-pointer"
              title={t.settingsTitle}
            >
              <Settings className="w-[18px] h-[18px]" />
            </button>
          </div>
        </header>

        {/* Global info notice bar for tablet/mobile view */}
        <div className="lg:hidden bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-200 text-center px-4 py-2 text-[10px] font-bold flex items-center justify-center gap-1.5 border-b border-purple-200 dark:border-purple-800 shrink-0">
          <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-300 animate-pulse" />
          <span>{t.localPrivacyBadge}</span>
        </div>

        {/* Main interactive area views */}
        <div className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto space-y-6">
          
          {/* Settings Modal pop up option */}
          {settingsOpen && (
            <div id="settings-panel" className="bg-white dark:bg-purple-950 p-6 rounded-3xl text-slate-800 dark:text-white border border-purple-200 dark:border-purple-800 shadow-xl space-y-4 relative animate-fadeIn">
              <div className="flex items-center justify-between border-b border-purple-100 dark:border-purple-850 pb-3">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="font-bold text-slate-900 dark:text-white">{t.settingsTitle}</h3>
                </div>
                <button 
                  onClick={() => setSettingsOpen(false)}
                  className="text-xs bg-slate-100 dark:bg-white/10 hover:bg-slate-205 dark:hover:bg-white/20 px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all border-0 text-slate-700 dark:text-white"
                >
                  {t.close}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs text-slate-600 dark:text-purple-200">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-purple-200">{t.settingsQuality}</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={settings.defaultQuality}
                    onChange={(e) => handleSaveSettings({ defaultQuality: parseInt(e.target.value) || 80 })}
                    className="w-full bg-slate-50 dark:bg-purple-900 border border-slate-200 dark:border-purple-800 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-800 dark:text-white font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-purple-200">{t.settingsCompress}</label>
                  <input
                    type="number"
                    min="10"
                    max="90"
                    value={settings.defaultCompressRatio || 70}
                    onChange={(e) => handleSaveSettings({ defaultCompressRatio: parseInt(e.target.value) || 70 })}
                    className="w-full bg-slate-50 dark:bg-purple-900 border border-slate-200 dark:border-purple-800 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-800 dark:text-white font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-purple-200">{t.settingsHistoryLimit}</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={settings.historyLimit}
                    onChange={(e) => handleSaveSettings({ historyLimit: parseInt(e.target.value) || 20 })}
                    className="w-full bg-slate-50 dark:bg-purple-900 border border-slate-200 dark:border-purple-800 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-800 dark:text-white font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-purple-200">{lang === 'ar' ? 'نموذج الذكاء الاصطناعي لوصف الصور' : 'Neural Caption Image Model'}</label>
                  <select
                    value={settings.captionModel || 'Xenova/vit-gpt2-image-captioning'}
                    onChange={(e) => handleSaveSettings({ captionModel: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-purple-900 border border-slate-200 dark:border-purple-800 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-800 dark:text-white"
                  >
                    <option value="Xenova/vit-gpt2-image-captioning">Xenova/vit-gpt2-image-captioning {lang === 'ar' ? '(افتراضي)' : '(Default)'}</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* VIEWS SWITCH CASE DETECTOR */}
          {renderActiveTab({
            activeTab,
            lang,
            favorites,
            toggleFavorite,
            setActiveTab,
            historyLength: history.length,
            processedHistory: processedHistory,
            handleAddHistoryItem,
            handleClearHistory,
            handleDeleteHistoryItem,
            settingsLanguage: settings.language
          })}

          {/* Core Footer Info Badge */}
          <footer className="pt-6 border-t border-purple-100/50 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400 transition-colors">
            <p>© {new Date().getFullYear()} {t.appCopyright}</p>
            <div className="flex items-center gap-4 font-bold">
              <span className="flex items-center gap-1"><Zap className="w-4 h-4 text-amber-500" /> {t.statsSpeed}</span>
              <span className="flex items-center gap-1"><HardDrive className="w-4 h-4 text-purple-500" /> {t.statsUsage}</span>
            </div>
          </footer>

        </div>
      </main>
    </div>
  );
}

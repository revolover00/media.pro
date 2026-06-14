import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ImageTools } from './components/ImageTools';
import { PdfTools } from './components/PdfTools';
import { HistoryList } from './components/HistoryList';
import { ImageCrop } from './components/ImageCrop';
import { ImageRotate } from './components/ImageRotate';
import { ImageOcr } from './components/ImageOcr';
import { ImageRemoveBg } from './components/ImageRemoveBg';
import { ImageEditor } from './components/ImageEditor';
import { ImageBatch } from './components/ImageBatch';
import { ImageMetadata } from './components/tools/images/ImageMetadata';
import { ImageColorExtractor } from './components/tools/images/ImageColorExtractor';
import { ImageSplitter } from './components/tools/images/ImageSplitter';
import { ImageCollage } from './components/tools/images/ImageCollage';
import { Base64Tool } from './components/tools/images/Base64Tool';
import { ImageComparator } from './components/tools/images/ImageComparator';
import { SmartTools } from './components/SmartTools';
import { PdfExtractText } from './components/PdfExtractText';
import { PdfEdit } from './components/PdfEdit';
import { PDFProtect } from './components/tools/pdf/PDFProtect';
import { PDFUnlock } from './components/tools/pdf/PDFUnlock';
import { PDFFormFiller } from './components/tools/pdf/PDFFormFiller';
import { PDFPageNumber } from './components/tools/pdf/PDFPageNumber';
import { PDFHeaderFooter } from './components/tools/pdf/PDFHeaderFooter';
import { PDFRepair } from './components/tools/pdf/PDFRepair';
import { BusinessCardScanner } from './components/tools/ocr/BusinessCardScanner';
import { TableExtractor } from './components/tools/ocr/TableExtractor';
import { ImageToSearchablePDF } from './components/tools/ocr/ImageToSearchablePDF';
import { MultiLanguageOCR } from './components/tools/ocr/MultiLanguageOCR';
import { ReceiptScanner } from './components/tools/ocr/ReceiptScanner';
import { GuideCenter } from './components/GuideCenter';

// Text & Writing Tools
import { TextDiff } from './components/tools/text/TextDiff';
import { TextFormatter } from './components/tools/text/TextFormatter';
import { MarkdownEditor } from './components/tools/text/MarkdownEditor';
import { TextToSpeech } from './components/tools/text/TextToSpeech';
import { SpeechToText } from './components/tools/text/SpeechToText';
import { PasswordGenerator } from './components/tools/text/PasswordGenerator';

// Advanced Local Utilities
import { BatchRenamer } from './components/tools/utilities/BatchRenamer';
import { FileInfo } from './components/tools/utilities/FileInfo';
import { FileComparator } from './components/tools/utilities/FileComparator';
import { FavoritesManager } from './components/tools/utilities/FavoritesManager';
import { HistoryDashboard } from './components/tools/utilities/HistoryDashboard';
import { Onboarding } from './components/tools/utilities/Onboarding';
import { KeyboardShortcuts } from './components/tools/utilities/KeyboardShortcuts';
import { ShareMenu } from './components/tools/utilities/ShareMenu';

// Security and Privacy Tools
import { FileEncryptor } from './components/tools/security/FileEncryptor';
import { FileDecryptor } from './components/tools/security/FileDecryptor';
import { MetadataScrubber } from './components/tools/security/MetadataScrubber';
import { FileShredder } from './components/tools/security/FileShredder';
import { SteganographyTool } from './components/tools/security/SteganographyTool';

// Data Tools
import { CSVEditor } from './components/tools/data/CSVEditor';
import { JSONFormatter } from './components/tools/data/JSONFormatter';
import { ChartGenerator } from './components/tools/data/ChartGenerator';
import { DataExtractor } from './components/tools/data/DataExtractor';
import { UnitConverter } from './components/tools/data/UnitConverter';

// Design Tools
import { MemeGenerator } from './components/tools/design/MemeGenerator';
import { CertificateMaker } from './components/tools/design/CertificateMaker';
import { SocialMediaBanner } from './components/tools/design/SocialMediaBanner';
import { QRGenerator } from './components/tools/design/QRGenerator';
import { GradientGenerator } from './components/tools/design/GradientGenerator';
import { PaletteGenerator } from './components/tools/design/PaletteGenerator';

// Advanced Local AI Tools
import { ObjectDetector } from './components/tools/ai/ObjectDetector';
import { PhotoRestorer } from './components/tools/ai/PhotoRestorer';
import { FaceDetection } from './components/tools/ai/FaceDetection';
import { ImageSearch } from './components/tools/ai/ImageSearch';
import { TextSimilarity } from './components/tools/ai/TextSimilarity';
import { DocumentClassifier } from './components/tools/ai/DocumentClassifier';

// Video & Multimedia tools loaded lazily for elite performance
const VideoToGIF = React.lazy(() => import('./components/tools/media/VideoToGIF').then(m => ({ default: m.VideoToGIF })));
const GIFEditor = React.lazy(() => import('./components/tools/media/GIFEditor').then(m => ({ default: m.GIFEditor })));
const VideoCompressor = React.lazy(() => import('./components/tools/media/VideoCompressor').then(m => ({ default: m.VideoCompressor })));
const AudioExtractor = React.lazy(() => import('./components/tools/media/AudioExtractor').then(m => ({ default: m.AudioExtractor })));
const VideoToImages = React.lazy(() => import('./components/tools/media/VideoToImages').then(m => ({ default: m.VideoToImages })));
const ScreenRecorder = React.lazy(() => import('./components/tools/media/ScreenRecorder').then(m => ({ default: m.ScreenRecorder })));
const WebcamCapture = React.lazy(() => import('./components/tools/media/WebcamCapture').then(m => ({ default: m.WebcamCapture })));
const MediaInfo = React.lazy(() => import('./components/tools/media/MediaInfo').then(m => ({ default: m.MediaInfo })));

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
    document.title = isEn ? 'Pro Media - Professional Locally-Powered File Processor' : 'برو ميديا - معالج الصور وملفات PDF الاحترافي';
    
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
      document.title = isEn ? 'Pro Media - Professional Locally-Powered File Processor' : 'برو ميديا - معالج الصور وملفات PDF الاحترافي';
    }

    if (newSettings.theme) {
      document.documentElement.classList.toggle('dark', newSettings.theme === 'dark');
    }
  };

  // Add items with in-memory Blobs tracking & before-after comparing URLs
  const handleAddHistoryItem = (
    itemData: Omit<HistoryItem, 'id' | 'timestamp' | 'downloadUrl'>,
    blob: Blob,
    originalBlobOrUrl?: Blob | string
  ): string => {
    const id = 'hist_' + Math.random().toString(36).substr(2, 9);
    const timestamp = new Date().toISOString();
    const blobUrl = URL.createObjectURL(blob);

    let originalUrl = '';
    if (originalBlobOrUrl) {
      if (originalBlobOrUrl instanceof Blob) {
        originalUrl = URL.createObjectURL(originalBlobOrUrl);
      } else {
        originalUrl = originalBlobOrUrl;
      }
    }

    // Register blob in memory for session downloads
    blobRegistryRef.current[id] = { blob, url: blobUrl };
    if (originalUrl) {
      blobRegistryRef.current[id + '_orig'] = { 
        blob: originalBlobOrUrl instanceof Blob ? originalBlobOrUrl : blob, 
        url: originalUrl 
      };
    }

    const newItem: HistoryItem = {
      id,
      ...itemData,
      timestamp,
      downloadUrl: blobUrl,
      originalUrl: originalUrl || undefined
    };

    const updatedHistory = [newItem, ...history].slice(0, settings.historyLimit);
    setHistory(updatedHistory);
    showToast(
      settings.language === 'ar' ? `نجحت العملية: ${itemData.fileName}` : `Success: ${itemData.fileName}`, 
      'success'
    );

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
    return '#';
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
              className="bg-purple-50 dark:bg-slate-700 p-2.5 rounded-2xl md:hidden text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-slate-650 transition-colors cursor-pointer"
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
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{t.localPrivacyBadge}</span>
            </div>

            {/* Quick switches (Theme & Language) */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
              <button
                onClick={() => handleSaveSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
                className="p-2 text-slate-500 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-300 rounded-lg transition-all cursor-pointer"
                title={settings.theme === 'dark' ? 'الوضع المضيء' : 'الوضع المظلم'}
              >
                {settings.theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
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
              className="p-2.5 text-gray-500 dark:text-slate-300 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-slate-700 rounded-xl transition-all border border-gray-205 dark:border-slate-600 cursor-pointer"
              title={t.settingsTitle}
            >
              <Settings className="w-4.5 h-4.5 animate-spin-slow" />
            </button>
          </div>
        </header>

        {/* Global info notice bar for tablet/mobile view */}
        <div className="lg:hidden bg-purple-950 text-purple-200 text-center px-4 py-2 text-[10px] font-bold flex items-center justify-center gap-1.5 border-b border-purple-800 shrink-0">
          <ShieldCheck className="w-4 h-4 text-purple-300 animate-pulse" />
          <span>{t.localPrivacyBadge}</span>
        </div>

        {/* Main interactive area views */}
        <div className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto space-y-6">
          
          {/* Settings Modal pop up option */}
          {settingsOpen && (
            <div id="settings-panel" className="bg-purple-950 p-6 rounded-3xl text-white shadow-xl space-y-4 border border-purple-800 relative animate-fadeIn">
              <div className="flex items-center justify-between border-b border-purple-800 pb-3">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-400" />
                  <h3 className="font-bold">{t.settingsTitle}</h3>
                </div>
                <button 
                  onClick={() => setSettingsOpen(false)}
                  className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all border-0 text-white"
                >
                  {t.close}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs text-purple-200">
                <div className="space-y-1.5">
                  <label className="font-bold">{t.settingsQuality}</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={settings.defaultQuality}
                    onChange={(e) => handleSaveSettings({ defaultQuality: parseInt(e.target.value) || 80 })}
                    className="w-full bg-purple-900 border border-purple-850 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-purple-400 text-white font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold">{t.settingsCompress}</label>
                  <input
                    type="number"
                    min="10"
                    max="90"
                    value={settings.defaultCompressRatio || 70}
                    onChange={(e) => handleSaveSettings({ defaultCompressRatio: parseInt(e.target.value) || 70 })}
                    className="w-full bg-purple-900 border border-purple-850 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-purple-400 text-white font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold">{t.settingsHistoryLimit}</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={settings.historyLimit}
                    onChange={(e) => handleSaveSettings({ historyLimit: parseInt(e.target.value) || 20 })}
                    className="w-full bg-purple-900 border border-purple-850 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-purple-400 text-white font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold">{lang === 'ar' ? 'نموذج الذكاء الاصطناعي لوصف الصور' : 'Neural Caption Image Model'}</label>
                  <select
                    value={settings.captionModel || 'Xenova/vit-gpt2-image-captioning'}
                    onChange={(e) => handleSaveSettings({ captionModel: e.target.value })}
                    className="w-full bg-purple-900 border border-purple-850 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-purple-400 text-white"
                  >
                    <option value="Xenova/vit-gpt2-image-captioning">Xenova/vit-gpt2-image-captioning {lang === 'ar' ? '(افتراضي)' : '(Default)'}</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* VIEWS SWITCH CASE DETECTOR */}
          {activeTab === 'dashboard' && (
            <Dashboard 
              setActiveTab={setActiveTab} 
              favorites={favorites} 
              onToggleFavorite={toggleFavorite}
              lang={lang}
              historyLength={history.length}
            />
          )}

          {activeTab === 'image-convert' && (
            <ImageTools toolType="convert" onAddHistoryItem={handleAddHistoryItem} />
          )}

          {activeTab === 'image-compress' && (
            <ImageTools toolType="compress" onAddHistoryItem={handleAddHistoryItem} />
          )}

          {activeTab === 'image-resize' && (
            <ImageTools toolType="resize" onAddHistoryItem={handleAddHistoryItem} />
          )}

          {activeTab === 'image-crop' && (
            <ImageCrop onAddHistoryItem={handleAddHistoryItem} />
          )}

          {activeTab === 'image-rotate' && (
            <ImageRotate onAddHistoryItem={handleAddHistoryItem} />
          )}

          {activeTab === 'image-ocr' && (
            <ImageOcr onAddHistoryItem={handleAddHistoryItem} />
          )}

          {activeTab === 'image-remove-bg' && (
            <ImageRemoveBg onAddHistoryItem={handleAddHistoryItem} />
          )}

          {activeTab === 'image-editor' && (
            <ImageEditor onAddHistoryItem={handleAddHistoryItem} />
          )}

          {activeTab === 'image-batch' && (
            <ImageBatch onAddHistoryItem={handleAddHistoryItem} />
          )}

          {activeTab === 'image-metadata' && (
            <ImageMetadata lang={lang} />
          )}

          {activeTab === 'image-color-extractor' && (
            <ImageColorExtractor lang={lang} />
          )}

          {activeTab === 'image-splitter' && (
            <ImageSplitter lang={lang} />
          )}

          {activeTab === 'image-collage' && (
            <ImageCollage lang={lang} />
          )}

          {activeTab === 'base64-tool' && (
            <Base64Tool lang={lang} />
          )}

          {activeTab === 'image-comparator' && (
            <ImageComparator lang={lang} />
          )}

          {activeTab === 'smart-tools' && (
            <SmartTools />
          )}

          {activeTab === 'pdf-merge' && (
            <PdfTools toolType="merge" onAddHistoryItem={handleAddHistoryItem} />
          )}

          {activeTab === 'pdf-split' && (
            <PdfTools toolType="split" onAddHistoryItem={handleAddHistoryItem} />
          )}

          {activeTab === 'pdf-to-img' && (
            <PdfTools toolType="to-img" onAddHistoryItem={handleAddHistoryItem} />
          )}

          {activeTab === 'pdf-extract-text' && (
            <PdfExtractText onAddHistoryItem={handleAddHistoryItem} />
          )}

          {activeTab === 'pdf-edit' && (
            <PdfEdit onAddHistoryItem={handleAddHistoryItem} />
          )}

          {activeTab === 'pdf-protect' && (
            <PDFProtect lang={lang} onAddHistoryItem={handleAddHistoryItem} />
          )}

          {activeTab === 'pdf-unlock' && (
            <PDFUnlock lang={lang} onAddHistoryItem={handleAddHistoryItem} />
          )}

          {activeTab === 'pdf-form-filler' && (
            <PDFFormFiller lang={lang} onAddHistoryItem={handleAddHistoryItem} />
          )}

          {activeTab === 'pdf-page-number' && (
            <PDFPageNumber lang={lang} onAddHistoryItem={handleAddHistoryItem} />
          )}

          {activeTab === 'pdf-header-footer' && (
            <PDFHeaderFooter lang={lang} onAddHistoryItem={handleAddHistoryItem} />
          )}

          {activeTab === 'pdf-repair' && (
            <PDFRepair lang={lang} onAddHistoryItem={handleAddHistoryItem} />
          )}

          {activeTab === 'ocr-business-card' && (
            <BusinessCardScanner lang={lang} onAddHistoryItem={handleAddHistoryItem} />
          )}

          {activeTab === 'ocr-table-extractor' && (
            <TableExtractor lang={lang} onAddHistoryItem={handleAddHistoryItem} />
          )}

          {activeTab === 'ocr-searchable-pdf' && (
            <ImageToSearchablePDF lang={lang} onAddHistoryItem={handleAddHistoryItem} />
          )}

          {activeTab === 'ocr-multi-language' && (
            <MultiLanguageOCR lang={lang} onAddHistoryItem={handleAddHistoryItem} />
          )}

          {activeTab === 'ocr-receipt' && (
            <ReceiptScanner lang={lang} onAddHistoryItem={handleAddHistoryItem} />
          )}

          {activeTab === 'ai-object-detection' && (
            <ObjectDetector lang={lang} onAddHistoryItem={handleAddHistoryItem} />
          )}

          {activeTab === 'ai-photo-restoration' && (
            <PhotoRestorer lang={lang} onAddHistoryItem={handleAddHistoryItem} />
          )}

          {activeTab === 'ai-face-detection' && (
            <FaceDetection lang={lang} onAddHistoryItem={handleAddHistoryItem} />
          )}

          {activeTab === 'ai-image-search' && (
            <ImageSearch lang={lang} />
          )}

          {activeTab === 'ai-text-similarity' && (
            <TextSimilarity lang={lang} />
          )}

          {activeTab === 'ai-document-classification' && (
            <DocumentClassifier lang={lang} />
          )}

          {activeTab === 'batch-renamer' && (
            <BatchRenamer lang={lang} onAddHistoryItem={handleAddHistoryItem} />
          )}

          {activeTab === 'qr-generator' && (
            <QRGenerator lang={lang} onAddHistoryItem={handleAddHistoryItem} />
          )}

          {activeTab === 'csv-editor' && (
            <CSVEditor lang={lang} onAddHistoryItem={handleAddHistoryItem} />
          )}

          {activeTab === 'json-formatter' && (
            <JSONFormatter lang={lang} onAddHistoryItem={handleAddHistoryItem} />
          )}

          {activeTab === 'chart-generator' && (
            <ChartGenerator lang={lang} onAddHistoryItem={handleAddHistoryItem} />
          )}

          {activeTab === 'data-extractor' && (
            <DataExtractor lang={lang} onAddHistoryItem={handleAddHistoryItem} />
          )}

          {activeTab === 'unit-converter' && (
            <UnitConverter lang={lang} onAddHistoryItem={handleAddHistoryItem} />
          )}

          {activeTab === 'meme-generator' && (
            <MemeGenerator lang={lang} onAddHistoryItem={handleAddHistoryItem} />
          )}

          {activeTab === 'certificate-maker' && (
            <CertificateMaker lang={lang} onAddHistoryItem={handleAddHistoryItem} />
          )}

          {activeTab === 'social-media-banner' && (
            <SocialMediaBanner lang={lang} onAddHistoryItem={handleAddHistoryItem} />
          )}

          {activeTab === 'gradient-generator' && (
            <GradientGenerator lang={lang} onAddHistoryItem={handleAddHistoryItem} />
          )}

          {activeTab === 'palette-generator' && (
            <PaletteGenerator lang={lang} onAddHistoryItem={handleAddHistoryItem} />
          )}

          {activeTab === 'file-info' && (
            <FileInfo lang={lang} />
          )}

          {activeTab === 'file-comparator' && (
            <FileComparator lang={lang} />
          )}

          {activeTab === 'favorites-manager' && (
            <FavoritesManager 
              lang={lang} 
              favorites={favorites} 
              onToggleFavorite={toggleFavorite} 
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'history' && (
            <HistoryDashboard 
              lang={lang}
              history={processedHistory} 
              onClearHistory={handleClearHistory} 
              onRemoveHistoryItem={handleDeleteHistoryItem} 
            />
          )}

          {activeTab === 'guide' && (
            <GuideCenter 
              lang={lang}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'text-diff' && (
            <TextDiff lang={lang} onAddHistoryItem={handleAddHistoryItem} />
          )}

          {activeTab === 'text-formatter' && (
            <TextFormatter lang={lang} onAddHistoryItem={handleAddHistoryItem} />
          )}

          {activeTab === 'markdown-editor' && (
            <MarkdownEditor lang={lang} onAddHistoryItem={handleAddHistoryItem} />
          )}

          {activeTab === 'text-to-speech' && (
            <TextToSpeech lang={lang} onAddHistoryItem={handleAddHistoryItem} />
          )}

          {activeTab === 'speech-to-text' && (
            <SpeechToText lang={lang} onAddHistoryItem={handleAddHistoryItem} />
          )}

          {activeTab === 'password-generator' && (
            <PasswordGenerator lang={lang} onAddHistoryItem={handleAddHistoryItem} />
          )}

          {/* Video & Multimedia Lazy Loaded Sections */}
          <React.Suspense fallback={
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-3 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/50">
              <div className="w-8 h-8 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
              <span className="text-xs text-slate-500 font-extrabold">
                {settings.language === 'ar' ? 'جاري تهيئة وتحميل أداة الوسائط...' : 'Configuring and streaming dynamic media assets...'}
              </span>
            </div>
          }>
            {activeTab === 'video-to-gif' && (
              <VideoToGIF lang={lang} onAddHistoryItem={handleAddHistoryItem as any} />
            )}

            {activeTab === 'gif-editor' && (
              <GIFEditor lang={lang} onAddHistoryItem={handleAddHistoryItem as any} />
            )}

            {activeTab === 'video-compressor' && (
              <VideoCompressor lang={lang} onAddHistoryItem={handleAddHistoryItem as any} />
            )}

            {activeTab === 'audio-extractor' && (
              <AudioExtractor lang={lang} onAddHistoryItem={handleAddHistoryItem as any} />
            )}

            {activeTab === 'video-to-images' && (
              <VideoToImages lang={lang} onAddHistoryItem={handleAddHistoryItem as any} />
            )}

            {activeTab === 'screen-recorder' && (
              <ScreenRecorder lang={lang} onAddHistoryItem={handleAddHistoryItem as any} />
            )}

            {activeTab === 'webcam-capture' && (
              <WebcamCapture lang={lang} onAddHistoryItem={handleAddHistoryItem as any} />
            )}

            {activeTab === 'media-info' && (
              <MediaInfo lang={lang} onAddHistoryItem={handleAddHistoryItem as any} />
            )}
          </React.Suspense>

          {/* Core Footer Info Badge */}
          <footer className="pt-6 border-t border-purple-100/50 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400 transition-colors">
            <p>© {new Date().getFullYear()} {t.appCopyright}</p>
            <div className="flex items-center gap-4 font-bold">
              <span className="flex items-center gap-1"><Zap className="w-4 h-4 text-amber-500 animate-pulse" /> {t.statsSpeed}</span>
              <span className="flex items-center gap-1"><HardDrive className="w-4 h-4 text-purple-500" /> {t.statsUsage}</span>
            </div>
          </footer>

        </div>
      </main>
    </div>
  );
}

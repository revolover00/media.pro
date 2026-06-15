import React from 'react';
import { 
  RefreshCw, 
  FileImage, 
  Maximize2, 
  Minimize2,
  Files, 
  Scissors, 
  Image as ImageIcon, 
  History, 
  Menu, 
  X,
  FileText,
  Crop,
  RotateCw,
  Type,
  Layers,
  Sparkles,
  Wand2,
  Palette,
  Images,
  Cpu,
  LayoutDashboard,
  Star,
  HelpCircle,
  Info,
  Grid,
  Layout,
  Code,
  ArrowLeftRight,
  Pipette,
  Lock,
  Unlock,
  PenTool,
  Hash,
  Heading,
  Wrench,
  Contact,
  Table,
  FileSearch,
  Languages,
  Receipt,
  Search,
  Users,
  Scale,
  FolderSync,
  Eye,
  QrCode,
  GitCompare,
  Fingerprint,
  Share2,
  Trash2,
  Keyboard
} from 'lucide-react';
import { TabId } from '../types';
import { Video, Music, Camera, Tv, AlignLeft, BookOpen, Volume2, Mic, KeyRound } from 'lucide-react';
import { translations } from '../translations';

interface SidebarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  lang: 'ar' | 'en';
  favorites: string[];
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  isOpen, 
  setIsOpen,
  lang,
  favorites
}) => {
  const t = translations[lang];

  const menuItems = [
    {
      id: 'universal-converter' as TabId,
      label: t.sidebar.universalConverter || "المحول الشامل لكافة التنسيقات",
      icon: RefreshCw,
      category: 'utilities'
    },
    {
      id: 'dashboard' as TabId,
      label: t.sidebar.dashboard,
      icon: LayoutDashboard,
      category: 'main'
    },
    {
      id: 'image-convert' as TabId,
      label: t.sidebar.imageConvert,
      icon: RefreshCw,
      category: 'image'
    },
    {
      id: 'image-compress' as TabId,
      label: t.sidebar.imageCompress,
      icon: FileImage,
      category: 'image'
    },
    {
      id: 'image-resize' as TabId,
      label: t.sidebar.imageResize,
      icon: Maximize2,
      category: 'image'
    },
    {
      id: 'image-crop' as TabId,
      label: t.sidebar.imageCrop,
      icon: Crop,
      category: 'image'
    },
    {
      id: 'image-rotate' as TabId,
      label: t.sidebar.imageRotate,
      icon: RotateCw,
      category: 'image'
    },
    {
      id: 'image-ocr' as TabId,
      label: t.sidebar.imageOcr,
      icon: Sparkles,
      category: 'image'
    },
    {
      id: 'image-remove-bg' as TabId,
      label: t.sidebar.imageRemoveBg,
      icon: Wand2,
      category: 'image'
    },
    {
      id: 'image-editor' as TabId,
      label: t.sidebar.imageEditor,
      icon: Palette,
      category: 'image'
    },
    {
      id: 'image-batch' as TabId,
      label: t.sidebar.imageBatch,
      icon: Images,
      category: 'image'
    },
    {
      id: 'image-metadata' as TabId,
      label: t.sidebar.imageMetadata,
      icon: Info,
      category: 'image'
    },
    {
      id: 'image-color-extractor' as TabId,
      label: t.sidebar.imageColorExtractor,
      icon: Pipette,
      category: 'image'
    },
    {
      id: 'image-splitter' as TabId,
      label: t.sidebar.imageSplitter,
      icon: Grid,
      category: 'image'
    },
    {
      id: 'image-collage' as TabId,
      label: t.sidebar.imageCollage,
      icon: Layout,
      category: 'image'
    },
    {
      id: 'base64-tool' as TabId,
      label: t.sidebar.base64Tool,
      icon: Code,
      category: 'image'
    },
    {
      id: 'image-comparator' as TabId,
      label: t.sidebar.imageComparator,
      icon: ArrowLeftRight,
      category: 'image'
    },
    {
      id: 'smart-tools' as TabId,
      label: t.sidebar.smartTools,
      icon: Cpu,
      category: 'smart'
    },
    {
      id: 'ocr-business-card' as TabId,
      label: t.sidebar.ocrBusinessCard,
      icon: Contact,
      category: 'smart'
    },
    {
      id: 'ocr-table-extractor' as TabId,
      label: t.sidebar.ocrTableExtractor,
      icon: Table,
      category: 'smart'
    },
    {
      id: 'ocr-searchable-pdf' as TabId,
      label: t.sidebar.ocrSearchablePdf,
      icon: FileSearch,
      category: 'smart'
    },
    {
      id: 'ocr-multi-language' as TabId,
      label: t.sidebar.ocrMultiLanguage,
      icon: Languages,
      category: 'smart'
    },
    {
      id: 'ocr-receipt' as TabId,
      label: t.sidebar.ocrReceipt,
      icon: Receipt,
      category: 'smart'
    },
    {
      id: 'ai-object-detection' as TabId,
      label: t.sidebar.aiObjectDetection,
      icon: Cpu,
      category: 'smart'
    },
    {
      id: 'ai-photo-restoration' as TabId,
      label: t.sidebar.aiPhotoRestoration,
      icon: Eye,
      category: 'smart'
    },
    {
      id: 'ai-face-detection' as TabId,
      label: t.sidebar.aiFaceDetection,
      icon: Users,
      category: 'smart'
    },
    {
      id: 'ai-image-search' as TabId,
      label: t.sidebar.aiImageSearch,
      icon: Search,
      category: 'smart'
    },
    {
      id: 'ai-text-similarity' as TabId,
      label: t.sidebar.aiTextSimilarity,
      icon: Scale,
      category: 'smart'
    },
    {
      id: 'ai-document-classification' as TabId,
      label: t.sidebar.aiDocumentClassification,
      icon: FolderSync,
      category: 'smart'
    },
    {
      id: 'pdf-merge' as TabId,
      label: t.sidebar.pdfMerge,
      icon: Files,
      category: 'pdf'
    },
    {
      id: 'pdf-split' as TabId,
      label: t.sidebar.pdfSplit,
      icon: Scissors,
      category: 'pdf'
    },
    {
      id: 'pdf-to-img' as TabId,
      label: t.sidebar.pdfToImg,
      icon: ImageIcon,
      category: 'pdf'
    },
    {
      id: 'pdf-extract-text' as TabId,
      label: t.sidebar.pdfExtractText,
      icon: Type,
      category: 'pdf'
    },
    {
      id: 'pdf-edit' as TabId,
      label: t.sidebar.pdfEdit,
      icon: Layers,
      category: 'pdf'
    },
    {
      id: 'pdf-protect' as TabId,
      label: t.sidebar.pdfProtect,
      icon: Lock,
      category: 'pdf'
    },
    {
      id: 'pdf-unlock' as TabId,
      label: t.sidebar.pdfUnlock,
      icon: Unlock,
      category: 'pdf'
    },
    {
      id: 'pdf-form-filler' as TabId,
      label: t.sidebar.pdfFormFiller,
      icon: PenTool,
      category: 'pdf'
    },
    {
      id: 'pdf-page-number' as TabId,
      label: t.sidebar.pdfPageNumber,
      icon: Hash,
      category: 'pdf'
    },
    {
      id: 'pdf-header-footer' as TabId,
      label: t.sidebar.pdfHeaderFooter,
      icon: Heading,
      category: 'pdf'
    },
    {
      id: 'pdf-repair' as TabId,
      label: t.sidebar.pdfRepair,
      icon: Wrench,
      category: 'pdf'
    },
    {
      id: 'file-encryptor' as TabId,
      label: t.sidebar.fileEncryptor,
      icon: Lock,
      category: 'security'
    },
    {
      id: 'file-decryptor' as TabId,
      label: t.sidebar.fileDecryptor,
      icon: Unlock,
      category: 'security'
    },
    {
      id: 'metadata-scrubber' as TabId,
      label: t.sidebar.metadataScrubber,
      icon: Eye,
      category: 'security'
    },
    {
      id: 'file-shredder' as TabId,
      label: t.sidebar.fileShredder,
      icon: Trash2,
      category: 'security'
    },
    {
      id: 'steganography-tool' as TabId,
      label: t.sidebar.steganographyTool,
      icon: Eye,
      category: 'security'
    },
    {
      id: 'batch-renamer' as TabId,
      label: t.sidebar.batchRenamer,
      icon: FolderSync,
      category: 'utilities'
    },
    {
      id: 'qr-generator' as TabId,
      label: t.sidebar.qrGenerator,
      icon: QrCode,
      category: 'other'
    },
    {
      id: 'file-info' as TabId,
      label: t.sidebar.fileInfo,
      icon: Fingerprint,
      category: 'utilities'
    },
    {
      id: 'file-comparator' as TabId,
      label: t.sidebar.fileComparator,
      icon: GitCompare,
      category: 'utilities'
    },
    {
      id: 'favorites-manager' as TabId,
      label: t.sidebar.favoritesManager,
      icon: Star,
      category: 'utilities'
    },
    {
      id: 'share-menu' as TabId,
      label: t.sidebar.shareMenu,
      icon: Share2,
      category: 'utilities'
    },
    {
      id: 'onboarding' as TabId,
      label: t.sidebar.onboarding,
      icon: Sparkles,
      category: 'utilities'
    },
    {
      id: 'keyboard-shortcuts' as TabId,
      label: t.sidebar.keyboardShortcuts,
      icon: Keyboard,
      category: 'utilities'
    },
    {
      id: 'history' as TabId,
      label: t.sidebar.history,
      icon: History,
      category: 'other'
    },
    {
      id: 'guide' as TabId,
      label: t.sidebar.guide,
      icon: HelpCircle,
      category: 'other'
    },
    {
      id: 'video-to-gif' as TabId,
      label: t.sidebar.videoToGIF,
      icon: Video,
      category: 'media'
    },
    {
      id: 'gif-editor' as TabId,
      label: t.sidebar.gifEditor,
      icon: Layers,
      category: 'media'
    },
    {
      id: 'video-compressor' as TabId,
      label: t.sidebar.videoCompressor,
      icon: Minimize2,
      category: 'media'
    },
    {
      id: 'audio-extractor' as TabId,
      label: t.sidebar.audioExtractor,
      icon: Music,
      category: 'media'
    },
    {
      id: 'video-to-images' as TabId,
      label: t.sidebar.videoToImages,
      icon: Images,
      category: 'media'
    },
    {
      id: 'screen-recorder' as TabId,
      label: t.sidebar.screenRecorder,
      icon: Tv,
      category: 'media'
    },
    {
      id: 'webcam-capture' as TabId,
      label: t.sidebar.webcamCapture,
      icon: Camera,
      category: 'media'
    },
    {
      id: 'media-info' as TabId,
      label: t.sidebar.mediaInfo,
      icon: Info,
      category: 'media'
    },
    {
      id: 'text-diff' as TabId,
      label: t.sidebar.textDiff,
      icon: GitCompare,
      category: 'text'
    },
    {
      id: 'text-formatter' as TabId,
      label: t.sidebar.textFormatter,
      icon: AlignLeft,
      category: 'text'
    },
    {
      id: 'markdown-editor' as TabId,
      label: t.sidebar.markdownEditor,
      icon: BookOpen,
      category: 'text'
    },
    {
      id: 'text-to-speech' as TabId,
      label: t.sidebar.textToSpeech,
      icon: Volume2,
      category: 'text'
    },
    {
      id: 'speech-to-text' as TabId,
      label: t.sidebar.speechToText,
      icon: Mic,
      category: 'text'
    },
    {
      id: 'password-generator' as TabId,
      label: t.sidebar.passwordGenerator,
      icon: KeyRound,
      category: 'text'
    },
    {
      id: 'csv-editor' as TabId,
      label: t.sidebar.csvEditor,
      icon: Table,
      category: 'data'
    },
    {
      id: 'json-formatter' as TabId,
      label: t.sidebar.jsonFormatter,
      icon: Code,
      category: 'data'
    },
    {
      id: 'chart-generator' as TabId,
      label: t.sidebar.chartGenerator,
      icon: Grid,
      category: 'data'
    },
    {
      id: 'data-extractor' as TabId,
      label: t.sidebar.dataExtractor,
      icon: FileSearch,
      category: 'data'
    },
    {
      id: 'unit-converter' as TabId,
      label: t.sidebar.unitConverter,
      icon: Scale,
      category: 'data'
    },
    {
      id: 'meme-generator' as TabId,
      label: t.sidebar.memeGenerator,
      icon: Wand2,
      category: 'design'
    },
    {
      id: 'certificate-maker' as TabId,
      label: t.sidebar.certificateMaker,
      icon: PenTool,
      category: 'design'
    },
    {
      id: 'social-media-banner' as TabId,
      label: t.sidebar.socialMediaBanner,
      icon: Layout,
      category: 'design'
    },
    {
      id: 'gradient-generator' as TabId,
      label: t.sidebar.gradientGenerator,
      icon: Palette,
      category: 'design'
    },
    {
      id: 'palette-generator' as TabId,
      label: t.sidebar.paletteGenerator,
      icon: Layers,
      category: 'design'
    },
  ];

  const categories = [
    { key: 'main', label: lang === 'ar' ? 'الرئيسية' : 'Main' },
    { key: 'image', label: t.categories.image },
    { key: 'smart', label: t.categories.smart },
    { key: 'pdf', label: t.categories.pdf },
    { key: 'media', label: t.categories.media },
    { key: 'text', label: t.categories.text },
    { key: 'data', label: t.categories.data },
    { key: 'design', label: t.categories.design },
    { key: 'security', label: t.categories.security },
    { key: 'utilities', label: t.categories.utilities },
    { key: 'other', label: t.categories.other }
  ];

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-45 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main Sidebar Element */}
      <aside className={`
        fixed inset-y-0 z-45 flex flex-col w-72 bg-gradient-to-b from-purple-950 to-indigo-950 text-white shadow-2xl transition-transform duration-300
        md:sticky md:top-0 md:h-screen md:translate-x-0
        ${isOpen ? 'translate-x-0' : (lang === 'en' ? '-translate-x-full' : 'translate-x-full')}
        ${lang === 'en' ? 'left-0 right-auto md:border-r md:border-purple-800/40' : 'right-0 left-auto md:border-l md:border-purple-800/40'}
      `}>
        <div className="hidden md:flex items-center gap-3 p-6 border-b border-purple-800/40 shrink-0">
          <div className="bg-gradient-to-tr from-purple-500 to-indigo-500 p-2.5 rounded-2xl shadow-lg">
            <FileText className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              {t.appName}
            </h1>
            <p className="text-[10px] text-purple-300 font-bold">{t.tagline}</p>
          </div>
        </div>

        {/* Sidebar Nav items */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {categories.map((cat) => {
            const items = menuItems.filter(item => item.category === cat.key);
            if (items.length === 0) return null;

            return (
              <div key={cat.key} className="space-y-1.5">
                <h3 className="px-3 text-[10px] font-extrabold text-purple-300/50 uppercase tracking-widest flex items-center justify-between">
                  <span>{cat.label}</span>
                  <span className="bg-purple-900/60 text-[9px] text-purple-300 px-1.5 py-0.5 rounded-full font-mono font-bold">{items.length}</span>
                </h3>
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    const isPinned = favorites.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        id={`nav-${item.id}`}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsOpen(false);
                        }}
                        className={`
                          w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-150 group cursor-pointer
                          ${isActive 
                            ? 'bg-gradient-to-r from-purple-600/90 to-indigo-600/90 text-white shadow-md font-black' 
                            : 'text-purple-300 hover:bg-white/5 hover:text-white'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'text-purple-200' : 'text-purple-400'}`} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {isPinned && item.id !== 'dashboard' && item.id !== 'history' && (
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-purple-800/40 text-center shrink-0">
          <p className="text-[9px] text-purple-400 font-mono font-bold">{t.sidebar.version}</p>
        </div>
      </aside>
    </>
  );
};

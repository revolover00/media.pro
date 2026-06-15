import React, { useState, useEffect } from 'react';
import { 
  Search, Star, ShieldCheck, Zap, HardDrive, Cpu, 
  RefreshCw, FileImage, Maximize2, Minimize2, Crop, RotateCw, 
  Sparkles, Wand2, Palette, Images, Files, Scissors, 
  Image as ImageIcon, Type, Layers, Info, Lock, Unlock, PenTool, Hash, Heading, Wrench, Contact, Table, FileSearch, Languages, Receipt,
  FolderSync, QrCode, Fingerprint, GitCompare,
  Video, Music, Camera, Tv, AlignLeft, BookOpen, Volume2, Mic, KeyRound, Eye, Trash2, Share2
} from 'lucide-react';
import { TabId } from '../types';
import { translations } from '../translations';

interface DashboardProps {
  lang: 'ar' | 'en';
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  setActiveTab: (tab: TabId) => void;
  historyLength: number;
}

export const Dashboard: React.FC<DashboardProps> = ({
  lang,
  favorites,
  onToggleFavorite,
  setActiveTab,
  historyLength,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'image' | 'pdf' | 'smart' | 'media' | 'text' | 'other'>('all');
  const [pwaPrompt, setPwaPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // Virtual statistics that increment based on user actions
  const [stats, setStats] = useState({
    filesProcessed: 0,
    spaceSaved: '0 KB',
  });

  const t = translations[lang];

  useEffect(() => {
    // Read actual count from localStorage or fallback
    const localTotal = localStorage.getItem('promedia_total_processed_count');
    const totalCount = localTotal ? parseInt(localTotal) : 0;
    
    // Read size saved from history
    let savedBytes = 0;
    const storedHistory = localStorage.getItem('promedia_history');
    if (storedHistory) {
      try {
        const hist = JSON.parse(storedHistory);
        hist.forEach((item: any) => {
          if (item.originalSize && item.processedSize) {
            savedBytes += Math.max(0, item.originalSize - item.processedSize);
          }
        });
      } catch (e) {
        console.error(e);
      }
    }

    const formatSize = (bytes: number) => {
      if (bytes === 0) return lang === 'ar' ? '٠ ك.ب' : '0 KB';
      const kbs = bytes / 1024;
      if (kbs < 1024) return `${kbs.toFixed(1)} KB`;
      return `${(kbs / 1024).toFixed(1)} MB`;
    };

    setStats({
      filesProcessed: Math.max(historyLength, totalCount, 0),
      spaceSaved: formatSize(savedBytes),
    });

    // PWA Prompt capture
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setPwaPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    
    // Detect if already standalone
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, [historyLength, lang]);

  const handleInstallPwa = async () => {
    if (!pwaPrompt) return;
    pwaPrompt.prompt();
    const { outcome } = await pwaPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setPwaPrompt(null);
    }
  };

  const toolsData = [
    {
      id: 'universal-converter' as TabId,
      label: isAr ? "المحول الشامل لكافة التنسيقات" : "Universal Format Converter",
      descAr: "تحويل جميع الملفات والتنسيقات من وإلى أي نوع متاح محلياً بسلاسة.",
      descEn: "Convert literally all extensions from any file format to your target format effortlessly.",
      icon: RefreshCw,
      color: "from-blue-600 to-indigo-700",
      bgLight: "bg-blue-50 border-blue-100 text-blue-700",
      category: "utilities" as const
    },
    {
      id: 'file-encryptor' as TabId,
      label: t.sidebar.fileEncryptor,
      descAr: "تشفير عسكري للملفات الخاصة بكلمات مرور محمية غير قابلة للاختراق.",
      descEn: "Military-grade file encryption using AES block ciphers with secure password barriers.",
      icon: Lock,
      color: "from-stone-600 to-slate-800",
      bgLight: "bg-slate-50 border-slate-200 text-slate-800",
      category: "security" as const
    },
    {
      id: 'file-decryptor' as TabId,
      label: t.sidebar.fileDecryptor,
      descAr: "فك تشفير الملفات المقفلة واستعادة البيانات بأمان وفعالية.",
      descEn: "Decrypt securely locked local files instantly to restore original data.",
      icon: Unlock,
      color: "from-stone-500 to-slate-700",
      bgLight: "bg-slate-50 border-slate-200 text-slate-700",
      category: "security" as const
    },
    {
      id: 'metadata-scrubber' as TabId,
      label: t.sidebar.metadataScrubber,
      descAr: "حذف وطمس بصمات وتعقب الميتا داتا وصور المصورين وبيانات أجهزة الجوال من الصور.",
      descEn: "Wipe sensitive EXIF headers, GPS fingerprints, and hardware metadata efficiently.",
      icon: ShieldCheck,
      color: "from-blue-600 to-slate-700",
      bgLight: "bg-blue-50 border-blue-100 text-blue-700",
      category: "security" as const
    },
    {
      id: 'file-shredder' as TabId,
      label: t.sidebar.fileShredder,
      descAr: "تدمير وتمزيق ومسح الملفات الحساسة بحيث لا يمكن استعادتها بواسطة أية برامج نهائياً.",
      descEn: "Secure wipe and permanent multi-layer shredding of highly sensitive materials.",
      icon: Trash2,
      color: "from-red-600 to-rose-700",
      bgLight: "bg-red-50 border-red-100 text-red-700",
      category: "security" as const
    },
    {
      id: 'steganography-tool' as TabId,
      label: t.sidebar.steganographyTool,
      descAr: "إخفاء النصوص والمستندات السرية داخل صور عادية غير ملفتة وتشفيرها.",
      descEn: "Hide confidential messages invisibly deep inside normal image carrier pixels.",
      icon: Eye,
      color: "from-violet-600 to-purple-800",
      bgLight: "bg-violet-50 border-violet-100 text-violet-700",
      category: "security" as const
    },
    {
      id: 'share-menu' as TabId,
      label: t.sidebar.shareMenu,
      descAr: "مشاركة وتوليد روابط سريعة ولون مباشر ونقل سريع للملفات من متصفحك.",
      descEn: "Generate quick shareable links or broadcast items via social API pathways securely.",
      icon: Share2,
      color: "from-teal-500 to-emerald-600",
      bgLight: "bg-teal-50 border-teal-100 text-teal-700",
      category: "other" as const
    },
    {
      id: 'image-convert' as TabId,
      label: t.sidebar.imageConvert,
      descAr: "تحويل جميع امتدادات وملفات الصور المتاحة (أي نوع لأي نوع) بحرية.",
      descEn: "Convert all image formats from any to any entirely instantly.",
      icon: RefreshCw,
      color: "from-blue-500 to-sky-500",
      bgLight: "bg-blue-50/70 border-blue-100/60 text-blue-600",
      category: "image" as const
    },
    {
      id: 'image-compress' as TabId,
      label: t.sidebar.imageCompress,
      descAr: "ضغط كلي لحجم الصور لتقليل استهلاك مساحات القرص بنسبة تصل إلى 90٪.",
      descEn: "Compress images heavily to reduce disk usage footprint by up to 90%.",
      icon: FileImage,
      color: "from-indigo-500 to-purple-500",
      bgLight: "bg-indigo-50/70 border-indigo-100/60 text-indigo-600",
      category: "image" as const
    },
    {
      id: 'image-resize' as TabId,
      label: t.sidebar.imageResize,
      descAr: "تغيير دقيق لأبعاد الطول والعرض للصور بكسل بكسل أو كنسبة مئوية.",
      descEn: "Modify precise height & width pixel boundaries or scale percentage of your photos.",
      icon: Maximize2,
      color: "from-cyan-500 to-teal-500",
      bgLight: "bg-cyan-50/70 border-cyan-100/60 text-cyan-600",
      category: "image" as const
    },
    {
      id: 'image-crop' as TabId,
      label: t.sidebar.imageCrop,
      descAr: "قص فوري لأطراف الصور وتعديل نسب العرض لليوتيوب، تويتر وباقي القنوات.",
      descEn: "Crop borders or choose customized aspect ratios optimized for socials & web.",
      icon: Crop,
      color: "from-orange-500 to-amber-500",
      bgLight: "bg-orange-50/70 border-orange-100/60 text-orange-600",
      category: "image" as const
    },
    {
      id: 'image-rotate' as TabId,
      label: t.sidebar.imageRotate,
      descAr: "تدوير بزاوية 90، 180، أو عكس عمودي وأفقي بلمسة زر سريعة.",
      descEn: "Rotate by 90/180 degrees, or flip horizontally/vertically in high speed.",
      icon: RotateCw,
      color: "from-emerald-500 to-green-500",
      bgLight: "bg-emerald-50/70 border-emerald-100/60 text-emerald-600",
      category: "image" as const
    },
    {
      id: 'image-ocr' as TabId,
      label: t.sidebar.imageOcr,
      descAr: "استخراج نصوص دقيقة باللغة العربية والإنجليزية من داخل الصور والملفات الممسوحة.",
      descEn: "Extract Arabic & English text from scanned files using highly accurate OCR.",
      icon: Sparkles,
      color: "from-pink-500 to-rose-500",
      bgLight: "bg-pink-50/70 border-pink-100/60 text-pink-600",
      category: "image" as const
    },
    {
      id: 'image-remove-bg' as TabId,
      label: t.sidebar.imageRemoveBg,
      descAr: "عزل وتفريغ خلفية أي صورة ممتعة بالذكاء الاصطناعي على جهازك بالسرعة واللمح البصري.",
      descEn: "Erase photo backgrounds on-screen using advanced client-side intelligence.",
      icon: Wand2,
      color: "from-violet-500 to-fuchsia-500",
      bgLight: "bg-violet-50/70 border-violet-100/60 text-violet-600",
      category: "image" as const
    },
    {
      id: 'image-editor' as TabId,
      label: t.sidebar.imageEditor,
      descAr: "تعديل احترافي متكامل: تباين، إضاءة، تشبع، فلاتر سينمائية وإمضاء خاص.",
      descEn: "Complete photo suite: contrast, filters, brightness, annotations, and signatures.",
      icon: Palette,
      color: "from-purple-500 to-pink-500",
      bgLight: "bg-purple-50/70 border-purple-100/60 text-purple-600",
      category: "image" as const
    },
    {
      id: 'image-batch' as TabId,
      label: t.sidebar.imageBatch,
      descAr: "معالج الدفعات الفائق: ارفع وضغط وحوّل حتى 50 صورة دفعة واحدة مع التنزيل بصيغة ZIP.",
      descEn: "Ultimate bulk builder: Resize, convert & compress up to 50 assets merged in a ZIP.",
      icon: Images,
      color: "from-lime-500 to-emerald-500",
      bgLight: "bg-lime-50/70 border-lime-100/60 text-lime-600",
      category: "image" as const
    },
    {
      id: 'smart-tools' as TabId,
      label: t.sidebar.smartTools,
      descAr: "مختبر النماذج الذكية المحلية: تلخيص ذكي، أسئلة وأجوبة، وتصنيف المستندات دون إنترنت.",
      descEn: "Offline AI lab: Summarize text, answer questions (RAG) & tag data securely.",
      icon: Cpu,
      color: "from-indigo-600 to-blue-600",
      bgLight: "bg-purple-50/70 border-purple-200 text-purple-700",
      category: "smart" as const
    },
    {
      id: 'ocr-business-card' as TabId,
      label: t.sidebar.ocrBusinessCard,
      descAr: "مسح فوري ذكي لبطاقات العمل، استخراج بيانات الاتصال كاملة وتصديرها كملف جهة اتصال VCF محلياً.",
      descEn: "Instantly scan business cards. Extract all contact info and export as a standard vCard (VCF) file locally.",
      icon: Contact,
      color: "from-blue-600 to-indigo-700",
      bgLight: "bg-blue-50/70 border-blue-100 text-blue-700",
      category: "smart" as const
    },
    {
      id: 'ocr-table-extractor' as TabId,
      label: t.sidebar.ocrTableExtractor,
      descAr: "التعرف الذكي على الجداول في الصور، استخراج الخلايا والصفوف ومطابقتها مع إمكانية تصديرها لـ Excel أو CSV أو JSON.",
      descEn: "Detect sheets & tables inside images, index cells dynamically, edit values, and export as CSV/Excel/JSON.",
      icon: Table,
      color: "from-emerald-600 to-teal-700",
      bgLight: "bg-emerald-50/75 border-emerald-100 text-emerald-700",
      category: "smart" as const
    },
    {
      id: 'ocr-searchable-pdf' as TabId,
      label: t.sidebar.ocrSearchablePdf,
      descAr: "تحويل وثائق PDF الممسوحة ضوئياً والقرطاسية إلى صيغة PDF محددة وقابلة للبحث وتحديد الخلايا والنصوص.",
      descEn: "Turn scanned pages/images into fully interactive, indexable, and searchable PDF documents easily.",
      icon: FileSearch,
      color: "from-teal-600 to-cyan-700",
      bgLight: "bg-teal-50/70 border-teal-100 text-teal-700",
      category: "smart" as const
    },
    {
      id: 'ocr-multi-language' as TabId,
      label: t.sidebar.ocrMultiLanguage,
      descAr: "التعرف الضوئي على النصوص بأكثر من 100 لغة معاً مع إمكانية خلط ومطابقة لغات متعددة في آن واحد مع ترجمة فورية.",
      descEn: "Identify characters across 100+ languages simultaneously with customizable composite-language models and instant translation.",
      icon: Languages,
      color: "from-purple-600 to-pink-700",
      bgLight: "bg-purple-50/70 border-purple-100 text-purple-700",
      category: "smart" as const
    },
    {
      id: 'ocr-receipt' as TabId,
      label: t.sidebar.ocrReceipt,
      descAr: "مسح الفواتير والإيصالات مالياً، استخراج أسماء المتاجر والتواريخ والمجاميع والضرائب تلقائياً ببيانات رقمية.",
      descEn: "Analyze receipts & invoices, auto-extract store metadata, items, tax figures, & totals into structured layouts.",
      icon: Receipt,
      color: "from-amber-600 to-orange-700",
      bgLight: "bg-amber-50/70 border-amber-100 text-amber-700",
      category: "smart" as const
    },
    {
      id: 'pdf-merge' as TabId,
      label: t.sidebar.pdfMerge,
      descAr: "دمج عدة ملفات ومستندات PDF منفصلة في ملف واحد موحد وبترتيبك الخاص.",
      descEn: "Combine distinct PDF documents into single organized structure seamlessly.",
      icon: Files,
      color: "from-red-500 to-orange-500",
      bgLight: "bg-red-50/70 border-red-100/60 text-red-655",
      category: "pdf" as const
    },
    {
      id: 'pdf-split' as TabId,
      label: t.sidebar.pdfSplit,
      descAr: "تقسيم واستقطاع صفحات محددة من ملف PDF وحفظها في مستندات منفردة.",
      descEn: "Extract chosen pages or partitions from any PDF to lightweight individual files.",
      icon: Scissors,
      color: "from-amber-500 to-yellow-500",
      bgLight: "bg-amber-50/70 border-amber-100/60 text-amber-650",
      category: "pdf" as const
    },
    {
      id: 'pdf-to-img' as TabId,
      label: t.sidebar.pdfToImg,
      descAr: "تفكيك مستند PDF وتصدير كافة صفحاته كصور مستقلة عالية الوضوح.",
      descEn: "Disassemble PDF pages & output high-definition digital slides (PNG/JPG).",
      icon: ImageIcon,
      color: "from-rose-500 to-pink-500",
      bgLight: "bg-rose-50/70 border-rose-100/80 text-rose-600",
      category: "pdf" as const
    },
    {
      id: 'pdf-extract-text' as TabId,
      label: t.sidebar.pdfExtractText,
      descAr: "تفريغ واستخراج النصوص المدفونة بملفات PDF ونسخها فورا بملف نصي.",
      descEn: "Inspect digital PDF files directly and extract searchable lines to plain clipboard.",
      icon: Type,
      color: "from-violet-500 to-indigo-500",
      bgLight: "bg-violet-50/70 border-violet-100/60 text-violet-600",
      category: "pdf" as const
    },
    {
      id: 'pdf-edit' as TabId,
      label: t.sidebar.pdfEdit,
      descAr: "أداة هندسة صفحات PDF: استبعد، أعد ترتيب، أو أدر الصفحات الفردية من المتصفح.",
      descEn: "PDF engineer: Exclude, reorder, or rotate structural sheets with responsive previews.",
      icon: Layers,
      color: "from-teal-500 to-emerald-500",
      bgLight: "bg-teal-50/70 border-teal-100/60 text-teal-650",
      category: "pdf" as const
    },
    {
      id: 'pdf-protect' as TabId,
      label: t.sidebar.pdfProtect,
      descAr: "تشفير وحماية ملفات PDF بكلمات مرور وصلاحيات استخدام متقدمة لمنع الطباعة والنسخ.",
      descEn: "Protect PDF documents with open/owner passwords, AES encryption, and permission flags.",
      icon: Lock,
      color: "from-purple-600 to-indigo-600",
      bgLight: "bg-purple-50/70 border-purple-100/60 text-purple-600",
      category: "pdf" as const
    },
    {
      id: 'pdf-unlock' as TabId,
      label: t.sidebar.pdfUnlock,
      descAr: "فك حماية ملفات PDF وإزالة قيود الطباعة والتعديل إذا كنت تمتلك كلمة المرور.",
      descEn: "Decrypt PDFs with passwords and instantly release copy, print, or edit prohibitions.",
      icon: Unlock,
      color: "from-slate-600 to-indigo-900",
      bgLight: "bg-indigo-50/70 border-indigo-100/60 text-indigo-600",
      category: "pdf" as const
    },
    {
      id: 'pdf-form-filler' as TabId,
      label: t.sidebar.pdfFormFiller,
      descAr: "اكتشاف وتعبئة حقول النماذج التفاعلية بذكاء، مع إمكانية استيراد وتصدير البيانات كـ JSON.",
      descEn: "Detect and fill interactive form fields automatically. Export or import template values as JSON.",
      icon: PenTool,
      color: "from-teal-600 to-emerald-700",
      bgLight: "bg-teal-50/70 border-teal-150 text-teal-600",
      category: "pdf" as const
    },
    {
      id: 'pdf-page-number' as TabId,
      label: t.sidebar.pdfPageNumber,
      descAr: "إضافة أرقام الصفحات التلقائي بكافة المواقع والتنسيقات المفضلة مع معاينة فورية بالمتصفح.",
      descEn: "Generate and stamp custom page numbering counters with live alignments on sheets.",
      icon: Hash,
      color: "from-indigo-600 to-purple-800",
      bgLight: "bg-indigo-100/40 border-indigo-200 text-indigo-755",
      category: "pdf" as const
    },
    {
      id: 'pdf-header-footer' as TabId,
      label: t.sidebar.pdfHeaderFooter,
      descAr: "إضافة نصوص الترويسة والتذييل الديناميكية مع دعم المتغيرات كالتاريخ ورقم الصفحة.",
      descEn: "Stamp customizable headers and footers with page ranges and dynamic metadata variables.",
      icon: Heading,
      color: "from-slate-700 to-gray-800",
      bgLight: "bg-slate-50/80 border-slate-200 text-slate-700",
      category: "pdf" as const
    },
    {
      id: 'pdf-repair' as TabId,
      label: t.sidebar.pdfRepair,
      descAr: "إصلاح وترميم مستندات PDF التالفة وإعادة بناء مجاري الكائنات المتضررة وجداول xref محلياً.",
      descEn: "Repair PDF cross-reference tables, fix corrupt trailer schemas, and salvage printable layouts.",
      icon: Wrench,
      color: "from-red-600 to-rose-600",
      bgLight: "bg-red-50/80 border-red-200 text-red-600",
      category: "pdf" as const
    },
    {
      id: 'batch-renamer' as TabId,
      label: t.sidebar.batchRenamer,
      descAr: "تغيير أسماء مجموعة ملفات دفعة واحدة باستخدام أنماط مخصصة، ترقيم متسلسل، إزالة نصوص وتصدير ZIP.",
      descEn: "Rename huge sets of files simultaneously. Configure sequences, text replacement patterns, and get structured ZIPs.",
      icon: FolderSync,
      color: "from-sky-500 to-blue-650",
      bgLight: "bg-sky-50/70 border-sky-100 text-sky-600",
      category: "other" as const
    },
    {
      id: 'qr-generator' as TabId,
      label: t.sidebar.qrGenerator,
      descAr: "مولد الباركود QR متطور: صمم رمز استجابة سريعة للنصوص، الروابط، شبكات WiFi، بطاقات vCard أو أحداث التقويم.",
      descEn: "Generate premium custom QRs: Handles normal text, web links, WiFi endpoints, vCard contact info and static calendar events.",
      icon: QrCode,
      color: "from-indigo-655 to-purple-600",
      bgLight: "bg-indigo-50/70 border-indigo-100 text-indigo-700",
      category: "other" as const
    },
    {
      id: 'file-info' as TabId,
      label: t.sidebar.fileInfo,
      descAr: "محلل ومستكشف بنية الملفات ومجموع المراقبة ومولد التشفير والهاشات MD5 & SHA-256 وعارض الرموز الثنائية Hex Dump.",
      descEn: "Analyze binary headers, extract detailed metadata, generate cryptographic MD5/SHA-256 hashes, review fully interactive Hex Dump.",
      icon: Fingerprint,
      color: "from-slate-600 to-neutral-700",
      bgLight: "bg-slate-50 border-slate-150 text-slate-700",
      category: "other" as const
    },
    {
      id: 'file-comparator' as TabId,
      label: t.sidebar.fileComparator,
      descAr: "مقارن الملفات والمستندات الذكي: قارن بين بنيتين مشفرتين، ملفّي صور بمسح تفاعلي، أو نصوص مع تحديد الفروقات.",
      descEn: "Compare images, text contents, or binary arrays. View fully interactive slider overlays or detailed side-by-side modifications.",
      icon: GitCompare,
      color: "from-emerald-600 to-cyan-650",
      bgLight: "bg-emerald-50/70 border-emerald-150 text-emerald-700",
      category: "other" as const
    },
    {
      id: 'favorites-manager' as TabId,
      label: t.sidebar.favoritesManager,
      descAr: "إدارة وترتيب أدواتك المفضلة وتخصيص وترتيب قائمتها بالاختيار والسحب والإفلات وتصدير إعداداتها المفضلة.",
      descEn: "Reorganize, strip, and order your starred toolsets cleanly using reactive HTML5 drag & drop and backup preferences settings.",
      icon: Star,
      color: "from-amber-500 to-orange-500",
      bgLight: "bg-amber-50/70 border-amber-150 text-amber-600",
      category: "other" as const
    },
    {
      id: 'video-to-gif' as TabId,
      label: t.sidebar.videoToGIF,
      descAr: "تحويل مقاطع الفيديو بشتى الصيغ إلى صور متحركة GIF مع تقطيع واختيار السرعات.",
      descEn: "Transform high definition videos directly to lightweight animated GIF sequences locally.",
      icon: Video,
      color: "from-purple-500 to-indigo-500",
      bgLight: "bg-purple-50/70 border-purple-100 text-purple-700",
      category: "media" as const
    },
    {
      id: 'gif-editor' as TabId,
      label: t.sidebar.gifEditor,
      descAr: "تعديل وقص وتعديل سرعة إطارات الصور المتحركة GIF وحذف إطارات مخصصة.",
      descEn: "Advanced frame editor for animated GIFs. Delete individual sheets or adjust loop delay rates.",
      icon: Layers,
      color: "from-sky-500 to-indigo-500",
      bgLight: "bg-sky-50/70 border-sky-100 text-sky-700",
      category: "media" as const
    },
    {
      id: 'video-compressor' as TabId,
      label: t.sidebar.videoCompressor,
      descAr: "ضاغط مقاطع الفيديو مع التحكم بالجودة والأبعاد لتقليص مساحات التخزين فورياً.",
      descEn: "Client-side video compressor. Strip audio tracks, scale bounding boxes, and crop frames.",
      icon: Minimize2,
      color: "from-teal-500 to-emerald-500",
      bgLight: "bg-teal-50/70 border-teal-100 text-teal-700",
      category: "media" as const
    },
    {
      id: 'audio-extractor' as TabId,
      label: t.sidebar.audioExtractor,
      descAr: "استخراج نقي وخالٍ من الخسارة لمجازي الصوت من مقاطع الفيديو وحفظها كـ WAV.",
      descEn: "Extract lossless digital soundtracks directly from uploaded video containers in premium WAV quality.",
      icon: Music,
      color: "from-pink-500 to-indigo-500",
      bgLight: "bg-pink-50/70 border-pink-100 text-pink-700",
      category: "media" as const
    },
    {
      id: 'video-to-images' as TabId,
      label: t.sidebar.videoToImages,
      descAr: "تقطيع مقاطع الفيديو إلى سلسلة لقطات صور متتالية وتصديرها دفعة واحدة كملف ZIP.",
      descEn: "Deconstruct continuous video frames into sequence folders, filter steps, and download as ZIPs.",
      icon: Images,
      color: "from-rose-500 to-amber-500",
      bgLight: "bg-rose-50/70 border-rose-100/70 text-rose-700",
      category: "media" as const
    },
    {
      id: 'screen-recorder' as TabId,
      label: t.sidebar.screenRecorder,
      descAr: "مسجل الشاشة والاجتماعات متطور: سجل المتصفح أو سطح المكتب بجودة صوت وفيديو نقية.",
      descEn: "Advanced live presentation or meeting screen recording with simultaneous microphone capture.",
      icon: Tv,
      color: "from-red-500 to-orange-500",
      bgLight: "bg-red-50/70 border-red-100 text-red-700",
      category: "media" as const
    },
    {
      id: 'webcam-capture' as TabId,
      label: t.sidebar.webcamCapture,
      descAr: "استوديو الكاميرا الحي: طبق 8 فلاتر ومؤثرات صورية فائقة الجمال والتقط صوراً بكاميرا جهازك.",
      descEn: "Live camera studio with 8 real-time visual filter layers, flash shutter effect and clipboard copies.",
      icon: Camera,
      color: "from-fuchsia-500 to-pink-500",
      bgLight: "bg-fuchsia-50/70 border-fuchsia-100 text-fuchsia-700",
      category: "media" as const
    },
    {
      id: 'media-info' as TabId,
      label: t.sidebar.mediaInfo,
      descAr: "مفتش ومحلل الميديا: افحص دقة، وحاوية، ومعدلات البت ومدة ملفات الفيديو والصوت بـ PDF معتمد.",
      descEn: "Decompress container wrappers to review aspect ratios, bitrates, sample rates, & codecs in certified reports.",
      icon: Info,
      color: "from-violet-500 to-purple-500",
      bgLight: "bg-violet-50/70 border-violet-100 text-violet-705",
      category: "media" as const
    },
    {
      id: 'text-diff' as TabId,
      label: t.sidebar.textDiff,
      descAr: "مقارنة النصوص وتحديد الفروقات بين ملفين أو نصين مع إكساء ألوان وتصدير PDF.",
      descEn: "Compare original and revised texts side-by-side or unified with color markers and PDF prints.",
      icon: GitCompare,
      color: "from-indigo-600 to-blue-600",
      bgLight: "bg-indigo-50/70 border-indigo-105 text-indigo-700",
      category: "text" as const
    },
    {
      id: 'text-formatter' as TabId,
      label: t.sidebar.textFormatter,
      descAr: "منظف ومنسق النصوص وتغيير نمط الأحرف والفرز الأبجدي مجهرياً للأسطر المكتوبة.",
      descEn: "Clean additional white spacing, reverse or sort lines alphabetically, change lettering cases & count elements.",
      icon: AlignLeft,
      color: "from-blue-500 to-sky-500",
      bgLight: "bg-blue-50/70 border-blue-105 text-blue-700",
      category: "text" as const
    },
    {
      id: 'markdown-editor' as TabId,
      label: t.sidebar.markdownEditor,
      descAr: "محرر مباشر لغة Markdown فائق السرعة بتقسيم الشاشة وتصدير مستندات HTML مذهلة.",
      descEn: "Live concurrent dual-screen Markdown editor with ready-made README, logs, and technical templates.",
      icon: BookOpen,
      color: "from-emerald-500 to-teal-500",
      bgLight: "bg-emerald-50/70 border-emerald-105 text-emerald-700",
      category: "text" as const
    },
    {
      id: 'text-to-speech' as TabId,
      label: t.sidebar.textToSpeech,
      descAr: "قارئ نصوص ذكي بالصوت مع تتبع للكلمة الحالية وتغيير لهجات التحدث والمؤثرات.",
      descEn: "Text-to-speech voice synthesizer. Adjust pitch levels, speed rates, and spotlight spoken words.",
      icon: Volume2,
      color: "from-pink-500 to-rose-500",
      bgLight: "bg-pink-50/70 border-pink-105 text-pink-700",
      category: "text" as const
    },
    {
      id: 'speech-to-text' as TabId,
      label: t.sidebar.speechToText,
      descAr: "محول فوري للمقاطع الكلامية المنطوقة ونسخها بالوقت الحقيقي لملفات نصية مرنة.",
      descEn: "High-accuracy live micro dictation transcriber. Supports dynamic word diagnostics counters.",
      icon: Mic,
      color: "from-red-500 to-pink-600",
      bgLight: "bg-red-50/70 border-red-105 text-red-700",
      category: "text" as const
    },
    {
      id: 'password-generator' as TabId,
      label: t.sidebar.passwordGenerator,
      descAr: "مولّد كلمات المرور المشفرة والأرقام السرية لـ 10 كلمات معاً واستعراض قوة الأمان.",
      descEn: "Batch generate 10 secure cryptographic non-similar character code passwords with strength benchmarks.",
      icon: KeyRound,
      color: "from-amber-500 to-yellow-600",
      bgLight: "bg-amber-50/70 border-amber-105 text-amber-700",
      category: "text" as const
    }
  ];

  // Filtering tools
  const filteredTools = toolsData.filter(tool => {
    const isCategoryMatch = activeCategory === 'all' || tool.category === activeCategory;
    const query = searchQuery.toLowerCase();
    const isSearchMatch = 
      tool.label.toLowerCase().includes(query) ||
      tool.descAr.toLowerCase().includes(query) ||
      tool.descEn.toLowerCase().includes(query);
    return isCategoryMatch && isSearchMatch;
  });

  const favoriteTools = toolsData.filter(tool => favorites.includes(tool.id));

  return (
    <div className="space-y-8 animate-fadeIn text-slate-800 dark:text-slate-100">
      
      {/* PWA Banner */}
      {pwaPrompt && !isInstalled && (
        <div id="pwa-install-app-banner" className="bg-gradient-to-r from-purple-800 to-indigo-950 text-white p-5 rounded-3xl border border-purple-700/50 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 animate-bounce-subtle">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 p-3 rounded-2xl text-purple-300">
              <Cpu className="w-8 h-8 animate-pulse text-purple-300" />
            </div>
            <div>
              <h4 className="font-extrabold text-white text-base">{t.pwa.installTitle}</h4>
              <p className="text-purple-200 text-xs mt-0.5 max-w-xl">{t.pwa.installDesc}</p>
            </div>
          </div>
          <button
            onClick={handleInstallPwa}
            id="pwa-install-app-btn"
            className="bg-white hover:bg-purple-100 text-purple-950 font-extrabold text-xs px-6 py-3 rounded-2xl shadow-md cursor-pointer shrink-0 transition-all transform hover:scale-[1.03]"
          >
            {t.pwa.installBtn}
          </button>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-900 to-indigo-950 text-white rounded-4xl p-8 md:p-12 shadow-2xl border border-purple-800/80">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-1.5 bg-purple-800/60 text-purple-200 py-1.5 px-4 rounded-full border border-purple-700/50 text-[10px] font-extrabold tracking-tight">
            <ShieldCheck className="w-4 h-4 text-purple-350 shrink-0" />
            <span>{t.privacyStatus}</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
            {t.hero.title}
          </h2>

          <p className="text-purple-200 text-sm md:text-base leading-relaxed font-medium">
            {t.hero.subtitle}
          </p>

          <div className="pt-3 flex flex-wrap gap-3">
            <a 
              href="#catalog-view"
              className="inline-flex items-center gap-2 bg-gradient-to-l from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-extrabold text-xs md:text-sm px-6 py-3.5 rounded-2xl shadow-lg transition-all transform hover:scale-[1.02]"
            >
              <span>{t.hero.cta}</span>
              <span>{lang === 'ar' ? '←' : '→'}</span>
            </a>
            <button 
              onClick={() => setActiveTab('guide')}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/10 font-extrabold text-xs md:text-sm px-6 py-3.5 rounded-2xl transition-all transform hover:scale-[1.02] cursor-pointer"
            >
              <span>{lang === 'ar' ? 'دليل الاستخدام والـ FAQ' : 'User Manual & FAQs'}</span>
              <span>📚</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Statistics Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-800 border border-purple-100/80 dark:border-slate-700/50 p-5 rounded-3xl shadow-sm flex items-center justify-between transition-all">
          <div className="space-y-1">
            <p className="text-xs text-gray-400 font-bold">{t.stats.processedCount}</p>
            <h3 className="text-2xl font-extrabold font-mono text-purple-900 dark:text-purple-300">
              {stats.filesProcessed} +
            </h3>
            <p className="text-[10px] text-gray-400">{t.stats.processedCountSub}</p>
          </div>
          <div className="bg-purple-50 dark:bg-slate-700/50 p-3.5 rounded-2xl text-purple-600 dark:text-purple-400">
            <Zap className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-purple-100/80 dark:border-slate-700/50 p-5 rounded-3xl shadow-sm flex items-center justify-between transition-all">
          <div className="space-y-1">
            <p className="text-xs text-gray-400 font-bold">{t.stats.totalSavings}</p>
            <h3 className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
              {stats.spaceSaved}
            </h3>
            <p className="text-[10px] text-gray-400">{t.stats.totalSavingsSub}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-slate-700/50 p-3.5 rounded-2xl text-emerald-600 dark:text-emerald-400">
            <HardDrive className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-purple-100/80 dark:border-slate-700/50 p-5 rounded-3xl shadow-sm flex items-center justify-between transition-all">
          <div className="space-y-1">
            <p className="text-xs text-gray-400 font-bold">{t.stats.privacyPercent}</p>
            <h3 className="text-2xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
              {lang === 'ar' ? 'آمن ١٠٠٪' : '100% Secure'}
            </h3>
            <p className="text-[10px] text-gray-400">{t.stats.privacyPercentSub}</p>
          </div>
          <div className="bg-indigo-50 dark:bg-slate-700/50 p-3.5 rounded-2xl text-indigo-600 dark:text-indigo-400">
            <Cpu className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Favorites Shelf */}
      {favorites.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500 animate-pulse" />
            <h3 className="text-lg font-extrabold text-slate-800 dark:text-white">{t.favorites}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {favoriteTools.map(tool => {
              const Icon = tool.icon;
              return (
                <div 
                  key={`fav-${tool.id}`}
                  className="bg-white dark:bg-slate-800 border border-amber-200/60 dark:border-amber-500/20 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all relative group flex flex-col justify-between h-[166px]"
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700/50 pb-2.5 mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl text-white bg-gradient-to-tr ${tool.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate max-w-[150px]">{tool.label}</span>
                      </div>
                      <button 
                        onClick={() => onToggleFavorite(tool.id)}
                        className="text-amber-500 hover:text-gray-400 cursor-pointer p-1 rounded-full transition-colors"
                      >
                        <Star className="w-4 h-4 fill-amber-500" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-300 line-clamp-2 leading-relaxed">
                      {lang === 'ar' ? tool.descAr : tool.descEn}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab(tool.id)}
                    className="w-full text-center bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-extrabold text-xs py-2 rounded-xl transition-all cursor-pointer"
                  >
                    {lang === 'ar' ? 'تشغيل الأداة سريعا' : 'Launch Tool'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Catalog Search & Navigation */}
      <div id="catalog-view" className="space-y-6 pt-2">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-gray-150 dark:border-slate-700/50 pb-5">
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeCategory === 'all' ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-300 hover:bg-gray-200'}`}
            >
              {lang === 'ar' ? 'الكل' : 'All'}
            </button>
            <button
              onClick={() => setActiveCategory('image')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeCategory === 'image' ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-300 hover:bg-gray-200'}`}
            >
              {t.categories.image}
            </button>
            <button
              onClick={() => setActiveCategory('pdf')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeCategory === 'pdf' ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-300 hover:bg-gray-200'}`}
            >
              {t.categories.pdf}
            </button>
            <button
              onClick={() => setActiveCategory('smart')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeCategory === 'smart' ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-300 hover:bg-gray-200'}`}
            >
              {t.categories.smart}
            </button>
            <button
              onClick={() => setActiveCategory('media')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeCategory === 'media' ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-300 hover:bg-gray-200'}`}
            >
              {t.categories.media}
            </button>
            <button
              onClick={() => setActiveCategory('text')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeCategory === 'text' ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-300 hover:bg-gray-200'}`}
            >
              {t.categories.text}
            </button>
            <button
              onClick={() => setActiveCategory('other')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeCategory === 'other' ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-300 hover:bg-gray-200'}`}
            >
              {t.categories.other}
            </button>
          </div>

          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 right-3 flex items-center pr-1 text-gray-400 rtl:right-3 rtl:left-auto ltr:left-3 ltr:right-auto">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-purple-150 dark:border-slate-700/50 rounded-2xl py-2.5 rtl:pr-10 rtl:pl-4 ltr:pl-10 ltr:pr-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 text-slate-800 dark:text-white transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Dynamic Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map(tool => {
            const Icon = tool.icon;
            const isFav = favorites.includes(tool.id);
            return (
              <div
                key={tool.id}
                id={`catalog-card-${tool.id}`}
                className="bg-white dark:bg-slate-800 border border-purple-100/70 dark:border-slate-700/30 rounded-3xl p-5 shadow-sm hover:shadow-lg transition-all transform hover:-translate-y-0.5 relative group flex flex-col justify-between h-[180px]"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-gray-50 dark:border-slate-700/30 pb-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-2xl text-white bg-gradient-to-tr ${tool.color} shadow-sm`}>
                        <Icon className="w-[18px] h-[18px]" />
                      </div>
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">{tool.label}</span>
                    </div>
                    <button 
                      onClick={() => onToggleFavorite(tool.id)}
                      className={`cursor-pointer p-1.5 rounded-xl transition-all ${isFav ? 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' : 'text-gray-300 hover:text-amber-500 hover:bg-gray-50 dark:hover:bg-slate-700/50'}`}
                    >
                      <Star className={`w-4 h-4 ${isFav ? 'fill-amber-500' : ''}`} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-300 leading-relaxed font-bold line-clamp-2">
                    {lang === 'ar' ? tool.descAr : tool.descEn}
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab(tool.id)}
                    className="w-full text-center bg-purple-50 dark:bg-slate-700/50 hover:bg-purple-100 dark:hover:bg-slate-700 text-purple-700 dark:text-purple-300 font-extrabold text-xs py-2 rounded-xl transition-all cursor-pointer"
                  >
                    {lang === 'ar' ? 'تشغيل الأداة' : 'Launch Tool'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredTools.length === 0 && (
          <div className="text-center p-12 text-gray-400 space-y-2">
            <Info className="w-8 h-8 mx-auto text-gray-350" />
            <p className="text-xs font-bold">{lang === 'ar' ? 'لم يتم العثور على أي أدوات مطابقة لبحثك.' : 'No tools found matching your search criteria.'}</p>
          </div>
        )}
      </div>

    </div>
  );
};

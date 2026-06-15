
import React, { useState, useEffect, useRef } from 'react';
import { 
  Star, 
  Trash2, 
  Download, 
  Workflow, 
  Grid2X2, 
  RefreshCw, 
  CheckCircle, 
  ArrowUpRight,
  Info,
  Menu,
  Upload,
  AlertCircle
} from 'lucide-react';
import { TabId } from '../../../types';
import { translations } from '../../../translations';

interface FavoritesManagerProps {
  lang: 'ar' | 'en';
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  setActiveTab: (tab: TabId) => void;
  onImportFavorites?: (items: string[]) => void;
}

interface FavoriteToolItem {
  id: string;
  label: string;
  desc: string;
  category: string;
}

export const FavoritesManager: React.FC<FavoritesManagerProps> = ({
  lang,
  favorites,
  onToggleFavorite,
  setActiveTab,
  onImportFavorites
}) => {
  const isAr = lang === 'ar';
  const t = translations[lang];
  const [localFavs, setLocalFavs] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalFavs(favorites);
  }, [favorites]);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const lookupToolData = (id: string): FavoriteToolItem => {
    const registry: Record<string, { labelAr: string; labelEn: string; descAr: string; descEn: string; cat: string }> = {
      'image-convert': { labelAr: 'تحويل امتدادات الصور', labelEn: 'Convert Image Suffixes', descAr: 'تحويل PNG, JPG, WebP', descEn: 'Convert formats locally', cat: 'image' },
      'image-compress': { labelAr: 'ضغط الصور وتقليصها', labelEn: 'Compress Image Footprint', descAr: 'تقليص الحجم لغاية ٩٠٪', descEn: 'Shrink sizes in browser', cat: 'image' },
      'image-resize': { labelAr: 'تغيير أبعاد وتكبير', labelEn: 'Resize dimensions', descAr: 'تعديل الطول والعرض بالأرقام', descEn: 'Recalculate exact sizes', cat: 'image' },
      'image-crop': { labelAr: 'قص زوايا الصورة', labelEn: 'Crop Aspect boundaries', descAr: 'قص أطراف للتواصل الاجتماعي', descEn: 'Trim custom edges', cat: 'image' },
      'image-ocr': { labelAr: 'استخراج نصوص وصور (OCR)', labelEn: 'Optical extraction (OCR)', descAr: 'استخراج ذكي للنص', descEn: 'Text scanners', cat: 'ocr' },
      'image-remove-bg': { labelAr: 'إزالة خلفية تلقائي', labelEn: 'Remove BG Auto', descAr: 'حذف وعزل خلفية الصور', descEn: 'Self contained model isolations', cat: 'image' },
      'pdf-merge': { labelAr: 'دمج ملفات PDF', labelEn: 'Merge Multi pdfs', descAr: 'دمج مستندات مبعثرة بملف واحد', descEn: 'Bind multiple PDFs together', cat: 'pdf' },
      'pdf-split': { labelAr: 'تقسيم وتصنيف PDF', labelEn: 'Split pdf pages', descAr: 'استخراج وتفصيل الصفحات', descEn: 'Generate minor PDFs files', cat: 'pdf' },
      'qr-generator': { labelAr: 'مولد باركود QR Code', labelEn: 'Advanced QR Code Generator', descAr: 'إنشاء باركود بألوان وشعار', descEn: 'Logo embedded templates', cat: 'utils' },
      'batch-renamer': { labelAr: 'إعادة التسمية دفعة', labelEn: 'Batch bulk renaming', descAr: 'تغيير وتعديل أسماء ملفات دفعة واحدة', descEn: 'Index formatting counters', cat: 'utils' },
      'file-info': { labelAr: 'مستكشف Checksum الهاش', labelEn: 'File Checksum SHA inspector', descAr: 'تأكيد الهاش وعرض Hex dump', descEn: 'Cryptographic data integrity', cat: 'utils' },
      'file-comparator': { labelAr: 'مقارن ثنائيات الملفات', labelEn: 'Files side-by-side comparator', descAr: 'تحليل فروق الصور والنصوص', descEn: 'Find revisions differences', cat: 'utils' },
      'file-encryptor': { labelAr: 'تشفير الملفات الآمن', labelEn: 'AES-256 File Encryptor', descAr: 'تشفير عسكري محلي للملفات', descEn: 'Local on-device encryption', cat: 'security' },
      'file-decryptor': { labelAr: 'فك تشفير الملفات', labelEn: 'AES-256 File Decryptor', descAr: 'فك تشفير الملفات والتحقق', descEn: 'Local on-device decryption', cat: 'security' },
      'metadata-scrubber': { labelAr: 'منظف البيانات الوصفية', labelEn: 'EXIF Metadata Scrubber', descAr: 'مسح وإزالة تتبع EXIF', descEn: 'Wipe camera & location tracks', cat: 'security' },
      'file-shredder': { labelAr: 'فرم وإتلاف الملفات', labelEn: 'DoD File Shredder', descAr: 'إزالة نهائية آمنة وصارمة للملفات', descEn: 'Secure block file wiper', cat: 'security' },
      'steganography-tool': { labelAr: 'إخفاء البيانات بالصور', labelEn: 'LSB Steganography Suite', descAr: 'تضمين نصوص سرية بالبكسل', descEn: 'Embed text inside RGB pixels', cat: 'security' }
    };

    const found = registry[id];
    if (found) {
      return {
        id,
        label: isAr ? found.labelAr : found.labelEn,
        desc: isAr ? found.descAr : found.descEn,
        category: found.cat
      };
    }

    return {
      id,
      label: id.replace('-', ' ').toUpperCase(),
      desc: 'FileForge Premium Tools',
      category: 'general'
    };
  };

  // Drag-and-drop callbacks using HTML5
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIdx(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;

    const copy = [...localFavs];
    const itemToMove = copy[draggedIdx];
    copy.splice(draggedIdx, 1);
    copy.splice(index, 0, itemToMove);
    setLocalFavs(copy);
    setDraggedIdx(index);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    localStorage.setItem('promedia_favorites', JSON.stringify(localFavs));
    showToastMsg(isAr ? 'تمت إعادة ترتيب قائمة المفضلة بنجاح!' : 'Saved custom favorites rearranged sequence.');
  };

  const exportFavoritesAsJson = () => {
    const payload = JSON.stringify({
      appName: 'FileForge Pro',
      favorites: localFavs,
      exportedAt: new Date().toISOString()
    }, null, 2);

    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fileforge_favorites_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToastMsg(isAr ? 'تم تصدير ملف الإعدادات بنجاح!' : 'Exported JSON configuration file.');
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.favorites)) {
          setLocalFavs(parsed.favorites);
          localStorage.setItem('promedia_favorites', JSON.stringify(parsed.favorites));
          if (onImportFavorites) {
            onImportFavorites(parsed.favorites);
          }
          showToastMsg(isAr ? 'تم استيراد قائمة المفضلة بنجاح!' : 'Favorites parsed and imported successfully!');
        } else {
          alert(isAr ? 'صيغة ملف غير مدعومة' : 'Incorrect favorites configuration layout.');
        }
      } catch (err) {
        alert(isAr ? 'فشل قراءة الملف كـ JSON!' : 'Failed to parse JSON file layout.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div id="favorites-manager" className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-6 text-slate-705 dark:text-slate-200">
      
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-900 border border-slate-700 text-white py-2.5 px-4 rounded-xl shadow-lg animate-slideUp">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold leading-none">{toast}</span>
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-50 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500/10 p-3 rounded-2xl text-amber-500 animate-pulse">
            <Star className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-slate-900 dark:text-white">
              {isAr ? 'إدارة لوحة التحكم وصانع المفضلة المتطور' : 'Bespoke Favorites Organizer Dashboard'}
            </h2>
            <p className="text-xs text-slate-400">
              {isAr ? 'أعد تنظيم اختصارات الوصول السريع للأدوات المفضلة لديك بالسحب والإفلات وتصديرها كملف واحد' : 'Reorder widget blocks seamlessly. Export or import backups to restore workflows across targets.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-white py-2 px-3 rounded-xl cursor-pointer transition border-0 font-bold"
          >
            <Upload className="w-4 h-4" />
            <span>{isAr ? 'استيراد قائمة المفضلة [.JSON]' : 'Import JSON Config'}</span>
          </button>
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleImportJsonFile}
            accept=".json"
            className="hidden"
          />

          {localFavs.length > 0 && (
            <button
              onClick={exportFavoritesAsJson}
              className="inline-flex items-center gap-1 bg-amber-600 text-white font-bold py-2 px-3 rounded-xl hover:bg-amber-700 cursor-pointer transition border-0 shadow"
            >
              <Download className="w-4 h-4" />
              <span>{isAr ? 'تصدير قائمة المفضلة [.JSON]' : 'Export JSON Config'}</span>
            </button>
          )}
        </div>
      </div>

      {localFavs.length > 0 ? (
        <div className="space-y-4">
          <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs p-3.5 rounded-2xl border border-amber-500/20 flex items-start gap-1.5 leading-normal">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-[11px]">
              {isAr 
                ? 'استخدم أيقونة المقود (☰) للسحب وتعديل الترتيب. اضغط على الزر الساخن [F] في لوحة المفاتيح لتحديد الاختصارات والوصول المباشر.' 
                : 'Drag items using the handler icons (☰) to customize sequence. Access with shortcut [F] at any workspace context.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {localFavs.map((favId, index) => {
              const tool = lookupToolData(favId);
              return (
                <div
                  key={tool.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-amber-500 transition cursor-move relative"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="text-slate-400 shrink-0 mt-0.5 cursor-grab">
                        <Menu className="w-4 h-4" />
                      </div>
                      
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-white truncate">
                          {tool.label}
                        </h4>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {tool.desc}
                        </p>
                        <span className="inline-block bg-slate-200/50 dark:bg-slate-900 text-[9px] font-mono py-0.5 px-2 rounded-full text-slate-500 mt-1 uppercase max-w-max">
                          {tool.category}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onToggleFavorite(tool.id)}
                      className="p-1 hover:bg-rose-50 text-rose-500 rounded border-0 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex justify-end pt-3">
                    <button
                      onClick={() => setActiveTab(tool.id as TabId)}
                      className="text-[10px] font-bold text-amber-600 hover:underline flex items-center gap-0.5 bg-transparent border-0 cursor-pointer"
                    >
                      <span>{isAr ? 'فتح الأداة الآن' : 'Launch Widget'}</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 rounded-2xl p-8 text-center text-slate-400 flex flex-col items-center justify-center min-h-[160px]">
          <Star className="w-8 h-8 text-slate-300 dark:text-slate-800 mb-2 animate-pulse" />
          <p className="text-xs font-bold">{isAr ? 'لا توجد أدوات مفضلة مضافة حالياً!' : 'No favorite indicators found.'}</p>
          <p className="text-[10px] text-slate-450 mt-1">
            {isAr ? 'اركب نجمة صفراء بملحقات القوائم لتنظيم شريط الوصول السريع' : 'Star widget headers to bookmark items here.'}
          </p>
        </div>
      )}
    </div>
  );
};

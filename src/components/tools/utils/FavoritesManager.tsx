import React, { useState, useEffect } from 'react';
import { 
  Star, 
  Trash2, 
  Download, 
  Workflow, 
  Grid2X2, 
  RefreshCw, 
  CheckCircle2, 
  ArrowUpRight,
  Info,
  Menu
} from 'lucide-react';
import { TabId } from '../../../types';
import { translations } from '../../../translations';

interface FavoritesManagerProps {
  lang: 'ar' | 'en';
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  setActiveTab: (tab: TabId) => void;
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
  setActiveTab
}) => {
  const t = translations[lang];
  const [localFavs, setLocalFavs] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setLocalFavs(favorites);
  }, [favorites]);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // Safe mapping of all tools in FileForge Pro
  const lookupToolData = (id: string): FavoriteToolItem => {
    const registry: Record<string, { labelAr: string; labelEn: string; descAr: string; descEn: string; cat: string }> = {
      'image-convert': { labelAr: 'تحويل امتدادات الصور', labelEn: 'Convert Image Suffixes', descAr: 'تحويل PNG, JPG, WebP', descEn: 'Convert formats locally', cat: 'image' },
      'image-compress': { labelAr: 'ضغط الصور وتقليصها', labelEn: 'Compress Image Footprint', descAr: 'تقليص الحجم لغاية ٩٠٪', descEn: 'Shrink sizes in browser', cat: 'image' },
      'image-resize': { labelAr: 'تغيير أبعاد وتكبير', labelEn: 'Resize dimensions', descAr: 'تعديل الطول والعرض بالأرقام', descEn: 'Recalculate exact sizes', cat: 'image' },
      'image-crop': { labelAr: 'قص زوايا الصورة', labelEn: 'Crop Aspect boundaries', descAr: 'قص أطراف للتواصل الاجتماعي', descEn: 'Trim custom edges', cat: 'image' },
      'image-ocr': { labelAr: 'استخراج نصوص وصور (OCR)', labelEn: 'Optical extraction (OCR)', descAr: 'استخراج ذكي للنص', descEn: 'Text scanners', cat: 'ocr' },
      'image-remove-bg': { labelAr: 'إزالة خلفية تلقائي', labelEn: 'Remove BG Auto', descAr: 'حذف وعزل خلفية الصور', descEn: 'Self contained model isolations', cat: 'image' },
      'image-metadata': { labelAr: 'معالج بيانات EXIF الوصفية', labelEn: 'EXIF Metadata Editor', descAr: 'قراءة وتعديل بيانات الصور الوصفية', descEn: 'Audit camera specs tags', cat: 'image' },
      'pdf-merge': { labelAr: 'دمج ملفات PDF', labelEn: 'Merge Multi pdfs', descAr: 'دمج مستندات مبعثرة بملف واحد', descEn: 'Bind multiple PDFs together', cat: 'pdf' },
      'pdf-split': { labelAr: 'تقسيم وتصنيف PDF', labelEn: 'Split pdf pages', descAr: 'استخراج وتفصيل الصفحات', descEn: 'Generate minor PDFs files', cat: 'pdf' },
      'ocr-receipt': { labelAr: 'مستكشف الفواتير', labelEn: 'Receipt scanner', descAr: 'مسح واستلام بيانات الإيرادات للفاتورة', descEn: 'Automate accounting entries', cat: 'ocr' },
      'qr-generator': { labelAr: 'مولد باركود QR Code', labelEn: 'Advanced QR Code Generator', descAr: 'إنشاء باركود بألوان وشعار', descEn: 'Logo embedded templates', cat: 'utils' },
      'batch-renamer': { labelAr: 'إعادة التسمية دفعة', labelEn: 'Batch bulk renaming', descAr: 'تغيير وتعديل أسماء ملفات دفعة واحدة', descEn: 'Index formatting counters', cat: 'utils' },
      'file-info': { labelAr: 'مستكشف Checksum الهاش', labelEn: 'File Checksum SHA inspector', descAr: 'تأكيد الهاش وعرض Hex dump', descEn: 'Cryptographic data integrity', cat: 'utils' },
      'file-comparator': { labelAr: 'مقارن ثنائيات الملفات', labelEn: 'Files side-by-side comparator', descAr: 'تحليل فروق الصور والنصوص', descEn: 'Find revisions differences', cat: 'utils' },
      'ai-object-detection': { labelAr: 'كشف الأجسام بالصور', labelEn: 'Object counter AI', descAr: 'التعرف وعد الأجسام', descEn: 'Segment objects visually', cat: 'ai' },
      'ai-photo-restoration': { labelAr: 'ترميم وترقية الصور', labelEn: 'Scale & Restore Old photo', descAr: 'توضيح للصور القديمة والمعتمة', descEn: 'Enhance blurry pictures', cat: 'ai' }
    };

    const found = registry[id];
    if (found) {
      return {
        id,
        label: lang === 'ar' ? found.labelAr : found.labelEn,
        desc: lang === 'ar' ? found.descAr : found.descEn,
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

    // Swap items in state array
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
    showToastMsg(lang === 'ar' ? 'تمت إعادة ترتيب قائمة المفضلة!' : 'Saved custom favorites rearranged sequence.');
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

    showToastMsg(lang === 'ar' ? 'تم تصدير ملف إعدادات المفضلة بنجاح!' : 'Exported JSON configuration file.');
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-purple-100 dark:border-slate-700 shadow-sm space-y-6">
      
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-900 border border-purple-500/30 text-white py-3 px-5 rounded-2xl shadow-xl animate-slideIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold leading-none">{toast}</span>
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-50 dark:border-slate-700 pb-5">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-amber-500 to-amber-600 p-2.5 rounded-2xl text-white shadow-md">
            <Star className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg text-slate-950 dark:text-white flex items-center gap-2">
              {lang === 'ar' ? 'إدارة لوحة التحكم وصانع المفضلة الذكي' : 'Bespoke Favorites Organizer Workspace'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'ar'
                ? 'خصص شبكة وصولك المفضلة وسرع وصولك لأكثر الأدوات استخداماً. اسحب البطاقات لتغيير ترتيب القائمة وتصديرها كجمل مفضلة مخصصة.'
                : 'Drag to sequence key widgets for higher workflow velocity. Modify stars levels and generate persistent backup records.'}
            </p>
          </div>
        </div>

        {localFavs.length > 0 && (
          <button
            onClick={exportFavoritesAsJson}
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-750 dark:bg-slate-750 text-white text-xs py-2 px-4 rounded-xl shadow cursor-pointer transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>{lang === 'ar' ? 'تصدير إعدادات المفضلة' : 'Backup Config JSON'}</span>
          </button>
        )}
      </div>

      {localFavs.length > 0 ? (
        <div className="space-y-4">
          <div className="bg-purple-500/5 text-purple-600 dark:text-purple-300 text-[10px] p-3 rounded-xl border border-purple-500/10 flex items-start gap-1.5">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{lang === 'ar' ? 'تنبيه: يمكنك سحب أي بطاقة من زر السحب (☰) لأسفل لتغيير موقعها وحفظ الترتيب تلقائياً.' : 'Utility: Grab the card handler icon (☰) and drag to swap, saving settings immediately.'}</p>
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
                  className="bg-slate-50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-800 rounded-3xl p-4 flex flex-col justify-between hover:border-purple-350 dark:hover:border-purple-800 transition-all cursor-move relative group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2.5 min-w-0">
                      {/* Drag Handler icon */}
                      <div className="text-slate-350 cursor-grab shrink-0 mt-1 py-1">
                        <Menu className="w-4 h-4" />
                      </div>
                      
                      <div className="min-w-0">
                        <span className="text-[9px] font-bold tracking-widest text-purple-650 uppercase block mb-1">
                          {tool.category}
                        </span>
                        <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-150 truncate leading-tight">
                          {tool.label}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                          {tool.desc}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => onToggleFavorite(tool.id)}
                      className="text-amber-500 hover:text-red-500 shrink-0 cursor-pointer p-1.5"
                      title={lang === 'ar' ? 'إلغاء المفضلة' : 'Erase favorite'}
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between">
                    <span className="text-[9px] text-slate-400">Position #{index + 1}</span>
                    <button
                      onClick={() => setActiveTab(tool.id as TabId)}
                      className="inline-flex items-center gap-1 text-[10px] text-purple-600 font-extrabold hover:underline"
                    >
                      <span>{lang === 'ar' ? 'افتح الأداة' : 'Launch Studio'}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/10 rounded-3xl border border-dashed border-slate-200">
          <Star className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          <h3 className="font-bold text-xs text-slate-705 dark:text-slate-350">{lang === 'ar' ? 'قائمة المفضلة فارغة حالياً' : 'No Favorited Quick-Actions Reserved'}</h3>
          <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto">
            {lang === 'ar' ? 'انقر على النجمة الذهبية المتواجدة بأي زاوية من واجهات الأدوات لتضمينها في شبكة وصولك السريع هنا.' : 'Activate gold star selectors at any tool layout headers to seed widgets here.'}</p>
        </div>
      )}

    </div>
  );
};

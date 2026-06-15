
import React, { useState, useRef } from 'react';
import { 
  Award, 
  Trash2, 
  Download, 
  Sparkles, 
  Check, 
  User, 
  Calendar, 
  FileText,
  Eye,
  Settings,
  Heart
} from 'lucide-react';
import { toPng } from 'html-to-image';

interface CertificateMakerProps {
  lang: 'ar' | 'en';
  onAddHistoryItem?: (item: any, blob?: Blob) => void;
}

interface CertTheme {
  id: string;
  nameAr: string;
  nameEn: string;
  bgClass: string;
  borderClass: string;
  accentText: string;
  accentBg: string;
  goldAccent: string;
  fontClass: string;
}

const THEMES: CertTheme[] = [
  { 
    id: 'gold-blue', 
    nameAr: 'العقود الملكية الأزرق والذهبي', 
    nameEn: 'Royal Blue & Gold', 
    bgClass: 'bg-slate-900 border-yellow-500/80', 
    borderClass: 'border-double border-8 border-amber-500', 
    accentText: 'text-amber-500', 
    accentBg: 'bg-slate-800', 
    goldAccent: '#f59e0b',
    fontClass: 'font-serif'
  },
  { 
    id: 'classic-red', 
    nameAr: 'النيشان الكلاسيكي الأحمر', 
    nameEn: 'Classic Crimson Academic', 
    bgClass: 'bg-stone-50 border-rose-800', 
    borderClass: 'border-solid border-4 border-rose-800', 
    accentText: 'text-rose-800', 
    accentBg: 'bg-stone-100', 
    goldAccent: '#991b1b',
    fontClass: 'font-serif'
  },
  { 
    id: 'modern-green', 
    nameAr: 'الزمردي الهندسي المعاصر', 
    nameEn: 'Emerald Minimalist Tech', 
    bgClass: 'bg-slate-950 border-emerald-500', 
    borderClass: 'border-solid border-2 border-emerald-500/60', 
    accentText: 'text-emerald-400', 
    accentBg: 'bg-emerald-950/20', 
    goldAccent: '#10b981',
    fontClass: 'font-sans'
  },
  { 
    id: 'royal-purple', 
    nameAr: 'الأرجواني الملكي والفضة', 
    nameEn: 'Royal Amethyst & Silver', 
    bgClass: 'bg-purple-950 border-purple-305', 
    borderClass: 'border-double border-8 border-violet-400/60', 
    accentText: 'text-violet-300', 
    accentBg: 'bg-purple-900/40', 
    goldAccent: '#a78bfa',
    fontClass: 'font-serif'
  },
  { 
    id: 'dark-luxury', 
    nameAr: 'الغاسق النبيل الأسود القاتم', 
    nameEn: 'Obsidian Black Luxury', 
    bgClass: 'bg-zinc-950 border-amber-400', 
    borderClass: 'border-solid border-2 border-amber-400', 
    accentText: 'text-amber-450', 
    accentBg: 'bg-zinc-900', 
    goldAccent: '#fbbf24',
    fontClass: 'font-sans'
  }
];

export const CertificateMaker: React.FC<CertificateMakerProps> = ({ lang, onAddHistoryItem }) => {
  const isAr = lang === 'ar';
  
  const [themeId, setThemeId] = useState<string>('gold-blue');
  const [recipient, setRecipient] = useState<string>(isAr ? 'عبد الرحمن محمد علي' : 'Alexander Mercer');
  const [presenter, setPresenter] = useState<string>(isAr ? 'منصة برو ميديا التعليمية' : 'FileForge Academic Hub Office');
  const [reason, setReason] = useState<string>(isAr ? 'لاجتيازه دورة معالجة ومزامنة البيانات المتقدمة باقتدار وكفاءة' : 'For demonstrating stellar expertise and completing the local data engineering bootcamp.');
  const [dateStr, setDateStr] = useState<string>('2026-06-15');
  const [certNumber, setCertNumber] = useState<string>('FF-95011-2026');

  const [toastMessage, setToastMessage] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const certNodeRef = useRef<HTMLDivElement>(null);

  const showLocalToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const activeTheme = THEMES.find(t => t.id === themeId) || THEMES[0];

  // Save / Export Certificate as high-res PNG image using html-to-image
  const handleExportPng = async () => {
    if (!certNodeRef.current) return;
    setIsDownloading(true);
    showLocalToast(isAr ? 'جاري تهيئة وتحويل الشهادة...' : 'Compiling high-resolution certificate canvas...');

    try {
      const dataUrl = await toPng(certNodeRef.current, {
        quality: 1.0,
        pixelRatio: 2, // Double ratio for beautiful high-res export
        backgroundColor: '#0a0f1d'
      });

      const blob = await (await fetch(dataUrl)).blob();
      const filename = `certificate_${certNumber || 'export'}.png`;

      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);

      showLocalToast(isAr ? 'تم حفظ وتنزيل شهادتك الموثقة!' : 'Certified certificate saved on-device!');

      if (onAddHistoryItem) {
        onAddHistoryItem({
          action: isAr ? 'إصدار وتوثيق شهادة تقديرية' : 'Certificate of Merit Synthesis',
          fileName: filename,
          originalSize: 75000,
          processedSize: blob.size,
          type: 'image'
        }, blob);
      }
    } catch (err) {
      console.error(err);
      showLocalToast(isAr ? 'فشل المعالجة الفورية. حاول مرة أخرى.' : 'Synthesis failed. Please verify credentials.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div id="certificate-maker-container" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-5 sm:p-6 shadow-sm space-y-6 text-slate-700 dark:text-slate-200">
      
      {/* Toast Alert overlay */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 dark:bg-slate-800 text-white py-2.5 px-5 rounded-2xl shadow-lg border border-slate-700 text-xs font-bold animate-slideUp z-50 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Title blocks */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-50 dark:border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500/10 p-3 rounded-2xl text-amber-500">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isAr ? 'مستند ومنشئ شهادات التقدير الفاخرة' : 'Premium Certificate of Merit Builder'}
            </h2>
            <p className="text-xs text-slate-400">
              {isAr ? 'أنشئ شهادات تقدير وشكر معتمدة وتعديل المانح والمستلم والتواريخ لطباعتها بجودة فائقة' : 'Design high-end luxury certs of recognition, change seals/dates, and save in print-ready resolutions'}
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Inputs Form Left (5 cols), Preview Canvas Right (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Form (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-3.5">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 border-b border-slate-200/50 pb-1.5">
              <Settings className="w-4 h-4 text-amber-500" />
              {isAr ? 'بيانات وحقول الشهادة' : 'Certificate Credentials'}
            </span>

            {/* Template select style theme */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400">{isAr ? 'اختر النمط الذهبي أو الهيكل' : 'Award Aesthetic Theme'}</label>
              <select
                value={themeId}
                onChange={(e) => setThemeId(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 rounded-xl py-2 px-3 text-xs focus:ring-1 focus:ring-amber-500 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white cursor-pointer font-bold"
              >
                {THEMES.map(theme => (
                  <option key={theme.id} value={theme.id}>
                    {isAr ? theme.nameAr : theme.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Recipient Field */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <User className="w-3 h-3 text-amber-500" />
                <span>{isAr ? 'مستلم الشهادة (Recipient Name)' : 'Recipient Full Name'}</span>
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 rounded-xl py-2 px-3 text-xs focus:ring-1 focus:ring-amber-500 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-bold"
              />
            </div>

            {/* Presenter Name (Issuer) */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400">{isAr ? 'الجهة المانحة للشهادة' : 'Issuing Organization'}</label>
              <input
                type="text"
                value={presenter}
                onChange={(e) => setPresenter(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 rounded-xl py-2 px-3 text-xs focus:ring-1 focus:ring-amber-500 border border-slate-200 dark:border-slate-800 text-slate-808"
              />
            </div>

            {/* Cause / reason */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400">{isAr ? 'نص وسياق الشهادة التقديرية' : 'Reason / Award Text Context'}</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                className="w-full bg-white dark:bg-slate-900 rounded-xl py-1.5 px-3 text-xs focus:ring-1 focus:ring-amber-500 border border-slate-200 dark:border-slate-800 text-slate-808"
              />
            </div>

            {/* Bottom Row Attributes */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-amber-500" />
                  <span>{isAr ? 'تاريخ التوقيع' : 'Award Date'}</span>
                </label>
                <input
                  type="date"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 rounded-xl py-1.5 px-2.5 text-xs focus:ring-1 focus:ring-amber-500 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white text-center"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <FileText className="w-3 h-3 text-amber-500" />
                  <span>{isAr ? 'رقم التوثيق / المرجع' : 'Cert Serial #'}</span>
                </label>
                <input
                  type="text"
                  value={certNumber}
                  onChange={(e) => setCertNumber(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 rounded-xl py-1.5 px-2.5 text-xs focus:ring-1 focus:ring-amber-500 border border-slate-200 dark:border-slate-800 font-mono text-center"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Right Preview area (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-emerald-500" />
              {isAr ? 'معاينة حية دقيقة للمطابقة' : 'Live Certificate Layout Frame'}
            </span>
          </div>

          {/* Certificate Container with layout proportions */}
          <div className="overflow-x-auto rounded-3xl p-2 border border-slate-100 bg-slate-950 flex items-center justify-center">
            {/* The actual certificate which will be snapshot */}
            <div 
              ref={certNodeRef}
              id="active-certificate-canvas"
              className={`w-[680px] h-[460px] p-8 flex flex-col justify-between relative select-none rounded-2xl ${activeTheme.bgClass} ${activeTheme.borderClass} ${activeTheme.fontClass}`}
            >
              {/* Gold/Copper Rosette Seal decoration inside canvas */}
              {themeId === 'gold-blue' || themeId === 'dark-luxury' ? (
                <div className="absolute top-6 right-6 opacity-20 w-32 h-32 border-4 border-yellow-500 rounded-full flex items-center justify-center animate-spin" style={{ animationDuration: '60s' }}>
                  <Award className="w-16 h-16 text-yellow-500" />
                </div>
              ) : null}

              {/* Top Banner / headers */}
              <div className="text-center space-y-1 z-10">
                <span className={`text-[10px] tracking-widest font-bold uppercase text-slate-450 ${activeTheme.accentText}`}>
                  {isAr ? 'شهادة تقدير وتفوق معتمدة' : 'Official Certificate of Merit & Honor'}
                </span>
                <h1 className={`text-2xl sm:text-3xl font-extrabold uppercase mt-1 tracking-tight text-white dark:text-white`}>
                  {isAr ? 'شـهـادة تـقـديـر' : 'Certificate of Excellence'}
                </h1>
                <div className="w-24 h-0.5 mx-auto bg-amber-500/80 mt-2" />
              </div>

              {/* Certifies recipient name */}
              <div className="text-center space-y-2.5 z-10">
                <span className="text-xs text-slate-400 italic">
                  {isAr ? 'تُمنح هذه الشهادة بكل فخر لـ:' : 'This certifies that honor is proudly bestowed upon:'}
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white dark:text-white underline decoration-amber-500 decoration-wavy underline-offset-8">
                  {recipient || (isAr ? 'اسم المتلقي كاملاً' : 'Recipient Full Name')}
                </h2>
                <p className="text-xs text-slate-350 max-w-lg mx-auto leading-relaxed pt-2">
                  {reason || (isAr ? 'نص وسياق التكريم' : 'Award description or bootcamp completion milestone.')}
                </p>
              </div>

              {/* Signatures & bottom rows */}
              <div className="flex items-end justify-between border-t border-slate-800/40 pt-4 z-10 text-[10px] text-slate-400">
                {/* Left side presenter */}
                <div className="text-center space-y-1">
                  <span className="italic block text-slate-500">{isAr ? 'الجهة المصدرة الموثقة' : 'Issuing Representative'}</span>
                  <div className="font-mono text-white dark:text-white font-bold tracking-wide">{presenter || 'FileForge'}</div>
                  <div className="w-20 h-px bg-slate-800 mx-auto" />
                </div>

                {/* Central Medallion Stamp symbol */}
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-11 h-11 bg-gradient-to-tr from-yellow-600 to-yellow-400 rounded-full shadow-lg flex items-center justify-center p-1 border-2 border-white/20">
                    <Award className="w-6 h-6 text-slate-900" />
                  </div>
                  <span className="text-[8px] font-bold text-amber-500 uppercase mt-1 tracking-widest">{isAr ? 'ختم الاعتماد' : 'Official Seal'}</span>
                </div>

                {/* Right side Date / serial */}
                <div className="text-right text-[10px] text-slate-400">
                  <div><strong>{isAr ? 'التاريخ:' : 'Date:'}</strong> {dateStr}</div>
                  <div className="font-mono text-slate-500"><strong>{isAr ? 'رقم التوثيق:' : 'Serial:'}</strong> {certNumber || 'FF-95'}</div>
                </div>
              </div>

            </div>
          </div>

          {/* Download strip controls */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-[10px] text-slate-400">
              {isAr ? 'يرجى ملء الحقول المطلوبة ومراجعتها وتنزيلها كملف صورة عالي الدقة للطباعة' : 'Verify all spelling and credentials before generating high-res printable certificate asset'}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportPng}
                disabled={isDownloading}
                className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-720 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5 border-0 shadow"
              >
                <Download className="w-4 h-4 animate-bounce" />
                <span>{isAr ? 'تنزيل الشهادة الآن' : 'Save Certificate PNG'}</span>
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Command, 
  Star, 
  X, 
  ChevronRight, 
  ChevronLeft,
  Tv,
  CheckCircle2,
  HardDrive
} from 'lucide-react';

interface OnboardingProps {
  lang: 'ar' | 'en';
  favorites: string[];
  onToggleFavorite: (id: string) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({
  lang,
  favorites,
  onToggleFavorite
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);

  useEffect(() => {
    // Check if onboarding completed previously
    const completed = localStorage.getItem('promedia_onboarding_completed');
    if (!completed) {
      setIsOpen(true);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem('promedia_onboarding_completed', 'true');
    setIsOpen(false);
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isOpen) return null;

  const totalSteps = 4;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-purple-500/20 flex flex-col justify-between max-h-[90vh]">
        
        {/* Header bar */}
        <div className="p-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-purple-600 p-1.5 rounded-lg text-white">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100">FileForge Pro Studio</span>
          </div>

          <button 
            onClick={handleComplete}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
            title={lang === 'ar' ? 'تخطي الجولة' : 'Skip journey'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Slides context */}
        <div className="p-6 md:p-8 flex-1 overflow-y-auto space-y-6">
          
          {currentStep === 0 && (
            <div className="text-center space-y-4 animate-slideIn">
              <div className="mx-auto w-20 h-20 bg-purple-50 rounded-3xl flex items-center justify-center p-4.5 text-purple-600 shadow border border-purple-100">
                <Sparkles className="w-12 h-12" />
              </div>
              <h3 className="font-extrabold text-lg text-slate-950 dark:text-white">
                {lang === 'ar' ? 'مرحباً بك في برو ميديا (FileForge Pro)!' : 'Welcome to FileForge Pro!'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                {lang === 'ar'
                  ? 'الجيل الجديد لمعالجة وضغط وتعديل ملفات الصور والمستندات بذكاء واحترافية متناهية محلياً.'
                  : 'An all-in-one local high-velocity workstation to compress images, audit PDFs, generate elements, run local model AI tasks.'}
              </p>
            </div>
          )}

          {currentStep === 1 && (
            <div className="text-center space-y-4 animate-slideIn">
              <div className="mx-auto w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center p-4.5 text-emerald-600 shadow border border-emerald-100">
                <ShieldCheck className="w-12 h-12" />
              </div>
              <h3 className="font-extrabold text-lg text-slate-950 dark:text-white">
                {lang === 'ar' ? 'أمان مطلق وخصوصية ١٠٠٪ دون إنترنت' : 'Absolute 100% Device Privacy'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                {lang === 'ar'
                  ? 'مستنداتك وملفاتك الحساسة لا تغادر جهازك أبداً! جميع الخوارزميات وصور المعالجة تتم داخل متصفحك محلياً.'
                  : 'All algorithms, hashes, conversions and AI processing blocks compile completely internal to your client browser sandbox.'}
              </p>
            </div>
          )}

          {currentStep === 2 && (
            <div className="text-center space-y-4 animate-slideIn">
              <div className="mx-auto w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center p-4.5 text-indigo-600 shadow border border-indigo-100">
                <Command className="w-12 h-12" />
              </div>
              <h3 className="font-extrabold text-lg text-slate-950 dark:text-white">
                {lang === 'ar' ? 'اختصارات لوحة المفاتيح والبحث السريع' : 'High Velocity Keyboard Shortcuts'}
              </h3>
              <div className="max-w-xs mx-auto text-left space-y-2 text-xs bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between font-bold text-[11px]">
                  <span className="text-slate-400">Ctrl + K</span>
                  <span className="text-slate-705 dark:text-slate-200">{lang === 'ar' ? 'شريط البحث السريع' : 'Quick bar search'}</span>
                </div>
                <div className="flex justify-between font-bold text-[11px]">
                  <span className="text-slate-400">Ctrl + D</span>
                  <span className="text-slate-705 dark:text-slate-200">{lang === 'ar' ? 'الوضع الداكن / المضيء' : 'Theme Day/Night'}</span>
                </div>
                <div className="flex justify-between font-bold text-[11px]">
                  <span className="text-slate-400">Ctrl + H</span>
                  <span className="text-slate-705 dark:text-slate-200">{lang === 'ar' ? 'لوحة السجلات والإحصائيات' : 'Travel to Logs'}</span>
                </div>
                <div className="flex justify-between font-bold text-[11px]">
                  <span className="text-slate-400">Ctrl + /</span>
                  <span className="text-slate-705 dark:text-slate-200">{lang === 'ar' ? 'عرض كل الاختصارات' : 'List shortcuts panel'}</span>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4 animate-slideIn">
              <div className="text-center space-y-1">
                <h3 className="font-extrabold text-lg text-slate-950 dark:text-white">
                  {lang === 'ar' ? 'اختر أدواتك المفضلة لبدء التشغيل' : 'Seed Your Primary Workspaces'}
                </h3>
                <p className="text-[10px] text-slate-400">{lang === 'ar' ? 'حدد الأدوات التي تود رؤيتها في قائمة المفضلة السريعة' : 'Check keys coordinates to star these utilities immediately'}</p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 max-w-sm mx-auto">
                {[
                  { id: 'image-convert', ar: 'تحويل صور', en: 'Image Convert' },
                  { id: 'image-compress', ar: 'ضغط صور', en: 'Compress size' },
                  { id: 'qr-generator', ar: 'مولد باركود QR', en: 'QR Generator' },
                  { id: 'batch-renamer', ar: 'إعادة تسمية دفعة', en: 'Batch Renamer' },
                  { id: 'file-info', ar: 'محلل Checksum', en: 'File Inspector' },
                  { id: 'file-comparator', ar: 'مقارن ملفات', en: 'File Comparator' }
                ].map((item) => {
                  const isStared = favorites.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => onToggleFavorite(item.id)}
                      className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-between cursor-pointer transition-all ${isStared ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 text-amber-705 dark:text-amber-300' : 'bg-white dark:bg-slate-900 border-slate-150 text-slate-600 dark:text-slate-300'}`}
                    >
                      <span>{lang === 'ar' ? item.ar : item.en}</span>
                      <Star className={`w-3.5 h-3.5 ${isStared ? 'fill-current' : ''}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Footer controls */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex gap-1">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <span 
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentStep ? 'w-4.5 bg-purple-600' : 'bg-slate-200'}`}
              ></span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="inline-flex items-center gap-1 text-xs font-extrabold text-slate-500 hover:text-slate-800 dark:hover:text-slate-350 cursor-pointer py-2 px-3.5"
              >
                <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                <span>{lang === 'ar' ? 'السابق' : 'Prev'}</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="inline-flex items-center gap-1 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs py-2 px-4 rounded-xl shadow cursor-pointer transition-all"
            >
              <span>{currentStep === 3 ? (lang === 'ar' ? 'ابدأ الاستخدام' : 'Get Started') : (lang === 'ar' ? 'التالي' : 'Next')}</span>
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

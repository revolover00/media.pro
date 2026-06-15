
import React, { useState } from 'react';
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  ShieldAlert, 
  Zap, 
  Star, 
  CheckCircle, 
  X,
  FileCode,
  Sliders,
  FolderLock
} from 'lucide-react';

interface OnboardingProps {
  lang: 'ar' | 'en';
  onCompleteOnboarding: (selectedTools: string[]) => void;
  onClose: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ lang, onCompleteOnboarding, onClose }) => {
  const isAr = lang === 'ar';
  
  const [step, setStep] = useState<number>(0);
  const [selectedTools, setSelectedTools] = useState<string[]>(['image-compress', 'pdf-merge', 'file-encryptor']);

  const availableStarterTools = [
    { id: 'image-compress', labelAr: '📷 ضغط وتقليص حجم الصور', labelEn: '📷 Image Compression' },
    { id: 'pdf-merge', labelAr: '📑 دمج ملفات PDF المتعددة', labelEn: '📑 Merge PDF Pages' },
    { id: 'file-encryptor', labelAr: '🛡️ تشفير الملفات AES-256', labelEn: '🛡️ Encrypt Files locally' },
    { id: 'qr-generator', labelAr: '🔗 مولد الباركود QR Code', labelEn: '🔗 QR Code Generator' },
    { id: 'metadata-scrubber', labelAr: '🧹 مسح بيانات تتبع الصور EXIF', labelEn: '🧹 EXIF Forensic Scrubber' },
    { id: 'steganography-tool', labelAr: '👁️ إخفاء البيانات السرية بالصور', labelEn: '👁️ Steganography Integration' }
  ];

  const slides = [
    {
      titleAr: 'مرحباً بك في FileForge Pro 🚀',
      titleEn: 'Welcome to FileForge Pro 🚀',
      descAr: 'المنصة المتكاملة لإدارة وتصميم وتأمين كافة ملفاتك وصورك ومستنداتك مباشرة داخل مستعرضك وفي ثوانٍ معدودة وبخصوصية ١٠٠٪ دون أي خوادم وسيطة.',
      descEn: 'The full-featured offline layout designed to help you organize, compress, encrypt, and style files locally inside sandboxed browser memory.',
      icon: <Sparkles className="w-12 h-12 text-amber-500 animate-spin-slow" />
    },
    {
      titleAr: 'أمان تشفيري وحماية عسكرية متكاملة 🛡️',
      titleEn: 'Bulletproof Local Cryptography 🛡️',
      descAr: 'تمتع بأدوات تشفير الملفات AES-255 وفك التشفير، وتنظيف بيانات تتبع الصور EXIF الجغرافية، والفرم النهائي للملفات الحساسة DoD 5220 لضمان عدم استرجاعها.',
      descEn: 'Avail of AES military grades encryption trackers, EXIF geotag sanitization filters, and secure file shredding compliant with DoD standards.',
      icon: <FolderLock className="w-12 h-12 text-emerald-500 animate-pulse" />
    },
    {
      titleAr: 'سرعة وإنتاجية فائقة بالاختصارات ⚡',
      titleEn: 'Velocity & Keyboard Accents ⚡',
      descAr: 'تحكم في أدواتك المفضلة بالسحب والإفلات، وتابع الإحصائيات الحية للمساحة الموفرة ونفذ العمليات بسرعة الصاروخ باستخدام اختصارات لوحة المفاتيح التفاعلية.',
      descEn: 'Rearrange key tabs using drag and drop handles, track live storage optimizations, and fly around with smart keyboard triggers.',
      icon: <Zap className="w-12 h-12 text-purple-500" />
    },
    {
      titleAr: 'خصص شاشتك ومفضلتك البدئية ⭐',
      titleEn: 'Structure Your Starter Screen ⭐',
      descAr: 'اختر ٣ أدوات لتضاف فورياً إلى شريط الوصول السريع بالمفضلة لتسريع مهامك وتجربة منصة FileForge Pro المبتكرة للمحترفين:',
      descEn: 'Bookmark 3 starter utilities to seed your home screen immediately. Start working with localized confidence:',
      icon: <Star className="w-12 h-12 text-blue-500" />
    }
  ];

  const handleToggleTool = (id: string) => {
    if (selectedTools.includes(id)) {
      setSelectedTools(prev => prev.filter(item => item !== id));
    } else {
      setSelectedTools(prev => [...prev, id]);
    }
  };

  const handleNext = () => {
    if (step < slides.length - 1) {
      setStep(prev => prev + 1);
    } else {
      // Completed!
      localStorage.setItem('fileforge_onboarded', 'true');
      onCompleteOnboarding(selectedTools);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl relative space-y-6 text-slate-705 dark:text-slate-205 flex flex-col justify-between min-h-[460px] animate-scaleUp">
        
        {/* Dismiss trigger */}
        <button 
          onClick={onClose}
          className="absolute left-4 top-4 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer text-slate-400 border-0"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Carousel slide contents */}
        <div className="space-y-4 text-center py-4 flex-1 flex flex-col items-center justify-center">
          
          <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-3xl mb-1.5">
            {slides[step].icon}
          </div>

          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
            {isAr ? slides[step].titleAr : slides[step].titleEn}
          </h3>

          <p className="text-xs text-slate-450 dark:text-slate-400 leading-relaxed max-w-md">
            {isAr ? slides[step].descAr : slides[step].descEn}
          </p>

          {/* Selector on last step */}
          {step === 3 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-bold w-full max-w-md pt-2">
              {availableStarterTools.map(tool => {
                const isSelected = selectedTools.includes(tool.id);
                return (
                  <button
                    key={tool.id}
                    onClick={() => handleToggleTool(tool.id)}
                    className={`p-2.5 rounded-xl border text-right cursor-pointer transition flex items-center justify-between ${isSelected ? 'bg-amber-500/10 border-amber-500 text-amber-600' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 text-slate-500'}`}
                  >
                    <span>{isAr ? tool.labelAr : tool.labelEn}</span>
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={() => {}} // handled by button click
                      className="accent-amber-500 scale-95" 
                    />
                  </button>
                );
              })}
            </div>
          )}

        </div>

        {/* Steps indicator dots */}
        <div className="flex justify-between items-center border-t border-slate-50 dark:border-slate-800 pt-4 text-xs font-bold font-sans">
          
          <div className="flex gap-1">
            {slides.map((_, i) => (
              <span 
                key={i} 
                className={`w-2 h-2 rounded-full transition-all ${i === step ? 'bg-amber-500 w-4' : 'bg-slate-200 dark:bg-slate-800'}`} 
              />
            ))}
          </div>

          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={handleBack}
                className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{isAr ? 'السابق' : 'Prev'}</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-5 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl shadow-md cursor-pointer flex items-center gap-1 border-0"
            >
              <span>{step === 3 ? (isAr ? 'ابدأ الاستخدام ⭐' : 'Let\'s Go ⭐') : (isAr ? 'التالي' : 'Next')}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};

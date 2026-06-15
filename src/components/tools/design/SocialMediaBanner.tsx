
import React, { useState, useRef, useEffect } from 'react';
import { 
  FileImage, 
  Trash2, 
  Download, 
  Sparkles, 
  Check, 
  User, 
  Camera,
  AtSign,
  Monitor,
  Linkedin,
  Twitter,
  Youtube,
  Facebook,
  RotateCcw,
  Palette
} from 'lucide-react';

interface SocialMediaBannerProps {
  lang: 'ar' | 'en';
  onAddHistoryItem?: (item: any, blob?: Blob) => void;
}

interface PlatformPreset {
  id: string;
  nameAr: string;
  nameEn: string;
  width: number;
  height: number;
  icon: any;
  avatarX: number; // Percentage from left of avatar
  avatarY: number; // Percentage from top
  avatarSize: number; // Percentage of container
}

const PLATFORMS: PlatformPreset[] = [
  { id: 'twitter', nameAr: 'ترويسة إكس / تويتر', nameEn: 'Twitter / X Header', width: 1500, height: 500, icon: Twitter, avatarX: 10, avatarY: 75, avatarSize: 22 },
  { id: 'linkedin', nameAr: 'غلاف لينكد إن الاحترافي', nameEn: 'LinkedIn Cover', width: 1584, height: 396, icon: Linkedin, avatarX: 12, avatarY: 82, avatarSize: 25 },
  { id: 'youtube', nameAr: 'بنر قناة يوتيوب', nameEn: 'YouTube Banner', width: 2560, height: 1440, icon: Youtube, avatarX: 50, avatarY: 50, avatarSize: 15 },
  { id: 'facebook', nameAr: 'غلاف فيسبوك العائلي', nameEn: 'Facebook Timeline Cover', width: 851, height: 315, icon: Facebook, avatarX: 8, avatarY: 80, avatarSize: 20 }
];

const PRESETS = [
  { name: 'Cyber Neon', grad: 'from-zinc-950 via-slate-900 to-indigo-950', text: '#00ffff', sub: '#ff007f', font: 'font-mono' },
  { name: 'Classic Executive', grad: 'from-slate-905 via-slate-800 to-slate-950', text: '#fbbf24', sub: '#cbd5e1', font: 'font-serif' },
  { name: 'Aurora Sunset', grad: 'from-violet-850 via-fuchsia-950 to-orange-900', text: '#ffffff', sub: '#fed7aa', font: 'font-sans' },
  { name: 'Emerald Forest', grad: 'from-emerald-950 via-teal-900 to-slate-950', text: '#34d399', sub: '#a7f3d0', font: 'font-sans' },
  { name: 'Minimalist Clean', grad: 'from-slate-100 to-slate-200', text: '#0f172a', sub: '#475569', font: 'font-sans' }
];

export const SocialMediaBanner: React.FC<SocialMediaBannerProps> = ({ lang, onAddHistoryItem }) => {
  const isAr = lang === 'ar';
  
  const [platformId, setPlatformId] = useState<string>('twitter');
  const [presetIndex, setPresetIndex] = useState<number>(0);
  
  // Custom text attributes
  const [title, setTitle] = useState<string>(isAr ? 'خبير معالجة وهندسة الملفات' : 'Data Architect & Local Compiler');
  const [subtitle, setSubtitle] = useState<string>(isAr ? 'مستندات مرنة • أداء سريع • أوفلاين بالكامل' : 'Synthesizing fast layouts offline, standard compliant.');
  const [handle, setHandle] = useState<string>('@FileForgePro');
  
  // Custom Avatar
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const [showAvatarMock, setShowAvatarMock] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string>('');

  const activePlatform = PLATFORMS.find(p => p.id === platformId) || PLATFORMS[0];
  const activePreset = PRESETS[presetIndex];
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const showLocalToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCustomAvatar(reader.result as string);
      showLocalToast(isAr ? 'تم تحميل صورتك الشخصية لمعاينة فضاء الأمان!' : 'Profile avatar loaded into the preview safe zone!');
    };
    reader.readAsDataURL(file);
  };

  // Main high-res canvas rendering and downloading
  const generateAndDownload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = activePlatform.width;
    canvas.height = activePlatform.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    if (activePreset.name === 'Cyber Neon') {
      gradient.addColorStop(0, '#09090b');
      gradient.addColorStop(0.5, '#0f172a');
      gradient.addColorStop(1, '#1e1b4b');
    } else if (activePreset.name === 'Classic Executive') {
      gradient.addColorStop(0, '#1e293b');
      gradient.addColorStop(1, '#0f172a');
    } else if (activePreset.name === 'Aurora Sunset') {
      gradient.addColorStop(0, '#4c1d95');
      gradient.addColorStop(0.5, '#701a75');
      gradient.addColorStop(1, '#7c2d12');
    } else if (activePreset.name === 'Emerald Forest') {
      gradient.addColorStop(0, '#022c22');
      gradient.addColorStop(1, '#090d16');
    } else {
      gradient.addColorStop(0, '#f1f5f9');
      gradient.addColorStop(1, '#cbd5e1');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Draw aesthetic accent shapes (cyber grid lines or stars)
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let j = 0; j < canvas.height; j += 40) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(canvas.width, j);
      ctx.stroke();
    }

    // 3. Draw Typography
    const scaleFactor = canvas.height / 500; // Relative font scaling match
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Title Draw (Middle alignment if YouTube, otherwise offset slightly)
    const isCenterLayout = activePlatform.id === 'youtube';
    const textX = isCenterLayout ? canvas.width / 2 : canvas.width * 0.58;
    const textY = canvas.height * 0.42;

    // Title
    ctx.font = `bold ${50 * scaleFactor}px system-ui, "Segoe UI", sans-serif`;
    ctx.fillStyle = activePreset.text;
    ctx.fillText(title, textX, textY);

    // Subtitle
    ctx.font = `${24 * scaleFactor}px system-ui, "Segoe UI", sans-serif`;
    ctx.fillStyle = activePreset.sub;
    ctx.fillText(subtitle, textX, textY + 65 * scaleFactor);

    // Social Media Handle
    if (handle.trim()) {
      ctx.font = `italic bold ${20 * scaleFactor}px monospace`;
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      if (activePreset.name === 'Minimalist Clean') {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
      }
      ctx.fillText(handle, textX, textY + 115 * scaleFactor);
    }

    // 4. Download Trigger
    const url = canvas.toDataURL('image/png', 1.0);
    const blob = dataURLtoBlob(url);
    const filename = `${activePlatform.id}_banner_${Date.now()}.png`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);

    showLocalToast(isAr ? 'تهانينا! تم توليد وتصدير البنر بأعلى دقة!' : 'High resolution social header exported!');

    if (onAddHistoryItem) {
      onAddHistoryItem({
        action: isAr ? `تصميم بنر غلاف لـ ${activePlatform.nameEn}` : `Header Banner Crop for ${activePlatform.nameEn}`,
        fileName: filename,
        originalSize: 45000,
        processedSize: blob.size,
        type: 'image'
      }, blob);
    }
  };

  const dataURLtoBlob = (dataurl: string) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  return (
    <div id="social-banner-container" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-5 sm:p-6 shadow-sm space-y-6 text-slate-700 dark:text-slate-200">
      
      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 dark:bg-slate-800 text-white py-2.5 px-5 rounded-2xl shadow-lg border border-slate-700 text-xs font-bold animate-slideUp z-50 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-50 dark:border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 p-3 rounded-2xl text-emerald-500">
            <Monitor className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isAr ? 'مصمم ومناسق أغلفة قنوات السوشيال ميديا' : 'Omnichannel Header & Cover Designer'}
            </h2>
            <p className="text-xs text-slate-400">
              {isAr ? 'أنشئ ترويسات متجانسة لإكس ولينكد إن ويوتيوب مع التنبؤ الدقيق بمساحة الصورة الرمزية الآمنة لعدم تداخل الكلمات' : 'Design perfectly-sized cover banners, preview profile safe zones, and export 100% responsive assets'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Platforms selection & attributes left (5 cols), Preview Canvas Right (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
        
        {/* Left Side fields (5 cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Target platforms list */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500">{isAr ? 'اختر الشبكة والمنصة المستهدفة' : 'Target Platform Crop'}</label>
            <div className="grid grid-cols-2 gap-2">
              {PLATFORMS.map((plat) => {
                const PlatIcon = plat.icon;
                const isActive = platformId === plat.id;
                return (
                  <button
                    key={plat.id}
                    onClick={() => setPlatformId(plat.id)}
                    className={`flex items-center gap-1.5 p-2.5 rounded-xl border-2 text-left text-xs transition cursor-pointer font-bold ${isActive ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500 text-slate-900 dark:text-white' : 'bg-slate-50 border-slate-100 dark:bg-slate-800 dark:border-slate-800 hover:border-slate-200 text-slate-600'}`}
                  >
                    <PlatIcon className={`w-4 h-4 ${isActive ? 'text-emerald-500' : 'text-slate-400'}`} />
                    <span className="truncate">{isAr ? plat.nameAr.split(' ')[0] : plat.nameEn.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Aesthetic presets */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <Palette className="w-3.5 h-3.5 text-emerald-500" />
              <span>{isAr ? 'طيف النمط المنهجي / الجدار' : 'Graphic Style Theme'}</span>
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {PRESETS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setPresetIndex(idx)}
                  className={`aspect-square w-full rounded-xl bg-gradient-to-tr ${item.grad} border-2 transition hover:scale-105 cursor-pointer ${presetIndex === idx ? 'border-emerald-500 scale-95 shadow-md' : 'border-slate-100 dark:border-slate-800'}`}
                  title={item.name}
                />
              ))}
            </div>
          </div>

          {/* Texts inputs */}
          <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-3.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-200/50 pb-1.5">
              {isAr ? 'عناوين الترويسة وبصمتك' : 'Banner Inscription Content'}
            </span>

            {/* Primary Title */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400">{isAr ? 'العنوان الأساسي' : 'Primary Display Title'}</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-1.5 px-3 text-xs"
              />
            </div>

            {/* Secondary Subtitle */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400">{isAr ? 'الوصف / الشعار الفرعي' : 'Subtitle Tagline'}</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-1.5 px-3 text-xs"
              />
            </div>

            {/* Micro Handle */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5">
                <AtSign className="w-3 h-3 text-emerald-500" />
                <span>{isAr ? 'حساب السوشيال ميديا الرئيسي' : 'Social Handle @'}</span>
              </label>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-1.5 px-3 text-xs font-mono"
              />
            </div>

            {/* Upload avatar preview overlay */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-1.5 text-[10px] text-slate-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAvatarMock}
                  onChange={(e) => setShowAvatarMock(e.target.checked)}
                  className="accent-emerald-500 rounded"
                />
                <span>{isAr ? 'معاينة مساحة الأفاتار لوضع الأمان' : 'Predict profile safety spot'}</span>
              </label>

              <input
                type="file"
                ref={avatarInputRef}
                onChange={handleAvatarUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="text-[9px] hover:underline hover:text-emerald-500 text-slate-400 font-bold border-0 bg-transparent cursor-pointer flex items-center gap-0.5"
              >
                <Camera className="w-3 h-3" />
                <span>{isAr ? 'تحميل صورة رمزية' : 'Inject Avatar'}</span>
              </button>
            </div>
          </div>

        </div>

        {/* Right Side: Render canvas & Aspect container ratio mockup (8 cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <span>{isAr ? 'محاكي الأبعاد والطبقات لـ:' : 'Symmetric proportions emulator:'}</span>
              <span className="text-emerald-500 font-bold">{isAr ? activePlatform.nameAr : activePlatform.nameEn}</span>
              <span className="text-[10px] text-slate-400 font-mono">({activePlatform.width}x{activePlatform.height}px)</span>
            </span>
          </div>

          {/* Banner canvas box */}
          <div className="border border-slate-100 dark:border-slate-800 bg-slate-950 rounded-2xl p-4 flex items-center justify-center min-h-[340px] h-[340px]">
            {/* Proportional wrapper block mockup */}
            <div 
              style={{
                aspectRatio: `${activePlatform.width} / ${activePlatform.height}`,
                width: '100%',
                maxHeight: '100%'
              }}
              className={`relative bg-gradient-to-tr ${activePreset.grad} rounded-xl overflow-hidden flex flex-col justify-center text-center p-6 ${activePreset.font} shadow-lg shadow-black/20`}
            >
              {/* Aesthetic subtle grid lines overlays */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px]" />

              {/* Inscription text blocks */}
              <div className="relative z-10 space-y-1 px-4">
                <h3 
                  style={{ color: activePreset.text }}
                  className="text-base sm:text-lg md:text-xl font-bold tracking-tight uppercase"
                >
                  {title || (isAr ? 'العنوان الرئيسي' : 'Header Title')}
                </h3>
                <p 
                  style={{ color: activePreset.sub }}
                  className="text-[10px] sm:text-xs md:text-sm font-medium opacity-90 max-w-md mx-auto"
                >
                  {subtitle || (isAr ? 'الوصف الفرعي' : 'Context description tags here')}
                </p>
                {handle.trim() && (
                  <div className="text-[9px] sm:text-[10px] text-slate-400 font-mono italic pt-1 opacity-60">
                    {handle}
                  </div>
                )}
              </div>

              {/* Absolute Avatar placeholder mockup circle safe zone overlay (shows Twitter/LinkedIn offset circle) */}
              {showAvatarMock && (
                <div 
                  style={{
                    left: `${activePlatform.avatarX}%`,
                    top: `${activePlatform.avatarY}%`,
                    width: `${activePlatform.avatarSize}%`,
                    aspectRatio: '1/1'
                  }}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 bg-slate-900 border-4 border-slate-950 rounded-full overflow-hidden flex items-center justify-center shadow-lg group select-none hover:scale-105 transition-transform z-20"
                >
                  {customAvatar ? (
                    <img
                      src={customAvatar}
                      alt="Avatar Safe spot"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-1 text-[8px] text-slate-400">
                      <User className="w-5 h-5 text-emerald-500 mb-0.5 animate-pulse" />
                      <span className="font-sans leading-none tracking-tighter shrink-0">{isAr ? 'الأفاتار' : 'Avatar'}</span>
                    </div>
                  )}
                  {/* Danger bounds check */}
                  <div className="absolute inset-0 bg-red-500/10 border border-red-500/80 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center">
                    <span className="text-[7px] text-red-400 font-bold tracking-tight uppercase shrink-0">{isAr ? 'منطقة آمنة' : 'Safe Spot'}</span>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Download row */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-[10px] text-slate-400">
              {isAr ? 'يتضمن الملف النهائي المصدّر الخلفية والكلمات والأشكال بدقة دوت-بي-آي احترافية ومقاسات موصى بها' : 'Synthesizes high resolution platform covers immediately on device'}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={generateAndDownload}
                className="px-4.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5 border-0 shadow-sm"
              >
                <Download className="w-4 h-4 animate-bounce" />
                <span>{isAr ? 'تنزيل البنر بجودة فائقة' : 'Download Cover PNG'}</span>
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

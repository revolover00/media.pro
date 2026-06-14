'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Smile, 
  Download, 
  Upload, 
  Trash2, 
  Sparkles, 
  Check, 
  Move,
  Type,
  Maximize2
} from 'lucide-react';

interface MemeGeneratorProps {
  lang: 'ar' | 'en';
  onAddHistoryItem?: (item: any, blob?: Blob) => void;
}

interface MemeTemplate {
  nameAr: string;
  nameEn: string;
  url: string;
}

const TEMPLATES: MemeTemplate[] = [
  { nameAr: 'صديق مشتت (Distracted Boyfriend)', nameEn: 'Distracted Boyfriend', url: 'https://i.imgflip.com/1ur96a.jpg' },
  { nameAr: 'دريك يختار (Drake Hotline Bling)', nameEn: 'Drake Hotline Bling', url: 'https://i.imgflip.com/1g8my4.jpg' },
  { nameAr: 'بطل العضلة (Swole Doge vs Cheems)', nameEn: 'Swole Doge vs Cheems', url: 'https://i.imgflip.com/43a45p.png' },
  { nameAr: 'لا يمكن ببساطة (One Does Not Simply)', nameEn: 'One Does Not Simply', url: 'https://i.imgflip.com/1bih.jpg' },
  { nameAr: 'غير رأيي (Change My Mind)', nameEn: 'Change My Mind', url: 'https://i.imgflip.com/24y43o.jpg' },
  { nameAr: 'باتمان يصفع روبن (Batman Slap)', nameEn: 'Batman Slapping Robin', url: 'https://i.imgflip.com/9ehk9.jpg' },
  { nameAr: 'طفل النجاح (Success Kid)', nameEn: 'Success Kid', url: 'https://i.imgflip.com/1bhk.jpg' },
  { nameAr: 'زران صعبان (Two Buttons)', nameEn: 'Two Buttons', url: 'https://i.imgflip.com/1g70ps.jpg' },
  { nameAr: 'مهرج الماكياج (Clown Makeup)', nameEn: 'Clown Makeup', url: 'https://i.imgflip.com/3v686f.jpg' },
  { nameAr: 'كارثة الفتاة (Disaster Girl)', nameEn: 'Disaster Girl', url: 'https://i.imgflip.com/23ls.jpg' },
  { nameAr: 'عقل متوسع (Expanding Brain)', nameEn: 'Expanding Brain', url: 'https://i.imgflip.com/1jwhww.jpg' },
  { nameAr: 'تفكير ذكي (Roll Safe)', nameEn: 'Smart Guy Roll Safe', url: 'https://i.imgflip.com/1h7in3.jpg' }
];

export const MemeGenerator: React.FC<MemeGeneratorProps> = ({ lang, onAddHistoryItem }) => {
  const isAr = lang === 'ar';
  
  const [selectedTemplate, setSelectedTemplate] = useState<number>(0);
  const [customImage, setCustomImage] = useState<string | null>(null);
  
  // Captions
  const [topText, setTopText] = useState<string>(isAr ? 'عندما يعمل الكود' : 'WHEN THE ON-DEVICE CODE WORKS');
  const [bottomText, setBottomText] = useState<string>(isAr ? 'من المحاولة الأولى!' : 'ON THE FIRST EXPLORATION!');
  
  // Custom Styles
  const [fontSize, setFontSize] = useState<number>(36);
  const [textColor, setTextColor] = useState<string>('#ffffff');
  const [strokeColor, setStrokeColor] = useState<string>('#000000');
  const [strokeWidth, setStrokeWidth] = useState<number>(5);
  const [fontFamily, setFontFamily] = useState<string>('Impact'); // Impact, Cairo, Arial, Amiri

  // Draggable percentages on-screen (X: 0 to 100, Y: 0 to 100)
  const [topPos, setTopPos] = useState({ x: 50, y: 15 });
  const [bottomPos, setBottomPos] = useState({ x: 50, y: 85 });
  const [activeDrag, setActiveDrag] = useState<'top' | 'bottom' | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toastMessage, setToastMessage] = useState<string>('');

  const showLocalToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCustomImage(reader.result as string);
      showLocalToast(isAr ? 'تم تحميل صورتك الخاصة بنجاح!' : 'Custom graphic loaded successfully!');
    };
    reader.readAsDataURL(file);
  };

  // Drag & drop logic on pointer moves
  const handlePointerDown = (type: 'top' | 'bottom') => {
    setActiveDrag(type);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeDrag || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    // Convert to percentages
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Boundary constraints
    const cleanX = Math.max(5, Math.min(95, x));
    const cleanY = Math.max(5, Math.min(95, y));

    if (activeDrag === 'top') {
      setTopPos({ x: cleanX, y: cleanY });
    } else {
      setBottomPos({ x: cleanX, y: cleanY });
    }
  };

  const handlePointerUp = () => {
    setActiveDrag(null);
  };

  // Canvas assembler & download engine
  const downloadMeme = () => {
    const imgObj = new Image();
    imgObj.crossOrigin = 'anonymous';
    imgObj.referrerPolicy = 'no-referrer';
    imgObj.src = customImage || TEMPLATES[selectedTemplate].url;

    imgObj.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = imgObj.naturalWidth || 800;
      canvas.height = imgObj.naturalHeight || 800;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw background
      ctx.drawImage(imgObj, 0, 0, canvas.width, canvas.height);

      // Setup typography attributes
      const rFontSize = (fontSize / 450) * canvas.height; 
      ctx.font = `bold ${rFontSize}px ${fontFamily}, "Cairo", Impact, Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Top Text Draw
      if (topText.trim()) {
        const topX = (topPos.x / 100) * canvas.width;
        const topY = (topPos.y / 100) * canvas.height;
        drawStrokeText(ctx, topText.toUpperCase(), topX, topY);
      }

      // Bottom Text Draw
      if (bottomText.trim()) {
        const botX = (bottomPos.x / 100) * canvas.width;
        const botY = (bottomPos.y / 100) * canvas.height;
        drawStrokeText(ctx, bottomText.toUpperCase(), botX, botY);
      }

      const url = canvas.toDataURL('image/png');
      const blob = dataURLtoBlob(url);
      const filename = `meme_${Date.now()}.png`;

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      showLocalToast(isAr ? 'مبارك! تم دمج الميم وتنزيله!' : 'Meme rendered and saved!');

      if (onAddHistoryItem) {
        onAddHistoryItem({
          action: isAr ? 'تصميم وصناعة ميم فكاهي' : 'Meme Creative Generation',
          fileName: filename,
          originalSize: 50000,
          processedSize: blob.size,
          type: 'image'
        }, blob);
      }
    };

    imgObj.onerror = () => {
      // Fallback if CORS blocked external Imgflip url
      showLocalToast(isAr ? 'عذراً، حماية الخادم المتوافقة منعت تنزيل قالب الوب المباشر. يرجى تجربة رفع صورة خاصة.' : 'Direct template download blocked by CORS. Please upload your custom template.');
    };
  };

  const drawStrokeText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number) => {
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = textColor;
    
    // Draw thick border outline
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
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
    <div id="meme-generator-container" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-5 sm:p-6 shadow-sm space-y-6 text-slate-700 dark:text-slate-200">
      
      {/* Toast Alert pop ups */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 dark:bg-slate-800 text-white py-2.5 px-5 rounded-2xl shadow-lg border border-slate-700 text-xs font-bold animate-slideUp z-50 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main title bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-50 dark:border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-rose-500/10 p-3 rounded-2xl text-rose-500">
            <Smile className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isAr ? 'صانع ميمز وبطاقات السوشيال ميديا' : 'Creative Meme Poster Generator'}
            </h2>
            <p className="text-xs text-slate-400">
              {isAr ? 'صمم ميمز مضحكة واحترافية بسحب الكلمات وتعديل الخطوط والظلال الفورية لمختلف قوالب الصور' : 'Craft high-contrast memes using draggable captions, bold custom outlines, and image presets'}
            </p>
          </div>
        </div>
      </div>

      {/* Workspace panel dividers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Preset template selectors / uploads (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800/60 pb-1.5">
              <span className="text-xs font-bold text-slate-500">{isAr ? 'قوالب الميمز الشائعة' : 'Preset Meme Canvases'}</span>
              
              {/* Custom Uploader trigger */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleCustomUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-2 py-1 text-[10px] rounded-lg bg-rose-500 text-white font-bold cursor-pointer border-0 flex items-center gap-1 hover:bg-rose-600"
              >
                <Upload className="w-3 h-3" />
                <span>{isAr ? 'ارفع صورتك' : 'Upload custom'}</span>
              </button>
            </div>

            {/* Scrolling templates list */}
            <div className="grid grid-cols-3 gap-2 max-h-[220px] overflow-y-auto pr-1">
              {TEMPLATES.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCustomImage(null);
                    setSelectedTemplate(idx);
                  }}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition ${!customImage && selectedTemplate === idx ? 'border-rose-500 scale-95 shadow-md' : 'border-slate-100 dark:border-slate-850 hover:border-slate-300'}`}
                >
                  <img
                    src={item.url}
                    alt={item.nameEn}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover select-none pointer-events-none"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-slate-950/70 p-1 text-center truncate">
                    <span className="text-[8px] font-bold text-white leading-none">{isAr ? item.nameAr.split(' ')[0] : item.nameEn.split(' ')[0]}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Typography Customization Fields */}
          <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5 border-b border-slate-200/50 pb-1.5">
              <Type className="w-3.5 h-3.5 text-rose-500" />
              {isAr ? 'تخصيص الخط والحدود والظلال' : 'Caption Styling Props'}
            </span>

            {/* Inputs Text */}
            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400">{isAr ? 'النص العلوي (Top Caption)' : 'Top Caption'}</label>
                <input
                  type="text"
                  value={topText}
                  onChange={(e) => setTopText(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-1.5 px-3 text-xs leading-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400">{isAr ? 'النص السفلي (Bottom Caption)' : 'Bottom Caption'}</label>
                <input
                  type="text"
                  value={bottomText}
                  onChange={(e) => setBottomText(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-1.5 px-3 text-xs leading-none"
                />
              </div>
            </div>

            {/* Inline attributes sizes */}
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">{isAr ? 'حجم الخط' : 'Font Size'}</label>
                <input
                  type="range"
                  min="16"
                  max="64"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500">{isAr ? 'سمك الإطار الخارجي' : 'Outlines size'}</label>
                <input
                  type="range"
                  min="0"
                  max="12"
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Theme / Picker color stops */}
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="space-y-1">
                <label className="font-bold text-slate-500 block mb-1">{isAr ? 'لون الكلمات' : 'Text color'}</label>
                <div className="flex items-center gap-1">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-8 h-6 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <span className="font-mono text-[9px] uppercase font-bold text-slate-500">{textColor}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 block mb-1">{isAr ? 'لون الإطار' : 'Outline color'}</label>
                <div className="flex items-center gap-1">
                  <input
                    type="color"
                    value={strokeColor}
                    onChange={(e) => setStrokeColor(e.target.value)}
                    className="w-8 h-6 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <span className="font-mono text-[9px] uppercase font-bold text-slate-500">{strokeColor}</span>
                </div>
              </div>
            </div>

            {/* Select Fonts */}
            <div className="space-y-1 text-[10px]">
              <label className="font-bold text-slate-500 uppercase">{isAr ? 'عائلة الخط المطبوع' : 'Capitals Font Face'}</label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 rounded-lg py-1.5 px-2 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white text-[11px] cursor-pointer"
              >
                <option value="Impact">Impact (Standard Meme)</option>
                <option value="Cairo">Cairo (Arabic Sans)</option>
                <option value="Amiri">Amiri (Traditional Serif)</option>
                <option value="Arial">Arial Standard</option>
              </select>
            </div>

          </div>
        </div>

        {/* Right Side: Visual canvas Dragging Frame (8 cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <Move className="w-5 h-5 text-rose-500" />
              {isAr ? 'تثبيت ومحاذاة الميم (اسحب النص لتغيير الموضع)' : 'Draggable Canvas Stage (Drag captions anywhere)'}
            </span>
          </div>

          <div 
            ref={containerRef}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="relative border border-slate-100 dark:border-slate-800 bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center min-h-[400px] h-[400px] select-none shadow-inner cursor-crosshair"
          >
            {/* Background Image template */}
            <img
              src={customImage || TEMPLATES[selectedTemplate].url}
              alt="Meme Backing Template"
              referrerPolicy="no-referrer"
              className="max-w-full max-h-full object-contain pointer-events-none"
            />

            {/* Absolute overlay captions based on draggable percentage coordinate inputs */}
            {topText.trim() && (
              <div
                onPointerDown={() => handlePointerDown('top')}
                style={{
                  left: `${topPos.x}%`,
                  top: `${topPos.y}%`,
                  fontSize: `${fontSize}px`,
                  color: textColor,
                  textShadow: `
                    -${strokeWidth}px -${strokeWidth}px 0 ${strokeColor},  
                     ${strokeWidth}px -${strokeWidth}px 0 ${strokeColor},
                    -${strokeWidth}px  ${strokeWidth}px 0 ${strokeColor},
                     ${strokeWidth}px  ${strokeWidth}px 0 ${strokeColor},
                     0 2px 4px rgba(0,0,0,0.5)
                  `,
                  fontFamily: `${fontFamily}, system-ui`
                }}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing text-center leading-tight font-extrabold select-none z-30 uppercase whitespace-nowrap active:scale-105 transition-transform px-3 py-1 flex items-center gap-1 group border-dashed hover:border border-transparent hover:border-slate-350 ${activeDrag === 'top' ? 'cursor-grabbing border-orange-400' : ''}`}
              >
                <span>{topText}</span>
              </div>
            )}

            {bottomText.trim() && (
              <div
                onPointerDown={() => handlePointerDown('bottom')}
                style={{
                  left: `${bottomPos.x}%`,
                  top: `${bottomPos.y}%`,
                  fontSize: `${fontSize}px`,
                  color: textColor,
                  textShadow: `
                    -${strokeWidth}px -${strokeWidth}px 0 ${strokeColor},  
                     ${strokeWidth}px -${strokeWidth}px 0 ${strokeColor},
                    -${strokeWidth}px  ${strokeWidth}px 0 ${strokeColor},
                     ${strokeWidth}px  ${strokeWidth}px 0 ${strokeColor},
                     0 2px 4px rgba(0,0,0,0.5)
                  `,
                  fontFamily: `${fontFamily}, system-ui`
                }}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing text-center leading-tight font-extrabold select-none z-30 uppercase whitespace-nowrap active:scale-105 transition-transform px-3 py-1 flex items-center gap-1 border-dashed hover:border border-transparent hover:border-slate-350 ${activeDrag === 'bottom' ? 'cursor-grabbing border-orange-400' : ''}`}
              >
                <span>{bottomText}</span>
              </div>
            )}
          </div>

          {/* Download strip */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-[10px] text-slate-400">
              {isAr ? 'انقر واسحب العناوين داخل الصورة لتعديل التموضع بشكل فوري' : 'Click & hold caption text on the canvas above to drag-n-drop reposition them'}
            </span>
            <div className="flex items-center gap-2">
              {(customImage) && (
                <button
                  onClick={() => {
                    setCustomImage(null);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 hover:text-red-500 cursor-pointer text-xs font-bold border-0"
                >
                  {isAr ? 'المسح والرجوع للقالب العام' : 'Restore template'}
                </button>
              )}
              <button
                onClick={downloadMeme}
                className="px-4.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5 border-0 shadow-sm transition"
              >
                <Download className="w-4 h-4" />
                <span>{isAr ? 'تحميل وحفظ صورة الميم' : 'Download Meme PNG'}</span>
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeftRight, 
  Trash2, 
  Columns, 
  Layers, 
  Layout, 
  Info, 
  Sliders, 
  Maximize2, 
  Check, 
  Image as ImageIcon 
} from 'lucide-react';
import { UploadZone } from '../../UploadZone';

interface ImageComparatorProps {
  lang: 'ar' | 'en';
}

type CompareMode = 'slider' | 'side-by-side' | 'blend';

export const ImageComparator: React.FC<ImageComparatorProps> = ({ lang }) => {
  const isAr = lang === 'ar';

  const [imageBefore, setImageBefore] = useState<File | null>(null);
  const [imageAfter, setImageAfter] = useState<File | null>(null);

  const [previewBefore, setPreviewBefore] = useState<string>('');
  const [previewAfter, setPreviewAfter] = useState<string>('');

  const [compareMode, setCompareMode] = useState<CompareMode>('slider');
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage 0-100
  const [blendAlpha, setBlendAlpha] = useState<number>(50); // percentage 0-100 for overlay blend mode
  const [slideOrientation, setSlideOrientation] = useState<'horizontal' | 'vertical'>('horizontal');

  // Specs
  const [specsBefore, setSpecsBefore] = useState<{ name: string; size: string; w: number; h: number }>({ name: '', size: '', w: 0, h: 0 });
  const [specsAfter, setSpecsAfter] = useState<{ name: string; size: string; w: number; h: number }>({ name: '', size: '', w: 0, h: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);

  useEffect(() => {
    return () => {
      if (previewBefore) URL.revokeObjectURL(previewBefore);
      if (previewAfter) URL.revokeObjectURL(previewAfter);
    };
  }, [previewBefore, previewAfter]);

  const handleBeforeSelected = (files: File[]) => {
    if (files.length > 0) {
      const selected = files[0];
      setImageBefore(selected);
      const url = URL.createObjectURL(selected);
      setPreviewBefore(url);

      const img = new Image();
      img.src = url;
      img.onload = () => {
        setSpecsBefore({
          name: selected.name,
          size: (selected.size / 1024).toFixed(1) + ' KB',
          w: img.naturalWidth,
          h: img.naturalHeight
        });
      };
    }
  };

  const handleAfterSelected = (files: File[]) => {
    if (files.length > 0) {
      const selected = files[0];
      setImageAfter(selected);
      const url = URL.createObjectURL(selected);
      setPreviewAfter(url);

      const img = new Image();
      img.src = url;
      img.onload = () => {
        setSpecsAfter({
          name: selected.name,
          size: (selected.size / 1024).toFixed(1) + ' KB',
          w: img.naturalWidth,
          h: img.naturalHeight
        });
      };
    }
  };

  // Drag handlers for the divider split position
  const handleMove = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    if (slideOrientation === 'horizontal') {
      const x = clientX - rect.left;
      const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPosition(pct);
    } else {
      const y = clientY - rect.top;
      const pct = Math.max(0, Math.min(100, (y / rect.height) * 100));
      setSliderPosition(pct);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons === 1 || isDraggingRef.current) {
      handleMove(e.clientX, e.clientY);
    }
  };

  const handleStartDragging = (e: React.MouseEvent | React.TouchEvent) => {
    isDraggingRef.current = true;
    if ('clientX' in e) {
      handleMove(e.clientX, e.clientY);
    } else if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleStopDragging = () => {
    isDraggingRef.current = false;
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleStopDragging);
    window.addEventListener('touchend', handleStopDragging);
    return () => {
      window.removeEventListener('mouseup', handleStopDragging);
      window.removeEventListener('touchend', handleStopDragging);
    };
  }, []);

  const clearComparators = () => {
    setImageBefore(null);
    setImageAfter(null);
    setPreviewBefore('');
    setPreviewAfter('');
    setSpecsBefore({ name: '', size: '', w: 0, h: 0 });
    setSpecsAfter({ name: '', size: '', w: 0, h: 0 });
  };

  return (
    <div className="space-y-6">
      {/* Title Header Card */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-purple-100 dark:border-slate-700/50 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/40 text-purple-750 dark:text-purple-300 rounded-2xl">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-purple-950 dark:text-white">
              {isAr ? '📐 مقارنة الفروق والنتائج المزدوجة' : 'Interactive Before/After Photo Comparator'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isAr 
                ? 'قارن بوضوح وتفاعلية بين صورتين (الأصل والنتيجة المعالجة بعد الضغط أو القص)، عن طريق شريط السحب الزجاجي أو مطابقة الشفافية.' 
                : 'Directly overlap or place side-by-side two images to inspect compressions, filtration differences, or resolution quality.'}
            </p>
          </div>
        </div>
        {(imageBefore || imageAfter) && (
          <button 
            onClick={clearComparators}
            className="flex items-center justify-center gap-1.5 text-red-650 hover:text-red-755 font-bold text-xs bg-red-50 hover:bg-red-105 dark:bg-red-950/20 dark:hover:bg-red-950/30 p-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap self-start"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isAr ? 'حذف الصورتين والبدء مجدداً' : 'Erase Both & Start Over'}</span>
          </button>
        )}
      </div>

      {/* Upload Zone grid when at least one image is missing */}
      {(!previewBefore || !previewAfter) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Before Selector */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-purple-100 dark:border-slate-700/50 space-y-4">
            <span className="bg-red-50 dark:bg-red-950/30 text-red-650 dark:text-red-400 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              {isAr ? '1. الصورة الأصلية (قبل)' : '1. Original Image (Before)'}
            </span>
            {previewBefore ? (
              <div className="relative aspect-video rounded-3xl bg-neutral-50 dark:bg-slate-900 border overflow-hidden flex items-center justify-center p-2">
                <img src={previewBefore} alt="Before preview" className="max-h-full max-w-full object-contain rounded-xl" referrerPolicy="no-referrer" />
                <button onClick={() => { setImageBefore(null); setPreviewBefore(''); }} className="absolute top-2 right-2 bg-red-50 text-red-650 p-2 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            ) : (
              <UploadZone
                onFilesSelected={handleBeforeSelected}
                accept="image/*"
                title={isAr ? 'إرفاق الصورة الأولى (قبل)' : 'Attach Image A (Before)'}
                subtitle={isAr ? 'الصورة التأسيسية كمعيار أول' : 'Your benchmark comparison image'}
                maxSizeMB={40}
              />
            )}
          </div>

          {/* After Selector */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-purple-100 dark:border-slate-700/50 space-y-4">
            <span className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-650 dark:text-emerald-400 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              {isAr ? '2. الصورة الناتجة (بعد المعالجة)' : '2. Target Result (After)'}
            </span>
            {previewAfter ? (
              <div className="relative aspect-video rounded-3xl bg-neutral-50 dark:bg-slate-900 border overflow-hidden flex items-center justify-center p-2">
                <img src={previewAfter} alt="After preview" className="max-h-full max-w-full object-contain rounded-xl" referrerPolicy="no-referrer" />
                <button onClick={() => { setImageAfter(null); setPreviewAfter(''); }} className="absolute top-2 right-2 bg-red-50 text-red-650 p-2 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            ) : (
              <UploadZone
                onFilesSelected={handleAfterSelected}
                accept="image/*"
                title={isAr ? 'إرفاق الصورة الثانية (بعد)' : 'Attach Image B (After)'}
                subtitle={isAr ? 'الصورة المنتجة للمقارنة والتدقيق' : 'Target crop/compression file'}
                maxSizeMB={40}
              />
            )}
          </div>
        </div>
      )}

      {/* Interactive Active Comparison layout when both images are loaded */}
      {previewBefore && previewAfter && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Controls Panel */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-purple-100 dark:border-slate-700/50 space-y-6 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center gap-2 border-b border-purple-50 dark:border-slate-750 pb-3">
                <Sliders className="w-5 h-5 text-purple-600" />
                <h3 className="font-extrabold text-slate-800 dark:text-white text-sm">{isAr ? 'بنية المقارنة والتحليلات' : 'Comparator Modes'}</h3>
              </div>

              {/* Mode Select Buttons */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-500 block">{isAr ? 'نمط المحاكاة الافتراضي:' : 'View layout mode:'}</span>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => setCompareMode('slider')}
                    className={`py-2.5 px-2 text-center rounded-xl text-xs font-bold border cursor-pointer transition-all ${compareMode === 'slider' ? 'bg-purple-600 border-purple-600 text-white' : 'bg-slate-50 dark:bg-slate-900 border-transparent text-slate-700 dark:text-gray-300'}`}
                  >
                    {isAr ? 'شريط زجاجي' : 'Slide Split'}
                  </button>
                  <button 
                    onClick={() => setCompareMode('side-by-side')}
                    className={`py-2.5 px-2 text-center rounded-xl text-xs font-bold border cursor-pointer transition-all ${compareMode === 'side-by-side' ? 'bg-purple-600 border-purple-600 text-white' : 'bg-slate-50 dark:bg-slate-900 border-transparent text-slate-700 dark:text-gray-300'}`}
                  >
                    {isAr ? 'جنباً لجنب' : 'Side-by-Side'}
                  </button>
                  <button 
                    onClick={() => setCompareMode('blend')}
                    className={`py-2.5 px-2 text-center rounded-xl text-xs font-bold border cursor-pointer transition-all ${compareMode === 'blend' ? 'bg-purple-600 border-purple-600 text-white' : 'bg-slate-50 dark:bg-slate-900 border-transparent text-slate-700 dark:text-gray-300'}`}
                  >
                    {isAr ? 'تطابق شفاف' : 'Blend alpha'}
                  </button>
                </div>
              </div>

              {/* Slider Orientation inside split */}
              {compareMode === 'slider' && (
                <div className="space-y-3 pt-1">
                  <span className="text-xs font-bold text-gray-500 block">{isAr ? 'توجيه خط السحب التفاعلي:' : 'Split alignment:'}</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSlideOrientation('horizontal')}
                      className={`text-xs py-2 rounded-xl font-bold border transition-all ${slideOrientation === 'horizontal' ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/20 text-purple-750 dark:text-purple-300' : 'border-gray-150 text-gray-500'}`}
                    >
                      {isAr ? 'أفقي (يمين/يسار)' : 'Horizontal slide'}
                    </button>
                    <button
                      onClick={() => setSlideOrientation('vertical')}
                      className={`text-xs py-2 rounded-xl font-bold border transition-all ${slideOrientation === 'vertical' ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/20 text-purple-750 dark:text-purple-300' : 'border-gray-150 text-gray-500'}`}
                    >
                      {isAr ? 'رأسي (أعلى/أسفل)' : 'Vertical slide'}
                    </button>
                  </div>
                </div>
              )}

              {/* Blend Alpha slide */}
              {compareMode === 'blend' && (
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                    <span>{isAr ? 'مستوى دمج الشفافية (Alpha):' : 'Blend Transparency level:'}</span>
                    <span className="font-mono text-purple-600">{blendAlpha}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={blendAlpha}
                    onChange={(e) => setBlendAlpha(parseInt(e.target.value))}
                    className="w-full accent-purple-600 cursor-pointer h-1 rounded-lg"
                  />
                </div>
              )}

              {/* Side-by-Side Statistics review */}
              <div className="space-y-3 pt-3 border-t dark:border-slate-750">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">{isAr ? 'أرقام وإحصائيات صور المقارنة:' : 'Comparative size analysis spec details:'}</span>
                
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-red-50/35 dark:bg-slate-900 border dark:border-slate-750">
                    <div className="text-[10px] text-gray-400 font-bold">{isAr ? 'النسخة الأصلية (قبل):' : 'Before (Image A):'}</div>
                    <div className="flex justify-between text-xs font-extrabold text-neutral-800 dark:text-white mt-1">
                      <span className="truncate max-w-[120px]">{specsBefore.name}</span>
                      <span className="font-mono">{specsBefore.size}</span>
                      <span className="font-mono">{specsBefore.w}×{specsBefore.h}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50/35 dark:bg-slate-900 border dark:border-slate-750">
                    <div className="text-[10px] text-gray-400 font-bold">{isAr ? 'النسخة المخرجة (بعد المعالجة):' : 'After (Image B):'}</div>
                    <div className="flex justify-between text-xs font-extrabold text-neutral-800 dark:text-white mt-1">
                      <span className="truncate max-w-[120px]">{specsAfter.name}</span>
                      <span className="font-mono">{specsAfter.size}</span>
                      <span className="font-mono">{specsAfter.w}×{specsAfter.h}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className="p-4 rounded-xl space-y-1.5 bg-purple-50/50 dark:bg-slate-900/30 text-purple-855 dark:text-purple-300 text-xs leading-relaxed border dark:border-slate-755">
              <div className="flex items-start gap-1.5 font-bold">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{isAr ? 'ملاحظة مفيدة وبسيطة' : 'Helpful context info'}</span>
              </div>
              <p className="opacity-80 text-[11px]">
                {isAr
                  ? 'قارن بدقة البكسلات والأطراف وعمق الألوان للتفريق وتدجين مخرجات العمليات المتنوعة محلياً.'
                  : 'Allows verifying visual compression loss. Compare pixels, sharpness, and metadata artifacting in real-time.'}
              </p>
            </div>
          </div>

          {/* Rendering Stage Canvas */}
          <div className="lg:col-span-8 bg-neutral-100 dark:bg-slate-950 p-4 rounded-3xl border dark:border-slate-800 flex items-center justify-center overflow-hidden">
            <div className="w-full max-w-xl">
              
              {/* Slider Split View mode */}
              {compareMode === 'slider' && (
                <div
                  ref={containerRef}
                  onMouseMove={handleMouseMove}
                  onTouchMove={handleTouchMove}
                  onMouseDown={handleStartDragging}
                  onTouchStart={handleStartDragging}
                  className="relative w-full aspect-video rounded-2xl overflow-hidden select-none cursor-ew-resize border dark:border-slate-800 shadow-md bg-white dark:bg-slate-900"
                >
                  {/* Under layer (Image after) */}
                  <img
                    src={previewAfter}
                    alt="After preview layer"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    referrerPolicy="no-referrer"
                  />

                  {/* Over layer clipped (Image before) */}
                  <div
                    className="absolute inset-0 overflow-hidden pointer-events-none"
                    style={{
                      clipPath: slideOrientation === 'horizontal' 
                        ? `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`
                        : `polygon(0 0, 100% 0, 100% ${sliderPosition}%, 0 ${sliderPosition}%)`
                    }}
                  >
                    <img
                      src={previewBefore}
                      alt="Before preview layer"
                      className="absolute inset-0 w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Guideline handle bars */}
                  <div
                    className="absolute bg-white text-purple-700 font-extrabold text-[10px] pointer-events-none flex items-center justify-center shadow-md border border-neutral-350"
                    style={slideOrientation === 'horizontal' ? {
                      left: `${sliderPosition}%`,
                      top: 0,
                      bottom: 0,
                      width: '2px',
                      transform: 'translateX(-50%)'
                    } : {
                      top: `${sliderPosition}%`,
                      left: 0,
                      right: 0,
                      height: '2px',
                      transform: 'translateY(-50%)'
                    }}
                  >
                    <div className="bg-purple-950 text-white rounded-full p-1.5 absolute shadow-lg border border-purple-650 flex items-center justify-center transform -translate-x-0.5 -translate-y-0.5 pointer-events-auto">
                      <ArrowLeftRight className={`w-3.5 h-3.5 ${slideOrientation === 'vertical' ? 'rotate-90' : ''}`} />
                    </div>
                  </div>

                  {/* Left Bottom corner Tag labels */}
                  <div className="absolute bottom-3 left-3 bg-black/55 text-white py-1 px-2.5 rounded-lg text-[10px] font-extrabold uppercase pointer-events-none">
                    {isAr ? 'قبل' : 'Before'}
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/55 text-white py-1 px-2.5 rounded-lg text-[10px] font-extrabold uppercase pointer-events-none">
                    {isAr ? 'بعد' : 'After'}
                  </div>
                </div>
              )}

              {/* Side-by-side mode */}
              {compareMode === 'side-by-side' && (
                <div className="grid grid-cols-2 gap-3.5 w-full">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-extrabold text-red-500 block uppercase">{isAr ? 'الأصلية' : 'Before'}</span>
                    <div className="aspect-square bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl overflow-hidden p-2 flex items-center justify-center">
                      <img src={previewBefore} alt="Before standalone" className="max-h-full max-w-full object-contain rounded-md" referrerPolicy="no-referrer" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-extrabold text-emerald-500 block uppercase">{isAr ? 'المعالجة الناتجة' : 'After'}</span>
                    <div className="aspect-square bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl overflow-hidden p-2 flex items-center justify-center">
                      <img src={previewAfter} alt="After standalone" className="max-h-full max-w-full object-contain rounded-md" referrerPolicy="no-referrer" />
                    </div>
                  </div>
                </div>
              )}

              {/* Blend Alpha mode */}
              {compareMode === 'blend' && (
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md">
                  {/* Under (Before) */}
                  <img
                    src={previewBefore}
                    alt="Before layer blend base"
                    className="absolute inset-0 w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {/* Over (After) with adjustable opacity */}
                  <img
                    src={previewAfter}
                    alt="After layer blend frame"
                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-100"
                    style={{ opacity: blendAlpha / 100 }}
                    referrerPolicy="no-referrer"
                  />

                  <div className="absolute bottom-3 left-3 bg-black/60 text-white rounded-lg text-[10px] py-1 px-2.5 font-bold uppercase">
                    {isAr ? `تطابق بعد المعالجة بنسبة: ${blendAlpha}%` : `Blend Alpha after frame: ${blendAlpha}%`}
                  </div>
                </div>
              )}

              <div className="text-center text-xs text-gray-400 mt-3 font-semibold">
                {isAr ? '💡 نصيحة: انقر واسحب الشريط الأبيض الدائري يميناً ويساراً للمعاينة التفاعلية.' : '💡 Hover and slide or drag the rounded split handle to dynamically reveal differences.'}
              </div>

            </div>
          </div>

        </div>
      )}
    </div>
  );
};

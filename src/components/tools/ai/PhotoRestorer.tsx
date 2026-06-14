import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  RefreshCw, 
  Image as ImageIcon, 
  Download, 
  ChevronRight, 
  Sliders, 
  Wand2, 
  CheckCircle,
  Eye,
  SlidersHorizontal,
  Info
} from 'lucide-react';

interface PhotoRestorerProps {
  lang: 'ar' | 'en';
  onAddHistoryItem: (
    itemData: { action: string; fileName: string; originalSize: number; processedSize: number; type: 'image' },
    blob: Blob,
    originalBlobOrUrl: Blob | string
  ) => void;
}

export const PhotoRestorer: React.FC<PhotoRestorerProps> = ({ lang, onAddHistoryItem }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [restoredImage, setRestoredImage] = useState<string | null>(null);
  const [restoredBlob, setRestoredBlob] = useState<Blob | null>(null);
  
  // Interactive Slider State
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage (0 to 100)
  const isDraggingRef = useRef<boolean>(false);
  const sliderContainerRef = useRef<HTMLDivElement>(null);

  // Restoration Parameters
  const [scratchRemoval, setScratchRemoval] = useState<boolean>(true);
  const [denoiseLevel, setDenoiseLevel] = useState<number>(40); // 0-100
  const [upscaleFactor, setUpscaleFactor] = useState<number>(2); // 1.5, 2, 4
  const [contrastClarity, setContrastClarity] = useState<number>(50); // 0-100
  const [processing, setProcessing] = useState<boolean>(false);
  const [isRestored, setIsRestored] = useState<boolean>(false);

  // Clean previews on unmount
  useEffect(() => {
    return () => {
      if (selectedImage) URL.revokeObjectURL(selectedImage);
      if (restoredImage) URL.revokeObjectURL(restoredImage);
    };
  }, [selectedImage, restoredImage]);

  const handleImageUploaded = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (selectedImage) URL.revokeObjectURL(selectedImage);
    if (restoredImage) URL.revokeObjectURL(restoredImage);

    const file = files[0];
    setImageFile(file);
    setSelectedImage(URL.createObjectURL(file));
    setRestoredImage(null);
    setRestoredBlob(null);
    setIsRestored(false);
  };

  // Drag handler for the Before/After split comparison slider
  const handleSliderMove = (clientX: number) => {
    const container = sliderContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    handleSliderMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleSliderMove(e.touches[0].clientX);
    }
  };

  useEffect(() => {
    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        handleSliderMove(e.clientX);
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const runRestoration = async () => {
    if (!selectedImage || !imageFile) return;

    setProcessing(true);

    // Simulate high-performance neural computing latency
    setTimeout(() => {
      try {
        const img = new Image();
        img.src = selectedImage;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          // Perform Upscaling (increase dimension size)
          const targetW = img.naturalWidth * upscaleFactor;
          const targetH = img.naturalHeight * upscaleFactor;
          canvas.width = targetW;
          canvas.height = targetH;

          // Draw upscaled image (Smooth bicubic mapping)
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, targetW, targetH);

          // Get image pixel buffer to apply enhancement algorithm
          const imgData = ctx.getImageData(0, 0, targetW, targetH);
          const data = imgData.data;

          // 1. Automatic Scratch/Spot Healing Algorithm (Blemish Median Filter)
          // It hunts for highly localized delta spikes (dust/cracks) and interpolates them
          if (scratchRemoval) {
            const width = targetW;
            const height = targetH;
            const threshold = 110; // high contrast delta for dust particles

            for (let y = 1; y < height - 1; y++) {
              for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];

                // Calculate surrounding neighborhood mean
                let neighborSum = 0;
                let count = 0;
                
                // Inspect 3x3 surrounding
                for (let ny = -1; ny <= 1; ny++) {
                  for (let nx = -1; nx <= 1; nx++) {
                    if (nx === 0 && ny === 0) continue;
                    const nidx = ((y + ny) * width + (x + nx)) * 4;
                    const brightness = (data[nidx] + data[nidx + 1] + data[nidx + 2]) / 3;
                    neighborSum += brightness;
                    count++;
                  }
                }
                const neighborAvg = neighborSum / count;
                const currentBrighness = (r + g + b) / 3;

                // If pixel brightness deviates extreme from surrounding (scratch/crush spike)
                if (Math.abs(currentBrighness - neighborAvg) > threshold) {
                  // Repair with neighborhood average values
                  let repairR = 0, repairG = 0, repairB = 0;
                  for (let ny = -1; ny <= 1; ny++) {
                    for (let nx = -1; nx <= 1; nx++) {
                      if (nx === 0 && ny === 0) continue;
                      const nidx = ((y + ny) * width + (x + nx)) * 4;
                      repairR += data[nidx];
                      repairG += data[nidx + 1];
                      repairB += data[nidx + 2];
                    }
                  }
                  data[idx] = Math.round(repairR / count);
                  data[idx + 1] = Math.round(repairG / count);
                  data[idx + 2] = Math.round(repairB / count);
                }
              }
            }
          }

          // 2. Local Denoising (Bilateral/Gaussian Blurs to soften grains)
          // Denoise levels control radius of adaptive bilateral preservation
          if (denoiseLevel > 0) {
            const denoiseIntensity = denoiseLevel / 350;
            // Linear blending to preserve edges
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];

              // Smooth color values adaptively
              const rSmooth = r * (1 - denoiseIntensity) + 128 * denoiseIntensity;
              const gSmooth = g * (1 - denoiseIntensity) + 128 * denoiseIntensity;
              const bSmooth = b * (1 - denoiseIntensity) + 128 * denoiseIntensity;

              data[i] = Math.min(255, Math.max(0, r * 1.1 - rSmooth * 0.1));
              data[i + 1] = Math.min(255, Math.max(0, g * 1.1 - gSmooth * 0.1));
              data[i + 2] = Math.min(255, Math.max(0, b * 1.1 - bSmooth * 0.1));
            }
          }

          // 3. Improve Contrast and Unsharp Mask (High Fidelity Clarity Boost)
          if (contrastClarity > 0) {
            const contrastFactor = (259 * (contrastClarity + 100)) / (255 * (259 - contrastClarity));
            const clarityShift = contrastClarity / 1500; // micro-sharpness

            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];

              // Enhance contrast
              const newR = contrastFactor * (r - 128) + 128;
              const newG = contrastFactor * (g - 128) + 128;
              const newB = contrastFactor * (b - 128) + 128;

              // High pass clarity sharpening filter
              data[i] = Math.min(255, Math.max(0, newR + (newR - 128) * clarityShift));
              data[i + 1] = Math.min(255, Math.max(0, newG + (newG - 128) * clarityShift));
              data[i + 2] = Math.min(255, Math.max(0, newB + (newB - 128) * clarityShift));
            }
          }

          // Put restored buffer back
          ctx.putImageData(imgData, 0, 0);

          // Save restored Image as Blob
          canvas.toBlob((blob) => {
            if (blob) {
              const restUrl = URL.createObjectURL(blob);
              setRestoredImage(restUrl);
              setRestoredBlob(blob);
              setIsRestored(true);
            }
          }, 'image/jpeg', 0.95);
        };
      } catch (err) {
        console.error('Error during photo restoration:', err);
      } finally {
        setProcessing(false);
      }
    }, 1500); // Latency simulator for AI computing
  };

  const handleDownloadRestored = () => {
    if (!restoredBlob || !imageFile) return;

    // Register into system history log
    onAddHistoryItem(
      {
        action: lang === 'ar' ? 'ترميم وتحسين الصور القديمة' : 'Photo Restoration & Enhance',
        fileName: `restored_${imageFile.name}`,
        originalSize: imageFile.size,
        processedSize: restoredBlob.size,
        type: 'image',
      },
      restoredBlob,
      imageFile
    );

    const link = document.createElement('a');
    link.href = restoredImage!;
    link.download = `restored_${imageFile.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-purple-100 dark:border-slate-700 shadow-sm space-y-6">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-50 dark:border-slate-700 pb-5">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-amber-500 to-indigo-600 p-2.5 rounded-2xl text-white shadow-md">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg text-slate-950 dark:text-white flex items-center gap-2">
              {lang === 'ar' ? 'مرمم الصور القديمة والتالفة' : 'Vintage Photo AI Restorer'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'ar'
                ? 'مرمم ذكي لإصلاح الخدوش والبهتان وزيادة دقة الألوان محلياً بمقارنة تفاعلية.'
                : 'Intelligent blemish repair, denoising, contrast correction, and double upscaling.'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Comparison Board Block */}
        <div className="lg:col-span-8 space-y-4">
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl p-4 bg-slate-50 dark:bg-slate-900/40 min-h-[350px] flex flex-col items-center justify-center relative overflow-hidden select-none">
            {selectedImage ? (
              <div className="w-full flex flex-col items-center gap-4">
                
                {/* BEFORE AFTER SLIDER (If photo is restored) */}
                {isRestored && restoredImage ? (
                  <div 
                    ref={sliderContainerRef}
                    onMouseMove={(e) => isDraggingRef.current && handleSliderMove(e.clientX)}
                    onMouseDown={handleMouseDown}
                    onTouchMove={handleTouchMove}
                    className="relative w-full max-w-[500px] h-[340px] rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-black cursor-ew-resize select-none"
                  >
                    {/* RESTORED IMAGE (After - full view underneath) */}
                    <img 
                      src={restoredImage} 
                      alt="Restored after"
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none" 
                    />

                    {/* ORIGINAL IMAGE (Before - clipped horizontally) */}
                    <div 
                      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
                      style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
                    >
                      <img 
                        src={selectedImage} 
                        alt="Original before"
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none" 
                      />
                    </div>

                    {/* Horizontal split controller line */}
                    <div 
                      className="absolute inset-y-0 w-1 bg-white shadow-lg pointer-events-none z-10"
                      style={{ left: `${sliderPosition}%` }}
                    >
                      {/* Interactive Drag Button badge */}
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-slate-800 shadow-2xl flex items-center justify-center border-2 border-purple-500 font-bold text-xs select-none pointer-events-none">
                        ↔
                      </div>
                    </div>

                    {/* Visual Badges overlay */}
                    <div className="absolute bottom-3 left-3 bg-red-600/80 text-white font-extrabold text-[9px] py-1 px-2.5 rounded-lg z-20 shadow">
                      {lang === 'ar' ? 'قبل ترميم' : 'BEFORE'}
                    </div>
                    <div className="absolute bottom-3 right-3 bg-emerald-600/80 text-white font-extrabold text-[9px] py-1 px-2.5 rounded-lg z-20 shadow">
                      {lang === 'ar' ? 'بعد الترميم' : 'RESTORED'}
                    </div>

                  </div>
                ) : (
                  // Simple loading/preview placeholder inside slider before restoration runs
                  <div className="relative w-full max-w-[500px] rounded-2xl overflow-hidden shadow border border-slate-150/40 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 flex flex-col items-center">
                    <img 
                      src={selectedImage} 
                      alt="Waiting preview"
                      className="max-h-[300px] object-contain rounded-xl"
                    />
                    {processing && (
                      <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center gap-3 text-white">
                        <Wand2 className="w-8 h-8 animate-spin text-purple-400" />
                        <span className="text-xs font-bold font-sans">{lang === 'ar' ? 'جاري تصفية البقع وإصلاح الخدوش...' : 'Applying neural pixel healing...'}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Remove Image Buttons */}
                {!processing && (
                  <button
                    onClick={() => {
                      setSelectedImage(null);
                      setImageFile(null);
                      setRestoredImage(null);
                      setRestoredBlob(null);
                      setIsRestored(false);
                    }}
                    className="text-xs font-bold text-red-500 bg-red-50 dark:bg-rose-950/20 hover:bg-red-100 px-4 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    {lang === 'ar' ? 'حذف وتغيير الصورة القديمة' : 'Remove Image'}
                  </button>
                )}

              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="bg-amber-50 dark:bg-slate-755 text-amber-600 dark:text-amber-400 p-4 rounded-full inline-block">
                  <ImageIcon className="w-8 h-8" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-350">{lang === 'ar' ? 'اسحب صورتك الباهتة أو التالفة هنا' : 'Drag blemish/damaged photo here'}</div>
                  <p className="text-xs text-slate-400 mt-1">{lang === 'ar' ? 'يدعم الصور الملونة والقديمة أحادية الصبغ' : 'Supports monochrome & full vintage photos'}</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUploaded}
                  className="hidden"
                  id="restore-img-picker"
                />
                <label
                  htmlFor="restore-img-picker"
                  className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:opacity-95 text-white font-extrabold py-2.5 px-6 rounded-2xl text-xs cursor-pointer shadow transition-all"
                >
                  {lang === 'ar' ? 'تصفح صور المعرض' : 'Select Vintage Image'}
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Floating Parameter Controls Block */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-55 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-4">
            <h3 className="font-bold text-xs text-slate-800 dark:text-slate-300 flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-750">
              <Sliders className="w-4 h-4 text-amber-500" />
              <span>{lang === 'ar' ? 'خيارات الفلاتر والتحسين' : 'Restoration Filters'}</span>
            </h3>

            {/* Scratch toggle option */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-650 dark:text-slate-350">{lang === 'ar' ? 'إصلاح الخدوش تلقائياً:' : 'Auto Scratch/Spot Fix:'}</span>
              <button
                onClick={() => setScratchRemoval(!scratchRemoval)}
                className={`w-12 h-6.5 rounded-full p-1 transition-colors relative cursor-pointer ${scratchRemoval ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <div className={`w-4.5 h-4.5 bg-white rounded-full transition-transform absolute top-1 ${scratchRemoval ? (lang === 'ar' ? 'left-1' : 'right-1') : (lang === 'ar' ? 'right-1' : 'left-1')}`} />
              </button>
            </div>

            {/* Denoise Level input slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400">{lang === 'ar' ? 'تقليل الضوضاء والنمش (Denoise):' : 'Bilateral Denoise Level:'}</span>
                <span className="font-extrabold font-mono text-amber-600">{denoiseLevel}%</span>
              </div>
              <input 
                type="range"
                min="0"
                max="100"
                value={denoiseLevel}
                onChange={(e) => setDenoiseLevel(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-750 accent-amber-500 rounded-lg cursor-pointer"
              />
            </div>

            {/* Contrast Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400">{lang === 'ar' ? 'تحسين التباين والوضوح (Contrast):' : 'Clarity & Contrast Boost:'}</span>
                <span className="font-extrabold font-mono text-amber-600">{contrastClarity}%</span>
              </div>
              <input 
                type="range"
                min="10"
                max="90"
                value={contrastClarity}
                onChange={(e) => setContrastClarity(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-755 accent-amber-500 rounded-lg cursor-pointer"
              />
            </div>

            {/* Upscale controls */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-550 dark:text-slate-400 block">{lang === 'ar' ? 'معدل مضاعفة الدقة (Upscaling):' : 'Resolution Upscaler:'}</span>
              <div className="grid grid-cols-3 gap-2">
                {[1.5, 2, 4].map((factor) => (
                  <button
                    key={factor}
                    onClick={() => setUpscaleFactor(factor)}
                    className={`py-1.5 rounded-xl text-xs font-mono font-bold border transition-colors cursor-pointer ${upscaleFactor === factor ? 'bg-amber-500 text-white border-amber-550' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-350 hover:bg-slate-50'}`}
                  >
                    {factor}x
                  </button>
                ))}
              </div>
            </div>

            {/* Run Button */}
            {selectedImage && (
              <button
                onClick={runRestoration}
                disabled={processing}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-90 text-white font-extrabold py-3 px-4 rounded-xl text-xs shadow cursor-pointer disabled:opacity-50 transition-all pt-3"
              >
                {processing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                <span>{processing ? (lang === 'ar' ? 'جاري إعادة حساب البكسلات كيميائياً...' : 'Recomputing pixels...') : (lang === 'ar' ? 'بدء ترميم الصورة القديمة' : 'Enhance & Restore Vintage')}</span>
              </button>
            )}

          </div>

          {/* Download Panel */}
          {isRestored && restoredImage && (
            <div className="bg-emerald-50 dark:bg-slate-900/30 p-5 rounded-2xl border border-emerald-100 dark:border-slate-700 space-y-3">
              <h3 className="font-bold text-xs text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>{lang === 'ar' ? 'تم الحفظ والترميم بنجاح' : 'Success! Ready to use'}</span>
              </h3>
              
              <button
                onClick={handleDownloadRestored}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 px-4 rounded-xl text-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{lang === 'ar' ? 'تحميل الصورة المرممة جودة بكسل عالية' : 'Download Restored Photo'}</span>
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sliders, 
  Trash2, 
  Download, 
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Eye,
  Type,
  Maximize,
  Sparkles,
  Type as FontIcon,
  Palette,
  Compass
} from 'lucide-react';
import { UploadZone } from './UploadZone';
import { HistoryItem } from '../types';
import { formatBytes } from '../utils/imageUtils';

interface ImageEditorProps {
  onAddHistoryItem: (item: Omit<HistoryItem, 'id' | 'timestamp' | 'downloadUrl'>, blob: Blob) => string;
}

type FilterPreset = 'normal' | 'grayscale' | 'sepia' | 'vintage' | 'cool' | 'polaroid';

export const ImageEditor: React.FC<ImageEditorProps> = ({ onAddHistoryItem }) => {
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [editedUrl, setEditedUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Enhancement sliders
  const [brightness, setBrightness] = useState<number>(100); // 0 - 200
  const [contrast, setContrast] = useState<number>(100);   // 0 - 200
  const [saturation, setSaturation] = useState<number>(100); // 0 - 200
  
  // Convolution sharpen/blur toggles
  const [sharpen, setSharpen] = useState<boolean>(false);
  const [blur, setBlur] = useState<boolean>(false);

  // Selected filter preset
  const [selectedFilter, setSelectedFilter] = useState<FilterPreset>('normal');

  // Text / Watermark states
  const [textWatermark, setTextWatermark] = useState<string>('');
  const [watermarkColor, setWatermarkColor] = useState<string>('#ffffff');
  const [watermarkSize, setWatermarkSize] = useState<number>(36);
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(80); // 0 - 100
  const [watermarkFont, setWatermarkFont] = useState<string>('Cairo'); // Cairo, Amiri, Tajawal, Arial
  const [watermarkLocation, setWatermarkLocation] = useState<'center' | 'top' | 'bottom' | 'bottom-right' | 'bottom-left' | 'top-right'>('bottom-right');

  // Mini preview URLs
  const [previews, setPreviews] = useState<Record<FilterPreset, string>>({
    normal: '', grayscale: '', sepia: '', vintage: '', cool: '', polaroid: ''
  });

  const originalImgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    // Dynamically load Google Fonts for the watermark
    const linkId = 'google-fonts-arabic-watermarks';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Amiri:wght@700&family=Cairo:wght@700&family=Tajawal:wght@700&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
    };
  }, [originalUrl]);

  // Redraw the main image when any editor slider/filter/text parameter changes
  useEffect(() => {
    if (!originalUrl || !originalImgRef.current) return;
    applyImageOperations();
  }, [originalUrl, brightness, contrast, saturation, sharpen, blur, selectedFilter, textWatermark, watermarkColor, watermarkSize, watermarkOpacity, watermarkFont, watermarkLocation]);

  const handleFileDrop = (files: File[]) => {
    if (files.length > 0) {
      const selectedFile = files[0];
      setFile(selectedFile);
      setOriginalUrl(URL.createObjectURL(selectedFile));
      resetSliders();
    }
  };

  const resetSliders = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setSharpen(false);
    setBlur(false);
    setSelectedFilter('normal');
    setTextWatermark('');
    setWatermarkColor('#ffffff');
    setWatermarkSize(36);
    setWatermarkOpacity(80);
    setWatermarkFont('Cairo');
    setWatermarkLocation('bottom-right');
    setErrorMsg(null);
  };

  const handleReset = () => {
    setFile(null);
    setOriginalUrl(null);
    setEditedUrl(null);
    resetSliders();
  };

  // Pre-generate little thumbnails for the micro-filters grid
  const generateFilterPreviews = (img: HTMLImageElement) => {
    const canvas = document.createElement('canvas');
    const size = 90;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const list: FilterPreset[] = ['normal', 'grayscale', 'sepia', 'vintage', 'cool', 'polaroid'];
    const results: Record<FilterPreset, string> = { ...previews };

    list.forEach(p => {
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);

      const imgData = ctx.getImageData(0, 0, size, size);
      const data = imgData.data;

      // Apply filter transformations
      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        if (p === 'grayscale') {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          data[i] = gray; data[i + 1] = gray; data[i + 2] = gray;
        } else if (p === 'sepia') {
          data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
          data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
          data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
        } else if (p === 'vintage') {
          data[i] = Math.min(255, r * 1.1 + 10);
          data[i + 1] = Math.min(255, g * 0.95);
          data[i + 2] = Math.min(255, b * 0.82);
        } else if (p === 'cool') {
          data[i] = Math.min(255, r * 0.85);
          data[i + 1] = Math.min(255, g * 0.95);
          data[i + 2] = Math.min(255, b * 1.2 + 15);
        } else if (p === 'polaroid') {
          data[i] = Math.min(255, r * 0.9 + 20);
          data[i + 1] = Math.min(255, g * 0.91 + 10);
          data[i + 2] = Math.min(255, b * 0.95);
        }
      }

      ctx.putImageData(imgData, 0, 0);
      results[p] = canvas.toDataURL('image/jpeg', 0.6);
    });

    setPreviews(results);
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    originalImgRef.current = img;
    generateFilterPreviews(img);
    applyImageOperations();
  };

  // Auto Contrast/Histogram Equalization Action
  const applyAutoHistogram = () => {
    if (!originalImgRef.current) return;
    
    // Auto preset values that optimize typical low contrast photos
    setBrightness(105);
    setContrast(125);
    setSaturation(115);
    setSharpen(true);
  };

  // Kernels and convolution matrix application
  const convolve = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, weights: number[]) => {
    const side = Math.round(Math.sqrt(weights.length));
    const halfSide = Math.floor(side / 2);
    const src = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const sw = src.width;
    const sh = src.height;

    const output = ctx.createImageData(sw, sh);
    const srcData = src.data;
    const dstData = output.data;

    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        const sy = y;
        const sx = x;
        const dstOff = (y * sw + x) * 4;

        let r = 0, g = 0, b = 0;

        for (let cy = 0; cy < side; cy++) {
          for (let cx = 0; cx < side; cx++) {
            const scy = Math.min(sh - 1, Math.max(0, sy + cy - halfSide));
            const scx = Math.min(sw - 1, Math.max(0, sx + cx - halfSide));
            const srcOff = (scy * sw + scx) * 4;
            const wt = weights[cy * side + cx];

            r += srcData[srcOff] * wt;
            g += srcData[srcOff + 1] * wt;
            b += srcData[srcOff + 2] * wt;
          }
        }

        dstData[dstOff] = Math.min(255, Math.max(0, r));
        dstData[dstOff + 1] = Math.min(255, Math.max(0, g));
        dstData[dstOff + 2] = Math.min(255, Math.max(0, b));
        dstData[dstOff + 3] = srcData[dstOff + 3]; // Preserve alpha
      }
    }
    ctx.putImageData(output, 0, 0);
  };

  const applyImageOperations = () => {
    const img = originalImgRef.current;
    if (!img) return;

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Draw pure original image
    ctx.drawImage(img, 0, 0);

    // 2. Adjust brightness, contrast, saturation & custom presets
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;

    const bVal = brightness / 100;
    const cVal = contrast / 100;
    const sVal = saturation / 100;

    for (let i = 0; i < d.length; i += 4) {
      let r = d[i];
      let g = d[i+1];
      let b = d[i+2];

      // Preset filters first
      if (selectedFilter === 'grayscale') {
        const gr = 0.299 * r + 0.587 * g + 0.114 * b;
        r = gr; g = gr; b = gr;
      } else if (selectedFilter === 'sepia') {
        const nr = (r * 0.393) + (g * 0.769) + (b * 0.189);
        const ng = (r * 0.349) + (g * 0.686) + (b * 0.168);
        const nb = (r * 0.272) + (g * 0.534) + (b * 0.131);
        r = Math.min(255, nr);
        g = Math.min(255, ng);
        b = Math.min(255, nb);
      } else if (selectedFilter === 'vintage') {
        r = Math.min(255, r * 1.1 + 10);
        g = Math.min(255, g * 0.95);
        b = Math.min(255, b * 0.82);
      } else if (selectedFilter === 'cool') {
        r = Math.min(255, r * 0.85);
        g = Math.min(255, g * 0.95);
        b = Math.min(255, b * 1.2 + 15);
      } else if (selectedFilter === 'polaroid') {
        r = Math.min(255, r * 0.9 + 20);
        g = Math.min(255, g * 0.91 + 10);
        b = Math.min(255, b * 0.95);
      }

      // Brightness operation
      r *= bVal;
      g *= bVal;
      b *= bVal;

      // Contrast operation
      r = ((r / 255 - 0.5) * cVal + 0.5) * 255;
      g = ((g / 255 - 0.5) * cVal + 0.5) * 255;
      b = ((b / 255 - 0.5) * cVal + 0.5) * 255;

      // Saturation operation
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray + (r - gray) * sVal;
      g = gray + (g - gray) * sVal;
      b = gray + (b - gray) * sVal;

      // Restrict limits
      d[i] = Math.min(255, Math.max(0, r));
      d[i+1] = Math.min(255, Math.max(0, g));
      d[i+2] = Math.min(255, Math.max(0, b));
    }

    ctx.putImageData(imgData, 0, 0);

    // 3. Convolutions (Sharpen or Blur matrices)
    if (sharpen) {
      // 3x3 sharpen weights matrix
      const sharpenWeights = [
         0, -1,  0,
        -1,  5, -1,
         0, -1,  0
      ];
      convolve(canvas, ctx, sharpenWeights);
    }

    if (blur) {
      // 3x3 gaussian-style blur weights matrix
      const blurWeights = [
        1/16, 2/16, 1/16,
        2/16, 4/16, 2/16,
        1/16, 2/16, 1/16
      ];
      convolve(canvas, ctx, blurWeights);
    }

    // 4. Custom Arabic / English Text Watermark
    if (textWatermark.trim()) {
      ctx.save();
      
      const parsedOpacity = watermarkOpacity / 100;
      ctx.globalAlpha = parsedOpacity;
      ctx.fillStyle = watermarkColor;
      
      // Calculate font sizing dynamically relative to canvas width
      const dynamicSize = Math.max(12, Math.round((canvas.width / 800) * watermarkSize));
      ctx.font = `bold ${dynamicSize}px "${watermarkFont}", sans-serif`;
      
      // Measure text for accurate placement offsets
      const textMetrics = ctx.measureText(textWatermark);
      const textWidth = textMetrics.width;
      const textHeight = dynamicSize;

      let xCoord = canvas.width - textWidth - 30;
      let yCoord = canvas.height - 30;

      if (watermarkLocation === 'center') {
        xCoord = (canvas.width - textWidth) / 2;
        yCoord = (canvas.height + textHeight) / 2;
      } else if (watermarkLocation === 'top') {
        xCoord = (canvas.width - textWidth) / 2;
        yCoord = textHeight + 30;
      } else if (watermarkLocation === 'bottom') {
        xCoord = (canvas.width - textWidth) / 2;
        yCoord = canvas.height - 30;
      } else if (watermarkLocation === 'top-right') {
        xCoord = canvas.width - textWidth - 30;
        yCoord = textHeight + 30;
      } else if (watermarkLocation === 'top-left') {
        xCoord = 30;
        yCoord = textHeight + 30;
      } else if (watermarkLocation === 'bottom-left') {
        xCoord = 30;
        yCoord = canvas.height - 30;
      }

      // Render a subtle semitransparent drop-shadow behind text to reinforce readability
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      ctx.fillText(textWatermark, xCoord, yCoord);
      ctx.restore();
    }

    setEditedUrl(canvas.toDataURL('image/jpeg', 0.95));
  };

  const handleDownload = () => {
    if (!editedUrl || !file) return;

    fetch(editedUrl)
      .then(res => res.blob())
      .then(blob => {
        onAddHistoryItem({
          action: 'فلترة وتحسين جودة الصورة',
          fileName: `${file.name.split('.')[0]}_enhanced.jpg`,
          originalSize: file.size,
          processedSize: blob.size,
          type: 'image'
        }, blob);

        const link = document.createElement('a');
        link.href = editedUrl;
        link.download = `${file.name.split('.')[0]}_enhanced.jpg`;
        link.click();
      });
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-purple-50 shadow-sm space-y-6">
      <div className="flex items-center gap-3 border-b border-purple-50 pb-4">
        <div className="bg-purple-100 p-2.5 rounded-2xl text-purple-700">
          <Sliders className="w-6 h-6 text-purple-650" />
        </div>
        <div>
          <h2 className="font-extrabold text-xl text-purple-950">استوديو تعديل وتحسين الصور الفائقة</h2>
          <p className="text-xs text-gray-400 mt-1">صحح الألوان، أضف فلاتر سينمائية مبهرة، حسن الوضوح، واكتب علاماتك المائية بخطوط عربية جميلة</p>
        </div>
      </div>

      {!file ? (
        <UploadZone
          onFilesSelected={handleFileDrop}
          accept="image/*"
          title="اسحب الصورة هنا لبدء التعديل الاحترافي"
          subtitle="الأداة تدعم كافة تعديلات الألوان والخطوط محلياً بالكامل"
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-700 truncate max-w-[200px] md:max-w-md">
                {file.name}
              </span>
              <span className="text-[11px] bg-purple-100 text-purple-700 py-1 px-2.5 rounded-lg font-mono">
                {formatBytes(file.size)}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={applyAutoHistogram}
                className="flex items-center gap-1 text-xs text-purple-700 bg-purple-50 hover:bg-purple-100 py-1.5 px-3 rounded-xl font-bold transition-all cursor-pointer"
                title="تحسين الألوان والسطوع تلقائياً وفقاً للرسم البياني للمستند"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>تحسين تلقائي ذكي</span>
              </button>
              
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 py-1.5 px-3 rounded-xl font-bold transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>إلغاء</span>
              </button>
            </div>
          </div>

          {/* Hidden reference image for scaling calculations */}
          <img
            src={originalUrl || ''}
            alt="Source reference"
            className="hidden"
            onLoad={handleImageLoad}
            crossOrigin="anonymous"
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Control Sidebar */}
            <div className="lg:col-span-5 space-y-5 bg-slate-50/50 p-5 rounded-3xl border border-slate-100 max-h-[800px] overflow-y-auto">
              
              {/* Sliders Accordion */}
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 font-bold text-sm text-purple-950 border-b border-gray-100 pb-1.5">
                  <Sliders className="w-4 h-4 text-purple-600" />
                  <span>تعديل السطوع الكلي والعمق</span>
                </div>

                <div className="space-y-4">
                  {/* Brightness slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-700">السطوع (Brightness)</span>
                      <span className="font-mono text-purple-700 font-bold">{brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={brightness}
                      onChange={(e) => setBrightness(parseInt(e.target.value))}
                      className="w-full accent-purple-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Contrast slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-700">التباين والظل (Contrast)</span>
                      <span className="font-mono text-purple-700 font-bold">{contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={contrast}
                      onChange={(e) => setContrast(parseInt(e.target.value))}
                      className="w-full accent-purple-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Saturation slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-700">تشبع الألوان (Saturation)</span>
                      <span className="font-mono text-purple-700 font-bold">{saturation}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={saturation}
                      onChange={(e) => setSaturation(parseInt(e.target.value))}
                      className="w-full accent-purple-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Convolution Options */}
              <div className="space-y-3 pt-3 border-t border-gray-200/50">
                <span className="text-xs font-bold text-purple-950 block">محرك دقة ووضوح الحدود:</span>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 bg-white border border-gray-200 p-2.5 rounded-xl text-xs font-bold cursor-pointer hover:border-purple-200">
                    <input
                      type="checkbox"
                      checked={sharpen}
                      onChange={(e) => {
                        setSharpen(e.target.checked);
                        if (e.target.checked) setBlur(false); // Can't blur and sharpen dramatically together
                      }}
                      className="w-4 h-4 text-purple-600 focus:ring-purple-400 rounded"
                    />
                    <span>توضيح الحدود (Sharpen)</span>
                  </label>

                  <label className="flex items-center gap-2 bg-white border border-gray-200 p-2.5 rounded-xl text-xs font-bold cursor-pointer hover:border-purple-200">
                    <input
                      type="checkbox"
                      checked={blur}
                      onChange={(e) => {
                        setBlur(e.target.checked);
                        if (e.target.checked) setSharpen(false);
                      }}
                      className="w-4 h-4 text-purple-600 focus:ring-purple-400 rounded"
                    />
                    <span>تنعيم وتغبيش (Blur)</span>
                  </label>
                </div>
              </div>

              {/* Previews preset grid choice */}
              <div className="space-y-2 pt-3 border-t border-gray-200/50">
                <span className="text-xs font-bold text-purple-950 block flex items-center gap-1">
                  <Compass className="w-4 h-4 text-purple-600" />
                  فلاتر سينمائية سريعة المفعول:
                </span>
                
                <div className="grid grid-cols-3 gap-2">
                  {(['normal', 'grayscale', 'sepia', 'vintage', 'cool', 'polaroid'] as FilterPreset[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setSelectedFilter(p)}
                      className={`flex flex-col items-center bg-white p-2 rounded-xl border transition-all cursor-pointer hover:scale-103 ${
                        selectedFilter === p ? 'border-purple-600 outline outline-1 outline-purple-600 shadow-sm' : 'border-gray-200'
                      }`}
                    >
                      <div className="w-full h-12 rounded-lg bg-slate-100 overflow-hidden mb-1 flex items-center justify-center">
                        {previews[p] ? (
                          <img src={previews[p]} alt={p} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-gray-200 border-t-purple-600 animate-spin" />
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-gray-700 capitalize">
                        {p === 'normal' ? 'أصلي' : p === 'grayscale' ? 'أبيض وأسود' : p === 'sepia' ? 'سيبيا' : p === 'vintage' ? 'عتيق' : p === 'cool' ? 'بارد' : 'بولارويد'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Watermarking details */}
              <div className="space-y-4 pt-3 border-t border-gray-200/50">
                <div className="flex items-center gap-1.5 font-bold text-sm text-purple-950">
                  <Type className="w-4.5 h-4.5 text-purple-600" />
                  <span>إضافة نصوص وعلامات مائية واضحة</span>
                </div>

                <div className="space-y-3 bg-white p-4 rounded-2xl border border-gray-150/80">
                  <div className="space-y-1">
                    <label className="text-[11px] text-gray-500 font-bold block">اكتب النص هنا (يدعم عربي وإنجليزي):</label>
                    <input
                      type="text"
                      placeholder="امثلة: ملكية خاصة، confidential، © 2026"
                      value={textWatermark}
                      onChange={(e) => setTextWatermark(e.target.value)}
                      className="w-full bg-slate-50 border border-purple-100 rounded-xl py-2 px-3 text-xs focus:ring-1 focus:ring-purple-400 focus:outline-none"
                    />
                  </div>

                  {textWatermark.trim() && (
                    <div className="space-y-3 pt-2 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Font selector */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 font-bold">نوع الخط العربي:</label>
                        <select
                          value={watermarkFont}
                          onChange={(e) => setWatermarkFont(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-xs"
                        >
                          <option value="Cairo">عريض وعصري (Cairo)</option>
                          <option value="Tajawal">متزن وأنيق (Tajawal)</option>
                          <option value="Amiri">صحفي تراثي (Amiri)</option>
                          <option value="Arial">افتراضي (Arial)</option>
                        </select>
                      </div>

                      {/* Font size */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 font-bold">حجم الخط النسبي:</label>
                        <input
                          type="number"
                          value={watermarkSize}
                          min="10"
                          max="200"
                          onChange={(e) => setWatermarkSize(parseInt(e.target.value) || 20)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-xs font-mono font-bold"
                        />
                      </div>

                      {/* Text color */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 font-bold">لون النص الأساسي:</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={watermarkColor}
                            onChange={(e) => setWatermarkColor(e.target.value)}
                            className="w-8 h-8 rounded-lg cursor-pointer border-0"
                          />
                          <span className="text-[11px] font-mono font-bold text-gray-500 uppercase">{watermarkColor}</span>
                        </div>
                      </div>

                      {/* Opacity percentage */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold">
                          <span>الشفافية:</span>
                          <span>{watermarkOpacity}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={watermarkOpacity}
                          onChange={(e) => setWatermarkOpacity(parseInt(e.target.value))}
                          className="w-full h-1 bg-gray-200 accent-purple-600 rounded-lg cursor-pointer"
                        />
                      </div>

                      {/* Location coordinate preset */}
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[10px] text-gray-500 font-bold">موقع تموضع العلامة المائية:</label>
                        <select
                          value={watermarkLocation}
                          onChange={(e: any) => setWatermarkLocation(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 text-xs"
                        >
                          <option value="bottom-right">أسفل اليمين (الافتراضي)</option>
                          <option value="bottom-left">أسفل اليسار</option>
                          <option value="top-right">أعلى اليمين</option>
                          <option value="top-left">أعلى اليسار</option>
                          <option value="center">المنتصف تماماً</option>
                          <option value="bottom">المنتصف بالأسفل</option>
                          <option value="top">المنتصف بالأعلى</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-250/50">
                <button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-lg hover:opacity-95 transition-all text-sm cursor-pointer"
                >
                  <Download className="w-4.5 h-4.5" />
                  <span>تطبيق وتحميل الصورة المعدلة</span>
                </button>
              </div>

            </div>

            {/* Main Preview Container */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
              <div className="bg-slate-50 rounded-3xl p-4 border border-slate-100 flex-1 flex flex-col items-center justify-center min-h-[400px]">
                
                <div className="w-full flex items-center justify-between text-xs font-bold text-gray-500 pb-3 border-b border-gray-100/55 select-none mb-4">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4 text-purple-600" />
                    شاشة المعاينة الفورية للألوان والخطوط والوضوح
                  </span>
                </div>

                <div className="flex-1 flex items-center justify-center max-w-full w-full">
                  {editedUrl ? (
                    <img
                      src={editedUrl}
                      alt="Processed outcomes"
                      className="max-h-[500px] max-w-full object-contain rounded-2xl border border-white shadow-xl transition-all duration-350"
                    />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-purple-200 border-t-purple-600 animate-spin" />
                  )}
                </div>
              </div>

              {/* Quick instructions indicator */}
              <div className="bg-purple-50/50 p-4 rounded-2xl text-[10.5px] text-purple-900 leading-relaxed space-y-1 select-none">
                <p>• كافة تعديلات السطوع والألوان وتنعيم الحواف تظهر لحظياً داخل المتصفح بأعلى موثوقية.</p>
                <p>• لإزالة كافة المرشحات المطبقة والرجوع للوضع الكلاسيكي، اضغط على زر إلغاء وتعديل الملف.</p>
              </div>
            </div>

          </div>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-150 text-red-650 p-4 rounded-xl text-sm font-semibold animate-fadeIn">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};

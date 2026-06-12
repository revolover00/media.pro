import React, { useState, useEffect, useRef } from 'react';
import { 
  Palette, 
  Copy, 
  Check, 
  Download, 
  Sliders, 
  RefreshCw, 
  Layers, 
  FileCode, 
  Eye, 
  Trash2,
  Sparkles
} from 'lucide-react';
import { UploadZone } from '../../UploadZone';

interface ColorInfo {
  hex: string;
  rgb: string;
  hsl: string;
  r: number;
  g: number;
  b: number;
}

interface ImageColorExtractorProps {
  lang: 'ar' | 'en';
}

export const ImageColorExtractor: React.FC<ImageColorExtractorProps> = ({ lang }) => {
  const isAr = lang === 'ar';
  
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>('');
  const [colors, setColors] = useState<ColorInfo[]>([]);
  const [colorCount, setColorCount] = useState<number>(6);
  const [selectedColor, setSelectedColor] = useState<ColorInfo | null>(null);
  const [copiedText, setCopiedText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const imageRef = useRef<HTMLImageElement>(null);

  // Clean up ObjectURL
  useEffect(() => {
    return () => {
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

  const handleFileDrop = (files: File[]) => {
    if (files.length > 0) {
      const selected = files[0];
      setFile(selected);
      setSelectedColor(null);
      setColors([]);
      
      const pUrl = URL.createObjectURL(selected);
      setFilePreview(pUrl);
    }
  };

  const handleColorCountChange = (val: number) => {
    setColorCount(val);
    if (filePreview) {
      // Trigger re-extraction
      setTimeout(() => extractPaletteOnLoad(), 50);
    }
  };

  // Helper conversions
  const rgbToHex = (r: number, g: number, b: number): string => {
    const toHex = (c: number) => {
      const hex = c.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  };

  const rgbToHsl = (r: number, g: number, b: number): string => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  };

  // HTML5 Canvas Color Quantitative Clustering
  const extractPaletteOnLoad = () => {
    if (!imageRef.current) return;
    setIsProcessing(true);

    const img = imageRef.current;
    
    // Custom loading in canvas to avoid cors or dirty canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsProcessing(false);
      return;
    }

    // Standard downscale for fast analysis
    canvas.width = 100;
    canvas.height = 100;
    ctx.drawImage(img, 0, 0, 100, 100);

    try {
      const imgData = ctx.getImageData(0, 0, 100, 100).data;
      const pixelArray: {r: number, g: number, b: number}[] = [];
      
      for (let i = 0; i < imgData.length; i += 16) { // step 4 pixels to be lightweight and fast
        const r = imgData[i];
        const g = imgData[i+1];
        const b = imgData[i+2];
        const a = imgData[i+3];
        // skip semi-transparent pixels
        if (a >= 125) {
          pixelArray.push({ r, g, b });
        }
      }

      // Quick simple quantization clustering (Median-Cut inspired or k-means simple approach)
      // Group pixels by sorting channels
      const bucketSort = (pixels: typeof pixelArray, depth: number): typeof pixelArray[] => {
        if (depth === 0 || pixels.length === 0) return [pixels];

        // Find range of channels to split along max range
        let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0;
        pixels.forEach(p => {
          if (p.r < minR) minR = p.r; if (p.r > maxR) maxR = p.r;
          if (p.g < minG) minG = p.g; if (p.g > maxG) maxG = p.g;
          if (p.b < minB) minB = p.b; if (p.b > maxB) maxB = p.b;
        });

        const rRange = maxR - minR;
        const gRange = maxG - minG;
        const bRange = maxB - minB;

        let component: 'r' | 'g' | 'b' = 'r';
        if (gRange >= rRange && gRange >= bRange) component = 'g';
        else if (bRange >= rRange && bRange >= gRange) component = 'b';

        // Sort by greatest range channel
        pixels.sort((x, y) => x[component] - y[component]);

        const mid = Math.floor(pixels.length / 2);
        return [
          ...bucketSort(pixels.slice(0, mid), depth - 1),
          ...bucketSort(pixels.slice(mid), depth - 1)
        ];
      };

      // Determine required divisions depth (e.g. 2^3 = 8 colors)
      // Since splitting dynamically, we divide into up to colorCount buckets
      let divisions = Math.ceil(Math.log2(colorCount));
      if (divisions < 1) divisions = 1;

      const buckets = bucketSort(pixelArray, divisions);
      const extractedList: ColorInfo[] = [];

      buckets.slice(0, colorCount).forEach(bucket => {
        if (bucket.length === 0) return;
        let sumR = 0, sumG = 0, sumB = 0;
        bucket.forEach(p => {
          sumR += p.r; sumG += p.g; sumB += p.b;
        });
        const r = Math.round(sumR / bucket.length);
        const g = Math.round(sumG / bucket.length);
        const b = Math.round(sumB / bucket.length);

        extractedList.push({
          hex: rgbToHex(r, g, b),
          rgb: `rgb(${r}, ${g}, ${b})`,
          hsl: rgbToHsl(r, g, b),
          r, g, b
        });
      });

      // Fill remaining if buckets split slightly unevenly
      while (extractedList.length < colorCount && extractedList.length > 0) {
        extractedList.push({ ...extractedList[0] });
      }

      setColors(extractedList.slice(0, colorCount));
      setSelectedColor(extractedList[0] || null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(''), 1500);
  };

  // Harmonies formulas based on current selected color
  const getHarmonies = () => {
    if (!selectedColor) return [];
    const { r, g, b } = selectedColor;
    
    // Complementary is color inversion
    const compR = 255 - r, compG = 255 - g, compB = 255 - b;
    const complementary = {
      name: isAr ? 'مكمل متناظر' : 'Complementary',
      hex: rgbToHex(compR, compG, compB),
      rgb: `rgb(${compR}, ${compG}, ${compB})`
    };

    // Soft Analogous options (H +/- 30 degrees)
    // To keep simple, let's mix original color with soft blue and soft gold
    const mixAnalogous1 = {
      name: isAr ? 'متجانس هادئ 1' : 'Analogous Accent 1',
      hex: rgbToHex(Math.min(255, Math.round(r * 1.1)), Math.min(255, Math.round(g * 0.9)), Math.max(0, Math.round(b * 0.8))),
      rgb: `rgb(${Math.min(255, Math.round(r * 1.1))}, ${Math.min(255, Math.round(g * 0.9))}, ${Math.max(0, Math.round(b * 0.8))})`
    };

    const mixAnalogous2 = {
      name: isAr ? 'متجانس هادئ 2' : 'Analogous Accent 2',
      hex: rgbToHex(Math.max(0, Math.round(r * 0.8)), Math.min(255, Math.round(g * 1.1)), Math.min(255, Math.round(b * 1.2))),
      rgb: `rgb(${Math.max(0, Math.round(r * 0.8))}, ${Math.min(255, Math.round(g * 1.1))}, ${Math.min(255, Math.round(b * 1.2))})`
    };

    return [complementary, mixAnalogous1, mixAnalogous2];
  };

  // Export palette as CSS variables download or representation
  const getCssVarsString = () => {
    if (colors.length === 0) return '';
    return `:root {\n` + colors.map((c, idx) => `  --color-primary-${idx + 1}: ${c.hex}; /* ${c.rgb} */`).join('\n') + `\n}`;
  };

  // Draw downloadable Palette Image
  const handleDownloadPalettePng = () => {
    if (colors.length === 0) return;
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill white details
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 800, 400);

    const blockWidth = 800 / colors.length;
    colors.forEach((color, i) => {
      // Draw Color box
      ctx.fillStyle = color.hex;
      ctx.fillRect(i * blockWidth, 0, blockWidth, 280);

      // Draw Info Text
      ctx.fillStyle = '#1E1E2F';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(color.hex, i * blockWidth + 15, 320);

      ctx.fillStyle = '#6E6E82';
      ctx.font = '12px Courier New';
      ctx.fillText(color.rgb, i * blockWidth + 15, 345);
      ctx.fillText(color.hsl, i * blockWidth + 15, 370);
    });

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `color_forge_palette.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearApp = () => {
    setFile(null);
    setFilePreview('');
    setColors([]);
    setSelectedColor(null);
  };

  const harmonies = getHarmonies();

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-purple-100 dark:border-slate-700/50 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-2xl">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-purple-950 dark:text-white">
              {isAr ? '🎨 مستخرج ومولد لوحات الألوان' : 'Color Palette Extractor'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isAr 
                ? 'استخرج لوحات الألوان والرموز المتطابقة من أي صورة، مع نسخ بنقرة واحدة وتجربة عملية للألوان على تصاميم وهمية.' 
                : 'Extract matched color codes and beautiful harmonious swatches instantly from any image file.'}
            </p>
          </div>
        </div>
        {file && (
          <button 
            onClick={clearApp}
            className="flex items-center justify-center gap-1.5 text-red-600 hover:text-red-700 font-bold text-xs bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/30 p-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap self-start"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isAr ? 'إفراغ واختيار صورة أخرى' : 'Clear & Pick Another Page'}</span>
          </button>
        )}
      </div>

      {!file ? (
        <UploadZone
          onFilesSelected={handleFileDrop}
          accept="image/*"
          title={isAr ? 'اسحب صورتك هنا لبدء استخراج الألوان' : 'Drag your image here to extract colors'}
          subtitle={isAr ? 'ندعم جميع صيغ الصور ومقاساتها' : 'Supports PNG, JPG, JPEG, WEBP and more'}
          maxSizeMB={40}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left panel: Image & Controls */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-purple-100 dark:border-slate-700 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-purple-50 dark:border-slate-750 pb-3">
                <Sliders className="w-5 h-5 text-purple-650" />
                <h3 className="font-extrabold text-slate-800 dark:text-white text-sm">{isAr ? 'متحكمات لوحة الألوان' : 'Palette Controls'}</h3>
              </div>

              {/* Slider for count */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-600 dark:text-gray-400">{isAr ? 'عدد الألوان المستخرجة:' : 'Extracted color count:'}</span>
                  <span className="font-mono font-extrabold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-slate-700 px-2.5 py-1 rounded-lg">
                    {colorCount}
                  </span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="10"
                  step="1"
                  value={colorCount}
                  onChange={(e) => handleColorCountChange(parseInt(e.target.value))}
                  className="w-full accent-purple-600 h-2 bg-gray-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Original Preview Container */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-500 block">{isAr ? 'صورة التحليل والتدقيق:' : 'Target Analysis Image:'}</span>
                <div className="relative rounded-2xl border border-gray-150 dark:border-slate-750 p-2 flex items-center justify-center bg-gray-50 dark:bg-slate-900 aspect-video overflow-hidden">
                  <img
                    ref={imageRef}
                    src={filePreview}
                    alt="Analyzed target"
                    className="max-h-full max-w-full object-contain rounded-xl"
                    onLoad={extractPaletteOnLoad}
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                  />
                  {isProcessing && (
                    <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/85 backdrop-blur-[1px] flex flex-col items-center justify-center text-center">
                      <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mb-2" />
                      <p className="text-xs font-bold text-purple-950 dark:text-purple-300">{isAr ? 'جاري الاستخراج محلياً...' : 'Extracting on-device...'}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right panel: Extracted Colors & Custom Mockups */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Extracted Swatches block */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-purple-100 dark:border-slate-700/50 space-y-5">
              <div className="flex items-center justify-between border-b border-purple-50 dark:border-slate-750 pb-3">
                <div className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-emerald-500" />
                  <h3 className="font-extrabold text-slate-800 dark:text-white text-sm">
                    {isAr ? 'الألوان المستخرجة بنجاح' : 'Extracted Swatches'}
                  </h3>
                </div>
                {colors.length > 0 && (
                  <button
                    onClick={handleDownloadPalettePng}
                    className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isAr ? 'تصدير كـ PNG' : 'Export PNG'}</span>
                  </button>
                )}
              </div>

              {colors.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-xs font-semibold">
                  {isAr ? 'يرجى تحميل صورة صالحة لاستخراج الدرجات.' : 'Please load a valid image to extract shades.'}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Hex Blocks */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
                    {colors.map((color, index) => {
                      const isSelected = selectedColor?.hex === color.hex;
                      return (
                        <button
                          key={index}
                          onClick={() => setSelectedColor(color)}
                          className={`flex flex-col rounded-2xl overflow-hidden p-2 text-center transition-all bg-slate-50 dark:bg-slate-900 border text-xs font-extrabold cursor-pointer group
                            ${isSelected 
                              ? 'border-purple-600 ring-2 ring-purple-100 dark:ring-purple-900/40 shadow-md scale-102' 
                              : 'border-transparent hover:border-purple-300'
                            }
                          `}
                        >
                          <div 
                            className="aspect-square w-full rounded-xl mb-2 transition-transform group-hover:scale-[1.03]" 
                            style={{ backgroundColor: color.hex }} 
                          />
                          <span className="font-mono text-slate-800 dark:text-gray-300 block text-[11px] mb-0.5">{color.hex}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Selected Detailed info */}
                  {selectedColor && (
                    <div className="bg-purple-50/50 dark:bg-slate-900/30 border border-purple-100/40 dark:border-slate-750 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Detailed Conversions display */}
                      <div className="sm:col-span-2 space-y-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-md border border-neutral-200" style={{ backgroundColor: selectedColor.hex }} />
                          <span className="text-xs font-extrabold text-purple-950 dark:text-white">
                            {isAr ? 'اللون المحدد حالياً:' : 'Active selected color:'}
                          </span>
                        </div>

                        {/* Codes format clipboard list */}
                        <div className="space-y-1.5 font-mono text-[11px]">
                          <div className="flex justify-between items-center bg-white dark:bg-slate-800 border dark:border-slate-700 px-3 py-1.5 rounded-xl">
                            <span className="text-gray-400">HEX:</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-800 dark:text-white">{selectedColor.hex}</span>
                              <button 
                                onClick={() => handleCopy(selectedColor.hex)}
                                className="text-purple-600 hover:text-purple-700 p-1"
                              >
                                {copiedText === selectedColor.hex ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          <div className="flex justify-between items-center bg-white dark:bg-slate-800 border dark:border-slate-700 px-3 py-1.5 rounded-xl">
                            <span className="text-gray-400">RGB:</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-800 dark:text-white">{selectedColor.rgb}</span>
                              <button 
                                onClick={() => handleCopy(selectedColor.rgb)}
                                className="text-purple-600 hover:text-purple-700 p-1"
                              >
                                {copiedText === selectedColor.rgb ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          <div className="flex justify-between items-center bg-white dark:bg-slate-800 border dark:border-slate-700 px-3 py-1.5 rounded-xl">
                            <span className="text-gray-400">HSL:</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-800 dark:text-white">{selectedColor.hsl}</span>
                              <button 
                                onClick={() => handleCopy(selectedColor.hsl)}
                                className="text-purple-600 hover:text-purple-700 p-1"
                              >
                                {copiedText === selectedColor.hsl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Harmonies suggestions */}
                      <div className="bg-white dark:bg-slate-800 p-3.5 border dark:border-slate-700 rounded-xl space-y-3">
                        <span className="text-[11px] font-bold text-gray-500 block uppercase border-b pb-1 dark:border-slate-700">
                          {isAr ? 'الألوان المتناسقة المقترحة:' : 'Harmonious Matches:'}
                        </span>
                        <div className="space-y-2">
                          {harmonies.map((harm, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[11px]">
                              <div className="flex items-center gap-1.5">
                                <div className="w-3.5 h-3.5 rounded border" style={{ backgroundColor: harm.hex }} />
                                <span className="font-bold text-gray-700 dark:text-gray-300">{harm.name}</span>
                              </div>
                              <button 
                                onClick={() => handleCopy(harm.hex)}
                                className="text-gray-500 font-mono font-bold hover:text-purple-650"
                              >
                                {copiedText === harm.hex ? <Check className="w-3 h-3 text-emerald-500" /> : harm.hex}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mock Preview Showcase */}
                  <div className="space-y-3.5">
                    <span className="text-xs font-extrabold text-neutral-500 flex items-center gap-1.5">
                      <Eye className="w-4 h-4" />
                      <span>{isAr ? 'معاينة حية ومباشرة على واجهة تصميم وهمية:' : 'Live Preview Context Showcase:'}</span>
                    </span>

                    <div className="p-5 rounded-2xl border bg-gray-50 dark:bg-slate-900 border-gray-150 dark:border-slate-750 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Component A: Hero mock card */}
                      <div 
                        className="p-5 rounded-xl flex flex-col justify-between space-y-4 text-white shadow-sm transition-all"
                        style={{ backgroundColor: selectedColor?.hex || '#6366F1' }}
                      >
                        <div>
                          <span className="bg-white/25 px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase">
                            MOCK DESIGN INSPIRED BY PALETTE
                          </span>
                          <h4 className="font-extrabold text-lg mt-2 leading-tight">
                            {isAr ? 'الهندسة المعمارية للألوان الفائقة' : 'Mastery of Unified Palettes'}
                          </h4>
                          <p className="text-[10px] opacity-80 mt-1">
                            {isAr ? 'معاينة تجربة المستخدم لتناسق ألوان المخرجات من الصورة.' : 'Verify visual experience and matching output contrast dynamic.'}
                          </p>
                        </div>
                        <button className="bg-white text-neutral-900 px-4 py-2 rounded-lg text-xs font-extrabold self-start shadow-sm transition-transform hover:scale-102">
                          {isAr ? 'تحميل الآن' : 'Download Now'}
                        </button>
                      </div>

                      {/* Component B: Mock mobile dashboard entry */}
                      <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border dark:border-slate-700 flex flex-col space-y-3 shadow-xs">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-800 dark:text-white">{isAr ? 'لوحة تحكم إدارية' : 'Admin Panel Widget'}</span>
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedColor?.hex }} />
                        </div>
                        <div className="h-2 w-full bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: '70%', backgroundColor: selectedColor?.hex }} />
                        </div>
                        <div className="flex gap-2.5">
                          <button 
                            className="flex-1 py-1 px-2.5 rounded text-[10px] font-bold text-white text-center"
                            style={{ backgroundColor: selectedColor?.hex }}
                          >
                            {isAr ? 'موافق' : 'Approve'}
                          </button>
                          <button 
                            className="flex-1 py-1 px-2.5 rounded text-[10px] font-bold text-gray-505 text-center bg-gray-100 dark:bg-slate-700"
                          >
                            {isAr ? 'تجاهل' : 'Dismiss'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Export CSS Variables Area */}
                  {colors.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <FileCode className="w-4 h-4" />
                        <span>{isAr ? 'تصدير كمغيرات CSS Variables برمجيّة:' : 'CSS Custom Properties Export Block:'}</span>
                      </div>
                      <div className="relative">
                        <pre className="bg-slate-950 text-emerald-400 p-4 rounded-2xl text-[10px] font-mono overflow-x-auto max-h-36">
                          {getCssVarsString()}
                        </pre>
                        <button
                          onClick={() => handleCopy(getCssVarsString())}
                          className="absolute top-2 right-2 bg-slate-800 hover:bg-slate-700 text-white p-1.5 rounded-lg transition-all"
                          title="Copy variables"
                        >
                          {copiedText === getCssVarsString() ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

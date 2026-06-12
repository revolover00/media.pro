import React, { useState, useEffect, useRef } from 'react';
import { 
  Grid, 
  Download, 
  Trash2, 
  RefreshCw, 
  Info, 
  Sliders, 
  Sparkles, 
  FileArchive, 
  Image as ImageIcon 
} from 'lucide-react';
import { UploadZone } from '../../UploadZone';
import JSZip from 'jszip';

interface ImageSplitterProps {
  lang: 'ar' | 'en';
}

export const ImageSplitter: React.FC<ImageSplitterProps> = ({ lang }) => {
  const isAr = lang === 'ar';

  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>('');
  const [rows, setRows] = useState<number>(3);
  const [cols, setCols] = useState<number>(3);
  const [splitMode, setSplitMode] = useState<'grid' | 'horizontal' | 'vertical'>('grid');
  
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [splitParts, setSplitParts] = useState<{ id: string; url: string; row: number; col: number; blob: Blob }[]>([]);
  const imageRef = useRef<HTMLImageElement>(null);

  // Clear split parts urls
  useEffect(() => {
    return () => {
      splitParts.forEach(p => URL.revokeObjectURL(p.url));
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview, splitParts]);

  const handleFileDrop = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setSplitParts([]);
      const pUrl = URL.createObjectURL(files[0]);
      setFilePreview(pUrl);
    }
  };

  const setPreset = (r: number, c: number, mode: 'grid' | 'horizontal' | 'vertical' = 'grid') => {
    setRows(r);
    setCols(c);
    setSplitMode(mode);
    setSplitParts([]);
  };

  const handleSplitImage = () => {
    if (!file || !imageRef.current) return;
    setIsProcessing(true);
    setSplitParts([]);

    const img = new Image();
    img.src = filePreview;
    img.onload = () => {
      try {
        const results: { id: string; url: string; row: number; col: number; blob: Blob }[] = [];
        const actualWidth = img.naturalWidth;
        const actualHeight = img.naturalHeight;

        // Determine subdivisions based on mode
        const activeRows = splitMode === 'vertical' ? 1 : rows;
        const activeCols = splitMode === 'horizontal' ? 1 : cols;

        const partWidth = Math.floor(actualWidth / activeCols);
        const partHeight = Math.floor(actualHeight / activeRows);

        for (let r = 0; r < activeRows; r++) {
          for (let c = 0; c < activeCols; c++) {
            const canvas = document.createElement('canvas');
            canvas.width = partWidth;
            canvas.height = partHeight;
            const ctx = canvas.getContext('2d');

            if (ctx) {
              // Crop from original source coordinates and draw onto target part
              ctx.drawImage(
                img,
                c * partWidth,
                r * partHeight,
                partWidth,
                partHeight,
                0,
                0,
                partWidth,
                partHeight
              );

              // Get canvas as Blob
              canvas.toBlob((blob) => {
                if (blob) {
                  results.push({
                    id: `part_${r}_${c}`,
                    url: URL.createObjectURL(blob),
                    row: r,
                    col: c,
                    blob
                  });

                  if (results.length === activeRows * activeCols) {
                    // Sorting grid order for consistency
                    results.sort((x, y) => {
                      if (x.row !== y.row) return x.row - y.row;
                      return x.col - y.col;
                    });
                    setSplitParts(results);
                    setIsProcessing(false);
                  }
                }
              }, 'image/png');
            }
          }
        }
      } catch (err) {
        console.error(err);
        setIsProcessing(false);
      }
    };
  };

  // ZIP exporter logic
  const handleDownloadAllAsZip = async () => {
    if (splitParts.length === 0 || !file) return;
    const zip = new JSZip();

    splitParts.forEach((part) => {
      const idx = splitParts.length > 9 ? `p_${part.row + 1}_${part.col + 1}` : `part_${part.row * cols + part.col + 1}`;
      zip.file(`${file.name.substring(0, file.name.lastIndexOf('.')) || 'image'}_${idx}.png`, part.blob);
    });

    try {
      const content = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(content);

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${file.name.substring(0, file.name.lastIndexOf('.')) || 'split_images'}_grid_pack.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error(err);
    }
  };

  const downloadSinglePart = (url: string, index: number) => {
    if (!file) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = `${file.name.substring(0, file.name.lastIndexOf('.'))}_split_part_${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setFile(null);
    setFilePreview('');
    setSplitParts([]);
  };

  const previewRowsCount = splitMode === 'vertical' ? 1 : rows;
  const previewColsCount = splitMode === 'horizontal' ? 1 : cols;

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-purple-100 dark:border-slate-700/50 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-2xl">
            <Grid className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-purple-950 dark:text-white">
              {isAr ? '📐 تقسيم الصور لشبكات وبانوراما' : 'Instagram Puzzle Grid & Image Splitter'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isAr 
                ? 'قم بتقطيع وتقسيم صورك لشبكات مخصصة متساوية الأبعاد أو صور بانورامية مقطعة، مع تصديرها دفعة واحدة كملف ZIP مدمج.' 
                : 'Slice any photo into puzzle layouts or continuous banners. Download as single parts or compile into a unified ZIP archive.'}
            </p>
          </div>
        </div>
        {file && (
          <button 
            onClick={handleReset}
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
          title={isAr ? 'اسحب صورتك هنا لتجزيئها' : 'Drag your photo here to split'}
          subtitle={isAr ? 'ندعم جميع صيغ الدقة العالية' : 'Supports high-resolution PNG, JPG, WEBP'}
          maxSizeMB={50}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Split Config settings */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-purple-100 dark:border-slate-700 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-purple-50 dark:border-slate-750 pb-3">
                <Sliders className="w-5 h-5 text-purple-650" />
                <h3 className="font-extrabold text-slate-800 dark:text-white text-sm">
                  {isAr ? 'إعدادات شبكة القص' : 'Grid Slice Layout'}
                </h3>
              </div>

              {/* Mode Selectors */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 dark:text-gray-400 block">{isAr ? 'نمط التقسيم المفضل' : 'Splitting Mode'}</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => { setSplitMode('grid'); setSplitParts([]); }}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer
                      ${splitMode === 'grid' 
                        ? 'bg-purple-600 text-white border-purple-600' 
                        : 'bg-white dark:bg-slate-850 text-gray-700 dark:text-gray-300 border-gray-205'
                      }`}
                  >
                    {isAr ? 'شبكة متماثلة' : 'Symmetric Grid'}
                  </button>
                  <button
                    onClick={() => { setSplitMode('horizontal'); setSplitParts([]); }}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer
                      ${splitMode === 'horizontal' 
                        ? 'bg-purple-600 text-white border-purple-600' 
                        : 'bg-white dark:bg-slate-850 text-gray-700 dark:text-gray-300 border-gray-205'
                      }`}
                  >
                    {isAr ? 'أفقي فقط' : 'Rows Only'}
                  </button>
                  <button
                    onClick={() => { setSplitMode('vertical'); setSplitParts([]); }}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer
                      ${splitMode === 'vertical' 
                        ? 'bg-purple-600 text-white border-purple-600' 
                        : 'bg-white dark:bg-slate-850 text-gray-700 dark:text-gray-300 border-gray-205'
                      }`}
                  >
                    {isAr ? 'عمودي فقط' : 'Columns Only'}
                  </button>
                </div>
              </div>

              {/* standard presets */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 dark:text-gray-400 block">{isAr ? 'قوالب سريعة جاهزة' : 'Quick Layout Presets'}</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button onClick={() => setPreset(3, 3, 'grid')} className="py-2 px-2 border rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:border-purple-300 dark:border-slate-700 cursor-pointer text-center">
                    {isAr ? 'شبكة إنستغرام 3×3' : 'Instagram 3×3'}
                  </button>
                  <button onClick={() => setPreset(2, 2, 'grid')} className="py-2 px-2 border rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:border-purple-300 dark:border-slate-700 cursor-pointer text-center">
                    {isAr ? 'شبكة ثنائية 2×2' : 'Symmetric 2×2'}
                  </button>
                  <button onClick={() => setPreset(1, 3, 'vertical')} className="py-2 px-2 border rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:border-purple-300 dark:border-slate-700 cursor-pointer text-center">
                    {isAr ? 'بانوراما دائرية 1×3' : 'Carousels 1×3'}
                  </button>
                  <button onClick={() => setPreset(1, 2, 'vertical')} className="py-2 px-2 border rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:border-purple-300 dark:border-slate-700 cursor-pointer text-center">
                    {isAr ? 'نصفين عموديين 1×2' : 'Half Columns 1×2'}
                  </button>
                  <button onClick={() => setPreset(2, 1, 'horizontal')} className="py-2 px-2 border rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:border-purple-300 dark:border-slate-700 cursor-pointer text-center">
                    {isAr ? 'نصفين أفقين 2×1' : 'Half Rows 2×1'}
                  </button>
                  <button onClick={() => setPreset(4, 4, 'grid')} className="py-2 px-2 border rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:border-purple-300 dark:border-slate-700 cursor-pointer text-center">
                    {isAr ? 'تفصيلي 4×4' : 'Detailed 4×4'}
                  </button>
                </div>
              </div>

              {/* Custom counter inputs */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                {splitMode !== 'vertical' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-650 dark:text-gray-400 block">{isAr ? 'عدد الصفوف (أفقي)' : 'Rows count'}</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={rows}
                      onChange={(e) => { setRows(Math.max(1, parseInt(e.target.value) || 1)); setSplitParts([]); }}
                      className="w-full bg-gray-50 dark:bg-slate-900 border dark:border-slate-700 p-2.5 rounded-xl text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                )}
                {splitMode !== 'horizontal' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-650 dark:text-gray-400 block">{isAr ? 'عدد الأعمدة (عمودي)' : 'Columns count'}</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={cols}
                      onChange={(e) => { setCols(Math.max(1, parseInt(e.target.value) || 1)); setSplitParts([]); }}
                      className="w-full bg-gray-50 dark:bg-slate-900 border dark:border-slate-700 p-2.5 rounded-xl text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-purple-50 dark:border-slate-750">
              <button
                onClick={handleSplitImage}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-750 to-indigo-750 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-lg hover:from-purple-800 hover:to-indigo-805 disabled:opacity-40 transition-all cursor-pointer"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>{isAr ? 'جاري تجزئة وحيازة الصورة...' : 'Splitting frames...'}</span>
                  </div>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-purple-200" />
                    <span>{isAr ? 'تجزئة وتقسيم الصورة الآن' : 'Split Image Now'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Live Overlay / Result Panel */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Grid preview overlay on original image */}
            {splitParts.length === 0 && (
              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-purple-100 dark:border-slate-700/50 space-y-3">
                <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest block">
                  {isAr ? 'مخطط ومعاينة خطوط التقسيم التفاعلية:' : 'Interactive Split Grid Guideline overlay:'}
                </h4>
                <div className="p-2 bg-gray-50 dark:bg-slate-900 border dark:border-slate-755 rounded-2xl flex items-center justify-center aspect-video relative overflow-hidden">
                  {/* Guideline Overlay */}
                  <div className="relative inline-block max-h-full max-w-full">
                    <img
                      ref={imageRef}
                      src={filePreview}
                      alt="Grid overlay target"
                      className="max-h-[380px] max-w-full object-contain rounded-xl"
                      referrerPolicy="no-referrer"
                    />
                    {/* Dotted lines rendering above image */}
                    <div className="absolute inset-x-0 inset-y-0 pointer-events-none hover:opacity-100 transition-opacity">
                      {/* Horizontal lines */}
                      {Array.from({ length: previewRowsCount - 1 }).map((_, idx) => (
                        <div
                          key={`row-line-${idx}`}
                          className="absolute left-0 right-0 border-b-2 border-dashed border-purple-500/80 drop-shadow shadow-black"
                          style={{ top: `${((idx + 1) / previewRowsCount) * 100}%` }}
                        />
                      ))}
                      {/* Vertical lines */}
                      {Array.from({ length: previewColsCount - 1 }).map((_, idx) => (
                        <div
                          key={`col-line-${idx}`}
                          className="absolute top-0 bottom-0 border-r-2 border-dashed border-purple-500/80 drop-shadow shadow-black"
                          style={{ left: `${((idx + 1) / previewColsCount) * 100}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-xs bg-purple-50 dark:bg-slate-900/40 text-purple-800 dark:text-purple-300 p-3 rounded-xl leading-relaxed">
                  <Info className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                  <span>
                    {isAr 
                      ? 'الخطوط المتقطعة الحمراء/الأرجوانية الموضحة أعلاه تبيّن بدقة أماكن القص والتقطيع الافتراضيّة للصورة.'
                      : 'The dashed purple guidelines symbolize the precise, symmetric points where the server-side canvas cuts are applied.'}
                  </span>
                </div>
              </div>
            )}

            {/* Split Results Ready */}
            {splitParts.length > 0 && (
              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-purple-100 dark:border-slate-700/50 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-50 dark:border-slate-750 pb-3">
                  <div>
                    <h3 className="font-extrabold text-neutral-800 dark:text-white text-sm">
                      {isAr ? 'الأجزاء المقطعة المتساوية' : 'Cropped Grid Parts'}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {isAr 
                        ? `تم توليد عدد (${splitParts.length}) أجزاء بدقة كاملة.` 
                        : `Successfully generated (${splitParts.length}) split frames.`}
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadAllAsZip}
                    className="flex items-center justify-center gap-1.5 bg-purple-950 hover:bg-neutral-900 text-white font-extrabold text-xs px-4 py-3 rounded-xl transition-all cursor-pointer shadow-md"
                  >
                    <FileArchive className="w-4 h-4 text-purple-300" />
                    <span>{isAr ? 'تنزيل حزمة ZIP كاملة' : 'Download All as ZIP'}</span>
                  </button>
                </div>

                {/* Grid container representation of pieces */}
                <div 
                  className="grid gap-3" 
                  style={{ 
                    gridTemplateColumns: `repeat(${previewColsCount}, minmax(0, 1fr))` 
                  }}
                >
                  {splitParts.map((part, index) => (
                    <div 
                      key={part.id} 
                      className="group relative bg-gray-50 dark:bg-slate-900 border dark:border-slate-750 rounded-xl overflow-hidden aspect-square flex items-center justify-center p-1"
                    >
                      <img 
                        src={part.url} 
                        alt={`Symmetric part ${index}`} 
                        className="max-h-full max-w-full object-contain rounded-md"
                        referrerPolicy="no-referrer"
                      />
                      {/* Hover Overlay download single */}
                      <button
                        onClick={() => downloadSinglePart(part.url, index)}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"
                        title={isAr ? 'تحميل هذا الجزء' : 'Download this image'}
                      >
                        <Download className="w-5 h-5 mb-1" />
                        <span className="text-[9px] font-bold">#{index + 1}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

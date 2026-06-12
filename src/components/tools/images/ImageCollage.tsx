import React, { useState, useRef, useEffect } from 'react';
import { 
  Layout, 
  Download, 
  Trash2, 
  Sliders, 
  Plus, 
  Sparkles, 
  Columns, 
  RefreshCw, 
  ArrowLeftRight, 
  Check 
} from 'lucide-react';
import { toPng } from 'html-to-image';

interface CollageImage {
  id: string;
  url: string;
  file: File;
}

interface ImageCollageProps {
  lang: 'ar' | 'en';
}

type CollageTemplate = '2x1' | '1x2' | '2x2' | '3-split' | '4-header';

export const ImageCollage: React.FC<ImageCollageProps> = ({ lang }) => {
  const isAr = lang === 'ar';

  const [uploadedImages, setUploadedImages] = useState<CollageImage[]>([]);
  const [template, setTemplate] = useState<CollageTemplate>('2x2');
  
  // Custom styling controls
  const [borderWidth, setBorderWidth] = useState<number>(6);
  const [borderColor, setBorderColor] = useState<string>('#FFFFFF');
  const [borderRadius, setBorderRadius] = useState<number>(16);
  const [outerPadding, setOuterPadding] = useState<number>(10);
  const [aspectRatio, setAspectRatio] = useState<string>('aspect-video'); // aspect-video, aspect-square, aspect-portrait
  
  // Slot configuration mappings: stores [slotIndex] => imageId
  const [slotAssignments, setSlotAssignments] = useState<Record<number, string>>({});
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const collageRef = useRef<HTMLDivElement>(null);

  // Clean object urls on dismantle
  useEffect(() => {
    return () => {
      uploadedImages.forEach(img => URL.revokeObjectURL(img.url));
    };
  }, [uploadedImages]);

  const handleMultipleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray: File[] = Array.from(e.target.files);
      const customImages: CollageImage[] = filesArray.map(file => ({
        id: Math.random().toString(36).substring(2, 9),
        url: URL.createObjectURL(file),
        file
      }));

      // Append up to 8 images
      const nextList = [...uploadedImages, ...customImages].slice(0, 10);
      setUploadedImages(nextList);

      // Automatically map initial slots if they are empty
      const nextAssignments = { ...slotAssignments };
      const totalSlots = getSlotsCount(template);
      
      for (let i = 0; i < totalSlots; i++) {
        if (!nextAssignments[i] && nextList[i]) {
          nextAssignments[i] = nextList[i].id;
        }
      }
      setSlotAssignments(nextAssignments);
    }
  };

  const getSlotsCount = (tpl: CollageTemplate): number => {
    switch (tpl) {
      case '2x1': return 2;
      case '1x2': return 2;
      case '2x2': return 4;
      case '3-split': return 3;
      case '4-header': return 4;
      default: return 4;
    }
  };

  // Switch template reset slots layout helper
  const handleTemplateChange = (tpl: CollageTemplate) => {
    setTemplate(tpl);
    const slots = getSlotsCount(tpl);
    const nextAssignments: Record<number, string> = {};
    
    // Attempt to remap available uploaded images
    for (let i = 0; i < slots; i++) {
      if (uploadedImages[i]) {
        nextAssignments[i] = uploadedImages[i].id;
      }
    }
    setSlotAssignments(nextAssignments);
  };

  const assignImageToSlot = (slotIdx: number, imageId: string) => {
    setSlotAssignments(prev => ({
      ...prev,
      [slotIdx]: imageId
    }));
  };

  const clearUploadedImage = (id: string) => {
    // Revoke url first
    const target = uploadedImages.find(img => img.id === id);
    if (target) URL.revokeObjectURL(target.url);

    setUploadedImages(prev => prev.filter(img => img.id !== id));
    
    // Clear slots pointing to this image
    setSlotAssignments(prev => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        const slotKey = parseInt(k);
        if (next[slotKey] === id) {
          delete next[slotKey];
        }
      });
      return next;
    });
  };

  const clearAllCollageSettings = () => {
    uploadedImages.forEach(img => URL.revokeObjectURL(img.url));
    setUploadedImages([]);
    setSlotAssignments({});
  };

  // Export HTML styled div Node via client-side html-to-image library
  const handleExportCollage = () => {
    if (!collageRef.current) return;
    setIsExporting(true);

    const node = collageRef.current;
    
    // Quick delay to ensure canvas rendering triggers correctly
    setTimeout(() => {
      toPng(node, {
        quality: 1.0,
        pixelRatio: 2, // High resolution Retinal rendering multiplier!
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `fileforge_pro_collage_${Date.now()}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsExporting(false);
      })
      .catch((err) => {
        console.error('HtmlToImage compilation error:', err);
        setIsExporting(false);
      });
    }, 500);
  };

  // Return standard grid css classes for dynamic templates
  const renderSlotsLayout = () => {
    const slots = getSlotsCount(template);
    
    if (template === '2x1') {
      return (
        <div className="grid grid-cols-2 h-full w-full" style={{ gap: `${borderWidth}px` }}>
          {renderSlotNode(0, 'h-full w-full')}
          {renderSlotNode(1, 'h-full w-full')}
        </div>
      );
    }

    if (template === '1x2') {
      return (
        <div className="grid grid-rows-2 h-full w-full" style={{ gap: `${borderWidth}px` }}>
          {renderSlotNode(0, 'h-full w-full')}
          {renderSlotNode(1, 'h-full w-full')}
        </div>
      );
    }

    if (template === '2x2') {
      return (
        <div className="grid grid-cols-2 grid-rows-2 h-full w-full" style={{ gap: `${borderWidth}px` }}>
          {renderSlotNode(0, 'h-full w-full')}
          {renderSlotNode(1, 'h-full w-full')}
          {renderSlotNode(2, 'h-full w-full')}
          {renderSlotNode(3, 'h-full w-full')}
        </div>
      );
    }

    if (template === '3-split') {
      // Left 1 large vertical, Right 2 horizontal halfs
      return (
        <div className="grid grid-cols-3 h-full w-full animate-fade-in" style={{ gap: `${borderWidth}px` }}>
          <div className="col-span-2 h-full">{renderSlotNode(0, 'h-full w-full')}</div>
          <div className="col-span-1 grid grid-rows-2 h-full" style={{ gap: `${borderWidth}px` }}>
            {renderSlotNode(1, 'h-full w-full')}
            {renderSlotNode(2, 'h-full w-full')}
          </div>
        </div>
      );
    }

    if (template === '4-header') {
      // 1 Top large row spanned, 3 bottom elements
      return (
        <div className="grid grid-rows-3 h-full w-full" style={{ gap: `${borderWidth}px` }}>
          <div className="row-span-2 h-full">{renderSlotNode(0, 'h-full w-full')}</div>
          <div className="row-span-1 grid grid-cols-3 h-full" style={{ gap: `${borderWidth}px` }}>
            {renderSlotNode(1, 'h-full w-full')}
            {renderSlotNode(2, 'h-full w-full')}
            {renderSlotNode(3, 'h-full w-full')}
          </div>
        </div>
      );
    }

    return null;
  };

  const renderSlotNode = (slotIdx: number, extraClasses: string) => {
    const assignedId = slotAssignments[slotIdx];
    const item = uploadedImages.find(img => img.id === assignedId);

    return (
      <div 
        className={`${extraClasses} relative bg-neutral-100 dark:bg-slate-900 overflow-hidden flex items-center justify-center transition-all group`}
        style={{ borderRadius: `${borderRadius}px` }}
      >
        {item ? (
          <>
            <img 
              src={item.url} 
              alt={`Collage slot ${slotIdx}`} 
              className="w-full h-full object-cover transition-transform group-hover:scale-[1.03]"
              referrerPolicy="no-referrer"
            />
            {/* Quick action buttons on overlay hover */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <select
                onChange={(e) => assignImageToSlot(slotIdx, e.target.value)}
                value={assignedId || ''}
                className="bg-white/95 text-neutral-900 border text-[10px] font-bold p-1 rounded-md"
              >
                {uploadedImages.map(img => (
                  <option key={img.id} value={img.id}>
                    {img.file.name.substring(0, 10)}...
                  </option>
                ))}
              </select>
              
              <button
                onClick={() => {
                  setSlotAssignments(prev => {
                    const next = { ...prev };
                    delete next[slotIdx];
                    return next;
                  });
                }}
                className="p-1 bg-red-650 hover:bg-red-700 text-white rounded-md"
                title={isAr ? 'حذف من المنفذ' : 'Remove from slot'}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-3 text-gray-400">
            <Plus className="w-5 h-5 mb-1 text-gray-300 pointer-events-none" />
            <span className="text-[9px] font-bold tracking-wider block uppercase">{isAr ? `خانة #${slotIdx + 1}` : `Slot #${slotIdx + 1}`}</span>
            
            {uploadedImages.length > 0 && (
              <select
                onChange={(e) => assignImageToSlot(slotIdx, e.target.value)}
                defaultValue=""
                className="mt-2 bg-white dark:bg-slate-800 border dark:border-slate-700 text-[10px] p-1 rounded-md text-slate-800 dark:text-gray-300 max-w-[100px] font-bold cursor-pointer"
              >
                <option value="" disabled>Select</option>
                {uploadedImages.map(img => (
                  <option key={img.id} value={img.id}>
                    {img.file.name.substring(0, 8)}...
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Title Header Card */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-purple-100 dark:border-slate-700/50 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/40 text-purple-750 dark:text-purple-300 rounded-2xl">
            <Layout className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-purple-950 dark:text-white">
              {isAr ? '🖼️ صانع كولاج ودمج الصور الفني' : 'Advanced Photo Collage Maker'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isAr 
                ? 'امزج وصمم كولاج مذهل من عدة لقطات معاً، مع التحكم في الهوامش والألوان والزوايا المستديرة وتصدير Collage كصورة واحدة ممتازة.' 
                : 'Merge several pictures into an artistic split template. Fine-tune card margins, border radii, framing colors, and download.'}
            </p>
          </div>
        </div>
        {uploadedImages.length > 0 && (
          <button 
            onClick={clearAllCollageSettings}
            className="flex items-center justify-center gap-1.5 text-red-600 hover:text-red-700 font-bold text-xs bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/30 p-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap self-start"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isAr ? 'حذف اللقطات تماماً' : 'Remove All Uploads'}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Uploads Tray and Grid customization Sliders */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-purple-100 dark:border-slate-700 space-y-6">
          
          {/* Section 1: Template selection */}
          <div className="space-y-3.5">
            <h3 className="text-xs font-extrabold text-slate-850 dark:text-white uppercase tracking-wider border-b pb-2 dark:border-slate-750">
              {isAr ? '1. القالب الفني المفضل:' : '1. Layout Framing Template:'}
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => handleTemplateChange('2x1')}
                className={`py-2 px-1 text-center font-bold text-xs rounded-xl border cursor-pointer ${template === '2x1' ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-50 dark:bg-slate-900 border-transparent hover:border-purple-200 text-slate-700 dark:text-gray-300'}`}
              >
                {isAr ? 'أفقي ثنائي' : '2 Columns'}
              </button>
              <button 
                onClick={() => handleTemplateChange('1x2')}
                className={`py-2 px-1 text-center font-bold text-xs rounded-xl border cursor-pointer ${template === '1x2' ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-50 dark:bg-slate-900 border-transparent hover:border-purple-200 text-slate-700 dark:text-gray-300'}`}
              >
                {isAr ? 'عمودي ثنائي' : '2 Rows'}
              </button>
              <button 
                onClick={() => handleTemplateChange('2x2')}
                className={`py-2 px-1 text-center font-bold text-xs rounded-xl border cursor-pointer ${template === '2x2' ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-50 dark:bg-slate-900 border-transparent hover:border-purple-200 text-slate-700 dark:text-gray-300'}`}
              >
                {isAr ? 'شبكة رباعية' : '2x2 Grid'}
              </button>
              <button 
                onClick={() => handleTemplateChange('3-split')}
                className={`py-2 px-1 text-center font-bold text-xs rounded-xl border cursor-pointer ${template === '3-split' ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-50 dark:bg-slate-900 border-transparent hover:border-purple-200 text-slate-700 dark:text-gray-300'}`}
              >
                {isAr ? 'ثلاثي غير متماثل' : '3-Split'}
              </button>
              <button 
                onClick={() => handleTemplateChange('4-header')}
                className={`py-2 px-1 text-center font-bold text-xs rounded-xl border cursor-pointer ${template === '4-header' ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-50 dark:bg-slate-900 border-transparent hover:border-purple-200 text-slate-700 dark:text-gray-300'}`}
              >
                {isAr ? 'ترويسة ثلاثية' : '4-Banner Row'}
              </button>
            </div>
          </div>

          {/* Section 2: Upload Tray */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-slate-850 dark:text-white uppercase tracking-wider border-b pb-2 dark:border-slate-750">
              {isAr ? '2. مخزن الصور واللقطات:' : '2. Manage Images Pool:'}
            </h3>
            
            <div className="flex items-center gap-3">
              <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-purple-100 hover:border-purple-300 dark:border-slate-700/80 rounded-2xl p-4 cursor-pointer text-center group transition-colors">
                <Plus className="w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform mb-1" />
                <span className="text-[10px] font-extrabold text-purple-950 dark:text-gray-300">{isAr ? 'إضافة صور جديدة' : 'Upload Images Tray'}</span>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleMultipleFiles}
                />
              </label>
            </div>

            {/* Uploaded thumbnails list */}
            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-4 gap-2 max-h-44 overflow-y-auto p-1 border dark:border-slate-750 rounded-xl bg-slate-50 dark:bg-slate-900/40">
                {uploadedImages.map((img) => (
                  <div key={img.id} className="relative aspect-square border dark:border-slate-700 rounded-lg overflow-hidden group">
                    <img 
                      src={img.url} 
                      alt="Thumbnail pool" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                    <button
                      onClick={() => clearUploadedImage(img.id)}
                      className="absolute top-1 right-1 bg-red-60s hover:bg-red-700 bg-red-500 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Design Adjustments sliders */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-slate-850 dark:text-white uppercase tracking-wider border-b pb-2 dark:border-slate-750">
              {isAr ? '3. لمسات التصميم والهوامش:' : '3. Edge & Border Customization:'}
            </h3>

            {/* Border Thickness */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[11px] font-bold text-gray-550 dark:text-gray-400">
                <span>{isAr ? 'سُمك الفراغات الفاصلة:' : 'Border Inner spacing (thickness):'}</span>
                <span className="font-mono">{borderWidth}px</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="30" 
                value={borderWidth} 
                onChange={(e) => setBorderWidth(parseInt(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer h-1 rounded-lg"
              />
            </div>

            {/* Border Radius */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[11px] font-bold text-gray-550 dark:text-gray-400">
                <span>{isAr ? 'استدارة الزوايا للصور:' : 'Border Corner rounding (Radius):'}</span>
                <span className="font-mono">{borderRadius}px</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="40" 
                value={borderRadius} 
                onChange={(e) => setBorderRadius(parseInt(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer h-1 rounded-lg"
              />
            </div>

            {/* Inner padding */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[11px] font-bold text-gray-550 dark:text-gray-400">
                <span>{isAr ? 'الهامش الخارجي للكولاج:' : 'Canvas outer framing padding:'}</span>
                <span className="font-mono">{outerPadding}px</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="30" 
                value={outerPadding} 
                onChange={(e) => setOuterPadding(parseInt(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer h-1 rounded-lg"
              />
            </div>

            {/* Aspect ratios select */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-400 block">{isAr ? 'تدرج لون الإطار:' : 'Border Solid Color:'}</span>
                <div className="flex gap-1.5 items-center">
                  <input 
                    type="color" 
                    value={borderColor} 
                    onChange={(e) => setBorderColor(e.target.value)}
                    className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent"
                  />
                  <input 
                    type="text" 
                    value={borderColor} 
                    onChange={(e) => setBorderColor(e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-slate-900 text-xs font-mono p-1 rounded border dark:border-slate-700 text-slate-800 dark:text-gray-300 uppercase shrink"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-gray-400 block">{isAr ? 'أبعاد لوحة التصميم:' : 'Canvas Aspect Ratio:'}</span>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 text-xs font-bold p-2 rounded-xl text-slate-800 dark:text-gray-300"
                >
                  <option value="aspect-video">{isAr ? 'شاشة عريضة (16:9)' : 'Wide Landscape (16:9)'}</option>
                  <option value="aspect-square">{isAr ? 'مربع متساوي (1:1)' : 'Square layout (1:1)'}</option>
                  <option value="aspect-[3/4]">{isAr ? 'بورتريه رأسي (4:3)' : 'Vertical Portrait (4:3)'}</option>
                </select>
              </div>
            </div>

          </div>

          {/* Export click */}
          <div className="pt-2">
            <button
              onClick={handleExportCollage}
              disabled={isExporting}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-750 to-indigo-750 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-lg hover:from-purple-800 hover:to-indigo-805 disabled:opacity-45 transition-all cursor-pointer"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>{isAr ? 'جاري الرندرة واستخراج الملف...' : 'Compiling high res design...'}</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>{isAr ? 'تصدير كولاج عالي الجودة الآن' : 'Export and Download Collage'}</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Right Side: Collage rendering element with specific styles */}
        <div className="lg:col-span-7 bg-slate-100 dark:bg-slate-940 p-4 rounded-3xl flex items-center justify-center border dark:border-slate-800">
          <div className="w-full max-w-lg">
            
            <div 
              ref={collageRef}
              id="collage-output-node"
              className={`w-full ${aspectRatio} transition-all shadow-md overflow-hidden relative`}
              style={{ 
                backgroundColor: borderColor, 
                padding: `${outerPadding}px` 
              }}
            >
              {uploadedImages.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-gray-400 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl">
                  <Layout className="w-12 h-12 text-gray-300 mb-2 animate-pulse" />
                  <p className="text-xs font-bold leading-relaxed">
                    {isAr 
                      ? 'يرجى تحميل لقطات من جهازك في المستودع أولاً للبدء.' 
                      : 'Load images into the pool on the left, then map them onto the templates layout.'}
                  </p>
                </div>
              ) : (
                renderSlotsLayout()
              )}
            </div>

            <div className="text-center text-xs text-gray-400 mt-3 font-semibold">
              {isAr ? '💡 نصيحة: انقر على أي خانة لتوجيه أي صورة تريد من مخزن اللقطات.' : '💡 Select slot controls on hover to assign or re-arrange photos.'}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

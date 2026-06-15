import React, { useState, useEffect, useRef } from 'react';
import { useAIModel } from '../../../hooks/useAIModel';
import { 
  Eye, 
  Trash2, 
  Sliders, 
  Download, 
  Copy, 
  Sparkles, 
  Image as ImageIcon,
  Loader2,
  FileText,
  BookmarkCheck,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';

interface ObjectDetectorProps {
  lang: 'ar' | 'en';
  onAddHistoryItem: (
    itemData: { action: string; fileName: string; originalSize: number; processedSize: number; type: 'image' },
    blob: Blob,
    originalBlobOrUrl: Blob | string
  ) => void;
}

interface DetectionItem {
  box: { xmin: number; ymin: number; xmax: number; ymax: number };
  label: string;
  score: number;
}

export const ObjectDetector: React.FC<ObjectDetectorProps> = ({ lang, onAddHistoryItem }) => {
  const { status, loadModel, cancelLoading } = useAIModel();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [detections, setDetections] = useState<DetectionItem[]>([]);
  const [minConfidence, setMinConfidence] = useState<number>(50); // percentage 0-100
  const [detecting, setDetecting] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Clean preview URL on unmount
  useEffect(() => {
    return () => {
      if (selectedImage) URL.revokeObjectURL(selectedImage);
    };
  }, [selectedImage]);

  // Redraw bounding boxes whenever detections, minConfidence or active image changes
  useEffect(() => {
    if (!selectedImage) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = selectedImage;
    img.onload = () => {
      imageRef.current = img;
      // Set canvas size to native image dimensions
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      // Draw the original image first
      ctx.drawImage(img, 0, 0);

      // Filter detections based on minConfidence
      const filtered = detections.filter(d => d.score * 100 >= minConfidence);

      // Draw bounding boxes
      filtered.forEach((det, idx) => {
        const { xmin, ymin, xmax, ymax } = det.box;
        const width = xmax - xmin;
        const height = ymax - ymin;

        // Generate distinctive colors based on the label text
        const color = getLabelColor(det.label);

        // Draw Bounding Box
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(2, Math.round(canvas.width / 250)); // Scale line with image size
        ctx.strokeRect(xmin, ymin, width, height);

        // Draw label background ribbon
        ctx.fillStyle = color;
        const fontSize = Math.max(12, Math.round(canvas.width / 50));
        ctx.font = `bold ${fontSize}px sans-serif`;
        const labelText = `${det.label} (${(det.score * 100).toFixed(0)}%)`;
        const textWidth = ctx.measureText(labelText).width;

        // Ensure label draws inside canvas boundaries
        let labelY = ymin - 5;
        if (labelY < fontSize) labelY = ymin + fontSize + 5;

        ctx.fillRect(xmin - 2, labelY - fontSize - 2, textWidth + 10, fontSize + 6);

        // Draw text
        ctx.fillStyle = '#ffffff';
        ctx.fillText(labelText, xmin + 3, labelY);
      });
    };
  }, [selectedImage, detections, minConfidence]);

  const getLabelColor = (label: string): string => {
    // Return predefined beautiful theme colors
    const colors = [
      '#ef4444', // Red
      '#f97316', // Orange
      '#eab308', // Yellow
      '#22c55e', // Green
      '#06b6d4', // Cyan
      '#3b82f6', // Blue
      '#8b5cf6', // Violet
      '#ec4899', // Pink
    ];
    let hash = 0;
    for (let i = 0; i < label.length; i++) {
      hash = label.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const handleImageUploaded = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (selectedImage) URL.revokeObjectURL(selectedImage);

    const file = files[0];
    setImageFile(file);
    setSelectedImage(URL.createObjectURL(file));
    setDetections([]);
  };

  const runDetection = async () => {
    if (!selectedImage || !imageFile) return;

    setDetecting(true);
    setDetections([]);

    try {
      // 1. Lazy load DETR-ResNet-50 object detector
      const detector = await loadModel('object-detection', 'Xenova/detr-resnet-50');

      // 2. Perform local detection with high accuracy
      const response = await detector(selectedImage, {
        threshold: 0.1, // Ask model for lower thresholds, filter dynamically in UI.
      });

      setDetections(response);
      showToast(lang === 'ar' ? 'اكتمل الكشف بنجاح!' : 'Detection complete!');
    } catch (err: any) {
      console.error(err);
      showToast(lang === 'ar' ? 'فشل معالجة الصورة.' : 'Processing failed.');
    } finally {
      setDetecting(false);
    }
  };

  // Aggregate stats: list labels and their count
  const objectCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    detections
      .filter(d => d.score * 100 >= minConfidence)
      .forEach(d => {
        counts[d.label] = (counts[d.label] || 0) + 1;
      });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [detections, minConfidence]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const getDetectionsTextSummary = (): string => {
    const filtered = detections.filter(d => d.score * 100 >= minConfidence);
    if (filtered.length === 0) {
      return lang === 'ar' ? 'لا توجد عناصر مكتشفة.' : 'No objects detected.';
    }

    const counts = objectCounts.map(([label, count]) => `${count}x ${label}`).join(', ');
    const detailList = filtered.map((d, index) => {
      return `${index + 1}. [${d.label}] (${(d.score * 100).toFixed(0)}% confidence)`;
    }).join('\n');

    return lang === 'ar'
      ? `تحليل الصورة: ${imageFile?.name || 'صورة'}\nالعناصر المكتشفة إجمالاً: ${filtered.length}\nالملخص: ${counts}\n\nالتفاصيل:\n${detailList}`
      : `Image Analysis: ${imageFile?.name || 'image'}\nTotal Detected objects: ${filtered.length}\nSummary: ${counts}\n\nDetails:\n${detailList}`;
  };

  const handleCopySummary = () => {
    const text = getDetectionsTextSummary();
    navigator.clipboard.writeText(text);
    showToast(lang === 'ar' ? 'تم نسخ التقرير النصي إلى الحافظة!' : 'Summary text copied!');
  };

  const handleExportImage = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageFile) return;

    canvas.toBlob((blob) => {
      if (!blob) return;

      // Register processed history item
      onAddHistoryItem(
        {
          action: lang === 'ar' ? 'كشف العناصر بالذكاء الاصطناعي' : 'AI Object Detection',
          fileName: `detected_${imageFile.name}`,
          originalSize: imageFile.size,
          processedSize: blob.size,
          type: 'image',
        },
        blob,
        imageFile
      );

      // Trigger standard browser download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `detected_${imageFile.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 'image/jpeg', 0.95);
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-purple-100 dark:border-slate-700 shadow-sm space-y-6">
      
      {/* Toast Alert Inside Model */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-900 border border-purple-500/30 text-white py-3 px-5 rounded-2xl shadow-xl animate-slideIn">
          <BookmarkCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold leading-none">{toast}</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-50 dark:border-slate-700 pb-5">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-rose-500 to-red-600 p-2.5 rounded-2xl text-white shadow-md">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg text-slate-950 dark:text-white flex items-center gap-2">
              {lang === 'ar' ? 'كاشف ومحصي العناصر في الصور' : 'Visual Object Detection & Counter'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'ar' 
                ? 'نموذج DETR-ResNet-50 للكشف الفوري عن 80+ نوعاً من العناصر وتصديرها بالمربعات الملونة.' 
                : 'Local DETR-ResNet-50 visual network to detect, group and count over 80 species of objects.'}
            </p>
          </div>
        </div>
      </div>

      {/* Loading Progress Frame */}
      {status.loading && (
        <div className="bg-purple-50 dark:bg-slate-700/50 border border-purple-100 dark:border-purple-900 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold flex items-center gap-2 text-purple-900 dark:text-purple-300">
              <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
              {lang === 'ar' ? 'جاري تحميل نموذج الذكاء الاصطناعي محلياً...' : 'Downloading AI Model locally...'}
            </span>
            <span className="font-bold font-mono text-purple-800 dark:text-purple-400">{status.progress}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-purple-500 to-rose-500 h-full rounded-full transition-all duration-300" 
              style={{ width: `${status.progress}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400">
            {lang === 'ar' 
              ? 'يحدث هذا مرة واحدة فقط. يتم حفظ النموذج بعدها في ذاكرة IndexedDB بجهازك للعمل الفوري لاحقاً.' 
              : 'This model is downloaded only once and securely cached inside IndexedDB.'}
          </p>
          <button 
            onClick={cancelLoading}
            className="text-[10px] text-red-500 hover:underline font-bold"
          >
            {lang === 'ar' ? 'إلغاء التحميل' : 'Cancel load'}
          </button>
        </div>
      )}

      {status.error && (
        <div className="bg-red-50 dark:bg-rose-950/20 border border-red-100 dark:border-rose-900/30 p-4 rounded-xl flex items-start gap-2 text-xs text-red-700 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{status.error}</span>
        </div>
      )}

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Box Drawing Preview Space */}
        <div className="lg:col-span-8 space-y-4">
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl p-6 bg-slate-50 dark:bg-slate-900/40 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden">
            {selectedImage ? (
              <div className="space-y-4 w-full flex flex-col items-center">
                
                {/* Canvas Drawing container */}
                <div id="image-canvas-wrapper" className="relative max-w-full overflow-hidden rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
                  <canvas 
                    ref={canvasRef} 
                    className="max-h-[450px] max-w-full object-contain mx-auto" 
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedImage(null);
                      setImageFile(null);
                      setDetections([]);
                    }}
                    className="text-xs font-bold text-red-500 bg-red-50 dark:bg-rose-950/20 hover:bg-red-100 px-4 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    {lang === 'ar' ? 'حذف وتغيير الصورة' : 'Change Image'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="bg-purple-50 dark:bg-slate-700 text-purple-600 dark:text-purple-300 p-4 rounded-full inline-block">
                  <ImageIcon className="w-8 h-8" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-350">{lang === 'ar' ? 'اسحب صورتك هنا لفك شفراتها' : 'Drop your image here'}</div>
                  <p className="text-xs text-slate-400 mt-1">{lang === 'ar' ? 'يدعم الملفات المحلية PNG, JPEG, SVG' : 'Supports local JPEG, PNG, SVG'}</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUploaded}
                  className="hidden"
                  id="detect-img-picker"
                />
                <label
                  htmlFor="detect-img-picker"
                  className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white font-extrabold py-2.5 px-6 rounded-2xl text-xs cursor-pointer shadow transition-all"
                >
                  {lang === 'ar' ? 'تصفح الملفات' : 'Browse Files'}
                </label>
              </div>
            )}
          </div>

          {selectedImage && !status.loading && (
            <button
              onClick={runDetection}
              disabled={detecting}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-red-600 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-md cursor-pointer disabled:opacity-50 transition-all text-xs"
            >
              {detecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{lang === 'ar' ? 'جاري الكشف عن العناصر ووصف الإحداثيات الكلية...' : 'Extracting boxes & parsing spatial models...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'بدء تشغيل كاشف العناصر المحلي' : 'Run Local Detector Model'}</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Floating Controller / Output Stats Panel */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Controls Card */}
          <div className="bg-slate-55 dark:bg-slate-900/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-4">
            <h3 className="font-bold text-xs text-slate-800 dark:text-slate-300 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-600" />
              <span>{lang === 'ar' ? 'لوحة التحكم والفرز' : 'Filtering Options'}</span>
            </h3>

            {/* Confidence Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400">{lang === 'ar' ? 'أدنى نسبة ثقة:' : 'Min Confidence:'}</span>
                <span className="font-bold text-purple-600 font-mono">{minConfidence}%</span>
              </div>
              <input 
                type="range"
                min="10"
                max="90"
                value={minConfidence}
                onChange={(e) => setMinConfidence(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 accent-rose-500 rounded-lg cursor-pointer"
              />
            </div>

            {/* Count Aggregate results */}
            <div className="border-t border-slate-200 dark:border-slate-750 pt-4 space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{lang === 'ar' ? 'إحصاء العناصر المكتشفة' : 'OBJECT SUMMARY'}</span>
              
              {objectCounts.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {objectCounts.map(([label, count]) => (
                    <div key={label} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-750 rounded-xl p-2.5 flex items-center justify-between shadow-sm">
                      <span className="capitalize text-slate-700 dark:text-slate-300 font-medium">{label}</span>
                      <span className="font-extrabold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 py-0.5 px-2 rounded-lg">{count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 font-medium">
                  {lang === 'ar' ? 'بانتظار إجراء الكشف لعرض الإحصاءات.' : 'Waiting for object detection.'}
                </p>
              )}
            </div>
          </div>

          {/* Export Panel Options */}
          {detections.filter(d => d.score * 100 >= minConfidence).length > 0 && (
            <div className="bg-slate-55 dark:bg-slate-900/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-3">
              <h3 className="font-bold text-xs text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-emerald-500" />
                <span>{lang === 'ar' ? 'خيارات التصدير والحفظ' : 'Export & Share Results'}</span>
              </h3>

              <div className="grid grid-cols-1 gap-2 pt-1">
                {/* Save image containing box */}
                <button
                  onClick={handleExportImage}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'تصدير الصورة مع المربعات' : 'Export Image with BBoxes'}</span>
                </button>

                {/* Copy results summary */}
                <button
                  onClick={handleCopySummary}
                  className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'نسخ تقرير العناصر كنص' : 'Copy Object List text'}</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

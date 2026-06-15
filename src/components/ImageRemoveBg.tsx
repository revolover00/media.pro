import React, { useState, useEffect, useRef } from 'react';
import { 
  Image as ImageIcon, 
  Trash2, 
  Download, 
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Loader2,
  Check,
  Sparkles,
  Layers,
  Palette
} from 'lucide-react';
import { UploadZone } from './UploadZone';
import { HistoryItem } from '../types';
import { formatBytes } from '../utils/imageUtils';

interface ImageRemoveBgProps {
  onAddHistoryItem: (item: Omit<HistoryItem, 'id' | 'timestamp' | 'downloadUrl'>, blob: Blob) => string;
}

export const ImageRemoveBg: React.FC<ImageRemoveBgProps> = ({ onAddHistoryItem }) => {
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [processedTransparentUrl, setProcessedTransparentUrl] = useState<string | null>(null);
  const [compositeUrl, setCompositeUrl] = useState<string | null>(null);
  
  const [isLibraryLoading, setIsLibraryLoading] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [bgType, setBgType] = useState<'transparent' | 'white' | 'black' | 'custom'>('transparent');
  const [customBgColor, setCustomBgColor] = useState<string>('#a855f7'); // purple-500

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Dynamically load the @imgly/background-removal script on mount
  useEffect(() => {
    if ((window as any).imglyBackgroundRemoval) return;

    setIsLibraryLoading(true);
    setProgressStatus('جاري تحميل محرك الذكاء الاصطناعي لإزالة الخلفية...');
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.4.0/dist/background-removal.iife.js';
    script.async = true;
    script.onload = () => {
      setIsLibraryLoading(false);
      setProgressStatus('');
      console.log('imglyBackgroundRemoval library loaded successfully.');
    };
    script.onerror = () => {
      setIsLibraryLoading(false);
      setErrorMsg('فشل تحميل حزمة إزالة الخلفيات الذكية عبر الشبكة. يرجى مراجعة اتصال الإنترنت لديك.');
    };
    document.body.appendChild(script);

    return () => {
      // Keep library loaded globally for reuse
    };
  }, []);

  // Cleanup object URLs on unmount/file change
  useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
      if (processedTransparentUrl) URL.revokeObjectURL(processedTransparentUrl);
      if (compositeUrl) URL.revokeObjectURL(compositeUrl);
    };
  }, [originalUrl, processedTransparentUrl, compositeUrl]);

  // Regenerate composite image when background selection changes
  useEffect(() => {
    if (!processedTransparentUrl) return;
    generateCompositeImage();
  }, [processedTransparentUrl, bgType, customBgColor]);

  const handleFileDrop = (files: File[]) => {
    if (files.length > 0) {
      const selectedFile = files[0];
      setFile(selectedFile);
      setOriginalUrl(URL.createObjectURL(selectedFile));
      setProcessedTransparentUrl(null);
      setCompositeUrl(null);
      setErrorMsg(null);
    }
  };

  const handleReset = () => {
    setFile(null);
    setOriginalUrl(null);
    setProcessedTransparentUrl(null);
    setCompositeUrl(null);
    setErrorMsg(null);
    setBgType('transparent');
  };

  const processImageRemoveBg = async () => {
    if (!file) return;
    
    const lib = (window as any).imglyBackgroundRemoval;
    if (!lib) {
      setErrorMsg('محرك إزالة الخلفية غير متوفر حالياً. يرجى تصفح الصفحة لاحقاً أو التحقق من اتصال الإنترنت لجلبه.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    setProgressStatus('يرجى الانتظار؛ يجري تشغيل خوارزميات الذكاء الاصطناعي محلية بالمتصفح لعزل الجسم وتفكيك الخلفية...');

    try {
      // Configuration for imglyBackgroundRemoval
      // We pass progress callback to show updates
      const config = {
        progress: (key: string, current: number, total: number) => {
          const percent = Math.round((current / total) * 100);
          setProgressStatus(`جاري معالجة مصفوفة الصورة: ${percent}%`);
        }
      };

      const resultBlob = await lib(file, config);
      const transpUrl = URL.createObjectURL(resultBlob);
      setProcessedTransparentUrl(transpUrl);
      
    } catch (err: any) {
      console.error('BG removal failed', err);
      setErrorMsg('نعتذر، لم نستطع إزالة الخلفية تلقائياً. قد تكون جودة الصورة ضعيفة أو ينقصها التباين.');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateCompositeImage = () => {
    if (!processedTransparentUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = processedTransparentUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Fill background
      if (bgType === 'white') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (bgType === 'black') {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (bgType === 'custom') {
        ctx.fillStyle = customBgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        // Transparent: keep clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      // Draw the transparent subject
      ctx.drawImage(img, 0, 0);

      const dataUrl = canvas.toDataURL('image/png');
      if (compositeUrl) URL.revokeObjectURL(compositeUrl);
      setCompositeUrl(dataUrl);
    };
  };

  const handleDownload = () => {
    const urlToDownload = compositeUrl || processedTransparentUrl;
    if (!urlToDownload || !file) return;

    fetch(urlToDownload)
      .then(res => res.blob())
      .then(blob => {
        onAddHistoryItem({
          action: 'إزالة خلفية الصورة',
          fileName: `${file.name.split('.')[0]}_nobg.png`,
          originalSize: file.size,
          processedSize: blob.size,
          type: 'image'
        }, blob);

        const link = document.createElement('a');
        link.href = urlToDownload;
        link.download = `${file.name.split('.')[0]}_nobg.png`;
        link.click();
      });
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-purple-50 shadow-sm space-y-6">
      <div className="flex items-center gap-3 border-b border-purple-50 pb-4">
        <div className="bg-purple-100 p-2.5 rounded-2xl text-purple-700">
          <Sparkles className="w-6 h-6 animate-pulse text-purple-600" />
        </div>
        <div>
          <h2 className="font-extrabold text-xl text-purple-950">إزالة الخلفية بالذكاء الاصطناعي</h2>
          <p className="text-xs text-gray-400 mt-1">امسح الخلفية من أي صورة محلياً وبأعلى جودة وسرعة، مع حرية تبديل الألوان بلمسة واحدة</p>
        </div>
      </div>

      {isLibraryLoading && (
        <div className="p-8 bg-purple-50/50 rounded-2xl border border-purple-150 flex flex-col items-center justify-center text-center space-y-3">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          <p className="text-sm font-bold text-purple-950">{progressStatus}</p>
          <p className="text-[11px] text-gray-400">سوف يتم قريباً تنزيل مكتبة الذكاء الاصطناعي لتشغيلها بالكامل داخل متصفحك دون إرسال الصور لأي خادم خارجي</p>
        </div>
      )}

      {!isLibraryLoading && !file && (
        <UploadZone
          onFilesSelected={handleFileDrop}
          accept="image/*"
          title="اسحب صورتك هنا لعزل الخلفية"
          subtitle="يدعم رفع صور فوتوغرافية، لوجوهات، وصور المنتجات المختلفة"
        />
      )}

      {file && originalUrl && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-700 truncate max-w-[200px] md:max-w-md">
                {file.name}
              </span>
              <span className="text-[11px] bg-purple-100 text-purple-700 py-1 px-2.5 rounded-lg font-mono font-bold">
                {formatBytes(file.size)}
              </span>
            </div>
            <button
              onClick={handleReset}
              disabled={isProcessing}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-bold transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>تغيير الصورة</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Control Column */}
            <div className="lg:col-span-4 space-y-5 bg-purple-50/40 p-5 rounded-2xl border border-purple-100/50">
              <h3 className="font-bold text-sm text-purple-950 flex items-center gap-2">
                <Palette className="w-[18px] h-[18px] text-purple-600" />
                <span>الخيارات والتحكم</span>
              </h3>

              {!processedTransparentUrl ? (
                <button
                  onClick={processImageRemoveBg}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold py-3.5 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-5 h-5 shrink-0" />
                  <span>بدء عزل الخلفية بالذكاء الاصطناعي</span>
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-purple-950 flex items-center gap-1">
                      <Layers className="w-4 h-4 text-purple-600" />
                      <span>اختيار لون خلفية بديل:</span>
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setBgType('transparent')}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          bgType === 'transparent' 
                            ? 'bg-purple-600 text-white border-purple-600 shadow-md' 
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-slate-50'
                        }`}
                      >
                        شفاف (PNG)
                      </button>
                      <button
                        onClick={() => setBgType('white')}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          bgType === 'white' 
                            ? 'bg-purple-600 text-white border-purple-600 shadow-md' 
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-slate-50'
                        }`}
                      >
                        أبيض
                      </button>
                      <button
                        onClick={() => setBgType('black')}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          bgType === 'black' 
                            ? 'bg-purple-600 text-white border-purple-600 shadow-md' 
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-slate-50'
                        }`}
                      >
                        أسود
                      </button>
                      <button
                        onClick={() => setBgType('custom')}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          bgType === 'custom' 
                            ? 'bg-purple-600 text-white border-purple-600 shadow-md' 
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-slate-50'
                        }`}
                      >
                        لون مخصص
                      </button>
                    </div>
                  </div>

                  {bgType === 'custom' && (
                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-purple-100 mt-2">
                      <span className="text-xs font-bold text-gray-600">اختر اللون:</span>
                      <input
                        type="color"
                        value={customBgColor}
                        onChange={(e) => setCustomBgColor(e.target.value)}
                        className="w-10 h-8 p-0 rounded-lg cursor-pointer border border-pink-100"
                      />
                      <span className="text-xs font-mono font-bold text-gray-500 uppercase">{customBgColor}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-purple-150">
                    <button
                      onClick={handleDownload}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 px-6 rounded-xl shadow-md transition-all cursor-pointer text-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>تنزيل الصورة المعالجة</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-white p-4 rounded-xl border border-purple-100 text-[10.5px] text-purple-900 leading-relaxed space-y-2">
                <p className="font-bold flex items-center gap-1 text-purple-950 mb-1">
                  <HelpCircle className="w-3.5 h-3.5" />
                  دليل الأداة:
                </p>
                <p>• تجرى عملية المعالجة بالكامل محلياً وبالمجان عبر المتصفح باستخدام الشبكات الدلالية للعزل، مما يضمن أقصى حماية لبياناتك الشخصية وسرية ملونة فائقة.</p>
                <p>• تعتمد النتيجة الإيجابية على تميز الجسم وعزله الواضح بالنسبة للخلفية الأصلية.</p>
              </div>
            </div>

            {/* Previews Column */}
            <div className="lg:col-span-8 space-y-6">
              {isProcessing && (
                <div className="flex flex-col items-center justify-center bg-slate-50 border border-purple-150 rounded-3xl p-10 min-h-[350px] space-y-4 text-center animate-pulse">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-purple-200 border-t-purple-750 animate-spin" />
                    <Sparkles className="w-6 h-6 text-purple-700 absolute top-5 left-5" />
                  </div>
                  <div className="max-w-md space-y-2">
                    <p className="font-bold text-sm text-purple-950">جاري المعالجة وعزل العناصر الذكي...</p>
                    <p className="text-xs text-gray-500">{progressStatus}</p>
                  </div>
                </div>
              )}

              {!isProcessing && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Original Image Card */}
                  <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm flex flex-col">
                    <div className="bg-slate-50 px-5 py-3 border-b border-gray-100 text-xs font-bold text-slate-700">
                      الصورة الأصلية
                    </div>
                    <div className="flex-1 p-4 flex items-center justify-center bg-slate-50/50 aspect-square min-h-[300px]">
                      <img
                        src={originalUrl}
                        alt="Original"
                        className="max-h-[300px] max-w-full object-contain rounded-xl shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Processed Image Card */}
                  <div className="bg-white border border-purple-100 rounded-3xl overflow-hidden shadow-md flex flex-col relative">
                    <div className="bg-purple-50/50 px-5 py-3 border-b border-purple-100 text-xs font-extrabold text-purple-950 flex items-center justify-between">
                      <span>النتيجة المعزولة</span>
                      {processedTransparentUrl && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">جاهز للتحميل</span>
                      )}
                    </div>

                    <div className="flex-1 p-4 flex items-center justify-center bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] bg-slate-100 aspect-square min-h-[300px]">
                      {processedTransparentUrl ? (
                        <div 
                          style={{
                            backgroundColor: bgType === 'white' ? '#ffffff' : bgType === 'black' ? '#000000' : bgType === 'custom' ? customBgColor : 'transparent'
                          }}
                          className="w-full h-full flex items-center justify-center rounded-xl overflow-hidden transition-colors duration-300"
                        >
                          <img
                            src={processedTransparentUrl}
                            alt="No background"
                            className="max-h-[290px] max-w-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="text-center p-8">
                          <ImageIcon className="w-12 h-12 text-slate-350 mx-auto mb-2 animate-pulse" />
                          <p className="text-xs text-gray-400">انقر على "بدء عزل الخلفية بالذكاء الاصطناعي" لمشاهدة النتيجة المذهلة هنا فورياً</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

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

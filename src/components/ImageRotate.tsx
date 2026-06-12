import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Trash2, 
  RotateCw,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  GitCommit,
  Split
} from 'lucide-react';
import { UploadZone } from './UploadZone';
import { HistoryItem } from '../types';
import { formatBytes } from '../utils/imageUtils';

interface ImageRotateProps {
  onAddHistoryItem: (item: Omit<HistoryItem, 'id' | 'timestamp' | 'downloadUrl'>, blob: Blob, originalBlobOrUrl?: Blob | string) => string;
}

export const ImageRotate: React.FC<ImageRotateProps> = ({ onAddHistoryItem }) => {
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>('');
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [resultImg, setResultImg] = useState<{ blob: Blob; url: string; size: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
      if (resultImg?.url) URL.revokeObjectURL(resultImg.url);
    };
  }, [filePreview, resultImg]);

  const handleFileDrop = (files: File[]) => {
    if (files.length > 0) {
      const selectedFile = files[0];
      setFile(selectedFile);
      setResultImg(null);
      setErrorMsg(null);
      setFilePreview(URL.createObjectURL(selectedFile));
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setFilePreview('');
    setResultImg(null);
    setErrorMsg(null);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
  };

  const handleRotateCw = () => {
    setRotation(prev => (prev + 90) % 360);
    setResultImg(null);
  };

  const handleRotateCcw = () => {
    setRotation(prev => (prev - 90 + 360) % 360);
    setResultImg(null);
  };

  const toggleFlipH = () => {
    setFlipH(prev => !prev);
    setResultImg(null);
  };

  const toggleFlipV = () => {
    setFlipV(prev => !prev);
    setResultImg(null);
  };

  const handleApplyTransform = () => {
    if (!file) return;

    setIsProcessing(true);
    setErrorMsg(null);

    const img = new Image();
    img.src = filePreview;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Could not get Canvas 2D context');
        }

        const angleRad = (rotation * Math.PI) / 180;
        const isSwapped = rotation === 90 || rotation === 270;

        // Determine destination canvas dimensions
        const destW = isSwapped ? img.naturalHeight : img.naturalWidth;
        const destH = isSwapped ? img.naturalWidth : img.naturalHeight;

        canvas.width = destW;
        canvas.height = destH;

        // Move target space to middle of the output canvas
        ctx.translate(destW / 2, destH / 2);

        // Apply flip scaling inside relative space
        const scaleX = flipH ? -1 : 1;
        const scaleY = flipV ? -1 : 1;
        ctx.scale(scaleX, scaleY);

        // Apply rotation
        ctx.rotate(angleRad);

        // Draw image relative to translation center (i.e. offset by negative half-sizes)
        ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

        canvas.toBlob((blob) => {
          if (blob) {
            const outUrl = URL.createObjectURL(blob);
            setResultImg({
              blob,
              url: outUrl,
              size: blob.size
            });

            onAddHistoryItem({
              action: `تدوير وعكس الصورة (تدوير: ${rotation}°، عكس: ${flipH ? 'أفقي' : ''} ${flipV ? 'عمودي' : ''})`,
              fileName: `rotated_${file.name}`,
              originalSize: file.size,
              processedSize: blob.size,
              type: 'image'
            }, blob, file);
          } else {
            setErrorMsg('فشل استخراج ملف الصورة الجديدة.');
          }
          setIsProcessing(false);
        }, file.type || 'image/png', 0.95);

      } catch (err: any) {
        setErrorMsg('فشل تطبيق التعديلات: ' + err?.message);
        setIsProcessing(false);
      }
    };

    img.onerror = () => {
      setErrorMsg('فشل قراءة ملف الصورة للجمع بين العمليات.');
      setIsProcessing(false);
    };
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-purple-50 shadow-sm space-y-6">
      <div className="flex items-center gap-3 border-b border-purple-50 pb-4">
        <div className="bg-purple-100 p-2.5 rounded-2xl text-purple-700">
          <RotateCw className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-extrabold text-xl text-purple-950">تدوير وعكس الصور</h2>
          <p className="text-xs text-gray-400 mt-1">تعديل اتجاه الصورة وعكسها أفقياً أو عمودياً بدقة بالغة</p>
        </div>
      </div>

      {!file ? (
        <UploadZone
          onFilesSelected={handleFileDrop}
          accept="image/*"
          title="اسحب الصورة هنا لتدويرها وعكسها"
          subtitle="الصيغ المدعومة: PNG, JPG, JPEG, WEBP"
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="text-sm font-semibold text-gray-700 truncate max-w-[200px] md:max-w-md">
                {file.name}
              </div>
              <span className="text-[11px] bg-purple-100 text-purple-700 py-1 px-2.5 rounded-lg font-mono">
                {formatBytes(file.size)}
              </span>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-bold transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>تغيير الصورة</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Real-time configuration panel */}
            <div className="lg:col-span-1 space-y-6 bg-purple-50/40 p-6 rounded-2xl border border-purple-100/50">
              <h3 className="font-bold text-sm text-purple-900 border-b border-purple-150 pb-2 mb-3">
                خيارات التدوير والانعكاس
              </h3>

              <div className="space-y-4">
                {/* Rotations */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-purple-950 block">زاوية التدوير الدائري</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleRotateCw}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white hover:bg-purple-100 text-purple-800 text-xs font-bold border border-purple-150 rounded-xl cursor-pointer transition-all"
                    >
                      <RotateCw className="w-4 h-4" />
                      <span>تدوير 90° يميناً</span>
                    </button>
                    <button
                      onClick={handleRotateCcw}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white hover:bg-purple-100 text-purple-800 text-xs font-bold border border-purple-150 rounded-xl cursor-pointer transition-all"
                    >
                      <RotateCw className="w-4 h-4 -scale-x-100" />
                      <span>تدوير 90° يساراً</span>
                    </button>
                  </div>
                </div>

                {/* Mirroring / Flipping */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-purple-950 block">انعكاس متطابق (Mirror)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={toggleFlipH}
                      className={`
                        flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-bold border rounded-xl cursor-pointer transition-all
                        ${flipH 
                          ? 'bg-purple-600 border-purple-600 text-white shadow-md' 
                          : 'bg-white hover:bg-purple-100 border-purple-150 text-purple-800'
                        }
                      `}
                    >
                      <Split className="w-4 h-4 rotate-90" />
                      <span>انعكاس أفقي</span>
                    </button>
                    <button
                      onClick={toggleFlipV}
                      className={`
                        flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-bold border rounded-xl cursor-pointer transition-all
                        ${flipV 
                          ? 'bg-purple-600 border-purple-600 text-white shadow-md' 
                          : 'bg-white hover:bg-purple-100 border-purple-150 text-purple-800'
                        }
                      `}
                    >
                      <Split className="w-4 h-4" />
                      <span>انعكاس عمودي</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Status information */}
              <div className="bg-white p-4 rounded-xl border border-purple-100 text-xs space-y-2 text-purple-900 leading-relaxed">
                <div>الزاوية الإجمالية الحالية: <strong className="font-mono text-purple-950">{rotation}°</strong></div>
                <div>انعكاس أفقي: <strong className="text-purple-950">{flipH ? 'نعم (مفعّل)' : 'لا'}</strong></div>
                <div>انعكاس عمودي: <strong className="text-purple-950">{flipV ? 'نعم (مفعّل)' : 'لا'}</strong></div>
              </div>

              {!resultImg && (
                <button
                  onClick={handleApplyTransform}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-5 h-5 ${isProcessing ? 'animate-spin' : ''}`} />
                  <span>{isProcessing ? 'جاري معالجة الصورة...' : 'معالجة وحفظ التغييرات'}</span>
                </button>
              )}
            </div>

            {/* Simulated Live View Center */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center bg-slate-900 p-6 rounded-2xl border border-slate-800 min-h-[350px] relative overflow-hidden select-none">
              {!resultImg ? (
                <div className="relative max-w-full max-h-[400px] flex items-center justify-center">
                  <img
                    src={filePreview}
                    alt="معاينة حية لتغيير الاتجاه"
                    style={{
                      transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                    }}
                    className="max-w-full max-h-[380px] object-contain block select-none pointer-events-none rounded-xl transition-all duration-300 shadow-xl"
                  />
                  <div className="absolute top-2 right-2 bg-black/60 text-[10px] text-white/90 px-3 py-1 rounded-full font-mono font-medium tracking-normal">
                    معاينة حية وسريعة
                  </div>
                </div>
              ) : (
                <div className="w-full text-center space-y-4">
                  <div className="flex flex-col items-center justify-center gap-2 text-emerald-400 mb-2">
                    <CheckCircle2 className="w-12 h-12" />
                    <span className="font-bold text-sm text-emerald-250">تم تدوير وحفظ ملف الصورة بنجاح!</span>
                  </div>

                  <div className="bg-white/5 p-4 rounded-xl max-w-sm mx-auto border border-white/10 text-right space-y-2">
                    <p className="text-slate-350 text-xs">الحجم النهائي: <strong className="font-mono text-white text-sm">{formatBytes(resultImg.size)}</strong></p>
                    <p className="text-slate-350 text-xs flex justify-between">الحجم الأساسي: <span className="text-white font-mono">{formatBytes(file.size)}</span></p>
                  </div>

                  <div className="relative inline-block max-w-full max-h-[300px] border-4 border-emerald-500/30 rounded-2xl overflow-hidden p-1 bg-white/5 shadow-2xl">
                    <img
                      src={resultImg.url}
                      alt="مخرجات تدوير الصورة"
                      className="max-w-full max-h-[290px] object-contain rounded-xl"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                    <a
                      href={resultImg.url}
                      download={`rotated_${file.name.split('.')[0]}.${file.name.split('.').pop()}`}
                      className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-3 px-6 rounded-xl font-bold font-sans transition-all cursor-pointer text-sm shadow-lg"
                    >
                      <Download className="w-4 h-4" />
                      <span>تحميل الصورة المعدلة</span>
                    </a>
                    <button
                      onClick={() => setResultImg(null)}
                      className="flex items-center justify-center gap-2 bg-white/15 hover:bg-white/20 text-white py-3 px-6 rounded-xl font-bold transition-all cursor-pointer text-sm"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>تطبيق تعديلات إضافية</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-150 text-red-650 p-4 rounded-xl text-sm font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};

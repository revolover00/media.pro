import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftRight, 
  Download, 
  Sparkles, 
  Trash2, 
  Sliders, 
  Info,
  CheckCircle2,
  FileCheck2,
  Lock,
  Unlock,
  AlertCircle
} from 'lucide-react';
import { UploadZone } from './UploadZone';
import { convertImage, resizeImage, getImageDimensions, formatBytes } from '../utils/imageUtils';
import { HistoryItem } from '../types';

interface ImageToolsProps {
  toolType: 'convert' | 'compress' | 'resize';
  onAddHistoryItem: (item: Omit<HistoryItem, 'id' | 'timestamp' | 'downloadUrl'>, blob: Blob, originalBlobOrUrl?: Blob | string) => string;
}

export const ImageTools: React.FC<ImageToolsProps> = ({ toolType, onAddHistoryItem }) => {
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>('');
  const [originalDims, setOriginalDims] = useState<{ width: number; height: number } | null>(null);
  
  const [targetFormat, setTargetFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/webp');
  const [quality, setQuality] = useState<number>(0.8);
  const [compressRatio, setCompressRatio] = useState<number>(0.6);

  const [targetWidth, setTargetWidth] = useState<number>(0);
  const [targetHeight, setTargetHeight] = useState<number>(0);
  const [aspectRatio, setAspectRatio] = useState<number>(1);
  const [maintainAspect, setMaintainAspect] = useState<boolean>(true);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [resultImg, setResultImg] = useState<{ blob: Blob; url: string; size: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (filePreview && !filePreview.startsWith('data:')) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

  useEffect(() => {
    return () => {
      if (resultImg?.url) {
        URL.revokeObjectURL(resultImg.url);
      }
    };
  }, [resultImg]);

  const handleFileDrop = async (files: File[]) => {
    if (files.length > 0) {
      const selectedFile = files[0];
      setFile(selectedFile);
      setErrorMsg(null);
      setResultImg(null);
      
      const previewUrl = URL.createObjectURL(selectedFile);
      setFilePreview(previewUrl);

      try {
        const dims = await getImageDimensions(selectedFile);
        setOriginalDims(dims);
        setTargetWidth(dims.width);
        setTargetHeight(dims.height);
        setAspectRatio(dims.width / dims.height);
      } catch (err) {
        console.error(err);
        setOriginalDims(null);
      }
    }
  };

  const handleWidthChange = (val: number) => {
    setTargetWidth(val);
    if (maintainAspect && aspectRatio) {
      const computedHeight = Math.round(val / aspectRatio);
      setTargetHeight(computedHeight);
    }
  };

  const handleHeightChange = (val: number) => {
    setTargetHeight(val);
    if (maintainAspect && aspectRatio) {
      const computedWidth = Math.round(val * aspectRatio);
      setTargetWidth(computedWidth);
    }
  };

  const handleReset = () => {
    setFile(null);
    setFilePreview('');
    setOriginalDims(null);
    setResultImg(null);
    setErrorMsg(null);
  };

  const handleProcessImage = async () => {
    if (!file) return;

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      if (toolType === 'convert') {
        const result = await convertImage(file, targetFormat, quality);
        const objectUrl = URL.createObjectURL(result.blob);
        setResultImg({
          blob: result.blob,
          url: objectUrl,
          size: result.blob.size,
        });

        onAddHistoryItem({
          action: `تحويل الصيغة إلى ${targetFormat.split('/')[1].toUpperCase()}`,
          fileName: file.name,
          originalSize: file.size,
          processedSize: result.blob.size,
          type: 'image'
        }, result.blob, file);

      } else if (toolType === 'compress') {
        const originalType = file.type;
        const compressType = (originalType === 'image/jpeg' || originalType === 'image/webp') 
          ? originalType as 'image/jpeg' | 'image/webp' 
          : 'image/webp';

        const result = await convertImage(file, compressType, compressRatio);
        const objectUrl = URL.createObjectURL(result.blob);
        setResultImg({
          blob: result.blob,
          url: objectUrl,
          size: result.blob.size,
        });

        onAddHistoryItem({
          action: 'ضغط وتخفيض حجم الصورة',
          fileName: file.name,
          originalSize: file.size,
          processedSize: result.blob.size,
          type: 'image'
        }, result.blob, file);

      } else if (toolType === 'resize') {
        if (targetWidth <= 0 || targetHeight <= 0) {
          throw new Error('الرجاء إدخال أبعاد صالحة أكبر من الصفر.');
        }
        const result = await resizeImage(file, targetWidth, targetHeight, file.type, 0.9);
        const objectUrl = URL.createObjectURL(result.blob);
        setResultImg({
          blob: result.blob,
          url: objectUrl,
          size: result.blob.size,
        });

        onAddHistoryItem({
          action: `تغيير مقاسات الصورة إلى (${targetWidth} × ${targetHeight})`,
          fileName: file.name,
          originalSize: file.size,
          processedSize: result.blob.size,
          type: 'image'
        }, result.blob, file);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'حدث خطأ خطير أثناء معالجة الصورة.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!resultImg || !file) return;

    let extension = 'png';
    if (toolType === 'convert') {
      extension = targetFormat.split('/')[1];
    } else if (toolType === 'compress') {
      extension = file.type === 'image/jpeg' ? 'jpg' : 'webp';
    } else {
      extension = file.name.split('.').pop() || 'png';
    }

    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const finalName = `${baseName}_processed.${extension}`;

    const link = document.createElement('a');
    link.href = resultImg.url;
    link.download = finalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-purple-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-purple-950">
            {toolType === 'convert' && '🔄 تحويل صيغ الصور الاحترافي'}
            {toolType === 'compress' && '⚡ أداة ضغط وتصغير حجم الصور'}
            {toolType === 'resize' && '📐 أداة تعديل مقاسات وأبعاد الصورة'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {toolType === 'convert' && 'قم بتحويل صيغ الصور المبرمجة مثل PNG و JPG و WEBP مع تحديد المخرجات بجودة بالغة الأمان.'}
            {toolType === 'compress' && 'وفر سعة القرص وقم بضغط صورتك مع الحفاظ التام على ألق الألوان ودقة معالمها.'}
            {toolType === 'resize' && 'قم بتعديل حجم صورك بالبكسل مع قفل الحواف والتناسب التلقائي لنسبية الرؤية.'}
          </p>
        </div>
        {file && (
          <button 
            onClick={handleReset}
            className="flex items-center gap-1.5 text-red-600 hover:text-red-700 font-bold text-xs bg-red-50 hover:bg-red-100 p-2.5 rounded-xl transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>تفريغ واختيار ملف آخر</span>
          </button>
        )}
      </div>

      {!file ? (
        <UploadZone
          onFilesSelected={handleFileDrop}
          accept="image/png, image/jpeg, image/webp"
          title="اسحب صورتك هنا أو انقر لتحديد صورة"
          subtitle="ندعم صيغ الصور PNG, JPG, JPEG, WEBP حتى حجم 50 ميجابايت"
          maxSizeMB={50}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl shadow-sm border border-purple-100 flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              <div className="flex items-center gap-2 border-b border-purple-50 pb-3">
                <Sliders className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-gray-850">خيارات المعالجة</h3>
              </div>

              {toolType === 'convert' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-600 block">الصيغة المستهدفة</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['image/webp', 'image/jpeg', 'image/png'] as const).map((fmt) => (
                        <button
                          key={fmt}
                          id={`target-format-${fmt.split('/')[1]}`}
                          onClick={() => setTargetFormat(fmt)}
                          className={`
                            py-3 px-2 rounded-xl text-xs font-bold transition-all border
                            ${targetFormat === fmt 
                              ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-100' 
                              : 'bg-white text-gray-700 border-gray-200 hover:border-purple-350'
                            }
                          `}
                        >
                          {fmt === 'image/jpeg' ? 'JPEG' : fmt === 'image/png' ? 'PNG' : 'WEBP'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {targetFormat !== 'image/png' && (
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between items-center text-xs text-gray-600">
                        <span className="font-bold">جودة الصورة النهائية</span>
                        <span className="text-purple-700 font-extrabold">{Math.round(quality * 100)}%</span>
                      </div>
                      <input
                        id="quality-slider"
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.05"
                        value={quality}
                        onChange={(e) => setQuality(parseFloat(e.target.value))}
                        className="w-full accent-purple-600 h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              )}

              {toolType === 'compress' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs text-gray-650">
                      <span className="font-bold">نسبة ضغط وتصغير الحجم المرجوة</span>
                      <span className="text-purple-700 font-extrabold">{Math.round((1 - compressRatio) * 100)}% (توفير عملاق)</span>
                    </div>
                    <input
                      id="compress-slider"
                      type="range"
                      min="0.1"
                      max="0.9"
                      step="0.05"
                      value={compressRatio}
                      onChange={(e) => setCompressRatio(parseFloat(e.target.value))}
                      className="w-full accent-purple-600 h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {file.type === 'image/png' && (
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-amber-800">
                      <Info className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                      <div>
                        سنقوم بتحويل صورة PNG إلى WEBP المحترفة لتوفير فائق وسليم في مساحة قرص التخزين بنسبة تصل إلى 80%.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {toolType === 'resize' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 block">العرض (بكسل)</label>
                      <input
                        id="resize-width"
                        type="number"
                        min="1"
                        value={targetWidth || ''}
                        onChange={(e) => handleWidthChange(parseInt(e.target.value, 10) || 0)}
                        className="w-full bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-purple-400 focus:bg-white rounded-xl py-2 px-3 text-sm font-semibold"
                        placeholder="العرض"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 block">الارتفاع (بكسل)</label>
                      <input
                        id="resize-height"
                        type="number"
                        min="1"
                        value={targetHeight || ''}
                        onChange={(e) => handleHeightChange(parseInt(e.target.value, 10) || 0)}
                        className="w-full bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-purple-400 focus:bg-white rounded-xl py-2 px-3 text-sm font-semibold"
                        placeholder="الارتفاع"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const updatedFlag = !maintainAspect;
                      setMaintainAspect(updatedFlag);
                      if (updatedFlag && originalDims) {
                        setAspectRatio(originalDims.width / originalDims.height);
                        const computedHeight = Math.round(targetWidth / (originalDims.width / originalDims.height));
                        setTargetHeight(computedHeight);
                      }
                    }}
                    className={`
                      w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-xs font-bold
                      ${maintainAspect 
                        ? 'border-purple-200 bg-purple-50/40 text-purple-800' 
                        : 'border-gray-200 bg-gray-50 text-gray-600'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2">
                      {maintainAspect ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      <span>الحفاظ على الأبعاد المتناسبة</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-purple-50 space-y-3">
              <button
                id="process-image-btn"
                onClick={handleProcessImage}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg hover:from-purple-805 hover:to-indigo-805 disabled:opacity-40 transition-all cursor-pointer"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>جاري المعالجة المحلية...</span>
                  </div>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-purple-200" />
                    <span>بدء المعالجة والتحويل</span>
                  </>
                )}
              </button>

              {errorMsg && (
                <div className="flex items-center gap-2 bg-red-50 text-red-600 p-3 rounded-xl text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Original Preview */}
              <div className="bg-white p-4 rounded-3xl shadow-sm border border-purple-100 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-extrabold text-gray-400 tracking-wider mb-2 uppercase">الصورة الأصلية المرفوعة</h4>
                  <div className="bg-gray-50 rounded-2xl aspect-[4/3] relative overflow-hidden flex items-center justify-center border border-gray-100 p-2">
                    <img
                      src={filePreview}
                      alt="Original snapshot"
                      className="max-w-full max-h-full object-contain rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
                <div className="mt-3 text-xs space-y-1">
                  <div className="flex justify-between font-medium">
                    <span className="text-gray-500">الاسم:</span>
                    <span className="text-gray-800 truncate max-w-[150px]">{file.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">الحجم:</span>
                    <span className="text-gray-800 font-mono font-semibold">{formatBytes(file.size)}</span>
                  </div>
                  {originalDims && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">المقاس:</span>
                      <span className="text-gray-800 font-mono">{originalDims.width} × {originalDims.height} بكسل</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Ready Result Preview */}
              <div className="bg-white p-4 rounded-3xl shadow-sm border border-purple-100 flex flex-col justify-between relative overflow-hidden">
                {!resultImg && !isProcessing && (
                  <div className="absolute inset-0 bg-gray-50/70 backdrop-blur-[1px] flex flex-col items-center justify-center text-center p-6 z-10">
                    <div className="bg-purple-150 text-purple-600 p-3 rounded-full mb-2">
                      <FileCheck2 className="w-8 h-8" />
                    </div>
                    <h5 className="font-bold text-gray-750 text-sm">بانتظار النقرة المباشرة</h5>
                  </div>
                )}

                {isProcessing && (
                  <div className="absolute inset-0 bg-white/85 backdrop-blur-[1px] flex flex-col items-center justify-center text-center p-6 z-10">
                    <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-xs text-gray-400 mt-1">المعالجة آمنة وجارية بالكامل بالمتصفح...</p>
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-extrabold text-purple-600 tracking-wider mb-2 uppercase flex items-center justify-between">
                    <span>صورة النتيجة المخرجة</span>
                    {resultImg && (
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-lg text-[9px] font-bold">
                        جاهزة للتحميل
                      </span>
                    )}
                  </h4>
                  <div className="bg-gray-50 rounded-2xl aspect-[4/3] relative overflow-hidden flex items-center justify-center border border-gray-100 p-2">
                    {resultImg && (
                      <img
                        src={resultImg.url}
                        alt="Processed result snapshot"
                        className="max-w-full max-h-full object-contain rounded-lg"
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </div>
                </div>

                <div className="mt-3 text-xs space-y-1">
                  {resultImg ? (
                    <>
                      <div className="flex justify-between font-bold">
                        <span className="text-gray-500">الحجم الجديد:</span>
                        <span className="text-purple-700 font-mono">{formatBytes(resultImg.size)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg mt-1 justify-center text-center">
                        {resultImg.size < file.size ? (
                          `تم توفير ${Math.round(((file.size - resultImg.size) / file.size) * 100)}% من الحجم`
                        ) : (
                          'محسّن بجودة فائقة'
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-gray-400 py-3">لا توجد بيانات حالياً.</div>
                  )}
                </div>
              </div>

            </div>

            {resultImg && (
              <div className="bg-purple-950 text-white p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                <div>
                  <h4 className="font-bold text-sm">تم معالجة الصورة بنجاح فائق!</h4>
                  <p className="text-xs text-purple-300 mt-1">قم بتنزيل صورتك الفائقة الآن برابط مباشر سريع ومحلي.</p>
                </div>
                <button
                  id="download-processed-img-btn"
                  onClick={downloadResult}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold px-6 py-3 rounded-2xl shadow-md cursor-pointer text-sm"
                >
                  <Download className="w-5 h-5" />
                  <span>تحميل مباشر</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

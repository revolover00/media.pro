import React, { useState, useEffect } from 'react';
import { 
  FolderLock, 
  Trash2, 
  Download, 
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Loader2,
  Check,
  Sparkles,
  Files,
  Maximize2,
  FileSpreadsheet,
  CheckCircle2,
  ArrowRight,
  Plus
} from 'lucide-react';
import { UploadZone } from './UploadZone';
import { HistoryItem } from '../types';
import { formatBytes } from '../utils/imageUtils';
import JSZip from 'jszip';

interface BatchFileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
  previewUrl: string;
  status: 'idle' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
  processedBlob?: Blob;
  outputName?: string;
}

interface ImageBatchProps {
  onAddHistoryItem: (item: Omit<HistoryItem, 'id' | 'timestamp' | 'downloadUrl'>, blob: Blob) => string;
}

export const ImageBatch: React.FC<ImageBatchProps> = ({ onAddHistoryItem }) => {
  const [files, setFiles] = useState<BatchFileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Bulk Settings
  const [outputFormat, setOutputFormat] = useState<'jpeg' | 'png' | 'webp'>('jpeg');
  const [bulkResizeType, setBulkResizeType] = useState<'none' | 'scale' | 'maxWidth'>('none');
  const [resizeScale, setResizeScale] = useState<number>(75); // 10 to 100%
  const [resizeMaxWidth, setResizeMaxWidth] = useState<number>(1200); // pixels
  const [bulkFilter, setBulkFilter] = useState<'none' | 'grayscale' | 'sepia'>('none');

  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [zipUrl, setZipUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      // Clean up previews
      files.forEach(f => {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      });
      if (zipUrl) URL.revokeObjectURL(zipUrl);
    };
  }, []);

  const handleFilesSelected = (selectedFiles: File[]) => {
    const newItems: BatchFileItem[] = selectedFiles.map((file, idx) => ({
      id: `batch-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      file: file,
      previewUrl: URL.createObjectURL(file),
      status: 'idle'
    }));

    setFiles(prev => [...prev, ...newItems]);
    setZipBlob(null);
    setZipUrl(null);
    setErrorMsg(null);
  };

  const removeFile = (id: string) => {
    const target = files.find(f => f.id === id);
    if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
    setFiles(prev => prev.filter(f => f.id !== id));
    setZipBlob(null);
    setZipUrl(null);
  };

  const clearAll = () => {
    files.forEach(f => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
    if (zipUrl) URL.revokeObjectURL(zipUrl);
    setFiles([]);
    setZipBlob(null);
    setZipUrl(null);
    setIsProcessing(false);
    setProgressPercent(0);
    setErrorMsg(null);
  };

  const processBatch = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgressPercent(0);
    setErrorMsg(null);
    setZipBlob(null);
    setZipUrl(null);

    // Initial status update
    setFiles(prev => prev.map(f => ({ ...f, status: 'processing', errorMessage: undefined, processedBlob: undefined })));

    try {
      const zip = new JSZip();
      let completedCount = 0;

      for (let i = 0; i < files.length; i++) {
        const item = files[i];
        
        try {
          const processed = await processSingleBatchItem(item);
          
          // Generate output filename
          const extension = outputFormat === 'jpeg' ? 'jpg' : outputFormat;
          const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
          const outName = `${baseName}_processed.${extension}`;

          zip.file(outName, processed);

          setFiles(prev => prev.map(f => f.id === item.id ? { 
            ...f, 
            status: 'completed', 
            processedBlob: processed,
            outputName: outName
          } : f));

        } catch (itemErr: any) {
          console.error(`Error processing batch file ${item.name}`, itemErr);
          setFiles(prev => prev.map(f => f.id === item.id ? { 
            ...f, 
            status: 'error', 
            errorMessage: itemErr?.message || 'فشل معالجة الصورة' 
          } : f));
        }

        completedCount++;
        setProgressPercent(Math.round((completedCount / files.length) * 100));
      }

      // Generate the final zip file
      const countSuccess = files.filter(f => f.status === 'completed' || f.id).length; // we count progress
      
      const zipContentBlob = await zip.generateAsync({ type: 'blob' });
      const mainZipUrl = URL.createObjectURL(zipContentBlob);
      
      setZipBlob(zipContentBlob);
      setZipUrl(mainZipUrl);

      // Record in History List
      onAddHistoryItem({
        action: `معالجة دفعة صور (${files.length} صورة)`,
        fileName: `batch_images_${files.length}.zip`,
        originalSize: files.reduce((acc, f) => acc + f.size, 0),
        processedSize: zipContentBlob.size,
        type: 'image'
      }, zipContentBlob);

    } catch (err: any) {
      console.error('Batch ZIP creation failed', err);
      setErrorMsg(`حدث خطأ أثناء جمع وضغط ملفات الصور: ${err?.message || 'حدث خطأ غير معروف'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const processSingleBatchItem = (item: BatchFileItem): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Apply bulk resize limits
        if (bulkResizeType === 'scale') {
          const ratio = resizeScale / 100;
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        } else if (bulkResizeType === 'maxWidth' && width > resizeMaxWidth) {
          const scale = resizeMaxWidth / width;
          width = resizeMaxWidth;
          height = Math.round(height * scale);
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas setup failed'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Apply filters in bulk if selected
        if (bulkFilter !== 'none') {
          const imgData = ctx.getImageData(0, 0, width, height);
          const data = imgData.data;

          for (let i = 0; i < data.length; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];

            if (bulkFilter === 'grayscale') {
              const gray = 0.299 * r + 0.587 * g + 0.114 * b;
              data[i] = gray; data[i + 1] = gray; data[i + 2] = gray;
            } else if (bulkFilter === 'sepia') {
              data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
              data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
              data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
            }
          }
          ctx.putImageData(imgData, 0, 0);
        }

        // Export to Blob
        let mime = 'image/jpeg';
        if (outputFormat === 'png') mime = 'image/png';
        else if (outputFormat === 'webp') mime = 'image/webp';

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to generate image blob'));
          }
        }, mime, 0.88);
      };

      img.onerror = () => reject(new Error('Failed to render source loaded image'));
      img.src = item.previewUrl;
    });
  };

  const triggerZipDownload = () => {
    if (!zipUrl) return;
    const link = document.createElement('a');
    link.href = zipUrl;
    link.download = `برو_ميديا_صور_دفعة_${files.length}.zip`;
    link.click();
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-purple-50 shadow-sm space-y-6">
      <div className="flex items-center gap-3 border-b border-purple-50 pb-4">
        <div className="bg-purple-100 p-2.5 rounded-2xl text-purple-700">
          <Files className="w-6 h-6 text-purple-750" />
        </div>
        <div>
          <h2 className="font-extrabold text-xl text-purple-950">المعالجة الجماعية للصور (Batch Processing)</h2>
          <p className="text-xs text-gray-400 mt-1">وفر الوقت واصنع التعديلات، المقاسات، والصيغ على عشرات الصور بسرعة فائقة وحملها بضغطة زر كملف ZIP</p>
        </div>
      </div>

      <UploadZone
        onFilesSelected={handleFilesSelected}
        accept="image/*"
        multiple={true}
        title="اسحب مجموعة صورك هنا لبدء دمج ومعالجة الدفعة"
        subtitle="يمكنك رفع مئات الملفات وسيتم معالجتها بالكامل محلياً وبالمجان"
      />

      {files.length > 0 && (
        <div className="space-y-6">
          
          {/* Main Workspace Frame Info banner */}
          <div className="flex flex-wrap items-center justify-between bg-slate-50 p-4 rounded-2xl border border-gray-100 gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-700">
                إجمالي الملفات المنتقاة للتعديل: <strong className="text-purple-700 font-mono text-base">{files.length}</strong>
              </span>
              <span className="text-xs bg-slate-200 text-slate-700 py-1 px-2.5 rounded-lg font-bold font-mono">
                {formatBytes(files.reduce((acc, f) => acc + f.size, 0))}
              </span>
            </div>

            <button
              onClick={clearAll}
              disabled={isProcessing}
              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-extrabold transition-colors disabled:opacity-40 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>حذف وتفريغ السلة بالكامل</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Control Column settings parameters */}
            <div className="lg:col-span-4 space-y-5 bg-purple-50/40 p-5 rounded-3xl border border-purple-100/50 max-h-[600px] overflow-y-auto">
              <h3 className="font-bold text-sm text-purple-950 border-b border-purple-150 pb-2">خيارات المعالجة المجمعة</h3>

              {/* Convert format option */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-purple-950 block">صيغة المخرجات الموحدة:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['jpeg', 'png', 'webp'] as const).map((format) => (
                    <button
                      key={format}
                      onClick={() => {
                        setOutputFormat(format);
                        setZipUrl(null);
                        setZipBlob(null);
                      }}
                      className={`py-2 px-1 rounded-xl text-xs font-extrabold border transition-all cursor-pointer uppercase ${
                        outputFormat === format 
                          ? 'bg-purple-600 text-white border-purple-600 shadow-md' 
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-slate-50'
                      }`}
                    >
                      {format === 'jpeg' ? 'JPG' : format}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bulk resize option */}
              <div className="space-y-3 pt-3 border-t border-purple-150/40">
                <label className="text-xs font-bold text-purple-950 block">تعديل المقاس العام بالدفعة:</label>
                <div className="space-y-2.5">
                  <select
                    value={bulkResizeType}
                    onChange={(e: any) => {
                      setBulkResizeType(e.target.value);
                      setZipUrl(null);
                      setZipBlob(null);
                    }}
                    className="w-full bg-white border border-gray-200 rounded-xl py-2 px-3 text-xs focus:ring-1 focus:ring-purple-400"
                  >
                    <option value="none">بدون تغيير مقاسات (الدقة الأصلية)</option>
                    <option value="scale">تقليص بنسبة مئوية مخصصة (%)</option>
                    <option value="maxWidth">تحديد الحد الأقصى للعرض (بالبكسل)</option>
                  </select>

                  {bulkResizeType === 'scale' && (
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-bold">نسبة التصغير:</span>
                        <span className="font-mono text-purple-700 font-bold">{resizeScale}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={resizeScale}
                        onChange={(e) => {
                          setResizeScale(parseInt(e.target.value));
                          setZipUrl(null);
                          setZipBlob(null);
                        }}
                        className="w-full accent-purple-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                      />
                    </div>
                  )}

                  {bulkResizeType === 'maxWidth' && (
                    <div className="space-y-1 bg-white p-3 rounded-xl border border-purple-100">
                      <span className="text-[11px] text-gray-500 font-bold block mb-1">الحد الأقصى لعرض الصورة (pX):</span>
                      <input
                        type="number"
                        value={resizeMaxWidth}
                        onChange={(e) => {
                          setResizeMaxWidth(parseInt(e.target.value) || 800);
                          setZipUrl(null);
                          setZipBlob(null);
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-xs font-mono font-bold"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Bulk Quick filter */}
              <div className="space-y-2 pt-3 border-t border-purple-150/40">
                <label className="text-xs font-bold text-purple-950 block">تطبيق فلتر ألوان موحد:</label>
                <select
                  value={bulkFilter}
                  onChange={(e: any) => {
                    setBulkFilter(e.target.value);
                    setZipUrl(null);
                    setZipBlob(null);
                  }}
                  className="w-full bg-white border border-gray-200 rounded-xl py-2 px-3 text-xs focus:ring-1 focus:ring-purple-400"
                >
                  <option value="none">بدون تصفية ألوان (طبيعي)</option>
                  <option value="grayscale">أبيض وأسود (Grayscale)</option>
                  <option value="sepia">عتيق دافئ (Sepia)</option>
                </select>
              </div>

              {/* Primary execution button or ZIP trigger */}
              {!zipUrl ? (
                <button
                  onClick={processBatch}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold py-3.5 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 cursor-pointer text-sm"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>جاري المعالجة... {progressPercent}%</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>معالجة وتضمين كافة الصور</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-2 pt-1">
                  <button
                    onClick={triggerZipDownload}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3.5 px-6 rounded-xl shadow-md transition-all cursor-pointer text-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>تحميل الأرشيف ZIP</span>
                  </button>
                  <button
                    onClick={() => {
                      setZipUrl(null);
                      setZipBlob(null);
                      setFiles(prev => prev.map(f => ({ ...f, status: 'idle' })));
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs text-purple-700 hover:bg-purple-100 rounded-xl font-bold transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>إجراء تعديل جديد</span>
                  </button>
                </div>
              )}

              <div className="p-3 bg-white rounded-xl text-[10px] text-purple-900 leading-relaxed space-y-1 select-none">
                <p className="font-bold text-purple-950">ملاحظة:</p>
                <p>• الأداة ترسم وتضغط الصور محلياً تماماً، مما يدعم تسريع المعالجة دون التهام باقات الشبكة.</p>
              </div>
            </div>

            {/* Micro-thumbnails Grid list showing statuses */}
            <div className="lg:col-span-8 space-y-4">
              <span className="text-xs font-bold text-gray-500 block select-none">حالة المجلد المفرز:</span>

              {isProcessing && (
                <div className="w-full bg-purple-100 h-3 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${progressPercent}%` }}
                    className="bg-purple-650 h-full rounded-full transition-all duration-350"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-1">
                {files.map((item) => (
                  <div 
                    key={item.id}
                    className="bg-white border border-gray-200 rounded-2xl p-3 flex flex-col justify-between relative space-y-3 shadow-sm hover:border-purple-200 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                        <img src={item.previewUrl} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-700 truncate" title={item.name}>{item.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{formatBytes(item.size)}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-100 pt-2.5">
                      {/* Status label info */}
                      <div>
                        {item.status === 'idle' && (
                          <span className="text-[9px] font-bold text-gray-400 bg-gray-100 py-1 px-2.5 rounded-full">في الانتظار</span>
                        )}
                        {item.status === 'processing' && (
                          <span className="text-[9px] font-bold text-purple-700 bg-purple-50 py-1 px-2.5 rounded-full flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            جاري التحوير...
                          </span>
                        )}
                        {item.status === 'completed' && (
                          <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 py-1 px-2.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            مكتمل بنجاح
                          </span>
                        )}
                        {item.status === 'error' && (
                          <span className="text-[9px] font-bold text-red-650 bg-red-50 py-1 px-2.5 rounded-full" title={item.errorMessage}>
                            فشل التحجيم
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => removeFile(item.id)}
                        disabled={isProcessing}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-30 cursor-pointer"
                        title="استبعاد هذه الصورة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                ))}
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

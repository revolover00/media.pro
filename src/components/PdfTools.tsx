import React, { useState, useEffect } from 'react';
import { 
  Files, 
  Scissors, 
  Image as ImageIcon, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Download, 
  Sparkles, 
  AlertCircle,
  FileCheck2,
  ListOrdered,
  FileText,
  CheckCircle2,
  FolderArchive
} from 'lucide-react';
import { UploadZone } from './UploadZone';
import { mergePDFs, splitPDF, getPdfTotalPages, renderPdfPageToImage } from '../utils/pdfUtils';
import { formatBytes } from '../utils/imageUtils';
import { HistoryItem } from '../types';
import JSZip from 'jszip';

interface PdfToolsProps {
  toolType: 'merge' | 'split' | 'to-img';
  onAddHistoryItem: (item: Omit<HistoryItem, 'id' | 'timestamp' | 'downloadUrl'>, blob: Blob) => string;
  lang?: 'ar' | 'en';
}

export const PdfTools: React.FC<PdfToolsProps> = ({ toolType, onAddHistoryItem, lang = "ar" }) => {
  const isAr = lang === "ar";
  // MERGE STATES
  const [mergeFiles, setMergeFiles] = useState<File[]>([]);
  const [mergePagesInfo, setMergePagesInfo] = useState<Record<string, number>>({});

  // SPLIT / TO-IMG STATES
  const [singleFile, setSingleFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [pageRange, setPageRange] = useState<string>('1');

  // RENDER TO IMAGES STATES
  const [renderScale, setRenderScale] = useState<number>(1.5);
  const [renderedImages, setRenderedImages] = useState<Array<{ pageNum: number; dataUrl: string; blob: Blob }>>([]);
  const [renderProgress, setRenderProgress] = useState<number>(0); // 0 to 100

  // COMMON STATES
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [resultPdf, setResultPdf] = useState<{ blob: Blob; url: string; size: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Clean object urls on unmount
  useEffect(() => {
    return () => {
      if (resultPdf?.url) {
        URL.revokeObjectURL(resultPdf.url);
      }
    };
  }, [resultPdf]);

  // Load single file details
  useEffect(() => {
    if (singleFile) {
      getPdfTotalPages(singleFile)
        .then((pages) => {
          setTotalPages(pages);
          if (toolType === 'split') {
            setPageRange(pages > 1 ? `1-${Math.min(3, pages)}` : '1');
          }
        })
        .catch((err) => {
          console.error(err);
          setErrorMsg('فشل تحليل ملف PDF لقراءة عدد الصفحات.');
        });
    }
  }, [singleFile, toolType]);

  // Load pages count for merge list files to enrich display
  const fetchMergePagesInfo = async (files: File[]) => {
    const updatedInfo = { ...mergePagesInfo };
    for (const f of files) {
      if (!updatedInfo[f.name]) {
        try {
          const p = await getPdfTotalPages(f);
          updatedInfo[f.name] = p;
        } catch {
          updatedInfo[f.name] = 1; // fallback
        }
      }
    }
    setMergePagesInfo(updatedInfo);
  };

  const handleMergeFilesAdded = (newFiles: File[]) => {
    const updated = [...mergeFiles, ...newFiles];
    setMergeFiles(updated);
    setErrorMsg(null);
    setResultPdf(null);
    fetchMergePagesInfo(newFiles);
  };

  const handleSingleFileAdded = (files: File[]) => {
    if (files.length > 0) {
      setSingleFile(files[0]);
      setErrorMsg(null);
      setResultPdf(null);
      setRenderedImages([]);
      setRenderProgress(0);
    }
  };

  const removeMergeFile = (index: number) => {
    const updated = [...mergeFiles];
    updated.splice(index, 1);
    setMergeFiles(updated);
    setResultPdf(null);
  };

  const moveMergeFile = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= mergeFiles.length) return;

    const updated = [...mergeFiles];
    const item = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = item;
    setMergeFiles(updated);
    setResultPdf(null);
  };

  const handleReset = () => {
    setMergeFiles([]);
    setSingleFile(null);
    setTotalPages(0);
    setRenderedImages([]);
    setRenderProgress(0);
    setResultPdf(null);
    setErrorMsg(null);
  };

  const handleProcessPdf = async () => {
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      if (toolType === 'merge') {
        if (mergeFiles.length < 2) {
          throw new Error('الرجاء رفع ملفين PDF على الأكثر للبدء في الدمج.');
        }

        const res = await mergePDFs(mergeFiles);
        setResultPdf({
          blob: res.blob,
          url: res.url,
          size: res.blob.size,
        });

        onAddHistoryItem({
          action: `دمج ${mergeFiles.length} ملفات من فئة PDF`,
          fileName: `دمج_مستندات_${mergeFiles.length}_ملفات.pdf`,
          originalSize: mergeFiles.reduce((sum, f) => sum + f.size, 0),
          processedSize: res.blob.size,
          type: 'pdf'
        }, res.blob);

      } else if (toolType === 'split') {
        if (!singleFile) return;

        const res = await splitPDF(singleFile, pageRange);
        setResultPdf({
          blob: res.blob,
          url: res.url,
          size: res.blob.size,
        });

        onAddHistoryItem({
          action: `تقسيم PDF واستخراج صفحات (${pageRange})`,
          fileName: `${singleFile.name.replace('.pdf', '')}_مقسّم.pdf`,
          originalSize: singleFile.size,
          processedSize: res.blob.size,
          type: 'pdf'
        }, res.blob);

      } else if (toolType === 'to-img') {
        if (!singleFile) return;

        setRenderedImages([]);
        setRenderProgress(1);

        const imgs: Array<{ pageNum: number; dataUrl: string; blob: Blob }> = [];
        
        for (let i = 1; i <= totalPages; i++) {
          setRenderProgress(Math.round(((i - 0.5) / totalPages) * 100));
          const res = await renderPdfPageToImage(singleFile, i, renderScale);
          imgs.push({
            pageNum: i,
            dataUrl: res.dataUrl,
            blob: res.blob,
          });
          setRenderProgress(Math.round((i / totalPages) * 100));
        }

        setRenderedImages(imgs);

        onAddHistoryItem({
          action: `استخراج ${totalPages} صفحات PDF كصور JPG`,
          fileName: `${singleFile.name.replace('.pdf', '')}_images_folder`,
          originalSize: singleFile.size,
          processedSize: imgs.reduce((sum, item) => sum + item.blob.size, 0),
          type: 'image'
        }, imgs[0].blob); // use first page blob as anchor
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'حدث خطأ تالي أثناء معالجة ملف PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadAllImagesAsZip = async () => {
    if (renderedImages.length === 0 || !singleFile) return;

    setIsProcessing(true);
    try {
      const zip = new JSZip();
      const baseName = singleFile.name.replace('.pdf', '');

      renderedImages.forEach((img) => {
        zip.file(`${baseName}_صفحة_${img.pageNum}.jpg`, img.blob);
      });

      const zipContent = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipContent);

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${baseName}_جميع_الصفحات_صور.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 10000);
    } catch (e) {
      console.error(e);
      setErrorMsg('فشل تجميع الصور في ملف أرشيف مضغوط ZIP.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadSingleImage = (img: { pageNum: number; url: string; blob: Blob }) => {
    if (!singleFile) return;
    const baseName = singleFile.name.replace('.pdf', '');
    const link = document.createElement('a');
    link.href = img.url;
    link.download = `${baseName}_صفحة_${img.pageNum}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPdfResult = () => {
    if (!resultPdf) return;
    const name = toolType === 'merge' 
      ? 'مستند_مدمج_من_برو_ميديا.pdf' 
      : `${singleFile?.name.replace('.pdf', '')}_مستخرج_مقسّم.pdf`;

    const link = document.createElement('a');
    link.href = resultPdf.url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Intro Alert */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-purple-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-purple-950">
            {toolType === 'merge' && (isAr ? '📚 دمج ملفات PDF المتعددة' : '📚 Merge Multiple PDF Files')}
            {toolType === 'split' && (isAr ? '✂️ تقسيم ملف PDF وتنزيل الأوراق' : '✂️ Split PDF and Extract Pages')}
            {toolType === 'to-img' && (isAr ? '🖼️ تحويل صفحات PDF إلى صور JPG' : '🖼️ Convert PDF Pages to JPG Images')}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {toolType === 'merge' && 'قم بتحميل ملفين أو أكثر من وثائق PDF، وأعد ترتيب ظهورهم، ثم ادمجهم في ملف واحد.'}
            {toolType === 'split' && 'استخرج فصولاً أو صفحات معينة من ملف PDF ضخم وحافظ على الحجم والتنسيقات.'}
            {toolType === 'to-img' && 'حول كل صفحة من ملف PDF إلى صور مستقلة عالية الجودة JPG مع تنزيل أرشيف مضغوط ZIP بضغطة واحدة.'}
          </p>
        </div>
        {(mergeFiles.length > 0 || singleFile) && (
          <button 
            onClick={handleReset}
            className="flex items-center gap-1.5 text-red-650 hover:text-red-700 font-bold text-xs bg-red-50 hover:bg-red-100 p-2.5 rounded-xl transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>تنظيف وإعادة البدء</span>
          </button>
        )}
      </div>

      {/* MERGE VIEW FLOW */}
      {toolType === 'merge' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-purple-100 space-y-5">
              <div className="flex items-center gap-2 border-b border-purple-50 pb-3">
                <ListOrdered className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-gray-800">قائمة المستندات المضافة ({mergeFiles.length})</h3>
              </div>

              {mergeFiles.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs">لا تتوفر مستندات حالياً. أضف الملفات من اليسار للبدء.</div>
              ) : (
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {mergeFiles.map((f, idx) => (
                    <div 
                      key={f.name + idx} 
                      className="flex items-center justify-between p-3.5 bg-gray-50 hover:bg-purple-50/20 rounded-2xl border border-gray-150 transition-all text-xs"
                    >
                      <div className="flex items-center gap-2.5 truncate max-w-[200px]">
                        <FileText className="w-5 h-5 text-purple-600 shrink-0" />
                        <div className="truncate">
                          <p className="font-semibold text-gray-800 truncate" title={f.name}>{f.name}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {formatBytes(f.size)} • {mergePagesInfo[f.name] || '...'} صفحة
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveMergeFile(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1.5 text-gray-500 hover:text-purple-600 bg-white rounded-lg border border-gray-200 disabled:opacity-30 cursor-pointer"
                          title="نقل لأعلى"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveMergeFile(idx, 'down')}
                          disabled={idx === mergeFiles.length - 1}
                          className="p-1.5 text-gray-500 hover:text-purple-600 bg-white rounded-lg border border-gray-200 disabled:opacity-30 cursor-pointer"
                          title="نقل لأسفل"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => removeMergeFile(idx)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                          title="حذف من القائمة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {mergeFiles.length >= 2 && (
                <button
                  id="process-pdf-btn"
                  onClick={handleProcessPdf}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg cursor-pointer"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>جاري الدمج والتجميع...</span>
                    </div>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-purple-200" />
                      <span>دمج وتصدير ملف PDF واحد</span>
                    </>
                  )}
                </button>
              )}

              {errorMsg && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-650 p-3 rounded-xl text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <UploadZone
              onFilesSelected={handleMergeFilesAdded}
              accept="application/pdf"
              title="اسحب ملفات PDF الإضافية هنا لدمجها"
              subtitle="يمكنك إضافة ملفات متعددة وتعديل ترتيبها على اليمين بالترتيب المناسب"
              multiple={true}
              maxSizeMB={50}
            />

            {resultPdf && (
              <div className="bg-purple-900 text-white p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                <div>
                  <h4 className="font-bold text-sm">{isAr ? 'تم دمج ملفاتك بنجاح باهر!' : 'Your files have been successfully merged!'}</h4>
                  <p className="text-xs text-purple-200 mt-1">{isAr ? 'الحجم الإجمالي للملف الناتج:' : 'Total Output File Size:'} {formatBytes(resultPdf.size)}</p>
                </div>
                <button
                  id="download-merged-pdf-btn"
                  onClick={downloadPdfResult}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold px-6 py-3 rounded-2xl shadow-lg cursor-pointer text-sm"
                >
                  <Download className="w-5 h-5" />
                  <span>تحميل ملف PDF المدمج</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SPLIT & PDF-TO-IMAGE VIEW FLOW */}
      {(toolType === 'split' || toolType === 'to-img') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {!singleFile ? (
            <div className="lg:col-span-12">
              <UploadZone
                onFilesSelected={handleSingleFileAdded}
                accept="application/pdf"
                title="اسحب ملف PDF الخاص بك هنا للبدء بالتقسيم أو استخراج الصور"
                subtitle="ندعم الملفات بمقاسات عالية جداً حتى 50 ميجابايت بأمان خصوصية تام"
                maxSizeMB={50}
              />
            </div>
          ) : (
            <>
              {/* Settings side - 5 columns */}
              <div className="lg:col-span-5 bg-white p-6 rounded-3xl shadow-sm border border-purple-100 space-y-6">
                <div className="flex items-center gap-2 border-b border-purple-50 pb-3">
                  <FileText className="w-5 h-5 text-purple-600" />
                  <h3 className="font-bold text-gray-800">بيانات المستند والمقاس</h3>
                </div>

                <div className="bg-gray-50/50 p-4 rounded-2xl space-y-2 border border-gray-100 text-xs text-gray-600">
                  <div className="flex justify-between font-bold">
                    <span>اسم الملف المرفوع:</span>
                    <span className="text-gray-800 truncate max-w-[180px]">{singleFile.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>حجم المستند:</span>
                    <span className="text-gray-800 font-mono font-semibold">{formatBytes(singleFile.size)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>إجمالي عدد الصفحات:</span>
                    <span className="text-purple-700 font-extrabold font-mono">{totalPages || '...'} صفحات</span>
                  </div>
                </div>

                {toolType === 'split' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 block">الصفحات المراد استخراجها</label>
                      <input
                        id="split-range-input"
                        type="text"
                        value={pageRange}
                        onChange={(e) => setPageRange(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-250 focus:ring-2 focus:ring-purple-400 focus:bg-white rounded-xl py-2.5 px-3.5 text-sm font-semibold text-gray-800"
                        placeholder="أرقام الصفحات مثل: 1-3, 5, 8-10"
                      />
                    </div>
                    <div className="bg-purple-50/40 p-3.5 rounded-2xl text-[10px] text-purple-800 border border-purple-100">
                      <strong>💡 تلميح:</strong> يمكنك تمثيل أرقام الفصول أو الصفحات إما بالنطاقات المتقاطعة (مثال: <code className="font-mono bg-purple-100/50 px-1 rounded text-purple-900">1-4</code>) أو صفحة فردية ومفصولة بالفاصلة الانكليزية (مثال: <code className="font-mono bg-purple-100/50 px-1 rounded text-purple-900">2, 5, 7</code>).
                    </div>
                  </div>
                )}

                {toolType === 'to-img' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-600 block">دقة الصورة المستخرجَة (المقاييس)</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { val: 1.0, label: 'عادية (1x)' },
                          { val: 1.5, label: 'مرتفعة (1.5x)' },
                          { val: 2.5, label: 'فائقة (2.5x)' }
                        ].map((item) => (
                          <button
                            key={item.val}
                            onClick={() => setRenderScale(item.val)}
                            className={`
                              py-2.5 px-2 rounded-xl text-xs font-bold transition-all border
                              ${renderScale === item.val 
                                ? 'bg-purple-600 text-white border-purple-600' 
                                : 'bg-white text-gray-700 border-gray-250 hover:border-purple-300'
                              }
                            `}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400">الخيارات العالية تولد صور بكسلية أكثر حدة ووضوح تهم المصممين والطباعة.</p>
                  </div>
                )}

                <button
                  id={`process-pdf-btn-${toolType}`}
                  onClick={handleProcessPdf}
                  disabled={isProcessing || !totalPages}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg cursor-pointer"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>
                        {toolType === 'to-img' 
                          ? `جاري تحويل ومعالجة الصفحات (${renderProgress}%)` 
                          : 'جاري استخراج الأوراق...'
                        }
                      </span>
                    </div>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-purple-200" />
                      <span>{toolType === 'to-img' ? 'بدء تحويل جميع الصفحات لصور' : 'تقسيم واستخراج الصفحات المستهدفة'}</span>
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

              {/* Preview files details - 7 columns */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* SPLIT FILE RESULTS PREVIEW */}
                {toolType === 'split' && (
                  <div className="bg-white p-5 rounded-3xl shadow-sm border border-purple-100 flex flex-col justify-between min-h-[250px] relative">
                    {!resultPdf && !isProcessing && (
                      <div className="absolute inset-0 bg-gray-50/50 flex flex-col items-center justify-center text-center p-6 z-10 rounded-3xl">
                        <FileCheck2 className="w-9 h-9 text-slate-400 mb-2" />
                        <h5 className="font-bold text-gray-700 text-sm">أدخل الصفحات أعلاه للمباشرة بالتقسيم</h5>
                      </div>
                    )}

                    {isProcessing && (
                      <div className="absolute inset-0 bg-white/85 flex flex-col items-center justify-center text-center p-6 z-10 rounded-3xl">
                        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-3" />
                        <p className="text-xs text-gray-400">جاري المعالجة محلياً بشكل فائق الأمان والسرعة...</p>
                      </div>
                    )}

                    <div>
                      <h4 className="text-xs font-extrabold text-purple-600 uppercase flex items-center justify-between mb-4">
                        <span>معاينة وخصائص الملف المقسّم</span>
                        {resultPdf && (
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-lg text-[9px] font-bold">
                            النتيجة جاهزة للتنزيل
                          </span>
                        )}
                      </h4>

                      {resultPdf && (
                        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-3">
                          <div className="flex items-center gap-3">
                            <FileText className="w-10 h-10 text-purple-600 shrink-0" />
                            <div>
                              <p className="font-bold text-gray-800 text-sm">{singleFile.name.replace('.pdf', '')}_مقسّم.pdf</p>
                              <p className="text-xs text-gray-500 mt-0.5">الحجم الناتج الجديد: <span className="font-semibold text-purple-700 font-mono">{formatBytes(resultPdf.size)}</span></p>
                            </div>
                          </div>
                          
                          <div className="bg-purple-900 text-white p-4 rounded-xl flex items-center justify-between gap-4 mt-2">
                            <span className="text-xs">الملف جاهز للتحميل الخارجي بضغطة واحدة:</span>
                            <button
                              id="download-split-pdf-btn"
                              onClick={downloadPdfResult}
                              className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs py-2 px-4 rounded-lg cursor-pointer transition-all"
                            >
                              <Download className="w-4 h-4" />
                              <span>تنزيل الآن</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* PDF TO IMAGE RESULTS PREVIEW */}
                {toolType === 'to-img' && (
                  <div className="bg-white p-5 rounded-3xl shadow-sm border border-purple-100 min-h-[350px] relative">
                    {renderedImages.length === 0 && !isProcessing && (
                      <div className="absolute inset-0 bg-gray-50/50 flex flex-col items-center justify-center text-center p-6 z-10 rounded-3xl">
                        <ImageIcon className="w-9 h-9 text-slate-400 mb-2" />
                        <h5 className="font-bold text-gray-700 text-sm">لم يتم توليد أي صفحات بعد</h5>
                        <p className="text-xs text-gray-400 mt-1">اضغط على دقة التحويل في الجانب الأيمن ثم زر التوليد لتصدير صفحات PDF صور مستقلة.</p>
                      </div>
                    )}

                    {isProcessing && renderedImages.length === 0 && (
                      <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center text-center p-6 z-10 rounded-3xl">
                        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4" />
                        <h5 className="font-bold text-purple-900 text-sm">جاري جلب صفحات PDF ومعالجتها كصور</h5>
                        <div className="w-48 bg-gray-100 h-1.5 rounded-full overflow-hidden mt-3 max-w-full">
                          <div className="bg-purple-600 h-full transition-all duration-150" style={{ width: `${renderProgress}%` }} />
                        </div>
                        <p className="text-xs text-purple-600 mt-2 font-bold">{renderProgress}%</p>
                      </div>
                    )}

                    {renderedImages.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-purple-50 pb-3">
                          <h4 className="font-bold text-purple-950 text-sm">الصفحات المستخرجة كصور ({renderedImages.length})</h4>
                          <button
                            id="download-all-zip-btn"
                            onClick={downloadAllImagesAsZip}
                            className="flex items-center gap-1.5 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs py-2 px-4 rounded-xl shadow-md cursor-pointer justify-center"
                          >
                            <FolderArchive className="w-4 h-4 text-purple-200" />
                            <span>تنزيل الكل ملف ZIP مضغوط</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[450px] overflow-y-auto pr-1 py-1">
                          {renderedImages.map((img) => (
                            <div key={img.pageNum} className="group relative bg-gray-50 border border-gray-150 rounded-2xl p-2.5 flex flex-col justify-between align-middle overflow-hidden hover:border-purple-300 transition-all text-center">
                              <div className="aspect-[3/4] relative bg-white border border-gray-100 rounded-xl overflow-hidden flex items-center justify-center mb-2">
                                <img
                                  src={img.dataUrl}
                                  alt={`Page ${img.pageNum}`}
                                  className="max-w-full max-h-full object-contain rounded-lg"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute bottom-1 right-1.5 bg-black/60 text-white font-bold font-mono text-[9px] px-2 py-0.5 rounded-full">
                                  صفحة: {img.pageNum}
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <p className="text-[10px] text-gray-400 font-mono">{formatBytes(img.blob.size)}</p>
                                <button
                                  onClick={() => downloadSingleImage({ pageNum: img.pageNum, url: img.dataUrl, blob: img.blob })}
                                  className="w-full flex items-center justify-center gap-1 bg-white hover:bg-purple-50 text-purple-800 border border-purple-200 hover:border-purple-300 font-bold text-[10px] py-1.5 px-2 rounded-lg cursor-pointer"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>تنزيل JPG</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

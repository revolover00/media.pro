import React, { useState, useEffect } from 'react';
import { 
  FileSearch, 
  Trash2, 
  Copy, 
  Check, 
  Download, 
  RefreshCw, 
  FileText,
  Languages,
  ArrowRight,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { UploadZone } from '../../UploadZone';
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { PDFDocument } from 'pdf-lib';
import { HistoryItem } from '../../../types';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface ImageToSearchablePDFProps {
  lang: 'ar' | 'en';
  onAddHistoryItem: (item: Omit<HistoryItem, 'id' | 'timestamp' | 'downloadUrl'>, blob: Blob) => string;
}

export const ImageToSearchablePDF: React.FC<ImageToSearchablePDFProps> = ({ lang, onAddHistoryItem }) => {
  const isAr = lang === 'ar';
  
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [progressVal, setProgressVal] = useState<number>(0);
  const [ocrLang, setOcrLang] = useState<string>('ara+eng');

  // Previewable extracted text state
  const [textReview, setTextReview] = useState<string>('');
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [downloadName, setDownloadName] = useState<string>('');

  useEffect(() => {
    return () => {
      filePreviews.forEach(URL.revokeObjectURL);
    };
  }, [filePreviews]);

  const handleFilesSelect = (selectedFiles: File[]) => {
    if (selectedFiles.length > 0) {
      setFiles(selectedFiles);
      setFilePreviews(selectedFiles.map(f => URL.createObjectURL(f)));
      setTextReview('');
      setPdfBlob(null);
      setProgressVal(0);
      setProgressStatus('');
    }
  };

  const handleReset = () => {
    setFiles([]);
    setFilePreviews([]);
    setTextReview('');
    setPdfBlob(null);
    setProgressVal(0);
    setProgressStatus('');
  };

  const processToSearchablePDF = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgressVal(0);
    setProgressStatus(isAr ? 'جاري تهيئة بيئة العمل ومحرك PDF...' : 'Initializing PDF environment...');
    setTextReview('');

    try {
      // 1. Create a fresh pdf-lib Document
      const outputPdfDoc = await PDFDocument.create();
      let fullCollectedText = '';
      const totalSteps = files.length;

      // Handle each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Check if file is a PDF
        if (file.type === 'application/pdf') {
          setProgressStatus(isAr ? `جاري معالجة وثيقة PDF المدخلة...` : `Decoding input PDF...`);
          const arrayBuffer = await file.arrayBuffer();
          const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
          const pdf = await loadingTask.promise;
          const numPages = pdf.numPages;

          for (let pNum = 1; pNum <= numPages; pNum++) {
            setProgressStatus(isAr 
              ? `معالجة الصفحة ${pNum} من أصل ${numPages} في ملف PDF...` 
              : `Processing page ${pNum} of ${numPages} loaded...`
            );
            
            const page = await pdf.getPage(pNum);
            const viewport = page.getViewport({ scale: 1.5 }); // Render scale for quality
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({
              canvasContext: context!,
              viewport: viewport
            } as any).promise;

            // OCR on the rendered canvas
            const ocrResult = await Tesseract.recognize(canvas, ocrLang);
            const words = (ocrResult.data as any).words || [];
            fullCollectedText += `--- ${isAr ? 'صفحة' : 'Page'} ${pNum} ---\n` + (ocrResult.data.text || '') + '\n\n';

            // Draw canvas pages as images inside output PDF
            const pngUrl = canvas.toDataURL('image/png');
            const embeddedImg = await outputPdfDoc.embedPng(pngUrl);
            const pdfPage = outputPdfDoc.addPage([canvas.width, canvas.height]);
            pdfPage.drawImage(embeddedImg, { x: 0, y: 0, width: canvas.width, height: canvas.height });

            // Layer invisible text for indexing support
            words.forEach(word => {
              const x = word.bbox.x0;
              const y = canvas.height - word.bbox.y1; // Adjust coordinate system
              const textHeight = word.bbox.y1 - word.bbox.y0;

              // drawText with 0 opacity triggers selection but is visually hidden
              pdfPage.drawText(word.text, {
                x: x,
                y: y,
                size: textHeight * 0.85 || 10,
                opacity: 0
              });
            });

            // Update percentage progress
            const overallProgressMultiplier = ((pNum / numPages) * (1 / totalSteps)) * 100;
            setProgressVal(Math.round(overallProgressMultiplier));
          }
        } 
        // Or it is a standard image (PNG, JPEG)
        else {
          setProgressStatus(isAr ? `جاري قراءة الصفحة ${i + 1} كصورة...` : `Reading image page ${i + 1}...`);
          
          // Render image onto a high-res canvas
          const img = new Image();
          img.src = filePreviews[i];
          await new Promise((resolve) => {
            img.onload = resolve;
          });

          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          context!.drawImage(img, 0, 0);

          // OCR on image canvas
          const ocrResult = await Tesseract.recognize(canvas, ocrLang, {
            logger: (m) => {
              if (m && m.status === 'recognizing text') {
                setProgressStatus(isAr 
                  ? `تحليل مدخلات الصورة ${i + 1} (${Math.round(m.progress * 100)}%)...` 
                  : `Scanning image ${i + 1} words (${Math.round(m.progress * 100)}%)...`
                );
              }
            }
          });
          
          const words = (ocrResult.data as any).words || [];
          fullCollectedText += `--- ${isAr ? 'صورة' : 'Image'} ${i + 1} ---\n` + (ocrResult.data.text || '') + '\n\n';

          // Embed Image inside PDF page
          const pngUrl = canvas.toDataURL('image/png');
          const embeddedImg = await outputPdfDoc.embedPng(pngUrl);
          const pdfPage = outputPdfDoc.addPage([canvas.width, canvas.height]);
          pdfPage.drawImage(embeddedImg, { x: 0, y: 0, width: canvas.width, height: canvas.height });

          // Draw selectable texts
          words.forEach(word => {
            const x = word.bbox.x0;
            const y = canvas.height - word.bbox.y1;
            const textHeight = word.bbox.y1 - word.bbox.y0;

            pdfPage.drawText(word.text, {
              x: x,
              y: y,
              size: textHeight * 0.8 || 12,
              opacity: 0
            });
          });

          const overallPercent = ((i + 1) / totalSteps) * 100;
          setProgressVal(Math.round(overallPercent));
        }
      }

      // Complete operations & build final storage file
      const finalPdfBytes = await outputPdfDoc.save();
      const finalBlob = new Blob([finalPdfBytes], { type: 'application/pdf' });
      
      setPdfBlob(finalBlob);
      setTextReview(fullCollectedText);
      
      const outName = `${files[0].name.split('.')[0]}_searchable.pdf`;
      setDownloadName(outName);

      // Trigger History Log
      onAddHistoryItem({
        action: isAr ? 'تحويل لـ PDF قابل للبحث' : 'Convert Searchable PDF',
        fileName: outName,
        originalSize: files.reduce((acc, f) => acc + f.size, 0),
        processedSize: finalBlob.size,
        type: 'pdf'
      }, finalBlob);

      setProgressStatus(isAr ? 'اكتمل إنشاء ملف PDF والطبقة النصية!' : 'Searchable layer initialized!');
      setProgressVal(100);

    } catch (err: any) {
      console.error(err);
      setProgressStatus(isAr ? `خطأ أثناء المعالجة: ${err.message}` : `Error building OCR PDF: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!pdfBlob) return;
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = downloadName || 'searchable_document.pdf';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6" id="searchable-pdf-toolkit">
      {/* Title */}
      <div className="text-center mb-6">
        <div className="inline-flex p-3 bg-cyan-100 text-cyan-600 rounded-full mb-3 shadow-sm">
          <FileSearch className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          {isAr ? 'تحويل الوثائق إلى PDF قابل للبحث والتحديد' : 'Convert to Searchable PDF'}
        </h1>
        <p className="mt-2 text-gray-650 max-w-xl mx-auto text-sm sm:text-base">
          {isAr 
            ? 'ارفع ملفات صور ممسوحة ضوئياً أو مستندات PDF غير محددة. سيقوم التطبيق بمسحها ضوئياً وبناء ملف PDF ذكي مع خيار تحديد الكلمات والبحث عنها.' 
            : 'Turn scanned documents or flat snapshot images into highly searchable, copy-paste-enabled PDF files with absolute offline privacy.'}
        </p>
      </div>

      {!files.length ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {isAr ? 'لغة التعرف على النصوص:' : 'OCR Text Language:'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => setOcrLang('ara')}
                className={`py-2 px-3 text-xs sm:text-sm font-medium rounded-xl border transition ${
                  ocrLang === 'ara' ? 'bg-cyan-600 border-cyan-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {isAr ? 'العربية' : 'Arabic'}
              </button>
              <button 
                onClick={() => setOcrLang('eng')}
                className={`py-2 px-3 text-xs sm:text-sm font-medium rounded-xl border transition ${
                  ocrLang === 'eng' ? 'bg-cyan-600 border-cyan-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {isAr ? 'الإنجليزية' : 'English'}
              </button>
              <button 
                onClick={() => setOcrLang('ara+eng')}
                className={`py-2 px-3 text-xs sm:text-sm font-medium rounded-xl border transition ${
                  ocrLang === 'ara+eng' ? 'bg-cyan-600 border-cyan-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {isAr ? 'مزدوج (عربي+إنجليزي)' : 'Mixed (Ar+En)'}
              </button>
            </div>
          </div>
          <UploadZone 
            onFilesSelected={handleFilesSelect} 
            accept="image/*, application/pdf"
            multiple={true}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* File Lists & Statuses */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-gray-900 text-sm">
                  {isAr ? `الملفات المحددة (${files.length})` : `Selected Files (${files.length})`}
                </span>
                <button 
                  onClick={handleReset} 
                  disabled={isProcessing}
                  className="text-red-500 hover:text-red-600 text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {isAr ? 'حذف الكل' : 'Remove All'}
                </button>
              </div>
              
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {files.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl border border-gray-100">
                    <FileText className="w-5 h-5 text-cyan-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate">{file.name}</p>
                      <p className="text-[10px] text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stepper Process Trigger */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              {isProcessing ? (
                <div className="p-3 bg-cyan-50 border border-cyan-100 rounded-xl mb-3">
                  <div className="flex justify-between text-xs text-cyan-800 font-semibold mb-1">
                    <span>{progressStatus}</span>
                    <span>{progressVal}%</span>
                  </div>
                  <div className="w-full bg-cyan-200 rounded-full h-1.5">
                    <div 
                      className="bg-cyan-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${progressVal}%` }}
                    ></div>
                  </div>
                </div>
              ) : !pdfBlob ? (
                <button
                  onClick={processToSearchablePDF}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>{isAr ? 'بدء تحويل الملف وبناء PDF قابل للبحث' : 'Build Searchable PDF layer'}</span>
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={handleDownload}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
                  >
                    <Download className="w-5 h-5" />
                    <span>{isAr ? 'تحميل ملف PDF النهائي' : 'Download searchable PDF'}</span>
                  </button>
                  <button
                    onClick={handleReset}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <span>{isAr ? 'البدء بملف جديد' : 'Convert Another'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Text layer preview & accessibility review */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 flex flex-col justify-between">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm sm:text-base">
              <FileText className="w-5 h-5 text-cyan-600" />
              <span>{isAr ? 'معاينة وفحص النص المكتشف' : 'Extracted Text Layer Preview'}</span>
            </h3>

            {textReview ? (
              <div className="flex-1 flex flex-col justify-between">
                <textarea
                  readOnly
                  value={textReview}
                  className="w-full flex-1 min-h-[160px] text-xs sm:text-sm font-mono text-gray-700 p-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-cyan-500 mb-3"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(textReview);
                    alert(isAr ? 'تم نسخ النص المكتشف بالكامل للذاكرة!' : 'Copied full text layer!');
                  }}
                  className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isAr ? 'نسخ النص المستخرج بالكامل' : 'Copy Text layer'}</span>
                </button>
              </div>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center py-12 text-center text-gray-400 text-sm">
                <FileSearch className="w-12 h-12 mb-3 opacity-30 text-cyan-400" />
                <p className="max-w-xs">
                  {isAr 
                    ? 'سيظهر هنا تفريغ النص الخاص بالمستند والصفحة فور اكتمال عملية المعالجة.' 
                    : 'The plain text dump extracted page-by-page will be visualized here once built.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

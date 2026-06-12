import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Trash2, 
  RotateCw, 
  ArrowLeft, 
  ArrowRight, 
  Download, 
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  FileText,
  Type
} from 'lucide-react';
import { UploadZone } from './UploadZone';
import { HistoryItem } from '../types';
import { formatBytes } from '../utils/imageUtils';
import { renderPdfPageToImage } from '../utils/pdfUtils';
// @ts-ignore
import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib';

interface EditPageItem {
  id: string;
  originalPageNum: number;
  thumbnailUrl: string;
  rotation: number; // 0, 90, 180, 270
}

interface PdfEditProps {
  onAddHistoryItem: (item: Omit<HistoryItem, 'id' | 'timestamp' | 'downloadUrl'>, blob: Blob) => string;
}

export const PdfEdit: React.FC<PdfEditProps> = ({ onAddHistoryItem }) => {
  const [file, setFile] = useState<File | null>(null);
  
  // Page items state
  const [pages, setPages] = useState<EditPageItem[]>([]);
  
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [progressVal, setProgressVal] = useState<number>(0);
  
  // Optional watermark text
  const [watermarkEnabled, setWatermarkEnabled] = useState<boolean>(false);
  const [watermarkText, setWatermarkText] = useState<string>('CONFIDENTIAL');
  const [watermarkColor, setWatermarkColor] = useState<string>('#9333ea'); // purple-600
  const [watermarkSize, setWatermarkSize] = useState<number>(30);

  const [resultPdf, setResultPdf] = useState<{ blob: Blob; url: string; size: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (resultPdf?.url) URL.revokeObjectURL(resultPdf.url);
    };
  }, [resultPdf]);

  const handleFileDrop = async (files: File[]) => {
    if (files.length === 0) return;

    const selectedFile = files[0];
    setFile(selectedFile);
    setPages([]);
    setResultPdf(null);
    setErrorMsg(null);
    setIsProcessing(true);
    setProgressVal(0);
    setProgressStatus('جاري فحص وتفكيك صفحات المستند PDF...');

    try {
      // Setup PDF document data to read total pages
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const totalPages = pdfDoc.getPageCount();

      if (totalPages === 0) {
        throw new Error('الملف فارغ أو تالف.');
      }

      const generatedPages: EditPageItem[] = [];

      // Render thumbnails for each page at a very low scale to maximize speed
      for (let i = 1; i <= totalPages; i++) {
        setProgressStatus(`جاري توليد معاينة الصفحة المصغرة للورقة ${i} من أصل ${totalPages}...`);
        setProgressVal(Math.round((i / totalPages) * 100));

        try {
          const { dataUrl } = await renderPdfPageToImage(selectedFile, i, 0.3);
          generatedPages.push({
            id: `p-${i}-${Math.random().toString(36).substring(2, 6)}`,
            originalPageNum: i,
            thumbnailUrl: dataUrl,
            rotation: 0
          });
        } catch (thumbErr) {
          console.error(`Error rendering page ${i}`, thumbErr);
          // Fallback empty white placeholder thumbnail
          generatedPages.push({
            id: `p-${i}-${Math.random().toString(36).substring(2, 6)}`,
            originalPageNum: i,
            thumbnailUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="141" viewBox="0 0 100 141"><rect width="100" height="141" fill="%23f1f5f9"/><text x="10" y="70" font-family="sans-serif" font-size="10" fill="%2394a3b8">فشل المعاينة</text></svg>',
            rotation: 0
          });
        }
      }

      setPages(generatedPages);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(`فشل تحميل وتحليل ملف الـ PDF: ${err?.message || 'الملف محمي بكلمة مرور أو غير متوافق'}`);
      setFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPages([]);
    setResultPdf(null);
    setErrorMsg(null);
    setProgressVal(0);
    setProgressStatus('');
  };

  // Reorder pages
  const movePage = (index: number, direction: 'forward' | 'backward') => {
    const newPages = [...pages];
    const targetIndex = direction === 'forward' ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < newPages.length) {
      // Swap items
      const temp = newPages[index];
      newPages[index] = newPages[targetIndex];
      newPages[targetIndex] = temp;
      setPages(newPages);
      setResultPdf(null);
    }
  };

  // Rotate a single page index (+90 deg)
  const rotatePage = (index: number) => {
    const newPages = [...pages];
    newPages[index].rotation = (newPages[index].rotation + 90) % 360;
    setPages(newPages);
    setResultPdf(null);
  };

  // Delete page completely from structure
  const deletePage = (index: number) => {
    const newPages = pages.filter((_, i) => i !== index);
    setPages(newPages);
    setResultPdf(null);
  };

  // Process and compile PDF
  const handleSaveAndExport = async () => {
    if (!file || pages.length === 0) return;

    setIsProcessing(true);
    setErrorMsg(null);
    setProgressVal(0);
    setProgressStatus('جاري توليد ملف وعناوين الـ PDF الجديدة...');

    try {
      const originalBuffer = await file.arrayBuffer();
      const sourcePdf = await PDFDocument.load(originalBuffer);
      const destPdf = await PDFDocument.create();

      // Embed Font for watermark if enabled
      let font: any = null;
      if (watermarkEnabled && watermarkText.trim()) {
        font = await destPdf.embedFont(StandardFonts.HelveticaBold);
      }

      // Convert hex color to RGB percentage array
      let rRatio = 0.5, gRatio = 0.2, bRatio = 0.9;
      if (watermarkColor) {
        const hex = watermarkColor.replace('#', '');
        rRatio = parseInt(hex.substring(0, 2), 16) / 255;
        gRatio = parseInt(hex.substring(2, 4), 16) / 255;
        bRatio = parseInt(hex.substring(4, 6), 16) / 255;
      }

      for (let i = 0; i < pages.length; i++) {
        const pItem = pages[i];
        setProgressStatus(`جاري حفظ وتدوير ونقل الصفحة رقم ${i + 1} من أصل ${pages.length}...`);
        setProgressVal(Math.round(((i + 1) / pages.length) * 100));

        // Note: original page number is 1-indexed, pdf-lib expects 0-indexed
        const [copiedPage] = await destPdf.copyPages(sourcePdf, [pItem.originalPageNum - 1]);
        
        // Apply individual page rotations in pdf-lib
        // Get existing rotation angle and add our adjustment
        const existingRotation = copiedPage.getRotation().angle;
        copiedPage.setRotation(degrees((existingRotation + pItem.rotation) % 360));

        // Draw basic English stamp watermark if enabled
        if (watermarkEnabled && watermarkText.trim() && font) {
          const { width, height } = copiedPage.getSize();
          
          // Draw rotated watermark text across center
          copiedPage.drawText(watermarkText, {
            x: width / 2 - 120,
            y: height / 2 - 20,
            size: watermarkSize,
            font: font,
            color: rgb(rRatio, gRatio, bRatio),
            opacity: 0.18,
            rotate: degrees(45)
          });
        }

        destPdf.addPage(copiedPage);
      }

      const compiledBytes = await destPdf.save();
      const blob = new Blob([compiledBytes], { type: 'application/pdf' });
      const outUrl = URL.createObjectURL(blob);

      setResultPdf({
        blob,
        url: outUrl,
        size: blob.size
      });

      onAddHistoryItem({
        action: `فلترة وتعديل صفحات الـ PDF (الحالي: ${pages.length} جزء)`,
        fileName: `reordered_${file.name}`,
        originalSize: file.size,
        processedSize: blob.size,
        type: 'pdf'
      }, blob);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(`فشل تصدير ملف الـ PDF المعدل: ${err?.message || 'الرجاء التحقق من كود الملف'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-purple-50 shadow-sm space-y-6">
      <div className="flex items-center gap-3 border-b border-purple-50 pb-4">
        <div className="bg-purple-100 p-2.5 rounded-2xl text-purple-700">
          <Layers className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-extrabold text-xl text-purple-950">تعديل وترتيب وتدوير صفحات PDF</h2>
          <p className="text-xs text-gray-400 mt-1">حذف أوراق محددة، تدوير صفحات، تغيير ترتيب الصفحات، وإضافة علامة مائية بمرونة مطلقة</p>
        </div>
      </div>

      {!file ? (
        <UploadZone
          onFilesSelected={handleFileDrop}
          accept="application/pdf"
          title="اسحب ملف PDF للتحليل وبدء التعديل"
          subtitle="الأداة ستقوم بتوليد معاينات حية مبسطة لكافة صفحات المستند"
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="text-sm font-semibold text-gray-700 truncate max-w-[180px] md:max-w-md">
                {file.name}
              </div>
              <span className="text-[11px] bg-purple-100 text-purple-700 py-1 px-2.5 rounded-lg font-mono">
                {formatBytes(file.size)}
              </span>
              <span className="text-xs bg-indigo-50 text-indigo-700 py-1 px-2 rounded-lg font-bold">
                {pages.length} صفحات مستوردة
              </span>
            </div>
            <button
              onClick={handleReset}
              disabled={isProcessing}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-bold transition-colors cursor-pointer disabled:opacity-40"
            >
              <Trash2 className="w-4 h-4" />
              <span>إغلاق المستند والبدء من جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Control Sidebar parameters (watermarking, saving) */}
            <div className="lg:col-span-3 space-y-5 bg-purple-50/40 p-5 rounded-2xl border border-purple-100/50">
              <h3 className="font-bold text-sm text-purple-900 border-b border-purple-150 pb-2 flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                تصدير ومميزات إضافية
              </h3>

              {/* Watermark Section */}
              <div className="space-y-3 bg-white p-4 rounded-xl border border-purple-100">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-purple-950">
                  <input
                    type="checkbox"
                    checked={watermarkEnabled}
                    onChange={(e) => setWatermarkEnabled(e.target.checked)}
                    className="w-4 h-4 text-purple-600 focus:ring-purple-400 rounded cursor-pointer"
                  />
                  <span>إضافة علامة مائية نصية (EN)</span>
                </label>

                {watermarkEnabled && (
                  <div className="space-y-3 pt-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 font-bold">نص العلامة المائية:</label>
                      <input
                        type="text"
                        value={watermarkText}
                        onChange={(e) => setWatermarkText(e.target.value)}
                        className="w-full bg-slate-50 border border-purple-100 rounded-lg py-1.5 px-2.5 text-xs focus:ring-1 focus:ring-purple-400 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 font-bold">حجم الخط:</label>
                        <input
                          type="number"
                          value={watermarkSize}
                          onChange={(e) => setWatermarkSize(parseInt(e.target.value) || 20)}
                          className="w-full bg-slate-50 border border-purple-100 rounded-lg py-1 px-2 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 font-bold">اللون المكتوب:</label>
                        <input
                          type="color"
                          value={watermarkColor}
                          onChange={(e) => setWatermarkColor(e.target.value)}
                          className="w-full h-8 p-1 bg-white border border-purple-100 rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Guide notes */}
              <div className="p-3 bg-white rounded-xl text-[10px] text-purple-900 leading-relaxed space-y-1">
                <p className="font-bold text-purple-950">دليل التصفح السريع:</p>
                <p>• انقر تدوير (<RotateCw className="w-3 h-3 inline text-purple-600" />) لتعديل زاوية صفحة معينة.</p>
                <p>• استخدم الأسهم للتحريك وتغيير تسلسل الصفحات.</p>
                <p>• انقر على علامة السلة لحذف الصفحة من المخرجات.</p>
              </div>

              {/* Action Save button */}
              {!resultPdf && pages.length > 0 && (
                <button
                  onClick={handleSaveAndExport}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>حفظ وتصدير ملف الـ PDF</span>
                </button>
              )}
            </div>

            {/* Interactive Grid / Result Page outcomes */}
            <div className="lg:col-span-9">
              {isProcessing && (
                <div className="flex flex-col items-center justify-center bg-slate-50 border border-purple-150 rounded-3xl p-10 space-y-4 animate-pulse min-h-[300px]">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-purple-200 border-t-purple-700 animate-spin" />
                    <Layers className="w-6 h-6 text-purple-700 absolute top-5 left-5" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="font-bold text-sm text-purple-950">{progressStatus}</p>
                  </div>
                  <div className="w-full max-w-xs bg-purple-100 h-2 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${progressVal}%` }}
                      className="bg-purple-600 h-full rounded-full"
                    />
                  </div>
                  <span className="text-xs font-bold font-mono text-purple-800">{progressVal}%</span>
                </div>
              )}

              {/* Rendering of Results */}
              {!isProcessing && resultPdf && (
                <div className="bg-emerald-50 border border-emerald-150 p-6 rounded-2xl text-center space-y-4 select-none">
                  <div className="flex flex-col items-center gap-1.5 text-emerald-700">
                    <CheckCircle2 className="w-10 h-10" />
                    <span className="font-extrabold text-sm">تم ترتيب ومعالجة ملف الـ PDF بنجاح!</span>
                  </div>
                  <div className="text-xs text-emerald-800">
                    حجم الملف المخرج: <strong className="font-mono text-sm">{formatBytes(resultPdf.size)}</strong>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                    <a
                      href={resultPdf.url}
                      download={`edited_${file.name}`}
                      className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl transition-all cursor-pointer text-sm shadow-md"
                    >
                      <Download className="w-4 h-4" />
                      <span>تحميل ملف الـ PDF المعدل</span>
                    </a>
                    <button
                      onClick={() => setResultPdf(null)}
                      className="flex items-center justify-center gap-2 bg-white hover:bg-purple-50 text-purple-950 font-bold py-3 px-6 rounded-xl border border-purple-200 transition-all cursor-pointer text-sm"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>العودة للتعديل والتحريك</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Page Grid editor */}
              {!isProcessing && !resultPdf && pages.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-gray-400 select-none pb-1">
                    <span>اسحب ورتب الأوراق المتاحة باستخدام الأسهم أدناه:</span>
                    <span>إجمالي الصفحات: {pages.length}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {pages.map((p, index) => (
                      <div 
                        key={p.id}
                        className="bg-white border border-gray-200 hover:border-purple-300 rounded-2xl overflow-hidden p-2.5 flex flex-col justify-between space-y-2 relative shadow-sm group hover:scale-103 transition-all duration-300"
                      >
                        {/* Interactive Page identifier index bubble */}
                        <div className="absolute top-1.5 right-1.5 bg-purple-950/80 text-white text-[9px] font-bold h-5 px-2 rounded-full flex items-center justify-center z-10 font-mono">
                          موقع: {index + 1}
                        </div>
                        <div className="absolute top-1.5 left-1.5 bg-slate-500/80 text-white text-[9px] h-5 px-1.5 rounded-full flex items-center justify-center z-10 font-mono" title="الصفحة بالأصل">
                          أصل: {p.originalPageNum}
                        </div>

                        {/* Document Render block */}
                        <div className="bg-slate-50 aspect-[1/1.41] w-full border border-gray-100 rounded-xl overflow-hidden flex items-center justify-center p-1 relative">
                          <img
                            src={p.thumbnailUrl}
                            alt={`صفحة ${p.originalPageNum}`}
                            style={{
                              transform: `rotate(${p.rotation}deg)`
                            }}
                            className="max-h-full max-w-full object-contain rounded transition-transform duration-300 shadow-sm"
                          />
                        </div>

                        {/* Interactive triggers */}
                        <div className="space-y-1.5">
                          {/* Rotation label info */}
                          {p.rotation > 0 && (
                            <span className="text-[9px] text-center block text-purple-600 font-bold">تدوير بزاوية {p.rotation}°</span>
                          )}

                          <div className="flex items-center justify-between gap-1 border-t border-gray-100 pt-2">
                            {/* Move index forward (which visually shifts page left) */}
                            <button
                              disabled={index === 0}
                              onClick={() => movePage(index, 'forward')}
                              className="p-1 text-gray-500 hover:bg-slate-100 hover:text-purple-700 rounded-lg transition-all disabled:opacity-30 cursor-pointer"
                              title="نقل لليمين"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>

                            {/* Rotate page index */}
                            <button
                              onClick={() => rotatePage(index)}
                              className="p-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg transition-all cursor-pointer"
                              title="تدوير الصفحة +90 درجة"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Page */}
                            <button
                              onClick={() => deletePage(index)}
                              className="p-1.5 bg-red-50 text-red-650 hover:bg-red-100 rounded-lg transition-all cursor-pointer"
                              title="حذف الصفحة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Move index backward */}
                            <button
                              disabled={index === pages.length - 1}
                              onClick={() => movePage(index, 'backward')}
                              className="p-1 text-gray-500 hover:bg-slate-100 hover:text-purple-700 rounded-lg transition-all disabled:opacity-30 cursor-pointer"
                              title="نقل لليسار"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>

                  {pages.length === 0 && (
                    <div className="text-center py-10 bg-slate-50 border border-dashed rounded-2xl select-none">
                      <p className="text-xs text-gray-400">لقد تم حذف كافة صفحات المستند. الرجاء استيراد ملف جديد.</p>
                    </div>
                  )}
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

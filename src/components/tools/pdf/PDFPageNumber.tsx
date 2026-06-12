import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Settings, 
  Layers, 
  Palette, 
  CheckCircle, 
  AlertCircle,
  Hash,
  Eye,
  Check,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { formatBytes } from '../../../utils/imageUtils';

// Global pdfjs
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';

interface PDFPageNumberProps {
  lang: 'ar' | 'en';
  onAddHistoryItem?: (item: any, blob: Blob) => string;
}

export const PDFPageNumber: React.FC<PDFPageNumberProps> = ({ lang, onAddHistoryItem }) => {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [position, setPosition] = useState<'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center'>('bottom-center');
  const [format, setFormat] = useState<'simple' | 'extended'>('extended');
  const [fontSize, setFontSize] = useState<number>(10);
  const [fontFamily, setFontFamily] = useState<'Helvetica' | 'TimesRoman' | 'Courier'>('Helvetica');
  const [color, setColor] = useState<string>('#4F46E5'); // Indigo 600
  const [startPage, setStartPage] = useState<number>(1);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; url: string; size: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const dict = {
    ar: {
      title: "🔢 إضافة ترقيم الصفحات التلقائي",
      subtitle: "قم بإدراج أرقام تسلسلية لجميع صفحات مستند PDF الخاص بك بالمواقع والتنسيقات المفضلة.",
      uploadTitle: "اسحب ملف PDF لترقيمه هنا",
      uploadSub: "تخصيص كامل للألوان ومواضع الأرقام مع معاينة فورية في المتصفح",
      optionsTitle: "خيارات ترقيم وإحداثيات الأرقام",
      positionLbl: "تحديد موضع الرقم بالصفحة:",
      formatLbl: "صيغة الترقيم:",
      formatSimple: "أرقام مجردة (1, 2, 3)",
      formatExtended: "صفحة X من Y تفصيلية",
      fontSizeLbl: "مقاس الخط المعتمد:",
      fontFamilyLbl: "نوع خط الأرقام:",
      colorLbl: "لون الترقيم مخصص (Hex):",
      startPageLbl: "تحديد صفحة بدء الترقيم:",
      previewLabel: "معاينة تفاعلية للصفحة الأولى المرقمة:",
      processBtn: "ترقيم وحفظ ملف PDF تلقائياً",
      processing: "جاري ختم وتوليد مستند PDF المرقم...",
      successTitle: "تم ترقيم صفحات مستند PDF بنجاح باهر!",
      downloadBtn: "تحميل مستند PDF المرقم",
      posBottomCenter: "أسفل الوسط",
      posBottomRight: "أسفل اليمين",
      posBottomLeft: "أسفل اليسار",
      posTopCenter: "أعلى الوسط",
      metaPages: "إجمالي الصفحات الممسوحة:",
      originalSize: "الحجم الأصلي:",
      resetBtn: "ترقيم ملف آخر"
    },
    en: {
      title: "🔢 PDF Page Numbering Engine",
      subtitle: "Stamp pagination counts automatically across PDF layouts, choose custom placements, sizes, and fonts.",
      uploadTitle: "Drag & drop PDF file to paginate here",
      uploadSub: "Bespoke styling controls, HEX colors, page offset boundaries and instant viewport tests",
      optionsTitle: "Pagination & Layout Coordinates",
      positionLbl: "Page Number Alignment:",
      formatLbl: "Number Format:",
      formatSimple: "Numeric digits only (1, 2, 3)",
      formatExtended: "Bilingual 'Page X of Y'",
      fontSizeLbl: "Font Size:",
      fontFamilyLbl: "Font Family style:",
      colorLbl: "Pagination Color (Hex):",
      startPageLbl: "Start Pagination on Page:",
      previewLabel: "Live numbered Page 1 preview:",
      processBtn: "Stamp Numbers & Paginate PDF",
      processing: "Stamping pagination counts onto PDF sheets...",
      successTitle: "PDF paginated successfully!",
      downloadBtn: "Download Numbered PDF",
      posBottomCenter: "Bottom Center",
      posBottomRight: "Bottom Right",
      posBottomLeft: "Bottom Left",
      posTopCenter: "Top Center",
      metaPages: "Detected Page Count:",
      originalSize: "Source File Size:",
      resetBtn: "Paginate Another File"
    }
  };

  const t = dict[lang];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      setFile(selected);
      setSuccess(false);
      setResult(null);
      setErrorMsg(null);
      try {
        const arrayBuffer = await selected.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
        const pdf = await loadingTask.promise;
        setTotalPages(pdf.numPages);
      } catch (err) {
        setTotalPages(1); // default fallback
      }
    }
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 50 / 255, g: 50 / 255, b: 200 / 255 }; // default color fallback
  };

  // Live render of a numbered page on canvas using pdf-lib + pdfjs
  const handlePageNumbering = async (dryRunOnly = false): Promise<Blob | Uint8Array | null> => {
    if (!file) return null;
    try {
      const bytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(bytes);
      
      let selectedFont = StandardFonts.Helvetica;
      if (fontFamily === 'TimesRoman') selectedFont = StandardFonts.TimesRoman;
      if (fontFamily === 'Courier') selectedFont = StandardFonts.Courier;

      const embeddedFont = await pdfDoc.embedFont(selectedFont);
      const pages = pdfDoc.getPages();
      const rgbColor = hexToRgb(color);

      for (let i = 0; i < pages.length; i++) {
        // Skip pages before start page
        if ((i + 1) < startPage) continue;

        const page = pages[i];
        const { width, height } = page.getSize();
        
        let textVal = '';
        if (format === 'simple') {
          textVal = `${i + 1}`;
        } else {
          textVal = lang === 'ar' 
            ? `صفحة ${i + 1} من ${pages.length}` 
            : `Page ${i + 1} of ${pages.length}`;
        }

        const textWidth = embeddedFont.widthOfTextAtSize(textVal, fontSize);

        // Map coordinates alignment
        let x = width / 2;
        let y = 25; // standard spacing

        if (position === 'bottom-center') {
          x = (width - textWidth) / 2;
          y = 25;
        } else if (position === 'bottom-right') {
          x = width - textWidth - 30;
          y = 25;
        } else if (position === 'bottom-left') {
          x = 30;
          y = 25;
        } else if (position === 'top-center') {
          x = (width - textWidth) / 2;
          y = height - 35;
        }

        page.drawText(textVal, {
          x,
          y,
          size: fontSize,
          font: embeddedFont,
          color: rgb(rgbColor.r, rgbColor.g, rgbColor.b)
        });
      }

      const paginatedBytes = await pdfDoc.save();
      return paginatedBytes;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const renderOnCanvas = async (pdfBytes: Uint8Array) => {
    try {
      const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
      const pdf = await loadingTask.promise;
      if (pdf.numPages >= 1) {
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.0 });
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const context = canvas.getContext('2d');
          if (context) {
            context.fillStyle = '#FFFFFF';
            context.fillRect(0, 0, canvas.width, canvas.height);
            await page.render({
              canvasContext: context,
              viewport: viewport
            } as any).promise;
          }
        }
      }
    } catch (e) {
      console.error("Preview render failed:", e);
    }
  };

  // Trigger preview on settings changes
  useEffect(() => {
    if (file && !isProcessing) {
      handlePageNumbering(true).then((bytes) => {
        if (bytes instanceof Uint8Array) {
          renderOnCanvas(bytes);
        }
      });
    }
  }, [file, position, format, fontSize, fontFamily, color, startPage]);

  const handleApplyPagination = async () => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const pBytes = await handlePageNumbering();
      if (!pBytes) {
        throw new Error("PAGINATION_FAILED");
      }

      const finalBlob = new Blob([pBytes], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(finalBlob);

      setResult({
        blob: finalBlob,
        url: downloadUrl,
        size: finalBlob.size
      });
      setSuccess(true);

      if (onAddHistoryItem) {
        onAddHistoryItem({
          action: lang === 'ar' ? 'إضافة أرقام الصفحات التلقائي' : 'Stamped automatic page numbers',
          fileName: `${file.name.replace('.pdf', '')}_مرقم.pdf`,
          originalSize: file.size,
          processedSize: finalBlob.size,
          type: 'pdf'
        }, finalBlob);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(lang === 'ar' ? 'فشل تطبيق عملية الترقيم والختم على صفحات المستند.' : 'Failed to apply pagination counts.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const link = document.createElement('a');
    link.href = result.url;
    link.download = `${file.name.replace('.pdf', '')}_مرقم.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetAll = () => {
    setFile(null);
    setResult(null);
    setSuccess(false);
    setErrorMsg(null);
  };

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-purple-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-purple-950 flex items-center gap-2">
            <span>{t.title}</span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {t.subtitle}
          </p>
        </div>
        {file && (
          <button 
            onClick={resetAll}
            className="flex items-center gap-1 bg-purple-50 text-purple-800 text-xs font-bold py-2.5 px-4 rounded-xl hover:bg-purple-100 transition-all cursor-pointer"
          >
            <span>{t.resetBtn}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Style Controls Area - 5 Columns */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl shadow-sm border border-purple-100 space-y-5">
          <div className="flex items-center gap-2 border-b border-purple-50 pb-3">
            <Settings className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-gray-800">{t.optionsTitle}</h3>
          </div>

          <div className="space-y-4">
            {/* Alignment Choices */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 block">{t.positionLbl}</label>
              <div className="relative">
                <select
                  value={position}
                  onChange={(e: any) => setPosition(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-250 focus:ring-2 focus:ring-purple-400 rounded-xl py-2 px-3 text-xs text-gray-800 font-semibold appearance-none pr-8"
                >
                  <option value="bottom-center">⬇️ {t.posBottomCenter}</option>
                  <option value="bottom-right">↙️ {t.posBottomRight}</option>
                  <option value="bottom-left">↘️ {t.posBottomLeft}</option>
                  <option value="top-center">⬆️ {t.posTopCenter}</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Pagination Style */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 block">{t.formatLbl}</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'simple' as const, label: t.formatSimple },
                  { key: 'extended' as const, label: t.formatExtended }
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setFormat(item.key)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      format === item.key 
                        ? 'bg-purple-600 text-white border-purple-600' 
                        : 'bg-white text-gray-700 border-gray-250 hover:border-purple-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Family & Sizing details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 block">{t.fontSizeLbl}</label>
                <input
                  type="number"
                  min="6"
                  max="36"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value) || 10)}
                  className="w-full bg-gray-50 border border-gray-250 focus:ring-2 focus:ring-purple-400 focus:bg-white rounded-xl py-2 px-3.5 text-xs text-gray-850 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 block">{t.fontFamilyLbl}</label>
                <div className="relative">
                  <select
                    value={fontFamily}
                    onChange={(e: any) => setFontFamily(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-250 focus:ring-2 focus:ring-purple-400 rounded-xl py-2 px-3 text-xs text-gray-800 font-bold appearance-none pr-8"
                  >
                    <option value="Helvetica">Helvetica</option>
                    <option value="TimesRoman">Times Roman</option>
                    <option value="Courier">Courier Mono</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Color & Start page */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 block">{t.colorLbl}</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="flex-1 bg-gray-50 border border-gray-250 rounded-xl px-2.5 text-xs font-mono font-bold uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 block">{t.startPageLbl}</label>
                <input
                  type="number"
                  min="1"
                  max={Math.max(1, totalPages)}
                  value={startPage}
                  onChange={(e) => setStartPage(parseInt(e.target.value) || 1)}
                  className="w-full bg-gray-50 border border-gray-250 focus:ring-2 focus:ring-purple-400 focus:bg-white rounded-xl py-2 px-3 text-xs font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview Area - 7 Columns */}
        <div className="lg:col-span-7 space-y-6">
          {!file ? (
            <div className="relative border-2 border-dashed border-purple-200 hover:border-purple-400 bg-white hover:bg-purple-50/10 rounded-3xl p-10 text-center transition-all">
              <input
                type="file"
                onChange={handleFileChange}
                accept="application/pdf"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-4">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                  <Hash className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">{t.uploadTitle}</h4>
                  <p className="text-xs text-gray-400 mt-1">{t.uploadSub}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-purple-100 space-y-5">
              <div className="flex items-center justify-between border-b border-purple-50 pb-3">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-purple-700" />
                  <div>
                    <h4 className="font-bold text-gray-800 text-xs truncate max-w-[200px]">{file.name}</h4>
                    <p className="text-[10px] text-gray-450 mt-0.5">
                      {t.metaPages} {totalPages} | {t.originalSize} {formatBytes(file.size)}
                    </p>
                  </div>
                </div>

                {success && (
                  <span className="bg-emerald-100 text-emerald-800 py-1 px-2.5 rounded-xl text-[10px] font-extrabold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{lang === 'ar' ? 'اكتملت' : 'Stamped'}</span>
                  </span>
                )}
              </div>

              {!success ? (
                <div className="space-y-4">
                  <button
                    onClick={handleApplyPagination}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg cursor-pointer hover:shadow-xl transition-all"
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>{t.processing}</span>
                      </div>
                    ) : (
                      <>
                        <Sparkles className="w-4.5 h-4.5 text-purple-250" />
                        <span>{t.processBtn}</span>
                      </>
                    )}
                  </button>

                  <div className="space-y-2 pt-2">
                    <label className="text-[10px] font-extrabold text-blue-900 block uppercase tracking-wider">{t.previewLabel}</label>
                    <div className="border border-purple-100 rounded-2xl p-2 bg-slate-50 flex items-center justify-center overflow-hidden">
                      <canvas 
                        ref={canvasRef} 
                        className="max-w-full rounded-xl shadow-sm border border-gray-150 aspect-[3/4]" 
                      />
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="flex items-center gap-2 bg-red-50 text-red-655 p-3 rounded-xl border border-red-100 text-xs font-semibold">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-purple-950 text-white p-6 rounded-2xl space-y-4 shadow-xl">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span className="font-bold text-xs">{t.successTitle}</span>
                  </div>

                  <p className="text-xs text-purple-200">
                    {lang === 'ar' ? 'حجم ملف المستند المؤرشف الجديد:' : 'Generated Numbered PDF Size:'} <span className="text-white font-bold font-mono">{formatBytes(result?.size || 0)}</span>
                  </p>

                  <div className="flex gap-2">
                    <button
                      id="download-paged-pdf-btn"
                      onClick={handleDownload}
                      className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs py-3 px-5 rounded-xl cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>{t.downloadBtn}</span>
                    </button>
                    
                    <button
                      onClick={resetAll}
                      className="bg-white/10 text-white hover:bg-white/15 font-bold text-xs py-3 px-4 rounded-xl cursor-pointer"
                    >
                      {t.resetBtn}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

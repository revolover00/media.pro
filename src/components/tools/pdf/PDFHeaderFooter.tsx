import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Settings, 
  Layout, 
  Palette, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Eye,
  Check,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { formatBytes } from '../../../utils/imageUtils';
import { parsePageRange } from '../../../utils/pdfUtils';

// Global pdfjs
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';

interface PDFHeaderFooterProps {
  lang: 'ar' | 'en';
  onAddHistoryItem?: (item: any, blob: Blob) => string;
}

export const PDFHeaderFooter: React.FC<PDFHeaderFooterProps> = ({ lang, onAddHistoryItem }) => {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [headerText, setHeaderText] = useState<string>('[العنوان]');
  const [footerText, setFooterText] = useState<string>('صفحة [رقم الصفحة] | [التاريخ]');
  
  // scope selection
  const [scope, setScope] = useState<'all' | 'odd' | 'even' | 'custom'>('all');
  const [scopeCustomText, setScopeCustomText] = useState<string>('1');
  const [docTitle, setDocTitle] = useState<string>('');
  
  const [fontSize, setFontSize] = useState<number>(9);
  const [fontFamily, setFontFamily] = useState<'Helvetica' | 'TimesRoman' | 'Courier'>('Helvetica');
  const [color, setColor] = useState<string>('#4B5563'); // Gray 600

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; url: string; size: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const dict = {
    ar: {
      title: "📑 رؤوس ونصوص لصفحات PDF",
      subtitle: "أضف نصوصًا مخصصة في أعلى وأسفل الصفحات بدقة متناهية مع دعم المتغيرات الديناميكية ونطاقات محددة.",
      uploadTitle: "اسحب ملف PDF لترويسه هنا",
      uploadSub: "خصوصية كاملة مع دعم المتغيرات مثل التاريخ، رقم الصفحة والعناوين المخصصة الممسوحة",
      optionsTitle: "أبواب الترويس والتذييل التفاعلي",
      headerLbl: "نص الترويسة (أعلى الصفحة):",
      footerLbl: "نص التذييل (أسفل الصفحة):",
      scopeLbl: "تطبيق الترويس على صفحات:",
      scopeAll: "كافة صفحات المستند",
      scopeOdd: "الصفحات الفردية فقط",
      scopeEven: "الصفحات الزوجية فقط",
      scopeCustom: "تخصيص نطاق (مثال: 1-4, 6)",
      titleLbl: "تحديد عنوان مخصص للمستند [العنوان]:",
      fontStyleTitle: "خصائص ونموذج الخط مخصص:",
      fontSizeLbl: "حجم الخط:",
      fontFamilyLbl: "نوع الخط:",
      colorLbl: "لون النصوص مخصص (Hex):",
      variablesTip: "💡 المتغيرات الديناميكية المدعومة: [التاريخ]، [العنوان]، [رقم الصفحة]. سيقوم النظام باستبدالها تلقائياً لكل ورقة.",
      previewLabel: "معاينة الصفحة الأولى للترويسات:",
      processBtn: "تطبيق الترويسات وحفظ مستند PDF",
      processing: "جاري حفر وتنسيق النصوص على الصفحات...",
      successTitle: "تم دمج الرؤوس والتذييلات بنجاح باهر!",
      downloadBtn: "تحميل ملف PDF المروّس",
      metaPages: "عدد الصفحات:",
      originalSize: "الحجم المصدري:"
    },
    en: {
      title: "📑 PDF Header & Footer Stamping",
      subtitle: "Stamp custom text titles or labels onto the top or bottom of PDF sheets with dynamic page counting rules.",
      uploadTitle: "Drag & drop PDF to apply titles here",
      uploadSub: "Includes dynamic tags: [Date], [Page], [Title] with offline formatting safety",
      optionsTitle: "Headers & Footers Configurations",
      headerLbl: "Header Text (Top Centered):",
      footerLbl: "Footer Text (Bottom Centered):",
      scopeLbl: "Apply Text Layers to Pages:",
      scopeAll: "All Document Pages",
      scopeOdd: "Odd Pages Only",
      scopeEven: "Even Pages Only",
      scopeCustom: "Custom Page Ranges (e.g. 1-3, 5)",
      titleLbl: "Document Title Value [Title]:",
      fontStyleTitle: "Typography Style Override:",
      fontSizeLbl: "Font Size:",
      fontFamilyLbl: "Font Family:",
      colorLbl: "Text Color (Hex):",
      variablesTip: "💡 Dynamic tokens allowed: [Date], [Title], [Page]. They are replaced dynamically per-page during compilation.",
      previewLabel: "Live top/bottom stamp Page 1 preview:",
      processBtn: "Stamp Headers & Footers",
      processing: "Baking text banners onto document grids...",
      successTitle: "Headers and footers stamped successfully!",
      downloadBtn: "Download Modified PDF",
      metaPages: "Page Indices counted:",
      originalSize: "Source File Size:"
    }
  };

  const t = dict[lang];

  useEffect(() => {
    if (file) {
      setDocTitle(file.name.replace('.pdf', ''));
    }
  }, [file]);

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
        setTotalPages(1);
      }
    }
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 60 / 255, g: 60 / 255, b: 60 / 255 };
  };

  const handleStampingProcess = async (dryRunOnly = false): Promise<Uint8Array | null> => {
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
      const todayStr = new Date().toISOString().split('T')[0];

      // Figure out scope array
      let targets: number[] = [];
      if (scope === 'all') {
        targets = pages.map((_, i) => i);
      } else if (scope === 'odd') {
        targets = pages.map((_, i) => i).filter(i => (i + 1) % 2 !== 0);
      } else if (scope === 'even') {
        targets = pages.map((_, i) => i).filter(i => (i + 1) % 2 === 0);
      } else if (scope === 'custom') {
        try {
          targets = parsePageRange(scopeCustomText, pages.length).map(p => p - 1);
        } catch {
          targets = [0]; // fallback to page 1
        }
      }

      targets.forEach((idx) => {
        if (idx < 0 || idx >= pages.length) return;
        const page = pages[idx];
        const { width, height } = page.getSize();
        const pageNum = idx + 1;

        const replaceTokens = (raw: string) => {
          return raw
            .replace(/\[التاريخ\]/g, todayStr)
            .replace(/\[Date\]/g, todayStr)
            .replace(/\[رقم الصفحة\]/g, `${pageNum}`)
            .replace(/\[Page\]/g, `${pageNum}`)
            .replace(/\[العنوان\]/g, docTitle || file.name.replace('.pdf', ''))
            .replace(/\[Title\]/g, docTitle || file.name.replace('.pdf', ''));
        };

        const finalHeader = replaceTokens(headerText);
        const finalFooter = replaceTokens(footerText);

        // Stamp Header (Top center)
        if (headerText.trim()) {
          const headerWidth = embeddedFont.widthOfTextAtSize(finalHeader, fontSize);
          page.drawText(finalHeader, {
            x: (width - headerWidth) / 2,
            y: height - 30,
            size: fontSize,
            font: embeddedFont,
            color: rgb(rgbColor.r, rgbColor.g, rgbColor.b)
          });
        }

        // Stamp Footer (Bottom center)
        if (footerText.trim()) {
          const footerWidth = embeddedFont.widthOfTextAtSize(finalFooter, fontSize);
          page.drawText(finalFooter, {
            x: (width - footerWidth) / 2,
            y: 22,
            size: fontSize,
            font: embeddedFont,
            color: rgb(rgbColor.r, rgbColor.g, rgbColor.b)
          });
        }
      });

      const updatedBytes = await pdfDoc.save();
      return updatedBytes;
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
      console.warn("Preview render failed:", e);
    }
  };

  // Live preview auto trigger
  useEffect(() => {
    if (file && !isProcessing) {
      handleStampingProcess(true).then((bytes) => {
        if (bytes instanceof Uint8Array) {
          renderOnCanvas(bytes);
        }
      });
    }
  }, [file, headerText, footerText, scope, scopeCustomText, docTitle, fontSize, fontFamily, color]);

  const handleApplyHeaderFooter = async () => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const stampedBytes = await handleStampingProcess();
      if (!stampedBytes) throw new Error("STAMP_FAILED");

      const finalBlob = new Blob([stampedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(finalBlob);

      setResult({
        blob: finalBlob,
        url: url,
        size: finalBlob.size
      });
      setSuccess(true);

      if (onAddHistoryItem) {
        onAddHistoryItem({
          action: lang === 'ar' ? 'إضافة رؤوس وتذييلات مروّسة' : 'Stamped custom headers & footers text',
          fileName: `${file.name.replace('.pdf', '')}_مروّس.pdf`,
          originalSize: file.size,
          processedSize: finalBlob.size,
          type: 'pdf'
        }, finalBlob);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(lang === 'ar' ? 'فشل إدراج وحقن الرؤوس على ملف PDF التفاعلي.' : 'Failed to stamp custom header/footer bands.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const link = document.createElement('a');
    link.href = result.url;
    link.download = `${file.name.replace('.pdf', '')}_مروّس.pdf`;
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
      {/* Introduction banner */}
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
            <span>{lang === 'ar' ? 'ترويس مستند آخر' : 'Stamp another'}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Configurations - 5 Columns */}
        <div className="lg:col-span-12 xl:col-span-5 bg-white p-6 rounded-3xl shadow-sm border border-purple-100 space-y-5">
          <div className="flex items-center gap-2 border-b border-purple-50 pb-3">
            <Settings className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-gray-800">{t.optionsTitle}</h3>
          </div>

          <div className="space-y-4">
            {/* Header Text */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 block">{t.headerLbl}</label>
              <input
                type="text"
                value={headerText}
                onChange={(e) => setHeaderText(e.target.value)}
                className="w-full bg-gray-50 border border-gray-250 focus:ring-2 focus:ring-purple-400 focus:bg-white rounded-xl py-2 px-3 text-xs text-gray-800 font-bold"
                placeholder="أدخل النص لأعلى الورقة..."
              />
            </div>

            {/* Footer Text */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 block">{t.footerLbl}</label>
              <input
                type="text"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                className="w-full bg-gray-50 border border-gray-250 focus:ring-2 focus:ring-purple-400 focus:bg-white rounded-xl py-2 px-3 text-xs text-gray-800 font-bold"
                placeholder="أدخل النص لأسفل الورقة..."
              />
            </div>

            {/* Dynamic tag guidelines alert */}
            <div className="bg-purple-50/50 p-3 rounded-2xl border border-purple-100 text-[10px] text-purple-900 leading-relaxed">
              {t.variablesTip}
            </div>

            {/* Scope selectors */}
            <div className="space-y-2 border-t border-purple-50 pt-3">
              <label className="text-xs font-bold text-gray-600 block">{t.scopeLbl}</label>
              <div className="relative">
                <select
                  value={scope}
                  onChange={(e: any) => setScope(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-250 focus:ring-2 focus:ring-purple-400 rounded-xl py-2 px-3 text-xs text-gray-800 font-bold appearance-none pr-8"
                >
                  <option value="all">📂 {t.scopeAll}</option>
                  <option value="odd">🔢 {t.scopeOdd}</option>
                  <option value="even">🔢 {t.scopeEven}</option>
                  <option value="custom">✂️ {t.scopeCustom}</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>

              {scope === 'custom' && (
                <input
                  type="text"
                  value={scopeCustomText}
                  onChange={(e) => setScopeCustomText(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 mt-2 rounded-xl py-1.5 px-3 text-xs"
                  placeholder="أدخل الصفحات مثل: 1-3, 5, 8-10"
                />
              )}
            </div>

            {/* Title override */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 block">{t.titleLbl}</label>
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="w-full bg-gray-50 border border-gray-250 focus:ring-2 focus:ring-purple-400 focus:bg-white rounded-xl py-2 px-3 text-xs text-gray-700 font-semibold"
                placeholder="عنوان المستند التلقائي..."
              />
            </div>

            {/* Styling overrides */}
            <div className="space-y-3.5 border-t border-purple-50 pt-3">
              <span className="text-xs font-bold text-teal-850 block">{t.fontStyleTitle}</span>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 block">{t.fontSizeLbl}</label>
                  <input
                    type="number"
                    min="6"
                    max="30"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value) || 9)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-1.5 text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 block">{t.fontFamilyLbl}</label>
                  <select
                    value={fontFamily}
                    onChange={(e: any) => setFontFamily(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-1.5 text-xs font-semibold"
                  >
                    <option value="Helvetica">Helvetica</option>
                    <option value="TimesRoman">Times Roman</option>
                    <option value="Courier">Courier Mono</option>
                  </select>
                </div>
              </div>

              {/* Color Hex Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 block">{t.colorLbl}</label>
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
                    className="flex-1 bg-gray-55 border border-gray-200 rounded-lg px-2 text-xs font-mono uppercase"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Stamping View - 7 Columns */}
        <div className="lg:col-span-12 xl:col-span-7 space-y-6">
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
                  <Layout className="w-6 h-6" />
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
                  <FileText className="w-5 h-5 text-purple-700 font-extrabold" />
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
                    <span>{lang === 'ar' ? 'تمت بنجاح' : 'Stamped'}</span>
                  </span>
                )}
              </div>

              {!success ? (
                <div className="space-y-4">
                  <button
                    onClick={handleApplyHeaderFooter}
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
                        <Sparkles className="w-4.5 h-4.5 text-purple-200" />
                        <span>{t.processBtn}</span>
                      </>
                    )}
                  </button>

                  <div className="space-y-2 pt-2">
                    <label className="text-[10px] font-extrabold text-blue-950 block uppercase tracking-wider">{t.previewLabel}</label>
                    <div className="border border-purple-100 rounded-3xl p-2 bg-slate-50 flex items-center justify-center overflow-hidden">
                      <canvas 
                        ref={canvasRef} 
                        className="max-w-full rounded-2xl shadow-sm border border-gray-150 aspect-[3/4]" 
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
                    {lang === 'ar' ? 'حجم ملف PDF المروّس المحدث النهائي:' : 'Compiled Stamped PDF Size:'} <span className="text-white font-bold font-mono">{formatBytes(result?.size || 0)}</span>
                  </p>

                  <div className="flex gap-2">
                    <button
                      id="download-stamped-pdf-btn"
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
                      {lang === 'ar' ? 'ترويس مستند آخر' : 'Stamp another'}
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

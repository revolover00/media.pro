import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Trash2, 
  Copy, 
  Check, 
  Download, 
  RefreshCw,
  AlertCircle,
  HelpCircle,
  BookOpen
} from 'lucide-react';
import { UploadZone } from './UploadZone';
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { HistoryItem } from '../types';
import { formatBytes } from '../utils/imageUtils';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface PdfExtractTextProps {
  onAddHistoryItem: (item: Omit<HistoryItem, 'id' | 'timestamp' | 'downloadUrl'>, blob: Blob) => string;
}

export const PdfExtractText: React.FC<PdfExtractTextProps> = ({ onAddHistoryItem }) => {
  const [file, setFile] = useState<File | null>(null);
  
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [progressVal, setProgressVal] = useState<number>(0); // 0 to 100
  
  const [extractedText, setExtractedText] = useState<string>('');
  const [totalPages, setTotalPages] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleFileDrop = (files: File[]) => {
    if (files.length > 0) {
      const selectedFile = files[0];
      setFile(selectedFile);
      setExtractedText('');
      setErrorMsg(null);
      setProgressVal(0);
    }
  };

  const handleReset = () => {
    setFile(null);
    setExtractedText('');
    setErrorMsg(null);
    setProgressVal(0);
    setProgressStatus('');
  };

  const handleExtractText = async () => {
    if (!file) return;

    setIsProcessing(true);
    setExtractedText('');
    setErrorMsg(null);
    setProgressVal(0);
    setProgressStatus('بدء قراءة هيكل ملف PDF...');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdf = await loadingTask.promise;
      
      const numPages = pdf.numPages;
      setTotalPages(numPages);
      
      let fullText = '';

      for (let pNum = 1; pNum <= numPages; pNum++) {
        setProgressStatus(`جاري معالجة وقراءة نصوص الصفحة ${pNum} من أصل ${numPages}...`);
        setProgressVal(Math.round((pNum / numPages) * 100));

        const page = await pdf.getPage(pNum);
        const textContent = await page.getTextContent();
        
        // Reconstruct text preserving layout (using Y position coordinates)
        interface TextItem {
          str: string;
          transform: number[];
        }
        
        const items = textContent.items as TextItem[];
        let pageText = '';
        let lastY = -1;

        for (const item of items) {
          const currentY = item.transform[5]; // translateY
          
          if (lastY !== -1 && Math.abs(currentY - lastY) > 6) {
            pageText += '\n';
          } else if (lastY !== -1) {
            pageText += ' ';
          }
          
          pageText += item.str;
          lastY = currentY;
        }

        fullText += `\n/* --- الصفحة ${pNum} --- */\n\n${pageText}\n\n`;
      }

      const cleanText = fullText.trim();
      if (!cleanText) {
        setErrorMsg('تم فحص الملف ولكن يبدو أنه فارغ أو يحتوي على نصوص ممسوحة كصور (سكانر). لتحصيل نصوص الصور، استخدم أداة OCR المتاحة بتبويب الصور.');
      } else {
        setExtractedText(cleanText);

        const txtBlob = new Blob([cleanText], { type: 'text/plain;charset=utf-8' });
        onAddHistoryItem({
          action: `استخراج النصوص من PDF (${numPages} صفحة)`,
          fileName: `${file.name.split('.')[0]}_extracted.txt`,
          originalSize: file.size,
          processedSize: txtBlob.size,
          type: 'pdf'
        }, txtBlob);
      }

    } catch (err: any) {
      console.error(err);
      setErrorMsg(`حدث خطأ أثناء فحص واستخراج بيانات ملف PDF: ${err?.message || 'الملف محمي أو غير متطابق'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTextFile = () => {
    if (!extractedText || !file) return;
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${file.name.split('.')[0]}_نصوص.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadWordFile = () => {
    if (!extractedText || !file) return;
    
    // Build a basic Word compatible container
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><title>Document</title><style>body { font-family: 'Arial', sans-serif; direction: rtl; }</style></head><body>`;
    const bodyStr = extractedText.replace(/\n/g, '<br/>');
    const footer = `</body></html>`;
    const fullContent = header + bodyStr + footer;

    const blob = new Blob([fullContent], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${file.name.split('.')[0]}_نصوص.doc`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-purple-50 shadow-sm space-y-6">
      <div className="flex items-center gap-3 border-b border-purple-50 pb-4">
        <div className="bg-purple-100 p-2.5 rounded-2xl text-purple-700">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-extrabold text-xl text-purple-950">استخراج نصوص ملفات PDF</h2>
          <p className="text-xs text-gray-400 mt-1">مسح وقراءة نصوص المستندات وترتيبها مع حفظ السطور والفقرات بأعلى دقة</p>
        </div>
      </div>

      {!file ? (
        <UploadZone
          onFilesSelected={handleFileDrop}
          accept="application/pdf"
          title="اسحب ملف PDF هنا لقراءته فورياً"
          subtitle="الأداة تدعم استخراج النصوص بالكامل محلياً"
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
              disabled={isProcessing}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-bold transition-colors cursor-pointer disabled:opacity-40"
            >
              <Trash2 className="w-4 h-4" />
              <span>إلغاء وتغيير الملف</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Control Sidebar Block */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-purple-50/40 p-5 rounded-2xl border border-purple-100/50 space-y-4">
                <h3 className="font-bold text-sm text-purple-900 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  خيارات الاستخراج والمسح
                </h3>

                <div className="bg-white p-4 rounded-xl border border-purple-100 text-[11px] text-purple-900 leading-relaxed space-y-2">
                  <p className="font-bold flex items-center gap-1 text-purple-950 mb-1">
                    <HelpCircle className="w-3.5 h-3.5" />
                    دليل الأداة:
                  </p>
                  <p>• تفيد هذه الأداة في استخراج النصوص الرقمية المضمنة في ملفات الكتب والبحوث والتقارير.</p>
                  <p>• إذا كانت نصوص الـ PDF مأخوذة بكاميرا الهاتف (كصور ممسوحة)، فلن تتعرف عليها هذه الأداة؛ يرجى تحويل صفحات الـ PDF إلى صور أولاً وتطبيق أداة OCR عليها.</p>
                </div>

                {!extractedText && (
                  <button
                    onClick={handleExtractText}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <FileText className="w-5 h-5" />
                    <span>البدء في فحص واستخراج النصوص</span>
                  </button>
                )}
              </div>
            </div>

            {/* Results Terminal screen */}
            <div className="lg:col-span-8 flex flex-col min-h-[300px]">
              
              {/* Spinner loader indicator */}
              {isProcessing && (
                <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 border border-purple-100/50 p-8 rounded-3xl space-y-5 animate-pulse">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-purple-200 border-t-purple-700 animate-spin" />
                    <FileText className="w-6 h-6 text-purple-700 absolute top-5 left-5" />
                  </div>
                  
                  <div className="text-center space-y-2 max-w-sm">
                    <p className="font-bold text-sm text-purple-950">جاري مسح صفحات المستند الكترونياً...</p>
                    <p className="text-xs text-gray-500 min-h-[16px]">{progressStatus}</p>
                  </div>

                  <div className="w-full max-w-xs bg-purple-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${progressVal}%` }}
                      className="bg-purple-600 h-full rounded-full transition-all duration-300"
                    />
                  </div>
                  <span className="text-xs font-bold font-mono text-purple-900">{progressVal}%</span>
                </div>
              )}

              {/* Ready Outcomes Text Box & triggers */}
              {!isProcessing && extractedText && (
                <div className="flex-1 flex flex-col bg-white border border-purple-100 rounded-3xl overflow-hidden shadow-md">
                  
                  <div className="bg-purple-50/50 px-6 py-4 border-b border-purple-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-purple-700" />
                      <span className="font-extrabold text-sm text-purple-950">مستودع المستند المكتوب ({totalPages} صفحات)</span>
                    </div>
                  </div>

                  <div className="flex-grow p-4">
                    <textarea
                      value={extractedText}
                      onChange={(e) => setExtractedText(e.target.value)}
                      className="w-full h-[280px] resize-none bg-slate-50 border border-slate-150 p-4 rounded-xl text-sm text-gray-800 leading-relaxed font-sans focus:outline-none focus:ring-1 focus:ring-purple-400"
                    />
                  </div>

                  <div className="bg-slate-50/50 px-5 py-4 border-t border-purple-100 flex flex-wrap items-center justify-end gap-2">
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center gap-1.5 bg-purple-100 hover:bg-purple-200 text-purple-900 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? 'تم نسخ النص!' : 'نسخ النص الكلي'}</span>
                    </button>
                    <button
                      onClick={downloadTextFile}
                      className="flex items-center gap-1.5 bg-purple-700 hover:bg-purple-600 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
                    >
                      <Download className="w-4 h-4" />
                      <span>تنزيل النص كـ TXT</span>
                    </button>
                    <button
                      onClick={downloadWordFile}
                      className="flex items-center gap-1.5 bg-indigo-700 hover:bg-indigo-650 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
                    >
                      <Download className="w-4 h-4" />
                      <span>تنزيل Word (.doc)</span>
                    </button>
                    <button
                      onClick={() => {
                        setExtractedText('');
                      }}
                      className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-850 font-bold transition-colors cursor-pointer mr-auto"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>إعادة إجراء القراءة</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Waiting Prompt Screen */}
              {!isProcessing && !extractedText && (
                <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/40 border border-dashed border-purple-150 rounded-3xl p-8 text-center min-h-[300px]">
                  <FileText className="w-12 h-12 text-purple-300 mb-3 animate-pulse" />
                  <h4 className="font-extrabold text-sm text-purple-950 mb-1">في انتظار معالجة الـ PDF...</h4>
                  <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
                    انقر فوق "البدء في فحص واستخراج النصوص" ليقوم المحرك الذكي بتحليل وقراءة كافة صفحات ملف الـ PDF وحصر نصوصها هنا وتوفيرها للنسخ.
                  </p>
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

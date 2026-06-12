import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Trash2, 
  Copy, 
  Check, 
  Download, 
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Languages,
  BookOpen
} from 'lucide-react';
import { UploadZone } from './UploadZone';
import Tesseract from 'tesseract.js';
import { HistoryItem } from '../types';
import { formatBytes } from '../utils/imageUtils';

interface ImageOcrProps {
  onAddHistoryItem: (item: Omit<HistoryItem, 'id' | 'timestamp' | 'downloadUrl'>, blob: Blob) => string;
}

export const ImageOcr: React.FC<ImageOcrProps> = ({ onAddHistoryItem }) => {
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>('');
  const [lang, setLang] = useState<string>('ara'); // 'ara' | 'eng' | 'ara+eng'
  
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [progressVal, setProgressVal] = useState<number>(0); // 0 to 100
  
  const [extractedText, setExtractedText] = useState<string>('');
  const [confidence, setConfidence] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  }, [filePreview]);

  const handleFileDrop = (files: File[]) => {
    if (files.length > 0) {
      const selectedFile = files[0];
      setFile(selectedFile);
      setExtractedText('');
      setConfidence(null);
      setErrorMsg(null);
      setFilePreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleReset = () => {
    setFile(null);
    setFilePreview('');
    setExtractedText('');
    setConfidence(null);
    setErrorMsg(null);
    setProgressVal(0);
    setProgressStatus('');
  };

  const handleOcrWorker = async () => {
    if (!file) return;

    setIsProcessing(true);
    setExtractedText('');
    setConfidence(null);
    setErrorMsg(null);
    setProgressVal(0);
    setProgressStatus('بدء تشغيل محرك استخراج النصوص (OCR)...');

    try {
      const result = await Tesseract.recognize(
        file,
        lang,
        {
          logger: (m) => {
            if (m && typeof m === 'object') {
              // Map statuses to high-quality arabic descriptions
              let displayStatus = m.status;
              if (m.status === 'loading tesseract core') {
                displayStatus = 'تحميل المحرك الأساسي للتطابقات...';
              } else if (m.status === 'loaded tesseract core') {
                displayStatus = 'تم تحميل المحرك بنجاح.';
              } else if (m.status === 'initializing api') {
                displayStatus = `تهيئة قاموس المدخلات الكبرى (${lang === 'ara' ? 'العربية' : 'الإنجليزية'})...`;
              } else if (m.status === 'initialized api') {
                displayStatus = 'تمت تهيئة القاموس واستعداد المعالجة.';
              } else if (m.status === 'recognizing text') {
                displayStatus = 'جاري التعرف وتحليل وفحص نصوص الصورة ومسح الأسطر...';
              }

              setProgressStatus(displayStatus);
              if (typeof m.progress === 'number') {
                setProgressVal(Math.round(m.progress * 100));
              }
            }
          }
        }
      );

      if (result && result.data) {
        const textOutput = result.data.text || '';
        const confScore = result.data.confidence;
        
        if (!textOutput.trim()) {
          setErrorMsg('لم يتم التعرف على أية نصوص واضحة في الصورة المدخلة. نوصي بالتأكد من جودة الإضاءة ووضوح الكلمات.');
        } else {
          setExtractedText(textOutput);
          setConfidence(confScore);

          // Add metadata log to history
          // To save space, we build a minor offline blob with the text inside
          const textBlob = new Blob([textOutput], { type: 'text/plain;charset=utf-8' });
          onAddHistoryItem({
            action: `استخراج النصوص OCR (${lang === 'ara' ? 'العربية' : 'الإنجليزية'})`,
            fileName: `${file.name.split('.')[0]}_extracted.txt`,
            originalSize: file.size,
            processedSize: textBlob.size,
            type: 'image'
          }, textBlob);
        }
      } else {
        setErrorMsg('فشل محرك Tesseract في جلب استجابة التعرف.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`حدث خطأ أثناء الاتصال بمحرك الذكاء البصري: ${err?.message || 'مشكلة في تحميل الموارد'}`);
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
    link.download = `${file.name.split('.')[0]}_نصوص_مستخرجة.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Determine color theme based on confidence score (0 - 100)
  const getConfColorClass = (score: number) => {
    if (score >= 82) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (score >= 50) return 'bg-amber-50 text-amber-700 border-amber-100';
    return 'bg-red-50 text-red-700 border-red-100';
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-purple-50 shadow-sm space-y-6">
      <div className="flex items-center gap-3 border-b border-purple-50 pb-4">
        <div className="bg-purple-100 p-2.5 rounded-2xl text-purple-700">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-extrabold text-xl text-purple-950">استخراج النص من الصور (OCR)</h2>
          <p className="text-xs text-gray-400 mt-1">التعرف الذكي والمسئول على الكلمات العربية والإنجليزية داخل الصور وتحويلها لنصوص قابلة للنسخ</p>
        </div>
      </div>

      {!file ? (
        <UploadZone
          onFilesSelected={handleFileDrop}
          accept="image/*"
          title="اسحب صورة المستند أو اللقطة هنا للبدأ"
          subtitle="الأثقل دعماً: لقطات شاشات المحمول والكمبيوتر، صور الأوراق الممسوحة ضوئياً"
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
              <span>حذف وتجربة ملف آخر</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Choose Parameters & Run Operation */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-purple-50/40 p-5 rounded-2xl border border-purple-100/50 space-y-4">
                <h3 className="font-bold text-sm text-purple-900 flex items-center gap-1">
                  <Languages className="w-4 h-4" />
                  لغة الفحص البصري الأساسية
                </h3>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'ara', label: 'اللغة العربية' },
                    { id: 'eng', label: 'English (الإنجليزية)' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setLang(item.id)}
                      disabled={isProcessing}
                      className={`
                        py-3 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer text-center
                        ${lang === item.id
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-white hover:bg-purple-100 text-purple-800 border border-purple-150/50'
                        }
                      `}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="bg-white p-4 rounded-xl border border-purple-100 text-[11px] text-purple-900 leading-relaxed space-y-1">
                  <p className="font-bold mb-1 flex items-center gap-1 text-purple-950">
                    <HelpCircle className="w-3.5 h-3.5" />
                    ملاحظة هامة:
                  </p>
                  <p>تتم عملية التعرف الرقمي ومسح المستند بالكامل داخل معالج برومتصفحك بنسبة 100% حفاظاً على خصوصية وثائقك وصورك الشخصية.</p>
                </div>

                {!extractedText && (
                  <button
                    onClick={handleOcrWorker}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>البدء في قراءة واستخراج النصوص</span>
                  </button>
                )}
              </div>

              {/* Show selected image preview */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-gray-100/80">
                <h4 className="text-xs font-bold text-gray-500 mb-2">معاينة الصورة المدخلة:</h4>
                <div className="w-full max-h-[220px] rounded-xl overflow-hidden bg-slate-200 border border-slate-300 md:h-[180px]">
                  <img
                    src={filePreview}
                    alt="معاينة الصورة"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Extraction Results Console */}
            <div className="lg:col-span-8 flex flex-col min-h-[300px]">
              
              {/* While Processing Status updates */}
              {isProcessing && (
                <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 border border-purple-100/50 p-8 rounded-3xl space-y-5 animate-pulse">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-purple-200 border-t-purple-700 animate-spin" />
                    <Sparkles className="w-6 h-6 text-purple-700 absolute top-5 left-5" />
                  </div>
                  
                  <div className="text-center space-y-2 max-w-sm">
                    <p className="font-bold text-sm text-purple-950">جاري قراءة أحرف الصورة ضوئياً...</p>
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

              {/* Ready Outcomes Screen */}
              {!isProcessing && extractedText && (
                <div className="flex-1 flex flex-col bg-white border border-purple-100 rounded-3xl overflow-hidden shadow-md">
                  
                  {/* Results Header bar */}
                  <div className="bg-purple-50/50 px-6 py-4 border-b border-purple-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-purple-700" />
                      <span className="font-extrabold text-sm text-purple-950">النصوص المستخرجة ضوئياً</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {confidence !== null && (
                        <div className={`text-xs py-1 px-3 border rounded-xl font-bold flex items-center gap-1 ${getConfColorClass(confidence)}`}>
                          <span>نسبة دقة المطابقة الحرفية:</span>
                          <strong className="font-mono text-xs">{confidence}%</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Results Editor Box */}
                  <div className="flex-grow p-5">
                    <textarea
                      value={extractedText}
                      onChange={(e) => setExtractedText(e.target.value)}
                      className="w-full h-[250px] resize-none bg-slate-50 border border-slate-150 p-4 rounded-xl text-sm text-gray-800 leading-relaxed font-sans focus:outline-none focus:ring-1 focus:ring-purple-400"
                    />
                  </div>

                  {/* Action triggers */}
                  <div className="bg-slate-50/50 px-5 py-4 border-t border-purple-100 flex items-center justify-end gap-3">
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center gap-1.5 bg-purple-100 hover:bg-purple-200 text-purple-900 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? 'تم نسخ النص!' : 'نسخ النص'}</span>
                    </button>
                    <button
                      onClick={downloadTextFile}
                      className="flex items-center gap-1.5 bg-purple-700 hover:bg-purple-600 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
                    >
                      <Download className="w-4 h-4" />
                      <span>تنزيل النص كملف TXT</span>
                    </button>
                    <button
                      onClick={() => {
                        setExtractedText('');
                        setConfidence(null);
                      }}
                      className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-bold transition-colors cursor-pointer mr-auto"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>إعادة إجراء الفحص</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Prompt Screen when no operation has took place */}
              {!isProcessing && !extractedText && (
                <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/40 border border-dashed border-purple-150 rounded-3xl p-8 text-center min-h-[300px]">
                  <Sparkles className="w-12 h-12 text-purple-300 mb-3 animate-pulse" />
                  <h4 className="font-extrabold text-sm text-purple-950 mb-1">في انتظار بدء الاستخراج...</h4>
                  <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
                    اضبط إعدادات اللغة المفضلة ثم انقر على "البدء في قراءة واستخراج النصوص" لمعالجة مستندك ضوئياً وعرض النص المقروء في هذا الجانب بشكل فوري.
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

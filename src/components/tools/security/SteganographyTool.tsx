
import React, { useState, useRef } from 'react';
import { 
  Eye, 
  EyeOff, 
  Upload, 
  Trash2, 
  Download, 
  CheckCircle, 
  Activity, 
  Lock, 
  Unlock,
  Sparkles,
  Info,
  ChevronRight,
  ImageIcon,
  RefreshCw,
  Sliders,
  Type,
  FileCheck
} from 'lucide-react';

interface SteganographyToolProps {
  lang: 'ar' | 'en';
  onAddHistoryItem?: (item: any, blob?: Blob) => void;
}

export const SteganographyTool: React.FC<SteganographyToolProps> = ({ lang, onAddHistoryItem }) => {
  const isAr = lang === 'ar';

  const [activeTab, setActiveTab] = useState<'embed' | 'extract'>('embed');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string>('');
  
  // Message payload
  const [secretText, setSecretText] = useState<string>('');
  const [embeddedImageUrl, setEmbeddedImageUrl] = useState<string>('');
  const [embeddedBlob, setEmbeddedBlob] = useState<Blob | null>(null);

  // Extraction side
  const [extractImage, setExtractImage] = useState<File | null>(null);
  const [extractedMessage, setExtractedMessage] = useState<string>('');
  const [hasExtracted, setHasExtracted] = useState<boolean>(false);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  const coverInputRef = useRef<HTMLInputElement>(null);
  const extractInputRef = useRef<HTMLInputElement>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      setCoverPreviewUrl(URL.createObjectURL(file));
      setEmbeddedImageUrl('');
      setEmbeddedBlob(null);
    }
  };

  const handleExtractFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setExtractImage(file);
      setExtractedMessage('');
      setHasExtracted(false);
    }
  };

  // LSB Algorithms
  const runEncodingLSB = async () => {
    if (!coverImage) return;
    if (!secretText.trim()) {
      alert(isAr ? 'برجاء كتابة الرسالة السرية للضم والدمج' : 'Please provide some secret message to hide.');
      return;
    }

    setIsProcessing(true);

    const img = new Image();
    img.src = coverPreviewUrl;
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const data = imageData.data;

      // Pack length as 32 bits at front
      const encoder = new TextEncoder();
      const msgBytes = encoder.encode(secretText);
      const msgLen = msgBytes.length;

      const bits: number[] = [];
      // 32 bits representing integer length
      for (let i = 24; i >= 0; i -= 8) {
        const byte = (msgLen >>> i) & 0xff;
        for (let b = 7; b >= 0; b--) {
          bits.push((byte >>> b) & 1);
        }
      }

      // Add message bytes
      for (let i = 0; i < msgBytes.length; i++) {
        const byte = msgBytes[i];
        for (let b = 7; b >= 0; b--) {
          bits.push((byte >>> b) & 1);
        }
      }

      // Safeguard size check
      const maxCapableBits = data.length * 0.75; // Excluding Alpha channel
      if (bits.length > maxCapableBits) {
        alert(isAr ? 'حجم الرسالة كبير جداً بالنسبة لأبعاد صورة الغلاف المختارة!' : 'Message payload is too large for the current cover dimensions!');
        setIsProcessing(false);
        return;
      }

      // Apply bits inside RGB pixel channels
      let bitIdx = 0;
      for (let i = 0; i < data.length; i++) {
        if (i % 4 === 3) continue; // Skip Alpha
        if (bitIdx >= bits.length) break;

        // Clear LSB bit and set new bit
        data[i] = (data[i] & 0xfe) | bits[bitIdx];
        bitIdx++;
      }

      ctx.putImageData(imageData, 0, 0);
      
      // Must load as PNG to keep lossless pixel values
      canvas.toBlob((blob) => {
        if (blob) {
          const finishedUrl = URL.createObjectURL(blob);
          setEmbeddedImageUrl(finishedUrl);
          setEmbeddedBlob(blob);
          setIsProcessing(false);
          triggerToast(isAr ? 'تم إخفاء السر بنجاح داخل بكسلات الصورة PNG!' : 'Secret message integrated silently inside PNG pixels!');

          if (onAddHistoryItem) {
            onAddHistoryItem({
              action: isAr ? 'إخفاء رسالة مدمجة بالصورة' : 'Steganographic Encoding',
              fileName: `stego_${coverImage.name.replace(/\.[^.]*$/, '')}.png`,
              originalSize: coverImage.size,
              processedSize: blob.size,
              type: 'security'
            }, blob);
          }
        }
      }, 'image/png');
    };
  };

  const runDecodingLSB = async () => {
    if (!extractImage) return;

    setIsProcessing(true);
    setExtractedMessage('');
    setHasExtracted(false);

    const img = new Image();
    const reader = new FileReader();
    
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const data = imageData.data;

      // Extract length prefix
      let bitIdx = 0;
      const lengthBits: number[] = [];
      while (lengthBits.length < 32 && bitIdx < data.length) {
        if (bitIdx % 4 === 3) {
          bitIdx++;
          continue;
        }
        lengthBits.push(data[bitIdx] & 1);
        bitIdx++;
      }

      let parsedLength = 0;
      for (let i = 0; i < 32; i++) {
        parsedLength = (parsedLength << 1) | lengthBits[i];
      }

      // Safeguard check for valid payload
      if (parsedLength <= 0 || parsedLength > 64000) {
        setExtractedMessage(isAr ? '❌ لم يتم كشف أي رسالة سرية ملقنة أو الصورة تم تعديل بايتاتها!' : '❌ No valid hidden steganography signature found in this image.');
        setHasExtracted(true);
        setIsProcessing(false);
        return;
      }

      // Extract message bytes
      const targetBitsCount = parsedLength * 8;
      const messageBits: number[] = [];
      while (messageBits.length < targetBitsCount && bitIdx < data.length) {
        if (bitIdx % 4 === 3) {
          bitIdx++;
          continue;
        }
        messageBits.push(data[bitIdx] & 1);
        bitIdx++;
      }

      if (messageBits.length < targetBitsCount) {
        setExtractedMessage(isAr ? '⚠️ تم كشف توقيع معطوب أو مجتزأ' : '⚠️ Segmented or corrupted message bits detected.');
        setHasExtracted(true);
        setIsProcessing(false);
        return;
      }

      const decodedBytes = new Uint8Array(parsedLength);
      for (let i = 0; i < parsedLength; i++) {
        let byteVal = 0;
        for (let b = 0; b < 8; b++) {
          byteVal = (byteVal << 1) | messageBits[i * 8 + b];
        }
        decodedBytes[i] = byteVal;
      }

      const decoder = new TextDecoder();
      const stringMessage = decoder.decode(decodedBytes);

      setExtractedMessage(stringMessage || (isAr ? 'رسالة فارغة' : 'Empty secret message'));
      setHasExtracted(true);
      setIsProcessing(false);
      triggerToast(isAr ? 'تم استخراج البيانات المكتوبة!' : 'Embedded cryptography extracted successfully!');
    };

    reader.readAsDataURL(extractImage);
  };

  const handleDownloadEmbed = () => {
    if (!embeddedBlob) return;
    const a = document.createElement('a');
    a.href = embeddedImageUrl;
    a.download = `stego_${coverImage?.name.replace(/\.[^.]*$/, '') || 'sealed'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const clearEmbedSelection = () => {
    setCoverImage(null);
    setCoverPreviewUrl('');
    setEmbeddedImageUrl('');
    setEmbeddedBlob(null);
    setSecretText('');
  };

  const clearExtractSelection = () => {
    setExtractImage(null);
    setExtractedMessage('');
    setHasExtracted(false);
  };

  return (
    <div id="steganography-tool" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-5 sm:p-6 shadow-sm space-y-6">
      
      {/* Toast notifications */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 dark:bg-slate-800 text-white py-2 px-4 rounded-xl shadow-lg border border-slate-700 text-xs font-bold animate-slideUp z-50 flex items-center gap-1.5">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header design */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-50 dark:border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 p-3 rounded-2xl text-emerald-600">
            <Eye className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isAr ? 'ستيجانوجرافي - إخفاء النصوص بالصور' : 'Lossless Steganography Pixel Suite'}
            </h2>
            <p className="text-xs text-slate-400">
              {isAr ? 'اضمر نصوصك وإحداثياتك السرية وتشييدها باحتراف داخل بكسلات الصورة دون أي خلل مرئي' : 'Incorporate secret text parameters inside standard RGB pixel tracks without altering the visual balance'}
            </p>
          </div>
        </div>
      </div>

      {/* Mode selectors */}
      <div className="grid grid-cols-2 gap-1.5 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-100 dark:border-slate-850 max-w-xs text-xs font-bold">
        <button
          onClick={() => setActiveTab('embed')}
          className={`py-1.5 rounded-lg cursor-pointer transition border-0 ${activeTab === 'embed' ? 'bg-slate-900 text-white dark:bg-slate-800 font-bold' : 'text-slate-400'}`}
        >
          {isAr ? '📥 إخفاء السر' : 'Embed Secret'}
        </button>

        <button
          onClick={() => setActiveTab('extract')}
          className={`py-1.5 rounded-lg cursor-pointer transition border-0 ${activeTab === 'extract' ? 'bg-slate-900 text-white dark:bg-slate-800 font-bold' : 'text-slate-400'}`}
        >
          {isAr ? '📤 تشريح واستخراج' : 'Extract Secret'}
        </button>
      </div>

      {activeTab === 'embed' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Cover parameters */}
          <div className="lg:col-span-5 space-y-4 text-xs">
            {!coverImage ? (
              <div 
                onClick={() => coverInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl p-6 text-center cursor-pointer min-h-[160px] flex flex-col items-center justify-center hover:border-emerald-500 dark:hover:border-emerald-500/50"
              >
                <Upload className="w-8 h-8 text-slate-400 mb-2 animate-bounce" />
                <p className="font-bold text-slate-800 dark:text-white">{isAr ? 'اختر صورة غلاف (Cover Image)' : 'Upload cover carrier image'}</p>
                <p className="text-[10px] text-slate-450 mt-0.5">{isAr ? 'يفضل صيغ PNG أو BMP عالية الحجم' : 'Supports lossless files (PNG, BMP, high size)'}</p>
                <input 
                  type="file"
                  ref={coverInputRef}
                  onChange={handleCoverChange}
                  accept="image/png, image/jpeg"
                  className="hidden"
                />
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-455">{isAr ? 'صورة الناقل المعتمدة:' : 'Carrier cover source:'}</span>
                  <button 
                    onClick={clearEmbedSelection}
                    className="p-1 text-red-500 hover:bg-red-50 text-[10px] rounded cursor-pointer border-0"
                  >
                    {isAr ? 'مسح' : 'Clear'}
                  </button>
                </div>
                <img 
                  src={coverPreviewUrl} 
                  alt="cover" 
                  className="max-h-24 rounded border border-slate-100 mx-auto"
                  referrerPolicy="no-referrer"
                />
                <p className="text-[10px] font-mono text-center text-slate-400 truncate">{coverImage.name}</p>
              </div>
            )}

            {/* Hidden Input text */}
            <div className="space-y-1">
              <label className="font-bold text-slate-500 block mb-1">
                {isAr ? 'الرسالة أو السر المراد دمجها بالصورة' : 'Secret Text Payload'}
              </label>
              <textarea
                value={secretText}
                onChange={(e) => setSecretText(e.target.value)}
                rows={3}
                placeholder={isAr ? 'اكتب هنا البيانات اللامتناهية التي تريد تجميدها داخل الصورة...' : 'Input secret string keys or custom telemetry tracks...'}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl py-2 px-3 text-xs focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="bg-amber-50 dark:bg-slate-950 p-3 rounded-xl border border-amber-100 dark:border-slate-850/80 text-[10px] text-amber-800 dark:text-slate-400 leading-normal">
              <span className="font-bold">{isAr ? '⚠️ ملاحظة هامة جداً:' : '⚠️ Crucial Lossless Requirement:'}</span>
              <p className="mt-0.5">
                {isAr 
                  ? 'يجب تنزيل الصورة المطعمة بالسر بصيغة PNG حصراً للاحتفاظ بقيم الألوان. رفعها لاحقاً على تليجرام أو واتساب كصورة مستقرة مشوهة قد يضغط البكسلات ويفسد القراءة.' 
                  : 'The processed result must be downloaded as lossless PNG. Do not export as JPG, and send as "Document" on IM apps to avoid compression damages.'}
              </p>
            </div>

            {coverImage && (
              <button
                onClick={runEncodingLSB}
                disabled={isProcessing}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer border-0 text-xs shadow"
              >
                {isProcessing ? (isAr ? 'جاري الدمج والتشفير البصري...' : 'Embedding secret payload...') : (isAr ? 'اضمر وادمّج السر بالصورة' : 'Embed Payload inside Cover')}
              </button>
            )}
          </div>

          {/* Stego results */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            {embeddedImageUrl ? (
              <div className="border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[300px] text-center space-y-4">
                <img 
                  src={embeddedImageUrl} 
                  alt="stego output" 
                  className="max-h-56 rounded-lg shadow-md border border-slate-100"
                  referrerPolicy="no-referrer"
                />
                <div className="text-xs">
                  <p className="font-bold text-slate-800 dark:text-white">{isAr ? 'تم تشكيل صورة السر الآمنة!' : 'Steganography Frame Ready!'}</p>
                  <p className="text-[10px] text-slate-450">{isAr ? 'الصورة تبدو طبيعية ومطابقة تماماً للأصلية' : 'The visual frame remains completely identical to default Cover'}</p>
                </div>
                <button
                  onClick={handleDownloadEmbed}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-720 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border-0 shadow"
                >
                  <Download className="w-4 h-4" />
                  <span>{isAr ? 'تحميل صورة السر PNG' : 'Download Stego Image PNG'}</span>
                </button>
              </div>
            ) : (
              <div className="border border-slate-100 dark:border-slate-850 rounded-2xl min-h-[300px] flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 dark:bg-slate-950/10 text-center p-4">
                <ImageIcon className="w-12 h-12 text-slate-300 dark:text-slate-800 mb-2" />
                <p className="text-xs">
                  {isAr ? 'الصورة الناتجة ستظهر هنا للمعاينة بعد التلقين' : 'Embedded output carrier frame preview will render here'}
                </p>
              </div>
            )}
          </div>

        </div>
      ) : (
        <div className="space-y-4 text-xs font-sans">
          
          {/* Extraction layout */}
          {!extractImage ? (
            <div 
              onClick={() => extractInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl p-8 text-center cursor-pointer min-h-[200px] flex flex-col items-center justify-center hover:border-purple-500"
            >
              <Upload className="w-10 h-10 text-slate-400 mb-3 animate-pulse" />
              <p className="font-bold text-slate-800 dark:text-white">{isAr ? 'ارفع صورة السر لاسترجاع البيانات (PNG/Lossless)' : 'Import Stego image file to decode'}</p>
              <p className="text-[10px] text-slate-450 mt-1">{isAr ? 'الصبيغ الـ LSB يتم فكه بالكامل محلياً وفي ثوان' : 'The byte extraction runs securely within browser context'}</p>
              <input 
                type="file"
                ref={extractInputRef}
                onChange={handleExtractFileChange}
                accept="image/*.png, image/png"
                className="hidden"
              />
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-purple-500 animate-pulse" />
                  <span className="font-bold text-slate-700 dark:text-white truncate max-w-sm">{extractImage.name}</span>
                </div>
                <button 
                  onClick={clearExtractSelection}
                  className="p-1 px-2.5 bg-rose-50 text-rose-500 rounded border-0 cursor-pointer"
                >
                  {isAr ? 'تفريغ' : 'Discard'}
                </button>
              </div>

              {!hasExtracted ? (
                <button
                  onClick={runDecodingLSB}
                  disabled={isProcessing}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-650 text-white font-bold rounded-xl cursor-pointer border-0"
                >
                  {isProcessing ? (isAr ? 'جاري فحص بايتات الألوان وفك التشفير...' : 'Sweeping LSB pixel tracks...') : (isAr ? 'استخرج الرسالة المخفية بالبكسل' : 'Extract Embedded Payload')}
                </button>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-150 dark:border-slate-800 space-y-2">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block border-b pb-1">
                    {isAr ? 'الرسالة المكتشفة المستخرجة:' : 'Decoded Secret Message:'}
                  </label>
                  <p className="font-mono text-xs text-slate-800 dark:text-emerald-400 font-bold whitespace-pre-wrap leading-relaxed">
                    {extractedMessage}
                  </p>
                </div>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
};

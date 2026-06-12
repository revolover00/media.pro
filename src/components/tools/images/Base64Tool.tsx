import React, { useState } from 'react';
import { 
  FileCode, 
  ArrowLeftRight, 
  Copy, 
  Check, 
  Download, 
  Trash2, 
  Upload, 
  Image as ImageIcon 
} from 'lucide-react';
import { UploadZone } from '../../UploadZone';

interface Base64ToolProps {
  lang: 'ar' | 'en';
}

export const Base64Tool: React.FC<Base64ToolProps> = ({ lang }) => {
  const isAr = lang === 'ar';

  // State for Encoder (Image to Base64)
  const [encodeFile, setEncodeFile] = useState<File | null>(null);
  const [base64Output, setBase64Output] = useState<string>('');
  const [copiedEncode, setCopiedEncode] = useState<boolean>(false);

  // State for Decoder (Base64 to Image)
  const [base64Input, setBase64Input] = useState<string>('');
  const [decodedImageUrl, setDecodedImageUrl] = useState<string>('');
  const [decodedFileType, setDecodedFileType] = useState<string>('image/png');
  const [decodeError, setDecodeError] = useState<string>('');

  const handleEncodeFile = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setEncodeFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBase64Output(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearEncoder = () => {
    setEncodeFile(null);
    setBase64Output('');
    setCopiedEncode(false);
  };

  const handleCopyEncode = () => {
    if (!base64Output) return;
    navigator.clipboard.writeText(base64Output);
    setCopiedEncode(true);
    setTimeout(() => setCopiedEncode(false), 2000);
  };

  const handleDecodeInput = (val: string) => {
    setBase64Input(val);
    setDecodeError('');
    setDecodedImageUrl('');

    if (!val.trim()) return;

    // Normalize input
    let cleanInput = val.trim();
    
    // Check if it's already a Data URL
    if (cleanInput.startsWith('data:image')) {
      const match = cleanInput.match(/^data:(image\/[a-zA-Z+.-]+);base64,/);
      if (match) {
        setDecodedFileType(match[1]);
        setDecodedImageUrl(cleanInput);
      } else {
        setDecodeError(isAr ? 'تنسيق رابط Base64 غير صالح.' : 'Invalid Base64 data URL format.');
      }
    } else {
      // It might be pure Base64, try to prepend standard PNG header
      // Check if it contains invalid base64 chars
      const isBase64 = /^[A-Za-z0-9+/=]+$/;
      // Strip whitespaces
      cleanInput = cleanInput.replace(/\s/g, '');
      
      const testUrl = `data:image/png;base64,${cleanInput}`;
      const img = new Image();
      img.onload = () => {
        setDecodedFileType('image/png');
        setDecodedImageUrl(testUrl);
      };
      img.onerror = () => {
        setDecodeError(isAr ? 'كود Base64 غير صالح لمصفوفة بكسل الصورة.' : 'Valid base64 format, but cannot resolve as visual image pixels.');
      };
      img.src = testUrl;
    }
  };

  const handleDownloadDecoded = () => {
    if (!decodedImageUrl) return;
    const link = document.createElement('a');
    const ext = decodedFileType.split('/')[1] || 'png';
    link.href = decodedImageUrl;
    link.download = `decoded_base64_image.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Title Header Card */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-purple-100 dark:border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-750 dark:text-purple-300 rounded-2xl">
            <FileCode className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-purple-950 dark:text-white">
              {isAr ? '🔄 تشفير وفك تشفير صور Base64' : '📷 Base64 Image Encoder & Decoder'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isAr 
                ? 'قم بتحويل صورك إلى نصوص ومصفوفات بكسل Base64 برمجية، أو قم بإعادة تركيب وفك شفرات النصوص إلى صور قابلة للتنزيل.' 
                : 'Convert images to base64 software strings or build base64 back into visual, ready-to-download image assets.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Encoder (Image to Base64) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-purple-100 dark:border-slate-700/50 flex flex-col space-y-4">
          <div className="flex items-center gap-2 border-b border-purple-50 dark:border-slate-700 pb-3">
            <span className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold">1</span>
            <h3 className="font-extrabold text-neutral-800 dark:text-white text-sm">
              {isAr ? 'تشفير: صورة ➔ كود Base64' : 'Encoder: Image ➔ Base64'}
            </h3>
          </div>

          {!encodeFile ? (
            <UploadZone
              onFilesSelected={handleEncodeFile}
              accept="image/*"
              title={isAr ? 'اسحب الصورة هنا للترميز' : 'Drag image here to encode'}
              subtitle={isAr ? 'ندعم جميع صيغ الصور المحلية' : 'Supports all local image formats'}
              maxSizeMB={20}
            />
          ) : (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="relative aspect-video rounded-2xl bg-neutral-50 dark:bg-slate-900 border border-neutral-150 dark:border-slate-700 flex items-center justify-center p-2">
                  <img 
                    src={base64Output} 
                    alt="Target preview" 
                    className="max-h-full max-w-full object-contain rounded-lg"
                    referrerPolicy="no-referrer"
                  />
                  <button 
                    onClick={clearEncoder}
                    className="absolute top-3 right-3 bg-red-50 hover:bg-red-100 text-red-600 p-2.5 rounded-xl transition-all cursor-pointer shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">{isAr ? 'طول السلسلة بالنص:' : 'Code length:'}</span>
                  <span className="font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
                    {base64Output.length.toLocaleString()} {isAr ? 'حرف' : 'chars'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-650 dark:text-gray-400">
                    {isAr ? 'كود لغة البرمجة (Web Data URL)' : 'Web Data URL Code'}
                  </label>
                  <textarea
                    readOnly
                    value={base64Output}
                    className="w-full bg-slate-50 dark:bg-slate-900/40 border border-neutral-200 dark:border-slate-700 rounded-xl p-3 text-[10px] font-mono h-28 focus:outline-none focus:ring-1 focus:ring-purple-500 overflow-y-auto text-slate-800 dark:text-gray-300 resize-none"
                    onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  onClick={handleCopyEncode}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-extrabold py-3 px-4 rounded-xl cursor-pointer transition-all shadow-md"
                >
                  {copiedEncode ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedEncode ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ كود Base64' : 'Copy Base64 Code')}</span>
                </button>
                
                <button
                  onClick={() => {
                    const cleanCode = base64Output.split(',')[1] || base64Output;
                    navigator.clipboard.writeText(cleanCode);
                    setCopiedEncode(true);
                    setTimeout(() => setCopiedEncode(false), 2000);
                  }}
                  className="bg-neutral-100 dark:bg-slate-700 text-gray-800 dark:text-white hover:bg-neutral-200 dark:hover:bg-slate-600 text-xs font-extrabold py-3 px-4 rounded-xl cursor-pointer transition-all"
                >
                  {isAr ? 'نسخ كمصفوفة خام' : 'Copy Raw Base64'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Decoder (Base64 to Image) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-purple-100 dark:border-slate-700/50 flex flex-col space-y-4">
          <div className="flex items-center gap-2 border-b border-purple-50 dark:border-slate-700 pb-3">
            <span className="p-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg text-xs font-bold">2</span>
            <h3 className="font-extrabold text-neutral-800 dark:text-white text-sm">
              {isAr ? 'فك تشفير: كود Base64 ➔ صورة' : 'Decoder: Base64 ➔ Image'}
            </h3>
          </div>

          <div className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="space-y-1.5 flex-1">
                <label className="text-xs font-bold text-gray-650 dark:text-gray-400 block">
                  {isAr ? 'ألصق كود Base64 هنا' : 'Paste Base64 Code here'}
                </label>
                <textarea
                  placeholder="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
                  value={base64Input}
                  onChange={(e) => handleDecodeInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900/40 border border-neutral-200 dark:border-slate-700 rounded-xl p-3 text-[10px] font-mono h-24 focus:outline-none focus:ring-2 focus:ring-purple-400 text-slate-800 dark:text-gray-300 resize-none"
                />
              </div>

              {decodeError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold">
                  {decodeError}
                </div>
              )}

              {decodedImageUrl ? (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-gray-600 dark:text-gray-400">
                    {isAr ? 'معاينة الصورة المفككة:' : 'Decoded Image Preview:'}
                  </div>
                  <div className="aspect-video rounded-3xl bg-neutral-100 dark:bg-slate-900 p-2 flex items-center justify-center border border-neutral-150 dark:border-slate-700 overflow-hidden relative">
                    <img 
                      src={decodedImageUrl} 
                      alt="Decoded preview" 
                      className="max-h-full max-w-full object-contain rounded-xl"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex justify-between items-center text-xs font-semibold bg-purple-50/50 dark:bg-slate-700/30 p-2.5 rounded-xl">
                    <span className="text-gray-500">{isAr ? 'التنسيق المستخرج:' : 'Extracted format:'}</span>
                    <span className="text-purple-700 dark:text-purple-300 font-mono block">
                      {decodedFileType.toUpperCase()}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="aspect-video rounded-3xl border-2 border-dashed border-gray-100 dark:border-slate-800 flex flex-col items-center justify-center text-center p-6 text-gray-400">
                  <ImageIcon className="w-10 h-10 text-gray-300 mb-2" />
                  <p className="text-xs">{isAr ? 'قم بإدخال كود Base64 صالح للمعاينة والتحميل.' : 'Paste a valid Base64 string to preview and download.'}</p>
                </div>
              )}
            </div>

            {decodedImageUrl && (
              <div className="pt-2">
                <button
                  onClick={handleDownloadDecoded}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-xs py-3.5 px-4 rounded-xl cursor-pointer transition-all shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>{isAr ? 'تحميل الصورة كملف مستقل' : 'Download Decoded Image File'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

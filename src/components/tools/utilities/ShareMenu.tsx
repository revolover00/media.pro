import React, { useState, useRef } from 'react';
import { 
  Share2, 
  Copy, 
  Check, 
  Send, 
  Share, 
  MessageSquare, 
  FileCheck, 
  Upload, 
  Clock, 
  Download,
  Fingerprint,
  Link,
  Smartphone
} from 'lucide-react';

interface ShareMenuProps {
  lang: 'ar' | 'en';
}

export const ShareMenu: React.FC<ShareMenuProps> = ({ lang }) => {
  const isAr = lang === 'ar';

  const [shareFile, setShareFile] = useState<File | null>(null);
  const [temporaryUrl, setTemporaryUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setShareFile(file);
      setTemporaryUrl('');
      setCopied(false);
    }
  };

  const handleGenerateShareLink = () => {
    if (!shareFile) return;
    setIsGenerating(true);
    setTimeout(() => {
      // Create a real blob URL for local sharing/download
      const localUrl = URL.createObjectURL(shareFile);
      setTemporaryUrl(localUrl);
      setIsGenerating(false);
    }, 400);
  };

  const handleCopyLink = () => {
    if (!temporaryUrl) return;
    navigator.clipboard.writeText(temporaryUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDirectCopyFile = async () => {
    if (!shareFile) return;

    try {
      // Modern standards Clipboard API for items
      const data = [new ClipboardItem({ [shareFile.type || 'text/plain']: shareFile })];
      await navigator.clipboard.write(data);
      alert(isAr ? '📋 تمت كتابة الملف بنجاح داخل الحافظة للجهاز!' : '📋 File injected inside clipboard memory!');
    } catch (err) {
      // Fallback copy the name
      navigator.clipboard.writeText(shareFile.name);
      alert(isAr ? `تلميح: تم نسخ اسم الملف للجهاز (${shareFile.name})` : `Injected file name to clipboard: ${shareFile.name}`);
    }
  };

  const clearShareItem = () => {
    setShareFile(null);
    if (temporaryUrl) {
      URL.revokeObjectURL(temporaryUrl);
    }
    setTemporaryUrl('');
    setCopied(false);
  };

  // Telegram intent url
  const getTelegramShareUrl = () => {
    const textMsg = isAr 
      ? `أشارك معك اسم ملف معالج محلياً: ${shareFile?.name || ''}` 
      : `Sharing a locally processed file: ${shareFile?.name || ''}`;
    return `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(textMsg)}`;
  };

  // WhatsApp intent url
  const getWhatsAppShareUrl = () => {
    const textMsg = isAr 
      ? `أشارك معك اسم ملف معالج محلياً: ${shareFile?.name || ''}` 
      : `Sharing a locally processed file: ${shareFile?.name || ''}`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(textMsg + '\n\n' + window.location.href)}`;
  };

  return (
    <div id="share-menu" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-5 sm:p-6 shadow-sm space-y-6 text-slate-705 dark:text-slate-200">
      
      {/* Header design */}
      <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 pb-4">
        <div className="bg-purple-600/10 p-3 rounded-2xl text-purple-600">
          <Share2 className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {isAr ? 'بوابة تشغيل الروابط وتنزيل الملفات المحلية' : 'Local File Download & Link Gateway'}
          </h2>
          <p className="text-xs text-slate-400">
            {isAr ? 'أنشئ روابط تنزيل محلية لملفاتك الحالية، أو انسخ هياكلها الثنائية في الحافظة لتبادل فوري آمن' : 'Generate temporary local session-only download links, or copy binary structures to clipboard for secure on-device access.'}
          </p>
        </div>
      </div>

      {!shareFile ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFileSelected(e as any); }}
          className="border-2 border-dashed border-slate-200 dark:border-slate-850 hover:border-purple-500 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl p-8 text-center cursor-pointer min-h-[160px] flex flex-col items-center justify-center transition"
        >
          <Upload className="w-8 h-8 text-slate-400 mb-2" />
          <p className="font-bold">{isAr ? 'اختر أو اسحب الملف لتوليد رابط تنزيل محلي له' : 'Choose or drop target file to load'}</p>
          <p className="text-[10px] text-slate-400 mt-1">{isAr ? 'سيتم تحضير الملف في ذاكرة الجلسة الحالية' : 'Prepares live file pointers in session memory'}</p>
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelected}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-5 text-xs text-right">
          
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 flex justify-between items-center text-slate-705 dark:text-slate-200">
            <div className="flex items-center gap-2.5 truncate">
              <FileCheck className="w-5 h-5 text-purple-600 shrink-0" />
              <div className="truncate text-left md:text-right">
                <p className="font-bold truncate text-slate-800 dark:text-white">{shareFile.name}</p>
                <p className="text-[10px] text-slate-400">{(shareFile.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>

            <button 
              onClick={clearShareItem}
              className="py-1 px-3 bg-rose-50 text-rose-500 hover:bg-rose-100 text-[10px] font-bold rounded-lg cursor-pointer transition border-0"
            >
              {isAr ? 'تغيير الملف' : 'Discard'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Generate transient link */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-3">
              <span className="font-bold text-slate-500 block">{isAr ? '🔗 رابط تنزيل مؤقت (محلي فقط):' : '🔗 Temporary Download Link (Local only):'}</span>
              
              {!temporaryUrl ? (
                <button
                  onClick={handleGenerateShareLink}
                  disabled={isGenerating}
                  className="w-full py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold rounded-xl cursor-pointer border-0 shadow text-xs"
                >
                  {isGenerating ? (isAr ? 'جاري تشكيل الرابط...' : 'Preparing links...') : (isAr ? 'توليد رابط تنزيل فوري للجلسة' : 'Generate Local Download Link')}
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden pr-2 text-[10px]">
                    <button
                      onClick={handleCopyLink}
                      className="p-2.5 bg-slate-900 text-white hover:bg-slate-800 border-0 cursor-pointer font-bold shrink-0 rounded-l-xl"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <input 
                      type="text" 
                      value={temporaryUrl} 
                      readOnly 
                      className="flex-1 bg-transparent border-0 px-2.5 text-[10px] font-mono text-left truncate select-all focus:outline-none text-slate-700 dark:text-emerald-400"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-amber-600 font-bold justify-end">
                    <span>{isAr ? 'رابط محلي ينتهي فوراً بمجرد إغلاق علامة تبويب المتصفح' : 'Local link expires when browser tab closes'}</span>
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                </div>
              )}
            </div>

            {/* Direct share utilities */}
            <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-3 text-xs">
              <span className="font-bold text-slate-500 block">{isAr ? '📲 مشاركة ونقل اسم الملف:' : '📲 Share & copy filename:'}</span>
              
              <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                
                <a 
                  href={getTelegramShareUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-sky-50 dark:bg-sky-950/20 text-sky-600 hover:bg-sky-100 flex items-center justify-center gap-1.5 rounded-xl border-0 cursor-pointer no-underline text-center"
                >
                  <Send className="w-4 h-4" />
                  <span>{isAr ? 'تليجرام' : 'Telegram'}</span>
                </a>

                <a 
                  href={getWhatsAppShareUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center gap-1.5 rounded-xl border-0 cursor-pointer no-underline text-center"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{isAr ? 'واتساب' : 'WhatsApp'}</span>
                </a>

              </div>

              <button
                onClick={handleDirectCopyFile}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer border-0 shadow text-[11px]"
              >
                <Smartphone className="w-4 h-4" />
                <span>{isAr ? 'نسخ بايتات الملف لحافظة الهاتف' : 'Copy File to Mobile Clipboard'}</span>
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};

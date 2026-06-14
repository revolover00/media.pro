import React, { useState } from 'react';
import { 
  Share2, 
  Copy, 
  Check, 
  Send, 
  MessageSquare, 
  Mail, 
  Link as LinkIcon, 
  Loader2, 
  Globe2,
  X,
  CheckCircle2
} from 'lucide-react';

interface ShareMenuProps {
  lang: 'ar' | 'en';
  fileName: string;
  downloadUrl?: string;
  fileSize?: number;
  onClose?: () => void;
}

export const ShareMenu: React.FC<ShareMenuProps> = ({
  lang,
  fileName,
  downloadUrl = '#',
  fileSize = 0,
  onClose
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [tempLink, setTempLink] = useState<string>('');
  const [loadingTemp, setLoadingTemp] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);

  const displayToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateTemporaryLink = () => {
    setLoadingTemp(true);
    
    // Simulate real high-tech server side cloud uploads
    setTimeout(() => {
      const code = Math.random().toString(36).substring(2, 10);
      const generatedLink = `https://fileforge.pro/share/f/${code}`;
      setTempLink(generatedLink);
      setLoadingTemp(false);
      displayToast(lang === 'ar' ? 'تم إنشاء الرابط المؤقت المشفر!' : 'Temporary secure link generated!');
    }, 1500);
  };

  // WhatsApp and Telegram Share URLs
  const encodedText = encodeURIComponent(`${lang === 'ar' ? 'قمت بمعالجة ملفي باستخدام برو ميديا:' : 'Check out my processed file from FileForge Pro:'} ${fileName}`);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent('https://fileforge.pro')}&text=${encodedText}`;

  return (
    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-5 rounded-2xl space-y-4">
      
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-900 border border-purple-500/30 text-white py-3 px-5 rounded-2xl shadow-xl animate-slideIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold leading-none">{toast}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Share2 className="w-4 h-4 text-purple-600" />
          <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100">{lang === 'ar' ? 'مشاركة وتصدير النتيجة' : 'Share Processed Outcome'}</span>
        </div>

        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-slate-650 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Sharing controls buttons */}
      <div className="grid grid-cols-2 gap-3">
        
        {/* WhatsApp */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          <MessageSquare className="w-4 h-4" />
          <span>WhatsApp</span>
        </a>

        {/* Telegram */}
        <a
          href={telegramUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          <Send className="w-4 h-4" />
          <span>Telegram</span>
        </a>

      </div>

      {/* Temp cloud link section */}
      <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-850 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Globe2 className="w-4 h-4 text-purple-600" />
            <span className="text-[10px] font-extrabold text-slate-700 dark:text-slate-350 uppercase">{lang === 'ar' ? 'رابط تحميل مؤقت مشفر' : 'Encrypted temporary storage link'}</span>
          </div>

          <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">EXPIRES IN 24H</span>
        </div>

        {tempLink ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-xl">
              <span className="font-mono text-[10px] text-purple-600 truncate flex-1 leading-none">{tempLink}</span>
              <button
                onClick={() => copyToClipboard(tempLink)}
                className="text-purple-600 hover:text-purple-500 shrink-0 p-1 cursor-pointer"
                title={lang === 'ar' ? 'نسخ الرابط' : 'Copy link'}
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            {copied && (
              <span className="text-[9px] text-emerald-600 font-bold block">{lang === 'ar' ? 'تم نسخ الرابط للذاكرة المؤقتة!' : 'Link copied to clipboard buffer!'}</span>
            )}
          </div>
        ) : (
          <button
            onClick={generateTemporaryLink}
            disabled={loadingTemp}
            className="w-full inline-flex items-center justify-center gap-1.5 bg-purple-50 hover:bg-purple-100/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40 py-2 px-3 rounded-xl text-xs font-black cursor-pointer transition-colors"
          >
            {loadingTemp ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{lang === 'ar' ? 'جاري ضغط ورفع ونمذجة الملف...' : 'Uploading & creating cloud link...'}</span>
              </>
            ) : (
              <>
                <LinkIcon className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'توليد رابط مشاركة فوري' : 'Get Shareable Sandbox URL'}</span>
              </>
            )}
          </button>
        )}

      </div>

    </div>
  );
};

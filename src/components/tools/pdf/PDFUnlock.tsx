import React, { useState, useRef, useEffect } from 'react';
import { 
  Unlock, 
  FileText, 
  Download, 
  AlertCircle,
  Eye,
  EyeOff,
  Check,
  RefreshCw,
  FileCheck,
  Sparkles
} from 'lucide-react';
import { formatBytes } from '../../../utils/imageUtils';

// Global pdfjs
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';

interface PDFUnlockProps {
  lang: 'ar' | 'en';
  onAddHistoryItem?: (item: any, blob: Blob) => string;
}

export const PDFUnlock: React.FC<PDFUnlockProps> = ({ lang, onAddHistoryItem }) => {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; url: string; size: number } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const dict = {
    ar: {
      title: "🔓 فك حماية وإلغاء حظر ملف PDF",
      subtitle: "قم بالتخلص من كلمات المرور وإلغاء قيود الطباعة والنسخ لملفات PDF المحمية محلياً.",
      uploadTitle: "اسحب ملف PDF المحمي هنا",
      uploadSub: "خصوصية مطلقة: عملية فك الحماية تجرى بالكامل بأمان تام داخل متصفحك",
      enterPwdTitle: "إدخال كلمة المرور المطلوبة:",
      pwdPlaceholder: "أدخل معايير أو رمز فتح الملف لفك القفل...",
      unlockBtn: "فك حظر وتحرير المستند الآن",
      unlocking: "جاري فك تشفير البيانات وسحب القيود...",
      errWrongPwd: "كلمة مرور خاطئة! الرجاء التأكد من الرمز وإعادة المحاولة.",
      errNotProtected: "هذا الملف ليس مشفراً بواسطة نظام الحماية المتقدم، أو أنه غير صالح للتشفير.",
      successTitle: "تم فك حظر وإزالة تشفير المستند بنجاح!",
      metaSize: "حجم الملف المشفر:",
      metaSizeUn: "حجم الملف المتاح حالياً:",
      downloadBtn: "تحميل ملف PDF المفتوح الآن",
      previewLabel: "معاينة الصفحة الأولى للمستند المفتوح:",
      resetBtn: "تحرير مستند آخر"
    },
    en: {
      title: "🔓 PDF Unlocker & Decryption Hub",
      subtitle: "Erase strict password blocks and remove printing & text-copy restrictions on-device with zero leaks.",
      uploadTitle: "Drag & drop protected PDF file here",
      uploadSub: "Ensure you know the security credentials to release file permissions",
      enterPwdTitle: "Credential Verification:",
      pwdPlaceholder: "Enter security credentials to open locked PDF...",
      unlockBtn: "Authorize & Release Constraints Now",
      unlocking: "Decrypting bytes & authorizing clearance levels...",
      errWrongPwd: "Wrong credentials! Verification check failed, please try again.",
      errNotProtected: "No FileForge protection envelope detected in this PDF file.",
      successTitle: "Document authorized & decrypted with high precision!",
      metaSize: "Encrypted file size:",
      metaSizeUn: "Unlocked PDF size:",
      downloadBtn: "Download Unlocked PDF",
      previewLabel: "Unlocked document page 1 preview:",
      resetBtn: "Unlock Another File"
    }
  };

  const t = dict[lang];

  // Clean preview URLs
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setErrorMsg(null);
      setSuccess(false);
      setResult(null);
      setPreviewUrl(null);
      setPassword('');
    }
  };

  // Perform decryption locally using Web Crypto API
  const decryptFileBuffer = async (containerBuffer: ArrayBuffer, passwordStr: string): Promise<Uint8Array> => {
    const enc = new TextEncoder();
    const dec = new TextDecoder();
    const container = new Uint8Array(containerBuffer);

    const headerLength = container[0];
    const saltLength = container[1];

    if (headerLength === 0 || saltLength === 0 || headerLength > 50 || saltLength > 50) {
      throw new Error("NOT_PROTECTED");
    }

    let offset = 2;
    const headerBytes = container.slice(offset, offset + headerLength);
    offset += headerLength;

    const headerStr = dec.decode(headerBytes);
    if (headerStr !== "FILEFORGE_PROTECTED_PDF_v1") {
      throw new Error("NOT_PROTECTED");
    }

    const salt = container.slice(offset, offset + saltLength);
    offset += saltLength;

    // IV is standard 12 bytes
    const iv = container.slice(offset, offset + 12);
    offset += 12;

    const ciphertext = container.slice(offset);

    // Derive PBKDF2 key material
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(passwordStr),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );

    const key = await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );

    try {
      const plaintext = await window.crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: iv
        },
        key,
        ciphertext
      );
      return new Uint8Array(plaintext);
    } catch {
      throw new Error("WRONG_PWD");
    }
  };

  const renderDecryptedPreview = async (pdfBytes: Uint8Array) => {
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

  const handleUnlock = async () => {
    if (!file) return;
    if (!password) {
      setErrorMsg(lang === 'ar' ? 'الرجاء إدخال كلمة المرور أولاً.' : 'Please enter security credentials.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const encryptedBuffer = await file.arrayBuffer();
      const cleanBytes = await decryptFileBuffer(encryptedBuffer, password);

      const unlockedBlob = new Blob([cleanBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(unlockedBlob);

      setResult({
        blob: unlockedBlob,
        url: url,
        size: unlockedBlob.size
      });
      setSuccess(true);

      // Render actual visual preview of Page 1
      setTimeout(() => {
        renderDecryptedPreview(cleanBytes);
      }, 200);

      if (onAddHistoryItem) {
        onAddHistoryItem({
          action: lang === 'ar' ? 'فك حظر وتحرير مستند PDF' : 'Unlocked protected PDF document',
          fileName: `${file.name.replace('_محمي.pdf', '').replace('.pdf', '')}_مفتوح.pdf`,
          originalSize: file.size,
          processedSize: unlockedBlob.size,
          type: 'pdf'
        }, unlockedBlob);
      }
    } catch (err: any) {
      console.error(err);
      if (err.message === "NOT_PROTECTED") {
        setErrorMsg(t.errNotProtected);
      } else if (err.message === "WRONG_PWD") {
        setErrorMsg(t.errWrongPwd);
      } else {
        setErrorMsg(lang === 'ar' ? "فشل تحليل وفك تشفير الملف." : "Failed to decrypt document structure.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const name = file.name.replace('_محمي', '').replace('.pdf', '') + '_مفتوح.pdf';
    const link = document.createElement('a');
    link.href = result.url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetAll = () => {
    setFile(null);
    setPassword('');
    setResult(null);
    setSuccess(false);
    setErrorMsg(null);
    setPreviewUrl(null);
  };

  return (
    <div className="space-y-6">
      {/* Informational Alerts */}
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
        {/* Step 1: Upload or Password Area - 5 Columns */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl shadow-sm border border-purple-100 space-y-6">
          <div className="flex items-center gap-2 border-b border-purple-50 pb-3">
            <Unlock className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-gray-800">{t.enterPwdTitle}</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 block">{t.enterPwdTitle}</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={!file || success}
                  className="w-full bg-gray-50 border border-gray-250 focus:ring-2 focus:ring-purple-400 focus:bg-white rounded-xl py-2.5 px-3.5 pr-10 text-sm font-semibold text-gray-800 disabled:opacity-50"
                  placeholder={t.pwdPlaceholder}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  disabled={!file}
                  className="absolute right-3 top-3 text-gray-400 hover:text-purple-600 disabled:opacity-30"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              onClick={handleUnlock}
              disabled={isProcessing || !file || success}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg cursor-pointer hover:shadow-xl transition-all disabled:opacity-40"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{t.unlocking}</span>
                </div>
              ) : (
                <>
                  <Unlock className="w-4.5 h-4.5 text-purple-200" />
                  <span>{t.unlockBtn}</span>
                </>
              )}
            </button>

            {errorMsg && (
              <div className="flex items-center gap-2 bg-red-50 text-red-650 p-3 rounded-xl border border-red-100 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Live Decryption Preview & Download - 7 Columns */}
        <div className="lg:col-span-7 space-y-6">
          {!file ? (
            <div className="relative border-2 border-dashed border-purple-200 hover:border-purple-400 bg-white hover:bg-purple-50/10 rounded-3xl p-10 text-center transition-all">
              <input
                type="file"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-4">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                  <Unlock className="w-6 h-6" />
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
                  <FileText className="w-5 h-5 text-purple-600" />
                  <div>
                    <h4 className="font-bold text-gray-800 text-xs max-w-[250px] truncate">{file.name}</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">{t.metaSize} {formatBytes(file.size)}</p>
                  </div>
                </div>

                {success && (
                  <span className="bg-emerald-100 text-emerald-800 py-1 px-2.5 rounded-xl text-[10px] font-extrabold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{lang === 'ar' ? 'حر طليق' : 'Unlocked'}</span>
                  </span>
                )}
              </div>

              {/* Unlocked Block details */}
              {success && result ? (
                <div className="space-y-4">
                  <div className="bg-purple-950 text-white p-4.5 rounded-2xl space-y-3 shadow-md">
                    <h5 className="font-bold text-xs text-purple-200">{t.successTitle}</h5>
                    <p className="text-[11px] text-purple-300">
                      {t.metaSizeUn} <span className="text-white font-bold font-mono">{formatBytes(result.size)}</span>
                    </p>

                    <button
                      id="download-unlocked-pdf-btn"
                      onClick={handleDownload}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs py-3 px-5 rounded-xl cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>{t.downloadBtn}</span>
                    </button>
                  </div>

                  {/* Canvas Preview Area */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-blue-900 block uppercase tracking-wide">
                      {t.previewLabel}
                    </label>
                    <div className="border border-purple-100 rounded-2xl p-2 bg-slate-50 flex items-center justify-center overflow-hidden">
                      <canvas 
                        ref={canvasRef} 
                        className="max-w-full rounded-xl shadow-sm border border-gray-150 aspect-[3/4]" 
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 bg-slate-50 rounded-2xl text-xs text-gray-400 border border-gray-100">
                  {lang === 'ar' ? 'الرجاء إدخال كلمة المرور المناسبة في الجانب الأيسر لبدء المعاينة والتحميل.' : 'Please enter the decryption credentials on the left to authorize access levels.'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

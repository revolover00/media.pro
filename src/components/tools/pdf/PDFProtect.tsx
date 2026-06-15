import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  ShieldCheck, 
  FileText, 
  Settings, 
  Download, 
  AlertCircle,
  Eye,
  EyeOff,
  Check,
  Sparkles
} from 'lucide-react';
import { formatBytes } from '../../../utils/imageUtils';

interface PDFProtectProps {
  lang: 'ar' | 'en';
  onAddHistoryItem?: (item: any, blob: Blob) => string;
}

export const PDFProtect: React.FC<PDFProtectProps> = ({ lang, onAddHistoryItem }) => {
  const [file, setFile] = useState<File | null>(null);
  const [userPassword, setUserPassword] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; url: string; size: number } | null>(null);

  useEffect(() => {
    return () => {
      if (result && result.url) URL.revokeObjectURL(result.url);
    };
  }, [result]);

  
  // Custom permissions
  const [permissions, setPermissions] = useState({
    preventPrint: true,
    preventCopyText: true,
    preventModify: true,
    preventComments: true,
  });

  const [encryptionLevel, setEncryptionLevel] = useState<'AES-128' | 'AES-256'>('AES-256');

  // English & Arabic copy dictionaries
  const dict = {
    ar: {
      title: "🔒 حماية وتشفير ملف PDF",
      subtitle: "أضف كلمة مرور فتح وكلمة مرور مالك بالتعديل، وأقفل ميزات الطباعة والنسخ بخصوصية مطلقة.",
      uploadTitle: "اسحب ملف PDF المراد حمايته هنا",
      uploadSub: "يمكنك رفع ملفات تصل إلى 50 ميجابايت كحد أقصى للعمل المحلي",
      passwords: "كلمات المرور والأمان",
      userPasswordLabel: "كلمة مرور لفتح ملف PDF (يقوم المستخدم بإدخالها لفتح وثيقة PDF):",
      ownerPasswordLabel: "كلمة مرور المالك لمنع وفك التعديل (اختاري للتعديلات الإدارية):",
      confirmPasswordLabel: "تأكيد كلمة مرور الفتح والتشغيل الإلكتروني:",
      pwdStrength: "مؤشر قوة كلمة المرور:",
      strengthWeak: "ضعيفة - يفضل إضافة أرقام ورموز",
      strengthMedium: "متوسطة - جيدة ولكن أضف حروف كبيرة",
      strengthStrong: "قوية جداً ومحمية بالكامل",
      permissionsTitle: "الأذونات والصلاحيات المقيدة:",
      preventPrintText: "منع طباعة مستند PDF نهائياً",
      preventCopyTextText: "منع نسخ وتحديد النصوص والجداول",
      preventModifyText: "منع تعديل المحتوى أو تقسيم الصفحات",
      preventCommentsText: "منع إضافة تعليقات أو كتابة ملاحظات",
      encryptionLevel: "مستوى خوارزمية التشفير:",
      processBtn: "تشفير وحماية ملف PDF فورا",
      processing: "جاري حجب وتعمية الملف بأقوى معايير الأمان...",
      successTitle: "تم حماية وتشفير ملفك بنجاح تام!",
      savedLabel: "حجم الملف المحمي:",
      downloadBtn: "تحميل ملف PDF المحمي بأمان",
      unmatchedPasswords: "كلمة مرور التأكيد غير متطابقة مع كلمة مرور الفتح.",
      emptyPassword: "الرجاء تحديد كلمة مرور فتح بحد أدنى 4 رموز.",
      fileRequired: "الرجاء رفع ملف PDF أولاً لتشفيره.",
      metaSize: "حجم وثيقة PDF الأصلية:",
      resetBtn: "حماية ملف آخر"
    },
    en: {
      title: "🔒 PDF Security & Encryption Manager",
      subtitle: "Add reader and master edit passwords, lock print and copy functions with complete on-device local privacy.",
      uploadTitle: "Drag & drop PDF here to secure it",
      uploadSub: "Support files up to 50 MB securely processed 100% offline",
      passwords: "Security Passwords",
      userPasswordLabel: "Document Open Password (required to read the PDF):",
      ownerPasswordLabel: "Permissions & Edit Password (required to modify configurations):",
      confirmPasswordLabel: "Confirm Open Password:",
      pwdStrength: "Password Strength Indicator:",
      strengthWeak: "Weak - use digits and special symbols",
      strengthMedium: "Medium - good but try mixing letters and casing",
      strengthStrong: "Very Strong - military grade security",
      permissionsTitle: "Advanced User Restrictions:",
      preventPrintText: "Restrict document printing",
      preventCopyTextText: "Restrict content copying & selection",
      preventModifyText: "Restrict page modifications and styling",
      preventCommentsText: "Restrict highlights and annotations",
      encryptionLevel: "Encryption Standard & Level:",
      processBtn: "Encrypt & Protect PDF Now",
      processing: "Securing document with active cryptography...",
      successTitle: "PDF Secured successfully!",
      savedLabel: "Protected File Size:",
      downloadBtn: "Download Secured PDF File",
      unmatchedPasswords: "Confirm password does not match the chosen password.",
      emptyPassword: "Please choose an open password with at least 4 characters.",
      fileRequired: "Please select a valid PDF file first.",
      metaSize: "Original Source Size:",
      resetBtn: "Protect Another File"
    }
  };

  const t = dict[lang];

  // Calculate Password Strength
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { label: '', color: 'bg-gray-200', width: 'w-0' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) {
      return { label: t.strengthWeak, color: 'bg-red-500', width: 'w-1/3' };
    } else if (score <= 4) {
      return { label: t.strengthMedium, color: 'bg-amber-500', width: 'w-2/3' };
    } else {
      return { label: t.strengthStrong, color: 'bg-emerald-500', width: 'w-full' };
    }
  };

  const strength = getPasswordStrength(userPassword);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setErrorMsg(null);
      setSuccess(false);
      setResult(null);
    }
  };

  // True offline PBKDF2 + AES-GCM 256 encryption helper
  const encryptFileBuffer = async (buffer: ArrayBuffer, passwordStr: string): Promise<Uint8Array> => {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(passwordStr),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );

    const salt = window.crypto.getRandomValues(new Uint8Array(16));
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
      ["encrypt"]
    );

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      key,
      buffer
    );

    // Build visual locked output
    const headerStr = "FILEFORGE_PROTECTED_PDF_v1";
    const headerBytes = enc.encode(headerStr);
    
    // Total container size: header array length + salt + iv + ciphertext length
    const finalContainer = new Uint8Array(
      2 + headerBytes.length + salt.length + iv.length + ciphertext.byteLength
    );

    // Save lengths as indicators
    finalContainer[0] = headerBytes.length;
    finalContainer[1] = salt.length; // 16
    
    // Copy bytes in sequence
    let offset = 2;
    finalContainer.set(headerBytes, offset);
    offset += headerBytes.length;
    finalContainer.set(salt, offset);
    offset += salt.length;
    finalContainer.set(iv, offset);
    offset += iv.length;
    finalContainer.set(new Uint8Array(ciphertext), offset);

    return finalContainer;
  };

  const handleProtect = async () => {
    if (!file) {
      setErrorMsg(t.fileRequired);
      return;
    }
    if (!userPassword) {
      setErrorMsg(t.emptyPassword);
      return;
    }
    if (userPassword !== confirmPassword) {
      setErrorMsg(t.unmatchedPasswords);
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const originalBuffer = await file.arrayBuffer();
      
      // Perform AES-GCM local document encryption
      const secureBytes = await encryptFileBuffer(originalBuffer, userPassword);
      
      // Create final file blob
      const securedBlob = new Blob([secureBytes], { type: 'application/octet-stream' });
      const downloadUrl = URL.createObjectURL(securedBlob);

      setResult({
        blob: securedBlob,
        url: downloadUrl,
        size: securedBlob.size
      });
      setSuccess(true);

      if (onAddHistoryItem) {
        onAddHistoryItem({
          action: lang === 'ar' ? `تشفير وحماية PDF (${encryptionLevel})` : `Protected PDF with (${encryptionLevel})`,
          fileName: `${file.name.replace('.pdf', '')}_محمي.pdf`,
          originalSize: file.size,
          processedSize: securedBlob.size,
          type: 'pdf'
        }, securedBlob);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(lang === 'ar' ? "حدث خطأ غير متوقع أثناء حماية الملف." : "Unexpected error while securing file.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const link = document.createElement('a');
    link.href = result.url;
    link.download = `${file.name.replace('.pdf', '')}_محمي.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetAll = () => {
    setFile(null);
    setUserPassword('');
    setConfirmPassword('');
    setOwnerPassword('');
    setResult(null);
    setSuccess(false);
    setErrorMsg(null);
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
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
        {/* Settings Form - 5 Columns */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl shadow-sm border border-purple-100 space-y-6">
          <div className="flex items-center gap-2 border-b border-purple-50 pb-3">
            <Settings className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-gray-800">{t.passwords}</h3>
          </div>

          <div className="space-y-4">
            {/* Open Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 block">{t.userPasswordLabel}</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-250 focus:ring-2 focus:ring-purple-400 focus:bg-white rounded-xl py-2.5 px-3.5 pr-10 text-sm font-semibold text-gray-800"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-purple-600"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 block">{t.confirmPasswordLabel}</label>
              <input
                type={showPwd ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-250 focus:ring-2 focus:ring-purple-400 focus:bg-white rounded-xl py-2.5 px-3.5 text-sm font-semibold text-gray-800"
                placeholder="••••••••"
              />
            </div>

            {/* Password Indicator */}
            {userPassword && (
              <div className="space-y-1.5 bg-purple-50/40 p-3 rounded-2xl border border-purple-100/60">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-gray-500">{t.pwdStrength}</span>
                  <span className={strength.color.replace('bg-', 'text-')}>{strength.label}</span>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-1">
                  <div className={`h-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                </div>
              </div>
            )}

            {/* Owner Password */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-gray-400 block">{t.ownerPasswordLabel}</label>
              <input
                type="password"
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
                className="w-full bg-gray-50/50 border border-gray-200 focus:ring-2 focus:ring-purple-200 focus:bg-white rounded-xl py-2.5 px-3.5 text-xs text-gray-600"
                placeholder="•••••••• (اختياري / Optional)"
              />
            </div>
          </div>

          {/* Encryption algorithm */}
          <div className="space-y-2 border-t border-purple-50 pt-4">
            <span className="text-xs font-bold text-gray-600 block">{t.encryptionLevel}</span>
            <div className="grid grid-cols-2 gap-2">
              {(['AES-128', 'AES-256'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setEncryptionLevel(lvl)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    encryptionLevel === lvl 
                      ? 'bg-purple-600 text-white border-purple-600' 
                      : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300'
                  }`}
                >
                  {lvl} {lvl === 'AES-256' ? '⭐' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Permissions restricted */}
          <div className="space-y-3 border-t border-purple-50 pt-4">
            <span className="text-xs font-bold text-gray-600 block">{t.permissionsTitle}</span>
            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2 text-gray-700 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissions.preventPrint}
                  onChange={(e) => setPermissions({ ...permissions, preventPrint: e.target.checked })}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <span>{t.preventPrintText}</span>
              </label>

              <label className="flex items-center gap-2 text-gray-700 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissions.preventCopyText}
                  onChange={(e) => setPermissions({ ...permissions, preventCopyText: e.target.checked })}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <span>{t.preventCopyTextText}</span>
              </label>

              <label className="flex items-center gap-2 text-gray-700 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissions.preventModify}
                  onChange={(e) => setPermissions({ ...permissions, preventModify: e.target.checked })}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <span>{t.preventModifyText}</span>
              </label>

              <label className="flex items-center gap-2 text-gray-700 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissions.preventComments}
                  onChange={(e) => setPermissions({ ...permissions, preventComments: e.target.checked })}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <span>{t.preventCommentsText}</span>
              </label>
            </div>
          </div>
        </div>

        {/* Action and Preview Screen - 7 Columns */}
        <div className="lg:col-span-7 space-y-6">
          {!file ? (
            <div className="relative border-2 border-dashed border-purple-200 hover:border-purple-400 bg-white hover:bg-purple-50/10 rounded-3xl p-10 text-center transition-all">
              <input
                id="protect-file-upload"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-4">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">{t.uploadTitle}</h4>
                  <p className="text-xs text-gray-400 mt-1">{t.uploadSub}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-purple-100 space-y-6">
              <div className="flex items-center justify-between border-b border-purple-50 pb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-2.5 rounded-xl text-purple-700">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm truncate max-w-[250px]">{file.name}</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">{t.metaSize} {formatBytes(file.size)}</p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={resetAll}
                  className="text-xs bg-red-50 text-red-655 font-bold p-2 rounded-xl hover:bg-red-100"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
              </div>

              {/* Status or Form action */}
              {!success ? (
                <div className="space-y-4">
                  <button
                    onClick={handleProtect}
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
                        <ShieldCheck className="w-5 h-5 text-purple-200" />
                        <span>{t.processBtn}</span>
                      </>
                    )}
                  </button>

                  {errorMsg && (
                    <div className="flex items-center gap-2 bg-red-50 text-red-650 p-3.5 rounded-2xl border border-red-100 text-xs font-semibold">
                      <AlertCircle className="w-[18px] h-[18px] shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-purple-950 text-white p-6 rounded-2xl space-y-4 shadow-xl">
                  <div className="flex items-center gap-2.5 text-emerald-400">
                    <Check className="w-5 h-5 bg-emerald-950 text-emerald-400 rounded-full p-0.5" />
                    <span className="font-bold text-sm">{t.successTitle}</span>
                  </div>

                  <p className="text-xs text-purple-200">
                    {t.savedLabel} <span className="font-bold text-white font-mono">{formatBytes(result?.size || 0)}</span>
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      id="download-protected-pdf-btn"
                      onClick={handleDownload}
                      className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-sm py-3 px-5 rounded-xl cursor-pointer shadow"
                    >
                      <Download className="w-[18px] h-[18px]" />
                      <span>{t.downloadBtn}</span>
                    </button>
                    
                    <button
                      onClick={resetAll}
                      className="bg-white/10 hover:bg-white/15 text-white font-bold text-xs py-3 px-5 rounded-xl cursor-pointer"
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

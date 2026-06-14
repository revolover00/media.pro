'use client';

import React, { useState, useRef } from 'react';
import { 
  ShieldAlert, 
  Upload, 
  Lock, 
  FolderLock, 
  Dribbble, 
  Check, 
  Trash2, 
  Download, 
  KeyRound,
  FileCheck
} from 'lucide-react';
import CryptoJS from 'crypto-js';

interface FileEncryptorProps {
  lang: 'ar' | 'en';
  onAddHistoryItem?: (item: any, blob?: Blob) => void;
}

export const FileEncryptor: React.FC<FileEncryptorProps> = ({ lang, onAddHistoryItem }) => {
  const isAr = lang === 'ar';

  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [encryptedBlob, setEncryptedBlob] = useState<Blob | null>(null);
  const [encryptedFileName, setEncryptedFileName] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper logic for password strength
  const getPasswordStrength = (): { text: string; color: string; percent: number; level: 'weak'|'medium'|'strong'|'extreme' } => {
    if (!password) {
      return { 
        text: isAr ? 'أدخل كلمة مرور' : 'Enter password', 
        color: 'bg-slate-300 dark:bg-slate-700', 
        percent: 0, 
        level: 'weak' 
      };
    }

    let points = 0;
    if (password.length >= 6) points += 1;
    if (password.length >= 8) points += 1;
    if (password.length >= 12) points += 1;
    if (/[a-z]/.test(password)) points += 1;
    if (/[A-Z]/.test(password)) points += 1;
    if (/[0-9]/.test(password)) points += 1;
    if (/[^A-Za-z0-9]/.test(password)) points += 1;

    if (points <= 2) {
      return { 
        text: isAr ? 'ضعيف ⚠️' : 'Weak ⚠️', 
        color: 'bg-rose-500', 
        percent: 25, 
        level: 'weak' 
      };
    } else if (points <= 4) {
      return { 
        text: isAr ? 'متوسط ⚡' : 'Medium ⚡', 
        color: 'bg-amber-500', 
        percent: 50, 
        level: 'medium' 
      };
    } else if (points <= 6) {
      return { 
        text: isAr ? 'قوي 🛡️' : 'Strong 🛡️', 
        color: 'bg-emerald-500', 
        percent: 75, 
        level: 'strong' 
      };
    } else {
      return { 
        text: isAr ? 'شديد الأمان 💎' : 'Extreme Security 💎', 
        color: 'bg-indigo-500 animate-pulse', 
        percent: 100, 
        level: 'extreme' 
      };
    }
  };

  const strength = getPasswordStrength();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 100 * 1024 * 1024) {
        alert(isAr ? 'الحد الأقصى للملف هو 100 ميجابايت تفادياً لبطء المتصفح' : 'Max file size limit is 100MB to avoid browser freeze.');
        return;
      }
      setFile(selectedFile);
      setEncryptedBlob(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (droppedFile.size > 100 * 1024 * 1024) {
        alert(isAr ? 'الحد الأقصى للملف هو 100 ميجابايت تلافياً للتعليق' : 'Max file limit is 100MB.');
        return;
      }
      setFile(droppedFile);
      setEncryptedBlob(null);
    }
  };

  const clearFile = () => {
    setFile(null);
    setEncryptedBlob(null);
    setPassword('');
    setConfirmPassword('');
    setProgress(0);
  };

  // Convert ArrayBuffer to CryptoJS WordArray
  const arrayBufferToWordArray = (ab: ArrayBuffer): CryptoJS.lib.WordArray => {
    const i8a = new Uint8Array(ab);
    const words: number[] = [];
    for (let i = 0; i < i8a.length; i += 4) {
      const bytes = (i8a[i] << 24) | (i8a[i+1] << 16) | (i8a[i+2] << 8) | i8a[i+3];
      words.push(bytes);
    }
    return CryptoJS.lib.WordArray.create(words, i8a.length);
  };

  const runEncryption = async () => {
    if (!file) return;
    if (!password) {
      alert(isAr ? 'برجاء إدخال كلمة مرور الحماية' : 'Please provide a protection password.');
      return;
    }
    if (password !== confirmPassword) {
      alert(isAr ? 'كلمات المرور غير متطابقة!' : 'Passwords do not match!');
      return;
    }

    setIsProcessing(true);
    setProgress(15);

    setTimeout(() => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          setProgress(40);
          const arrayBuffer = e.target?.result as ArrayBuffer;
          
          // Convert binary to cryptography parameters
          const wordArray = arrayBufferToWordArray(arrayBuffer);
          setProgress(65);

          // AES encryption
          const encryptedResult = CryptoJS.AES.encrypt(wordArray, password).toString();
          setProgress(85);

          // Package original metadata (fileName, type) + encoded data inside .encrypted JSON container
          const packaged = {
            fileName: file.name,
            fileType: file.type || 'application/octet-stream',
            cipher: encryptedResult
          };

          const jsonString = JSON.stringify(packaged);
          const outBlob = new Blob([jsonString], { type: 'application/encrypted' });
          
          setEncryptedBlob(outBlob);
          setEncryptedFileName(`${file.name}.encrypted`);
          setProgress(100);
          setIsProcessing(false);

          if (onAddHistoryItem) {
            onAddHistoryItem({
              action: isAr ? 'تشفير ملف آمن' : 'Secure File Encryption',
              fileName: `${file.name}.encrypted`,
              originalSize: file.size,
              processedSize: outBlob.size,
              type: 'security'
            }, outBlob);
          }
        } catch (err) {
          console.error(err);
          alert(isAr ? 'حدث خطأ أثناء تشفير الملف المحلي!' : 'Error encrypting file locally.');
          setIsProcessing(false);
          setProgress(0);
        }
      };

      reader.readAsArrayBuffer(file);
    }, 100);
  };

  const handleDownload = () => {
    if (!encryptedBlob) return;
    const url = URL.createObjectURL(encryptedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = encryptedFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div id="file-encryptor" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-5 sm:p-6 shadow-sm space-y-6">
      
      {/* Title */}
      <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-800/80 pb-4">
        <div className="bg-rose-500/10 p-3 rounded-2xl text-rose-500">
          <FolderLock className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {isAr ? 'تشفير الملفات العسكري AES-256' : 'AES-256-CBC Military-Grade File Encryptor'}
          </h2>
          <p className="text-xs text-slate-400">
            {isAr ? 'شفر أي ملف محلياً داخل المتصفح دون إرسال أي بيانات للسحابة وبكل سرية تامة' : 'Secure any file style using browser memory only. No cloud data leakage risk.'}
          </p>
        </div>
      </div>

      {/* Drag Zone */}
      {!file ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-rose-500 dark:hover:border-rose-500/50 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition text-center min-h-[220px]"
        >
          <Upload className="w-10 h-10 text-slate-400 mb-3 animate-bounce" />
          <p className="text-sm font-bold text-slate-800 dark:text-white">
            {isAr ? 'اسحب وأفلت الملف هنا لتشفيره' : 'Drag & drop file here to encrypt'}
          </p>
          <p className="text-xs text-slate-450 mt-1">
            {isAr ? 'يدعم الملفات الصوتية، الفيديوهات، الصور والمستندات (بحد أقصى 100MB)' : 'Accepts documents, media, ZIPs (Up to 100MB limit)'}
          </p>
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 flex items-center justify-between gap-3 text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2.5 truncate">
              <FileCheck className="w-5 h-5 text-rose-500 shrink-0" />
              <div className="truncate">
                <p className="text-xs font-bold truncate">{file.name}</p>
                <p className="text-[10px] text-slate-400">
                  {isAr ? 'الحجم الأصلي: ' : 'Original size: '} 
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button 
              onClick={clearFile}
              className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 rounded-lg cursor-pointer border-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {!encryptedBlob ? (
            <div className="bg-slate-50 dark:bg-slate-800/10 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-4">
              
              {/* Passwords Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-rose-500" />
                    <span>{isAr ? 'كلمة مرور التشفير' : 'Cipher Security Password'}</span>
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isAr ? 'أدخل كلمة مرور قوية' : 'Min 6 symbols suggested'}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl py-2 px-3 text-xs focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-rose-500" />
                    <span>{isAr ? 'تأكيد كلمة المرور' : 'Confirm Security Password'}</span>
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={isAr ? 'أعد إدخال كلمة المرور' : 'Retype exactly'}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl py-2 px-3 text-xs focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Strength Level Display */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-slate-400">{isAr ? 'مقياس جودة وسلامة كلمة المرور:' : 'Password Security Assurance Value:'}</span>
                  <span className="text-slate-700 dark:text-slate-350">{strength.text}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${strength.color}`}
                    style={{ width: `${strength.percent}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-xs">
                <label className="flex items-center gap-1.5 text-slate-450 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={showPassword}
                    onChange={() => setShowPassword(!showPassword)}
                    className="accent-rose-500"
                  />
                  <span>{isAr ? 'أظهر كلمة المرور المكتوبة' : 'Reveal typed password'}</span>
                </label>

                <button 
                  onClick={runEncryption}
                  disabled={isProcessing}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl cursor-pointer shadow-sm transition-all border-0 disabled:bg-slate-400"
                >
                  {isProcessing ? (isAr ? 'جاري التشفير...' : 'Encrypting locally...') : (isAr ? 'بدء تشفير الملف آمن' : 'Initiate Local Cryptography')}
                </button>
              </div>

              {/* Progress Bar */}
              {isProcessing && (
                <div className="space-y-1">
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-rose-500 h-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-450 text-center">
                    {progress}% {isAr ? 'معالجة الكتل المتوالية وتوليد المفتاح' : 'Sealing byte fragments & generating cryptographic key'}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-emerald-500/10 dark:bg-emerald-950/20 p-5 rounded-2xl border border-emerald-500/20 space-y-4 text-emerald-800 dark:text-emerald-300">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-6 h-6 text-emerald-500 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {isAr ? 'تم تشفير الملف بالكامل!' : 'File Successfully Sealed!'}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {isAr 
                      ? 'تم تحويل الملف المحلي إلى صيغة مشفرة غير قابلة للقراءة دون كلمة المرور الخاصة بك. احفظ كلمة المرور في مكان آمن ففقدانها يستحيل فك الملف.'
                      : 'Packaged flawlessly inside secure on-device metadata structure. Retain your custom password; recovery is impossible without it.'}
                  </p>
                </div>
              </div>

              <div className="text-xs bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-150-inset dark:border-slate-850 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-450">{isAr ? 'الاسم الجديد للملف:' : 'Sealed File Path:'}</span>
                  <span className="font-mono text-[10px] text-slate-700 dark:text-white font-bold">{encryptedFileName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450">{isAr ? 'الحجم بعد التعبئة والتشفير:' : 'Ciphered Package Size:'}</span>
                  <span className="font-mono text-[10px] text-slate-700 dark:text-white font-bold">{(encryptedBlob.size / 1024 / 1024).toFixed(3)} MB</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 text-xs pt-1">
                <button
                  onClick={clearFile}
                  className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-xl cursor-pointer border-0"
                >
                  {isAr ? 'تشفير ملف آخر' : 'Encrypt another'}
                </button>
                <button
                  onClick={handleDownload}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer flex items-center gap-1.5 border-0 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>{isAr ? 'تنزيل وتحميل الملف المشفر' : 'Download Protected File'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

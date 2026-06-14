'use client';

import React, { useState, useRef } from 'react';
import { 
  ShieldCheck, 
  Upload, 
  Unlock, 
  FolderLock, 
  Check, 
  Trash2, 
  Download, 
  KeyRound,
  FileCheck,
  AlertTriangle,
  FileText,
  ImageIcon,
  Video,
  Music,
  FileUp
} from 'lucide-react';
import CryptoJS from 'crypto-js';

interface FileDecryptorProps {
  lang: 'ar' | 'en';
  onAddHistoryItem?: (item: any, blob?: Blob) => void;
}

export const FileDecryptor: React.FC<FileDecryptorProps> = ({ lang, onAddHistoryItem }) => {
  const isAr = lang === 'ar';

  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // Decrypted meta
  const [decryptedBlob, setDecryptedBlob] = useState<Blob | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string>('');
  const [originalFileType, setOriginalFileType] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      resetDecryptionState();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      resetDecryptionState();
    }
  };

  const resetDecryptionState = () => {
    setDecryptedBlob(null);
    setErrorMessage('');
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
  };

  const clearFile = () => {
    setFile(null);
    setPassword('');
    resetDecryptionState();
  };

  // Convert CryptoJS WordArray to Uint8Array
  const wordArrayToUint8Array = (wordArray: any): Uint8Array => {
    const words = wordArray.words;
    const sigBytes = wordArray.sigBytes;
    const u8 = new Uint8Array(sigBytes);
    let write = 0;
    for (let i = 0; i < sigBytes; i++) {
      const byte = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
      u8[write++] = byte;
    }
    return u8;
  };

  const runDecryption = async () => {
    if (!file) return;
    if (!password) {
      setErrorMessage(isAr ? 'برجاء كتابة كلمة المرور الموجهة' : 'Please provide the protection password.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    setTimeout(() => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const fileContents = e.target?.result as string;
          
          // Parse package JSON format
          let metadataPackage: any;
          try {
            metadataPackage = JSON.parse(fileContents);
          } catch (jsonErr) {
            throw new Error(isAr ? 'تنسيق الملف غير سليم، تأكد من اختيار ملف بامتداد .encrypted صحيح' : 'Invalid file package. Please select a genuine .encrypted file output.');
          }

          const { fileName, fileType, cipher } = metadataPackage;
          if (!cipher || !fileName) {
            throw new Error(isAr ? 'البيانات الوصفية مشوهة أو مفككة!' : 'Missing ciphertext or file parameters inside container.');
          }

          // Perform AES decryption
          const decryptedBytes = CryptoJS.AES.decrypt(cipher, password);
          const rawBytes = wordArrayToUint8Array(decryptedBytes);

          // If password is wrong or Decryption breaks, returned bytes will be empty or invalid array sequence
          if (rawBytes.length === 0) {
            throw new Error(isAr ? 'كود الحماية غير صحيح أو الملف مشوه للغايـة!' : 'Incorrect decryption key or corrupted cipher signature.');
          }

          // Create downloaded blob
          const outBlob = new Blob([rawBytes], { type: fileType });
          
          setDecryptedBlob(outBlob);
          setOriginalFileName(fileName);
          setOriginalFileType(fileType);

          // If decodes to image, we can setup URL preview
          if (fileType.startsWith('image/')) {
            const url = URL.createObjectURL(outBlob);
            setPreviewUrl(url);
          }

          setIsProcessing(false);

          if (onAddHistoryItem) {
            onAddHistoryItem({
              action: isAr ? 'فك تشفير ملف آمن' : 'Secure File Decryption',
              fileName: fileName,
              originalSize: file.size,
              processedSize: outBlob.size,
              type: 'security'
            }, outBlob);
          }
        } catch (err: any) {
          console.error(err);
          setErrorMessage(err.message || (isAr ? 'خطأ في معالجة فك التشفير. تأكد من صحة الرقم السري!' : 'Decryption error. Make sure the password key is authentic!'));
          setIsProcessing(false);
        }
      };

      reader.readAsText(file);
    }, 100);
  };

  const handleDownload = () => {
    if (!decryptedBlob) return;
    const a = document.createElement('a');
    a.href = previewUrl || URL.createObjectURL(decryptedBlob);
    a.download = originalFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getMimeIcon = (mime: string) => {
    if (mime.startsWith('image/')) return <ImageIcon className="w-12 h-12 text-purple-500 animate-pulse" />;
    if (mime.startsWith('video/')) return <Video className="w-12 h-12 text-indigo-500 animate-pulse" />;
    if (mime.startsWith('audio/')) return <Music className="w-12 h-12 text-amber-500 animate-pulse" />;
    return <FileText className="w-12 h-12 text-slate-400" />;
  };

  return (
    <div id="file-decryptor" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-5 sm:p-6 shadow-sm space-y-6">
      
      {/* Title */}
      <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-800/80 pb-4">
        <div className="bg-indigo-500/10 p-3 rounded-2xl text-indigo-500">
          <Unlock className="w-6 h-6 rotate-12" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {isAr ? 'فك تشفير الملفات AES-256' : 'AES-256 Client-Side File Decryptor'}
          </h2>
          <p className="text-xs text-slate-400">
            {isAr ? 'ارفع ملفك المشفر (.encrypted)، واكتب الرقم السري لاسترجاع محتويات الملف الأصلي بدقة' : 'Import your .encrypted file, input correct credential key, and restore the original on-device state'}
          </p>
        </div>
      </div>

      {/* Drag & drop */}
      {!file ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500/50 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition text-center min-h-[220px]"
        >
          <FileUp className="w-10 h-10 text-slate-400 mb-3 animate-pulse" />
          <p className="text-sm font-bold text-slate-800 dark:text-white">
            {isAr ? 'اختر أو اسحب ملف الـ .encrypted المحمي' : 'Select or drag protected .encrypted file'}
          </p>
          <p className="text-xs text-slate-450 mt-1">
            {isAr ? 'الملفات المشفرة تتضمن بيانات الحماية المخفية بالداخل وتعمل تماماً في الذاكرة الحرة' : 'On-device client-side secure decrypt block'}
          </p>
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".encrypted"
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 flex items-center justify-between gap-3 text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2.5 truncate">
              <FileCheck className="w-5 h-5 text-indigo-500 shrink-0" />
              <div className="truncate">
                <p className="text-xs font-bold truncate">{file.name}</p>
                <p className="text-[10px] text-slate-400">
                  {isAr ? 'حجم الحزمة المشفرة: ' : 'Package size: '} 
                  {(file.size / 1024 / 1024).toFixed(3)} MB
                </p>
              </div>
            </div>
            <button 
              onClick={clearFile}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-lg cursor-pointer border-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {!decryptedBlob ? (
            <div className="bg-slate-50 dark:bg-slate-800/10 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-4">
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{isAr ? 'الرقم السري لفك التشفير' : 'Decryption cipher password'}</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isAr ? 'اكتب كلمة المرور التي استخدمتها لتشفير الملف' : 'Enter the original secure password'}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl py-2 px-3 text-xs focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Error indicator */}
              {errorMessage && (
                <div className="bg-rose-500/10 text-rose-600 dark:text-rose-400 p-3 rounded-xl border border-rose-500/20 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button 
                  onClick={runDecryption}
                  disabled={isProcessing}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer shadow-sm transition-all border-0 disabled:bg-slate-400"
                >
                  {isProcessing ? (isAr ? 'جاري فك التشفير التحليلي...' : 'Decrypting securely...') : (isAr ? 'بدء فك تشفير الملف' : 'Decrypt File')}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-500/10 dark:bg-emerald-950/20 p-5 rounded-2xl border border-emerald-500/20 space-y-6 text-emerald-800 dark:text-emerald-300">
              
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {isAr ? 'تم استرجاع الملف بنجاح!' : 'Decryption Complete!'}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {isAr 
                      ? 'تم التحقق من بصمة التشفير وقراءة الملف بنجاح تام، الملف جاهز للمعاينة والتنزيل'
                      : 'Decoded successfully from on-device package. Visual preview and download details available below.'}
                  </p>
                </div>
              </div>

              {/* Live Preview section */}
              <div className="bg-white dark:bg-slate-950 rounded-2xl p-4 border border-slate-100 dark:border-slate-850 flex flex-col items-center justify-center min-h-[180px] text-center">
                
                {previewUrl ? (
                  <div className="space-y-2">
                    <img 
                      src={previewUrl} 
                      alt="Decrypted original" 
                      className="max-h-40 rounded-lg mx-auto shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                    <p className="text-[10px] text-slate-405">{isAr ? 'معاينة صورة مدمجة' : 'Decrypted Image Preview'}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getMimeIcon(originalFileType)}
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-white truncate max-w-xs mx-auto">
                        {originalFileName}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400 uppercase mt-1">
                        Mime: {originalFileType || 'unknown'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Stats blocks */}
              <div className="text-xs bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-850 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-450">{isAr ? 'الاسم الأصلي المكتشف:' : 'Original File Name:'}</span>
                  <span className="font-mono text-[10px] text-slate-700 dark:text-white font-bold">{originalFileName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450">{isAr ? 'الحجم بعد فك الضغط:' : 'Restored File Size:'}</span>
                  <span className="font-mono text-[10px] text-slate-700 dark:text-white font-bold">{(decryptedBlob.size / 1024 / 1024).toFixed(3)} MB</span>
                </div>
              </div>

              {/* Download trigger buttons */}
              <div className="flex justify-end gap-2 text-xs pt-1">
                <button
                  onClick={clearFile}
                  className="px-4 py-2 hover:bg-slate-105 text-slate-500 rounded-xl cursor-pointer border-0"
                >
                  {isAr ? 'فك تشفير ملف آخر' : 'Decrypt another'}
                </button>
                <button
                  onClick={handleDownload}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer flex items-center gap-1.5 border-0 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>{isAr ? 'تنزيل وحفظ الملف المسترد' : 'Download Restored File'}</span>
                </button>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
};

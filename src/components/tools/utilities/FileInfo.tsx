
import React, { useState, useRef } from 'react';
import CryptoJS from 'crypto-js';
import { 
  Fingerprint, 
  Binary, 
  Copy, 
  Check, 
  Info,
  Calendar,
  Layers,
  Image as ImageIcon,
  Clock,
  ExternalLink,
  ChevronRight,
  Database,
  Upload,
  FileCheck,
  Cpu
} from 'lucide-react';

interface FileInfoProps {
  lang: 'ar' | 'en';
}

interface FileMetadata {
  name: string;
  extension: string;
  size: number;
  mimeType: string;
  lastModifiedGregorian: string;
  lastModifiedHijri: string;
  width?: number; 
  height?: number; 
  aspectRatio?: string;
  pages?: number; 
  duration?: string; 
  md5: string;
  sha1: string;
  sha256: string;
  sha512: string;
  warnings: string[];
  hexDump: string;
}

export const FileInfo: React.FC<FileInfoProps> = ({ lang }) => {
  const isAr = lang === 'ar';

  const [loading, setLoading] = useState<boolean>(false);
  const [meta, setMeta] = useState<FileMetadata | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Convert arrayBuffer to CryptoJS WordArray helper
  const arrayBufferToWordArray = (ab: ArrayBuffer): CryptoJS.lib.WordArray => {
    const i8a = new Uint8Array(ab);
    const words: number[] = [];
    for (let i = 0; i < i8a.length; i += 4) {
      words.push(
        (i8a[i] << 24) | 
        (i8a[i + 1] << 16) | 
        (i8a[i + 2] << 8) | 
        (i8a[i + 3])
      );
    }
    return CryptoJS.lib.WordArray.create(words, i8a.length);
  };

  const generateHexDump = (buffer: ArrayBuffer): string => {
    const view = new DataView(buffer);
    const limit = Math.min(buffer.byteLength, 256); // first 256 bytes
    let hexLines: string[] = [];

    for (let i = 0; i < limit; i += 16) {
      const offset = i.toString(16).padStart(8, '0');
      
      let hexParts: string[] = [];
      let asciiParts: string[] = [];

      for (let j = 0; j < 16; j++) {
        if (i + j < limit) {
          const byte = view.getUint8(i + j);
          hexParts.push(byte.toString(16).padStart(2, '0'));
          
          if (byte >= 32 && byte <= 126) {
            asciiParts.push(String.fromCharCode(byte));
          } else {
            asciiParts.push('.');
          }
        } else {
          hexParts.push('  ');
          asciiParts.push(' ');
        }
      }

      const formattedHex = hexParts.slice(0, 8).join(' ') + '  ' + hexParts.slice(8).join(' ');
      hexLines.push(`${offset}  ${formattedHex.padEnd(49, ' ')}  |${asciiParts.join('')}|`);
    }

    return hexLines.join('\n');
  };

  const estimatePdfPages = (buffer: ArrayBuffer): number => {
    const textDecoder = new TextDecoder('ascii');
    const chunk = textDecoder.decode(new Uint8Array(buffer));
    
    // Quick search search count in index
    const pageTypeMatches = chunk.match(/\/Type\s*\/Page\b/g);
    if (pageTypeMatches && pageTypeMatches.length > 0) {
      return pageTypeMatches.length;
    }
    
    const countMatch = chunk.match(/\/Count\s+(\d+)/);
    if (countMatch && countMatch[1]) {
      return parseInt(countMatch[1], 10);
    }
    
    return 1;
  };

  // GCD converter helper to find Aspect Ratio simple scale
  const getGcd = (a: number, b: number): number => {
    return b === 0 ? a : getGcd(b, a % b);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const reader = new FileReader();
      
      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
      });

      // hashes
      const wordArray = arrayBufferToWordArray(arrayBuffer);
      const md5 = CryptoJS.MD5(wordArray).toString();
      const sha1 = CryptoJS.SHA1(wordArray).toString();
      const sha256 = CryptoJS.SHA256(wordArray).toString();
      const sha512 = CryptoJS.SHA512(wordArray).toString();

      // Hex Dump
      const hexDump = generateHexDump(arrayBuffer);

      // Date stamp Hijri & Gregorian
      const modDate = new Date(file.lastModified);
      const gregFormatted = modDate.toLocaleString(isAr ? 'ar-EG' : 'en-US');
      
      // Calculate active Hijri Islamic Date using pure Intl JS API
      let hijriFormatted = '';
      try {
        const formatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
        hijriFormatted = formatter.format(modDate);
      } catch (err) {
        hijriFormatted = modDate.toLocaleDateString();
      }

      // Warnings
      const warnings: string[] = [];
      const lowerName = file.name.toLowerCase();
      if (['.exe', '.sh', '.bat', '.js', '.msi', '.vbs', '.cmd'].some(ext => lowerName.endsWith(ext))) {
        warnings.push(isAr ? 'تحذير: هذا الملف تطبيقي أو برمجي قابل للتشغيل المباشر، لا تشغله إن لم تكن تثق بمصدره.' : 'Warning: Executable code payload. Avoid triggering if unverified source.');
      }
      if (file.name.split('.').length > 2) {
        warnings.push(isAr ? 'تنبيه: تم رصد امتداد منوع مزدوج مخفي ومشبوه في التركيب!' : 'Suspicion: Multi-dotted extension spotted. Frequently used to bypass scanners.');
      }

      // Metadata dimensions for images
      let width: number | undefined;
      let height: number | undefined;
      let aspectFormatted = '';
      if (file.type.startsWith('image/')) {
        const img = new Image();
        const objUrl = URL.createObjectURL(file);
        await new Promise<void>((resolve) => {
          img.onload = () => {
            width = img.naturalWidth;
            height = img.naturalHeight;
            const divisor = getGcd(width, height);
            aspectFormatted = `${width / divisor}:${height / divisor}`;
            resolve();
          };
          img.onerror = () => resolve();
          img.src = objUrl;
        });
        URL.revokeObjectURL(objUrl);
      }

      // Duration for audio / video
      let durationStr = '';
      if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
        const media = document.createElement(file.type.startsWith('audio/') ? 'audio' : 'video');
        const objUrl = URL.createObjectURL(file);
        await new Promise<void>((resolve) => {
          media.onloadedmetadata = () => {
            const minutes = Math.floor(media.duration / 60);
            const seconds = Math.floor(media.duration % 60);
            durationStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            resolve();
          };
          media.onerror = () => resolve();
          media.src = objUrl;
        });
        URL.revokeObjectURL(objUrl);
      }

      // Pages for PDFs
      let pagesCount: number | undefined;
      if (file.type === 'application/pdf') {
        pagesCount = estimatePdfPages(arrayBuffer);
      }

      const lastDotIndex = file.name.lastIndexOf('.');

      setMeta({
        name: file.name,
        extension: lastDotIndex !== -1 ? file.name.substring(lastDotIndex + 1).toUpperCase() : 'RAW',
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
        lastModifiedGregorian: gregFormatted,
        lastModifiedHijri: hijriFormatted,
        width,
        height,
        aspectRatio: aspectFormatted,
        pages: pagesCount,
        duration: durationStr,
        md5,
        sha1,
        sha256,
        sha512,
        warnings,
        hexDump
      });
    } catch (err) {
      console.error(err);
      alert(isAr ? 'حدث خطأ أثناء فحص البايتات للملف' : 'Inspection of file buffer failed.');
    } finally {
      setLoading(false);
    }
  };

  const clearInspector = () => {
    setMeta(null);
  };

  return (
    <div id="file-info" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-5 sm:p-6 shadow-sm space-y-6 text-slate-705 dark:text-slate-205">
      
      {/* Title */}
      <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 pb-4">
        <div className="bg-purple-600/10 p-3 rounded-2xl text-purple-600 animate-pulse">
          <Fingerprint className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {isAr ? 'مستعرض معلومات وبصمة الملف المتقدمة' : 'File Integrity Checksum & Forensic Auditor'}
          </h2>
          <p className="text-xs text-slate-400">
            {isAr ? 'ارفع أي ملف لحساب قيمة الهاش التشفيري بالصيغ المعتمدة وعرض هيكل البصمة الست عشري بدقة' : 'Evaluate byte diagnostics, verify cryptographic SHA checksums, and explore early hexadecimal offsets on-device.'}
          </p>
        </div>
      </div>

      {!meta ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFileChange(e as any); }}
          className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-purple-500 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition text-center min-h-[180px]"
        >
          <Upload className="w-8 h-8 text-slate-400 mb-2 animate-bounce" />
          <p className="font-bold">{isAr ? 'ارفع الملف لبدء التحليل الفوري للبصمة' : 'Choose target file to analyze'}</p>
          <p className="text-[10px] text-slate-405 mt-1">{isAr ? 'يدعم الصور، الفيديوهات والمستندات والهاشات المشفرة بالكامل' : 'Processes local sizes, types, and binary layers completely in browser memory'}</p>
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-6 text-xs">
          
          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850">
            <div className="flex items-center gap-2.5 truncate">
              <FileCheck className="w-5 h-5 text-purple-600 shrink-0" />
              <div className="truncate">
                <p className="font-bold truncate">{meta.name}</p>
                <p className="text-[10px] text-slate-400">{formatSize(meta.size)} ({meta.size.toLocaleString()} bytes)</p>
              </div>
            </div>
            
            <button 
              onClick={clearInspector}
              className="py-1 px-3 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-lg cursor-pointer transition font-bold border-0 text-[10px]"
            >
              {isAr ? 'مسح وفحص ملف آخر' : 'Inspect another'}
            </button>
          </div>

          {/* Warning displays */}
          {meta.warnings.length > 0 && (
            <div className="bg-red-500/10 text-rose-600 dark:text-rose-400 p-3.5 rounded-2xl border border-red-500/20 space-y-1 text-[11px] leading-relaxed font-bold">
              {meta.warnings.map((warn, index) => (
                <div key={index} className="flex items-center gap-1.5 justify-end">
                  <span>{warn}</span>
                  <Info className="w-4 h-4 shrink-0" />
                </div>
              ))}
            </div>
          )}

          {/* Metadata properties grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-3">
              <span className="font-bold text-purple-600 block">{isAr ? '📊 خصائص وعلامات الملف العامة:' : '📊 File Parameters:'}</span>
              
              <div className="space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-450">{isAr ? 'نوع الصيغة (Mime):' : 'MIME Format:'}</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-white">{meta.mimeType}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-450">{isAr ? 'تاريخ التحديث (ميلادي):' : 'Gregorian timestamp:'}</span>
                  <span className="font-bold text-slate-700 dark:text-white flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{meta.lastModifiedGregorian}</span>
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-450">{isAr ? 'تاريخ التحديث (هجري):' : 'Islamic Hijri date:'}</span>
                  <span className="font-bold text-slate-700 dark:text-white flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{meta.lastModifiedHijri}</span>
                  </span>
                </div>

                {meta.width && (
                  <div className="flex justify-between">
                    <span className="text-slate-450">{isAr ? 'أبعاد الصورة ونسب العرض:' : 'Image dimensions:'}</span>
                    <span className="font-bold text-purple-600 flex items-center gap-1 font-mono">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>{meta.width}x{meta.height} px ({meta.aspectRatio})</span>
                    </span>
                  </div>
                )}

                {meta.pages && (
                  <div className="flex justify-between">
                    <span className="text-slate-450">{isAr ? 'عدد صفحات مستند الـ PDF:' : 'PDF Pages count:'}</span>
                    <span className="font-bold text-indigo-500 font-mono flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" />
                      <span>{meta.pages} {isAr ? 'صفحات مقدرة' : 'pages estimated'}</span>
                    </span>
                  </div>
                )}

                {meta.duration && (
                  <div className="flex justify-between">
                    <span className="text-slate-450">{isAr ? 'مدة تشغيل الوسائط:' : 'Runtime duration:'}</span>
                    <span className="font-bold text-rose-500 font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{meta.duration} {isAr ? 'دقائق' : 'minutes'}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Cryptographic Checksum values */}
            <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-3.5">
              <span className="font-bold text-purple-600 block">{isAr ? '🔑 الهاشات والتحقق التشفيري (Security Checksums):' : '🔑 Hash Checksums:'}</span>
              
              <div className="space-y-3">
                {[
                  { label: 'MD5', value: meta.md5 },
                  { label: 'SHA-1', value: meta.sha1 },
                  { label: 'SHA-256', value: meta.sha256 },
                  { label: 'SHA-512', value: meta.sha512 }
                ].map((hash) => (
                  <div key={hash.label} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-slate-450">{hash.label}</span>
                      <button 
                        onClick={() => triggerCopy(hash.value, hash.label)}
                        className="text-purple-600 hover:underline flex items-center gap-0.5 cursor-pointer bg-transparent border-0"
                      >
                        {copiedKey === hash.label ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === hash.label ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ القيمة' : 'Copy')}</span>
                      </button>
                    </div>
                    <p className="font-mono text-[9px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-lg select-all break-all overflow-y-auto max-h-12 leading-normal">
                      {hash.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Hex dump view */}
          <div className="bg-slate-950 text-slate-350 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center border-b border-slate-800 pb-1.5 text-[10px] font-bold">
              <span className="text-purple-400 flex items-center gap-1">
                <Binary className="w-3.5 h-3.5 animate-pulse" />
                <span>{isAr ? 'مستعرض هيكلة البيانات الثنائية (Hex Dump - أول 256 بايت):' : 'Forensic Data Layout (Hex Dump - First 256 Bytes):'}</span>
              </span>
              <button 
                onClick={() => triggerCopy(meta.hexDump, 'hexdump')}
                className="text-slate-400 hover:text-white flex items-center gap-0.5 cursor-pointer bg-transparent border-0"
              >
                {copiedKey === 'hexdump' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'hexdump' ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ الـ Hex' : 'Copy Hex')}</span>
              </button>
            </div>

            <pre className="font-mono text-[9px] leading-relaxed overflow-x-auto whitespace-pre select-all text-emerald-400">
              {meta.hexDump}
            </pre>
          </div>

        </div>
      )}

    </div>
  );
};

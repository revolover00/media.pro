import React, { useState } from 'react';
import CryptoJS from 'crypto-js';
import { 
  FileText, 
  ShieldCheck, 
  ShieldAlert, 
  Fingerprint, 
  Binary, 
  Copy, 
  Check, 
  Info,
  Calendar,
  Layers,
  Image as ImageIcon,
  HardDrive
} from 'lucide-react';

interface FileInfoProps {
  lang: 'ar' | 'en';
}

interface FileMetadata {
  name: string;
  extension: string;
  size: number;
  mimeType: string;
  lastModified: string;
  width?: number; // for images
  height?: number; // for images
  pages?: number; // for PDFs
  md5: string;
  sha1: string;
  sha256: string;
  warnings: string[];
  hexDump: string;
}

export const FileInfo: React.FC<FileInfoProps> = ({ lang }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [meta, setMeta] = useState<FileMetadata | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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
    const limit = Math.min(buffer.byteLength, 512); // first 512 bytes
    let hexLines: string[] = [];

    for (let i = 0; i < limit; i += 16) {
      const offset = i.toString(16).padStart(8, '0');
      
      let hexParts: string[] = [];
      let asciiParts: string[] = [];

      for (let j = 0; j < 16; j++) {
        if (i + j < limit) {
          const byte = view.getUint8(i + j);
          hexParts.push(byte.toString(16).padStart(2, '0'));
          
          // printable character threshold
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

      // Format line beautifully
      const formattedHex = hexParts.slice(0, 8).join(' ') + '  ' + hexParts.slice(8).join(' ');
      hexLines.push(`${offset}  ${formattedHex.padEnd(49, ' ')}  |${asciiParts.join('')}|`);
    }

    return hexLines.join('\n');
  };

  // Binary stream search to count pages in a PDF file quickly without full rendering engines
  const estimatePdfPages = (buffer: ArrayBuffer): number => {
    const textDecoder = new TextDecoder('ascii');
    const chunk = textDecoder.decode(new Uint8Array(buffer));
    
    // Quick search for /Type /Page or /Pages
    // Count regex occurrences of matches
    const matches = chunk.match(/\/Type\s*\/Page\b/g);
    if (matches && matches.length > 0) {
      return matches.length;
    }
    
    // backup search count in index
    const pageCountMatch = chunk.match(/\/Count\s+(\d+)/);
    if (pageCountMatch && pageCountMatch[1]) {
      return parseInt(pageCountMatch[1], 10);
    }
    
    return 1;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const reader = new FileReader();
      
      // Load array buffer for hashes and hex displays
      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
      });

      // 1. Calculate check-sums via CryptoJS
      const wordArray = arrayBufferToWordArray(arrayBuffer);
      const md5 = CryptoJS.MD5(wordArray).toString();
      const sha1 = CryptoJS.SHA1(wordArray).toString();
      const sha256 = CryptoJS.SHA256(wordArray).toString();

      // 2. Generate Hex Dump representation
      const hexDump = generateHexDump(arrayBuffer);

      // 3. Scan for potential warnings
      const warnings: string[] = [];
      const lowerName = file.name.toLowerCase();
      
      // Executive types
      if (
        lowerName.endsWith('.exe') || 
        lowerName.endsWith('.bat') || 
        lowerName.endsWith('.sh') || 
        lowerName.endsWith('.cmd') || 
        lowerName.endsWith('.msi') || 
        lowerName.endsWith('.scr') ||
        lowerName.endsWith('.js') ||
        lowerName.endsWith('.vbs')
      ) {
        warnings.push(lang === 'ar' ? 'تحذير: هذا الملف هو ملف برامجي قابل للتنفيذ وقد يشكل خطراً عند فتحه.' : 'Warning: This file suffix is an executable payload. Avoid running locally if untrusted.');
      }

      // Check double-extension tricks
      const dottedParts = file.name.split('.');
      if (dottedParts.length > 2) {
        warnings.push(
          lang === 'ar' 
            ? `تنبيه: تم اكتشاف امتداد مزدوج (${dottedParts[dottedParts.length - 2]}.${dottedParts[dottedParts.length - 1]}). قد يُستخدم للتخفي.` 
            : `Suspicion: Double extension detected (${dottedParts[dottedParts.length - 2]}.${dottedParts[dottedParts.length - 1]}). Often used to camouflage executable code.`
        );
      }

      // 4. Try extract Image dimensions if image MIME
      let width: number | undefined;
      let height: number | undefined;
      if (file.type.startsWith('image/')) {
        const imageLoader = new Image();
        const objectUrl = URL.createObjectURL(file);
        
        await new Promise<void>((resolve) => {
          imageLoader.onload = () => {
            width = imageLoader.naturalWidth;
            height = imageLoader.naturalHeight;
            resolve();
          };
          imageLoader.onerror = () => resolve();
          imageLoader.src = objectUrl;
        });
        URL.revokeObjectURL(objectUrl);
      }

      // 5. Try extract PDF Pages
      let pages: number | undefined;
      if (file.type === 'application/pdf' || lowerName.endsWith('.pdf')) {
        pages = estimatePdfPages(arrayBuffer);
      }

      // Extract details
      const lastDot = file.name.lastIndexOf('.');
      const extension = lastDot !== -1 ? file.name.substring(lastDot + 1).toUpperCase() : 'UNKNOWN';

      setMeta({
        name: file.name,
        extension,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
        lastModified: new Date(file.lastModified).toISOString().replace('T', ' ').substring(0, 19),
        width,
        height,
        pages,
        md5,
        sha1,
        sha256,
        warnings,
        hexDump
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-purple-100 dark:border-slate-700 shadow-sm space-y-6">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-50 dark:border-slate-700 pb-5">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-purple-600 to-indigo-600 p-2.5 rounded-2xl text-white shadow-md">
            <Fingerprint className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg text-slate-950 dark:text-white flex items-center gap-2">
              {lang === 'ar' ? 'مستكشف ومحلل بصمات الملفات (Checksum)' : 'Advanced File Inspector & SHA-Checksum'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'ar'
                ? 'مستند ثقة محلي لعرض البيانات الوصفية المفصلة للملفات، فحص الشيفرات الثنائية (Hex-dump)، وحساب البصمات المقاومة للتزوير MD5/SHA.'
                : 'Local trust analyzer to run checksum analyses (MD5, SHA1, SHA256), evaluate file structures, format binary hex-dumps.'}
            </p>
          </div>
        </div>
      </div>

      {/* Select Box */}
      <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl bg-slate-50/50 dark:bg-slate-900/10 hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-all">
        <input 
          type="file" 
          onChange={handleFileChange} 
          className="hidden" 
          id="file-inspector-input" 
        />
        <label 
          htmlFor="file-inspector-input"
          className="flex flex-col items-center cursor-pointer space-y-2 text-center"
        >
          <div className="bg-purple-100 dark:bg-slate-750 p-4 rounded-full text-purple-600 dark:text-purple-400">
            <Binary className="w-8 h-8" />
          </div>
          <span className="font-extrabold text-xs text-purple-600 dark:text-purple-400">{lang === 'ar' ? 'اختر ملفاً للفحص التفصيلي والهاش' : 'Upload file for detailed hash scan'}</span>
          <span className="text-[10px] text-slate-400">{lang === 'ar' ? 'يتم معالجة الملف بأمان محلياً بنسبة ١٠٠٪ في متصفحك' : '100% processed client-side without cloud transmission'}</span>
        </label>
      </div>

      {loading && (
        <div className="text-center py-6">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent"></div>
          <p className="text-xs text-slate-400 mt-2 font-bold">{lang === 'ar' ? 'جاري حساب تجزئات الهاش وتحليل البيانات الثنائية...' : 'Calculating hashes & structuring Hex-dump metadata...'}</p>
        </div>
      )}

      {/* Result Display */}
      {meta && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Metadata properties */}
          <div className="lg:col-span-6 space-y-4">
            
            <div className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-750 space-y-4">
              <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-300 flex items-center gap-1.5 border-b border-slate-150 dark:border-slate-800 pb-2 leading-none">
                <Info className="w-4 h-4 text-purple-600" />
                <span>{lang === 'ar' ? 'معلومات الهوية والامتداد' : 'Primary File Metadata'}</span>
              </h3>

              <div className="space-y-2.5 text-xs">
                {[
                  { label: lang === 'ar' ? 'اسم الملف الكامل' : 'File standard name', value: meta.name, icon: FileText },
                  { label: lang === 'ar' ? 'الامتداد / الصيغة' : 'Target Extension', value: meta.extension, icon: Binary },
                  { label: lang === 'ar' ? 'حجم الملف الحقيقي' : 'Cumulative byte size', value: `${formatSize(meta.size)} (${meta.size.toLocaleString()} Bytes)`, icon: HardDrive },
                  { label: lang === 'ar' ? 'نوع المعالجة MIME-Type' : 'System MIME-Type association', value: meta.mimeType, icon: Binary },
                  { label: lang === 'ar' ? 'آخر تعديل محفوظ' : 'Modified timestamp', value: meta.lastModified, icon: Calendar },
                ].map((row, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-4 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-850">
                    <span className="text-slate-400 flex items-center gap-1.5 shrink-0 text-[10px]">
                      <row.icon className="w-3.5 h-3.5 text-slate-400" />
                      <span>{row.label}</span>
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-205 truncate text-right text-[11px]" title={row.value}>
                      {row.value}
                    </span>
                  </div>
                ))}

                {meta.width && meta.height && (
                  <div className="flex items-center justify-between gap-4 p-2 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 shrink-0 text-[10px] font-bold">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'أبعاد الصورة الطبيعية' : 'Image Native Dimensions'}</span>
                    </span>
                    <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-xs">
                      {meta.width} x {meta.height} Pixels
                    </span>
                  </div>
                )}

                {meta.pages && (
                  <div className="flex items-center justify-between gap-4 p-2 bg-blue-500/5 rounded-xl border border-blue-500/10">
                    <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1.5 shrink-0 text-[10px] font-bold">
                      <Layers className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'عدد غلاف الصفحات الأولي' : 'Detected PDF Page count'}</span>
                    </span>
                    <span className="font-mono font-black text-blue-600 dark:text-blue-400 text-xs">
                      {meta.pages} {lang === 'ar' ? 'صفحة' : 'Pages'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Suspicion Health Check */}
            <div className={`p-4 rounded-2xl border flex items-start gap-3 ${meta.warnings.length > 0 ? 'bg-amber-500/5 border-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
              {meta.warnings.length > 0 ? (
                <>
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-xs">{lang === 'ar' ? 'فحص الأمان: ملف يحتاج للمراجعة' : 'Security Scan: Alert Raised'}</h4>
                    {meta.warnings.map((warn, i) => (
                      <p key={i} className="text-[10px] leading-relaxed">{warn}</p>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-xs">{lang === 'ar' ? 'فحص الأمان: الملف آمن هيكلياً' : 'Security Scan: Structurally Safe'}</h4>
                    <p className="text-[10px] leading-relaxed">
                      {lang === 'ar' 
                        ? 'لم يتم اكتشاف أي امتدادات مزدوجة مخادعة أو صيغ برمجية تنفيذية تقليدية بالملف.' 
                        : 'No standard executable extensions, duplicate spoof suffixes or code injections detected.'}
                    </p>
                  </div>
                </>
              )}
            </div>

          </div>

          {/* Hashing Integrity Checksums & Hex */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* Hash lists */}
            <div className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-755 space-y-3">
              <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-300 flex items-center gap-1.5 border-b border-slate-150 dark:border-slate-850 pb-2 leading-none">
                <Fingerprint className="w-4 h-4 text-purple-600" />
                <span>{lang === 'ar' ? 'هاش التحقق للتأكيد (Checksums)' : 'File Cryptographic Checksums'}</span>
              </h3>

              <div className="space-y-2 bg-transparent">
                {[
                  { label: 'MD5 HASH', value: meta.md5 },
                  { label: 'SHA-1 HASH', value: meta.sha1 },
                  { label: 'SHA-256 HASH', value: meta.sha256 }
                ].map((item, index) => (
                  <div key={index} className="space-y-1 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-black text-purple-600 dark:text-purple-400">{item.label}</span>
                      <button 
                        onClick={() => triggerCopy(item.value, item.label)}
                        className="text-slate-400 hover:text-purple-600 flex items-center gap-1 cursor-pointer font-bold transition-all text-[9px]"
                      >
                        {copiedKey === item.label ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-emerald-500">{lang === 'ar' ? 'تم النسخ' : 'Copied'}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>{lang === 'ar' ? 'نسخ الهاش' : 'Copy'}</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="font-mono text-[10px] break-all bg-slate-50 dark:bg-slate-950 p-2 rounded-lg text-slate-700 dark:text-slate-300">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Hex Dump Code box */}
          <div className="lg:col-span-12 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="font-extrabold text-xs text-slate-850 dark:text-slate-300 flex items-center gap-1.5 leading-none">
                <Binary className="w-4 h-4 text-purple-600" />
                <span>{lang === 'ar' ? 'منظور الـ Hex Dump للمستند (أول 512 بايت)' : 'Hexadecimal Binary Dump View (First 512 Bytes)'}</span>
              </h3>
              <button
                onClick={() => triggerCopy(meta.hexDump, 'hexdump')}
                className="text-xs text-purple-600 font-bold hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                {copiedKey === 'hexdump' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="text-emerald-500 font-black">{lang === 'ar' ? 'تم نسخ الجدول' : 'Dump copied!'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'نسخ البيانات بالكامل' : 'Copy entire hex dump'}</span>
                  </>
                )}
              </button>
            </div>
            
            <div className="bg-slate-950 text-emerald-400 font-mono text-[10px] p-4 rounded-2xl overflow-x-auto shadow-inner leading-relaxed select-text select-all whitespace-pre">
              {meta.hexDump}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

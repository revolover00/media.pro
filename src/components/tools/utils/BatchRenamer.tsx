import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Trash2, 
  Download, 
  CheckCircle2, 
  Sparkles, 
  Settings, 
  Calendar, 
  CaseSensitive, 
  Plus, 
  RefreshCw,
  Eye,
  Sliders,
  Type
} from 'lucide-react';
import JSZip from 'jszip';

interface BatchRenamerProps {
  lang: 'ar' | 'en';
  onAddHistoryItem?: (
    itemData: { action: string; fileName: string; originalSize: number; processedSize: number; type: 'pdf' | 'image' },
    blob: Blob,
    originalBlobOrUrl: Blob | string
  ) => void;
}

interface FileRenamingItem {
  id: string;
  originalName: string;
  originalExtension: string;
  originalSize: number;
  newName: string;
  file: File;
}

export const BatchRenamer: React.FC<BatchRenamerProps> = ({ lang, onAddHistoryItem }) => {
  const [files, setFiles] = useState<FileRenamingItem[]>([]);
  const [namingPattern, setNamingPattern] = useState<'fixed_serial' | 'date_name' | 'replace' | 'remove' | 'case'>('fixed_serial');
  
  // Pattern Parameters
  const [fixedText, setFixedText] = useState<string>('file');
  const [startIndex, setStartIndex] = useState<number>(1);
  const [paddingDigits, setPaddingDigits] = useState<number>(3);
  
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dateSeparator, setDateSeparator] = useState<string>('-');
  const [datePos, setDatePos] = useState<'before' | 'after'>('before');

  const [textToReplace, setTextToReplace] = useState<string>('');
  const [replacementText, setReplacementText] = useState<string>('');
  
  const [textToRemove, setTextToRemove] = useState<string>('');
  
  const [caseMode, setCaseMode] = useState<'upper' | 'lower' | 'title'>('upper');
  
  const [prefix, setPrefix] = useState<string>('');
  const [suffix, setSuffix] = useState<string>('');
  
  const [zipProcessing, setZipProcessing] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const newItems: FileRenamingItem[] = Array.from(selectedFiles).map((file: File) => {
      const lastDotIndex = file.name.lastIndexOf('.');
      const originalName = lastDotIndex !== -1 ? file.name.substring(0, lastDotIndex) : file.name;
      const originalExtension = lastDotIndex !== -2 && lastDotIndex !== -1 ? file.name.substring(lastDotIndex + 1) : '';

      return {
        id: 'ren_' + Math.random().toString(36).substring(2, 9),
        originalName,
        originalExtension,
        originalSize: file.size,
        newName: file.name,
        file
      };
    });

    setFiles((prev) => [...prev, ...newItems]);
  };

  const getPaddedNumber = (num: number, digits: number): string => {
    let str = num.toString();
    while (str.length < digits) {
      str = '0' + str;
    }
    return str;
  };

  // Live recalculate preview names whenever files or naming rules change
  useEffect(() => {
    if (files.length === 0) return;

    const updated = files.map((item, idx) => {
      let finalName = item.originalName;

      // 1. Apply core naming patterns
      if (namingPattern === 'fixed_serial') {
        const serialNum = startIndex + idx;
        const formattedNum = getPaddedNumber(serialNum, paddingDigits);
        finalName = `${fixedText}_${formattedNum}`;
      } else if (namingPattern === 'date_name') {
        if (datePos === 'before') {
          finalName = `${customDate}${dateSeparator}${item.originalName}`;
        } else {
          finalName = `${item.originalName}${dateSeparator}${customDate}`;
        }
      } else if (namingPattern === 'replace') {
        if (textToReplace) {
          // Global case-insensitive match/replace
          const regex = new RegExp(textToReplace, 'gi');
          finalName = item.originalName.replace(regex, replacementText);
        }
      } else if (namingPattern === 'remove') {
        if (textToRemove) {
          const regex = new RegExp(textToRemove, 'gi');
          finalName = item.originalName.replace(regex, '');
        }
      } else if (namingPattern === 'case') {
        if (caseMode === 'upper') {
          finalName = item.originalName.toUpperCase();
        } else if (caseMode === 'lower') {
          finalName = item.originalName.toLowerCase();
        } else if (caseMode === 'title') {
          finalName = item.originalName
            .split(/[\s_-]+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        }
      }

      // 2. Add custom general Prefix & Suffix
      if (prefix) {
        finalName = `${prefix}${finalName}`;
      }
      if (suffix) {
        finalName = `${finalName}${suffix}`;
      }

      // Restore extension
      const fullNewName = item.originalExtension ? `${finalName}.${item.originalExtension}` : finalName;

      return {
        ...item,
        newName: fullNewName
      };
    });

    // Check if names changed before triggering state update to prevent cycle loop
    const hasChanges = updated.some((item, index) => item.newName !== files[index].newName);
    if (hasChanges) {
      setFiles(updated);
    }
  }, [
    files.length, // check count
    namingPattern,
    fixedText,
    startIndex,
    paddingDigits,
    customDate,
    dateSeparator,
    datePos,
    textToReplace,
    replacementText,
    textToRemove,
    caseMode,
    prefix,
    suffix
  ]);

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleClearAll = () => {
    setFiles([]);
  };

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const downloadAllAsZip = async () => {
    if (files.length === 0) return;

    setZipProcessing(true);
    try {
      const zip = new JSZip();
      
      files.forEach((item) => {
        zip.file(item.newName, item.file);
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      
      if (onAddHistoryItem) {
        let totalBytes = files.reduce((acc, f) => acc + f.originalSize, 0);
        onAddHistoryItem(
          {
            action: lang === 'ar' ? 'إعادة تسمية دفعة ملفات' : 'Batch Rename Files',
            fileName: `renamed_files_${Date.now()}.zip`,
            originalSize: totalBytes,
            processedSize: blob.size,
            type: 'pdf'
          },
          blob,
          ''
        );
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `renamed_batch_${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToastMsg(lang === 'ar' ? 'تم تنزيل جميع الملفات بالأسماء الجديدة!' : 'Zip with renamed files saved!');
    } catch (err) {
      console.error(err);
      showToastMsg(lang === 'ar' ? 'عذراً، حدث خطأ أثناء تشكيل ملف ZIP.' : 'Error structuring ZIP output.');
    } finally {
      setZipProcessing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-purple-100 dark:border-slate-700 shadow-sm space-y-6">
      
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-900 border border-purple-500/30 text-white py-3 px-5 rounded-2xl shadow-xl animate-slideIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold leading-none">{toast}</span>
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-50 dark:border-slate-700 pb-5">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-purple-600 to-indigo-600 p-2.5 rounded-2xl text-white shadow-md">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg text-slate-950 dark:text-white flex items-center gap-2">
              {lang === 'ar' ? 'أداة إعادة تسمية الملفات دفعة واحدة' : 'Bulk Batch File Renamer'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'ar'
                ? 'تحكم متكامل في تعديل وتعديم وتغيير أسماء عشرات الملفات دفعة واحدة بأنماط تسلسلية مرنة محلياً.'
                : 'Powerful local batch renaming utility to configure flexible templates, counters, case formats, date hooks.'}
            </p>
          </div>
        </div>
      </div>

      {/* Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Patterns setup */}
        <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 space-y-5">
          <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-350 flex items-center gap-1.5 pb-2 border-b border-slate-200 dark:border-slate-750">
            <Settings className="w-4 h-4 text-purple-600" />
            <span>{lang === 'ar' ? 'أنماط التسمية المتقدمة' : 'Select Renaming Pattern'}</span>
          </h3>

          <div className="grid grid-cols-1 gap-2">
            {[
              { id: 'fixed_serial', labelAr: 'نص ثابت + رقم تسلسلي', labelEn: 'Fixed text + Multi Serial', descAr: 'مثال: picture_001.jpg', descEn: 'e.g. image_001.png' },
              { id: 'date_name', labelAr: 'إضافة التاريخ المخصص', labelEn: 'Date + Filename stamp', descAr: 'مثال: 2026-06-14_photo.jpg', descEn: 'e.g. 2026-06-14_document.pdf' },
              { id: 'replace', labelAr: 'استبدال نص محدد', labelEn: 'Replace specific letters', descAr: 'يستبدل جزء من الاسم بنص آخر', descEn: 'Changes sub-words dynamic matches' },
              { id: 'remove', labelAr: 'إزالة نص محدد', labelEn: 'Strip specific words', descAr: 'يحذف عبارات محددة من الاسم', descEn: 'Strips out certain blocks from names' },
              { id: 'case', labelAr: 'تغيير حالة الأحرف', labelEn: 'Case modifier (Upper/Lower)', descAr: 'للأحرف الإنجليزية (كبير/صغير)', descEn: 'Modifies capitalize formats' }
            ].map((pattern) => (
              <button
                key={pattern.id}
                onClick={() => setNamingPattern(pattern.id as any)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col gap-1 ${namingPattern === pattern.id ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-750'}`}
              >
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-250">
                  {lang === 'ar' ? pattern.labelAr : pattern.labelEn}
                </span>
                <span className="text-[10px] text-slate-400">
                  {lang === 'ar' ? pattern.descAr : pattern.descEn}
                </span>
              </button>
            ))}
          </div>

          {/* Dynamic Configuration Params Block */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-750 space-y-4">
            
            {namingPattern === 'fixed_serial' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">{lang === 'ar' ? 'النص الثابت للاسم:' : 'Fixed string name:'}</label>
                  <input
                    type="text"
                    value={fixedText}
                    onChange={(e) => setFixedText(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-750 text-xs py-2 px-3 rounded-xl text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">{lang === 'ar' ? 'رقم البدء:' : 'Starting index:'}</label>
                    <input
                      type="number"
                      value={startIndex}
                      onChange={(e) => setStartIndex(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-755 text-xs py-2 px-3 rounded-xl font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">{lang === 'ar' ? 'عدد الخانات:' : 'Padding digits:'}</label>
                    <select
                      value={paddingDigits}
                      onChange={(e) => setPaddingDigits(Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-755 text-xs py-2 px-3 rounded-xl font-mono"
                    >
                      <option value={1}>1 (e.g. 1)</option>
                      <option value={2}>2 (e.g. 01)</option>
                      <option value={3}>3 (e.g. 001)</option>
                      <option value={4}>4 (e.g. 0001)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {namingPattern === 'date_name' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">{lang === 'ar' ? 'التوجيه وسياق التاريخ:' : 'Configure target date:'}</label>
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-750 text-xs py-2 px-3 rounded-xl text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">{lang === 'ar' ? 'الفصل بين الكلمات:' : 'Connector Symbol:'}</label>
                    <input
                      type="text"
                      value={dateSeparator}
                      onChange={(e) => setDateSeparator(e.target.value)}
                      placeholder="_"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-755 text-xs py-2 px-3 rounded-xl font-bold text-center"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">{lang === 'ar' ? 'موضع التاريخ:' : 'Placement position:'}</label>
                    <select
                      value={datePos}
                      onChange={(e) => setDatePos(e.target.value as any)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-755 text-xs py-2 px-3 rounded-xl text-slate-700 dark:text-slate-300"
                    >
                      <option value="before">{lang === 'ar' ? 'قبل الاسم' : 'Before name'}</option>
                      <option value="after">{lang === 'ar' ? 'بعد الاسم' : 'After name'}</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {namingPattern === 'replace' && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">{lang === 'ar' ? 'ابحث عن النص:' : 'Search for:'}</label>
                  <input
                    type="text"
                    value={textToReplace}
                    onChange={(e) => setTextToReplace(e.target.value)}
                    placeholder={lang === 'ar' ? 'صورة' : 'photo'}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-750 text-xs py-2 px-3 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">{lang === 'ar' ? 'استبدل بـ:' : 'Replace with:'}</label>
                  <input
                    type="text"
                    value={replacementText}
                    onChange={(e) => setReplacementText(e.target.value)}
                    placeholder={lang === 'ar' ? 'لقطة_شاشة' : 'snapshot'}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-750 text-xs py-2 px-3 rounded-xl"
                  />
                </div>
              </div>
            )}

            {namingPattern === 'remove' && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">{lang === 'ar' ? 'الكلمة المراد إزالتها وحذفها:' : 'Text to strip:'}</label>
                <input
                  type="text"
                  value={textToRemove}
                  onChange={(e) => setTextToRemove(e.target.value)}
                  placeholder={lang === 'ar' ? 'مسودة' : 'draft'}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-750 text-xs py-2 px-3 rounded-xl"
                />
              </div>
            )}

            {namingPattern === 'case' && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">{lang === 'ar' ? 'نمط الأحرف الإنجليزية:' : 'Roman Case Format:'}</label>
                <select
                  value={caseMode}
                  onChange={(e) => setCaseMode(e.target.value as any)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-750 text-xs py-2.5 px-3 rounded-xl"
                >
                  <option value="upper">UPPERCASE (e.g. NAME)</option>
                  <option value="lower">lowercase (e.g. name)</option>
                  <option value="title">Title Case (e.g. Name Document File)</option>
                </select>
              </div>
            )}

            {/* General optional Prefix / Suffix sliders */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-750">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400">{lang === 'ar' ? 'بادئة اختيارية (Prefix):' : 'General Prefix:'}</label>
                <input
                  type="text"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  placeholder="v1_"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-750 text-xs py-1.5 px-3 rounded-xl font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400">{lang === 'ar' ? 'لاحقة اختيارية (Suffix):' : 'General Suffix:'}</label>
                <input
                  type="text"
                  value={suffix}
                  onChange={(e) => setSuffix(e.target.value)}
                  placeholder="_final"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-750 text-xs py-1.5 px-3 rounded-xl font-mono"
                />
              </div>
            </div>

          </div>

        </div>

        {/* Right Side: Upload and Live Previews layout */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-wrap gap-2.5 items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="file"
                multiple
                onChange={handleFilesSelected}
                className="hidden"
                id="batch-ren-picker"
              />
              <label
                htmlFor="batch-ren-picker"
                className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white font-extrabold py-2.5 px-5 rounded-2xl text-xs cursor-pointer shadow transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === 'ar' ? 'تحميل مجموعة ملفات' : 'Upload Multi Files'}</span>
              </label>

              {files.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-xs text-red-500 font-bold hover:underline cursor-pointer"
                >
                  {lang === 'ar' ? 'تفريغ المعرض' : 'Reset all'}
                </button>
              )}
            </div>

            {files.length > 0 && (
              <button
                onClick={downloadAllAsZip}
                disabled={zipProcessing}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-2.5 px-5 rounded-2xl text-xs cursor-pointer shadow disabled:opacity-50 transition-colors"
              >
                {zipProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>{lang === 'ar' ? 'تحميل الأسماء الجديدة كـ ZIP' : 'Download Renamed ZIP'}</span>
              </button>
            )}
          </div>

          {files.length > 0 ? (
            <div className="border border-slate-150 dark:border-slate-800 rounded-3xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/20 max-h-[460px] overflow-y-auto">
              {files.map((item, index) => (
                <div 
                  key={item.id}
                  className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 hover:bg-white dark:hover:bg-slate-900/50 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="bg-purple-50 dark:bg-slate-750 p-2 rounded-xl text-purple-600 dark:text-purple-400 shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono py-0.5 px-2 rounded-md">
                          #{index + 1}
                        </span>
                        <h4 className="font-medium text-xs text-slate-400 truncate max-w-[220px]" title={item.originalName}>
                          {item.originalName}.{item.originalExtension}
                        </h4>
                      </div>
                      
                      {/* Interactive new name display */}
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 leading-none">
                        <Eye className="w-3.5 h-3.5" />
                        <span className="font-extrabold text-xs break-all" title={item.newName}>
                          {item.newName}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveFile(item.id)}
                    className="text-slate-400 hover:text-red-500 self-center cursor-pointer p-1"
                    title={lang === 'ar' ? 'إزالة' : 'Remove'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/10 rounded-3xl border border-dashed border-slate-200 dark:border-slate-750">
              <Sliders className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-650 mb-3" />
              <h3 className="font-bold text-xs text-slate-705 dark:text-slate-400">{lang === 'ar' ? 'لا توجد ملفات معدة لإعادة التسمية' : 'No Files Staged for Renaming'}</h3>
              <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto">
                {lang === 'ar' ? 'قم بإضافة ملفات (مستندات، صور، فيديوهات) لفهرستها وإعادة تسميتها في ثوانٍ.' : 'Supports drag-and-drop or batch file selections of any generic type.'}
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

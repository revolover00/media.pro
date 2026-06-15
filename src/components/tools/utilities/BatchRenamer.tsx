
import React, { useState, useEffect } from 'react';
import { 
  FolderSync, 
  Trash2, 
  Download, 
  CheckCircle, 
  Sparkles, 
  Settings, 
  Calendar, 
  CaseSensitive, 
  Plus, 
  RefreshCw,
  Eye,
  Sliders,
  Type,
  Upload,
  FileCheck
} from 'lucide-react';
import JSZip from 'jszip';

interface BatchRenamerProps {
  lang: 'ar' | 'en';
  onAddHistoryItem?: (item: any, blob?: Blob) => void;
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
  const isAr = lang === 'ar';

  const [files, setFiles] = useState<FileRenamingItem[]>([]);
  const [namingPattern, setNamingPattern] = useState<'fixed_serial' | 'date_name' | 'replace' | 'remove' | 'case'>('fixed_serial');
  
  // Pattern Parameters
  const [fixedText, setFixedText] = useState<string>('photo');
  const [startIndex, setStartIndex] = useState<number>(1);
  const [paddingDigits, setPaddingDigits] = useState<number>(3);
  
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dateSeparator, setDateSeparator] = useState<string>('_');
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
      const originalExtension = lastDotIndex !== -1 ? file.name.substring(lastDotIndex + 1) : '';

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

      // Apply patterns
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

      // Add custom Prefix & Suffix
      if (prefix) finalName = `${prefix}${finalName}`;
      if (suffix) finalName = `${finalName}${suffix}`;

      // Restore extension
      const fullNewName = item.originalExtension ? `${finalName}.${item.originalExtension}` : finalName;

      return {
        ...item,
        newName: fullNewName
      };
    });

    // Prevent trigger looping
    const hasChanges = updated.some((item, index) => item.newName !== files[index].newName);
    if (hasChanges) {
      setFiles(updated);
    }
  }, [
    files.length, 
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

  const downloadAllAsZip = async () => {
    if (files.length === 0) return;

    setZipProcessing(true);
    try {
      const zip = new JSZip();
      files.forEach((item) => {
        zip.file(item.newName, item.file);
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fileforge_renamed_batch_${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (onAddHistoryItem) {
        onAddHistoryItem({
          action: isAr ? 'إعادة تسمية دفعة ملفات' : 'Batch Bulk Renaming',
          fileName: `${files.length}_files_renamed.zip`,
          originalSize: files.reduce((acc, c) => acc + c.originalSize, 0),
          processedSize: blob.size,
          type: 'other'
        });
      }

      setToast(isAr ? 'تم حفظ التعديلات وتنزيل الكود!' : 'Renamed files packaged and downloaded successfully!');
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error(err);
      alert(isAr ? 'حدث خطأ في توليد الملف ZIP' : 'ZIP compilation failed.');
    } finally {
      setZipProcessing(false);
    }
  };

  return (
    <div id="batch-renamer" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-5 sm:p-6 shadow-sm space-y-6 text-slate-705 dark:text-slate-200">
      
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-900 text-white py-2 px-4 rounded-xl shadow-lg text-xs font-bold animate-slideUp">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header layout */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-50 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 p-3 rounded-2xl text-emerald-600">
            <FolderSync className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isAr ? 'محرر معالجة وتعديل أسماء الملفات دفعة واحدة' : 'Advanced Batch File Renamer'}
            </h2>
            <p className="text-xs text-slate-400">
              {isAr ? 'أعد تسمية مئات الصور أو الملفات في ثانية بالتناسب الرقمي المتسلسل والتاريخ بذكاء' : 'Formulate advanced renaming architectures, indices, prefixes and download ZIP packages instantly.'}
            </p>
          </div>
        </div>

        {files.length > 0 && (
          <button 
            onClick={handleClearAll}
            className="text-xs font-bold text-rose-500 hover:underline border-0 bg-transparent cursor-pointer"
          >
            {isAr ? 'مسح الكل' : 'Clear list'}
          </button>
        )}
      </div>

      {/* Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
        
        {/* Configurations column */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-4">
            
            <div className="space-y-1.5">
              <span className="font-bold text-slate-500 block">{isAr ? 'نمط وهيكلية إعادة التسمية:' : 'Structure & Sequence style:'}</span>
              <div className="grid grid-cols-2 gap-1.5 font-bold">
                {[
                  { id: 'fixed_serial', label: isAr ? 'نص مخصص + رقم متسلسل' : 'Fixed + Counter' },
                  { id: 'date_name', label: isAr ? 'إلحاق التاريخ واليوم' : 'Calendar + Name' },
                  { id: 'replace', label: isAr ? 'البحث والاستبدال' : 'Find & Replace' },
                  { id: 'remove', label: isAr ? 'إزالة نص محدد' : 'Strip exact text' },
                  { id: 'case', label: isAr ? 'حالة الأحرف بالإنجليزية' : 'Alphabet Case' }
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => setNamingPattern(p.id as any)}
                    className={`py-2 px-3 rounded-xl border text-center transition cursor-pointer text-[10px] ${namingPattern === p.id ? 'bg-slate-900 text-white dark:bg-slate-800 border-slate-900' : 'bg-white dark:bg-slate-900 border-slate-105 text-slate-500'}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pattern Inputs controls */}
            {namingPattern === 'fixed_serial' && (
              <div className="space-y-3.5 border-t pt-3 border-slate-150 dark:border-slate-850">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1.5 space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">{isAr ? 'النص لافتراضي' : 'Base Text'}</label>
                    <input 
                      type="text"
                      value={fixedText}
                      onChange={(e) => setFixedText(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">{isAr ? 'البدء من' : 'Index Starts'}</label>
                    <input 
                      type="number"
                      value={startIndex}
                      onChange={(e) => setStartIndex(parseInt(e.target.value) || 1)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">{isAr ? 'خانات الأرقام' : 'Padding Digits'}</label>
                    <input 
                      type="number"
                      value={paddingDigits}
                      onChange={(e) => setPaddingDigits(parseInt(e.target.value) || 3)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2"
                    />
                  </div>
                </div>
              </div>
            )}

            {namingPattern === 'date_name' && (
              <div className="grid grid-cols-3 gap-3 border-t pt-3 border-slate-150 dark:border-slate-850">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">{isAr ? 'التاريخ' : 'Date stamp'}</label>
                  <input 
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 rounded-lg p-1.5"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">{isAr ? 'الفاصل' : 'Separator'}</label>
                  <input 
                    type="text"
                    value={dateSeparator}
                    onChange={(e) => setDateSeparator(e.target.value)}
                    className="w-full bg-white dark:bg-slate-905 border border-slate-200 rounded-lg p-1.5"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">{isAr ? 'الموضع' : 'Placement'}</label>
                  <select 
                    value={datePos}
                    onChange={(e: any) => setDatePos(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 rounded-lg p-1.5 cursor-pointer"
                  >
                    <option value="before">{isAr ? 'قبل الاسم' : 'Before name'}</option>
                    <option value="after">{isAr ? 'بعد الاسم' : 'After name'}</option>
                  </select>
                </div>
              </div>
            )}

            {namingPattern === 'replace' && (
              <div className="grid grid-cols-2 gap-3 border-t pt-3 border-slate-150">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">{isAr ? 'البحث عن نص' : 'Text to match'}</label>
                  <input 
                    type="text"
                    value={textToReplace}
                    onChange={(e) => setTextToReplace(e.target.value)}
                    placeholder="e.g. img_"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-201 rounded-lg p-2"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">{isAr ? 'استبدال بـ' : 'Replace with'}</label>
                  <input 
                    type="text"
                    value={replacementText}
                    onChange={(e) => setReplacementText(e.target.value)}
                    placeholder="e.g. holiday_"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-201 rounded-lg p-2"
                  />
                </div>
              </div>
            )}

            {namingPattern === 'remove' && (
              <div className="space-y-1 border-t pt-3 border-slate-150">
                <label className="text-[10px] uppercase font-bold text-slate-400">{isAr ? 'إزالة السلسلة المحددة' : 'Wipe exact string match'}</label>
                <input 
                  type="text"
                  value={textToRemove}
                  onChange={(e) => setTextToRemove(e.target.value)}
                  placeholder="e.g. Copy_"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-201 rounded-lg p-2"
                />
              </div>
            )}

            {namingPattern === 'case' && (
              <div className="space-y-1 border-t pt-3 border-slate-150">
                <label className="text-[10px] uppercase font-bold text-slate-400">{isAr ? 'تحويل حالة الأحرف:' : 'Character casing mode:'}</label>
                <div className="grid grid-cols-3 gap-1 grid-flow-row text-[10px]">
                  <button 
                    onClick={() => setCaseMode('upper')}
                    className={`p-1.5 border rounded-lg cursor-pointer ${caseMode === 'upper' ? 'bg-slate-900 text-white' : 'bg-white'}`}
                  >UPPERCASE</button>
                  <button 
                    onClick={() => setCaseMode('lower')}
                    className={`p-1.5 border rounded-lg cursor-pointer ${caseMode === 'lower' ? 'bg-slate-900 text-white' : 'bg-white'}`}
                  >lowercase</button>
                  <button 
                    onClick={() => setCaseMode('title')}
                    className={`p-1.5 border rounded-lg cursor-pointer ${caseMode === 'title' ? 'bg-slate-900 text-white' : 'bg-white'}`}
                  >Title Case</button>
                </div>
              </div>
            )}

            {/* Custom general prefix and suffix add-ons */}
            <div className="grid grid-cols-2 gap-3 border-t pt-3 border-slate-150 font-sans">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">{isAr ? 'إضافة بادئة' : 'Add Prefix prefix'}</label>
                <input 
                  type="text"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  placeholder="e.g. pre_"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-201 rounded-lg p-2"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">{isAr ? 'إضافة لاحقة' : 'Add Suffix suffix'}</label>
                <input 
                  type="text"
                  value={suffix}
                  onChange={(e) => setSuffix(e.target.value)}
                  placeholder="e.g. _post"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-201 rounded-lg p-2"
                />
              </div>
            </div>

          </div>

          <div 
            onClick={() => document.getElementById('ren-file-input')?.click()}
            className="border-2 border-dashed border-slate-250 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl p-6 text-center cursor-pointer flex flex-col items-center justify-center hover:border-emerald-500 transition"
          >
            <Upload className="w-8 h-8 text-slate-400 mb-2 animate-bounce" />
            <p className="font-bold">{isAr ? 'أضف المزيد من الملفات للدفعة' : 'Select additional files to catalog'}</p>
            <input 
              type="file"
              id="ren-file-input"
              multiple
              onChange={handleFilesSelected}
              className="hidden"
            />
          </div>

          {files.length > 0 && (
            <button
              onClick={downloadAllAsZip}
              disabled={zipProcessing}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer border-0 shadow text-xs"
            >
              {zipProcessing ? (isAr ? 'جاري تعبئة الـ ZIP...' : 'Assembling ZIP bundle...') : (isAr ? 'تنزيل وحفظ كافة الملفات الجاهزة' : 'Process and Download Re-indexed ZIP')}
            </button>
          )}

        </div>

        {/* Live previewing lists */}
        <div className="lg:col-span-7 space-y-4">
          <span className="font-bold text-slate-400 block">{isAr ? 'معاينة حية للمسميات الجديدة:' : 'Live sequential naming preview:'}</span>
          
          {files.length > 0 ? (
            <div className="border border-slate-100 dark:border-slate-850 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-950 max-h-[440px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-900 text-slate-500 border-b border-slate-150-inset font-bold">
                    <th className="p-2.5 text-right">{isAr ? 'الاسم الأصلي المرفوع' : 'Original file name'}</th>
                    <th className="p-2.5 text-right">{isAr ? 'الاسم الجديد بعد التعديل' : 'Updated file name'}</th>
                    <th className="p-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-200/20 text-slate-650">
                      <td className="p-2.5 truncate max-w-[150px] font-mono text-right font-medium">
                        {item.originalName}.{item.originalExtension}
                      </td>
                      <td className="p-2.5 truncate max-w-[150px] font-mono text-right text-emerald-600 font-bold dark:text-emerald-400">
                        {item.newName}
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          onClick={() => handleRemoveFile(item.id)}
                          className="p-1 hover:bg-rose-50 rounded text-rose-500 border-0 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="border border-slate-150 dark:border-slate-850 rounded-2xl p-16 text-center text-slate-400 bg-slate-50/50 dark:bg-slate-950/10">
              <FolderSync className="w-12 h-12 text-slate-300 dark:text-slate-800 mx-auto mb-2" />
              <p>{isAr ? 'ارفع الصور أو التقارير لاستعراض التسمية التلقائية الحرة' : 'Upload document rows or photos to watch reactive calculations'}</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

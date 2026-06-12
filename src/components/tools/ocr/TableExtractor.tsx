import React, { useState, useEffect } from 'react';
import { 
  Table as TableIcon, 
  Trash2, 
  Copy, 
  Check, 
  Download, 
  RefreshCw, 
  Plus, 
  Minus, 
  FileSpreadsheet, 
  Grid,
  FileCode,
  FileDown
} from 'lucide-react';
import { UploadZone } from '../../UploadZone';
import Tesseract from 'tesseract.js';
import { HistoryItem } from '../../../types';
import * as XLSX from 'xlsx';

interface TableExtractorProps {
  lang: 'ar' | 'en';
  onAddHistoryItem: (item: Omit<HistoryItem, 'id' | 'timestamp' | 'downloadUrl'>, blob: Blob) => string;
}

export const TableExtractor: React.FC<TableExtractorProps> = ({ lang, onAddHistoryItem }) => {
  const isAr = lang === 'ar';
  
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [progressVal, setProgressVal] = useState<number>(0);
  const [ocrLang, setOcrLang] = useState<string>('ara+eng');

  // Interactive grid state
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  }, [filePreview]);

  const handleFileDrop = (files: File[]) => {
    if (files.length > 0) {
      const selected = files[0];
      setFile(selected);
      setFilePreview(URL.createObjectURL(selected));
      setHeaders([]);
      setRows([]);
      setProgressVal(0);
      setProgressStatus('');
    }
  };

  const handleReset = () => {
    setFile(null);
    setFilePreview('');
    setHeaders([]);
    setRows([]);
    setProgressVal(0);
    setProgressStatus('');
  };

  // Tesseract OCR and grid structured text parser
  const handleExtractTable = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgressVal(0);
    setProgressStatus(isAr ? 'جاري تهيئة محلل الجداول...' : 'Initializing table analyzer...');

    try {
      const result = await Tesseract.recognize(
        file,
        ocrLang,
        {
          logger: (m) => {
            if (m && typeof m === 'object') {
              if (m.status === 'recognizing text') {
                setProgressStatus(isAr ? `جاري قراءة أحجام وأرقام الجدول... ${Math.round(m.progress * 100)}%` : `Analyzing table rows & boundaries... ${Math.round(m.progress * 100)}%`);
                setProgressVal(Math.round(m.progress * 100));
              }
            }
          }
        }
      );

      if (result && result.data) {
        const text = result.data.text || '';
        const lines = text.split('\n')
          .map(l => l.trim())
          .filter(l => l.length > 0);

        // Smart delimiter identification: Split columns by pipe, multiple spaces (2+), or tab
        const parsedRows = lines.map(line => {
          let columns: string[] = [];
          if (line.includes('|')) {
            columns = line.split('|').map(c => c.trim()).filter(c => c.length > 0);
          } else if (line.includes('\t')) {
            columns = line.split('\t').map(c => c.trim());
          } else {
            // Split by 2 or more consecutive spaces
            columns = line.split(/\s{2,}/).map(c => c.trim());
          }
          return columns;
        }).filter(row => row.length > 0);

        if (parsedRows.length > 0) {
          // Identify maximum columns count
          const maxCols = Math.max(...parsedRows.map(r => r.length));
          
          // Make sure every row matches max values for cell grid
          const normalizedRows = parsedRows.map(row => {
            const extraCount = maxCols - row.length;
            if (extraCount > 0) {
              return [...row, ...Array(extraCount).fill('')];
            }
            return row;
          });

          // Set first row as headers, remaining as rows
          const parsedHeaders = normalizedRows[0].map((h, i) => h || (isAr ? `عمود ${i + 1}` : `Col ${i + 1}`));
          const contentRows = normalizedRows.length > 1 ? normalizedRows.slice(1) : [Array(maxCols).fill('')];

          setHeaders(parsedHeaders);
          setRows(contentRows);

          // Add to History list
          const csvText = [parsedHeaders.join(','), ...contentRows.map(r => r.join(','))].join('\n');
          const csvBlob = new Blob([csvText], { type: 'text/csv;charset=utf-8' });
          onAddHistoryItem({
            action: isAr ? 'استخراج جدول من صورة' : 'OCR Table Extractor',
            fileName: `${file.name.split('.')[0]}_extracted.csv`,
            originalSize: file.size,
            processedSize: csvBlob.size,
            type: 'image'
          }, csvBlob);

          setProgressStatus(isAr ? 'اكتمل تحليل الجدول بنجاح!' : 'Table parsed successfully!');
        } else {
          // Empty state fallback helper
          setHeaders([isAr ? 'عمود ١' : 'Col 1', isAr ? 'عمود ٢' : 'Col 2']);
          setRows([['', ''], ['', '']]);
          setProgressStatus(isAr ? 'لم نكتشف مستند منظم، أنشأنا جدول فارغ للتعبئة.' : 'Could not trace cells. Initialized empty slate.');
        }
      }
    } catch (err: any) {
      console.error(err);
      setProgressStatus(isAr ? `خطأ في محرك القياس: ${err.message}` : `Error parsing table: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Editable Table Functions
  const handleCellChange = (rowIndex: number, colIndex: number, val: string) => {
    const updated = [...rows];
    updated[rowIndex][colIndex] = val;
    setRows(updated);
  };

  const handleHeaderChange = (colIndex: number, val: string) => {
    const updated = [...headers];
    updated[colIndex] = val;
    setHeaders(updated);
  };

  const addRow = () => {
    const newRow = Array(headers.length).fill('');
    setRows([...rows, newRow]);
  };

  const deleteRow = (rowIndex: number) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((_, idx) => idx !== rowIndex));
  };

  const addColumn = () => {
    setHeaders([...headers, isAr ? `عمود جديد` : `New Col`]);
    setRows(rows.map(row => [...row, '']));
  };

  const deleteColumn = (colIndex: number) => {
    if (headers.length <= 1) return;
    setHeaders(headers.filter((_, idx) => idx !== colIndex));
    setRows(rows.map(row => row.filter((_, idx) => idx !== colIndex)));
  };

  // Exporters
  const exportToCSV = () => {
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `${file?.name.split('.')[0] || 'table'}_spreadsheet.csv`);
  };

  const exportToExcel = () => {
    const aoa = [headers, ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(aoa);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "TableForge");
    
    // Write as arraybuffer and download
    const xBuf = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([xBuf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    downloadBlob(blob, `${file?.name.split('.')[0] || 'table'}_spreadsheet.xlsx`);
  };

  const exportToJSON = () => {
    const items = rows.map(row => {
      const obj: Record<string, string> = {};
      headers.forEach((header, idx) => {
        obj[header] = row[idx] || '';
      });
      return obj;
    });

    const jsonText = JSON.stringify(items, null, 2);
    const blob = new Blob([jsonText], { type: 'application/json' });
    downloadBlob(blob, `${file?.name.split('.')[0] || 'table'}_data.json`);
  };

  const copyTableToClipboard = () => {
    // Copy spreadsheet readable format (tab-separated rows)
    const tableText = [
      headers.join('\t'),
      ...rows.map(row => row.join('\t'))
    ].join('\n');

    navigator.clipboard.writeText(tableText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadBlob = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6" id="table-extractor-panel">
      {/* Title */}
      <div className="text-center mb-6">
        <div className="inline-flex p-3 bg-emerald-100 text-emerald-600 rounded-full mb-3 shadow-sm">
          <TableIcon className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          {isAr ? 'استخراج الجداول من الصور ذكياً' : 'Smart Image Table Extractor'}
        </h1>
        <p className="mt-2 text-gray-600 max-w-xl mx-auto text-sm sm:text-base">
          {isAr 
            ? 'ارفع أي صورة تحتوي على جداول، أرقام، أو قائمة أسماء. سيقوم المعالج بتحويلها لنموذج خلايا ذكي يمكنك تصفحه وتعديله وتصديره كملف Excel.' 
            : 'Extract, edit, and organize tables embedded inside receipts, scanned layouts, or snapshots. Download in Excel, CSV, or HTML.'}
        </p>
      </div>

      {!file ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {isAr ? 'لغة المستند والجدول:' : 'Table Language Pattern:'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => setOcrLang('ara')}
                className={`py-2 px-3 text-xs sm:text-sm font-medium rounded-xl border transition ${
                  ocrLang === 'ara' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {isAr ? 'العربية' : 'Arabic'}
              </button>
              <button 
                onClick={() => setOcrLang('eng')}
                className={`py-2 px-3 text-xs sm:text-sm font-medium rounded-xl border transition ${
                  ocrLang === 'eng' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {isAr ? 'الإنجليزية' : 'English'}
              </button>
              <button 
                onClick={() => setOcrLang('ara+eng')}
                className={`py-2 px-3 text-xs sm:text-sm font-medium rounded-xl border transition ${
                  ocrLang === 'ara+eng' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {isAr ? 'مزدوج (عربي+إنجليزي)' : 'Mixed (Ar+En)'}
              </button>
            </div>
          </div>
          <UploadZone 
            onFilesSelected={handleFileDrop} 
            accept="image/*"
            multiple={false}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Action buttons and preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-gray-900 text-sm">{isAr ? 'الصورة المحددة' : 'Selected Panel'}</span>
                  <button 
                    onClick={handleReset} 
                    className="text-red-500 hover:text-red-600 text-xs font-semibold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {isAr ? 'حذف' : 'Remove'}
                  </button>
                </div>
                <div className="relative min-h-[140px] max-h-[220px] rounded-xl overflow-hidden border border-gray-150 bg-gray-50 flex items-center justify-center p-2">
                  <img 
                    src={filePreview} 
                    alt="Uploaded Table sheet" 
                    className="max-h-[200px] w-auto object-contain rounded"
                  />
                </div>
              </div>
              
              {!headers.length && (
                <button
                  onClick={handleExtractTable}
                  disabled={isProcessing}
                  className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                  {isProcessing ? (isAr ? 'جاري التحليل واستخراج الأسطر...' : 'Parsing layout...') : (isAr ? 'بدء استخراج خلايا الجدول' : 'Analyze structure')}
                </button>
              )}

              {isProcessing && (
                <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <div className="flex justify-between text-[11px] text-emerald-800 font-bold mb-1">
                    <span>{progressStatus}</span>
                    <span>{progressVal}%</span>
                  </div>
                  <div className="w-full bg-emerald-100 rounded-full h-1.5">
                    <div 
                      className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${progressVal}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Structured Table Exponents & Controls */}
            {headers.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 md:col-span-2 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm sm:text-base">
                    <Grid className="w-5 h-5 text-emerald-600" />
                    <span>{isAr ? 'أدوات التحكم وتعديل الهيكل' : 'Structure Builder Controls'}</span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                    <button
                      onClick={addRow}
                      className="p-2 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 rounded-xl border border-emerald-100 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isAr ? 'إضافة صف' : 'Add Row'}</span>
                    </button>
                    <button
                      onClick={() => deleteRow(rows.length - 1)}
                      className="p-2 bg-rose-50 hover:bg-rose-100/80 text-rose-700 rounded-xl border border-rose-100 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                      <span>{isAr ? 'حذف آخر صف' : 'Delete Last'}</span>
                    </button>
                    <button
                      onClick={addColumn}
                      className="p-2 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 rounded-xl border border-emerald-100 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isAr ? 'إضافة عمود' : 'Add Column'}</span>
                    </button>
                    <button
                      onClick={() => deleteColumn(headers.length - 1)}
                      className="p-2 bg-rose-50 hover:bg-rose-100/80 text-rose-700 rounded-xl border border-rose-100 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                      <span>{isAr ? 'حذف آخر عمود' : 'Delete Col'}</span>
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={exportToExcel}
                    className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Excel (XLSX)</span>
                  </button>
                  <button
                    onClick={exportToCSV}
                    className="p-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>CSV</span>
                  </button>
                  <button
                    onClick={exportToJSON}
                    className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <FileCode className="w-4 h-4" />
                    <span>JSON</span>
                  </button>
                  <button
                    onClick={copyTableToClipboard}
                    className="p-2 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{isAr ? 'نسخ للذاكرة' : 'Copy cells'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Table Interactive Grid Panel */}
          {headers.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 overflow-hidden">
              <h3 className="font-bold text-gray-900 mb-4 text-sm sm:text-base flex items-center justify-between">
                <span>{isAr ? 'مستعرض الخلايا التفاعلي' : 'Interactive Cell Editor'}</span>
                <span className="text-xs text-gray-400 font-medium">
                  {isAr ? '* انقر مباشرة على أي نص/خلية لتعديله فوراً' : '* Click inside any cell to modify on-the-fly'}
                </span>
              </h3>
              
              <div className="overflow-x-auto border border-gray-150 rounded-xl">
                <table className="w-full text-right sm:text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-150">
                      {headers.map((hdr, colIdx) => (
                        <th key={colIdx} className="p-3">
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={hdr}
                              onChange={(e) => handleHeaderChange(colIdx, e.target.value)}
                              className="font-bold text-gray-900 bg-transparent hover:bg-white focus:bg-white border-0 focus:ring-1 focus:ring-emerald-500 rounded p-1 w-full text-xs sm:text-sm text-center"
                            />
                            <button
                              onClick={() => deleteColumn(colIdx)}
                              className="text-gray-400 hover:text-red-500 p-0.5 rounded transition"
                              title={isAr ? 'حذف العمود' : 'Delete Col'}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </th>
                      ))}
                      <th className="p-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, rowIdx) => (
                      <tr key={rowIdx} className="border-b border-gray-100 hover:bg-gray-50/50 transition">
                        {row.map((cell, colIdx) => (
                          <td key={colIdx} className="p-2">
                            <input
                              type="text"
                              value={cell}
                              onChange={(e) => handleCellChange(rowIdx, colIdx, e.target.value)}
                              className="text-gray-800 bg-transparent hover:bg-white focus:bg-white border-none focus:ring-1 focus:ring-emerald-500 rounded p-1 w-full text-xs sm:text-sm"
                            />
                          </td>
                        ))}
                        <td className="p-2 text-center">
                          <button
                            onClick={() => deleteRow(rowIdx)}
                            className="text-gray-400 hover:text-red-500 p-1 rounded transition"
                            title={isAr ? 'حذف الصف' : 'Delete Row'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

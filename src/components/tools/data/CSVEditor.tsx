'use client';

import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Trash2, 
  Plus, 
  ArrowUpDown, 
  Filter, 
  Copy, 
  Download, 
  Check, 
  Search,
  Upload,
  ChevronLeft,
  X,
  FileDown
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface CSVEditorProps {
  lang: 'ar' | 'en';
  onAddHistoryItem?: (item: any, blob?: Blob) => void;
}

export const CSVEditor: React.FC<CSVEditorProps> = ({ lang, onAddHistoryItem }) => {
  const isAr = lang === 'ar';
  
  // Table states
  const [headers, setHeaders] = useState<string[]>(['الاسم (Name)', 'البريد (Email)', 'الوظيفة (Role)', 'الدولة (Country)']);
  const [rows, setRows] = useState<any[][]>([
    ['أحمد محمد', 'ahmed@example.com', 'مطور واجهات', 'مصر'],
    ['سارة أحمد', 'sara@example.com', 'مصممة تجربة المستخدم', 'السعودية'],
    ['جون دو', 'john@example.com', 'مدير المشروع', 'الإمارات'],
    ['فاطمة علي', 'fatima@example.com', 'محللة بيانات', 'الأردن']
  ]);
  
  const [fileName, setFileName] = useState<string>('table_data.csv');
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [searchColumn, setSearchColumn] = useState<number>(-1);
  const [sortConfig, setSortConfig] = useState<{ key: number; direction: 'asc' | 'desc' } | null>(null);
  
  // Toast notifications locally
  const [copiedText, setCopiedText] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });

        if (data.length > 0) {
          const parsedHeaders = data[0].map((h: any) => h ? String(h).trim() : `Column ${Math.random()}`);
          const parsedRows = data.slice(1).map((row: any[]) => {
            // Fill empty cells
            return parsedHeaders.map((_, idx) => row[idx] !== undefined ? String(row[idx]) : '');
          });
          setHeaders(parsedHeaders);
          setRows(parsedRows);
          showLocalToast(isAr ? 'تم تحميل الملف بنجاح!' : 'File imported successfully!');
        }
      } catch (err) {
        showLocalToast(isAr ? 'فشل قراءة الملف. تأكد من تفرده.' : 'Failed to parse file. Ensure it is valid.');
        console.error(err);
      }
    };
    reader.readAsBinaryString(file);
  };

  const showLocalToast = (msg: string) => {
    setCopiedText(msg);
    setTimeout(() => setCopiedText(''), 3000);
  };

  // Cell modifications
  const handleCellChange = (rIndex: number, cIndex: number, val: string) => {
    const updatedRows = [...rows];
    updatedRows[rIndex][cIndex] = val;
    setRows(updatedRows);
  };

  const handleHeaderChange = (cIndex: number, val: string) => {
    const updated = [...headers];
    updated[cIndex] = val;
    setHeaders(updated);
  };

  const addRow = () => {
    const newRow = Array(headers.length).fill('');
    setRows([...rows, newRow]);
    showLocalToast(isAr ? 'تمت إضافة صف جديد' : 'New row added');
  };

  const deleteRow = (rIndex: number) => {
    if (rows.length <= 1) {
      showLocalToast(isAr ? 'لا يمكن حذف كافة الصفوف!' : 'Cannot delete all rows!');
      return;
    }
    setRows(rows.filter((_, idx) => idx !== rIndex));
    setSelectedCell(null);
  };

  const addColumn = () => {
    const colName = isAr ? `عمود جديد ${headers.length + 1}` : `New Col ${headers.length + 1}`;
    setHeaders([...headers, colName]);
    setRows(rows.map(row => [...row, '']));
    showLocalToast(isAr ? 'تم إضافة عمود جديد' : 'New column added');
  };

  const deleteColumn = (cIndex: number) => {
    if (headers.length <= 1) {
      showLocalToast(isAr ? 'لا يمكن حذف كافة الأعمدة!' : 'Cannot delete all columns!');
      return;
    }
    setHeaders(headers.filter((_, idx) => idx !== cIndex));
    setRows(rows.map(row => row.filter((_, idx) => idx !== cIndex)));
    setSelectedCell(null);
  };

  // Sorting
  const sortColumn = (cIndex: number) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === cIndex && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    const sorted = [...rows].sort((a, b) => {
      const aVal = String(a[cIndex] || '').toLowerCase();
      const bVal = String(b[cIndex] || '').toLowerCase();
      
      if (!isNaN(Number(aVal)) && !isNaN(Number(bVal))) {
        return direction === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
      }
      return direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

    setRows(sorted);
    setSortConfig({ key: cIndex, direction });
  };

  // Cells/Row/Column Copy
  const copyCell = (r: number, c: number) => {
    const val = rows[r][c];
    navigator.clipboard.writeText(val);
    showLocalToast(isAr ? 'تم نسخ محتوى الخلية!' : 'Cell value copied!');
  };

  const copyRow = (rIndex: number) => {
    const csvContent = rows[rIndex].join('\t');
    navigator.clipboard.writeText(csvContent);
    showLocalToast(isAr ? 'تم نسخ الصف كاملاً كأعمدة مجدولة!' : 'Row copied as tab-delimited text!');
  };

  const copyColumn = (cIndex: number) => {
    const csvContent = rows.map(r => r[cIndex]).join('\n');
    navigator.clipboard.writeText(csvContent);
    showLocalToast(isAr ? 'تم نسخ العمود بالكامل!' : 'Column values copied!');
  };

  // Downloads / Export Options
  const downloadData = (type: 'csv' | 'xlsx' | 'json') => {
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    let processedBlob: Blob | null = null;
    let finalFileName = fileName.split('.')[0];

    if (type === 'xlsx') {
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      processedBlob = new Blob([wbout], { type: 'application/octet-stream' });
      finalFileName += '.xlsx';
    } else if (type === 'csv') {
      const csvStr = XLSX.utils.sheet_to_csv(ws);
      processedBlob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
      finalFileName += '.csv';
    } else {
      const objects = rows.map(row => {
        const obj: any = {};
        headers.forEach((h, idx) => {
          obj[h] = row[idx];
        });
        return obj;
      });
      const jsonStr = JSON.stringify(objects, null, 2);
      processedBlob = new Blob([jsonStr], { type: 'application/json' });
      finalFileName += '.json';
    }

    const downloadUrl = URL.createObjectURL(processedBlob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = finalFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    if (onAddHistoryItem) {
      onAddHistoryItem({
        action: isAr ? 'تعديل وتصدير ملف بيانات مجدول' : 'Data Spreadsheet Export',
        fileName: finalFileName,
        originalSize: rows.length * headers.length * 10,
        processedSize: processedBlob.size,
        type: 'text'
      }, processedBlob);
    }
  };

  // Filter & Search logic
  const filteredRows = rows.filter(row => {
    if (!filterQuery) return true;
    if (searchColumn >= 0) {
      return String(row[searchColumn] || '').toLowerCase().includes(filterQuery.toLowerCase());
    }
    return row.some(cell => String(cell || '').toLowerCase().includes(filterQuery.toLowerCase()));
  });

  return (
    <div id="csv-editor-container" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-5 sm:p-6 shadow-sm space-y-6 text-slate-700 dark:text-slate-200">
      
      {/* Toast Alert overlay notifications */}
      {copiedText && (
        <div className="fixed bottom-6 right-6 bg-slate-900 dark:bg-slate-800 text-white py-2.5 px-5 rounded-2xl shadow-lg border border-slate-700 text-xs font-bold animate-slideUp z-50 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{copiedText}</span>
        </div>
      )}

      {/* Title block */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-50 dark:border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 p-3 rounded-2xl text-emerald-500 dark:bg-emerald-500/20">
            <FileSpreadsheet className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isAr ? 'محرر CSV وجداول البيانات الشامل' : 'CSV & Excel Data Spreadsheet Master'}
            </h2>
            <p className="text-xs text-slate-400">
              {isAr ? 'تعديل فوري محلي بالكامل لملفات Excel, CSV, JSON وتخصيص الأعمدة وتصديرها بمرونة' : 'Instantly edit Excel/CSV tables on-device, add cols/rows, sort, and re-export smoothly'}
            </p>
          </div>
        </div>

        {/* Action button triggers imports */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv, .xlsx, .xls"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 cursor-pointer flex items-center gap-1.5 border-0 transition-transform hover:scale-101"
          >
            <Upload className="w-4 h-4 text-emerald-500" />
            <span>{isAr ? 'استيراد CSV / Excel' : 'Import CSV / Excel'}</span>
          </button>
        </div>
      </div>

      {/* Search and Filters row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100/50 dark:border-slate-800/50">
        <div className="md:col-span-6 relative">
          <Search className="w-4 h-4 text-slate-400 absolute top-3.5 left-3" />
          <input
            type="text"
            placeholder={isAr ? 'بحث و تصفية البيانات في الجدول...' : 'Search and filter grid values...'}
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 rounded-xl py-2.5 pl-9 pr-4 text-xs focus:ring-1 focus:ring-emerald-500 border border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-white"
          />
        </div>
        <div className="md:col-span-3">
          <select
            value={searchColumn}
            onChange={(e) => setSearchColumn(parseInt(e.target.value))}
            className="w-full bg-white dark:bg-slate-900 rounded-xl py-2.5 px-3 text-xs focus:ring-1 focus:ring-emerald-500 border border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-white cursor-pointer"
          >
            <option value={-1}>{isAr ? 'كل الأعمدة (All Columns)' : 'All Columns'}</option>
            {headers.map((h, i) => (
              <option key={i} value={i}>{h}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-3 flex gap-2">
          <button
            onClick={addRow}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-2 px-3 rounded-xl cursor-pointer flex items-center justify-center gap-1 border-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAr ? 'إضافة صف' : 'Row+'}</span>
          </button>
          <button
            onClick={addColumn}
            className="flex-1 bg-slate-950 dark:bg-slate-700 hover:bg-slate-900 text-white font-bold text-xs py-2 px-3 rounded-xl cursor-pointer flex items-center justify-center gap-1 border-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAr ? 'إضافة عمود' : 'Col+'}</span>
          </button>
        </div>
      </div>

      {/* Spreadsheet interactive Table Container */}
      <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner max-h-[400px]">
        <table className="w-full text-xs text-left rtl:text-right border-collapse">
          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 sticky top-0 font-bold border-b border-slate-200 dark:border-slate-700/80">
            <tr>
              <th className="p-3 text-center border-r border-slate-200 dark:border-slate-700 w-12">#</th>
              {headers.map((col, idx) => (
                <th key={idx} className="p-3 border-r border-slate-200 dark:border-slate-700 min-w-[150px] relative group">
                  <div className="flex items-center justify-between gap-1">
                    <input
                      type="text"
                      value={col}
                      onChange={(e) => handleHeaderChange(idx, e.target.value)}
                      className="bg-transparent font-bold text-slate-800 dark:text-slate-100 border-b border-transparent focus:border-purple-400 focus:outline-none w-full py-0.5"
                    />
                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => sortColumn(idx)}
                        title={isAr ? 'فرز تصاعدي/تنازلي' : 'Sort column'}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-700 cursor-pointer border-0"
                      >
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => copyColumn(idx)}
                        title={isAr ? 'نسخ محتويات العمود' : 'Copy entire column'}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-700 cursor-pointer border-0"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => deleteColumn(idx)}
                        title={isAr ? 'حذف العمود' : 'Delete column'}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-950/40 rounded text-red-400 hover:text-red-650 cursor-pointer border-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </th>
              ))}
              <th className="p-3 w-16 text-center">{isAr ? 'إجراء' : 'Act'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150 dark:divide-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200">
            {filteredRows.map((row, rIndex) => (
              <tr 
                key={rIndex} 
                className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${selectedCell?.r === rIndex ? 'bg-emerald-50/20 dark:bg-emerald-950/10' : ''}`}
              >
                <td className="p-2.5 text-center border-r border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 font-mono text-slate-400 select-none">
                  {rIndex + 1}
                </td>
                {row.map((cell, cIndex) => (
                  <td 
                    key={cIndex} 
                    className={`p-2 border-r border-slate-150 dark:border-slate-800 relative group min-w-[150px] ${selectedCell?.r === rIndex && selectedCell?.c === cIndex ? 'ring-2 ring-emerald-500' : ''}`}
                    onClick={() => setSelectedCell({ r: rIndex, c: cIndex })}
                  >
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) => handleCellChange(rIndex, cIndex, e.target.value)}
                      className="bg-transparent border-0 focus:outline-none w-full text-slate-800 dark:text-white"
                    />
                    <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-slate-50/80 dark:bg-slate-800/80 p-0.5 rounded border border-slate-100/50">
                      <button
                        onClick={() => copyCell(rIndex, cIndex)}
                        title={isAr ? 'نسخ الخلية' : 'Copy cell'}
                        className="p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer border-0"
                      >
                        <Copy className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </td>
                ))}
                <td className="p-2 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => copyRow(rIndex)}
                      title={isAr ? 'نسخ كامل الصف' : 'Copy entire row'}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-700 cursor-pointer border-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteRow(rIndex)}
                      title={isAr ? 'حذف الصف' : 'Delete row'}
                      className="p-1 hover:bg-red-50 dark:hover:bg-red-950/40 rounded text-red-500 hover:text-red-700 cursor-pointer border-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Row Count / Summary footer of tables */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-400 gap-4">
        <span>
          {isAr 
            ? `إجمالي البيانات: ${rows.length} صفاً، ${headers.length} عموداً • معروض منها: ${filteredRows.length}` 
            : `Spreadsheet specs: ${rows.length} rows, ${headers.length} columns • Matches: ${filteredRows.length}`}
        </span>
        
        {/* Export options */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-500">{isAr ? 'تصدير كـ:' : 'Export as:'}</span>
          <button
            onClick={() => downloadData('csv')}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-slate-700 dark:text-white cursor-pointer hover:text-emerald-600 font-mono font-bold test-xs flex items-center gap-1 border-0"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span>CSV</span>
          </button>
          <button
            onClick={() => downloadData('xlsx')}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-slate-700 dark:text-white cursor-pointer hover:text-emerald-600 font-mono font-bold test-xs flex items-center gap-1 border-0"
          >
            <FileDown className="w-3.5 h-3.5 text-emerald-500" />
            <span>XLSX</span>
          </button>
          <button
            onClick={() => downloadData('json')}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-slate-700 dark:text-white cursor-pointer hover:text-emerald-600 font-mono font-bold test-xs flex items-center gap-1 border-0"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span>JSON</span>
          </button>
        </div>
      </div>

    </div>
  );
};

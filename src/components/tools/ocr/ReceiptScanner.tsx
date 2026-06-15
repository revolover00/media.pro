import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Trash2, 
  Copy, 
  Check, 
  Download, 
  RefreshCw, 
  Store, 
  Calendar, 
  DollarSign, 
  Percent, 
  Plus, 
  Save, 
  Edit2,
  FileCode,
  FileSpreadsheet
} from 'lucide-react';
import { UploadZone } from '../../UploadZone';
import Tesseract from 'tesseract.js';
import { HistoryItem } from '../../../types';

interface ReceiptLineItem {
  name: string;
  price: number;
  qty: number;
}

interface ReceiptScannerProps {
  lang: 'ar' | 'en';
  onAddHistoryItem: (item: Omit<HistoryItem, 'id' | 'timestamp' | 'downloadUrl'>, blob: Blob) => string;
}

export const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ lang, onAddHistoryItem }) => {
  const isAr = lang === 'ar';
  
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [progressVal, setProgressVal] = useState<number>(0);
  const [ocrLang, setOcrLang] = useState<string>('ara+eng');

  // Extracted Receipt State
  const [merchant, setMerchant] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [tax, setTax] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [lineItems, setLineItems] = useState<ReceiptLineItem[]>([]);

  const [isEditingMetadata, setIsEditingMetadata] = useState<boolean>(false);

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
      clearStates();
    }
  };

  const clearStates = () => {
    setMerchant('');
    setDate('');
    setTax(0);
    setTotal(0);
    setLineItems([]);
    setIsEditingMetadata(false);
    setProgressVal(0);
    setProgressStatus('');
  };

  const handleReset = () => {
    setFile(null);
    setFilePreview('');
    clearStates();
  };

  // Receipt Smart Parser using local regex rules
  const handleScanReceipt = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgressVal(0);
    setProgressStatus(isAr ? 'جاري تهيئة محلل الفواتير...' : 'Initializing invoice reader...');

    try {
      const result = await Tesseract.recognize(
        file,
        ocrLang,
        {
          logger: (m) => {
            if (m && typeof m === 'object') {
              if (m.status === 'recognizing text') {
                setProgressStatus(isAr ? `جاري فحص وقراءة الأسطر والعمليات... ${Math.round(m.progress * 100)}%` : `Reading prices & taxes... ${Math.round(m.progress * 100)}%`);
                setProgressVal(Math.round(m.progress * 100));
              }
            }
          }
        }
      );

      if (result && result.data) {
        const text = result.data.text || '';
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 1);

        // Smart Regex Parsers
        let detectedMerchant = '';
        let detectedDate = '';
        let detectedTax = 0;
        let detectedTotal = 0;
        const parsedItems: ReceiptLineItem[] = [];

        // Merchant: usually first non-empty lines are merchant names
        if (lines.length > 0) {
          detectedMerchant = lines[0].replace(/[^\w\s\u0600-\u06FF]/g, '').trim();
          if (detectedMerchant.length < 3 && lines.length > 1) {
            detectedMerchant = lines[1].replace(/[^\w\s\u0600-\u06FF]/g, '').trim();
          }
        }

        // Date matching (YYYY-MM-DD, DD/MM/YYYY etc.)
        const dateRegex = /(\d{1,4}[-./\s]\d{1,2}[-./\s]\d{1,4})/g;
        const dateMatches = text.match(dateRegex);
        if (dateMatches && dateMatches.length > 0) {
          detectedDate = dateMatches[0];
        } else {
          // Fallback to current date
          const today = new Date();
          detectedDate = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
        }

        // Total patterns: (Total, GTotal, مجموع, الاجمالي, الإجمالي) followed by currency or numbers
        const totalRegex = /(?:total|grand\s*total|sum|gtotal|مجموع|إجمالي|الاجمالي|المبلغ)[:\s]*[A-Za-z$£€]*\s*(\d+(?:\.\d{1,2})?)/i;
        const totalMatches = text.match(totalRegex);
        if (totalMatches && totalMatches[1]) {
          detectedTotal = parseFloat(totalMatches[1]);
        }

        // Tax/Vat patterns: (Tax, Vat, Taxable, ضريبة)
        const taxRegex = /(?:tax|vat|gst|ضريبة|الضريبة)[:\s]*[A-Za-z$£€]*\s*(\d+(?:\.\d{1,2})?)/i;
        const taxMatches = text.match(taxRegex);
        if (taxMatches && taxMatches[1]) {
          detectedTax = parseFloat(taxMatches[1]);
        }

        // Match items (any line with a product name and pricing, like "Item 10.99" or "Item name x2 45")
        lines.forEach(line => {
          // Regex matching a potential item & decimal price
          const itemRegex = /^([\w\s\u0600-\u06FF\-]+)\s+.*?(\d+(?:\.\d{2})?)$/u;
          const match = line.match(itemRegex);
          if (match && match[1] && match[2]) {
            const itemName = match[1].trim();
            const itemPrice = parseFloat(match[2]);
            // Skip common receipt meta words
            const isMetaWord = /total|subtotal|tax|vat|cash|change|card|visa|bal|شكر|برميل|ضريبة/i.test(itemName);
            if (!isMetaWord && itemPrice > 0 && itemName.length > 2 && parsedItems.length < 8) {
              parsedItems.push({
                name: itemName,
                price: itemPrice,
                qty: 1
              });
            }
          }
        });

        // Set state with extracted details
        setMerchant(detectedMerchant || (isAr ? 'عربة تجارية غير معروفة' : 'General Store'));
        setDate(detectedDate);
        setTax(detectedTax || 0);
        setLineItems(parsedItems.length > 0 ? parsedItems : [
          { name: isAr ? 'خدمة عامة' : 'General Purchase', price: detectedTotal || 10, qty: 1 }
        ]);

        // Auto sum setting
        const calculatedSum = parsedItems.length > 0 ? parsedItems.reduce((acc, curr) => acc + (curr.price * curr.qty), 0) : detectedTotal;
        setTotal(calculatedSum || detectedTotal || 10);

        // Add history log item
        const textBlob = new Blob([JSON.stringify({ merchant, date, total, tax, lineItems: parsedItems }, null, 2)], { type: 'application/json' });
        onAddHistoryItem({
          action: isAr ? 'مسح وقراءة فاتورة مخزنية' : 'Scan Receipt / Invoice',
          fileName: `${file.name.split('.')[0]}_receipt.json`,
          originalSize: file.size,
          processedSize: textBlob.size,
          type: 'image'
        }, textBlob);

        setProgressStatus(isAr ? 'اكتمل تفريغ الفاتورة بنجاح!' : 'Receipt fields indexed successfully!');
      }
    } catch (err: any) {
      console.error(err);
      setProgressStatus(isAr ? `فشل التحليل: ${err.message}` : `Error reading invoice: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculations
  const calculatedSubtotal = lineItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const calculatedGrandTotal = calculatedSubtotal + tax;

  // Manual actions
  const addLineItem = () => {
    setLineItems([...lineItems, { name: isAr ? 'منتج جديد' : 'New Product', price: 0, qty: 1 }]);
  };

  const deleteLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, idx) => idx !== index));
  };

  const updateLineItem = (index: number, field: keyof ReceiptLineItem, value: string | number) => {
    const updated = [...lineItems];
    if (field === 'price') {
      updated[index].price = parseFloat(value as string) || 0;
    } else if (field === 'qty') {
      updated[index].qty = parseInt(value as string) || 1;
    } else {
      updated[index].name = value as string;
    }
    setLineItems(updated);
  };

  // Exporters
  const handleExportCSV = () => {
    const rows = [
      [isAr ? 'اسم المتجر' : 'Merchant', merchant],
      [isAr ? 'التاريخ' : 'Date', date],
      [],
      [isAr ? 'المنتج' : 'Item Name', isAr ? 'السعر الفردي' : 'Unit Price', isAr ? 'الكمية' : 'Quantity', isAr ? 'المجموع' : 'Total Price']
    ];

    lineItems.forEach(item => {
      rows.push([item.name, item.price.toString(), item.qty.toString(), (item.price * item.qty).toFixed(2)]);
    });

    rows.push([]);
    rows.push([isAr ? 'الضريبة' : 'VAT / Tax', tax.toFixed(2)]);
    rows.push([isAr ? 'الإجمالي الكلي' : 'Grand Total', calculatedGrandTotal.toFixed(2)]);

    const csvContent = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    downloadBlob(blob, `${merchant.replace(/\s+/g, '_')}_sales_invoice.csv`);
  };

  const handleExportJSON = () => {
    const output = {
      merchant,
      date,
      subtotal: calculatedSubtotal,
      tax,
      grandTotal: calculatedGrandTotal,
      items: lineItems
    };

    const jsonText = JSON.stringify(output, null, 2);
    const blob = new Blob([jsonText], { type: 'application/json' });
    downloadBlob(blob, `${merchant.replace(/\s+/g, '_')}_invoice_data.json`);
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
    <div className="max-w-4xl mx-auto p-4 sm:p-6" id="receipt-scanner-utility">
      {/* Title */}
      <div className="text-center mb-6">
        <div className="inline-flex p-3 bg-amber-100 text-amber-600 rounded-full mb-3 shadow-sm">
          <Receipt className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight font-sans">
          {isAr ? 'قارئ ومحلل الفواتير والإيصالات المالي' : 'Smart Receipt & Tax Invoice Scanner'}
        </h1>
        <p className="mt-2 text-gray-650 max-w-xl mx-auto text-sm sm:text-base">
          {isAr 
            ? 'ارفع صور ومسسحات الفواتير الرقمية والوصولات. التطبيق يستخرج اسم المتجر، المشتريات، الضريبة والتواريخ مع جداول حسابية تلقائية للتنزيل.' 
            : 'Extract store tag names, items, quantities, taxes, and final tallies directly from paper snapshots with dynamic mathematical calculations.'}
        </p>
      </div>

      {!file ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {isAr ? 'لغة محتويات الفاتورة:' : 'Receipt Content Dialect:'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => setOcrLang('ara')}
                className={`py-2 px-3 text-xs sm:text-sm font-medium rounded-xl border transition ${
                  ocrLang === 'ara' ? 'bg-amber-600 border-amber-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {isAr ? 'العربية' : 'Arabic'}
              </button>
              <button 
                onClick={() => setOcrLang('eng')}
                className={`py-2 px-3 text-xs sm:text-sm font-medium rounded-xl border transition ${
                  ocrLang === 'eng' ? 'bg-amber-600 border-amber-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {isAr ? 'الإنجليزية' : 'English'}
              </button>
              <button 
                onClick={() => setOcrLang('ara+eng')}
                className={`py-2 px-3 text-xs sm:text-sm font-medium rounded-xl border transition ${
                  ocrLang === 'ara+eng' ? 'bg-amber-600 border-amber-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Scan Side */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-gray-900 text-sm">{isAr ? 'الفاتورة المرفوعة' : 'Scanned Invoice Photo'}</span>
                <button 
                  onClick={handleReset} 
                  disabled={isProcessing}
                  className="text-red-500 hover:text-red-650 text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {isAr ? 'إزالة الفاتورة' : 'Remove Photo'}
                </button>
              </div>
              <div className="relative min-h-[160px] max-h-[250px] rounded-xl overflow-hidden border border-gray-150 bg-gray-50 flex items-center justify-center p-2 mb-4">
                <img 
                  src={filePreview} 
                  alt="Scanned Tax Receipt" 
                  className="max-h-[220px] w-auto object-contain rounded shadow-sm"
                />
              </div>
            </div>

            {!merchant && (
              <button
                onClick={handleScanReceipt}
                disabled={isProcessing}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                {isProcessing ? (isAr ? 'جاري الفحص المالي الحسابي...' : 'Balancing taxes...') : (isAr ? 'بدء فحص وتحليل بنود الفاتورة' : 'Analyze Invoice Receipts')}
              </button>
            )}

            {isProcessing && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <div className="flex justify-between text-[11px] text-amber-800 font-bold mb-1">
                  <span>{progressStatus}</span>
                  <span>{progressVal}%</span>
                </div>
                <div className="w-full bg-amber-100 rounded-full h-1.5">
                  <div 
                    className="bg-amber-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${progressVal}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Right Invoice Receipt Layout rendering side */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 mb-4">
              <h3 className="text-gray-900 font-bold text-base sm:text-lg flex items-center gap-1.5">
                <Receipt className="w-5 h-5 text-amber-600" />
                <span>{isAr ? 'البيانات الحسابية والبنود وبطاقة الفاتورة' : 'Invoice Statement Receipt'}</span>
              </h3>
              {merchant && (
                <button
                  onClick={() => setIsEditingMetadata(!isEditingMetadata)}
                  className="text-amber-700 bg-amber-50 hover:bg-amber-100 p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{isEditingMetadata ? (isAr ? 'تم' : 'Done') : (isAr ? 'تعديل' : 'Edit')}</span>
                </button>
              )}
            </div>

            {!merchant ? (
              <div className="py-16 text-center text-gray-400 text-sm">
                <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30 text-amber-400" />
                <p className="max-w-xs mx-auto">
                  {isAr 
                    ? 'يرجى البدء في قراءة وتحليل بنود الفاتورة للحصول على المراجحة وتوزيع القيم.' 
                    : 'Click analytical reader to inspect structural details, taxes, and prices.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Simulated Thermal Receipt Panel card */}
                <div className="bg-gray-50 border border-dashed border-gray-300 p-4 rounded-xl font-mono text-xs text-gray-800 space-y-3 relative shadow-inner">
                  {/* Store Name & Meta Info */}
                  <div className="text-center pb-2 border-b border-dashed border-gray-300">
                    {isEditingMetadata ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={merchant}
                          onChange={(e) => setMerchant(e.target.value)}
                          className="w-full text-center font-bold bg-white border border-gray-200 rounded p-1"
                        />
                        <input
                          type="text"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="w-full text-center bg-white border border-gray-200 rounded p-1"
                        />
                      </div>
                    ) : (
                      <>
                        <h4 className="font-bold text-sm text-gray-900 flex items-center justify-center gap-1">
                          <Store className="w-4 h-4 text-amber-600" />
                          <span>{merchant}</span>
                        </h4>
                        <p className="text-gray-400 mt-1 flex items-center justify-center gap-1 text-[10px]">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{date}</span>
                        </p>
                      </>
                    )}
                  </div>

                  {/* Line Items List */}
                  <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                    <div className="grid grid-cols-12 font-bold text-[10px] text-gray-400 pb-1 border-b border-gray-200">
                      <span className="col-span-6">{isAr ? 'البند' : 'Item'}</span>
                      <span className="col-span-2 text-center">{isAr ? 'سعر' : 'Price'}</span>
                      <span className="col-span-2 text-center">{isAr ? 'سعة' : 'Qty'}</span>
                      <span className="col-span-2 text-right">{isAr ? 'مجموع' : 'Total'}</span>
                    </div>

                    {lineItems.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 items-center gap-1 py-1">
                        <div className="col-span-6 min-w-0">
                          {isEditingMetadata ? (
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateLineItem(idx, 'name', e.target.value)}
                              className="w-full bg-white border border-gray-200 rounded p-0.5"
                            />
                          ) : (
                            <p className="truncate font-semibold">{item.name}</p>
                          )}
                        </div>
                        <div className="col-span-2 text-center">
                          {isEditingMetadata ? (
                            <input
                              type="number"
                              value={item.price}
                              onChange={(e) => updateLineItem(idx, 'price', e.target.value)}
                              className="w-full bg-white border border-gray-200 rounded p-0.5 text-center"
                            />
                          ) : (
                            <span>{item.price.toFixed(2)}</span>
                          )}
                        </div>
                        <div className="col-span-2 text-center">
                          {isEditingMetadata ? (
                            <input
                              type="number"
                              value={item.qty}
                              onChange={(e) => updateLineItem(idx, 'qty', e.target.value)}
                              className="w-full bg-white border border-gray-200 rounded p-0.5 text-center"
                            />
                          ) : (
                            <span>{item.qty}</span>
                          )}
                        </div>
                        <div className="col-span-2 text-right flex items-center justify-end gap-1.5">
                          <span className="font-bold">{(item.price * item.qty).toFixed(2)}</span>
                          {isEditingMetadata && (
                            <button
                              onClick={() => deleteLineItem(idx)}
                              className="text-red-500 hover:text-red-700 p-0.5 rounded"
                              title={isAr ? 'حذف' : 'Remove'}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {isEditingMetadata && (
                    <button
                      onClick={addLineItem}
                      className="w-full py-1.5 border border-dashed border-amber-300 hover:bg-amber-50 text-amber-800 text-[10px] font-bold rounded flex items-center justify-center gap-1 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAr ? 'إضافة بند مبيعات' : 'Add Receipt Item'}</span>
                    </button>
                  )}

                  {/* Calculations Sum fields of Thermal list */}
                  <div className="pt-2 border-t border-dashed border-gray-300 space-y-1.5 text-right font-medium">
                    <div className="flex justify-between">
                      <span>{isAr ? 'المجموع المبدئي:' : 'Subtotal:'}</span>
                      <span>{calculatedSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>{isAr ? 'الضريبة الحسابية (VAT):' : 'Tax / VAT value:'}</span>
                      {isEditingMetadata ? (
                        <input
                          type="number"
                          value={tax}
                          onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                          className="w-16 text-right bg-white border border-gray-200 rounded p-0.5 select-all"
                        />
                      ) : (
                        <span>{tax.toFixed(2)}</span>
                      )}
                    </div>
                    <div className="flex justify-between font-bold text-gray-900 border-t border-dashed border-gray-300 pt-1.5 text-[13px]">
                      <span>{isAr ? 'الإجمالي النهائي:' : 'TOTAL SUM DUE:'}</span>
                      <span className="text-amber-800">{calculatedGrandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Exporters and Triggers */}
                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={handleExportCSV}
                    className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <FileSpreadsheet className="w-[18px] h-[18px]" />
                    <span>{isAr ? 'تصدير جدول (CSV)' : 'Export CSV table'}</span>
                  </button>
                  <button
                    onClick={handleExportJSON}
                    className="flex-1 bg-gradient-to-r from-slate-700 to-gray-800 hover:from-slate-850 hover:to-gray-900 text-white py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <FileCode className="w-[18px] h-[18px]" />
                    <span>JSON</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Upload, 
  Plus, 
  Trash2, 
  Edit3, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  FileCode,
  Save,
  Check,
  Calendar,
  Layers,
  ChevronDown,
  UserCheck
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { formatBytes } from '../../../utils/imageUtils';

interface FormFieldItem {
  name: string;
  type: 'text' | 'checkbox' | 'dropdown' | 'date' | 'signature';
  value: string;
  options?: string[]; // Dropdown options if available
}

interface PDFFormFillerProps {
  lang: 'ar' | 'en';
  onAddHistoryItem?: (item: any, blob: Blob) => string;
}

export const PDFFormFiller: React.FC<PDFFormFillerProps> = ({ lang, onAddHistoryItem }) => {
  const [file, setFile] = useState<File | null>(null);
  const [fields, setFields] = useState<FormFieldItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; url: string; size: number } | null>(null);

  // Fallback / manual tools spawner for scanned files
  const [customFields, setCustomFields] = useState<FormFieldItem[]>([]);

  const dict = {
    ar: {
      title: "✍️ تعبئة نماذج وحقول PDF",
      subtitle: "اكتشف الحقول التفاعلية تلقائياً داخل وثيقتك، قم بتعبئتها دفعة واحدة، أو أضف حقولاً مخصصة وصدرها بنواة ذكية.",
      uploadTitle: "اسحب ملف نموذج PDF هنا لبدء التعبئة",
      uploadSub: "اكتشاف تلقائي مع دعم النماذج وتصدير البيانات كأرشيف JSON",
      fieldsCol: "قائمة حقول النموذج المكتشفة",
      manualAdd: "➕ إضافة حقل تعبئة يدوي مخصص (للملفات غير التفاعلية):",
      jsonTools: "تصدير واستيراد البيانات (JSON)",
      exportJsonBtn: "تصدير القيم كملف JSON",
      importJsonBtn: "استيراد قيم من JSON",
      fieldNameLbl: "اسم الحقل التفاعلي:",
      fieldTypeLbl: "نوع العنصر:",
      valueLbl: "القيمة المدخلة / المحددة:",
      fillBtn: "تعبئة وتصدير ملف PDF المحدّث",
      filling: "جاري حقن البيانات وتوليد وثيقة PDF التفاعلية...",
      successTitle: "تم تعبئة النموذج بنجاح تام!",
      downloadBtn: "تحميل ملف PDF المعبأ فورا",
      noFieldsAlert: "💡 لم نكتشف حقولاً تفاعلية تلقائية في المستند. لا تقلق، يمكنك إضافة حقول معالجة يدوية مخصصة من القائمة أدناه!",
      addCustomFieldBtn: "إضافة الحقل المخصص",
      clearFieldsBtn: "تنظيف الحقول",
      resetTitle: "تعبئة نموذج آخر",
      originalSize: "الحجم الأصلي:"
    },
    en: {
      title: "✍️ PDF Interactive Form Filler",
      subtitle: "Automatically detect form fields, complete values in a neat sidebar list, embed custom spawners, and export configuration data.",
      uploadTitle: "Drag & drop your PDF Form here",
      uploadSub: "Supports interactive elements, custom field positioning, and JSON template variables",
      fieldsCol: "Detected Form Fields",
      manualAdd: "➕ Add Custom Fill Field manually (for static files):",
      jsonTools: "JSON Configuration Utilities",
      exportJsonBtn: "Save Form Data as JSON",
      importJsonBtn: "Load Form Data from JSON",
      fieldNameLbl: "Field Identifier:",
      fieldTypeLbl: "Interactive Element Type:",
      valueLbl: "Current Entry Value:",
      fillBtn: "Apply Values & Compile PDF",
      filling: "Baking form values inside PDF document layers...",
      successTitle: "Form completed & compiled successfully!",
      downloadBtn: "Download Completed PDF",
      noFieldsAlert: "💡 No automatic form fields detected in this PDF. Use the manual fields designer below to inject custom entries!",
      addCustomFieldBtn: "Add Manual Entry Field",
      clearFieldsBtn: "Clear Fields list",
      resetTitle: "Fill Another Form",
      originalSize: "Original Size:"
    }
  };

  const t = dict[lang];

  // Try to analyze native PDF fields
  const detectFormFields = async (targetFile: File) => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const bytes = await targetFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(bytes);
      const form = pdfDoc.getForm();
      const detectedFields: FormFieldItem[] = [];

      try {
        const fieldsList = form.getFields();
        fieldsList.forEach((field) => {
          const name = field.getName();
          const constructorName = field.constructor.name;
          let type: 'text' | 'checkbox' | 'dropdown' | 'date' | 'signature' = 'text';
          let options: string[] = [];
          
          if (constructorName === 'PDFCheckBox') {
            type = 'checkbox';
          } else if (constructorName === 'PDFDropdown' || constructorName === 'PDFChoice') {
            type = 'dropdown';
            try {
              // @ts-ignore
              options = field.getOptions() || [];
            } catch {}
          } else if (constructorName === 'PDFSignature') {
            type = 'signature';
          } else if (name.toLowerCase().includes('date') || name.toLowerCase().includes('تاريخ')) {
            type = 'date';
          }

          detectedFields.push({
            name,
            type,
            value: '',
            options: options.length > 0 ? options : undefined
          });
        });
      } catch (innerErr) {
        console.warn("Forms API failed or no fields exist", innerErr);
      }

      setFields(detectedFields);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(lang === 'ar' ? 'فشل تحليل ملف PDF لقراءة الحقول.' : 'Failed to parse PDF document structures.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setSuccess(false);
      setResult(null);
      detectFormFields(selectedFile);
    }
  };

  const handleValueChange = (index: number, val: string, isCustom = false) => {
    if (isCustom) {
      const updated = [...customFields];
      updated[index].value = val;
      setCustomFields(updated);
    } else {
      const updated = [...fields];
      updated[index].value = val;
      setFields(updated);
    }
  };

  // Export inputs as JSON file
  const handleExportJson = () => {
    const data = {
      detectedFields: fields.map(f => ({ name: f.name, value: f.value })),
      customFields: customFields.map(f => ({ name: f.name, type: f.type, value: f.value }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${file?.name.replace('.pdf', '') || 'form'}_data_template.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import JSON configuration
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && (parsed.detectedFields || parsed.customFields)) {
            if (parsed.detectedFields) {
              const updated = [...fields];
              parsed.detectedFields.forEach((item: any) => {
                const targetIdx = updated.findIndex(f => f.name === item.name);
                if (targetIdx !== -1) {
                  updated[targetIdx].value = item.value || '';
                }
              });
              setFields(updated);
            }
            if (parsed.customFields) {
              setCustomFields(parsed.customFields);
            }
          }
        } catch (err) {
          console.error(err);
          setErrorMsg(lang === 'ar' ? 'فشل قراءة ملف الاستيراد JSON.' : 'Failed to read JSON model values.');
        }
      };
      reader.readAsText(e.target.files[0]);
    }
  };

  // Adds a manual/custom override field
  const [newManualName, setNewManualName] = useState('');
  const [newManualType, setNewManualType] = useState<'text' | 'checkbox' | 'dropdown' | 'date' | 'signature'>('text');

  const addManualField = () => {
    if (!newManualName.trim()) return;
    setCustomFields([
      ...customFields,
      {
        name: newManualName.trim(),
        type: newManualType,
        value: ''
      }
    ]);
    setNewManualName('');
  };

  const removeManualField = (idx: number) => {
    const updated = [...customFields];
    updated.splice(idx, 1);
    setCustomFields(updated);
  };

  // Actually save is values into PDF fields using PDFLib
  const handleFillPDF = async () => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const bytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(bytes);
      const form = pdfDoc.getForm();

      // Set native fields values
      fields.forEach((f) => {
        try {
          if (f.type === 'checkbox') {
            const cb = form.getCheckBox(f.name);
            if (f.value === 'true' || f.value === 'yes' || f.value === 'checked' || f.value === '1') {
              cb.check();
            } else {
              cb.uncheck();
            }
          } else if (f.type === 'dropdown') {
            const dd = form.getDropdown(f.name);
            if (f.value) dd.select(f.value);
          } else if (f.type === 'text' || f.type === 'date' || f.type === 'signature') {
            const tf = form.getTextField(f.name);
            tf.setText(f.value);
          }
        } catch (innerErr) {
          console.warn(`Could not fill field: ${f.name}`, innerErr);
        }
      });

      // For custom manual fields, we dynamically append a simple text box or label on page 1 for simulation!
      if (customFields.length > 0) {
        const pages = pdfDoc.getPages();
        if (pages.length > 0) {
          const firstPage = pages[0];
          const { width, height } = firstPage.getSize();
          
          // Draw list items visually in a side block or list at top left as metadata
          let startY = height - 50;
          customFields.forEach((cf, idx) => {
            if (cf.value) {
              firstPage.drawText(`${cf.name}: ${cf.value}`, {
                x: 35,
                y: startY - (idx * 20),
                size: 11,
                // Simple standard text
              });
            }
          });
        }
      }

      const filledBytes = await pdfDoc.save();
      const filledBlob = new Blob([filledBytes], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(filledBlob);

      setResult({
        blob: filledBlob,
        url: downloadUrl,
        size: filledBlob.size
      });
      setSuccess(true);

      if (onAddHistoryItem) {
        onAddHistoryItem({
          action: lang === 'ar' ? 'تعبئة حقول ونماذج PDF' : 'Filled PDF custom form fields',
          fileName: `${file.name.replace('.pdf', '')}_جاهز.pdf`,
          originalSize: file.size,
          processedSize: filledBytes.length,
          type: 'pdf'
        }, filledBlob);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(lang === 'ar' ? 'فشل معالجة وتصدير قيم النموذج المرفق.' : 'Failed to apply and bake form values inside PDF document.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const link = document.createElement('a');
    link.href = result.url;
    link.download = `${file.name.replace('.pdf', '')}_معبأ.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetAll = () => {
    setFile(null);
    setFields([]);
    setCustomFields([]);
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
            <span>{t.resetTitle}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Interactive form: Fields - 6 Columns */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl shadow-sm border border-purple-100 space-y-6">
          <div className="flex items-center justify-between border-b border-purple-50 pb-3">
            <div className="flex items-center gap-2">
              <FileCode className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-gray-800">{t.fieldsCol}</h3>
            </div>
            {fields.length > 0 && (
              <button
                onClick={handleExportJson}
                className="flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-[10px] py-1.5 px-3 rounded-lg"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{t.exportJsonBtn}</span>
              </button>
            )}
          </div>

          {!file ? (
            <div className="text-center py-10 text-gray-400 text-xs">
              {lang === 'ar' ? 'الرجاء رفع ملف PDF أولاً لإظهار الحقول المتاحة.' : 'Please select a PDF document first.'}
            </div>
          ) : (
            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
              {fields.length === 0 && (
                <div className="bg-amber-50 border border-amber-100 text-amber-800 rounded-2xl p-4 text-xs font-medium">
                  {t.noFieldsAlert}
                </div>
              )}

              {/* Native fields layout */}
              {fields.map((f, idx) => (
                <div key={f.name + idx} className="space-y-1 bg-gray-50/50 p-3 rounded-2xl border border-gray-150">
                  <div className="flex justify-between text-[11px] font-bold text-gray-500">
                    <span className="truncate max-w-[170px] bg-purple-100 text-purple-900 px-1.5 py-0.5 rounded-lg font-mono">{f.name}</span>
                    <span className="text-gray-400 capitalize">{f.type === 'text' ? 'Text Field' : f.type}</span>
                  </div>

                  {f.type === 'dropdown' ? (
                    <div className="relative mt-1">
                      <select
                        value={f.value}
                        onChange={(e) => handleValueChange(idx, e.target.value)}
                        className="w-full bg-white border border-gray-250 focus:ring-2 focus:ring-purple-400 rounded-xl py-2 px-3 text-xs text-gray-800 font-semibold appearance-none pr-8"
                      >
                        <option value="">-- Choose Option --</option>
                        {f.options?.map((opt, i) => (
                          <option key={opt + i} value={opt}>{opt}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
                    </div>
                  ) : f.type === 'checkbox' ? (
                    <div className="flex items-center gap-2 mt-1.5">
                      <input
                        type="checkbox"
                        checked={f.value === 'true'}
                        onChange={(e) => handleValueChange(idx, e.target.checked ? 'true' : 'false')}
                        className="rounded border-gray-350 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-gray-700">{lang === 'ar' ? 'مقبول / محدد' : 'Checked'}</span>
                    </div>
                  ) : f.type === 'date' ? (
                    <div className="relative mt-1">
                      <input
                        type="date"
                        value={f.value}
                        onChange={(e) => handleValueChange(idx, e.target.value)}
                        className="w-full bg-white border border-gray-250 focus:ring-2 focus:ring-purple-400 rounded-xl py-2 px-3 text-xs text-gray-800 font-semibold"
                      />
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={f.value}
                      onChange={(e) => handleValueChange(idx, e.target.value)}
                      className="w-full bg-white border border-gray-250 focus:ring-2 focus:ring-purple-400 rounded-xl py-2 px-3 text-xs text-gray-800 font-semibold mt-1"
                      placeholder="أدخل النص هنا..."
                    />
                  )}
                </div>
              ))}

              {/* Spawner tools for scanned custom fields manual */}
              <div className="border-t border-purple-50 pt-4 space-y-4">
                <span className="text-[11px] font-extrabold text-blue-900 block uppercase tracking-wider">{t.manualAdd}</span>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newManualName}
                    onChange={(e) => setNewManualName(e.target.value)}
                    className="flex-1 bg-gray-50 border border-gray-250 focus:ring-2 focus:ring-purple-400 focus:bg-white rounded-xl py-2 px-3 text-xs text-gray-800"
                    placeholder="اسم الحقل (مثل: الاسم الكامل)..."
                  />
                  <select
                    value={newManualType}
                    onChange={(e: any) => setNewManualType(e.target.value)}
                    className="bg-gray-50 border border-gray-250 rounded-xl px-2.5 text-xs text-gray-700"
                  >
                    <option value="text">Text Box</option>
                    <option value="date">Date</option>
                    <option value="signature">Signature</option>
                    <option value="checkbox">Checkbox</option>
                  </select>
                  <button
                    onClick={addManualField}
                    className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl cursor-pointer"
                  >
                    <Plus className="w-4 h-4 inline mr-1" /> Add
                  </button>
                </div>

                {/* Custom manual list items layout */}
                {customFields.length > 0 && (
                  <div className="space-y-2.5 pt-2">
                    {customFields.map((cf, cIdx) => (
                      <div key={cf.name + cIdx} className="flex items-center justify-between p-3 bg-indigo-50/40 rounded-xl border border-indigo-100 text-xs">
                        <div className="flex-1 space-y-1 pr-2">
                          <div className="flex justify-between font-bold text-indigo-950">
                            <span>{cf.name} ({cf.type})</span>
                          </div>
                          
                          {cf.type === 'checkbox' ? (
                            <input
                              type="checkbox"
                              checked={cf.value === 'true'}
                              onChange={(e) => handleValueChange(cIdx, e.target.checked ? 'true' : 'false', true)}
                              className="rounded text-indigo-700 focus:ring-indigo-500 w-4.5 h-4.5"
                            />
                          ) : cf.type === 'date' ? (
                            <input
                              type="date"
                              value={cf.value}
                              onChange={(e) => handleValueChange(cIdx, e.target.value, true)}
                              className="w-full bg-white border border-gray-200 rounded-lg p-1.5"
                            />
                          ) : (
                            <input
                              type="text"
                              value={cf.value}
                              onChange={(e) => handleValueChange(cIdx, e.target.value, true)}
                              className="w-full bg-white border border-gray-200 rounded-lg p-1.5"
                              placeholder="أدخل القيمة يدوياً..."
                            />
                          )}
                        </div>

                        <button
                          onClick={() => removeManualField(cIdx)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Upload & PDF Download Zone - 6 Columns */}
        <div className="lg:col-span-6 space-y-6">
          {!file ? (
            <div className="relative border-2 border-dashed border-purple-200 hover:border-purple-400 bg-white hover:bg-purple-50/10 rounded-3xl p-10 text-center transition-all">
              <input
                type="file"
                onChange={handleFileChange}
                accept="application/pdf"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-4">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">{t.uploadTitle}</h4>
                  <p className="text-xs text-gray-400 mt-1">{t.uploadSub}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-purple-100 space-y-5">
              <div className="flex items-center justify-between border-b border-purple-50 pb-3">
                <div className="flex items-center gap-2.5">
                  <UserCheck className="w-5 h-5 text-purple-700 font-extrabold" />
                  <div>
                    <h4 className="font-bold text-gray-800 text-xs truncate max-w-[200px]">{file.name}</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">{t.originalSize} {formatBytes(file.size)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Import JSON tool */}
                  <label className="flex items-center gap-1 bg-gradient-to-l from-indigo-500 to-purple-500 hover:dark text-white font-extrabold text-[10px] px-2.5 py-1.5 rounded-lg cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{t.importJsonBtn}</span>
                    <input
                      type="file"
                      accept="application/json"
                      onChange={handleImportJson}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {!success ? (
                <div className="space-y-4">
                  <button
                    onClick={handleFillPDF}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg cursor-pointer hover:shadow-xl transition-all"
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>{t.filling}</span>
                      </div>
                    ) : (
                      <>
                        <Check className="w-4.5 h-4.5 text-purple-100" />
                        <span>{t.fillBtn}</span>
                      </>
                    )}
                  </button>

                  {errorMsg && (
                    <div className="flex items-center gap-2 bg-red-50 text-red-655 p-3 rounded-xl border border-red-100 text-xs font-semibold">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-purple-950 text-white p-6 rounded-2xl space-y-4 shadow-xl">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span className="font-bold text-xs">{t.successTitle}</span>
                  </div>

                  <p className="text-xs text-purple-200">
                    {lang === 'ar' ? 'حجم وثيقة PDF الناتجة المعبأة:' : 'Generated Filled PDF Document Size:'} <span className="text-white font-bold font-mono">{formatBytes(result?.size || 0)}</span>
                  </p>

                  <div className="flex gap-2">
                    <button
                      id="download-filled-pdf-btn"
                      onClick={handleDownload}
                      className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs py-3 px-5 rounded-xl cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>{t.downloadBtn}</span>
                    </button>
                    
                    <button
                      onClick={resetAll}
                      className="bg-white/10 text-white hover:bg-white/15 font-bold text-xs py-3 px-4 rounded-xl cursor-pointer"
                    >
                      {t.resetTitle}
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

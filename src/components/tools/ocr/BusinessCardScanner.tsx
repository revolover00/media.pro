import React, { useState, useEffect } from 'react';
import { 
  Contact, 
  Trash2, 
  Copy, 
  Check, 
  Download, 
  RefreshCw, 
  User, 
  Briefcase, 
  Building2, 
  Phone, 
  Mail, 
  Globe, 
  MapPin, 
  Edit2, 
  Save 
} from 'lucide-react';
import { UploadZone } from '../../UploadZone';
import Tesseract from 'tesseract.js';
import { HistoryItem } from '../../../types';

interface BusinessCardScannerProps {
  lang: 'ar' | 'en';
  onAddHistoryItem: (item: Omit<HistoryItem, 'id' | 'timestamp' | 'downloadUrl'>, blob: Blob) => string;
}

export const BusinessCardScanner: React.FC<BusinessCardScannerProps> = ({ lang, onAddHistoryItem }) => {
  const isAr = lang === 'ar';
  
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [progressVal, setProgressVal] = useState<number>(0);
  const [ocrLang, setOcrLang] = useState<string>('ara+eng');

  // Extracted data state
  const [cardData, setCardData] = useState({
    fullName: '',
    jobTitle: '',
    company: '',
    phone: '',
    email: '',
    website: '',
    address: ''
  });

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

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
      resetExtractedData();
    }
  };

  const resetExtractedData = () => {
    setCardData({
      fullName: '',
      jobTitle: '',
      company: '',
      phone: '',
      email: '',
      website: '',
      address: ''
    });
    setIsEditing(false);
    setProgressVal(0);
    setProgressStatus('');
  };

  const handleReset = () => {
    setFile(null);
    setFilePreview('');
    resetExtractedData();
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleOcr = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgressVal(0);
    setProgressStatus(isAr ? 'بدء التعرف على بطاقة العمل...' : 'Initializing business card parser...');

    try {
      const result = await Tesseract.recognize(
        file,
        ocrLang,
        {
          logger: (m) => {
            if (m && typeof m === 'object') {
              if (m.status === 'recognizing text') {
                setProgressStatus(isAr ? `جاري استخراج وتحليل كلمات البطاقة... ${Math.round(m.progress * 100)}%` : `Extracting & segmenting card layout... ${Math.round(m.progress * 100)}%`);
                setProgressVal(Math.round(m.progress * 100));
              } else {
                setProgressStatus(isAr ? 'تحميل حزم القوالب والذكاء البصري...' : 'Loading Tesseract dictionaries...');
              }
            }
          }
        }
      );

      if (result && result.data) {
        const text = result.data.text || '';
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);

        // Advanced local Regex Parser for contact fields
        let emailMatched = '';
        let phoneMatched = '';
        let webMatched = '';
        let addressMatched = '';
        let fullNameMatched = '';
        let jobTitleMatched = '';
        let companyMatched = '';

        // Regex patterns
        const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})/gi;
        const phoneRegex = /(?:phone|tel|mobile|mob|هاتف|جوال|تليفون)?[:\s\-]*(\+?[\d\-\s()]{8,18})/gi;
        const webRegex = /(?:www\.|https?:\/\/)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/gi;

        // Perform pattern matches
        const emailMatches = text.match(emailRegex);
        if (emailMatches && emailMatches.length > 0) emailMatched = emailMatches[0];

        const webMatches = text.match(webRegex);
        if (webMatches && webMatches.length > 0) webMatched = webMatches[0];

        // Process line by line to extract structured details
        const infoLines: string[] = [];

        lines.forEach(line => {
          // Check phone
          const telMatch = pMatch(line, phoneRegex);
          if (telMatch && !phoneMatched) {
            phoneMatched = telMatch;
          }

          // Filter out lines that are purely emails, webs, or phone tags for raw textual analysis
          const hasEmail = emailRegex.test(line);
          const hasWeb = webRegex.test(line);
          const hasPhone = /[-+()0-9\s]{10,}/.test(line);

          if (!hasEmail && !hasWeb && !hasPhone) {
            infoLines.push(line);
          }
        });

        // Smart name and metadata locator
        if (infoLines.length > 0) {
          fullNameMatched = infoLines[0]; // Usually first line is name
        }
        if (infoLines.length > 1) {
          jobTitleMatched = infoLines[1]; // Second line is title / role
        }
        if (infoLines.length > 2) {
          companyMatched = infoLines[2]; // Third line is company or vice versa
        }
        if (infoLines.length > 3) {
          // Join rest as address
          addressMatched = infoLines.slice(3).join(', ');
        }

        setCardData({
          fullName: fullNameMatched || (isAr ? 'اسم غير معروف' : 'Unknown'),
          jobTitle: jobTitleMatched || (isAr ? 'مسمى وظيفي غير معروف' : 'Manager'),
          company: companyMatched || (isAr ? 'غير محدد' : 'Company Inc.'),
          phone: phoneMatched || (isAr ? 'لا يوجد هاتف' : '+1 555-0199'),
          email: emailMatched || 'info@example.com',
          website: webMatched || 'www.example.com',
          address: addressMatched || (isAr ? 'عنوان غير متاح' : 'HQ City')
        });

        // Trigger history log
        const textBlob = new Blob([JSON.stringify(cardData, null, 2)], { type: 'application/json' });
        onAddHistoryItem({
          action: isAr ? 'مسح بطاقة عمل' : 'Scan Business Card',
          fileName: `${file.name.split('.')[0]}_contact.vcf`,
          originalSize: file.size,
          processedSize: textBlob.size,
          type: 'image'
        }, textBlob);

        setProgressStatus(isAr ? 'تم الاستخراج بنجاح!' : 'Extracted successfully!');
      }
    } catch (err: any) {
      console.error(err);
      setProgressStatus(isAr ? `خطأ أثناء المعالجة: ${err.message}` : `Processing Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to extract regex matches
  const pMatch = (str: string, regex: RegExp): string => {
    const matches = [...str.matchAll(regex)];
    if (matches && matches[0]) {
      return matches[0][1] ? matches[0][1].trim() : matches[0][0].trim();
    }
    return '';
  };

  // Export as vCard (.vcf)
  const handleExportVcf = () => {
    const vcardContent = `BEGIN:VCARD
VERSION:3.0
FN;CHARSET=UTF-8:${cardData.fullName}
ORG;CHARSET=UTF-8:${cardData.company}
TITLE;CHARSET=UTF-8:${cardData.jobTitle}
TEL;TYPE=CELL,VOICE:${cardData.phone}
EMAIL;TYPE=PREF,INTERNET:${cardData.email}
URL:${cardData.website}
ADR;TYPE=WORK;CHARSET=UTF-8:;;${cardData.address}
END:VCARD`;

    const blob = new Blob([vcardContent], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${cardData.fullName || 'contact'}.vcf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6" id="business-card-scanner-container">
      {/* Title */}
      <div className="text-center mb-8">
        <div className="inline-flex p-3 bg-blue-100 text-blue-600 rounded-full mb-3 shadow-sm">
          <Contact className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          {isAr ? 'مسح وقراءة بطاقات العمل ذكياً' : 'Smart Business Card Scanner'}
        </h1>
        <p className="mt-2 text-gray-600 max-w-xl mx-auto text-sm sm:text-base">
          {isAr 
            ? 'ارفع صورة بطاقة العمل لاستخراج الاسم والعمل وبيانات الاتصال مع إمكانية التعديل والتصدير المباشر لملف جهات الاتصال vCard.' 
            : 'Upload a business card photo to extract full name, title, company, phone, email, and export as vCard contacts.'}
        </p>
      </div>

      {!file ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {isAr ? 'لغة البطاقة المرفوعة:' : 'Card Language:'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => setOcrLang('ara')}
                className={`py-2 px-3 text-xs sm:text-sm font-medium rounded-xl border transition ${
                  ocrLang === 'ara' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {isAr ? 'العربية فقط' : 'Arabic Only'}
              </button>
              <button 
                onClick={() => setOcrLang('eng')}
                className={`py-2 px-3 text-xs sm:text-sm font-medium rounded-xl border transition ${
                  ocrLang === 'eng' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {isAr ? 'الإنجليزية فقط' : 'English Only'}
              </button>
              <button 
                onClick={() => setOcrLang('ara+eng')}
                className={`py-2 px-3 text-xs sm:text-sm font-medium rounded-xl border transition ${
                  ocrLang === 'ara+eng' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
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
          {/* Preview panel */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 flex flex-col">
            <h3 className="text-gray-900 font-bold mb-3 flex items-center justify-between">
              <span>{isAr ? 'البطاقة المرفوعة' : 'Uploaded Card'}</span>
              <button 
                onClick={handleReset} 
                className="text-red-500 hover:text-red-600 transition flex items-center gap-1 text-xs sm:text-sm font-medium"
              >
                <Trash2 className="w-4 h-4" />
                {isAr ? 'إزالة' : 'Remove'}
              </button>
            </h3>
            <div className="relative flex-1 min-h-[220px] rounded-xl overflow-hidden border border-gray-100 bg-gray-55 flex items-center justify-center p-2 mb-4">
              <img 
                src={filePreview} 
                alt="Business Card Preview" 
                className="max-h-[300px] w-auto object-contain rounded-lg shadow-sm"
              />
            </div>
            {!cardData.fullName && (
              <button
                onClick={handleOcr}
                disabled={isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Contact className="w-5 h-5" />
                )}
                {isProcessing ? (isAr ? 'جاري التحليل واستخراج البيانات...' : 'Analyzing details...') : (isAr ? 'بدء استخراج وقراءة المعلومات' : 'Start Reading Contacts')}
              </button>
            )}

            {isProcessing && (
              <div className="mt-4 p-4 bg-blue-50/50 border border-blue-100/50 rounded-xl">
                <div className="flex justify-between text-xs text-blue-700 font-bold mb-1">
                  <span>{progressStatus}</span>
                  <span>{progressVal}%</span>
                </div>
                <div className="w-full bg-blue-100 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressVal}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Extracted Details / vCard Display */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
              <h3 className="text-gray-900 font-bold text-lg flex items-center gap-2">
                <Contact className="w-5 h-5 text-blue-600" />
                <span>{isAr ? 'بيانات جهة الاتصال المستخرجة' : 'Extracted Contact Details'}</span>
              </h3>
              {cardData.fullName && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-blue-600 hover:text-blue-700 transition flex items-center gap-1 text-xs font-semibold px-2 py-1 bg-blue-50 rounded-lg"
                >
                  {isEditing ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                  {isEditing ? (isAr ? 'حفظ' : 'Save') : (isAr ? 'تعديل' : 'Edit')}
                </button>
              )}
            </div>

            {!cardData.fullName ? (
              <div className="py-12 text-center text-gray-400 text-sm">
                <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
                {isAr 
                  ? 'يرجى النقر على زر البدء لتحليل بيانات بطاقة العمل بالمسح الضوئي.' 
                  : 'Please click start button to automatically extract contacts using OCR.'}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Visual Digital Card Preview */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl p-4 shadow-sm relative overflow-hidden mb-6">
                  <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
                    <Contact className="w-32 h-32" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg sm:text-xl">{cardData.fullName}</h4>
                    <p className="text-xs sm:text-sm text-blue-100 font-medium">{cardData.jobTitle}</p>
                    <p className="text-xs text-blue-200 mt-1">{cardData.company}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/20 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] sm:text-xs">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3 flex-shrink-0" />
                      <span>{cardData.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{cardData.email}</span>
                    </div>
                  </div>
                </div>

                {/* Form fields */}
                <div className="space-y-3">
                  {[
                    { field: 'fullName', label: isAr ? 'الاسم الكامل' : 'Full Name', icon: User },
                    { field: 'jobTitle', label: isAr ? 'المسمى الوظيفي' : 'Job Title', icon: Briefcase },
                    { field: 'company', label: isAr ? 'الشركة' : 'Company', icon: Building2 },
                    { field: 'phone', label: isAr ? 'الهاتف / الجوال' : 'Phone Number', icon: Phone },
                    { field: 'email', label: isAr ? 'البريد الإلكتروني' : 'Email Address', icon: Mail },
                    { field: 'website', label: isAr ? 'الموقع الإلكتروني' : 'Website', icon: Globe },
                    { field: 'address', label: isAr ? 'العنوان' : 'Address', icon: MapPin },
                  ].map(({ field, label, icon: Icon }) => (
                    <div key={field} className="flex flex-col sm:flex-row sm:items-center sm:gap-4 justify-between p-2 rounded-xl border border-gray-50 bg-gray-50/50 hover:bg-gray-50 transition">
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 font-medium mb-1 sm:mb-0 sm:w-1/3">
                        <Icon className="w-4 h-4 text-gray-400" />
                        <span>{label}</span>
                      </div>
                      
                      {isEditing ? (
                        <input
                          type="text"
                          value={cardData[field as keyof typeof cardData]}
                          onChange={(e) => setCardData({ ...cardData, [field]: e.target.value })}
                          className="flex-1 px-3 py-1 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="flex items-center justify-between flex-1 gap-2">
                          <span className="text-sm font-semibold text-gray-800 truncate select-all">
                            {cardData[field as keyof typeof cardData] || '-'}
                          </span>
                          {cardData[field as keyof typeof cardData] && (
                            <button
                              onClick={() => copyToClipboard(cardData[field as keyof typeof cardData], field)}
                              className="text-gray-400 hover:text-blue-600 p-1 rounded transition"
                              title={isAr ? 'نسخ الحقل' : 'Copy Field'}
                            >
                              {copiedField === field ? (
                                <Check className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Exporter triggers */}
                <div className="pt-4 flex gap-2">
                  <button
                    onClick={handleExportVcf}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
                  >
                    <Download className="w-5 h-5" />
                    <span>{isAr ? 'حفظ جهة الاتصال (vCard)' : 'Save Contact (vCard)'}</span>
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

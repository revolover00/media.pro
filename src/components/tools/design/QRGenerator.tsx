
import React, { useState, useRef } from 'react';
import { 
  QrCode, 
  Trash2, 
  Download, 
  Sparkles, 
  Check, 
  Link2, 
  Wifi, 
  Type, 
  UserSquare2,
  Settings,
  Eye,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

interface QRGeneratorProps {
  lang: 'ar' | 'en';
  onAddHistoryItem?: (item: any, blob?: Blob) => void;
}

export const QRGenerator: React.FC<QRGeneratorProps> = ({ lang, onAddHistoryItem }) => {
  const isAr = lang === 'ar';
  
  // Data Modes
  const [qrType, setQrType] = useState<'url' | 'wifi' | 'text' | 'contact'>('url');
  
  // Input fields
  const [rawUrl, setRawUrl] = useState<string>('https://www.google.com');
  const [rawText, setRawText] = useState<string>(isAr ? 'مرحبا بكم في FileForge Pro!' : 'Welcome to FileForge Pro!');
  
  // WiFi
  const [wifiSsid, setWifiSsid] = useState<string>('Forge_Guest_5G');
  const [wifiPass, setWifiPass] = useState<string>('LocalOfflineCompiler');
  const [wifiSecurity, setWifiSecurity] = useState<string>('WPA');

  // Contact vCard
  const [vFirstName, setVFirstName] = useState<string>('Ahmed');
  const [vLastName, setVLastName] = useState<string>('Ali');
  const [vPhone, setVPhone] = useState<string>('+966500112233');
  const [vEmail, setVEmail] = useState<string>('ahmed@forge.pro');

  // Custom styling options
  const [fgColor, setFgColor] = useState<string>('#0f172a');
  const [bgColor, setBgColor] = useState<string>('#ffffff');
  const [qrSize, setQrSize] = useState<number>(260);
  const [includeMargin, setIncludeMargin] = useState<boolean>(true);
  const [errorCorrection, setErrorCorrection] = useState<'L' | 'M' | 'Q' | 'H'>('H');
  
  // Central Logo overlay options
  const [logoBase64, setLogoBase64] = useState<string>('');
  const [logoSizePercent, setLogoSizePercent] = useState<number>(20);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toastMessage, setToastMessage] = useState<string>('');

  const showLocalToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Compile active data payload
  const getQrValue = (): string => {
    switch (qrType) {
      case 'url':
        return rawUrl.trim() || 'https://www.google.com';
      case 'text':
        return rawText || 'FileForge';
      case 'wifi':
        // WiFi standard syntax: WIFI:S:MySSID;T:WPA;P:MyPassword;;
        return `WIFI:S:${wifiSsid};T:${wifiSecurity};P:${wifiPass};;`;
      case 'contact':
        // vCard standard syntax
        return `BEGIN:VCARD\nVERSION:3.0\nN:${vLastName};${vFirstName}\nFN:${vFirstName} ${vLastName}\nTEL:${vPhone}\nEMAIL:${vEmail}\nEND:VCARD`;
      default:
        return 'FileForge';
    }
  };

  const qrValue = getQrValue();

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setLogoBase64(reader.result as string);
      showLocalToast(isAr ? 'تم دمج اللوجو بمركز الباركود!' : 'Branded logo integrated to the center of QR matrix!');
    };
    reader.readAsDataURL(file);
  };

  // Export current QR canvas as PNG
  const downloadQrPng = () => {
    const canvas = document.querySelector('#qr-canvas-preview canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const url = canvas.toDataURL('image/png', 1.0);
    const blob = dataURLtoBlob(url);
    const filename = `qrcode_${Date.now()}.png`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);

    showLocalToast(isAr ? 'تم تصدير وحفظ رمز الـ QR كصورة!' : 'Branded QR Code exported successfully!');

    if (onAddHistoryItem) {
      onAddHistoryItem({
        action: isAr ? 'توليد وتخصيص رمز باركود QR' : 'Interactive QR Synthesis',
        fileName: filename,
        originalSize: qrValue.length,
        processedSize: blob.size,
        type: 'image'
      }, blob);
    }
  };

  const dataURLtoBlob = (dataurl: string) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  return (
    <div id="qr-generator-container" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-5 sm:p-6 shadow-sm space-y-6 text-slate-700 dark:text-slate-200 font-sans">
      
      {/* Toast notifications */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 dark:bg-slate-800 text-white py-2.5 px-5 rounded-2xl shadow-lg border border-slate-700 text-xs font-bold animate-slideUp z-50 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-50 dark:border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-slate-950 text-white dark:bg-slate-800 p-3 rounded-2xl">
            <QrCode className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isAr ? 'مولد رموز الاستجابة السريعة QR المتقدم' : 'Bespoke Branded QR Code Generator'}
            </h2>
            <p className="text-xs text-slate-400">
              {isAr ? 'اصنع مظهر باركود فريد بتغيير الظلال والأبعاد وإدراج لوجو شركتك المخصصة في مركز الرمز الآمن' : 'Generate error-resilient QR Codes with custom color paths and pixel-perfect center logos'}
            </p>
          </div>
        </div>
      </div>

      {/* Main dashboard grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side Settings Form (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Data type tabs picker */}
          <div className="grid grid-cols-4 gap-1 border-b border-slate-100 dark:border-slate-800 pb-2">
            <button
              onClick={() => setQrType('url')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition cursor-pointer border-0 ${qrType === 'url' ? 'bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white font-bold' : 'text-slate-400 hover:text-slate-655'}`}
            >
              <Link2 className="w-4 h-4 mb-1" />
              <span className="text-[9px]">{isAr ? 'رابط وب' : 'Link'}</span>
            </button>

            <button
              onClick={() => setQrType('wifi')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition cursor-pointer border-0 ${qrType === 'wifi' ? 'bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white font-bold' : 'text-slate-400 hover:text-slate-655'}`}
            >
              <Wifi className="w-4 h-4 mb-1" />
              <span className="text-[9px]">{isAr ? 'واي فاي' : 'WiFi'}</span>
            </button>

            <button
              onClick={() => setQrType('text')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition cursor-pointer border-0 ${qrType === 'text' ? 'bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white font-bold' : 'text-slate-400 hover:text-slate-655'}`}
            >
              <Type className="w-4 h-4 mb-1" />
              <span className="text-[9px]">{isAr ? 'نصوص' : 'Text'}</span>
            </button>

            <button
              onClick={() => setQrType('contact')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition cursor-pointer border-0 ${qrType === 'contact' ? 'bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white font-bold' : 'text-slate-400 hover:text-slate-655'}`}
            >
              <UserSquare2 className="w-4 h-4 mb-1" />
              <span className="text-[9px]">{isAr ? 'كرت جهة اتصالي' : 'vCard'}</span>
            </button>
          </div>

          {/* Dynamic input forms render based on active tab type */}
          <div className="bg-slate-50 dark:bg-slate-800/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-3">
            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block border-b border-slate-205 pb-1">
              {isAr ? 'مستند وبيانات الباركود المسلوبة' : 'QR Destination Payload'}
            </span>

            {/* URL input */}
            {qrType === 'url' && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500">{isAr ? 'عنوان رابط الوب المقصود' : 'Target Destination URL'}</label>
                <input
                  type="url"
                  value={rawUrl}
                  onChange={(e) => setRawUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-lg py-1.5 px-3 text-xs"
                />
              </div>
            )}

            {/* General raw text */}
            {qrType === 'text' && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500">{isAr ? 'محتوى الرسالة / المذكرة النصية' : 'Raw Text Payload'}</label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  rows={2}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-lg py-1.5 px-3 text-xs"
                />
              </div>
            )}

            {/* WiFi Creds */}
            {qrType === 'wifi' && (
              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">{isAr ? 'اسم شبكة الواي فاي (SSID)' : 'WiFi SSID Network name'}</label>
                  <input
                    type="text"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-lg py-1 px-2.5 text-xs font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">{isAr ? 'كلمة المرور التأسيسية' : 'Network Password'}</label>
                    <input
                      type="password"
                      value={wifiPass}
                      onChange={(e) => setWifiPass(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-lg py-1 px-2.5"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">{isAr ? 'التأمين والتشفير' : 'Security Mode'}</label>
                    <select
                      value={wifiSecurity}
                      onChange={(e) => setWifiSecurity(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 rounded-lg py-1 px-2.5 cursor-pointer text-xs"
                    >
                      <option value="WPA">WPA/WPA2/WPA3</option>
                      <option value="WEP">WEP Legacy</option>
                      <option value="nopass">{isAr ? 'بدون تشفير (مكتب مفتوح)' : 'No Password'}</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Contact cards */}
            {qrType === 'contact' && (
              <div className="space-y-2 text-[10px]">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">{isAr ? 'الاسم الأول' : 'First Name'}</label>
                    <input
                      type="text"
                      value={vFirstName}
                      onChange={(e) => setVFirstName(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-lg py-1 px-2"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">{isAr ? 'الكنية / اللقب' : 'Last Name'}</label>
                    <input
                      type="text"
                      value={vLastName}
                      onChange={(e) => setVLastName(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-lg py-1 px-2"
                    />
                  </div>
                </div>

                <div className="space-y-1 font-mono">
                  <label className="font-bold text-slate-500">{isAr ? 'رقم الاتصال الدولي' : 'Phone Number'}</label>
                  <input
                    type="tel"
                    value={vPhone}
                    onChange={(e) => setVPhone(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-lg py-1 px-2.5"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500">{isAr ? 'البريد الإلكتروني' : 'Email Address'}</label>
                  <input
                    type="email"
                    value={vEmail}
                    onChange={(e) => setVEmail(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-lg py-1 px-2.5"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Color pickers & correction styles */}
          <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-3.5">
            <span className="text-[10px] font-bold text-slate-450 uppercase flex items-center gap-1.5 border-b border-slate-205 pb-1.5">
              <Settings className="w-4 h-4 text-purple-500" />
              {isAr ? 'تخصيص جماليات البورتريه' : 'Aesthetic Adjustments'}
            </span>

            {/* Colors picker row */}
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="space-y-1">
                <label className="font-bold text-slate-550 block mb-1">{isAr ? 'لون رمز البار المتنوب' : 'Data Path Color'}</label>
                <div className="flex items-center gap-1">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-8 h-6 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <span className="font-mono text-[9px] uppercase font-bold text-slate-500">{fgColor}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-550 block mb-1">{isAr ? 'لون الخلفية الأساسي' : 'Background Wall'}</label>
                <div className="flex items-center gap-1">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-8 h-6 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <span className="font-mono text-[9px] uppercase font-bold text-slate-500">{bgColor}</span>
                </div>
              </div>
            </div>

            {/* Logo uploads options */}
            <div className="space-y-1 pb-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-500">{isAr ? 'شعار / لوجو العلامة بالمركز' : 'Brandy Center Logo'}</label>
                {logoBase64 && (
                  <button 
                    onClick={() => setLogoBase64('')}
                    className="text-[9px] font-bold text-red-500 hover:underline border-0 bg-transparent cursor-pointer"
                  >
                    {isAr ? 'مسح اللوجو' : 'Clear logo'}
                  </button>
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleLogoUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center gap-1.5 hover:bg-slate-100/50 text-xs font-bold text-slate-650 dark:text-slate-300 cursor-pointer transition border-0"
              >
                {logoBase64 ? (
                  <>
                    <ImageIcon className="w-4 h-4 text-emerald-500 animate-pulse" />
                    <span className="text-[10px]">{isAr ? 'تم دمج اللوجو للتوليد' : 'Logo Embedded'}</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 text-slate-400" />
                    <span>{isAr ? 'تحميل صورة مخصصة للشعار' : 'Load central logo'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Error correction levels & Margin */}
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="space-y-1">
                <label className="font-bold text-slate-550 block mb-1">{isAr ? 'معدل تصحيح الخطأ (Resilience)' : 'Error Correction Level'}</label>
                <select
                  value={errorCorrection}
                  onChange={(e: any) => setErrorCorrection(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 py-1.5 px-2 rounded-lg text-xs"
                >
                  <option value="L">L (7% Recovery)</option>
                  <option value="M">M (15% Recovery)</option>
                  <option value="Q">Q (25% Recovery)</option>
                  <option value="H">H (30% Recovery - Recommended for logo)</option>
                </select>
              </div>

              <div className="space-y-1 flex flex-col justify-end pb-1 pr-1.5">
                <label className="flex items-center gap-1.5 font-bold text-slate-550 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeMargin}
                    onChange={(e) => setIncludeMargin(e.target.checked)}
                    className="accent-slate-900 rounded"
                  />
                  <span>{isAr ? 'إدراج إطار أبيض آمن' : 'Include Quiet margin'}</span>
                </label>
              </div>
            </div>

          </div>
        </div>

        {/* Right Side Rendering QR and Download tools (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800/80 pb-2.5">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-emerald-500" />
              {isAr ? 'معاينة الباركود النشط فوري الدقة' : 'Interactive QR Output Matrix'}
            </span>
          </div>

          {/* Canvas wrap container */}
          <div className="border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[352px] h-[352px]">
            <div id="qr-canvas-preview" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <QRCodeCanvas
                value={qrValue}
                size={qrSize}
                fgColor={fgColor}
                bgColor={bgColor}
                level={errorCorrection}
                includeMargin={includeMargin}
                imageSettings={logoBase64 ? {
                  src: logoBase64,
                  height: (qrSize * logoSizePercent) / 100,
                  width: (qrSize * logoSizePercent) / 100,
                  excavate: true,
                } : undefined}
              />
            </div>
            
            <div className="text-[10px] font-mono text-center text-slate-400 mt-4 leading-normal max-w-sm truncate whitespace-nowrap">
              <strong>{isAr ? 'الحمولة المدمجة:' : 'Payload:'}</strong> {qrValue}
            </div>
          </div>

          {/* Download strip */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-[10px] text-slate-400">
              {isAr ? 'يتضمن الرمز المصدّر بنية آمنة للقراءة من مختلف كاميرات الهواتف الذكية' : 'Synthesized dynamically from credentials above'}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={downloadQrPng}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5 border-0 shadow-sm transition"
              >
                <Download className="w-4 h-4" />
                <span>{isAr ? 'تنزيل الباركود PNG' : 'Download PNG'}</span>
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

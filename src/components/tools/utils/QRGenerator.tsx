import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  QrCode, 
  Download, 
  Trash2, 
  Eye, 
  Palette, 
  Upload, 
  FileCode, 
  Wifi, 
  Mail, 
  Link as LinkIcon, 
  Calendar, 
  User, 
  Info,
  CheckCircle2
} from 'lucide-react';

interface QRGeneratorProps {
  lang: 'ar' | 'en';
  onAddHistoryItem?: (
    itemData: { action: string; fileName: string; originalSize: number; processedSize: number; type: 'pdf' | 'image' },
    blob: Blob,
    originalBlobOrUrl: Blob | string
  ) => void;
}

export const QRGenerator: React.FC<QRGeneratorProps> = ({ lang, onAddHistoryItem }) => {
  const [qrType, setQrType] = useState<'text' | 'url' | 'vcard' | 'wifi' | 'email' | 'event'>('url');
  
  // Form schemas
  const [textVal, setTextVal] = useState('');
  const [urlVal, setUrlVal] = useState('https://');
  
  // WiFi
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiEncryption, setWifiEncryption] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');

  // Email
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  // Calendar Event
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');

  // vCard
  const [vcardName, setVcardName] = useState('');
  const [vcardPhone, setVcardPhone] = useState('');
  const [vcardEmail, setVcardEmail] = useState('');
  const [vcardOrg, setVcardOrg] = useState('');
  const [vcardUrl, setVcardUrl] = useState('');

  // Configuration Params
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [qrSize, setQrSize] = useState(300);
  const [errorCorrection, setErrorCorrection] = useState<'L' | 'M' | 'Q' | 'H'>('H');
  const [margin, setMargin] = useState(4);
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
  };

  // Compile final raw string payload for the QR encoder
  const getCompiledText = (): string => {
    switch (qrType) {
      case 'text':
        return textVal || 'FileForge Pro';
      case 'url':
        return urlVal || 'https://';
      case 'wifi':
        return `WIFI:S:${wifiSsid};T:${wifiEncryption};P:${wifiPassword};;`;
      case 'email':
        const subj = encodeURIComponent(emailSubject);
        const bdy = encodeURIComponent(emailBody);
        return `mailto:${emailTo}?subject=${subj}&body=${bdy}`;
      case 'event':
        const cleanDate = eventDate.replace(/[-:]/g, '');
        return `BEGIN:VEVENT\nSUMMARY:${eventTitle}\nLOCATION:${eventLocation}\nDTSTART:${cleanDate}T090000Z\nEND:${cleanDate}T100000Z\nEND:VEVENT`;
      case 'vcard':
        return `BEGIN:VCARD\nVERSION:3.0\nN:${vcardName}\nFN:${vcardName}\nORG:${vcardOrg}\nTEL;TYPE=CELL:${vcardPhone}\nEMAIL:${vcardEmail}\nURL:${vcardUrl}\nEND:VCARD`;
      default:
        return 'FileForge Pro';
    }
  };

  const redrawQRCode = async () => {
    if (!canvasRef.current) return;
    
    const rawPayload = getCompiledText();
    const canvas = canvasRef.current;
    
    try {
      // 1. Draw base QR Code directly via canvas options
      await QRCode.toCanvas(canvas, rawPayload, {
        width: qrSize,
        margin: margin,
        errorCorrectionLevel: errorCorrection,
        color: {
          dark: fgColor,
          light: bgColor
        }
      });

      // 2. Overlay Logo in center if uploaded
      if (logoPreview) {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.src = logoPreview;
        
        await new Promise<void>((resolve) => {
          img.onload = () => {
            // Draw center logo scaled proportionately
            const qrPixels = canvas.width;
            
            // Limit center logo size to 20% of QR size to prevent breaking barcode scanning alignment
            const logoMaxRatio = 0.22; 
            const logoSize = qrPixels * logoMaxRatio;
            const x = (qrPixels - logoSize) / 2;
            const y = (qrPixels - logoSize) / 2;
            
            // Draw matching solid background cover first for logo visibility
            ctx.fillStyle = bgColor;
            ctx.beginPath();
            ctx.roundRect 
              ? ctx.roundRect(x - 4, y - 4, logoSize + 8, logoSize + 8, 8)
              : ctx.rect(x - 4, y - 4, logoSize + 8, logoSize + 8);
            ctx.fill();

            // Draw image itself
            ctx.drawImage(img, x, y, logoSize, logoSize);
            resolve();
          };
        });
      }
    } catch (err) {
      console.error('Failed to update QR Code render:', err);
    }
  };

  useEffect(() => {
    redrawQRCode();
  }, [
    qrType,
    textVal,
    urlVal,
    wifiSsid,
    wifiPassword,
    wifiEncryption,
    emailTo,
    emailSubject,
    emailBody,
    eventTitle,
    eventDate,
    eventLocation,
    vcardName,
    vcardPhone,
    vcardEmail,
    vcardOrg,
    vcardUrl,
    fgColor,
    bgColor,
    qrSize,
    errorCorrection,
    margin,
    logoPreview
  ]);

  const handleDownload = (format: 'png' | 'svg') => {
    if (!canvasRef.current) return;

    try {
      if (format === 'png') {
        const url = canvasRef.current.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = url;
        link.download = `qr_code_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Push process into local history database
        if (onAddHistoryItem) {
          canvasRef.current.toBlob((blob) => {
            if (blob) {
              onAddHistoryItem(
                {
                  action: lang === 'ar' ? 'إنشاء رمز استجابة سريعة QR' : 'Generate QR Code Image',
                  fileName: `qrcode_${Date.now()}.png`,
                  originalSize: 1024,
                  processedSize: blob.size,
                  type: 'image'
                },
                blob,
                ''
              );
            }
          });
        }
      } else {
        // Build crisp SVG code manually or via XML serializer
        const rawPayload = getCompiledText();
        QRCode.toString(rawPayload, {
          type: 'svg',
          errorCorrectionLevel: errorCorrection,
          margin: margin,
          width: qrSize,
          color: {
            dark: fgColor,
            light: bgColor
          }
        }, (err, svgString) => {
          if (err) throw err;
          const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(svgBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `qr_code_${Date.now()}.svg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        });
      }
      triggerToast(lang === 'ar' ? 'تم تحميل الرمز بنجاح!' : 'QR Code downloaded successfully!');
    } catch (err) {
      console.error(err);
      triggerToast(lang === 'ar' ? 'فشل تحضير الملف للتحميل.' : 'Oops, failed preparing download package.');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-purple-100 dark:border-slate-700 shadow-sm space-y-6">
      
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-900 border border-emerald-500/30 text-white py-3 px-5 rounded-2xl shadow-xl animate-slideIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold leading-none">{toast}</span>
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-50 dark:border-slate-700 pb-5">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-purple-600 to-indigo-600 p-2.5 rounded-2xl text-white shadow-md">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg text-slate-950 dark:text-white flex items-center gap-2">
              {lang === 'ar' ? 'منشئ رموز الاستجابة السريعة QR المتقدم' : 'Advanced QR Code Studio'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'ar'
                ? 'أنشئ رموز QR مخصصة للنصوص، الروابط، شبكات الواي فاي، جهات الاتصال والتقويم مع وضع لوجو وشعار مخصص بالمنتصف.'
                : 'Formulate bespoke QR assets containing URLs, credentials, event alerts with active logo embedding controls.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left column: input type forms */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Sub category tabs */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-2xl border border-slate-150 dark:border-slate-800">
            {[
              { id: 'url', labelAr: 'رابط', labelEn: 'URL', icon: LinkIcon },
              { id: 'text', labelAr: 'نص', labelEn: 'Text', icon: User },
              { id: 'wifi', labelAr: 'واي فاي', labelEn: 'WiFi', icon: Wifi },
              { id: 'email', labelAr: 'بريد', labelEn: 'Email', icon: Mail },
              { id: 'event', labelAr: 'حدث', labelEn: 'Event', icon: Calendar },
              { id: 'vcard', labelAr: 'اتصال', labelEn: 'vCard', icon: FileCode }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setQrType(tab.id as any)}
                className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${qrType === tab.id ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'}`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="text-[10px] font-extrabold leading-none">{lang === 'ar' ? tab.labelAr : tab.labelEn}</span>
              </button>
            ))}
          </div>

          {/* Type specific forms */}
          <div className="bg-slate-50/50 dark:bg-slate-900/10 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
            
            {qrType === 'url' && (
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">{lang === 'ar' ? 'رابط الموقع الإلكتروني (URL):' : 'Destination Link (URL):'}</label>
                <input
                  type="url"
                  value={urlVal}
                  onChange={(e) => setUrlVal(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 p-3 rounded-xl text-xs text-slate-800 dark:text-slate-200"
                  placeholder="https://example.com"
                />
              </div>
            )}

            {qrType === 'text' && (
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">{lang === 'ar' ? 'النص الخام أو الرسالة:' : 'Raw message / Notes:'}</label>
                <textarea
                  value={textVal}
                  onChange={(e) => setTextVal(e.target.value)}
                  rows={3}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 p-3 rounded-xl text-xs text-slate-800 dark:text-slate-200"
                  placeholder={lang === 'ar' ? 'اكتب النص المراد مسحه...' : 'Write notes content here...'}
                />
              </div>
            )}

            {qrType === 'wifi' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">{lang === 'ar' ? 'اسم شبكة الواي فاي (SSID):' : 'Wi-Fi Network Name (SSID):'}</label>
                  <input
                    type="text"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 p-3 rounded-xl text-xs"
                    placeholder="Home_Router_5G"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">{lang === 'ar' ? 'كلمة المرور:' : 'Security Password:'}</label>
                    <input
                      type="password"
                      value={wifiPassword}
                      onChange={(e) => setWifiPassword(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 p-3 rounded-xl text-xs"
                      placeholder="******"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">{lang === 'ar' ? 'نوع الحماية:' : 'Encryption Protocol:'}</label>
                    <select
                      value={wifiEncryption}
                      onChange={(e) => setWifiEncryption(e.target.value as any)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 p-3 rounded-xl text-xs text-slate-700 dark:text-slate-300"
                    >
                      <option value="WPA">WPA / WPA2</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">{lang === 'ar' ? 'مفتوحة (بدون كلمة مرور)' : 'Unprotected (No password)'}</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {qrType === 'email' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">{lang === 'ar' ? 'عنوان البريد الإلكتروني للمستلم:' : 'Target Recipient Email:'}</label>
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 p-3 rounded-xl text-xs"
                    placeholder="example@gmail.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">{lang === 'ar' ? 'عنوان الرسالة (Subject):' : 'Predefined Subject Line:'}</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 p-3 rounded-xl text-xs"
                    placeholder={lang === 'ar' ? 'تحية من برو ميديا' : 'Hello from FileForge'}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">{lang === 'ar' ? 'محتوى الرسالة (Body):' : 'Predefined Email Body:'}</label>
                  <textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    rows={2}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 p-3 rounded-xl text-xs"
                    placeholder={lang === 'ar' ? 'مرحباً، أود الاستفسار عن...' : 'Write template body here...'}
                  />
                </div>
              </div>
            )}

            {qrType === 'event' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">{lang === 'ar' ? 'عنوان المناسبة أو الحدث:' : 'Event Alert Title:'}</label>
                  <input
                    type="text"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 p-3 rounded-xl text-xs"
                    placeholder={lang === 'ar' ? 'عرض فني للملفات' : 'FileForge Release Launch'}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">{lang === 'ar' ? 'موعد وتاريخ البدء:' : 'Target Event Date:'}</label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 p-3 rounded-xl text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">{lang === 'ar' ? 'الموقع الجغرافي أو الرابط:' : 'Location Place:'}</label>
                    <input
                      type="text"
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 p-3 rounded-xl text-xs"
                      placeholder="Google Meet / Riyadh"
                    />
                  </div>
                </div>
              </div>
            )}

            {qrType === 'vcard' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">{lang === 'ar' ? 'الاسم بالكامل:' : 'Full Display Name:'}</label>
                    <input
                      type="text"
                      value={vcardName}
                      onChange={(e) => setVcardName(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 p-2.5 rounded-xl text-xs"
                      placeholder="Ahmed Al-Malki"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">{lang === 'ar' ? 'رقم الهاتف الجوال:' : 'Active cellular connection:'}</label>
                    <input
                      type="tel"
                      value={vcardPhone}
                      onChange={(e) => setVcardPhone(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 p-2.5 rounded-xl text-xs"
                      placeholder="+966 50 000 0000"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">{lang === 'ar' ? 'البريد الإلكتروني:' : 'vCard Email address:'}</label>
                    <input
                      type="email"
                      value={vcardEmail}
                      onChange={(e) => setVcardEmail(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 p-2.5 rounded-xl text-xs"
                      placeholder="ahmed@example.com"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">{lang === 'ar' ? 'اسم الشركة/المؤسسة:' : 'Work Organization / Company:'}</label>
                    <input
                      type="text"
                      value={vcardOrg}
                      onChange={(e) => setVcardOrg(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 p-2.5 rounded-xl text-xs"
                      placeholder="FileForge Inc"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">{lang === 'ar' ? 'الموقع الإلكتروني لمجال عملك:' : 'Corporate URL profile:'}</label>
                  <input
                    type="url"
                    value={vcardUrl}
                    onChange={(e) => setVcardUrl(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 p-2.5 rounded-xl text-xs"
                    placeholder="https://forge.me"
                  />
                </div>
              </div>
            )}

          </div>

          {/* Color & Size configuration sliders */}
          <div className="bg-slate-50/50 dark:bg-slate-900/10 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
            <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-300 flex items-center gap-1.5 pb-2 border-b border-slate-200 dark:border-slate-750">
              <Palette className="w-4 h-4 text-purple-600" />
              <span>{lang === 'ar' ? 'تخصيص الهوية والجماليات للرمز' : 'Aesthetic Color Configurations'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-750">
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border-0"
                />
                <div>
                  <label className="text-[10px] text-slate-400 block">{lang === 'ar' ? 'لون النقاط والرموز (برونق):' : 'Foreground Blocks:'}</label>
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">{fgColor}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-750">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border-0"
                />
                <div>
                  <label className="text-[10px] text-slate-400 block">{lang === 'ar' ? 'لون الخلفية الافتراضي:' : 'Background Color:'}</label>
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">{bgColor}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">{lang === 'ar' ? 'أبعاد الرمز (بكسل):' : 'Canvas Render size:'}</label>
                <select
                  value={qrSize}
                  onChange={(e) => setQrSize(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-755 p-2.5 rounded-xl text-xs font-mono"
                >
                  <option value={200}>200 x 200 px</option>
                  <option value={300}>300 x 300 px</option>
                  <option value={400}>400 x 400 px</option>
                  <option value={600}>600 x 600 px</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">{lang === 'ar' ? 'هامش الرمز الذكي:' : 'Border Quiet-Zone:'}</label>
                <select
                  value={margin}
                  onChange={(e) => setMargin(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-755 p-2.5 rounded-xl text-xs font-mono"
                >
                  <option value={1}>1px (Compact)</option>
                  <option value={2}>2px</option>
                  <option value={4}>4px (Default)</option>
                  <option value={6}>6px</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">{lang === 'ar' ? 'مستوى مقاومة الأخطاء:' : 'Error Redundancy:'}</label>
                <select
                  value={errorCorrection}
                  onChange={(e) => setErrorCorrection(e.target.value as any)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-755 p-2.5 rounded-xl text-xs font-mono"
                >
                  <option value="L">L (7% Repairable)</option>
                  <option value="M">M (15% Repairable)</option>
                  <option value="Q">Q (25% Repairable)</option>
                  <option value="H">H (30% Repairable - Perfect for custom logos)</option>
                </select>
              </div>
            </div>

            {/* Custom logo integration */}
            <div className="pt-3 border-t border-slate-150 dark:border-slate-750 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">{lang === 'ar' ? 'إضافة شعار بالقرص الأوسط:' : 'Embed Center Logo Overlay:'}</span>
              </div>
              
              <div className="flex items-center gap-2">
                {logoPreview ? (
                  <div className="flex items-center gap-2">
                    <img src={logoPreview} className="w-8 h-8 rounded-lg object-contain border border-slate-250 dark:border-slate-700 p-0.5" />
                    <button
                      onClick={handleRemoveLogo}
                      className="text-xs text-red-500 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'حذف الشعار' : 'Erase Logo'}</span>
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="qr-logo-picker"
                      onChange={handleLogoUpload}
                    />
                    <label
                      htmlFor="qr-logo-picker"
                      className="inline-flex items-center gap-1 bg-purple-550/10 dark:bg-slate-750 hover:bg-purple-100 text-purple-600 dark:text-purple-300 py-1.5 px-3 rounded-xl text-xs cursor-pointer transition-colors"
                    >
                      <Upload className="w-3 h-3" />
                      <span>{lang === 'ar' ? 'اختر صورة من جهازك' : 'Upload Icon logo'}</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Right column: live updates canvas preview area */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-6">
          <div className="text-center">
            <h3 className="font-extrabold text-xs text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5">
              <Eye className="w-4 h-4 text-purple-600" />
              <span>{lang === 'ar' ? 'معاينة الباركود الفورية' : 'Live Vector Barcode Preview'}</span>
            </h3>
            <span className="text-[10px] text-slate-400 block mt-1">{lang === 'ar' ? 'قم بمسحه بكاميرا هاتفك مباشرة' : 'Scan directly using your smartphone camera'}</span>
          </div>

          <div className="bg-white p-4.5 rounded-2xl shadow-md border border-slate-200 flex items-center justify-center">
            <canvas ref={canvasRef} className="max-w-full rounded-lg" style={{ width: '220px', height: '220px' }}></canvas>
          </div>

          <div className="grid grid-cols-2 gap-2.5 w-full">
            <button
              onClick={() => handleDownload('png')}
              className="inline-flex items-center justify-center gap-1 bg-purple-600 hover:bg-purple-500 text-white font-extrabold py-3 px-4 rounded-xl text-xs cursor-pointer shadow transition-all"
            >
              <Download className="w-4 h-4" />
              <span>PNG IMAGE</span>
            </button>
            <button
              onClick={() => handleDownload('svg')}
              className="inline-flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 dark:bg-slate-750 dark:hover:bg-slate-650 text-white font-extrabold py-3 px-4 rounded-xl text-xs cursor-pointer shadow transition-all"
            >
              <FileCode className="w-4 h-4" />
              <span>SVG VECTOR</span>
            </button>
          </div>

          <div className="bg-purple-500/10 text-purple-600 dark:text-purple-300 text-[10px] p-3 rounded-xl border border-purple-500/10 text-center flex items-start gap-1.5">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-left leading-normal">{lang === 'ar' ? 'ملاحظة: إذا عجز هاتفك عن التقاط الرمز، عدل نسبة مقاومة الخطأ لتصبح (H) أو قم بتقليل حجم اللوجو بالمنتصف.' : 'Tip: If scanning fails, choose Level H error correction or reduce the center logo width.'}</p>
          </div>

        </div>

      </div>

    </div>
  );
};

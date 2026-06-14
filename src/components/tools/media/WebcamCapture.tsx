'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Settings, 
  RotateCw, 
  Download, 
  Copy, 
  Check, 
  Sliders, 
  Sparkles, 
  Flashlight, 
  Trash2,
  Tv,
  CheckCircle2,
  VideoOff
} from 'lucide-react';
import { useMediaProcessing } from '../../../hooks/useMediaProcessing';
import { HistoryItem } from '../../../types';

interface WebcamCaptureProps {
  lang: 'ar' | 'en';
  onAddHistoryItem?: (item: any, blob?: any, original?: any) => void;
}

type FilterType = 'none' | 'grayscale' | 'sepia' | 'invert' | 'blur' | 'brightness' | 'contrast' | 'saturate' | 'hue-rotate';

export const WebcamCapture: React.FC<WebcamCaptureProps> = ({ lang, onAddHistoryItem }) => {
  const isAr = lang === 'ar';
  const { formatBytes } = useMediaProcessing();

  // Settings
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [activeFilter, setActiveFilter] = useState<FilterType>('none');
  const [filterIntensity, setFilterIntensity] = useState<number>(100);

  // States
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [capturedUrl, setCapturedUrl] = useState<string>('');
  const [flashOn, setFlashOn] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    stopCamera();
    setStreamActive(false);

    try {
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.warn('Play interrupted/aborted', e));
          setStreamActive(true);
        };
      }
    } catch (err) {
      console.error('Camera access failure: ', err);
      // Fail silently or notify user
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStreamActive(false);
  };

  const captureSnapshot = () => {
    if (!videoRef.current || !streamActive) return;

    // Flash animation effect
    setFlashOn(true);
    setTimeout(() => setFlashOn(false), 200);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Direct flip translation support if user facing
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    // Apply real-time canvas filter mapping based on CSS counterparts
    let filterString = 'none';
    if (activeFilter !== 'none') {
      const suffix = activeFilter === 'blur' ? 'px' : activeFilter === 'hue-rotate' ? 'deg' : '%';
      const val = activeFilter === 'blur' ? (filterIntensity / 10).toFixed(1) : filterIntensity;
      filterString = `${activeFilter}(${val}${suffix})`;
    }
    ctx.filter = filterString;

    // Draw frame onto compiled image
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedUrl(dataUrl);

    // Save logs to history registry
    canvas.toBlob((blob) => {
      if (blob && onAddHistoryItem) {
        onAddHistoryItem(
          {
            action: isAr ? 'التقاط لقطة مباشرة من الكاميرا' : 'Camera Snapshot Capture',
            fileName: `snapshot_${Date.now()}.jpg`,
            originalSize: 0,
            processedSize: blob.size,
            type: 'image'
          },
          blob
        );
      }
    }, 'image/jpeg', 0.9);
  };

  const triggerDownload = () => {
    if (!capturedUrl) return;
    const a = document.createElement('a');
    a.href = capturedUrl;
    a.download = `camera_shot_${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const triggerCopyToClipboard = async () => {
    if (!capturedUrl) return;
    try {
      const res = await fetch(capturedUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Clipboard copy failed:', e);
      alert(isAr ? 'لم يستطع المتصفح نسخ اللقطة تلقائياً للقصاصات.' : 'Your system or browser blocks clipboard canvas writes.');
    }
  };

  // Build filter style representation
  const getFilterStyle = (): React.CSSProperties => {
    if (activeFilter === 'none') return {};
    const suffix = activeFilter === 'blur' ? 'px' : activeFilter === 'hue-rotate' ? 'deg' : '%';
    const val = activeFilter === 'blur' ? (filterIntensity / 10).toFixed(1) : filterIntensity;
    return {
      filter: `${activeFilter}(${val}${suffix})`
    };
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-purple-100 dark:border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-2xl">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {isAr ? '📸 استوديو الكاميرا والتقاط اللقطات الذاتي' : '📸 Live Camera Filter Studio'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {isAr 
                ? 'التقط صوراً فورية مع مجموعة من الفلاتر الحية والمؤثرات، واحفظها بدقة عالية أو انسخها محلياً.'
                : 'Configure system camera loops. Apply smart visual filters, snapshot instantly with a classic flash, download, or copy directly.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Mirror Loop Dashboard */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 space-y-6">
          <div className="relative rounded-2xl overflow-hidden aspect-video bg-black flex items-center justify-center border border-slate-205">
            {/* Mirror stage */}
            <video
              ref={videoRef}
              playsInline
              muted
              style={getFilterStyle()}
              className={`w-full h-full object-contain ${facingMode === 'user' ? '-scale-x-100' : ''}`}
            />

            {/* Flash Effect mask overlay */}
            {flashOn && (
              <div className="absolute inset-0 bg-white z-20 animate-fadeIn" />
            )}

            {!streamActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-405 p-6 text-center space-y-2">
                <VideoOff className="w-10 h-10 text-slate-500 animate-bounce" />
                <h4 className="text-sm font-extrabold">{isAr ? 'في انتظار تفعيل الكاميرا...' : 'Awaiting device stream access...'}</h4>
                <p className="text-[10px] text-slate-500">{isAr ? 'يرجى إعطاء الصلاحيات لغرض تشغيل الاستوديو بصورة سليمة.' : 'Grant access to test this local suite snapshot engine.'}</p>
              </div>
            )}

            {/* Live Camera shutter button overlay */}
            {streamActive && (
              <button
                onClick={captureSnapshot}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-650 hover:bg-red-500 hover:scale-105 active:scale-95 text-white p-3.5 rounded-full shadow-2xl transition-all cursor-pointer z-10"
                title={isAr ? 'التقاط الصورة' : 'Trigger snapshot Shutter'}
              >
                <div className="w-5 h-5 rounded-full border-2 border-white bg-transparent" />
              </button>
            )}
          </div>

          {/* Captured Result previews */}
          {capturedUrl && (
            <div className="p-4 bg-purple-50/20 dark:bg-slate-900/40 rounded-2xl border border-purple-100 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-4 animate-fadeIn">
              <img 
                src={capturedUrl} 
                alt="Captured Snapshot" 
                className="max-h-[140px] rounded-lg border border-slate-200 bg-white object-contain"
              />
              <div className="flex-1 space-y-3 text-center sm:text-start">
                <div>
                  <h4 className="text-xs font-black text-slate-705 dark:text-slate-300">{isAr ? 'اللقطة الملتقطة حالياً:' : 'Snapshot Captured:'}</h4>
                  <p className="text-[10px] text-slate-400 mt-1">{isAr ? 'تم معالجة الفلتر ودمجه بالملف، جاهز للتنزيل أو النسخ.' : 'Effects baked inside, ready to share or archive.'}</p>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <button
                    onClick={triggerDownload}
                    className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-1.5 px-3.5 rounded-lg cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isAr ? 'تنزيل اللقطة' : 'Download'}</span>
                  </button>

                  <button
                    onClick={triggerCopyToClipboard}
                    className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold text-xs py-1.5 px-3.5 rounded-lg cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ للمجلد' : 'Copy')}</span>
                  </button>

                  <button
                    onClick={() => setCapturedUrl('')}
                    className="text-xs text-red-500 font-bold hover:underline cursor-pointer"
                  >
                    {isAr ? 'إفراغ اللقطة' : 'Discard'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filter adjustments and configurations */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Settings className="w-4 h-4 text-purple-600" />
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{isAr ? 'الفلاتر والمؤثرات الحية' : 'Live Filter Studio'}</h3>
          </div>

          <div className="space-y-4">
            {/* Toggle front/back facing */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-550 dark:text-slate-300 block">{isAr ? 'عرض الكاميرا النشط' : 'Camera Facing Direction'}</label>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFacingMode('user')}
                  className={`py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${facingMode === 'user' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-850'}`}
                >
                  {isAr ? 'الأمامية (سيلفي)' : 'Front Camera'}
                </button>
                <button
                  type="button"
                  onClick={() => setFacingMode('environment')}
                  className={`py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${facingMode === 'environment' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-850'}`}
                >
                  {isAr ? 'الخلفية' : 'Rear Camera'}
                </button>
              </div>
            </div>

            {/* Live filters selection list */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-550 dark:text-slate-305 block">{isAr ? 'اختر تأثير الفلتر المباشر' : 'Select Active Filter Preset'}</label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-50 dark:bg-slate-900 rounded-xl">
                {['none', 'grayscale', 'sepia', 'invert', 'blur', 'brightness', 'contrast', 'saturate', 'hue-rotate'].map((flt) => (
                  <button
                    key={flt}
                    type="button"
                    onClick={() => {
                      setActiveFilter(flt as any);
                      // Set logical intensity default based on filter
                      if (flt === 'blur') setFilterIntensity(20);
                      else if (flt === 'brightness' || flt === 'contrast' || flt === 'saturate') setFilterIntensity(150);
                      else if (flt === 'hue-rotate') setFilterIntensity(90);
                      else setFilterIntensity(100);
                    }}
                    className={`py-1.5 rounded-lg text-[9px] font-black capitalize transition-all cursor-pointer ${activeFilter === flt ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-850'}`}
                  >
                    {isAr 
                      ? (flt === 'none' ? 'بدون' : flt === 'grayscale' ? 'رمادي' : flt === 'sepia' ? 'عتيق' : flt === 'invert' ? 'معكوس' : flt === 'blur' ? 'ضبابي' : flt === 'brightness' ? 'إضاءة' : flt === 'contrast' ? 'تباين' : flt === 'saturate' ? 'تشبع' : 'تلوين') 
                      : flt}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Intensity Slider */}
            {activeFilter !== 'none' && (
              <div className="space-y-1.5 p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-120 animate-slideIn">
                <label className="text-xs font-bold text-slate-550 dark:text-slate-300 flex justify-between">
                  <span>{isAr ? 'شدة التأثير المستهدف:' : 'Filter Intensity Level:'}</span>
                  <span className="text-purple-600 font-mono">
                    {activeFilter === 'blur' ? `${(filterIntensity / 10).toFixed(1)}px` : activeFilter === 'hue-rotate' ? `${filterIntensity}°` : `${filterIntensity}%`}
                  </span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={activeFilter === 'blur' ? 100 : activeFilter === 'hue-rotate' ? 360 : 300}
                  step={1}
                  value={filterIntensity}
                  onChange={(e) => setFilterIntensity(parseInt(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>
            )}

            <button
              onClick={startCamera}
              className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-205 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>{isAr ? 'إعادة تشغيل البث الكاميرا' : 'Refresh Camera Loop'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

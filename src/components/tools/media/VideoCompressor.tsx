'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Minimize2, 
  Settings, 
  Sparkles, 
  ArrowLeftRight, 
  Eye, 
  Download, 
  Trash2, 
  Loader2, 
  Heart, 
  CheckCircle2 
} from 'lucide-react';
import { useMediaProcessing } from '../../../hooks/useMediaProcessing';
import { HistoryItem } from '../../../types';

interface VideoCompressorProps {
  lang: 'ar' | 'en';
  onAddHistoryItem?: (item: any, blob?: any, original?: any) => void;
}

export const VideoCompressor: React.FC<VideoCompressorProps> = ({ lang, onAddHistoryItem }) => {
  const isAr = lang === 'ar';
  const { formatBytes, formatTime } = useMediaProcessing();

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [originalWidth, setOriginalWidth] = useState<number>(0);
  const [originalHeight, setOriginalHeight] = useState<number>(0);

  // Settings
  const [compressionLevel, setCompressionLevel] = useState<'extreme' | 'high' | 'medium' | 'low'>('medium');
  const [resolutionPreset, setResolutionPreset] = useState<'4K' | '1080p' | '720p' | '480p' | '365p'>('720p');
  const [outputFormat, setOutputFormat] = useState<'webm' | 'mp4'>('webm');

  // Work states
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [compressedUrl, setCompressedUrl] = useState<string>('');
  const [compressedSize, setCompressedSize] = useState<number>(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (compressedUrl) URL.revokeObjectURL(compressedUrl);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [videoUrl, compressedUrl]);

  const handleFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoFile(file);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    if (compressedUrl) {
      URL.revokeObjectURL(compressedUrl);
      setCompressedUrl('');
      setCompressedSize(0);
    }

    const url = URL.createObjectURL(file);
    setVideoUrl(url);

    const tempVideo = document.createElement('video');
    tempVideo.src = url;
    tempVideo.onloadedmetadata = () => {
      setVideoDuration(tempVideo.duration || 5);
      setOriginalWidth(tempVideo.videoWidth || 1280);
      setOriginalHeight(tempVideo.videoHeight || 720);
    };
  };

  const handleCompress = async () => {
    if (!videoFile || !videoUrl) return;

    setIsProcessing(true);
    setProgress(0);
    setCompressedUrl('');
    setCompressedSize(0);

    // Target width & height bounds
    let targetWidth = 1285;
    let targetHeight = 720;

    switch (resolutionPreset) {
      case '4K':
        targetWidth = 3845; targetHeight = 2160; break;
      case '1080p':
        targetWidth = 1920; targetHeight = 1080; break;
      case '720p':
        targetWidth = 1280; targetHeight = 720; break;
      case '480p':
        targetWidth = 854; targetHeight = 480; break;
      case '365p':
        targetWidth = 640; targetHeight = 360; break;
      default:
        targetWidth = originalWidth; targetHeight = originalHeight;
    }

    // Scale aspect ratio properly
    const scale = Math.min(targetWidth / originalWidth, 1);
    const finalWidth = Math.round(originalWidth * scale);
    const finalHeight = Math.round(originalHeight * scale);

    // Bitrate multiplier based on compression level
    let targetBitrate = 2000000; // 2mbps medium default
    if (compressionLevel === 'extreme') {
      targetBitrate = 450000; // 450kbps
    } else if (compressionLevel === 'high') {
      targetBitrate = 1000000; // 1mbps
    } else if (compressionLevel === 'low') {
      targetBitrate = 4000000; // 4mbps
    }

    try {
      const video = document.createElement('video');
      video.src = videoUrl;
      video.muted = true;
      video.playsInline = true;
      video.currentTime = 0;

      // Ensure offscreen setup
      const canvas = document.createElement('canvas');
      canvas.width = finalWidth;
      canvas.height = finalHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Failed to start Canvas context');

      // Setup capture stream
      const stream = canvas.captureStream(30); // 30 FPS track
      
      let mimeType = 'video/webm;codecs=vp8,opus';
      if (typeof MediaRecorder.isTypeSupported === 'function') {
        const tests = [
          `video/webm;codecs=vp9`,
          `video/webm;codecs=vp8`,
          `video/webm`,
          `video/mp4;codecs=avc1`
        ];
        for (const test of tests) {
          if (MediaRecorder.isTypeSupported(test)) {
            mimeType = test;
            break;
          }
        }
      }

      const options = {
        mimeType,
        videoBitsPerSecond: targetBitrate
      };

      const recorder = new MediaRecorder(stream, options);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(chunks, { type: 'video/webm' });
        const compressedBlobUrl = URL.createObjectURL(finalBlob);
        setCompressedUrl(compressedBlobUrl);
        setCompressedSize(finalBlob.size);
        setIsProcessing(false);
        setProgress(100);

        if (onAddHistoryItem) {
          onAddHistoryItem(
            {
              action: isAr ? 'ضغـط واختزال حجم الفيديو' : 'Video Compression Run',
              fileName: `${videoFile.name.split('.')[0]}_compressed.webm`,
              originalSize: videoFile.size,
              processedSize: finalBlob.size,
              type: 'media'
            },
            finalBlob
          );
        }
      };

      video.onplay = () => {
        recorder.start();
        
        let startTimeRecord = Date.now();
        const drawFrame = () => {
          if (video.paused || video.ended) {
            if (recorder.state !== 'inactive') {
              recorder.stop();
            }
            return;
          }

          ctx.drawImage(video, 0, 0, finalWidth, finalHeight);
          
          // Progress metrics
          const currentProgress = Math.min(98, (video.currentTime / videoDuration) * 100);
          setProgress(Math.round(currentProgress));

          // Time remaining estimation
          const elapsed = (Date.now() - startTimeRecord) / 1000;
          const totalEstimated = (elapsed / video.currentTime) * videoDuration;
          const remaining = Math.max(0, totalEstimated - elapsed);
          setTimeLeft(Math.round(remaining));

          requestAnimationFrame(drawFrame);
        };

        requestAnimationFrame(drawFrame);
      };

      video.onended = () => {
        if (recorder.state !== 'inactive') {
          recorder.stop();
        }
      };

      // Play video at normal rate to let recorder capture sequentially smoothly
      video.play();

    } catch (e: any) {
      console.error(e);
      setIsProcessing(false);
      alert(isAr ? 'فشلت عملية الضغط. المتصفح لا يدعم المرمزات.' : 'Compression failed. Browser may lack decoding/recording codecs.');
    }
  };

  const handleDownload = () => {
    if (!compressedUrl) return;
    const a = document.createElement('a');
    a.href = compressedUrl;
    a.download = `${videoFile?.name.split('.')[0]}_compressed.${outputFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const spaceSaving = videoFile && compressedSize > 0 
    ? Math.max(0, Math.round(((videoFile.size - compressedSize) / videoFile.size) * 100))
    : 0;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-purple-100 dark:border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-2xl">
            <Minimize2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {isAr ? '🗜️ ضاغط مقاطع الفيديو ذكي الحجم' : '🗜️ Client-Side Video Compressor'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {isAr 
                ? 'قلّص أحجام مقاطع الفيديو مع الحفاظ على الدقة باستخدام معالج التشفير التلقائي بالمتصفح محلياً.'
                : 'Downscale, scale resolution, and compress video tracks directly inside your web container with high speed.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Upload and Preview Zone */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 space-y-6">
          {!videoFile ? (
            <div className="border-2 border-dashed border-purple-300 dark:border-slate-600 rounded-2xl p-12 text-center bg-purple-50/20 dark:bg-slate-900/10 hover:bg-purple-50/40 transition-all relative">
              <input
                type="file"
                accept="video/*"
                onChange={handleFileLoad}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Minimize2 className="w-12 h-12 mx-auto text-purple-400 mb-4" />
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                {isAr ? 'اسحب ملف الفيديو المراد اختزاله' : 'Drag video file to compress'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {isAr ? 'يدعم MP4, WebM, AVI, MOV، الخ.' : 'Supports normal files like MP4, WebM, AVI, or MOV.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-h-[320px] flex items-center justify-center border border-slate-150">
                <video
                  src={videoUrl}
                  controls
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">{isAr ? 'حجم الملف الأصلي' : 'Original Size'}</span>
                  <span className="text-sm font-extrabold text-slate-800 dark:text-white font-mono">{formatBytes(videoFile.size)}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">{isAr ? 'الدقة الأصلية' : 'Original Resolution'}</span>
                  <span className="text-sm font-extrabold text-slate-800 dark:text-white font-mono">{originalWidth}x{originalHeight}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-450 font-bold">
                  {videoFile.name} • {formatTime(videoDuration)}
                </span>
                <button
                  onClick={() => {
                    setVideoFile(null);
                    setVideoUrl('');
                    setCompressedUrl('');
                    setCompressedSize(0);
                  }}
                  className="text-xs text-red-500 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'مسح الملف الحالي' : 'Clear current file'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Compression Actions Config */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-105 pb-3">
            <Settings className="w-4 h-4 text-purple-600" />
            <h3 className="font-extrabold text-sm text-slate-850 dark:text-slate-100">{isAr ? 'خيارات تكثيف وحجم الضغط' : 'Target Fit & Ratio'}</h3>
          </div>

          <div className="space-y-4">
            
            {/* 4 compression levels */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-550 dark:text-slate-300 block">{isAr ? 'مستويات تخفيض الجودة' : 'Compression Ratio Preset'}</label>
              <div className="grid grid-cols-4 gap-1.5 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl">
                {['extreme', 'high', 'medium', 'low'].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setCompressionLevel(lvl as any)}
                    className={`py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer capitalize ${compressionLevel === lvl ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-850'}`}
                  >
                    {isAr ? (lvl === 'extreme' ? 'أقصى' : lvl === 'high' ? 'عالي' : lvl === 'medium' ? 'متوسط' : 'خفيف') : lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Resolutions presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-550 dark:text-slate-300 block">{isAr ? 'عتبة أقصى دقة مسموحة' : 'Scaled Resolution Cap'}</label>
              <div className="grid grid-cols-5 gap-1 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl">
                {['4K', '1080p', '720p', '480p', '365p'].map((res) => (
                  <button
                    key={res}
                    type="button"
                    onClick={() => setResolutionPreset(res as any)}
                    className={`py-1.5 rounded-lg text-[9px] font-black transition-all cursor-pointer ${resolutionPreset === res ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-850'}`}
                  >
                    {res === '365p' ? '360p' : res}
                  </button>
                ))}
              </div>
            </div>

            {/* Formats converter options */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-550 dark:text-slate-300 block">{isAr ? 'صيغة الإخراج المطلوبة' : 'Export Format'}</label>
              <div className="grid grid-cols-2 gap-2">
                {['webm', 'mp4'].map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setOutputFormat(fmt as any)}
                    className={`py-2 border rounded-xl text-xs font-black capitalize transition-all cursor-pointer ${outputFormat === fmt ? 'border-purple-600 bg-purple-50/20 text-purple-700' : 'border-slate-200 text-slate-500'}`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleCompress}
              disabled={isProcessing || !videoFile}
              className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs inline-flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isAr ? `جاري الاختزال (${progress}%) والوقت المتبقي: ${timeLeft}ث` : `Compressing (${progress}%) Remaining: ${timeLeft}s`}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{isAr ? 'البدء في ضغط جودة الفيديو' : 'Trigger Compression Pipeline'}</span>
                </>
              )}
            </button>
          </div>

          {/* Download and Save Savings ratio display */}
          {compressedUrl && (
            <div className="p-4 bg-emerald-50/20 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-900/30 rounded-2xl space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-emerald-700 dark:text-emerald-450">{isAr ? 'تم تقليص الملف بنجاح!' : 'Process successfully finished!'}</span>
                <span className="bg-emerald-200/50 text-emerald-800 text-[10px] px-2.5 py-0.5 rounded-full font-black">
                  -{spaceSaving}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center p-2.5 bg-white dark:bg-slate-900 rounded-xl">
                <div>
                  <span className="block text-[8px] text-slate-400 font-bold uppercase">{isAr ? 'الحجم النهائي' : 'Final Compressed Size'}</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-emerald-450 font-mono">{formatBytes(compressedSize)}</span>
                </div>
                <div>
                  <span className="block text-[8px] text-slate-400 font-bold uppercase">{isAr ? 'توفير المساحة' : 'Bytes Retained / Saved'}</span>
                  <span className="text-xs font-bold text-slate-705 dark:text-emerald-400 font-mono">
                    {formatBytes(Math.max(0, videoFile ? videoFile.size - compressedSize : 0))}
                  </span>
                </div>
              </div>

              <button
                onClick={handleDownload}
                className="w-full inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-2 px-3 rounded-xl cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isAr ? 'تنزيل الفيديو المضغوط' : 'Download Compressed Video'}</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

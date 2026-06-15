
import React, { useState, useRef, useEffect } from 'react';
import { 
  Video, 
  Settings, 
  Play, 
  Pause, 
  Sliders, 
  Download, 
  Sparkles, 
  Eye, 
  Trash2, 
  Tv, 
  Loader2, 
  CheckCircle2, 
  FileImage 
} from 'lucide-react';
import gifshot from 'gifshot';
import { useMediaProcessing } from '../../../hooks/useMediaProcessing';
import { HistoryItem } from '../../../types';

interface VideoToGIFProps {
  lang: 'ar' | 'en';
  onAddHistoryItem?: (item: HistoryItem) => void;
}

export const VideoToGIF: React.FC<VideoToGIFProps> = ({ lang, onAddHistoryItem }) => {
  const isAr = lang === 'ar';
  const { formatBytes, formatTime } = useMediaProcessing();

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [videoWidth, setVideoWidth] = useState<number>(0);
  const [videoHeight, setVideoHeight] = useState<number>(0);

  // Trim times
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  
  // Settings
  const [speed, setSpeed] = useState<number>(1); // 0.25x, 0.5x, 1x, 2x
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [sizePreset, setSizePreset] = useState<'original' | '480p' | '360p' | 'custom'>('480p');
  const [customWidth, setCustomWidth] = useState<number>(480);
  const [customHeight, setCustomHeight] = useState<number>(360);
  const [fps, setFps] = useState<number>(10);

  // Working States
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [gifResultUrl, setGifResultUrl] = useState<string>('');
  const [gifBlobSize, setGifBlobSize] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Clean up
  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (gifResultUrl) URL.revokeObjectURL(gifResultUrl);
    };
  }, [videoUrl, gifResultUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (videoUrl) URL.revokeObjectURL(videoUrl);
    if (gifResultUrl) {
      URL.revokeObjectURL(gifResultUrl);
      setGifResultUrl('');
      setGifBlobSize(0);
    }

    const url = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoUrl(url);

    // Temp element to capture basic dimensions & duration
    const tempVideo = document.createElement('video');
    tempVideo.src = url;
    tempVideo.onloadedmetadata = () => {
      setVideoDuration(tempVideo.duration);
      setVideoWidth(tempVideo.videoWidth);
      setVideoHeight(tempVideo.videoHeight);
      setStartTime(0);
      setEndTime(Math.min(tempVideo.duration, 10)); // Default trim to max 10s for performance
      if (tempVideo.videoWidth > 0) {
        setCustomWidth(Math.min(tempVideo.videoWidth, 480));
        setCustomHeight(Math.round((tempVideo.videoHeight * Math.min(tempVideo.videoWidth, 480)) / tempVideo.videoWidth));
      }
    };
  };

  const togglePlayback = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    // Keep playback within trim range
    if (videoRef.current.currentTime < startTime) {
      videoRef.current.currentTime = startTime;
    }
    if (videoRef.current.currentTime > endTime) {
      videoRef.current.currentTime = startTime;
      if (isPlaying) videoRef.current.play();
    }
  };

  const extractFramesAndCompile = async () => {
    if (!videoFile || !videoUrl) return;

    setIsProcessing(true);
    setProgress(0);
    setGifResultUrl('');
    setGifBlobSize(0);

    const targetWidth = sizePreset === 'original' ? videoWidth : 
                        sizePreset === '480p' ? 480 : 
                        sizePreset === '360p' ? 360 : customWidth;
    
    const targetHeight = sizePreset === 'original' ? videoHeight : 
                         sizePreset === '480p' ? Math.round((videoHeight * 480) / videoWidth) : 
                         sizePreset === '360p' ? Math.round((videoHeight * 360) / videoWidth) : customHeight;

    const spanDuration = endTime - startTime;
    
    // Total frames to generate
    const totalFrames = Math.max(5, Math.min(150, Math.floor(spanDuration * fps)));
    const frameIntervals: number[] = [];
    
    // Speed adjustments (e.g., speed = 2 means video duration is traversed faster, pacing frames)
    for (let i = 0; i < totalFrames; i++) {
      const offset = (i / totalFrames) * spanDuration * (1 / speed);
      const exactTime = startTime + offset;
      if (exactTime <= endTime) {
        frameIntervals.push(exactTime);
      }
    }

    try {
      const decodedFrames: string[] = [];
      const hiddenVideo = document.createElement('video');
      hiddenVideo.src = videoUrl;
      hiddenVideo.muted = true;
      hiddenVideo.playsInline = true;

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Cannot acquire canvas 2D context');

      hiddenVideo.onloadeddata = async () => {
        let frameIndex = 0;

        const processNextFrame = () => {
          if (frameIndex >= frameIntervals.length) {
            // Got all frames, compile to GIF
            setProgress(75);
            compileGIF(decodedFrames, targetWidth, targetHeight);
            return;
          }

          hiddenVideo.currentTime = frameIntervals[frameIndex];
        };

        hiddenVideo.onseeked = () => {
          ctx.drawImage(hiddenVideo, 0, 0, targetWidth, targetHeight);
          decodedFrames.push(canvas.toDataURL('image/jpeg', 0.8));
          frameIndex++;
          setProgress(Math.round((frameIndex / frameIntervals.length) * 70));
          processNextFrame();
        };

        processNextFrame();
      };
    } catch (e: any) {
      console.error(e);
      setIsProcessing(false);
      alert(isAr ? 'فشلت معالجة الفيديو.' : 'Video decoding failed.');
    }
  };

  const compileGIF = (frames: string[], width: number, height: number) => {
    // Quality maps to sampleInterval (lower is better quality, slower compile)
    const sampleVal = quality === 'high' ? 5 : quality === 'medium' ? 10 : 20;
    
    // Frame duration in seconds is: (1 / fps) * speed
    const durationMultiplier = 1 / speed;
    const itemFrameDuration = (1 / fps) * durationMultiplier;

    gifshot.createGIF(
      {
        images: frames,
        gifWidth: width,
        gifHeight: height,
        numWorkers: 2,
        sampleInterval: sampleVal,
        frameDuration: itemFrameDuration,
      },
      (obj) => {
        setIsProcessing(false);
        if (obj.error) {
          alert('Error generating GIF' + obj.errorMsg);
          return;
        }

        setProgress(100);
        setGifResultUrl(obj.image);

        // Calculate approximate size of generated base64 item
        const base64Str = obj.image.split(',')[1];
        const bytes = window.atob(base64Str).length;
        setGifBlobSize(bytes);

        // Record history item
        if (onAddHistoryItem && videoFile) {
          onAddHistoryItem({
            id: `v2g_${Date.now()}`,
            action: isAr ? 'تحويل فيديو إلى GIF' : 'Video to GIF Convert',
            fileName: `${videoFile.name.split('.')[0]}.gif`,
            timestamp: new Date().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
            originalSize: videoFile.size,
            processedSize: bytes,
            type: 'image',
            downloadUrl: obj.image
          });
        }
      }
    );
  };

  const handleDownload = () => {
    if (!gifResultUrl) return;
    const a = document.createElement('a');
    a.href = gifResultUrl;
    a.download = `${videoFile?.name.split('.')[0] || 'forge'}_converted.gif`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-purple-100 dark:border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-2xl">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {isAr ? '🎬 تحويل الفيديو إلى GIF متحرك' : '🎬 Convert Video to Animated GIF'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {isAr 
                ? 'استخرج إطارات الفيديو وحوّلها لصور GIF متحركة محلياً ١٠٠٪ دون مشاركة بياناتك على الإنترنت.'
                : 'Extract custom frames from video files and stitch them into high quality compact GIFs locally.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Upload & Workspace */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 space-y-6">
          {!videoFile ? (
            <div className="border-2 border-dashed border-purple-300 dark:border-slate-600 rounded-2xl p-12 text-center bg-purple-50/20 dark:bg-slate-900/10 hover:bg-purple-50/40 transition-all relative">
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Video className="w-12 h-12 mx-auto text-purple-400 mb-4" />
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                {isAr ? 'اسحب وأفلت ملف الفيديو هنا' : 'Drag and drop your video file'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {isAr ? 'يدعم MP4, WebM, MOV, OGG (الحد الأقصى الموصى به: 50MB)' : 'Supports MP4, WebM, MOV, OGG (Recommended max: 50MB)'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-h-[360px] flex items-center justify-center">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  onClick={togglePlayback}
                  onTimeUpdate={handleTimeUpdate}
                  className="w-full h-full object-contain cursor-pointer"
                />
                <button
                  onClick={togglePlayback}
                  className="absolute bottom-4 right-4 bg-purple-600 hover:bg-purple-500 text-white p-3 rounded-full shadow-lg transition-transform hover:scale-105 cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
              </div>

              {/* Sliders for start/end trimming */}
              <div className="space-y-3 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-805">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-500">{isAr ? 'تأطير قص الفيديو' : 'Trimming Video Ranges'}</span>
                  <span className="text-purple-600 font-mono">
                    {formatTime(startTime)} - {formatTime(endTime)} ({isAr ? 'المدة:' : 'Span:'} {(endTime - startTime).toFixed(1)}s)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">{isAr ? 'بداية المقطع' : 'Start Frame (s)'}</label>
                    <input
                      type="range"
                      min={0}
                      max={videoDuration}
                      step={0.1}
                      value={startTime}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setStartTime(val);
                        if (val >= endTime) setEndTime(Math.min(videoDuration, val + 1));
                        if (videoRef.current) videoRef.current.currentTime = val;
                      }}
                      className="w-full accent-purple-600 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">{isAr ? 'نهاية المقطع' : 'End Frame (s)'}</label>
                    <input
                      type="range"
                      min={startTime + 0.5}
                      max={videoDuration}
                      step={0.1}
                      value={endTime}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setEndTime(val);
                        if (videoRef.current) videoRef.current.currentTime = val;
                      }}
                      className="w-full accent-purple-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pb-2">
                <span className="text-xs text-slate-400 font-bold">
                  {videoFile.name} • {formatBytes(videoFile.size)}
                </span>
                <button
                  onClick={() => {
                    setVideoFile(null);
                    setVideoUrl('');
                    setGifResultUrl('');
                    setGifBlobSize(0);
                  }}
                  className="text-xs text-red-500 font-black flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'إزالة المقطع' : 'Remove clip'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Configuration panel */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
            <Settings className="w-4 h-4 text-purple-600" />
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
              {isAr ? 'إعدادات دقة الرسوم والجودة' : 'Resolution & Settings'}
            </h3>
          </div>

          <div className="space-y-4">
            {/* Speed Option */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-500 dark:text-slate-300 font-bold block">
                {isAr ? 'سرعة التقطيع والتشغيل' : 'Playback Speed Ratio'}
              </label>
              <div className="grid grid-cols-4 gap-1.5 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl">
                {[0.25, 0.5, 1, 2].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSpeed(s)}
                    className={`py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${speed === s ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-850'}`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Preset */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-500 dark:text-slate-300 font-bold block">
                {isAr ? 'مؤشر الجودة وكثافة الألوان' : 'Color Scale / Precision'}
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl">
                {['low', 'medium', 'high'].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuality(q as any)}
                    className={`py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer capitalize ${quality === q ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-850'}`}
                  >
                    {isAr ? (q === 'low' ? 'منخفضة' : q === 'medium' ? 'متوسطة' : 'عالية') : q}
                  </button>
                ))}
              </div>
            </div>

            {/* Resize Preset */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-500 dark:text-slate-300 font-bold block">
                {isAr ? 'أبعاد صورة GIF الناتجة' : 'Output Dimensions'}
              </label>
              <div className="grid grid-cols-4 gap-1.5 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl">
                {['original', '480p', '360p', 'custom'].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSizePreset(sz as any)}
                    className={`py-1 px-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer capitalize ${sizePreset === sz ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-850'}`}
                  >
                    {isAr ? (sz === 'original' ? 'أصلي' : sz === '480p' ? '480p' : sz === '360p' ? '360p' : 'مخصص') : sz}
                  </button>
                ))}
              </div>
            </div>

            {sizePreset === 'custom' && (
              <div className="grid grid-cols-2 gap-3 animate-slideIn">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">{isAr ? 'العرض بالبكسل' : 'Width (px)'}</label>
                  <input
                    type="number"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(parseInt(e.target.value) || 200)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 py-1.5 px-3 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">{isAr ? 'الارتفاع بالبكسل' : 'Height (px)'}</label>
                  <input
                    type="number"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(parseInt(e.target.value) || 200)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 py-1.5 px-3 rounded-lg text-xs"
                  />
                </div>
              </div>
            )}

            {/* FPS config */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-500 dark:text-slate-300 font-bold flex justify-between">
                <span>{isAr ? 'معدل التقطيع (الإطارات بالثانية)' : 'Capture Rate (Frames/s)'}</span>
                <span className="text-purple-600 font-mono">{fps} FPS</span>
              </label>
              <input
                type="range"
                min={5}
                max={20}
                step={1}
                value={fps}
                onChange={(e) => setFps(parseInt(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <span className="text-[9px] text-slate-400 block mt-0.5">
                {isAr ? 'الإطارات الكثيفة تمنح سلاسة أعلى ولكن بحجم ملف أضخم.' : 'Higher frame-rates mean smoother motion but exponential size increments.'}
              </span>
            </div>

            <button
              onClick={extractFramesAndCompile}
              disabled={isProcessing || !videoFile}
              className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs inline-flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isAr ? `جاري معالجة الإطارات (${progress}%)` : `Extracting frames (${progress}%)`}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{isAr ? 'صنع رسم ملف GIF متحرك' : 'Build GIF Stream'}</span>
                </>
              )}
            </button>
          </div>

          {/* Generated Result Preview */}
          {gifResultUrl && (
            <div className="p-4 bg-purple-50/30 dark:bg-slate-900/40 rounded-2xl border border-purple-100 dark:border-slate-850 space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-750 dark:text-slate-200">
                <Eye className="w-4 h-4 text-purple-600" />
                <span>{isAr ? 'المعاينة والتحميل الفوري' : 'Live GIF Rendering & Metadata'}</span>
              </div>

              <div className="flex flex-col items-center gap-3">
                <img
                  src={gifResultUrl}
                  alt="Transformed animation stream"
                  className="max-h-[220px] rounded-lg border border-slate-200 dark:border-slate-800 object-contain shadow-sm bg-white"
                />
                
                <div className="text-center">
                  <span className="block font-mono font-black text-xs text-purple-700 dark:text-purple-300">
                    {formatBytes(gifBlobSize)}
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-1">
                    {isAr ? 'جاهز للتصدير والمشاركة الفورية.' : 'Fully generated inside your sandboxed web client.'}
                  </span>
                </div>

                <button
                  onClick={handleDownload}
                  className="w-full inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-2 px-4 rounded-xl shadow cursor-pointer transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>{isAr ? 'تحميل ملف GIF المنجز' : 'Download GIF Document'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

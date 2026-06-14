'use client';

import React, { useState, useEffect } from 'react';
import { 
  Images, 
  Settings, 
  Trash2, 
  Download, 
  Loader2, 
  Sparkles, 
  Eye, 
  CheckCircle2, 
  FileLock, 
  FileArchive,
  Grid
} from 'lucide-react';
import JSZip from 'jszip';
import { useMediaProcessing } from '../../../hooks/useMediaProcessing';
import { HistoryItem } from '../../../types';

interface VideoToImagesProps {
  lang: 'ar' | 'en';
  onAddHistoryItem?: (item: HistoryItem) => void;
}

interface ExtractedFrame {
  id: string;
  dataUrl: string;
  timestamp: number;
}

export const VideoToImages: React.FC<VideoToImagesProps> = ({ lang, onAddHistoryItem }) => {
  const isAr = lang === 'ar';
  const { formatBytes, formatTime } = useMediaProcessing();

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [videoWidth, setVideoWidth] = useState<number>(0);
  const [videoHeight, setVideoHeight] = useState<number>(0);

  // Settings
  const [intervalType, setIntervalType] = useState<'seconds' | 'frame_count'>('seconds');
  const [intervalSeconds, setIntervalSeconds] = useState<number>(2); // Each 2s
  const [targetCount, setTargetCount] = useState<number>(10); // Exactly 10 frames
  const [maxOutputWidth, setMaxOutputWidth] = useState<number>(640);

  // Extract states
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [extractedFrames, setExtractedFrames] = useState<ExtractedFrame[]>([]);
  
  // Zip status
  const [isZipping, setIsZipping] = useState<boolean>(false);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  const handleFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoFile(file);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setExtractedFrames([]);

    const url = URL.createObjectURL(file);
    setVideoUrl(url);

    const tempVideo = document.createElement('video');
    tempVideo.src = url;
    tempVideo.onloadedmetadata = () => {
      setVideoDuration(tempVideo.duration || 10);
      setVideoWidth(tempVideo.videoWidth || 640);
      setVideoHeight(tempVideo.videoHeight || 360);
    };
  };

  const handleExtract = async () => {
    if (!videoFile || !videoUrl) return;

    setIsExtracting(true);
    setProgress(0);
    setExtractedFrames([]);

    // Calculate frame offsets in seconds
    const timestamps: number[] = [];

    if (intervalType === 'seconds') {
      let current = 0.5; // skip absolute initial black frame
      while (current < videoDuration) {
        timestamps.push(current);
        current += intervalSeconds;
      }
    } else {
      // Exactly N frames symmetrically across length
      const step = videoDuration / (targetCount + 1);
      for (let i = 1; i <= targetCount; i++) {
        timestamps.push(i * step);
      }
    }

    if (timestamps.length === 0) {
      setIsExtracting(false);
      return;
    }

    try {
      const video = document.createElement('video');
      video.src = videoUrl;
      video.muted = true;
      video.playsInline = true;

      const canvas = document.createElement('canvas');
      const scale = Math.min(maxOutputWidth / videoWidth, 1);
      const targetW = Math.round(videoWidth * scale);
      const targetH = Math.round(videoHeight * scale);
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Unresolved context');

      const bufferFrames: ExtractedFrame[] = [];
      let index = 0;

      video.onloadeddata = () => {
        const processNext = () => {
          if (index >= timestamps.length) {
            setExtractedFrames(bufferFrames);
            setIsExtracting(false);
            setProgress(100);
            return;
          }
          video.currentTime = timestamps[index];
        };

        video.onseeked = () => {
          ctx.drawImage(video, 0, 0, targetW, targetH);
          bufferFrames.push({
            id: `frame_${index}_${Date.now()}`,
            dataUrl: canvas.toDataURL('image/jpeg', 0.85),
            timestamp: timestamps[index]
          });

          index++;
          setProgress(Math.round((index / timestamps.length) * 100));
          processNext();
        };

        processNext();
      };
    } catch (e) {
      console.error(e);
      setIsExtracting(false);
      alert(isAr ? 'فشل استخراج الإطارات.' : 'Frame extraction failed.');
    }
  };

  const deleteSingleFrame = (id: string) => {
    setExtractedFrames((prev) => prev.filter((f) => f.id !== id));
  };

  const downloadSingleFrame = (frame: ExtractedFrame, index: number) => {
    const a = document.createElement('a');
    a.href = frame.dataUrl;
    a.download = `frame_${index + 1}_at_${frame.timestamp.toFixed(1)}s.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadAllAsZip = async () => {
    if (extractedFrames.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      extractedFrames.forEach((frame, index) => {
        const base64Data = frame.dataUrl.split(',')[1];
        zip.file(`frame_${index + 1}_at_${frame.timestamp.toFixed(1)}s.jpg`, base64Data, { base64: true });
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${videoFile?.name.split('.')[0] || 'forged'}_extracted_frames.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

      // Add to operations history logs
      if (onAddHistoryItem && videoFile) {
        onAddHistoryItem({
          id: `zip_${Date.now()}`,
          action: isAr ? 'استخراج حزمة إطارات لصور ZIP' : 'Video Frame Multi-export ZIP',
          fileName: `${videoFile.name.split('.')[0]}_frames.zip`,
          timestamp: new Date().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
          originalSize: videoFile.size,
          processedSize: blob.size,
          type: 'image',
          downloadUrl: blobUrl
        });
      }
    } catch (e) {
      console.error(e);
      alert(isAr ? 'يرجى مراجعة الصلاحيات لتوليد الـ ZIP.' : 'Zip mapping generated error.');
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-purple-100 dark:border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-2xl">
            <Images className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {isAr ? '🖼️ تقسيم الفيديو إلى صور متسلسلة' : '🖼️ Video to Sequential Images'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {isAr 
                ? 'استخرج إطارات متتابعة بدقة عالية وحملها كأرشيف ZIP مضغوط أو لقطات مستقلة.'
                : 'Deconstruct moving videos into static high-resolution frame sequences by custom criteria, ready to batch export as ZIP.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Loader Board */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 space-y-6">
          {!videoFile ? (
            <div className="border-2 border-dashed border-purple-300 dark:border-slate-600 rounded-2xl p-12 text-center bg-purple-50/20 dark:bg-slate-900/10 hover:bg-purple-50/40 transition-all relative">
              <input
                type="file"
                accept="video/*"
                onChange={handleFileLoad}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Grid className="w-12 h-12 mx-auto text-purple-400 mb-4" />
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                {isAr ? 'اختر ملف الفيديو لاستقطاع الصور' : 'Select video file to frame-rip'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {isAr ? 'يدعم MP4, WebM, AVI, MOV...' : 'Highly responsive on MP4 or WebM streams.'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs text-slate-500 font-bold">
                  {videoFile.name} ({formatTime(videoDuration)})
                </span>
                <button
                  onClick={() => {
                    setVideoFile(null);
                    setExtractedFrames([]);
                  }}
                  className="text-xs text-red-500 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'إفراغ الملف' : 'Remove video'}</span>
                </button>
              </div>

              {/* Extraction Progress indicator */}
              {isExtracting && (
                <div className="p-4 bg-purple-50/40 dark:bg-slate-900/40 rounded-2xl animate-pulse space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-250">
                    <span>{isAr ? 'جاري فهرسة والتقاط إطارات الصور...' : 'Traversing tracks & rendering frames...'}</span>
                    <span className="font-mono text-purple-600">{progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-600" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}

              {/* Grid of parsed frames */}
              {extractedFrames.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/30 p-4 rounded-2xl border border-slate-150">
                    <span className="text-xs font-black text-slate-705 dark:text-slate-300">
                      {isAr ? 'الإطارات المستخرجة بنجاح:' : 'Extracted Frames Grid List:'} {extractedFrames.length} {isAr ? 'صور' : 'elements'}
                    </span>

                    <button
                      onClick={downloadAllAsZip}
                      disabled={isZipping}
                      className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] py-1.5 px-3 rounded-lg cursor-pointer"
                    >
                      {isZipping ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileArchive className="w-3.5 h-3.5" />}
                      <span>{isAr ? 'تنزيل الكل بمجلد ZIP مضغوط' : 'Export and Save ZIP'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {extractedFrames.map((frame, index) => (
                      <div key={frame.id} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black aspect-video shadow-sm">
                        <img src={frame.dataUrl} alt="Snippet capture" className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 right-1 bg-slate-905/75 text-white font-mono text-[8px] px-1 rounded">
                          {frame.timestamp.toFixed(1)}s
                        </span>

                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            onClick={() => downloadSingleFrame(frame, index)}
                            className="bg-purple-600 text-white p-2 rounded-full hover:scale-110 transition-transform cursor-pointer"
                            title={isAr ? 'تنزيل الصورة' : 'Download Image'}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteSingleFrame(frame.id)}
                            className="bg-red-650 text-white p-2 rounded-full hover:scale-110 transition-transform cursor-pointer"
                            title={isAr ? 'حذف من القائمة' : 'Exclude Image'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Configurations column */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Settings className="w-4 h-4 text-purple-600" />
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{isAr ? 'معايير تقسيم الصور' : 'Interval Calibration'}</h3>
          </div>

          <div className="space-y-4">
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-550 dark:text-slate-300 block">{isAr ? 'طريقة الاستخراج الفردي' : 'Extraction Method'}</label>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setIntervalType('seconds')}
                  className={`py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${intervalType === 'seconds' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-850'}`}
                >
                  {isAr ? 'كل خطوة ثواني' : 'Every N seconds'}
                </button>
                <button
                  type="button"
                  onClick={() => setIntervalType('frame_count')}
                  className={`py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${intervalType === 'frame_count' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-850'}`}
                >
                  {isAr ? 'عدد لقطات ثابت' : 'Fixed frames loop'}
                </button>
              </div>
            </div>

            {intervalType === 'seconds' ? (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-550 dark:text-slate-300 flex justify-between">
                  <span>{isAr ? 'كل كم من ثانية يتم الالتقاط؟' : 'Capture Step Interval'}</span>
                  <span className="text-purple-600 font-mono">كل {intervalSeconds} ثانية</span>
                </label>
                <input
                  type="range"
                  min={0.5}
                  max={10}
                  step={0.5}
                  value={intervalSeconds}
                  onChange={(e) => setIntervalSeconds(parseFloat(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-550 dark:text-slate-300 flex justify-between">
                  <span>{isAr ? 'مستهدف عدد لقطات الفيلم الكلية' : 'Required Exact Count'}</span>
                  <span className="text-purple-600 font-mono">{targetCount} لقطة</span>
                </label>
                <input
                  type="range"
                  min={2}
                  max={50}
                  step={1}
                  value={targetCount}
                  onChange={(e) => setTargetCount(parseInt(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>
            )}

            {/* Scale sizing helper */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-550 dark:text-slate-300 block">{isAr ? 'الحد الأقصى لعرض اللوحة' : 'Render Width Ceiling'}</label>
              <select
                value={maxOutputWidth}
                onChange={(e) => setMaxOutputWidth(parseInt(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 p-2 text-xs rounded-xl"
              >
                <option value={1920}>1920px (Full HD)</option>
                <option value={1280}>1280px (HD)</option>
                <option value={640}>640px (Standard optimized)</option>
                <option value={480}>480px (Quick drafts)</option>
              </select>
            </div>

            <button
              onClick={handleExtract}
              disabled={isExtracting || !videoFile}
              className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs inline-flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isAr ? `جاري فك الترميز التقاطي (${progress}%)` : `Extracting frames (${progress}%)`}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{isAr ? 'البدء في تجزئة الإطارات الكثيفة' : 'Rip Sequences Now'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

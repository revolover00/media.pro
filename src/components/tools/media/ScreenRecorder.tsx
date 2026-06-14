'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Tv, 
  Settings, 
  Circle, 
  Play, 
  Pause, 
  Square, 
  Mic, 
  MicOff, 
  Download, 
  Eye, 
  Loader2, 
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { useMediaProcessing } from '../../../hooks/useMediaProcessing';
import { HistoryItem } from '../../../types';

interface ScreenRecorderProps {
  lang: 'ar' | 'en';
  onAddHistoryItem?: (item: HistoryItem) => void;
}

export const ScreenRecorder: React.FC<ScreenRecorderProps> = ({ lang, onAddHistoryItem }) => {
  const isAr = lang === 'ar';
  const { formatBytes, formatTime } = useMediaProcessing();

  // Settings
  const [recordAudio, setRecordAudio] = useState<boolean>(true);
  const [exportFormat, setExportFormat] = useState<'webm' | 'mp4'>('webm');

  // Work states
  const [recStatus, setRecStatus] = useState<'idle' | 'recording' | 'paused' | 'stopped'>('idle');
  const [recordedSeconds, setRecordedSeconds] = useState<number>(0);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string>('');
  const [recordedSize, setRecordedSize] = useState<number>(0);

  // Streams holding
  const screenStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      stopTracks();
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordedBlobUrl) URL.revokeObjectURL(recordedBlobUrl);
    };
  }, [recordedBlobUrl]);

  const stopTracks = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
  };

  const startScreenRecording = async () => {
    chunksRef.current = [];
    setRecordedSeconds(0);
    setRecordedBlobUrl('');
    setRecordedSize(0);

    try {
      // Capture Screen Media API (Whole screen, Window, Tab selection browser dialog)
      const options: DisplayMediaStreamOptions = {
        video: true,
        audio: recordAudio
      };

      const screenStream = await navigator.mediaDevices.getDisplayMedia(options);
      screenStreamRef.current = screenStream;

      let combinedStream = screenStream;

      // If dedicated audio recording is requested, attempt to stack microphone audio too
      if (recordAudio) {
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          audioStreamRef.current = micStream;

          // Merge stream tracks
          const tracks = [...screenStream.getVideoTracks(), ...micStream.getAudioTracks()];
          combinedStream = new MediaStream(tracks);
        } catch (micErr) {
          console.warn('Microphone permission bypassed or unavailable:', micErr);
          // Fallback to screen audio only if screen capture supports it
        }
      }

      // Check support codecs
      let mimeType = 'video/webm;codecs=vp8,opus';
      if (typeof MediaRecorder.isTypeSupported === 'function') {
        const tests = [
          'video/webm;codecs=vp9,opus',
          'video/webm;codecs=vp8,opus',
          'video/webm',
          'video/mp4;codecs=avc1'
        ];
        for (const test of tests) {
          if (MediaRecorder.isTypeSupported(test)) {
            mimeType = test;
            break;
          }
        }
      }

      const recorder = new MediaRecorder(combinedStream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        stopTracks();
        if (timerRef.current) clearInterval(timerRef.current);

        const mimeExt = mimeType.includes('mp4') ? 'video/mp4' : 'video/webm';
        const finalBlob = new Blob(chunksRef.current, { type: mimeExt });
        const finalUrl = URL.createObjectURL(finalBlob);

        setRecordedBlobUrl(finalUrl);
        setRecordedSize(finalBlob.size);
        setRecStatus('stopped');

        // Add history log entry
        if (onAddHistoryItem) {
          onAddHistoryItem({
            id: `rec_${Date.now()}`,
            action: isAr ? 'تسجيل لقطات الشاشة الحية' : 'Screen Cast Record Session',
            fileName: `screencast_${Date.now()}.${exportFormat}`,
            timestamp: new Date().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
            originalSize: 0,
            processedSize: finalBlob.size,
            type: 'media',
            downloadUrl: finalUrl
          });
        }
      };

      // Handle screen-sharing cancellation directly via browsers UI
      screenStream.getVideoTracks()[0].onended = () => {
        if (recorder && recorder.state !== 'inactive') {
          recorder.stop();
        }
      };

      recorder.start(1000); // chunk every second
      setRecStatus('recording');

      // Live Timer
      timerRef.current = setInterval(() => {
        setRecordedSeconds((prev) => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error(err);
      if (err.name !== 'NotAllowedError') {
        alert(isAr ? 'عذراً، هذا المتصفح لا يدعم تسجيل الشاشة أو تم رفض الصلاحية.' : 'Your browser doesn’t support screen capture or access permission was denied.');
      }
      stopTracks();
      setRecStatus('idle');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setRecStatus('paused');
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setRecStatus('recording');
      timerRef.current = setInterval(() => {
        setRecordedSeconds((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const triggerDownload = () => {
    if (!recordedBlobUrl) return;
    const a = document.createElement('a');
    a.href = recordedBlobUrl;
    a.download = `screencast_${Date.now()}.${exportFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const clearSession = () => {
    if (recordedBlobUrl) URL.revokeObjectURL(recordedBlobUrl);
    setRecordedBlobUrl('');
    setRecordedSize(0);
    setRecordedSeconds(0);
    setRecStatus('idle');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-purple-100 dark:border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-2xl">
            <Tv className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {isAr ? '🎥 مسجل الشاشة والاجتماعات المحلي' : '🎥 Privacy-First Screen Recorder'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {isAr 
                ? 'سجل سطح المكتب بالكامل أو النوافذ المفتوحة مع الصوت مع خيارات تحكم وتنزيل فورية محلياً.'
                : 'Capture your browser panels, absolute displays, or single windows fully client-side on sandbox frames.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Workspace dashboard */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 space-y-6">
          <div className="flex flex-col items-center justify-center min-h-[220px] bg-slate-900/10 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            
            {/* Blinking indicator */}
            {recStatus === 'recording' && (
              <div className="flex items-center gap-2 animate-pulse bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-black">
                <Circle className="w-3 h-3 fill-red-600 animate-ping" />
                <span>REC • {formatTime(recordedSeconds)}</span>
              </div>
            )}

            {recStatus === 'paused' && (
              <div className="flex items-center gap-2 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-black">
                <Pause className="w-3 h-3 fill-amber-600" />
                <span>{isAr ? 'موقوف مؤقتاً' : 'PAUSED'} • {formatTime(recordedSeconds)}</span>
              </div>
            )}

            {recStatus === 'recording' || recStatus === 'paused' ? (
              <div className="text-center space-y-4">
                <p className="text-xs text-slate-400">
                  {isAr ? 'جاري تسجيل اللقطات حياً، يرجى التفاعل أو شرح واجهتك...' : 'Actively capturing context stream...'}
                </p>

                <div className="flex items-center gap-3 justify-center">
                  {recStatus === 'recording' ? (
                    <button
                      onClick={pauseRecording}
                      className="inline-flex items-center justify-center gap-1.5 py-2.5 px-5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs cursor-pointer shadow"
                    >
                      <Pause className="w-4 h-4" />
                      <span>{isAr ? 'إيقاف مؤقت' : 'Pause'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={resumeRecording}
                      className="inline-flex items-center justify-center gap-1.5 py-2.5 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer shadow"
                    >
                      <Play className="w-4 h-4" />
                      <span>{isAr ? 'استئناف البث' : 'Resume'}</span>
                    </button>
                  )}

                  <button
                    onClick={stopRecording}
                    className="inline-flex items-center justify-center gap-1.5 py-2.5 px-5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer shadow"
                  >
                    <Square className="w-4 h-4 fill-white" />
                    <span>{isAr ? 'إنهاء وحفظ' : 'Stop & Build'}</span>
                  </button>
                </div>
              </div>
            ) : recStatus === 'stopped' && recordedBlobUrl ? (
              <div className="w-full space-y-4">
                <span className="block text-xs font-black text-slate-500">{isAr ? 'معاينة البث المسجل:' : 'Recorded Stream Playback:'}</span>
                <video src={recordedBlobUrl} controls className="w-full max-h-[300px] bg-black rounded-xl" />
                
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-150">
                  <span className="text-xs text-slate-450 font-bold">
                    {isAr ? 'المدة الكلية للفيديو:' : 'Total recorded time:'} {formatTime(recordedSeconds)} • {formatBytes(recordedSize)}
                  </span>

                  <button
                    onClick={clearSession}
                    className="text-xs text-red-500 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isAr ? 'التحضير لتسجيل جديد' : 'Record another'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-full w-14 h-14 flex items-center justify-center mx-auto text-purple-600">
                  <Tv className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-205">{isAr ? 'لم يتم بدء البث بعد' : 'Ready to record screen'}</h4>
                  <p className="text-[10px] text-slate-400 mt-1">{isAr ? 'قم بإنشاء بث جديد فورياً عن طريق الزر الجانبي.' : 'Prompt permissions to record safe offline sessions.'}</p>
                </div>

                <button
                  onClick={startScreenRecording}
                  className="inline-flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs py-2.5 px-6 rounded-xl shadow-lg cursor-pointer transition-transform hover:scale-102"
                >
                  <Circle className="w-3.5 h-3.5 fill-white" />
                  <span>{isAr ? 'بدء تسجيل جديد' : 'Start Capture'}</span>
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Custom triggers list configurations */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Settings className="w-4 h-4 text-purple-600" />
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{isAr ? 'إعدادات البث والتسجيل' : 'Record Calibration'}</h3>
          </div>

          <div className="space-y-4">
            {/* Audio checkbox */}
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-120">
              <div className="flex items-center gap-2">
                {recordAudio ? <Mic className="w-4 h-4 text-purple-600" /> : <MicOff className="w-4 h-4 text-slate-400" />}
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{isAr ? 'تسجيل الصوت المرفق' : 'Capture Audio Track'}</span>
              </div>
              <input
                type="checkbox"
                checked={recordAudio}
                onChange={(e) => setRecordAudio(e.target.checked)}
                className="accent-purple-600 h-4 w-4 cursor-pointer"
              />
            </div>

            {/* Export Format */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-550 dark:text-slate-300 block">{isAr ? 'امتداد حفظ مقطع البث' : 'Target Save Extension'}</label>
              <div className="grid grid-cols-2 gap-2">
                {['webm', 'mp4'].map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setExportFormat(fmt as any)}
                    className={`py-2 border rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${exportFormat === fmt ? 'border-purple-600 bg-purple-50/20 text-purple-700' : 'border-slate-200 text-slate-500'}`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
              <span className="text-[9px] text-slate-400 block mt-1">
                {isAr ? 'يدعم التصدير والصياغة الفورية.' : 'Fast encoded saves onto local directories.'}
              </span>
            </div>

            {/* Download section if stopped */}
            {recStatus === 'stopped' && recordedBlobUrl && (
              <div className="p-4 bg-emerald-50/20 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-900/30 rounded-2xl text-center space-y-3 animate-fadeIn">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-350 font-black flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isAr ? 'البث محفوظ في ذاكرة التخزين' : 'Buffer cached successfully'}</span>
                </span>

                <button
                  onClick={triggerDownload}
                  className="w-full inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-2.5 px-4 rounded-xl cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{isAr ? 'تحميل وتسجيل البث' : 'Download Captured stream'}</span>
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

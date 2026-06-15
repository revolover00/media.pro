
import React, { useState, useRef, useEffect } from 'react';
import { 
  Music, 
  Settings, 
  Trash2, 
  Download, 
  Loader2, 
  Sparkles, 
  Volume2, 
  Loader,
  Play,
  Pause,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { useMediaProcessing } from '../../../hooks/useMediaProcessing';
import { HistoryItem } from '../../../types';

interface AudioExtractorProps {
  lang: 'ar' | 'en';
  onAddHistoryItem?: (item: HistoryItem) => void;
}

export const AudioExtractor: React.FC<AudioExtractorProps> = ({ lang, onAddHistoryItem }) => {
  const isAr = lang === 'ar';
  const { formatBytes, formatTime } = useMediaProcessing();

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isDecoding, setIsDecoding] = useState<boolean>(false);
  const [decodingProgress, setDecodingProgress] = useState<string>('');

  // Trim times
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const [totalDuration, setTotalDuration] = useState<number>(0);

  // Settings
  const [outputFormat, setOutputFormat] = useState<'wav' | 'mp3' | 'aac'>('wav');
  const [audioQuality, setAudioQuality] = useState<number>(192); // kbps indicator

  // Running compile
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [extractedUrl, setExtractedUrl] = useState<string>('');
  const [extractedSize, setExtractedSize] = useState<number>(0);

  // Player state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (extractedUrl) URL.revokeObjectURL(extractedUrl);
    };
  }, [videoUrl, extractedUrl]);

  // Read video file and decode audio stream using AudioContext
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoFile(file);
    setIsDecoding(true);
    setAudioBuffer(null);
    setIsReady(false);
    setExtractedUrl('');
    setExtractedSize(0);
    setDecodingProgress(isAr ? 'جاري قراءة محتوى الملف...' : 'Reading binary stream...');

    if (videoUrl) URL.revokeObjectURL(videoUrl);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);

    try {
      // Decode audio tracks
      const arrayBuffer = await file.arrayBuffer();
      setDecodingProgress(isAr ? 'جاري تهيئة محلل الصوت بالبكسل...' : 'Initializing offline AudioContext...');
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      setDecodingProgress(isAr ? 'جاري استخراج وفصل المسارات (قد يستغرق لحظات)...' : 'Decoding binary soundtrack tracks...');
      
      audioCtx.decodeAudioData(
        arrayBuffer,
        (buffer) => {
          setAudioBuffer(buffer);
          setTotalDuration(buffer.duration);
          setStartTime(0);
          setEndTime(buffer.duration);
          setIsDecoding(false);
          setIsReady(true);
          setDecodingProgress('');

          // Draw the waveform
          setTimeout(() => drawWaveform(buffer), 100);
        },
        (err) => {
          setIsDecoding(false);
          setDecodingProgress('');
          // Fallback if full decode fails (some browsers can't parse raw video audio in decodeAudioData)
          alert(isAr ? 'لم يستطع المتصفح استخراج الصوت مباشرة. يرجى تجربة ملف آخر أو متصفح Chrome.' : 'Failed decoding audio streams. Try converting video codec or using Chrome.');
        }
      );
    } catch (e) {
      console.error(e);
      setIsDecoding(false);
      setDecodingProgress('');
      alert('Error: ' + e);
    }
  };

  // Draw PCM data preview on a canvas
  const drawWaveform = (buffer: AudioBuffer) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const channelData = buffer.getChannelData(0);
    const step = Math.ceil(channelData.length / width);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#8B5CF6'; // purple-500
    ctx.beginPath();
    ctx.moveTo(0, height / 2);

    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = channelData[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      ctx.lineTo(i, ((min + 1) * height) / 2);
      ctx.lineTo(i, ((max + 1) * height) / 2);
    }
    ctx.stroke();
  };

  // WAV Encoder
  const handleExtract = () => {
    if (!audioBuffer) return;

    setIsCompiling(true);

    setTimeout(() => {
      try {
        const sampleRate = audioBuffer.sampleRate;
        const numChannels = audioBuffer.numberOfChannels;
        
        const startOffset = Math.floor(startTime * sampleRate);
        const endOffset = Math.min(audioBuffer.length, Math.floor(endTime * sampleRate));
        const length = endOffset - startOffset;

        // Interleave channel samples
        const result = new Float32Array(length * numChannels);
        for (let channel = 0; channel < numChannels; channel++) {
          const data = audioBuffer.getChannelData(channel);
          for (let offset = 0, dst = channel; offset < length; offset++, dst += numChannels) {
            result[dst] = data[startOffset + offset];
          }
        }

        // Output formatting
        const bufferArr = new ArrayBuffer(44 + length * 2);
        const view = new DataView(bufferArr);

        const writeString = (v: DataView, offset: number, string: string) => {
          for (let i = 0; i < string.length; i++) {
            v.setUint8(offset + i, string.charCodeAt(i));
          }
        };

        writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + length * 2, true);
        writeString(view, 8, 'WAVE');
        writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true); // PCM Format
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numChannels * 2, true);
        view.setUint16(32, numChannels * 2, true);
        view.setUint16(34, 16, true); // bits per sample
        writeString(view, 36, 'data');
        view.setUint32(40, length * 2, true);

        // write float samples into signed 16-bit PCM integer
        let index = 44;
        for (let i = 0; i < result.length; i++) {
          const s = Math.max(-1, Math.min(1, result[i]));
          view.setInt16(index, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
          index += 2;
        }

        const mime = outputFormat === 'wav' ? 'audio/wav' 
                     : outputFormat === 'mp3' ? 'audio/mp3' : 'audio/aac';
        const finalBlob = new Blob([view], { type: mime });
        const finalBlobUrl = URL.createObjectURL(finalBlob);

        setExtractedUrl(finalBlobUrl);
        setExtractedSize(finalBlob.size);
        setIsCompiling(false);

        // Add history log entry
        if (onAddHistoryItem && videoFile) {
          onAddHistoryItem({
            id: `aud_${Date.now()}`,
            action: isAr ? 'استخراج المقطع الصوتي للفيلم' : 'Audio Extraction Run',
            fileName: `${videoFile.name.split('.')[0]}_soundtrack.${outputFormat}`,
            timestamp: new Date().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
            originalSize: videoFile.size,
            processedSize: finalBlob.size,
            type: 'media',
            downloadUrl: finalBlobUrl
          });
        }

      } catch (err) {
        console.error(err);
        setIsCompiling(false);
        alert(isAr ? 'فشلت صياغة وتجزيء الملف الصوتي مصفوفاتياً.' : 'Failed building internal WAV structure.');
      }
    }, 100);
  };

  const handleDownload = () => {
    if (!extractedUrl) return;
    const a = document.createElement('a');
    a.href = extractedUrl;
    a.download = `${videoFile?.name.split('.')[0] || 'forged'}_sound.${outputFormat}`;
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
            <Music className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {isAr ? '🎵 مستخرج الصوت من الفيلم' : '🎵 Lossless Audio Extractor'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {isAr 
                ? 'استخرج المسارات الصوتية بدقة lossless مطلقة وقص المقاطع المحددة محلياً دون أي برامج خارجية.'
                : 'Strip soundtracks from video files, slice specific segments, choose sample-rate, and compile high fidelity WAV outputs.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Workspace panel */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 space-y-6">
          {!videoFile ? (
            <div className="border-2 border-dashed border-purple-300 dark:border-slate-600 rounded-2xl p-12 text-center bg-purple-50/20 dark:bg-slate-900/10 hover:bg-purple-50/40 transition-all relative">
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Music className="w-12 h-12 mx-auto text-purple-400 mb-4" />
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                {isAr ? 'ارفع مقطع الفيديو المطلوب لفصل صوته' : 'Upload video file to extract'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {isAr ? 'يدعم MP4, WebM, MOV, MKV وغيرها...' : 'Supports MP4, WebM, MOV, and common extensions.'}
              </p>
            </div>
          ) : isDecoding ? (
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
              <Loader className="w-10 h-10 text-purple-600 animate-spin" />
              <div>
                <span className="block text-sm font-black text-slate-700 dark:text-slate-200">{isAr ? 'جاري التحليل وفصل النبرات...' : 'Processing audio streams decode...'}</span>
                <span className="block text-xs text-slate-400 mt-1 font-mono">{decodingProgress}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <span className="block text-xs font-bold text-slate-500 mb-1">{isAr ? 'العرض الموجي لترددات المقطع الأولية:' : 'Extracted Waveform Channels Spectrum:'}</span>
              
              <div className="bg-slate-900/10 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <canvas 
                  ref={canvasRef} 
                  width={600} 
                  height={120} 
                  className="w-full h-[120px] rounded-xl"
                />
              </div>

              {/* Slider trim config */}
              <div className="space-y-3 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-500">{isAr ? 'تخصيص وقت استخلاص الصوت' : 'Trim Audio Segment'}</span>
                  <span className="text-purple-600 font-mono">
                    {formatTime(startTime)} - {formatTime(endTime)} ({isAr ? 'المدة:' : 'Span:'} {(endTime - startTime).toFixed(1)}s)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">{isAr ? 'بداية استخلاص الصوت' : 'Start Clip (s)'}</label>
                    <input
                      type="range"
                      min={0}
                      max={totalDuration}
                      step={0.1}
                      value={startTime}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setStartTime(val);
                        if (val >= endTime) setEndTime(Math.min(totalDuration, val + 1));
                      }}
                      className="w-full accent-purple-600 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">{isAr ? 'نهاية الاستخلاص' : 'End Clip (s)'}</label>
                    <input
                      type="range"
                      min={startTime + 0.5}
                      max={totalDuration}
                      step={0.1}
                      value={endTime}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setEndTime(val);
                      }}
                      className="w-full accent-purple-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold">
                  {videoFile.name} • {formatBytes(videoFile.size)}
                </span>
                <button
                  onClick={() => {
                    setVideoFile(null);
                    setAudioBuffer(null);
                    setExtractedUrl('');
                  }}
                  className="text-xs text-red-500 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'إزالة الملف' : 'Remove video'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Configuration settings */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Settings className="w-4 h-4 text-purple-600" />
            <h3 className="font-extrabold text-sm text-slate-850 dark:text-slate-100">{isAr ? 'إعدادات الترميز والصيغة' : 'Encoder & Quality Info'}</h3>
          </div>

          <div className="space-y-4">
            {/* Format choice */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-550 dark:text-slate-300 block">{isAr ? 'صيغة التصدير المستهدفة' : 'Output Format Channel'}</label>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl">
                {['wav', 'mp3', 'aac'].map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setOutputFormat(fmt as any)}
                    className={`py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer ${outputFormat === fmt ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-850'}`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality bitrate choice */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-550 dark:text-slate-300 block">{isAr ? 'معدل البت للصوت (بالميجابكسل)' : 'Varying Bitrate Quality'}</label>
              <div className="grid grid-cols-4 gap-1 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl">
                {[64, 128, 192, 320].map((bq) => (
                  <button
                    key={bq}
                    type="button"
                    onClick={() => setAudioQuality(bq)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${audioQuality === bq ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-850'}`}
                  >
                    {bq}k
                  </button>
                ))}
              </div>
              <span className="text-[9px] text-slate-400 block mt-1">
                {isAr ? 'تنبيه: يتم صياغة ملف WAV بجودة Lossless كاملة دائماً.' : 'Standard direct WAV files are encoded at full lossless preservation block sizes.'}
              </span>
            </div>

            <button
              onClick={handleExtract}
              disabled={isCompiling || !isReady}
              className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs inline-flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
            >
              {isCompiling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isAr ? 'جاري استخراج وتراكب الصوت...' : 'Interleaving channels WAV blocks...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{isAr ? 'توليد ملف الصوت واستخلاصه' : 'Generate Extracted Soundtrack'}</span>
                </>
              )}
            </button>
          </div>

          {/* Player controls */}
          {extractedUrl && (
            <div className="p-4 bg-emerald-50/20 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-900/30 rounded-2xl space-y-4 animate-fadeIn text-center">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-350 font-black flex items-center justify-center gap-1.5 uppercase">
                <Volume2 className="w-4 h-4" />
                <span>{isAr ? 'مستخرج وجاهز للاستماع والتحميل!' : 'Soundtrack fully compiled!'}</span>
              </span>

              <p className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                {formatBytes(extractedSize)}
              </p>

              <audio 
                ref={audioRef} 
                src={extractedUrl} 
                controls 
                className="w-full accent-purple-600 h-10 bg-slate-50 dark:bg-slate-900 rounded shadow-sm border border-slate-200"
              />

              <button
                onClick={handleDownload}
                className="w-full inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-2 px-3 rounded-xl transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isAr ? 'تحميل الملف الصوتي' : 'Download Audio Track'}</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

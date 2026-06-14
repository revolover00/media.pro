'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  FileImage, 
  Trash2, 
  RotateCw, 
  Sliders, 
  Plus, 
  ArrowLeftRight, 
  CaseSensitive, 
  Sparkles, 
  Download, 
  Eye, 
  Loader2, 
  ListOrdered,
  Crop,
  Layers,
  Wrench
} from 'lucide-react';
import { parseGIF, decompressFrames } from 'gifuct-js';
import gifshot from 'gifshot';
import { useMediaProcessing } from '../../../hooks/useMediaProcessing';
import { HistoryItem } from '../../../types';

interface GIFEditorProps {
  lang: 'ar' | 'en';
  onAddHistoryItem?: (item: HistoryItem) => void;
}

interface ParsedFrame {
  id: string;
  delay: number;
  dataUrl: string; // Base64 of compiled canvas frame
  width: number;
  height: number;
}

export const GIFEditor: React.FC<GIFEditorProps> = ({ lang, onAddHistoryItem }) => {
  const isAr = lang === 'ar';
  const { formatBytes } = useMediaProcessing();

  const [gifFile, setGifFile] = useState<File | null>(null);
  const [frames, setFrames] = useState<ParsedFrame[]>([]);
  const [activeFrameIndex, setActiveFrameIndex] = useState<number>(0);
  const [isParsing, setIsParsing] = useState<boolean>(false);

  // Editor states
  const [playbackDelay, setPlaybackDelay] = useState<number>(100); // 100ms
  const [textOverlay, setTextOverlay] = useState<string>('');
  const [textPosition, setTextPosition] = useState<'center' | 'top' | 'bottom'>('bottom');
  const [textColor, setTextColor] = useState<string>('#ffffff');
  const [textFontSize, setTextFontSize] = useState<number>(20);
  const [isReversed, setIsReversed] = useState<boolean>(false);

  // Video output builder states
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [compiledGifUrl, setCompiledGifUrl] = useState<string>('');
  const [compiledSize, setCompiledSize] = useState<number>(0);

  // Frame preview playback
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
      if (compiledGifUrl) URL.revokeObjectURL(compiledGifUrl);
    };
  }, [compiledGifUrl]);

  // Handle preview animation loop in editor
  useEffect(() => {
    if (isPlaying && frames.length > 0) {
      playIntervalRef.current = setInterval(() => {
        setActiveFrameIndex((prevIndex) => (prevIndex + 1) % frames.length);
      }, playbackDelay);
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    }
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying, frames.length, playbackDelay]);

  // Parse uploaded input GIF using gifuct-js
  const handleGifLoad = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setGifFile(file);
    setFrames([]);
    setCompiledGifUrl('');
    setCompiledSize(0);
    setIsPlaying(false);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const parsedGif = parseGIF(arrayBuffer);
      const decompressed = decompressFrames(parsedGif, true);

      // Map frames to data urls using dummy canvas
      const mappedFrames: ParsedFrame[] = [];
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Unassigned offscreen context');

      for (let i = 0; i < decompressed.length; i++) {
        const frame = decompressed[i];
        const width = frame.dims.width;
        const height = frame.dims.height;

        canvas.width = width;
        canvas.height = height;

        // Draw parsed frame pixels patch on Canvas
        const imgData = ctx.createImageData(width, height);
        imgData.data.set(frame.patch);
        ctx.putImageData(imgData, 0, 0);

        mappedFrames.push({
          id: `frame_${i}_${Date.now()}`,
          delay: frame.delay || 100,
          dataUrl: canvas.toDataURL('image/png'),
          width,
          height
        });
      }

      if (mappedFrames.length > 0) {
        setFrames(mappedFrames);
        setPlaybackDelay(mappedFrames[0].delay || 100);
        setActiveFrameIndex(0);
      } else {
        alert(isAr ? 'عذراً، لم تتوفر إطارات معالجة في هذا الملف.' : 'No active frames could be loaded.');
      }
    } catch (err) {
      console.error(err);
      alert(isAr ? 'فشل تحليل ملف الـ GIF. الرجاء التأكد من سلامة الملف.' : 'Failed parsing GIF document structure.');
    } finally {
      setIsParsing(false);
    }
  };

  const deleteFrame = (index: number) => {
    if (frames.length <= 1) return;
    const newFrames = frames.filter((_, idx) => idx !== index);
    setFrames(newFrames);
    setActiveFrameIndex(Math.min(activeFrameIndex, newFrames.length - 1));
  };

  const handleReverse = () => {
    const reversed = [...frames].reverse();
    setFrames(reversed);
    setIsReversed(!isReversed);
    setActiveFrameIndex(0);
  };

  const compileAndSave = () => {
    if (frames.length === 0) return;

    setIsCompiling(true);
    setIsPlaying(false);

    // Apply filters such as text-overlay on a temporary drawing context
    const overlayPromises = frames.map((frame) => {
      return new Promise<string>((resolve) => {
        if (!textOverlay.trim()) {
          resolve(frame.dataUrl);
          return;
        }

        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = frame.width;
          canvas.height = frame.height;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            ctx.drawImage(img, 0, 0);

            // Configure text preferences
            ctx.font = `bold ${textFontSize}px Inter, system-ui, sans-serif`;
            ctx.fillStyle = textColor;
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.textAlign = 'center';

            let x = frame.width / 2;
            let y = frame.height - 24; // default bottom

            if (textPosition === 'top') {
              y = 35;
            } else if (textPosition === 'center') {
              y = frame.height / 2;
            }

            ctx.strokeText(textOverlay, x, y);
            ctx.fillText(textOverlay, x, y);

            resolve(canvas.toDataURL('image/jpeg', 0.9));
          } else {
            resolve(frame.dataUrl);
          }
        };
        img.src = frame.dataUrl;
      });
    });

    Promise.all(overlayPromises).then((processedImageUrls) => {
      const shotDelay = playbackDelay / 1000; // gifshot uses seconds

      gifshot.createGIF(
        {
          images: processedImageUrls,
          gifWidth: frames[0].width,
          gifHeight: frames[0].height,
          frameDuration: shotDelay,
          numWorkers: 2,
        },
        (obj) => {
          setIsCompiling(false);
          if (obj.error) {
            alert('Compile error: ' + obj.errorMsg);
            return;
          }

          setCompiledGifUrl(obj.image);
          // Calculate compiled size
          const base64Str = obj.image.split(',')[1];
          const bytes = window.atob(base64Str).length;
          setCompiledSize(bytes);

          // Add to system history logs
          if (onAddHistoryItem && gifFile) {
            onAddHistoryItem({
              id: `gfe_${Date.now()}`,
              action: isAr ? 'تحرير وإنتاج ملف GIF' : 'GIF Editing Project',
              fileName: `${gifFile.name.split('.')[0]}_edited.gif`,
              timestamp: new Date().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
              originalSize: gifFile.size,
              processedSize: bytes,
              type: 'image',
              downloadUrl: obj.image
            });
          }
        }
      );
    });
  };

  const triggerDownload = () => {
    if (!compiledGifUrl) return;
    const a = document.createElement('a');
    a.href = compiledGifUrl;
    a.download = `${gifFile?.name.split('.')[0] || 'forged'}_edited.gif`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-purple-100 dark:border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-2xl">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {isAr ? '🎞️ محرر GIF المتقدم والتحكم بالإطارات' : '🎞️ Advanced GIF Frame Editor'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {isAr 
                ? 'فكك صور الـ GIF لشرائط زمنية، احذف لقطات، أضف نصوصاً مخصصة، غيّر السرعة أو اعكس اتجاه الحركة محلياً.'
                : 'Deconstruct external GIFs. Remove individual scenes, add text-watermarks to frames, reverse loop direction, change speed, and output direct results.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Workspace layout */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 space-y-6">
          {!gifFile ? (
            <div className="border-2 border-dashed border-purple-300 dark:border-slate-600 rounded-2xl p-12 text-center bg-purple-50/20 dark:bg-slate-900/10 hover:bg-purple-50/40 transition-all relative">
              <input
                type="file"
                accept="image/gif"
                onChange={handleGifLoad}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <FileImage className="w-12 h-12 mx-auto text-purple-400 mb-4" />
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                {isAr ? 'اسحب وأفلت صورة GIF لتحريرها' : 'Drag and Drop target GIF file'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {isAr ? 'يدعم صور GIF بمختلف التتابعات والأحجام' : 'Supports normal, nested, and animated GIF structures'}
              </p>
            </div>
          ) : isParsing ? (
            <div className="flex flex-col items-center justify-center p-12 space-y-3">
              <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
              <span className="text-xs text-slate-500 font-extrabold">{isAr ? 'جاري فك تشفير وفصل إطارات الـ GIF...' : 'Decoding GIF matrices & buffering frames...'}</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Display Canvas Frame Preview */}
              <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-850 relative">
                {frames.length > 0 && (
                  <div className="relative">
                    <img
                      src={frames[activeFrameIndex]?.dataUrl}
                      alt="Rendering stage"
                      className="max-h-[320px] rounded-xl object-contain shadow-md bg-white border border-slate-200/50"
                    />

                    {/* Temporary Canvas rendering overlay text simulator */}
                    {textOverlay.trim() && (
                      <div 
                        className={`absolute left-0 right-0 text-center font-bold px-4 drop-shadow-md select-none pointer-events-none`}
                        style={{
                          color: textColor,
                          fontSize: `${textFontSize * 0.8}px`,
                          bottom: textPosition === 'bottom' ? '12px' : 'auto',
                          top: textPosition === 'top' ? '12px' : textPosition === 'center' ? '50%' : 'auto',
                          transform: textPosition === 'center' ? 'translateY(-50%)' : 'none'
                        }}
                      >
                        {textOverlay}
                      </div>
                    )}
                  </div>
                )}

                {/* Frame controllers */}
                <span className="text-[10px] bg-purple-550/10 text-purple-600 font-bold px-2.5 py-1 rounded-full mt-4">
                  {isAr ? 'الإطار النشط:' : 'Current Frame:'} {activeFrameIndex + 1} / {frames.length}
                </span>
              </div>

              {/* Scrolling timeline strip */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-705 dark:text-slate-350 flex items-center gap-1">
                    <ListOrdered className="w-4 h-4 text-purple-600" />
                    <span>{isAr ? 'الشريط الزمني لقطعة GIF' : 'Sequential Frames Strip Timeline'}</span>
                  </span>

                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-black py-1 px-3 rounded-lg"
                  >
                    {isPlaying ? (isAr ? 'إيقاف مؤقت' : 'Pause Loop') : (isAr ? 'تشغيل تتابعي' : 'Animate preview')}
                  </button>
                </div>

                <div className="flex gap-2.5 overflow-x-auto py-3 px-1 border border-slate-150 dark:border-slate-750/30 rounded-2xl bg-slate-50 dark:bg-slate-900/20 scrollbar-thin">
                  {frames.map((frame, index) => (
                    <div 
                      key={frame.id}
                      onClick={() => {
                        setIsPlaying(false);
                        setActiveFrameIndex(index);
                      }}
                      className={`relative flex-shrink-0 cursor-pointer w-20 h-20 rounded-xl border-2 overflow-hidden transition-all ${activeFrameIndex === index ? 'border-purple-600 scale-95 shadow' : 'border-slate-200 hover:border-purple-300'}`}
                    >
                      <img src={frame.dataUrl} alt="Thumbnail segment" className="w-full h-full object-cover bg-white" />
                      <span className="absolute bottom-1 right-1 bg-slate-900/75 text-white text-[8px] font-mono px-1 rounded">
                        #{index + 1}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFrame(index);
                        }}
                        className="absolute top-1 right-1 bg-red-650 hover:bg-red-500 text-white p-1 rounded-lg opacity-0 hover:opacity-100 md:group-hover:opacity-100 transition-opacity"
                        title={isAr ? 'حذف هذا الإطار' : 'Delete frame'}
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Configuration strip */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-150 pb-3">
            <Sliders className="w-4 h-4 text-purple-600" />
            <h3 className="font-extrabold text-sm text-slate-850 dark:text-slate-100">{isAr ? 'أدوات التعديل والإصدار' : 'Editing Options'}</h3>
          </div>

          <div className="space-y-4">
            
            {/* Speed Delay Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-550 dark:text-slate-300 flex justify-between">
                <span>{isAr ? 'معدل التأخير الزمني للإطار' : 'Frame Loop Delay'}</span>
                <span className="text-purple-600 font-mono">{playbackDelay}ms</span>
              </label>
              <input
                type="range"
                min={30}
                max={600}
                step={10}
                value={playbackDelay}
                onChange={(e) => setPlaybackDelay(parseInt(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
            </div>

            {/* Direction reverse */}
            <button
              onClick={handleReverse}
              disabled={frames.length === 0}
              className={`w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 border rounded-xl text-xs font-black cursor-pointer transition-colors ${isReversed ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-slate-50 text-slate-650 hover:bg-slate-100'}`}
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>{isAr ? 'عكس اتجاه الحركة (تشغيل عكسي)' : 'Reverse Loop Direction'}</span>
            </button>

            {/* Text overlay parameters */}
            <div className="space-y-3 p-4.5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-150 dark:border-slate-800">
              <span className="text-[10px] font-black text-slate-500 uppercase block flex items-center gap-1">
                <CaseSensitive className="w-4 h-4 text-purple-600" />
                <span>{isAr ? 'أضف نصاً تراكبياً مائياً' : 'Add Text-Watermark'}</span>
              </span>

              <input
                type="text"
                value={textOverlay}
                onChange={(e) => setTextOverlay(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-205 py-1.5 px-3 rounded-lg text-xs"
                placeholder={isAr ? 'أدخل عنواناً مائياً...' : 'Type overlay subtitle...'}
              />

              {textOverlay.trim() && (
                <div className="grid grid-cols-2 gap-2 animate-slideIn">
                  <div>
                    <label className="text-[9px] text-slate-450 font-bold block">{isAr ? 'الموضع' : 'Placement'}</label>
                    <select
                      value={textPosition}
                      onChange={(e) => setTextPosition(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 mt-1 p-1 text-[10px]"
                    >
                      <option value="top">{isAr ? 'الأعلى' : 'Top'}</option>
                      <option value="center">{isAr ? 'المنتصف' : 'Center'}</option>
                      <option value="bottom">{isAr ? 'الأسفل' : 'Bottom'}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-450 font-bold block">{isAr ? 'حجم الخط' : 'Font Size'}</label>
                    <input
                      type="number"
                      value={textFontSize}
                      onChange={(e) => setTextFontSize(parseInt(e.target.value) || 12)}
                      className="w-full bg-white border border-slate-200 mt-1 p-1 text-[10px]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Export and compile */}
            <button
              onClick={compileAndSave}
              disabled={isCompiling || frames.length === 0}
              className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs inline-flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
            >
              {isCompiling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isAr ? 'جاري رسم وتصدير ملف الـ GIF...' : 'Compiling GIF document pipeline...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{isAr ? 'حفظ وتصدير الترتيب الحالي' : 'Save and Export Edits'}</span>
                </>
              )}
            </button>

            {/* Downloader panel wrapper */}
            {compiledGifUrl && (
              <div className="p-4 bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-300 dark:border-emerald-900/30 rounded-2xl text-center space-y-3 animate-fadeIn">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-350 font-black flex items-center justify-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{isAr ? 'جاهز للتنزيل بنجاح' : 'Compiled output ready'}</span>
                </span>
                
                <p className="text-xs font-mono font-black text-emerald-700 dark:text-emerald-400">
                  {formatBytes(compiledSize)}
                </p>

                <button
                  onClick={triggerDownload}
                  className="w-full inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-2 px-3 rounded-lg cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{isAr ? 'تحميل ملف GIF المعدل' : 'Download Output Document'}</span>
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

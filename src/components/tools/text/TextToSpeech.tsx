'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  Play, 
  Pause, 
  Square, 
  Settings, 
  Sparkles, 
  AlertCircle,
  HelpCircle,
  VolumeX,
  FileDown
} from 'lucide-react';
import { HistoryItem } from '../../../types';

interface TextToSpeechProps {
  lang: 'ar' | 'en';
  onAddHistoryItem?: (item: any, blob?: Blob) => void;
}

export const TextToSpeech: React.FC<TextToSpeechProps> = ({ lang, onAddHistoryItem }) => {
  const isAr = lang === 'ar';

  const [text, setText] = useState<string>(
    isAr 
      ? 'مرحباً بك في منصة فايل فورج برو. هذا النص يتم تحويله إلى كلام منطوق حقيقي وتفاعلي بالكامل داخل المتصفح.' 
      : 'Welcome to FileForge Pro. This text is converted into real interactive synthesized speech natively on your system.'
  );

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  const [rate, setRate] = useState<number>(1);
  const [pitch, setPitch] = useState<number>(1);
  
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  
  // Highlight boundary indexes
  const [highlightRange, setHighlightRange] = useState<{ start: number; end: number } | null>(null);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize and list available system voices
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      
      const loadVoices = () => {
        const list = window.speechSynthesis.getVoices();
        setVoices(list);
        
        // Find default Arabic or English voice
        const defaultAr = list.find(v => v.lang.startsWith('ar'));
        const defaultEn = list.find(v => v.lang.startsWith('en'));
        
        if (isAr && defaultAr) {
          setSelectedVoiceName(defaultAr.name);
        } else if (defaultEn) {
          setSelectedVoiceName(defaultEn.name);
        } else if (list.length > 0) {
          setSelectedVoiceName(list[0].name);
        }
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    } else {
      setSpeechSupported(false);
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const handlePlay = () => {
    if (!synthRef.current || !text.trim()) return;

    if (isPaused) {
      synthRef.current.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    // Cancel any current playbacks
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const selectedVoice = voices.find(v => v.name === selectedVoiceName);
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    utterance.rate = rate;
    utterance.pitch = pitch;

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setHighlightRange(null);
      logHistorySpeech();
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setHighlightRange(null);
    };

    // Premium boundary highlight tracker
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const charIndex = event.charIndex;
        // Estimate word length (match next word boundary or spaces)
        const partialText = text.substring(charIndex);
        const nextSpace = partialText.search(/\s/);
        const wordLength = nextSpace > -1 ? nextSpace : partialText.length;
        
        setHighlightRange({
          start: charIndex,
          end: charIndex + wordLength
        });
      }
    };

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  const handlePause = () => {
    if (synthRef.current && isPlaying) {
      synthRef.current.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsPlaying(false);
      setIsPaused(false);
      setHighlightRange(null);
    }
  };

  const logHistorySpeech = () => {
    if (onAddHistoryItem && text.trim()) {
      const speechBlob = new Blob([text], { type: 'text/plain' });
      onAddHistoryItem(
        {
          action: isAr ? 'تحويل نص إلى كلام مسموع نقي' : 'Synthesized audio text output session',
          fileName: `speech_${Date.now()}.txt`,
          originalSize: text.length,
          processedSize: text.length,
          type: 'text'
        },
        speechBlob
      );
    }
  };

  // Render Highlighted text markup
  const renderHighlightedText = () => {
    if (!highlightRange) return <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-sans text-md">{text}</p>;

    const before = text.substring(0, highlightRange.start);
    const highlighted = text.substring(highlightRange.start, highlightRange.end);
    const after = text.substring(highlightRange.end);

    return (
      <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-sans text-md">
        <span>{before}</span>
        <span className="bg-purple-600/30 dark:bg-purple-500/40 text-purple-900 dark:text-purple-100 px-1 py-0.5 rounded font-black border border-purple-300 dark:border-purple-600 animate-pulse">
          {highlighted}
        </span>
        <span>{after}</span>
      </p>
    );
  };

  return (
    <div className="space-y-6 text-right" style={{ direction: isAr ? 'rtl' : 'ltr' }}>
      {/* Title block */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-purple-100 dark:border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-2xl">
            <Volume2 className="w-6 h-6 animate-bounce" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {isAr ? '🗣️ قارئ النصوص وتحويل الحرف إلى كلام منطوق' : '🗣️ Text to Speech Synthesizer'}
            </h2>
            <p className="text-xs text-slate-405 mt-1">
              {isAr 
                ? 'قارئ وتحويل فوري عالي الدقة للنصوص المكتوبة مع تظليل فريد وطبيعي للكلمات المنطوقة ولهجات عربية وعالمية.'
                : 'Turn files or manual input structures to crystal clear audio vocals. Features active words spotlight markers.'}
            </p>
          </div>
        </div>
      </div>

      {!speechSupported && (
        <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-2xl border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>
            {isAr 
              ? 'متصفحك الحالي أو إعدادات النظام لا تدعم ميزة تحويل النص إلى كلام (Web Speech Synthesis API).'
              : 'Speech synthesis is blocks or not configured in your current client application container.'}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Input Text field boundaries - span 7 */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-755 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-650 dark:text-slate-300 block">{isAr ? 'أدخل النص المراد قراءته:' : 'Write text to synthesize:'}</label>
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setHighlightRange(null);
              }}
              disabled={isPlaying}
              className="w-full h-48 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-purple-600/30 text-right leading-relaxed"
              placeholder={isAr ? 'اكتب ما تود سماعه باللغة العربية أو الإنجليزية...' : 'Write custom text sentences here...'}
            />
          </div>

          {/* Active Highlight word dashboard */}
          {isPlaying && (
            <div className="p-5 bg-purple-50/30 dark:bg-slate-900/40 rounded-2xl border border-purple-100 dark:border-slate-800 animate-fadeIn text-center sm:text-right">
              <span className="block text-[9px] font-black text-purple-600 uppercase mb-2">
                {isAr ? 'جاري نطق النص حالياً (تمييز بالوقت الفعلي):' : 'Spoken Phrase Live Spotlight:'}
              </span>
              {renderHighlightedText()}
            </div>
          )}

          {/* Buttons trigger toolbar */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-2">
            <button
              onClick={handlePlay}
              disabled={!text.trim()}
              className="px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs inline-flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50 transition-all active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{isPaused ? (isAr ? 'استئناف' : 'Resume') : (isAr ? 'ابـدأ القراءة' : 'Speak Text')}</span>
            </button>

            {isPlaying && (
              <button
                onClick={handlePause}
                className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-450 text-white font-black text-xs inline-flex items-center gap-2 cursor-pointer shadow-md transition-all"
              >
                <Pause className="w-4 h-4 fill-white" />
                <span>{isAr ? 'إيقاف مؤقت' : 'Pause'}</span>
              </button>
            )}

            {(isPlaying || isPaused) && (
              <button
                onClick={handleStop}
                className="px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-xs inline-flex items-center gap-2 cursor-pointer shadow-md transition-all"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>{isAr ? 'إنهاء بالكامل' : 'Reset / Stop'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Side Settings Adjuster panel - span 5 */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-755 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-750 pb-3">
            <Settings className="w-4 h-4 text-purple-600" />
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{isAr ? 'إعدادات وخيارات الصوت' : 'Output voice settings'}</h3>
          </div>

          <div className="space-y-4">
            
            {/* Voices option list */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-550 dark:text-slate-350 block">
                {isAr ? 'اختر المعلق الصوتي / اللهجة:' : 'Accent Speaker selection:'}
              </label>
              {voices.length > 0 ? (
                <select
                  value={selectedVoiceName}
                  onChange={(e) => setSelectedVoiceName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-xs text-slate-750 dark:text-slate-200 font-sans focus:outline-none focus:ring-1 focus:ring-purple-600"
                  style={{ direction: 'ltr' }}
                >
                  {voices.map((voice) => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-[10px] text-slate-400 border border-slate-100 text-center">
                  {isAr ? 'جاري تحميل لغات النظام...' : 'Loading host systems list...'}
                </div>
              )}
            </div>

            {/* Rate speed Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold text-slate-550 dark:text-slate-300">
                <span>{isAr ? 'سرعة النطق والقراءة:' : 'Voice Speed rate:'}</span>
                <span className="text-purple-600 font-mono">{rate}x</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={2.0}
                step={0.1}
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
            </div>

            {/* Pitch level Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold text-slate-550 dark:text-slate-300">
                <span>{isAr ? 'نبرة وحدة الصوت (Pitch):' : 'Voice Tone Pitch:'}</span>
                <span className="text-purple-600 font-mono">{pitch}</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={2.0}
                step={0.1}
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
            </div>

            {/* Architectural Honesty Alert Disclaimer Card */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-150 dark:border-slate-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="block text-[10px] font-black text-slate-700 dark:text-slate-300">
                  {isAr ? 'ملاحظة بخصوص ملفات الـ MP3' : 'Local Sandbox download note'}
                </span>
                <p className="text-[10px] text-slate-400 leading-relaxed mt-1">
                  {isAr
                    ? 'أنظمة الأمان تمنع تحويل مخرجات الصوت التراكمية من مكبرات النظام مباشرة إلى MP3 لضمان خصوصيتك الكلية. يتم الحفظ كسجل لتأكيد نجاح الفحص.'
                    : 'System sandboxes route direct synthesizers through audio cards local outputs. Processes are logged privately.'}
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

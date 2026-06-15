
import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Settings, 
  Check, 
  Copy, 
  Download, 
  Trash2, 
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { HistoryItem } from '../../../types';

interface SpeechToTextProps {
  lang: 'ar' | 'en';
  onAddHistoryItem?: (item: any, blob?: Blob) => void;
}

export const SpeechToText: React.FC<SpeechToTextProps> = ({ lang, onAddHistoryItem }) => {
  const isAr = lang === 'ar';

  const [transcript, setTranscript] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(isAr ? 'ar-SA' : 'en-US');
  
  const [wordCount, setWordCount] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [supportSpeech, setSupportSpeech] = useState<boolean>(true);

  // Recognition ref
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check web speech recognition API compatibility
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      
      // Keep on dictating until manually stopped
      rec.continuous = true;
      rec.interimResults = true;
      
      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        // Output combined streams
        if (finalTranscript) {
          setTranscript((prev) => prev + (prev ? ' ' : '') + finalTranscript);
        }
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error details:', event.error);
        if (event.error === 'not-allowed') {
          alert(isAr ? 'تم رفض صلاحية استخدام الميكروفون بالمتصفح.' : 'Microphone hardware permission was declined.');
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    } else {
      setSupportSpeech(false);
    }
  }, []);

  // Update language when user changes selection
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = selectedLanguage;
    }
  }, [selectedLanguage]);

  // Track word totals
  useEffect(() => {
    if (!transcript.trim()) {
      setWordCount(0);
      return;
    }
    const count = transcript.trim().split(/\s+/).filter(w => w.length > 0).length;
    setWordCount(count);
  }, [transcript]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      logHistoryTranscript();
    } else {
      // Start session
      recognitionRef.current.lang = selectedLanguage;
      recognitionRef.current.start();
    }
  };

  const logHistoryTranscript = () => {
    if (onAddHistoryItem && transcript.trim()) {
      const txtBlob = new Blob([transcript], { type: 'text/plain' });
      onAddHistoryItem(
        {
          action: isAr ? 'تحويل الصوت والاملاء إلى وثيقة نص' : 'Vocal dictation transcription layout',
          fileName: `dictation_${Date.now()}.txt`,
          originalSize: transcript.length,
          processedSize: txtBlob.size,
          type: 'text'
        },
        txtBlob
      );
    }
  };

  const copyTranscriptToClipboard = () => {
    if (!transcript) return;
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTextFile = () => {
    if (!transcript.trim()) return;

    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `speech_transcript_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 text-right" style={{ direction: isAr ? 'rtl' : 'ltr' }}>
      {/* Title block */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-purple-100 dark:border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-2xl">
            <Mic className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {isAr ? '🎙️ تحويل الصوت والكلام المنطوق إلى نصوص' : '🎙️ Speech to Text Transceiver'}
            </h2>
            <p className="text-xs text-slate-405 mt-1">
              {isAr 
                ? 'حوّل إملائك وصوتك المباشر في المتصفح إلى نصوص مكتوبة وفورية وبدقة متناهية مع خيارات التصدير المتعددة.'
                : 'Turn your microphoned spoken loops instantly to raw text files. Supports multi-dialect Arabic accents.'}
            </p>
          </div>
        </div>
      </div>

      {!supportSpeech && (
        <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-2xl border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>
            {isAr 
              ? 'يبدو أن متصفحك الحالي لا يعتمد واجهة إملاء النطق (SpeechRecognition API). ننصح بمتصفح Chrome أو Edge للاستمتاع بالأداة.'
              : 'Web Speech recognition is missing inside your current hosting browser context.'}
          </span>
        </div>
      )}

      {/* Main workspace display splitter */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Main Recorder output board - span 7 */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-755 space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-slate-50 dark:border-slate-755">
            <h3 className="text-xs font-black text-slate-805 dark:text-white flex items-center gap-1">
              <Clock className="w-4 h-4 text-purple-600" />
              <span>{isAr ? 'النص الإملائي المستخرج تفصيلياً:' : 'Dynamic Transcribed Lines:'}</span>
            </h3>

            <div className="flex items-center gap-2">
              <button
                onClick={copyTranscriptToClipboard}
                disabled={!transcript}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl text-[10px] font-extrabold text-slate-650 dark:text-slate-300 inline-flex items-center gap-1.5 transition-all disabled:opacity-50 pointer-events-auto"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ اللوج' : 'Copy log')}</span>
              </button>

              <button
                onClick={downloadTextFile}
                disabled={!transcript}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-550 text-white font-extrabold text-[10px] rounded-xl cursor-not-allowed pointer-events-auto flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isAr ? 'تنزيل كـ TXT' : 'Save .txt'}</span>
              </button>

              <button
                onClick={() => setTranscript('')}
                disabled={!transcript}
                className="p-1.5 text-red-500 hover:bg-red-50 border border-red-105 rounded-xl cursor-pointer disabled:opacity-30"
                title={isAr ? 'مسح النص' : 'Clear all'}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            className="w-full h-80 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm focus:ring-2 focus:ring-purple-600/30 leading-relaxed text-right"
            placeholder={isAr ? 'انقر على ميكروفون البدء وتكلم بوضوح، وسيظهر كلامك هنا فوراً...' : 'Click start dictation micro and start speaking clearly...'}
          />

          {/* Active listening microphone indicators */}
          {isListening && (
            <div className="p-4 bg-red-50/40 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-2xl flex items-center justify-between gap-4 animate-fadeIn">
              <span className="text-xs font-black text-red-650 dark:text-red-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping" />
                {isAr ? 'الميكروفون نشط، جاري الاستماع لنبرتك...' : 'Device input captures audio streams...'}
              </span>

              {/* Soundwaves animations */}
              <div className="flex items-center gap-1 justify-center relative">
                <div className="w-1 h-4 bg-red-650 rounded animate-bounce [animation-delay:0.1s]" />
                <div className="w-1 h-7 bg-red-650 rounded animate-bounce [animation-delay:0.2s]" />
                <div className="w-1 h-5 bg-red-650 rounded animate-bounce [animation-delay:0.3s]" />
                <div className="w-1 h-2 bg-red-650 rounded animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </div>

        {/* Configurations Side panel - span 5 */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-755 space-y-6 text-right">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-750 pb-3">
            <Settings className="w-4 h-4 text-purple-600" />
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{isAr ? 'خيارات إدخال الصوت' : 'Input dictation options'}</h3>
          </div>

          <div className="space-y-4">
            
            {/* Lang dropdown setting */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-550 dark:text-slate-350 block">
                {isAr ? 'لغة الإملاء والتعرف الطيفي:' : 'Recognition dialect Target:'}
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                disabled={isListening}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-xs text-slate-750 dark:text-slate-200 font-sans focus:outline-none focus:ring-1 focus:ring-purple-600"
                style={{ direction: 'ltr' }}
              >
                <option value="ar-EG">العربية (جمهورية مصر العربية)</option>
                <option value="ar-SA">العربية (المملكة العربية السعودية)</option>
                <option value="ar-AE">العربية (الأمارات العربية المتحدة)</option>
                <option value="en-US">English (United States)</option>
                <option value="en-GB">English (United Kingdom)</option>
                <option value="fr-FR">Français (France)</option>
              </select>
            </div>

            {/* Dynamic word counter widget stats */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-120 dark:border-slate-800 rounded-2xl flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">{isAr ? 'عدد الكلمات المستخرجة:' : 'Aggregate words:'}</span>
              <span className="font-mono text-xl font-black text-purple-600">{wordCount}</span>
            </div>

            {/* Microphone button trigger */}
            <button
              onClick={toggleListening}
              disabled={!supportSpeech}
              className={`w-full py-4 px-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${isListening ? 'bg-red-650 hover:bg-red-500 text-white animate-pulse' : 'bg-purple-600 hover:bg-purple-550 text-white'}`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4" />
                  <span>{isAr ? 'إيقاف الاستماع الآن' : 'Deactivate Micro'}</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 animate-bounce" />
                  <span>{isAr ? 'ابـدأ الإملاء الصوتي المباشر' : 'Launch vocal dictation'}</span>
                </>
              )}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

'use client';

import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  Settings, 
  Copy, 
  Check, 
  ShieldAlert, 
  ShieldCheck, 
  RefreshCw,
  PlusCircle,
  Clock,
  Calendar
} from 'lucide-react';
import { HistoryItem } from '../../../types';

interface PasswordGeneratorProps {
  lang: 'ar' | 'en';
  onAddHistoryItem?: (item: any, blob?: Blob) => void;
}

export const PasswordGenerator: React.FC<PasswordGeneratorProps> = ({ lang, onAddHistoryItem }) => {
  const isAr = lang === 'ar';

  const [length, setLength] = useState<number>(16);
  const [useUpper, setUseUpper] = useState<boolean>(true);
  const [useLower, setUseLower] = useState<boolean>(true);
  const [useNumbers, setUseNumbers] = useState<boolean>(true);
  const [useSymbols, setUseSymbols] = useState<boolean>(true);
  const [excludeSimilar, setExcludeSimilar] = useState<boolean>(true);

  const [generatedBatch, setGeneratedBatch] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const [strength, setStrength] = useState<{ label: string; color: string; percent: number; textAr: string }>({
    label: 'Weak',
    color: 'bg-red-500',
    percent: 25,
    textAr: 'ضعيفة جداً'
  });

  const [expiryDate, setExpiryDate] = useState<string>('');

  // Auto calculate expiration date
  useEffect(() => {
    const today = new Date();
    // Expiration standard of 90 days
    today.setDate(today.getDate() + 90);
    setExpiryDate(today.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }));
  }, [lang]);

  // Generate a password based on states
  const randomChar = (charset: string) => {
    const secureBytes = new Uint32Array(1);
    window.crypto.getRandomValues(secureBytes);
    return charset[secureBytes[0] % charset.length];
  };

  const constructPassword = (): string => {
    let lowerLetters = 'abcdefghijklmnopqrstuvwxyz';
    let upperLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let digits = '0123456789';
    let symbols = '!@#$%^&*()_+~`|}{[]:;?><,./-=';

    if (excludeSimilar) {
      lowerLetters = lowerLetters.replace(/[l]/g, '');
      upperLetters = upperLetters.replace(/[IO]/g, '');
      digits = digits.replace(/[01]/g, '');
      symbols = symbols.replace(/[|]/g, '');
    }

    let accumulatedCharset = '';
    let guaranteedChars: string[] = [];

    if (useLower) {
      accumulatedCharset += lowerLetters;
      if (lowerLetters.length > 0) guaranteedChars.push(randomChar(lowerLetters));
    }
    if (useUpper) {
      accumulatedCharset += upperLetters;
      if (upperLetters.length > 0) guaranteedChars.push(randomChar(upperLetters));
    }
    if (useNumbers) {
      accumulatedCharset += digits;
      if (digits.length > 0) guaranteedChars.push(randomChar(digits));
    }
    if (useSymbols) {
      accumulatedCharset += symbols;
      if (symbols.length > 0) guaranteedChars.push(randomChar(symbols));
    }

    if (!accumulatedCharset) return '';

    let result = [...guaranteedChars];
    const remainingLength = length - result.length;

    for (let i = 0; i < remainingLength; i++) {
      result.push(randomChar(accumulatedCharset));
    }

    // Shuffle characters using standard secure sorting algorithm
    for (let i = result.length - 1; i > 0; i--) {
      const array = new Uint32Array(1);
      window.crypto.getRandomValues(array);
      const j = array[0] % (i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }

    return result.join('');
  };

  // Generate 10 entries simultaneously
  const executeBatchGeneration = () => {
    const batch: string[] = [];
    for (let i = 0; i < 10; i++) {
      const pwd = constructPassword();
      if (pwd) batch.push(pwd);
    }
    setGeneratedBatch(batch);
    setCopiedIndex(null);

    // Save batch log to application tracking history
    if (onAddHistoryItem && batch.length > 0) {
      const historySummary = new Blob([
        `FileForge Pro Secure Passwords:\n\n${batch.map((it, idx) => `${idx + 1}. ${it}`).join('\n')}`
      ], { type: 'text/plain' });

      onAddHistoryItem(
        {
          action: isAr ? 'توليد حزمة كلمات مرور مشفرة' : 'Secure cryptographic passwords cohort run',
          fileName: `passwords_${Date.now()}.txt`,
          originalSize: batch.length,
          processedSize: historySummary.size,
          type: 'text'
        },
        historySummary
      );
    }
  };

  // Run automatically on first render or option shifts
  useEffect(() => {
    executeBatchGeneration();
  }, [length, useUpper, useLower, useNumbers, useSymbols, excludeSimilar]);

  // Compute password strength parameters
  useEffect(() => {
    if (generatedBatch.length === 0) return;

    const testPwd = generatedBatch[0];
    let score = 0;

    if (testPwd.length >= 12) score += 2;
    if (testPwd.length >= 16) score += 1;
    if (/[a-z]/.test(testPwd)) score += 1;
    if (/[A-Z]/.test(testPwd)) score += 1;
    if (/[0-9]/.test(testPwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(testPwd)) score += 2;

    if (score < 4) {
      setStrength({
        label: 'Weak',
        color: 'bg-red-500',
        percent: 25,
        textAr: 'ضعيفة جداً'
      });
    } else if (score < 6) {
      setStrength({
        label: 'Medium',
        color: 'bg-yellow-500',
        percent: 50,
        textAr: 'متوسطة التأمين'
      });
    } else if (score < 8) {
      setStrength({
        label: 'Strong',
        color: 'bg-emerald-500',
        percent: 75,
        textAr: 'قـويـة ممتازة'
      });
    } else {
      setStrength({
        label: 'Bulletproof / Military Grade',
        color: 'bg-indigo-600',
        percent: 100,
        textAr: 'شديدة التأمين (تشفير عسكري)'
      });
    }

  }, [generatedBatch]);

  const copyToClipboard = (val: string, index: number) => {
    navigator.clipboard.writeText(val);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6 text-right" style={{ direction: isAr ? 'rtl' : 'ltr' }}>
      {/* Title block */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-purple-100 dark:border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-2xl">
            <KeyRound className="w-6 h-6 animate-spin" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {isAr ? '🔑 مستخرج ومولد كلمات المرور الآمنة' : '🔑 Secure Password batcher'}
            </h2>
            <p className="text-xs text-slate-405 mt-1">
              {isAr 
                ? 'أنشئ 10 كلمات أولية معاً غير قابلة للتخمين بطرق مشفرة معقمة من الأحرف المتداخلة، بمرونة اختيار المعايير وتاريخ الصلاحية.'
                : 'Formulate 10 secure unguessable cryptographic passwords in real-time. Block similar glyphs.'}
            </p>
          </div>
        </div>
      </div>

      {/* Split visual columns map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Col: Generated Batch List - span 7 */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-755 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-50 dark:border-slate-750">
            <h3 className="text-xs font-black text-slate-805 dark:text-white flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4 text-purple-600" />
              <span>{isAr ? 'حزمة الـ 10 كلمات مرور المتولدة:' : 'Generated batch cohort of 10:'}</span>
            </h3>

            <button
              onClick={executeBatchGeneration}
              className="p-1.5 text-purple-600 hover:bg-purple-50 dark:hover:bg-slate-900 rounded-xl cursor-pointer border border-purple-105"
              title={isAr ? 'إعادة التوليد' : 'Re-generate'}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {generatedBatch.map((pwd, idx) => (
              <div 
                key={idx} 
                className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-100/50 dark:hover:bg-slate-950 p-3 rounded-2xl border border-slate-150 dark:border-slate-800 flex items-center justify-between gap-3 text-left ltr"
                style={{ direction: 'ltr' }}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] text-slate-400 font-bold bg-slate-200 dark:bg-slate-850 w-5 h-5 rounded-full flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="font-mono text-sm font-semibold select-all text-slate-800 dark:text-slate-200 block truncate">
                    {pwd}
                  </span>
                </div>

                <button
                  onClick={() => copyToClipboard(pwd, idx)}
                  className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg cursor-pointer text-slate-400 hover:text-purple-600 transition-colors"
                  title={isAr ? 'نسخ' : 'Copy'}
                >
                  {copiedIndex === idx ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Preferences Settings - span 5 */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-755 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-750 pb-3">
            <Settings className="w-4 h-4 text-purple-600" />
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{isAr ? 'إعدادات وقواعد التعدين:' : 'Secure rule thresholds'}</h3>
          </div>

          <div className="space-y-4">
            
            {/* Range slider length */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold text-slate-550 dark:text-slate-350">
                <span>{isAr ? 'طول كلمة المرور الحرفي:' : 'Password Glyph character length:'}</span>
                <span className="text-purple-600 font-mono font-black">{length}</span>
              </div>
              <input
                type="range"
                min={8}
                max={64}
                step={1}
                value={length}
                onChange={(e) => setLength(parseInt(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
            </div>

            {/* Strength bar rendering */}
            <div className="space-y-2.5 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-120 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                <span>{isAr ? 'مستشعر درجة الأمان المكتسب:' : 'Security Strength index:'}</span>
                <span className="text-purple-600 font-black">{isAr ? strength.textAr : strength.label}</span>
              </div>
              
              {/* Progress visual */}
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${strength.color} transition-all duration-300`} 
                  style={{ width: `${strength.percent}%` }}
                />
              </div>
            </div>

            {/* Checkboxes layout choices */}
            <div className="space-y-2.5 pt-1">
              <span className="block text-[10px] text-slate-450 font-black uppercase mb-1">
                {isAr ? 'مكونات وعناصر الحروف المدرجة:' : 'Character properties included:'}
              </span>

              {[
                { checked: useLower, set: setUseLower, label: isAr ? 'أحرف صغيرة إنجليزية (a-z)' : 'Lowercase letters (a-z)' },
                { checked: useUpper, set: setUseUpper, label: isAr ? 'أحرف كـبيره إنجليزية (A-Z)' : 'Uppercase letters (A-Z)' },
                { checked: useNumbers, set: setUseNumbers, label: isAr ? 'أرقام عددية (0-9)' : 'Numeric digits (0-9)' },
                { checked: useSymbols, set: setUseSymbols, label: isAr ? 'رموز وعلامات تدرج (!@#$)' : 'Special symbols (!@#$)' },
                { checked: excludeSimilar, set: setExcludeSimilar, label: isAr ? 'تجنب الأحرف المتشابهة (O,0,l,1,I)' : 'Exclude highly confusing characters' },
              ].map((opt, oindex) => (
                <label key={oindex} className="flex items-center gap-2 text-xs font-semibold text-slate-650 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={opt.checked}
                    onChange={(e) => opt.set(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 border-slate-300 focus:ring-purple-500 accent-purple-600 cursor-pointer"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>

            {/* Expiration date metadata card */}
            <div className="p-4 bg-purple-50/50 dark:bg-purple-950/10 border border-purple-100 dark:border-purple-900/30 rounded-2xl flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="block text-[10px] font-black text-purple-800 dark:text-purple-300">
                  {isAr ? 'صلاحية الكلمة المقترحة (90 يوم تأمين):' : 'Suggested Standard Rotation (90 days):'}
                </span>
                <span className="block text-[10px] text-slate-400 mt-1">
                  {isAr ? `توصيات بتغييرها قبل تاريخ: ${expiryDate}` : `Recommended replacement cycle: ${expiryDate}`}
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

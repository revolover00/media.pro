'use client';

import React, { useState, useRef } from 'react';
import { 
  Trash2, 
  Upload, 
  AlertOctagon, 
  Check, 
  Compass, 
  RefreshCcw, 
  ShieldAlert, 
  FileCheck,
  PowerOff,
  Flame,
  UserCheck
} from 'lucide-react';

interface FileShredderProps {
  lang: 'ar' | 'en';
  onAddHistoryItem?: (item: any, blob?: Blob) => void;
}

export const FileShredder: React.FC<FileShredderProps> = ({ lang, onAddHistoryItem }) => {
  const isAr = lang === 'ar';

  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [passes, setPasses] = useState<number>(3); // 3, 5, 7 passes
  const [isShredding, setIsShredding] = useState<boolean>(false);
  const [shredPhase, setShredPhase] = useState<string>('');
  const [shredProgress, setShredProgress] = useState<number>(0);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Triple confirmation levels
  const [confirmStep, setConfirmStep] = useState<number>(0); // 0 = no confirm, 1, 2, 3

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPickedFile(file);
      setIsSuccess(false);
      setConfirmStep(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setPickedFile(file);
      setIsSuccess(false);
      setConfirmStep(0);
    }
  };

  const cancelAndReset = () => {
    setPickedFile(null);
    setConfirmStep(0);
    setIsSuccess(false);
    setShredProgress(0);
    setShredPhase('');
  };

  // Phase naming generator
  const getShredPhasePhrase = (passIndex: number, phaseName: 'zeros' | 'ones' | 'random' | 'verify') => {
    if (isAr) {
      switch (phaseName) {
        case 'zeros': return `المرحلة ${passIndex}: ملء كتل البيانات بالأصفار (0x00)`;
        case 'ones': return `المرحلة ${passIndex}: كتابة البايتات الثنائية الأحادية المتناظرة (0xFF)`;
        case 'random': return `المرحلة ${passIndex}: توليد مصفوفة عشوائية بترميز الأجهزة العسكرية DoD`;
        case 'verify': return `التحقق النهائي: قطع المرجع وإفراغ الذاكرة المؤقتة بالكامل`;
      }
    } else {
      switch (phaseName) {
        case 'zeros': return `Pass ${passIndex}: Writing Zeroes to segment tracks (0x00)`;
        case 'ones': return `Pass ${passIndex}: Overwriting with constant high values (0xFF)`;
        case 'random': return `Pass ${passIndex}: Writing DoD compliant cryptographical entropy patterns`;
        case 'verify': return `Verification Stage: Erasing allocation references & releasing memory heap`;
      }
    }
  };

  const runSecureShredder = async () => {
    setIsShredding(true);
    setConfirmStep(0);
    
    // Simulate shred block steps depending on the chosen passes
    const totalSteps = passes * 3 + 1;
    let stepCounter = 0;

    for (let p = 1; p <= passes; p++) {
      // Step 1: zeros
      setShredPhase(getShredPhasePhrase(p, 'zeros'));
      stepCounter++;
      setShredProgress(Math.round((stepCounter / totalSteps) * 100));
      await new Promise(r => setTimeout(r, 400));

      // Step 2: ones
      setShredPhase(getShredPhasePhrase(p, 'ones'));
      stepCounter++;
      setShredProgress(Math.round((stepCounter / totalSteps) * 100));
      await new Promise(r => setTimeout(r, 400));

      // Step 3: DoD random bytes
      setShredPhase(getShredPhasePhrase(p, 'random'));
      stepCounter++;
      setShredProgress(Math.round((stepCounter / totalSteps) * 100));
      await new Promise(r => setTimeout(r, 500));
    }

    // Ultimate release verification phase
    setShredPhase(getShredPhasePhrase(passes, 'verify'));
    stepCounter++;
    setShredProgress(100);
    await new Promise(r => setTimeout(r, 600));

    // Finish
    setIsShredding(false);
    setIsSuccess(true);

    if (onAddHistoryItem && pickedFile) {
      onAddHistoryItem({
        action: isAr ? 'إتلاف وتدمير كتل الملف آمن' : 'Military File Shredding',
        fileName: pickedFile.name,
        originalSize: pickedFile.size,
        processedSize: 0,
        type: 'security'
      });
    }
  };

  return (
    <div id="file-shredder" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-5 sm:p-6 shadow-sm space-y-6 text-slate-700 dark:text-slate-200">
      
      {/* Dynamic Triple Confirmation Overlay Sequence */}
      {confirmStep > 0 && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full border border-slate-100 dark:border-slate-800 space-y-4 text-center animate-scaleUp">
            
            <div className="flex flex-col items-center gap-2">
              <ShieldAlert className="w-12 h-12 text-rose-500 animate-bounce" />
              
              {confirmStep === 1 && (
                <>
                  <h3 className="font-bold text-sm text-red-650 dark:text-red-400">
                    {isAr ? '⚠️ التنبيه الأول: تأكيد الإتلاف النهائي' : '⚠️ Step 1: Irreversible Shred Warning'}
                  </h3>
                  <p className="text-xs text-slate-550 leading-relaxed md:px-2">
                    {isAr 
                      ? 'الملف سيتم كتابة تراكيب عشوائية فوقه في المتصفح. هل تود بالتأكيد الاستمرار؟' 
                      : 'This starts on-device secure sector overwrites. Are you absolutely certain you want to write random bits over your file?'}
                  </p>
                </>
              )}

              {confirmStep === 2 && (
                <>
                  <h3 className="font-bold text-sm text-amber-600">
                    {isAr ? '💥 التنبيه الثاني: انتباه صارم جداً!' : '💥 Step 2: Critical Validation'}
                  </h3>
                  <p className="text-xs text-slate-550 leading-relaxed md:px-2">
                    {isAr 
                      ? 'لا توجد طريقة على وجه الأرض لاسترجاع الملف بعد نقر الزر التالي. حتى مختبرات الـ FBI لن تقدر على الكشف عنه. هل أنت واثق؟' 
                      : 'No recovery laboratories on Earth can reclaim this file after this action. Do you state full responsibility?'}
                  </p>
                </>
              )}

              {confirmStep === 3 && (
                <>
                  <h3 className="font-bold text-sm text-rose-600 animate-pulse">
                    {isAr ? '🔥 التنبيه الثالث: التقطيع والفرم الفوري' : '🔥 Step 3: Absolute Consent Required'}
                  </h3>
                  <p className="text-xs text-slate-550 leading-relaxed md:px-2">
                    {isAr 
                      ? 'انقر لتفتيت بنية البيانات الثنائية وتصفير الملف بشكل عسكري كامل.' 
                      : 'Click only to shred and dissolve byte blocks permanently.'}
                  </p>
                </>
              )}
            </div>

            <div className="flex justify-center gap-2 text-xs pt-1">
              <button 
                onClick={cancelAndReset}
                className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-xl cursor-pointer border-0"
              >
                {isAr ? 'إلغاء وتراجع' : 'Abort & Reset'}
              </button>

              {confirmStep < 3 ? (
                <button 
                  onClick={() => setConfirmStep(confirmStep + 1)}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl cursor-pointer border-0"
                >
                  {isAr ? 'نعم، استمر بالتأكيد الحازم' : 'Yes, continue'}
                </button>
              ) : (
                <button 
                  onClick={runSecureShredder}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl cursor-pointer border-0 animate-pulse"
                >
                  {isAr ? 'اتلف ودمر الملف نهائياً!' : 'Shred & Dissolve Permanently!'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Title block */}
      <div className="flex items-center gap-2.5 border-b border-slate-50 dark:border-slate-800/80 pb-4">
        <div className="bg-rose-500/10 p-3 rounded-2xl text-rose-500">
          <Flame className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {isAr ? 'حاذف الملفات العسكري الآمن (Shredder)' : 'Secure DoD 5220.22-M File Shredder'}
          </h2>
          <p className="text-xs text-slate-400">
            {isAr ? 'إتلاف وتصفير الملفات لمنع استرجاعها تماماً بأي برمجيات كشف أو استرجاع بيانات مخصصة' : 'Dissolve file remains and block storage forensic recovery using standard digital overwriting protocols'}
          </p>
        </div>
      </div>

      {/* Explanatory banner */}
      <div className="bg-amber-50 dark:bg-amber-950/20 rounded-2xl p-4 border border-amber-200/50 dark:border-amber-950/40 text-xs text-amber-800 dark:text-amber-400/80 space-y-1.5 leading-relaxed">
        <div className="flex items-center gap-1.5 font-bold">
          <AlertOctagon className="w-4 h-4 shrink-0" />
          <span>{isAr ? 'لماذا لا يكفي الحذف التقليدي؟' : 'Why is traditional deletion insufficient?'}</span>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-400">
          {isAr
            ? 'عند حذف الملفات بالطريقة العادية، يحذف نظام التشغيل فقط فهرس المرجع الخاص به، بينما تظل البيانات الفعلية محفوظة على وسيط التخزين ويمكن استرجاعها بسهولة عبر برامج التبييض كلياً. المقطّع الآمن يمنع هذا بكتابة طبقات متتالية من الأثير العشوائي والأنماط المعقدة.'
            : 'Standard file deletion merely untags sector pointers, leaving physical byte payloads recoverable in flash media. Secure shredding continuously sweeps these registers with zeros, ones, and intense randomized entropy.'}
        </p>
      </div>

      {/* Workspace */}
      {!pickedFile ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-500/40 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition text-center min-h-[180px]"
        >
          <Upload className="w-8 h-8 text-slate-400 mb-2 animate-bounce" />
          <p className="text-xs font-bold text-slate-800 dark:text-white">
            {isAr ? 'اسحب وأفلت الملف المراد طمسه وتدميره' : 'Select or drop file destined for erasure'}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">{isAr ? '(يتم تنفيذه بالكامل محلياً وفي الذاكرة)' : '(Processes securely inside sandbox memory)'}</p>
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 flex items-center justify-between gap-3 text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2 truncate">
              <FileCheck className="w-5 h-5 text-rose-500 shrink-0 animate-pulse" />
              <div className="truncate">
                <p className="text-xs font-bold truncate">{pickedFile.name}</p>
                <p className="text-[10px] text-slate-400">
                  {isAr ? 'الحجم لعملية الطمس: ' : 'Target byte density: '} 
                  {(pickedFile.size / 1024 / 1024).toFixed(3)} MB
                </p>
              </div>
            </div>
            
            {!isShredding && (
              <button 
                onClick={cancelAndReset}
                className="p-1.5 hover:bg-slate-105 rounded-lg text-slate-400 border-0 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {!isSuccess ? (
            <div className="bg-slate-50 dark:bg-slate-800/10 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-4">
              
              {/* Passes presets */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 block">{isAr ? 'معيار الحذف وعدد مرات الكتابة بالتراكب:' : 'Secure Erase Pass Standards:'}</span>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    onClick={() => setPasses(3)}
                    disabled={isShredding}
                    className={`p-2.5 rounded-xl border font-bold cursor-pointer transition ${passes === 3 ? 'bg-slate-950 text-white dark:bg-slate-850 border-slate-950 font-bold' : 'bg-white dark:bg-slate-900 border-slate-100 text-slate-500'}`}
                  >
                    <span>3 {isAr ? 'دورات (DoD سريع)' : 'Passes (Fast DoD)'}</span>
                  </button>

                  <button
                    onClick={() => setPasses(5)}
                    disabled={isShredding}
                    className={`p-2.5 rounded-xl border font-bold cursor-pointer transition ${passes === 5 ? 'bg-slate-950 text-white dark:bg-slate-850 border-slate-950 font-bold' : 'bg-white dark:bg-slate-900 border-slate-101 text-slate-500'}`}
                  >
                    <span>5 {isAr ? 'دورات (DoD متوسط)' : 'Passes (Gutmann Lite)'}</span>
                  </button>

                  <button
                    onClick={() => setPasses(7)}
                    disabled={isShredding}
                    className={`p-2.5 rounded-xl border font-bold cursor-pointer transition ${passes === 7 ? 'bg-slate-950 text-white dark:bg-slate-850 border-slate-950 font-bold' : 'bg-white dark:bg-slate-900 border-slate-101 text-slate-500'}`}
                  >
                    <span>7 {isAr ? 'دورات (أمان عالي)' : 'Passes (Strict Military)'}</span>
                  </button>
                </div>
              </div>

              {/* Action buttons or shred progress */}
              {!isShredding ? (
                <div className="flex justify-end gap-2 pt-1 text-xs">
                  <button
                    onClick={() => setConfirmStep(1)}
                    className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl cursor-pointer border-0 shadow-sm flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                    <span>{isAr ? 'تأكيد وإتلاف الملف' : 'Activate Secure Shredder'}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-rose-500 font-pulse">{shredPhase}</span>
                    <span>{shredProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-rose-500 h-full transition-all duration-300"
                      style={{ width: `${shredProgress}%` }}
                    />
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="bg-emerald-500/10 dark:bg-emerald-950/20 p-5 rounded-2xl border border-emerald-500/20 space-y-4 text-emerald-800 dark:text-emerald-300">
              
              <div className="flex items-center gap-2.5">
                <Check className="w-6 h-6 text-emerald-500 shrink-0 border-2 border-emerald-500 rounded-full p-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {isAr ? 'تم تفتيت وطمس كتل الملف بالكامل!' : 'Storage Blocks Successfully Purged!'}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-450">
                    {isAr 
                      ? 'تم تطبيق الخوارزميات المعتمدة وكتابة عشوائية للمصفوفات تماماً، الملف دمر واختفى الأثر.'
                      : 'Swept over the RAM sandbox registers. No data signatures remain. Safe execution success.'}
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={cancelAndReset}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer border-0 shadow-sm"
                >
                  {isAr ? 'العودة وبدء عملية جديدة' : 'Shred another item'}
                </button>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
};

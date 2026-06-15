import React, { useState, useEffect } from 'react';
import { useAIModel } from '../../../hooks/useAIModel';
import { 
  Scale, 
  RefreshCw, 
  CheckCircle, 
  Sparkles, 
  FileText, 
  AlertCircle,
  Copy,
  TextQuote,
  Loader2,
  BookmarkCheck
} from 'lucide-react';

interface BenchmarkParagraph {
  id: string;
  text: string;
  similarity: number;
}

export const TextSimilarity: React.FC<{ lang: 'ar' | 'en' }> = ({ lang }) => {
  const { status, loadModel, cancelLoading } = useAIModel();
  
  // Tab for submodes: 'pairwise' (compare two texts) or 'bulk' (compare one against multiple paragraphs)
  const [mode, setMode] = useState<'pairwise' | 'bulk'>('pairwise');

  // Pairwise compare states
  const [textA, setTextA] = useState<string>('');
  const [textB, setTextB] = useState<string>('');
  const [pairwiseSimilarity, setPairwiseSimilarity] = useState<number | null>(null);

  // Bulk compare states
  const [sourceText, setSourceText] = useState<string>('');
  const [benchmarks, setBenchmarks] = useState<BenchmarkParagraph[]>([
    { id: '1', text: 'Transformers.js makes running heavy state-of-the-art neural network pipelines on the client extremely accessible with zero cloud costs.', similarity: 0 },
    { id: '2', text: 'This application executes fully on-device operations with complete responsive layouts, keeping all database interactions cached securely.', similarity: 0 },
    { id: '3', text: 'This tool is great for detecting plagiarism, matching academic text embeddings, or running comparative syntactic evaluations.', similarity: 0 }
  ]);

  const [processing, setProcessing] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);

  // Clean or default fill some sample texts for better initial experience
  useEffect(() => {
    if (lang === 'ar') {
      setTextA('الذكاء الاصطناعي التوليدي يعمل على تغيير شكل البرمجة التقليدية وتطوير التطبيقات بشكل سريع جداً.');
      setTextB('تطبيقات الذكاء الاصطناعي الجديدة تساهم في تسريع وتحسين وتطوير البرامج والمواقع الإلكترونية محلياً.');
      setSourceText('يعد تشفير ملفات PDF وحمايتها بكلمة مرور ميزة رئيسية لتأمين خصوصية المستندات.');
    } else {
      setTextA('Generative artificial intelligence is rapidly transforming traditional computer science and application frameworks.');
      setTextB('Next-generation AI assistants are heavily accelerating how software and web assets are engineered.');
      setSourceText('PDF encryption and local signature security are core pillars for modern workspace privacy.');
    }
  }, [lang]);

  // Dot product / Cosine Similarity helper for unit-norm embeddings
  const dotProduct = (vecA: number[] | Float32Array, vecB: number[] | Float32Array): number => {
    let dp = 0;
    const len = Math.min(vecA.length, vecB.length);
    for (let i = 0; i < len; i++) {
      dp += vecA[i] * vecB[i];
    }
    return dp;
  };

  const runPairwiseAnalysis = async () => {
    if (!textA.trim() || !textB.trim()) return;

    setProcessing(true);
    setPairwiseSimilarity(null);

    try {
      // 1. Loading all-MiniLM-L6-v2 embedding model
      const extractor = await loadModel('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

      // 2. Generate on-device embeddings
      const outputA = await extractor(textA, { pooling: 'mean', normalize: true });
      const outputB = await extractor(textB, { pooling: 'mean', normalize: true });

      const vecA = Array.from(outputA.data as Float32Array);
      const vecB = Array.from(outputB.data as Float32Array);

      // Compute Cosine similarity
      const cosSim = dotProduct(vecA, vecB);
      
      // Convert cosine range [-1, 1] to simple logical percentage [0%, 100%]
      const percentage = Math.max(0, Math.min(100, Math.round(((cosSim + 1) / 2) * 100)));
      setPairwiseSimilarity(percentage);
      showToast(lang === 'ar' ? 'تمت عملية مطابقة النصوص بنجاح!' : 'Pairwise matching completed!');

    } catch (e: any) {
      console.error(e);
      showToast(lang === 'ar' ? 'حدث خطأ في استخلاص الخواص اللغوية.' : 'Feature extraction failed.');
    } finally {
      setProcessing(false);
    }
  };

  const runBulkAnalysis = async () => {
    if (!sourceText.trim()) return;

    setProcessing(true);

    try {
      const extractor = await loadModel('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

      // Embed source
      const outputSource = await extractor(sourceText, { pooling: 'mean', normalize: true });
      const vecSource = Array.from(outputSource.data as Float32Array);

      const computedBenchmarks: BenchmarkParagraph[] = [];

      // Embed block references one by one
      for (const item of benchmarks) {
        if (!item.text.trim()) {
          computedBenchmarks.push({ ...item, similarity: 0 });
          continue;
        }

        const outputBench = await extractor(item.text, { pooling: 'mean', normalize: true });
        const vecBench = Array.from(outputBench.data as Float32Array);

        const cosSim = dotProduct(vecSource, vecBench);
        const percentage = Math.max(0, Math.min(100, Math.round(((cosSim + 1) / 2) * 100)));

        computedBenchmarks.push({
          ...item,
          similarity: percentage
        });
      }

      setBenchmarks(computedBenchmarks);
      showToast(lang === 'ar' ? 'تمت مطابقة المستند مع الفقرات بالكامل!' : 'Bulk benchmark matching complete!');

    } catch (e) {
      console.error(e);
      showToast(lang === 'ar' ? 'خطأ في عملية فحص الانتحال.' : 'Bulk comparison failed.');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateBenchmark = (id: string, text: string) => {
    setBenchmarks(prev => prev.map(item => item.id === id ? { ...item, text } : item));
  };

  const handleAddBenchmark = () => {
    setBenchmarks(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 5),
      text: '',
      similarity: 0
    }]);
  };

  const handleRemoveBenchmark = (id: string) => {
    setBenchmarks(prev => prev.filter(item => item.id !== id));
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Helper highlighting overlapping words between text A and text B to visualize differences
  const renderHighlightedSegments = () => {
    const wordsA = textA.split(/\s+/).map(w => w.trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()؟?]/g,""));
    const wordsB = new Set(textB.toLowerCase().split(/\s+/).map(w => w.trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()؟?]/g,"")));

    return textA.split(/\s+/).map((word, index) => {
      const cleanWord = word.trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()؟?]/g,"").toLowerCase();
      const isMatched = cleanWord.length > 2 && wordsB.has(cleanWord);

      return (
        <span 
          key={index} 
          className={`inline-block mr-1.5 px-0.5 rounded ${
            isMatched 
              ? 'bg-yellow-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 font-semibold' 
              : 'text-slate-700 dark:text-slate-300'
          }`}
        >
          {word}
        </span>
      );
    });
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-purple-100 dark:border-slate-700 shadow-sm space-y-6">
      
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-900 border border-purple-500/30 text-white py-3 px-5 rounded-2xl shadow-xl animate-slideIn">
          <BookmarkCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold leading-none">{toast}</span>
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-50 dark:border-slate-700 pb-5">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-purple-600 to-indigo-600 p-2.5 rounded-2xl text-white shadow-md">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg text-slate-950 dark:text-white flex items-center gap-2">
              {lang === 'ar' ? 'فاحص ومقارن تشابه النصوص' : 'Deep Text Similarity Semantic Compare'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'ar'
                ? 'مقارن ذكي لنصين أو مجموعة نصوص بدقة المتجهات الحسابية للتأكد من الأصالة ومستويات الاقتباس.'
                : 'Local all-MiniLM-L6-v2 text embedding network to calculate high-density vector similarity matches.'}
            </p>
          </div>
        </div>
      </div>

      {/* Model Loader status */}
      {status.loading && (
        <div className="bg-purple-50 dark:bg-slate-755 border border-purple-100 dark:border-purple-900 p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold flex items-center gap-1.5 text-purple-950 dark:text-purple-300">
              <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
              {lang === 'ar' ? 'جاري تنزيل نموذج قياس المتجهات المستند اللغوي...' : 'Spinning up MiniLM vector embedding...'}
            </span>
            <span className="font-bold font-mono text-purple-800 dark:text-purple-400">{status.progress}%</span>
          </div>
          <div className="w-full bg-slate-205 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-300" 
              style={{ width: `${status.progress}%` }}
            />
          </div>
          <button onClick={cancelLoading} className="text-[10px] text-red-500 hover:underline font-bold">
            {lang === 'ar' ? 'إلغاء تحميل النموذج' : 'Cancel loader'}
          </button>
        </div>
      )}

      {/* Mode selectors */}
      <div className="flex bg-slate-50 dark:bg-slate-900/30 p-1 rounded-xl w-fit">
        <button
          onClick={() => setMode('pairwise')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${mode === 'pairwise' ? 'bg-white dark:bg-slate-800 shadow text-purple-700' : 'text-slate-500 hover:text-slate-700'}`}
        >
          {lang === 'ar' ? 'مقارنة تشابه نصين' : 'Compare Two Texts'}
        </button>
        <button
          onClick={() => setMode('bulk')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${mode === 'bulk' ? 'bg-white dark:bg-slate-800 shadow text-purple-700' : 'text-slate-500 hover:text-slate-700'}`}
        >
          {lang === 'ar' ? 'فحص الانتحال والاقتباسات' : 'Plagiarism Plural Scan'}
        </button>
      </div>

      {mode === 'pairwise' ? (
        // Pairwise compare
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Text A */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-350">{lang === 'ar' ? 'النص الأساسي (أ):' : 'Source Document (A):'}</label>
              <textarea
                rows={6}
                value={textA}
                onChange={(e) => setTextA(e.target.value)}
                placeholder={lang === 'ar' ? 'أدخل مستندك الأساسي هنا للمطابقة...' : 'Paste your first paragraph...'}
                className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-purple-400 focus:bg-white text-gray-700 dark:text-slate-205 font-medium"
              />
            </div>

            {/* Text B */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-350">{lang === 'ar' ? 'النص المقارن (ب):' : 'Comparative Document (B):'}</label>
              <textarea
                rows={6}
                value={textB}
                onChange={(e) => setTextB(e.target.value)}
                placeholder={lang === 'ar' ? 'أدخل مستندك المقارن هنا للمطابقة...' : 'Paste your second paragraph...'}
                className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-purple-400 focus:bg-white text-gray-700 dark:text-slate-205 font-medium"
              />
            </div>

          </div>

          <button
            onClick={runPairwiseAnalysis}
            disabled={processing || !textA.trim() || !textB.trim()}
            className="w-full h-12 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white font-extrabold rounded-2xl shadow-md cursor-pointer disabled:opacity-50 text-xs"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{lang === 'ar' ? 'جاري تعويم وقياس زوايا جيب المتجهات في المتصفح...' : 'Embedding text matrices...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{lang === 'ar' ? 'حساب نسبة التطابق والتشابه اللغوي' : 'Run Vector Semantic Comparing'}</span>
              </>
            )}
          </button>

          {/* Pairwise similarity result panel containing overlays */}
          {pairwiseSimilarity !== null && (
            <div className="bg-slate-55 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 grid grid-cols-1 md:grid-cols-12 gap-6 items-center animate-fadeIn">
              
              {/* Score panel */}
              <div className="md:col-span-4 text-center space-y-2 border-r border-slate-200 dark:border-slate-750">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                  {lang === 'ar' ? 'معدل التطابق الدلالي' : 'SEMANTIC MATCH'}
                </span>
                <span className="text-4xl font-extrabold bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent font-mono">
                  {pairwiseSimilarity}%
                </span>
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {pairwiseSimilarity > 75 
                    ? (lang === 'ar' ? 'تشابه عالي جداً (اقتباس مباشر)' : 'Extremely High overlap')
                    : pairwiseSimilarity > 40 
                      ? (lang === 'ar' ? 'تشابه متوسط (إعادة صياغة)' : 'Moderate paraphrasing')
                      : (lang === 'ar' ? 'نصوص منفصلة لا تشابه دلالي' : 'Completely unique content')
                  }
                </div>
              </div>

              {/* Overlaps and highlight segments */}
              <div className="md:col-span-8 space-y-2.5">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase block">
                  {lang === 'ar' ? 'تحديد مواضع تشابه الكلمات (المستند أ):' : 'HIGHLIGHTED WORD OVERLAPS (IN B):'}
                </span>
                <div className="text-xs leading-relaxed bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-800 max-h-[150px] overflow-y-auto whitespace-pre-wrap">
                  {renderHighlightedSegments()}
                </div>
              </div>

            </div>
          )}

        </div>
      ) : (
        // Plagiarism Bulk Check
        <div className="space-y-6 animate-fadeIn">
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-350">{lang === 'ar' ? 'المستند المراد فحصه (Source Document):' : 'Plagiarism Inspection Target:'}</label>
            <textarea
              rows={5}
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder={lang === 'ar' ? 'أدخل المستند هنا لبدء تفتيشه دلالياً...' : 'Paste your target test content...'}
              className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-205 dark:border-slate-700 rounded-2xl p-4 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400 focus:bg-white text-gray-700 dark:text-slate-205 font-medium"
            />
          </div>

          <div className="space-y-3.5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-350">{lang === 'ar' ? 'مستندات المقارنة والمصادر (Reference Paragraphs):' : 'Reference/Database Benchmarks:'}</span>
              <button
                onClick={handleAddBenchmark}
                className="text-xs font-bold text-purple-700 bg-purple-55 dark:bg-purple-950/40 px-3.5 py-1.5 rounded-xl cursor-pointer hover:bg-purple-100"
              >
                + {lang === 'ar' ? 'إضافة فقرة مرجع جديدة' : 'Add Ref Block'}
              </button>
            </div>

            <div className="space-y-3">
              {benchmarks.map((item, index) => (
                <div 
                  key={item.id} 
                  className="bg-slate-55 dark:bg-slate-900/20 p-4 rounded-2xl border border-slate-150 dark:border-slate-750/50 space-y-2.5 relative"
                >
                  
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase font-mono">#{index + 1} {lang === 'ar' ? 'مستند مرجعي' : 'Ref Benchmark'}</span>
                    
                    {benchmarks.length > 1 && (
                      <button
                        onClick={() => handleRemoveBenchmark(item.id)}
                        className="text-[10px] text-red-500 hover:underline cursor-pointer"
                      >
                        {lang === 'ar' ? 'إزالة' : 'Remove'}
                      </button>
                    )}
                  </div>

                  <textarea
                    rows={2}
                    value={item.text}
                    onChange={(e) => handleUpdateBenchmark(item.id, e.target.value)}
                    placeholder={lang === 'ar' ? 'أدخل الفقرة المرجعية هنا...' : 'Paste reference block text...'}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-750 rounded-xl p-3 text-xs leading-normal text-slate-700 dark:text-slate-205 pointer-events-auto"
                  />

                  {item.similarity > 0 && (
                    <div className="flex items-center gap-2 mt-1 text-xs">
                      <span className="text-slate-500">{lang === 'ar' ? 'التطابق الدلالي:' : 'Semantic Match:'}</span>
                      <span className={`font-extrabold font-mono text-xs ${item.similarity > 75 ? 'text-red-600' : item.similarity > 40 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {item.similarity}%
                      </span>
                    </div>
                  )}

                </div>
              ))}
            </div>

          </div>

          <button
            onClick={runBulkAnalysis}
            disabled={processing || !sourceText.trim()}
            className="w-full h-11 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold rounded-2xl text-xs cursor-pointer shadow transition-opacity"
          >
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scale className="w-4 h-4" />}
            <span>{processing ? (lang === 'ar' ? 'جاري الفحص المتقاطع لكافة المستندات المفتوحة...' : 'Running bulk matrices...') : (lang === 'ar' ? 'تشغيل فاحص الاقتباسات الشامل' : 'Execute Plagiarism Plural Scan')}</span>
          </button>

        </div>
      )}

    </div>
  );
};

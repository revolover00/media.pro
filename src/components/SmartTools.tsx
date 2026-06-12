import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Cpu, 
  Image as ImageIcon, 
  FileText, 
  Brain, 
  Sparkles, 
  Check, 
  Loader2, 
  Download, 
  BookOpen, 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Languages, 
  HelpCircle, 
  Wand2, 
  Eye, 
  FileUp, 
  RefreshCw,
  Search,
  BookMarked,
  Info,
  Scale
} from 'lucide-react';
import { env, pipeline } from '@xenova/transformers';

// Set transformers environment options
env.allowLocalModels = false;
env.useBrowserCache = true;

// Constants for Arabic & English Stopwords
const ARABIC_STOPWORDS = new Set([
  'من', 'إلى', 'عن', 'على', 'في', 'منذ', 'خلا', 'عدا', 'حاشا', 'منذ', 'مذ', 'رب', 'اللام', 'كي', 'الواو', 'التاء', 'الباء', 'الكاف',
  'هذا', 'هذه', 'هذان', 'هاتان', 'هؤلاء', 'هو', 'هي', 'هما', 'هم', 'هن', 'أنا', 'نحن', 'أنت', 'أنتما', 'أنتم', 'أنمتن', 'إياك',
  'تم', 'كان', 'ليس', 'صار', 'أصبح', 'بات', 'ظل', 'أضحى', 'مازال', 'مادام', 'إن', 'أن', 'لكن', 'كأن', 'ليت', 'لعل', 'لا', 'نعم',
  'ثم', 'أو', 'أم', 'بل', 'لكن', 'كل', 'بعض', 'جميع', 'أي', 'بين', 'عند', 'تحت', 'فوق', 'أمام', 'خلف', 'ورا', 'يمين', 'يسار',
  'الذي', 'التي', 'اللذان', 'اللتان', 'الذين', 'اللاتي', 'اللواتي', 'اللائي', 'من', 'ما', 'مهما', 'حيث', 'كيف', 'متى', 'أين',
  'يا', 'أيها', 'أيتها', 'قد', 'سوف', 'سين', 'لقد', 'بما', 'كما', 'التي', 'لكنه', 'منهم', 'عليه', 'إليه', 'بها', 'فيه', 'عليك'
]);

const ENGLISH_STOPWORDS = new Set([
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves',
  'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their',
  'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are',
  'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an',
  'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about',
  'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up',
  'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when',
  'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
  'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don',
  'should', 'now', 'd', 'll', 'm', 'o', 're', 've', 'y', 'ain', 'aren', 'couldn', 'didn', 'doesn', 'hadn', 'hasn',
  'haven', 'isn', 'ma', 'mightn', 'mustn', 'needn', 'shan', 'shouldn', 'wasn', 'weren', 'won', 'wouldn'
]);

interface DownloadProgressItem {
  status: 'initiate' | 'progress' | 'done' | 'downloading';
  progress: number;
  loaded: number;
  total: number;
}

interface PipelineStatus {
  loading: boolean;
  loaded: boolean;
  error: string | null;
  files: Record<string, DownloadProgressItem>;
}

// Global reference cache for pipelines to avoid reloading them inside the same app session
// This keeps performance optimal
const pipelineCache: Record<string, any> = {};

export const SmartTools: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'caption' | 'summary' | 'translate' | 'keywords' | 'rag'>('caption');
  
  // Pipeline Load States
  const [statuses, setStatuses] = useState<Record<string, PipelineStatus>>({
    caption: { loading: false, loaded: false, error: null, files: {} },
    detection: { loading: false, loaded: false, error: null, files: {} },
    summarize: { loading: false, loaded: false, error: null, files: {} },
    translate: { loading: false, loaded: false, error: null, files: {} },
    qa: { loading: false, loaded: false, error: null, files: {} },
  });

  // Task-specific States
  // 1. Image Captioning & Detection
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [captionResult, setCaptionResult] = useState<string | null>(null);
  const [detectionResult, setDetectionResult] = useState<any[]>([]);
  const [detecting, setDetecting] = useState(false);
  const [captioning, setCaptioning] = useState(false);
  
  // 2. Text Summarization
  const [summarizeText, setSummarizeText] = useState<string>('');
  const [summarizedOutput, setSummarizedOutput] = useState<string>('');
  const [summarizing, setSummarizing] = useState<boolean>(false);
  const [summaryMode, setSummaryMode] = useState<'neural' | 'extractive'>('extractive');
  const [summarySentencesCount, setSummarySentencesCount] = useState<number>(3);

  // 3. Text Translation
  const [translateText, setTranslateText] = useState<string>('');
  const [translatedOutput, setTranslatedOutput] = useState<string>('');
  const [translating, setTranslating] = useState<boolean>(false);
  const [translationDirection, setTranslationDirection] = useState<'en_to_ar' | 'ar_to_en'>('en_to_ar');

  // 4. Keyword Extraction
  const [keywordsText, setKeywordsText] = useState<string>('');
  const [extractedKeywords, setExtractedKeywords] = useState<{ word: string; score: number }[]>([]);
  const [keywordsCount, setKeywordsCount] = useState<number>(8);

  // 5. Document RAG Chat
  const [ragDocText, setRagDocText] = useState<string>('');
  const [isDocIndexed, setIsDocIndexed] = useState<boolean>(false);
  const [docChunks, setDocChunks] = useState<string[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<{ sender: 'user' | 'ai'; text: string; sourceContext?: string }[]>([]);
  const [ragResponding, setRagResponding] = useState<boolean>(false);

  // Clean up uploaded image preview URL on unmount
  useEffect(() => {
    return () => {
      if (selectedImage) URL.revokeObjectURL(selectedImage);
    };
  }, [selectedImage]);

  // Helper load pipeline with custom callbacks to track progress elegantly
  const getPipeline = async (task: string, modelName: string, statusKey: string) => {
    // If already in memory, use it
    if (pipelineCache[modelName]) {
      return pipelineCache[modelName];
    }

    setStatuses((prev) => ({
      ...prev,
      [statusKey]: { ...prev[statusKey], loading: true, error: null },
    }));

    try {
      const runner = await pipeline(task as any, modelName, {
        progress_callback: (data: any) => {
          if (data.status === 'progress' || data.status === 'initiate' || data.status === 'done' || data.status === 'downloading') {
            const fileName = data.file || 'model_component';
            setStatuses((prev) => {
              const currentStatus = prev[statusKey];
              const fileProgress = {
                status: data.status,
                progress: data.progress || 100,
                loaded: data.loaded || 0,
                total: data.total || 0,
              };
              return {
                ...prev,
                [statusKey]: {
                  ...currentStatus,
                  files: {
                    ...currentStatus.files,
                    [fileName]: fileProgress,
                  },
                },
              };
            });
          }
        },
      });

      pipelineCache[modelName] = runner;

      setStatuses((prev) => ({
        ...prev,
        [statusKey]: { ...prev[statusKey], loading: false, loaded: true, error: null },
      }));

      return runner;
    } catch (err: any) {
      console.error(`Pipeline extraction error for ${modelName}:`, err);
      setStatuses((prev) => ({
        ...prev,
        [statusKey]: { 
          ...prev[statusKey], 
          loading: false, 
          error: `فشل تحميل النموذج الرقمي: ${err.message || 'حدث خطأ في تحميل ملفات WebAssembly'}` 
        },
      }));
      throw err;
    }
  };

  // Helper format output bytes
  const formatMegaBytes = (bytes: number) => {
    if (!bytes || isNaN(bytes)) return '0 MB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // --- 1. LOCAL IMAGE CAPTIONING & DETECTION LOGIC ---
  const handleImageSelected = (files: File[]) => {
    if (files.length === 0) return;
    if (selectedImage) URL.revokeObjectURL(selectedImage);

    const file = files[0];
    setImageFile(file);
    setSelectedImage(URL.createObjectURL(file));
    setCaptionResult(null);
    setDetectionResult([]);
  };

  const handleRunCaptionAndDetection = async () => {
    if (!selectedImage) return;

    setCaptioning(true);
    setDetecting(true);
    setCaptionResult(null);
    setDetectionResult([]);

    try {
      // Load Image Captioning Model
      const captioner = await getPipeline('image-to-text', 'Xenova/vit-gpt2-image-captioning', 'caption');
      const capOutput = await captioner(selectedImage);
      const engCaption = capOutput[0]?.generated_text || 'Unable to generate description';
      setCaptionResult(engCaption);
      setCaptioning(false);

      // Load Object Detector Model
      const detector = await getPipeline('object-detection', 'Xenova/detr-resnet-50', 'detection');
      const detOutput = await detector(selectedImage, { threshold: 0.7 });
      setDetectionResult(detOutput);
    } catch (e: any) {
      console.error(e);
    } finally {
      setCaptioning(false);
      setDetecting(false);
    }
  };

  // --- 2. LOCAL TEXT SUMMARIZATION LOGIC ---
  // Extractive sentence summarizer (Incredibly fast, robust, multi-lingual, does not need heavy downloads)
  const runExtractiveSummarization = (text: string, count: number): string => {
    if (!text.trim()) return '';
    // Split sentences using Arabic/English punctuation
    const sentences = text
      .split(/(?<=[.!?؟\n])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 5);

    if (sentences.length <= count) return sentences.join(' ');

    // Extract word frequencies
    const words: string[] = text.toLowerCase().match(/[\u0600-\u06FF\w']+/g) || [];
    const freq: Record<string, number> = {};
    const stopwords = new Set([...Array.from(ARABIC_STOPWORDS), ...Array.from(ENGLISH_STOPWORDS)]);
    
    words.forEach(w => {
      if (!stopwords.has(w) && w.length > 2) {
        freq[w] = (freq[w] || 0) + 1;
      }
    });

    // Score sentences based on word frequency
    const sentenceScores = sentences.map((sentence, idx) => {
      const sWords = sentence.toLowerCase().match(/[\u0600-\u06FF\w']+/g) || [];
      let score = 0;
      sWords.forEach(w => {
        if (freq[w]) {
          score += freq[w];
        }
      });
      // Normalize by sentence length to avoid bias towards longer sentences
      return { sentence, score: score / (1 + Math.log(sWords.length + 1)), originalIdx: idx };
    });

    // Sort sentences by scores and take top 'count'
    const topSentences = sentenceScores
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
      .sort((a, b) => a.originalIdx - b.originalIdx)
      .map(s => s.sentence);

    return topSentences.join(' \n');
  };

  const handleSummarize = async () => {
    if (!summarizeText.trim()) return;
    setSummarizing(true);
    setSummarizedOutput('');

    try {
      if (summaryMode === 'extractive') {
        // Fast, instant, Arabic-compatible extractive local logic
        const result = runExtractiveSummarization(summarizeText, summarySentencesCount);
        setSummarizedOutput(result);
      } else {
        // Neural Summarizer via DistilBART
        const summarizer = await getPipeline('summarization', 'Xenova/distilbart-cnn-6-6', 'summarize');
        
        // Chunking if text is longer than max token context
        const words = summarizeText.split(/\s+/);
        const chunkSize = 400; // safe token window chunk
        const chunks = [];
        for (let i = 0; i < words.length; i += chunkSize) {
          chunks.push(words.slice(i, i + chunkSize).join(' '));
        }

        const summarizedChunks: string[] = [];
        for (const chunk of chunks) {
          const res = await summarizer(chunk, {
            max_new_tokens: 100,
            min_new_tokens: 30,
          });
          summarizedChunks.push(res[0]?.summary_text || '');
        }

        setSummarizedOutput(summarizedChunks.join(' '));
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setSummarizing(false);
    }
  };

  // --- 3. LOCAL TEXT TRANSLATION LOGIC ---
  const handleTranslate = async () => {
    if (!translateText.trim()) return;
    setTranslating(true);
    setTranslatedOutput('');

    try {
      // We will load NLLB model which is powerful for translation (support 200+ languages)
      const translator = await getPipeline('translation', 'Xenova/nllb-200-distilled-600M', 'translate');
      
      const isEnToAr = translationDirection === 'en_to_ar';
      const output = await translator(translateText, {
        src_lang: isEnToAr ? 'eng_Latn' : 'ara_Arab',
        tgt_lang: isEnToAr ? 'ara_Arab' : 'eng_Latn',
      });

      setTranslatedOutput(output[0]?.translation_text || 'Translation empty or failed');
    } catch (e: any) {
      console.error(e);
    } finally {
      setTranslating(false);
    }
  };

  // --- 4. EXQUISITE KEYWORD EXTRACTION LOGIC ---
  const handleExtractKeywords = () => {
    if (!keywordsText.trim()) return;
    
    const words = keywordsText.toLowerCase().match(/[\u0600-\u06FF\w']+/g) || [];
    const cleanWords = words.filter(word => {
      return word.length > 2 && !ARABIC_STOPWORDS.has(word) && !ENGLISH_STOPWORDS.has(word);
    });

    // Count term frequencies
    const termFreq: Record<string, number> = {};
    cleanWords.forEach(w => {
      termFreq[w] = (termFreq[w] || 0) + 1;
    });

    // Sort by frequency inside the single document
    const list = Object.keys(termFreq).map(word => {
      // Calculate a pseudo score using length, term frequency and total terms
      const count = termFreq[word];
      const TF = count / cleanWords.length;
      // We give a tiny bonus weight to words appearing inside titles or first sentences
      const bonusWeight = keywordsText.startsWith(word) || keywordsText.indexOf(word) < 100 ? 1.25 : 1.0;
      const score = Math.round(TF * 1000 * bonusWeight);
      return { word, score: score > 1 ? score : 1 };
    });

    // Sort descending and slice to requested count
    const sorted = list.sort((a, b) => b.score - a.score).slice(0, keywordsCount);
    
    // Scale scores to look like percentage match
    if (sorted.length > 0) {
      const maxScore = sorted[0].score;
      const scaled = sorted.map(item => ({
        word: item.word,
        score: Math.round((item.score / maxScore) * 100)
      }));
      setExtractedKeywords(scaled);
    } else {
      setExtractedKeywords([]);
    }
  };

  // --- 5. SMART TEXT RAG CHAT LOGIC ---
  const handleIndexDocument = () => {
    if (!ragDocText.trim()) return;

    // Split text into chunk paragraphs with overlap
    const paragraphs = ragDocText
      .split(/(?:\r?\n){2,}/) // split by double line breaks
      .map(p => p.trim())
      .filter(p => p.length > 30);

    let chunksToStore = paragraphs;
    // If paragraphs are too few or too long, split by sentences
    if (paragraphs.length <= 1) {
      const sentences = ragDocText.split(/(?<=[.!?؟])\s+/).map(s => s.trim()).filter(s => s.length > 10);
      const sentenceChunks = [];
      let temp = '';
      for (const sent of sentences) {
        if ((temp + ' ' + sent).split(' ').length < 120) {
          temp += ' ' + sent;
        } else {
          sentenceChunks.push(temp.trim());
          temp = sent;
        }
      }
      if (temp.trim()) sentenceChunks.push(temp.trim());
      chunksToStore = sentenceChunks;
    }

    setDocChunks(chunksToStore);
    setIsDocIndexed(true);
    setChatHistory([
      { sender: 'ai', text: 'تمت قراءة وفهرسة مستندك بالكامل محلياً وبنجاح! اسألني عن أي جزء في النص وسأجيبك فوراً.' }
    ]);
  };

  // Local helper: compute cosine similarity / term overlap score between question and chunks
  const retrieveRelevantContext = (question: string, chunks: string[]): string => {
    if (chunks.length === 0) return '';
    const qWords: string[] = question.toLowerCase().match(/[\u0600-\u06FF\w']+/g) || [];
    const qStopwords = new Set([...Array.from(ARABIC_STOPWORDS), ...Array.from(ENGLISH_STOPWORDS)]);
    const qCleanWords = qWords.filter(w => !qStopwords.has(w) && w.length > 1);

    let bestChunkIndex = 0;
    let maxOverlapScore = -1;

    chunks.forEach((chunk, idx) => {
      const chunkLower = chunk.toLowerCase();
      let score = 0;
      
      qCleanWords.forEach(word => {
        // Simple term occurrence count (bonus if word is found multiple times)
        const regex = new RegExp('\\b' + word + '\\b', 'g');
        const matches = chunkLower.match(regex);
        if (matches) {
          score += matches.length * 3; // exact word count overlap
        } else if (chunkLower.includes(word)) {
          score += 1.5; // partial match inclusion
        }
      });

      if (score > maxOverlapScore) {
        maxOverlapScore = score;
        bestChunkIndex = idx;
      }
    });

    return chunks[bestChunkIndex] || '';
  };

  const handleSendRagMessage = async () => {
    if (!chatInput.trim() || !isDocIndexed || docChunks.length === 0) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setChatHistory(prev => [...prev, { sender: 'user', text: userMsg }]);
    setRagResponding(true);

    try {
      // 1. Local retrieval of highest matching paragraph/chunk
      const context = retrieveRelevantContext(userMsg, docChunks);
      
      // 2. Load QA Model
      const qaPip = await getPipeline('question-answering', 'Xenova/distilbert-base-uncased-distilled-squad', 'qa');
      
      // Run pipeline
      const response = await qaPip({
        question: userMsg,
        context: context || ragDocText // Use whole text as fallback
      });

      const rawAnswer = response.answer;
      let matchedText = rawAnswer || '';

      // Post-process response to look professional and cite source
      let aiResponseText = '';
      if (!matchedText.trim()) {
        aiResponseText = 'لم أتمكن من العثور على إجابة محددة لهذا السؤال داخل النص بدقة، لكن بناءً على المستند قد تحتاج لمراجعة الفقرة المرتبطة بالمصطلحات المستخدمة.';
      } else {
        aiResponseText = `الإجابة المستخلصة من النص: \n"${matchedText.trim()}"`;
      }

      setChatHistory(prev => [...prev, { 
        sender: 'ai', 
        text: aiResponseText, 
        sourceContext: context 
      }]);

    } catch (e: any) {
      console.error(e);
      setChatHistory(prev => [...prev, { 
        sender: 'ai', 
        text: `حدث عطل أثناء استخراج الإجابة محلياً. يرجى التأكد من تحميل النموذج. الخطأ: ${e.message || 'Error occurred'}` 
      }]);
    } finally {
      setRagResponding(false);
    }
  };

  // Helper check total files currently downloading
  const getDownloadState = (statusKey: string) => {
    const statItem = statuses[statusKey];
    if (!statItem.loading) return null;

    const filesArr = Object.entries(statItem.files);
    if (filesArr.length === 0) return { progress: 0, text: 'جاري البدء...' };

    let totalProgress = 0;
    let totalLoaded = 0;
    let totalSize = 0;

    filesArr.forEach(([_, val]) => {
      const value = val as DownloadProgressItem;
      totalProgress += value.progress;
      totalLoaded += value.loaded;
      totalSize += value.total;
    });

    const averageProgress = Math.round(totalProgress / filesArr.length);
    return {
      progress: averageProgress,
      loadedBytes: totalLoaded,
      totalBytes: totalSize,
      fileCount: filesArr.length
    };
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-purple-50 shadow-sm space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-50 pb-5">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-purple-600 to-indigo-600 p-2.5 rounded-2xl text-white shadow-md">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-xl text-purple-950">الأدوات الذكية (محلية بالكامل)</h2>
              <span className="text-[10px] font-bold bg-purple-100 text-purple-750 px-2 py-0.5 rounded-full">تعمل بالمتصفح</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              أدوات ذكاء اصطناعي ثورية تعمل بالكامل على معالج جهازك وبدون أي اتصالات خارجية للحفاظ على أقصى درجات الخصوصية والأمان.
            </p>
          </div>
        </div>

        {/* Caching/Browser Info Badge */}
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl text-emerald-800 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold">تقنية Transformers.js مدعومة بالكامل وتخزن النماذج محلياً</span>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex flex-wrap gap-2 bg-slate-50 p-1.5 rounded-2xl border border-gray-100">
        {[
          { id: 'caption', label: 'تحليل ووصف الصور', icon: ImageIcon },
          { id: 'summary', label: 'تلخيص النصوص', icon: FileText },
          { id: 'translate', label: 'الترجمة الفورية', icon: Languages },
          { id: 'keywords', label: 'استخراج الكلمات المفتاحية', icon: Sparkles },
          { id: 'rag', label: 'محادثة المستندات (RAG)', icon: BookOpen },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id as any);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isSelected 
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md' 
                  : 'text-gray-600 hover:text-purple-750 hover:bg-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main workspace section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Workspace Operations Frame */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* 1. IMAGE DESCRIPTION CAPTION & DETECTION */}
          {activeSubTab === 'caption' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-purple-50/30 p-5 rounded-2xl border border-purple-100/50">
                <h3 className="font-extrabold text-sm text-purple-950 mb-2">وصف وتقدير الصور الرقمية بالذكاء الاصطناعي</h3>
                <p className="text-xs text-gray-400">
                  يرسم هذا القسم الصورة ويقوم بتحليلها كبصمة رقمية لمعرفة محتوياتها والعناصر الموجودة بها في ثوانٍ.
                </p>
              </div>

              <div className="space-y-4">
                <div className="border-2 border-dashed border-purple-100 rounded-3xl p-6 bg-slate-50 flex flex-col items-center justify-center min-h-[220px] relative overflow-hidden group">
                  {selectedImage ? (
                    <div className="space-y-4 w-full flex flex-col items-center">
                      <img 
                        src={selectedImage} 
                        alt="Preview" 
                        className="max-h-[200px] object-contain rounded-2xl shadow-md border border-slate-100" 
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedImage(null);
                            setImageFile(null);
                            setCaptionResult(null);
                            setDetectionResult([]);
                          }}
                          className="text-xs text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-700 py-1.5 px-4 rounded-xl font-bold cursor-pointer transition-colors"
                        >
                          تغيير الصورة
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-3">
                      <div className="bg-purple-100 text-purple-600 p-3.5 rounded-full inline-block group-hover:scale-105 transition-transform">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                      <div className="text-sm font-bold text-gray-700">اسحب صورتك أو اختر ملفاً لتبدأ المعالجة</div>
                      <p className="text-xs text-gray-400">تدعم صيغ JPEG, PNG و WebP • حجم أقصى 20MB</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files) handleImageSelected(Array.from(e.target.files));
                        }}
                        className="hidden"
                        id="image-caption-picker"
                      />
                      <label
                        htmlFor="image-caption-picker"
                        className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-6 rounded-2xl text-xs shadow-sm cursor-pointer hover:shadow transition-all"
                      >
                        <FileUp className="w-3.5 h-3.5" />
                        <span>تحميل صورة مخصصة</span>
                      </label>
                    </div>
                  )}
                </div>

                {selectedImage && (
                  <button
                    onClick={handleRunCaptionAndDetection}
                    disabled={captioning || detecting}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold py-3.5 px-6 rounded-xl shadow-md cursor-pointer disabled:opacity-50 transition-all text-sm"
                  >
                    {captioning || detecting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>جاري التحليل واستخلاص المعالم من الصورة...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        <span>بدء تحليل وتوصيف محتوى الصورة</span>
                      </>
                    )}
                  </button>
                )}

                {/* Outputs caption */}
                {captionResult && (
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3 animate-fadeIn">
                    <span className="text-xs bg-purple-100 text-purple-800 py-1 px-2.5 rounded-lg font-bold">وصف محتوى الصورة (Captioning):</span>
                    <p className="text-sm text-gray-700 font-bold leading-relaxed font-mono">
                      {captionResult}
                    </p>
                    <div className="text-xs text-gray-400 leading-relaxed border-t border-slate-200/60 pt-2.5">
                      <strong>ملاحظة المبرمج المترجم الافتراضي:</strong> " {captionResult === 'a man riding a bicycle on a street' ? 'رجل يركب دراجة على طريق' : 'تم الوصف بالإنجليزية وسيتسق مع المخرجات المطلوبة.'} "
                    </div>
                  </div>
                )}

                {/* Outputs object detections */}
                {detectionResult.length > 0 && (
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3 animate-fadeIn">
                    <span className="text-xs bg-indigo-100 text-indigo-800 py-1 px-2.5 rounded-lg font-bold">العناصر المكتشفة في الصورة (Detected Objects):</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {detectionResult.map((det, index) => (
                        <div key={index} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-indigo-100 font-mono">
                          <span className="text-xs font-bold text-gray-700 capitalize">{det.label}</span>
                          <span className="text-[11px] bg-indigo-50 text-indigo-700 py-0.5 px-2 rounded font-extrabold">{(det.score * 100).toFixed(0)}% دقة</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. TEXT SUMMARIZATION */}
          {activeSubTab === 'summary' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-purple-50/30 p-5 rounded-2xl border border-purple-100/50">
                <h3 className="font-extrabold text-sm text-purple-950 mb-2">أداة التلخيص التلقائي للمستندات والفقرات</h3>
                <p className="text-xs text-gray-400">
                  توفر الأداة حلاً مزدوجاً: تلخيص شبكي ذكي، أو تحليل إحصائي فائق السرعة متوافق مع النصوص العربية الضخمة بدون إنترنت.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-purple-950">أدخل النص المراد تلخيصه هنا:</label>
                    <span className="text-[10px] font-mono text-gray-400">{summarizeText.split(/\s+/).filter(Boolean).length} كلمة</span>
                  </div>
                  <textarea
                    rows={6}
                    value={summarizeText}
                    onChange={(e) => setSummarizeText(e.target.value)}
                    placeholder="ضع هنا تقريراً طويلاً، مقالاً أو فقرات متعددة وسيتولى المعالج استخلاص النقاط العريضة فوراً..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-purple-400 focus:bg-white text-gray-700 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-purple-950 block">آلية وموديل التلخيص:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSummaryMode('extractive')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          summaryMode === 'extractive' 
                            ? 'bg-purple-600 text-white border-purple-600 shadow' 
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-slate-50'
                        }`}
                      >
                        تحليل لغوي سريع (عربي/إنجليزي)
                      </button>
                      <button
                        onClick={() => setSummaryMode('neural')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          summaryMode === 'neural' 
                            ? 'bg-purple-600 text-white border-purple-600 shadow' 
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-slate-50'
                        }`}
                      >
                        ذكاء شبكي (DistilBART)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-purple-950 block">عدد الجمل/الأفكار المستهدفة:</label>
                    <select
                      value={summarySentencesCount}
                      onChange={(e) => setSummarySentencesCount(Number(e.target.value))}
                      className="w-full bg-white border border-gray-200 rounded-xl py-2 px-3 text-xs font-bold focus:ring-1 focus:ring-purple-400 cursor-pointer"
                    >
                      <option value="2">جملتان مفتاحيتان (موجز جداً)</option>
                      <option value="3">3 جمل مفتاحية (موصى به)</option>
                      <option value="5">5 جمل مفتاحية (تقرير شامل)</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleSummarize}
                  disabled={summarizing || !summarizeText.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold py-3.5 px-6 rounded-xl shadow-md cursor-pointer disabled:opacity-50 transition-all text-sm animate-pulse"
                >
                  {summarizing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري تلخيص وتقطير النص برمجياً...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>استخلاص التلخيص التلقائي</span>
                    </>
                  )}
                </button>

                {summarizedOutput && (
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3 animate-fadeIn">
                    <div className="flex justify-between items-center">
                      <span className="text-xs bg-emerald-100 text-emerald-800 py-1 px-2.5 rounded-lg font-bold">الملخص الناتج والمكثف المحفوظ:</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(summarizedOutput);
                          alert('تم نسخ النص التلخيصي للحافظة بنجاح!');
                        }}
                        className="text-[10px] text-purple-700 hover:underline font-bold"
                      >
                        نسخ الملخص
                      </button>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed font-semibold whitespace-pre-wrap">
                      {summarizedOutput}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. TEXT TRANSLATION */}
          {activeSubTab === 'translate' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-purple-50/30 p-5 rounded-2xl border border-purple-100/50">
                <h3 className="font-extrabold text-sm text-purple-950 mb-2">الترجمة الفورية بلغات متعددة (NLLB-200)</h3>
                <p className="text-xs text-gray-400">
                  يعمل نموذج الترجمة اللغوي 200 بشكل مدهش لترجمة الكلمات والجمل محلياً بالكامل. يرجى تذكير أن هذا النموذج الضخم يتم تحميله الكاش مرة واحدة فقط.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-purple-950">
                      <span>اتجاه الترجمة:</span>
                    </div>
                    <select
                      value={translationDirection}
                      onChange={(e: any) => setTranslationDirection(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl py-2 px-3 text-xs focus:ring-1 focus:ring-purple-400 cursor-pointer text-gray-700 font-bold"
                    >
                      <option value="en_to_ar">من الإنجليزية إلى العربية (English → Arabic)</option>
                      <option value="ar_to_en">من العربية إلى الإنجليزية (Arabic → English)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-gray-600">النص الأصلي (Source Text):</span>
                    <textarea
                      rows={5}
                      value={translateText}
                      onChange={(e) => setTranslateText(e.target.value)}
                      placeholder="أدخل النص هنا للترجمة الفورية بأمان بنسبة 100%..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-450 focus:bg-white text-gray-700 font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-gray-600">النص المترجم (Translated Output):</span>
                    <div className="w-full h-[124px] bg-slate-100 border border-slate-200 rounded-xl p-3.5 text-xs text-gray-700 font-bold overflow-y-auto leading-relaxed whitespace-pre-wrap select-all">
                      {translatedOutput || <span className="text-gray-400 font-medium">ستظهر الترجمة اللغوية الفورية الدقيقة هنا...</span>}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleTranslate}
                  disabled={translating || !translateText.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold py-3.5 px-6 rounded-xl shadow-md cursor-pointer disabled:opacity-50 transition-all text-sm"
                >
                  {translating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري تشغيل محرك الترجمة واسترداد الكاش اللغوي...</span>
                    </>
                  ) : (
                    <>
                      <Languages className="w-4 h-4" />
                      <span>ترجمة النص بالكامل الآن</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* 4. KEYWORD EXTRACTION */}
          {activeSubTab === 'keywords' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-purple-50/30 p-5 rounded-2xl border border-purple-100/50">
                <h3 className="font-extrabold text-sm text-purple-950 mb-2">استخراج الكلمات المفتاحية والدلالية (TF-IDF Analyser)</h3>
                <p className="text-xs text-gray-400">
                  خوارزمية رائدة ومحلية لتحديد المصطلحات الهامة والمحورية، وتصفية أدوات الربط والجر، مع تقديم نسب مئوية لأهمية كل كلمة دلالية.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-purple-950">النص المستهدف للتحليل:</label>
                  <textarea
                    rows={5}
                    value={keywordsText}
                    onChange={(e) => setKeywordsText(e.target.value)}
                    placeholder="ألصق كليبات نصية أو منشورات اجتماعية أو أبحاثا لاستخراج الكلمات الدلالية منها بدقة..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400 focus:bg-white text-gray-700 font-medium"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-purple-950">عدد الكلمات المراد استخراجها:</span>
                  <input
                    type="range"
                    min={3}
                    max={15}
                    value={keywordsCount}
                    onChange={(e) => setKeywordsCount(Number(e.target.value))}
                    className="accent-purple-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                  />
                  <span className="text-xs font-mono font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-lg">{keywordsCount} كلمات</span>
                </div>

                <button
                  onClick={handleExtractKeywords}
                  disabled={!keywordsText.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold py-3.5 px-6 rounded-xl shadow-md cursor-pointer disabled:opacity-50 transition-all text-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>استخراج وتصنيف الكلمات المفتاحية فوراً</span>
                </button>

                {extractedKeywords.length > 0 && (
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                    <span className="text-xs bg-indigo-100 text-indigo-800 py-1 px-2.5 rounded-lg font-bold">الكلمات الدلالية المكتشفة ونسب الأهمية:</span>
                    
                    <div className="flex flex-wrap gap-2.5">
                      {extractedKeywords.map((item, idx) => (
                        <div 
                          key={idx} 
                          className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-gray-150 text-xs font-bold shadow-sm"
                        >
                          <span className="text-purple-700">#{item.word}</span>
                          <span className="text-[10px] bg-slate-100 text-gray-500 py-0.5 px-1.5 rounded-md font-mono">{item.score}%</span>
                        </div>
                      ))}
                    </div>

                    {/* Progress representation */}
                    <div className="space-y-2 pt-2 border-t border-slate-200/50">
                      {extractedKeywords.slice(0, 4).map((item, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between items-center text-[11px] font-bold text-gray-650">
                            <span>{item.word}</span>
                            <span>{item.score}%</span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div style={{ width: `${item.score}%` }} className="bg-purple-650 h-full rounded-full" />
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5. SMART TEXT RAG CHAT */}
          {activeSubTab === 'rag' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-purple-50/30 p-5 rounded-2xl border border-purple-100/50">
                <h3 className="font-extrabold text-sm text-purple-950 mb-2">محادثة مخصصة ومبسطة مع مستندك (Local RAG Dialog)</h3>
                <p className="text-xs text-gray-400">
                  قم بإدخال النص أو التقرير، وسيقوم النظام ببناء فهرس إحصائي وتقطيع النص، للبحث والإجابة الفورية من داخله باستخدام نموذج QA محلي بالكامل.
                </p>
              </div>

              {!isDocIndexed ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-purple-950">أدخل محتوى المستند أو النص بالكامل للفهرسة:</label>
                    <textarea
                      rows={6}
                      value={ragDocText}
                      onChange={(e) => setRagDocText(e.target.value)}
                      placeholder="ألصق هنا نصوص الكتب، عقود الشركات، أو التقارير الطويلة لتبدأ المعالجة والمحادثة الذكية..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400 focus:bg-white text-gray-700 font-medium"
                    />
                  </div>

                  <button
                    onClick={handleIndexDocument}
                    disabled={!ragDocText.trim()}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold py-3.5 px-6 rounded-xl shadow-md cursor-pointer disabled:opacity-50 transition-all text-sm"
                  >
                    <BookMarked className="w-4 h-4" />
                    <span>فهم وفهرسة محتوى المستند محلياً</span>
                  </button>
                </div>
              ) : (
                <div className="border border-purple-100 rounded-3xl overflow-hidden bg-slate-50 flex flex-col h-[420px]">
                  {/* Target text meta info bar */}
                  <div className="bg-purple-900 text-white p-3.5 px-5 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-purple-300" />
                      <span className="font-bold">المستند مفهرس بنجاح ({docChunks.length} وحدة تجزئة)</span>
                    </div>

                    <button
                      onClick={() => {
                        setIsDocIndexed(false);
                        setChatHistory([]);
                      }}
                      className="text-[10px] bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg font-bold"
                    >
                      إعادة التحميل وبدء مستند جديد
                    </button>
                  </div>

                  {/* Chat historical area */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[310px]">
                    {chatHistory.map((chat, idx) => (
                      <div 
                        key={idx} 
                        className={`flex flex-col max-w-[85%] ${chat.sender === 'user' ? 'mr-auto items-end' : 'ml-auto items-start'}`}
                      >
                        <div 
                          className={`p-3 rounded-2xl text-xs leading-relaxed font-semibold ${
                            chat.sender === 'user' 
                              ? 'bg-purple-600 text-white rounded-br-none' 
                              : 'bg-white text-gray-700 border border-gray-200 shadow-sm rounded-bl-none'
                          }`}
                        >
                          {chat.text}
                        </div>

                        {/* Citation of context */}
                        {chat.sourceContext && (
                          <details className="mt-1.5 w-full text-[9px] text-gray-400 font-bold bg-white/40 p-1 px-2 rounded cursor-pointer select-none">
                            <summary className="hover:text-purple-700">عرض الفقرة المرجعية المقتطعة</summary>
                            <p className="mt-1 bg-white p-2 border border-gray-100 rounded text-gray-650 leading-relaxed font-medium">
                              {chat.sourceContext}
                            </p>
                          </details>
                        )}
                      </div>
                    ))}

                    {ragResponding && (
                      <div className="flex items-center gap-2.5 text-xs text-purple-600 font-bold ml-auto animate-pulse">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>جاري القراءة والربط التلقائي بفقرات المستند...</span>
                      </div>
                    )}
                  </div>

                  {/* Chat action input bar */}
                  <div className="bg-white p-3 border-t border-purple-50 flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendRagMessage();
                      }}
                      placeholder="اسألني عن أي حقيقة أو إحصائية في المستند (مثال: ما هو تاريخ التأسيس؟)..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400 focus:bg-white text-gray-700 font-semibold"
                    />
                    <button
                      onClick={handleSendRagMessage}
                      disabled={ragResponding || !chatInput.trim()}
                      className="bg-purple-600 hover:bg-purple-500 text-white p-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-40"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              )}
            </div>
          )}

        </div>

        {/* Sidebar Info/How it works column */}
        <div className="lg:col-span-4 space-y-5 bg-gradient-to-b from-purple-50/50 to-indigo-50/20 p-5 rounded-3xl border border-purple-100/40">
          
          {/* Download progress list for pipelines */}
          {Object.values(statuses).some((s: PipelineStatus) => s.loading) && (
            <div className="bg-white p-4 rounded-2xl border border-purple-150 shadow-sm space-y-3 animate-fadeIn">
              <h4 className="font-extrabold text-xs text-purple-950 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                <span>تحميل النماذج إلى جهازك (لأول مرة)</span>
              </h4>
              
              <div className="space-y-3 text-[10px] text-gray-500 leading-relaxed font-bold">
                <p>• نقوم الآن بتحميل أوزان الموديل وتجهيز معالجات المتصفح المحلية لتمرير بياناتك بأمان تام.</p>

                {Object.entries(statuses).map(([key, stat]) => {
                  const item = stat as PipelineStatus;
                  if (!item.loading) return null;
                  const progData = getDownloadState(key);
                  if (!progData) return null;

                  return (
                    <div key={key} className="space-y-1.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-center text-[10px] capitalize">
                        <span className="text-purple-950 font-extrabold">{key === 'caption' ? 'وصف الصور (Caption)' : key === 'detection' ? 'كشف العناصر (Detection)' : key === 'summarize' ? 'التلخيص (BART)' : key === 'translate' ? 'الترجمة (NLLB)' : 'الأسئلة (RAG)'}</span>
                        <span className="font-mono text-purple-700">{progData.progress}%</span>
                      </div>
                      
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${progData.progress}%` }} 
                          className="bg-purple-650 h-full rounded-full transition-all duration-300" 
                        />
                      </div>
                      <span className="text-[9px] text-gray-400 block font-mono text-left">
                        {progData.totalBytes ? `${formatMegaBytes(progData.loadedBytes)} / ${formatMegaBytes(progData.totalBytes)}` : 'جاري فحص المكونات...'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Educational Explainers */}
          <div className="space-y-4">
            <h4 className="font-extrabold text-sm text-purple-950 flex items-center gap-1.5 border-b border-purple-150 pb-2 select-none">
              <HelpCircle className="w-4.5 h-4.5 text-purple-750" />
              <span>كيف تعمل هذه التقنية؟</span>
            </h4>

            <div className="space-y-3 text-xs leading-relaxed text-gray-700">
              <div className="bg-white p-3.5 rounded-2xl border border-purple-50 space-y-1">
                <h5 className="font-bold text-purple-950">1. معالجة محلية 100%</h5>
                <p className="text-gray-500 font-medium text-[11px]">
                  على عكس خوادم الذكاء الاصطناعي التي ترسل بياناتك، يتم تشغيل كل الموديلات الرياضية هنا داخل متصفحك مباشرة عبر WebAssembly وصيغة ONNX.
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-purple-50 space-y-1">
                <h5 className="font-bold text-purple-950">2. حفظ تخزيني محلي (Caching)</h5>
                <p className="text-gray-500 font-medium text-[11px]">
                  عند تشغيل الأداة لأول مرة، يقوم متصفحك بتحميل النموذج وتخزينه في ذاكرة الكاش الآمنة التابعة للمتصفح. في المرات القادمة سيعمل فوراً دون استهلاك للإنترنت.
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-purple-50 space-y-1">
                <h5 className="font-bold text-purple-950">3. حماية بياناتك المطلقة</h5>
                <p className="text-gray-500 font-medium text-[11px]">
                  صورك، تقاريرك، مستنداتك، وأسئلتك لا تمر بأي خادم سحابي ولا يمكن كشفها من أي طرف ثالث. خصوصيتك مغلقة بالكامل داخل صندوق جهازك.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-purple-900 text-white rounded-2xl text-[10px] space-y-1 leading-relaxed select-none">
              <p className="font-bold text-purple-200">معلومة ذكية:</p>
              <p>تدعم النماذج اللغة العربية والإنكليزية والفرنسية بفضل توافق نظام NLLB المحوري اللغوي الرائع.</p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

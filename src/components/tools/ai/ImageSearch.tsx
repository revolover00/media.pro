import React, { useState, useEffect, useRef } from 'react';
import { useAIModel } from '../../../hooks/useAIModel';
import { 
  Search, 
  Sparkles, 
  ImageIcon, 
  X, 
  Loader2, 
  Grid, 
  ListOrdered,
  FileUp,
  BookmarkCheck,
  AlertCircle
} from 'lucide-react';

interface GalleryItem {
  id: string;
  name: string;
  size: number;
  dataUrl: string;
  caption: string;
  keywords: string[];
  status: 'pending' | 'captioning' | 'completed' | 'error';
  originalFile: File;
}

export const ImageSearch: React.FC<{ lang: 'ar' | 'en' }> = ({ lang }) => {
  const { status, loadModel, cancelLoading } = useAIModel();
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [processing, setProcessing] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);

  // Clean all image previews on unmount
  useEffect(() => {
    return () => {
      gallery.forEach(item => {
        URL.revokeObjectURL(item.dataUrl);
      });
    };
  }, []);

  const handleFilesAdded = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: GalleryItem[] = (Array.from(files) as File[]).map(file => ({
      id: 'gal_' + Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      dataUrl: URL.createObjectURL(file),
      caption: '',
      keywords: [],
      status: 'pending',
      originalFile: file,
    }));

    setGallery(prev => [...prev, ...newItems]);
  };

  const describeImagesOneByOne = async () => {
    const pendings = gallery.filter(item => item.status === 'pending');
    if (pendings.length === 0) return;

    setProcessing(true);

    try {
      // 1. Lazy load captioner model
      const captioner = await loadModel('image-to-text', 'Xenova/vit-gpt2-image-captioning');

      for (const item of pendings) {
        setGallery(prev => prev.map(p => p.id === item.id ? { ...p, status: 'captioning' } : p));

        try {
          // Perform local inference
          const result = await captioner(item.dataUrl);
          const captionText = result[0]?.generated_text || 'An uploaded image';
          
          // Generate keywords by cleaning words from description
          const stopwords = new Set([
            'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'on', 'in', 'at', 'with', 'by', 'of', 'for', 'about'
          ]);
          const keywords = captionText
            .toLowerCase()
            .match(/[a-z']+/g) || [];
          const uniqKeywords = Array.from(new Set(keywords.filter(w => w.length > 2 && !stopwords.has(w)))) as string[];

          setGallery(prev => prev.map(p => p.id === item.id ? { 
            ...p, 
            caption: captionText, 
            keywords: uniqKeywords,
            status: 'completed' 
          } : p));

        } catch (err) {
          console.error(`Error captioning image ${item.name}:`, err);
          setGallery(prev => prev.map(p => p.id === item.id ? { ...p, status: 'error' } : p));
        }
      }

      showToast(lang === 'ar' ? 'اكتمل فهرسة وتوصيف الصور!' : 'All images indexed complete!');
    } catch (e) {
      console.error(e);
      showToast(lang === 'ar' ? 'فشل تحميل محرك الوصف.' : 'Caption model failed to load.');
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveItem = (id: string) => {
    setGallery(prev => {
      const item = prev.find(p => p.id === id);
      if (item) URL.revokeObjectURL(item.dataUrl);
      return prev.filter(p => p.id !== id);
    });
  };

  const handleClearAll = () => {
    gallery.forEach(item => URL.revokeObjectURL(item.dataUrl));
    setGallery([]);
    setSearchQuery('');
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Helper local cosine/search overlap matching logic to rank gallery
  const rankedGallery = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return gallery.map(item => ({ ...item, rankScore: 0 }));
    }

    const queryTerms = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
    
    const calculated = gallery.map(item => {
      if (item.status !== 'completed') return { ...item, rankScore: 0 };

      const fullText = `${item.caption} ${item.keywords.join(' ')} ${item.name}`.toLowerCase();
      
      // Calculate tf-idf-like match score based on query
      let matchCount = 0;
      queryTerms.forEach(term => {
        if (fullText.includes(term)) {
          // Bonus if exact keyword match
          const regex = new RegExp('\\b' + term + '\\b', 'g');
          const matches = fullText.match(regex);
          matchCount += matches ? matches.length * 3 : 1;
        }
      });

      // Scale rankScore as percentage 0-100
      const denominator = queryTerms.length * 3;
      const scorePercentage = Math.min(100, Math.round((matchCount / (denominator || 1)) * 100));

      return {
        ...item,
        rankScore: scorePercentage
      };
    });

    // If query typed, filter items having >0 scores, sort in descending order
    return calculated
      .filter(item => item.rankScore > 0)
      .sort((a, b) => b.rankScore - a.rankScore);
  }, [gallery, searchQuery]);

  // Gallery items matching normal view or search results
  const displayedItems = searchQuery.trim() ? rankedGallery : gallery;

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-purple-100 dark:border-slate-700 shadow-sm space-y-6">
      
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-900 border border-purple-500/30 text-white py-3 px-5 rounded-2xl shadow-xl animate-slideIn">
          <BookmarkCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold leading-none">{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-50 dark:border-slate-700 pb-5">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-cyan-500 to-indigo-600 p-2.5 rounded-2xl text-white shadow-md">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg text-slate-950 dark:text-white flex items-center gap-2">
              {lang === 'ar' ? 'محرك البحث الذكي في الصور' : 'Natural Image Search & Semantic Indexer'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'ar'
                ? 'فهرسة وتفتيش معرض صورك بالكامل محلياً: يصف الذكاء الاصطناعي الصور لتمكين البحث النصي بينها.'
                : 'Local semantic photo indexing using VIT-GPT2 descriptors for natural language search queries.'}
            </p>
          </div>
        </div>
      </div>

      {/* AI Model Loader Progress */}
      {status.loading && (
        <div className="bg-purple-50 dark:bg-slate-755 border border-purple-100 dark:border-purple-900 p-4 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold flex items-center gap-1.5 text-purple-950 dark:text-purple-300">
              <Loader2 className="w-4 h-4 animate-spin text-purple-650" />
              {lang === 'ar' ? 'جاري تهيئة كاشف وتوصيف الصور (vit-gpt2)...' : 'Spinning up VIT-GPT2 Neural Descriptor...'}
            </span>
            <span className="font-bold font-mono text-purple-800 dark:text-purple-400">{status.progress}%</span>
          </div>
          <div className="w-full bg-slate-205 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-purple-500 to-cyan-500 h-full rounded-full transition-all duration-300" 
              style={{ width: `${status.progress}%` }}
            />
          </div>
          <button onClick={cancelLoading} className="text-[10px] text-red-500 hover:underline font-bold">
            {lang === 'ar' ? 'إلغاء التحميل' : 'Cancel Loader'}
          </button>
        </div>
      )}

      {/* Upload Zone & Global Grid of items */}
      <div className="space-y-6">
        
        {/* Upload bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilesAdded}
            className="hidden"
            id="multi-search-picker"
          />
          <label
            htmlFor="multi-search-picker"
            className="flex items-center justify-center gap-2 bg-purple-55 dark:bg-slate-750 text-purple-800 dark:text-purple-300 border border-purple-100 hover:opacity-90 font-bold py-3 px-5 rounded-2xl text-xs cursor-pointer shadow-sm transition-all"
          >
            <FileUp className="w-4 h-4" />
            <span>{lang === 'ar' ? 'إضافة مجموعة صور للمعرض' : 'Add Multi-Images to Index'}</span>
          </label>

          {/* Trigger semantic captioning */}
          {gallery.some(item => item.status === 'pending') && (
            <button
              onClick={describeImagesOneByOne}
              disabled={processing || status.loading}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold py-3 px-5 rounded-2xl text-xs cursor-pointer disabled:opacity-50 shadow transition-all"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{lang === 'ar' ? 'جاري قراءة محتوى الصور وتصنيف الكلمات...' : 'Running on-device scanning...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'توليد ووصف الصور لتمكين البحث' : 'Generate Descriptions to Enable Search'}</span>
                </>
              )}
            </button>
          )}

          {gallery.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs bg-red-50 dark:bg-rose-950/20 text-red-500 px-4 py-3 rounded-2xl font-bold transition-all cursor-pointer"
            >
              {lang === 'ar' ? 'تفريغ المعرض بالكامل' : 'Reset Gallery'}
            </button>
          )}
        </div>

        {/* Search Searchbar */}
        {gallery.length > 0 && !gallery.some(item => item.status === 'pending') && (
          <div className="relative">
            <Search className="absolute top-1/2 left-4 -translate-y-1/2 w-5 h-5 text-purple-600" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'ar' ? 'اكتب كلمة أو جملة بالإنجليزية للبحث بالمعرض (مثلاً: bicycle, tree, person)...' : 'Type description to search locally (e.g. bicycle, car, cat-food)...'}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 py-3.5 pr-4 pl-12 rounded-2xl text-xs leading-none focus:outline-none focus:ring-1 focus:ring-purple-400 focus:bg-white text-gray-700 dark:text-slate-205 font-bold"
            />
          </div>
        )}

        {/* Gallery Items Grid layout */}
        {displayedItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayedItems.map((item) => {
              const matchesSearch = searchQuery.trim() && (item as any).rankScore > 0;
              return (
                <div 
                  key={item.id} 
                  className="bg-white dark:bg-slate-850 rounded-2xl overflow-hidden border border-slate-150 dark:border-slate-750 flex flex-col justify-between shadow-sm relative group"
                >
                  
                  {/* Photo space */}
                  <div className="relative pb-[70%] bg-slate-900 overflow-hidden">
                    <img 
                      src={item.dataUrl} 
                      alt={item.name} 
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />

                    {/* Delete item button */}
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white cursor-pointer z-10 transition-colors"
                      title={lang === 'ar' ? 'حذف من المعرض' : 'Remove'}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>

                    {/* Status Badge overlay */}
                    {item.status !== 'completed' && (
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white text-[10px] font-bold p-3">
                        {item.status === 'captioning' ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin text-purple-400 mb-1" />
                            <span>{lang === 'ar' ? 'جاري تحليل الصورة البصرية...' : 'Describing pixels...'}</span>
                          </>
                        ) : (
                          <span className="bg-amber-500/90 text-white py-1 px-3 rounded-lg">
                            {lang === 'ar' ? 'بانتظار التحليل' : 'Pending Description'}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Rank Compatibility Badge (Search result) */}
                    {matchesSearch && (
                      <div className="absolute top-2 left-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-extrabold text-[10px] py-1 px-2.5 rounded-lg shadow-lg">
                        {lang === 'ar' ? 'تطابق بنسبة:' : 'Match:'} {(item as any).rankScore}%
                      </div>
                    )}
                  </div>

                  {/* Meta descriptions space */}
                  <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-extrabold text-[11px] text-slate-800 dark:text-slate-300 truncate" title={item.name}>
                        {item.name}
                      </h4>
                      {item.caption && (
                        <p className="text-[10px] text-slate-400 font-mono italic mt-1 leading-relaxed">
                          "{item.caption}"
                        </p>
                      )}
                    </div>

                    {/* Keywords listing */}
                    {item.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.keywords.slice(0, 4).map((word, wIdx) => (
                          <span 
                            key={wIdx} 
                            className="bg-purple-50 dark:bg-purple-950 text-purple-750 dark:text-purple-300 text-[9px] font-extrabold px-2 py-0.5 rounded-md"
                          >
                            #{word}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/10 rounded-2xl border border-slate-100 dark:border-slate-750">
            {gallery.length === 0 ? (
              <div className="space-y-2 max-w-sm mx-auto">
                <ImageIcon className="w-8 h-8 mx-auto text-slate-400" />
                <h3 className="font-bold text-xs text-slate-600 dark:text-slate-400">{lang === 'ar' ? 'المعرض فارغ حالياً' : 'Your Gallery is Empty'}</h3>
                <p className="text-[11px] text-slate-400">
                  {lang === 'ar' ? 'قم بإضافة صور مخصصة من جهازك لتبدأ في تفتيشها والبحث فيها محلياً.' : 'Upload vintage or natural shots to start filtering by content.'}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 max-w-sm mx-auto">
                <Search className="w-8 h-8 mx-auto text-slate-400" />
                <h3 className="font-bold text-xs text-slate-650 dark:text-slate-400">{lang === 'ar' ? 'لا نتائج مطابقة لبحثك' : 'No matching results found'}</h3>
                <p className="text-[10px] text-slate-400">
                  {lang === 'ar' ? 'جرب البحث عن مصطلحات بالإنجليزية مرئية في الصور مثل (sky, street, table).' : 'Try simple descriptive query terms (mountain, grass, dog).'}
                </p>
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
};

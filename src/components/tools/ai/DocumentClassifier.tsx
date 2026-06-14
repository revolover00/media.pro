import React, { useState, useEffect } from 'react';
import { useAIModel } from '../../../hooks/useAIModel';
import { 
  FileText, 
  Tag, 
  Trash2, 
  Download, 
  Loader2, 
  Sparkles, 
  Plus, 
  FolderSync, 
  FileJson,
  CheckCircle,
  AlertCircle,
  BookmarkCheck,
  X
} from 'lucide-react';

interface DocumentItem {
  id: string;
  name: string;
  size: number;
  contentSnippet: string;
  classification: string;
  confidence: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

export const DocumentClassifier: React.FC<{ lang: 'ar' | 'en' }> = ({ lang }) => {
  const { status, loadModel, cancelLoading } = useAIModel();
  
  // Custom target categories
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategoryInput, setNewCategoryInput] = useState<string>('');

  // Documents pool
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [processing, setProcessing] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);

  // Initialize standard classes
  useEffect(() => {
    if (lang === 'ar') {
      setCategories(['عقد (Contract)', 'فاتورة (Invoice)', 'سيرة ذاتية (CV/Resume)', 'تقرير فني (Technical Report)', 'رسالة بريد (Email/Letter)']);
    } else {
      setCategories(['Contract', 'Invoice', 'CV/Resume', 'Technical Report', 'Email/Letter']);
    }
  }, [lang]);

  const handleFilesAdded = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const loadedDocs: DocumentItem[] = [];

    for (const file of Array.from(files) as File[]) {
      // Read plain texts or inspect payloads
      const docId = 'doc_' + Math.random().toString(36).substr(2, 9);
      
      const snippet = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const text = ev.target?.result as string || '';
          resolve(text.substring(0, 1500)); // Grab first 1500 characters to classify fast without hogging tokens
        };
        reader.readAsText(file.slice(0, 2500)); // Read first parts
      });

      loadedDocs.push({
        id: docId,
        name: file.name,
        size: file.size,
        contentSnippet: snippet,
        classification: '',
        confidence: 0,
        status: 'pending'
      });
    }

    setDocuments(prev => [...prev, ...loadedDocs]);
  };

  const handleAddCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) return;

    setCategories(prev => [...prev, trimmed]);
    setNewCategoryInput('');
  };

  const handleRemoveCategory = (cat: string) => {
    setCategories(prev => prev.filter(c => c !== cat));
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const runBulkClassification = async () => {
    const pendings = documents.filter(doc => doc.status === 'pending' || doc.status === 'error');
    if (pendings.length === 0 || categories.length === 0) return;

    setProcessing(true);

    try {
      // 1. Loading zero shot mnli text classifier
      const classifier = await loadModel('zero-shot-classification', 'Xenova/distilbert-base-uncased-mnli');

      for (const doc of pendings) {
        setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, status: 'processing' } : d));

        try {
          // Prepare clean zero-shot labels context
          // Zero-shot models work best with English, so if category has Arabic translation, we clean it
          const cleanLabels = categories.map(cat => {
            const matchesEn = cat.match(/\(([^)]+)\)/);
            return matchesEn ? matchesEn[1] : cat;
          });

          const res = await classifier(doc.contentSnippet, cleanLabels);

          const bestLabelIdx = 0;
          const matchedLabel = res.labels[bestLabelIdx];
          const matchedScore = res.scores[bestLabelIdx];

          // Map back to original category string
          const originalCat = categories.find(cat => cat.includes(matchedLabel)) || matchedLabel;

          setDocuments(prev => prev.map(d => d.id === doc.id ? {
            ...d,
            classification: originalCat,
            confidence: Math.round(matchedScore * 100),
            status: 'completed'
          } : d));

        } catch (err) {
          console.error(`Error classifying doc ${doc.name}:`, err);
          setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, status: 'error' } : d));
        }
      }

      showToast(lang === 'ar' ? 'اكتمل تصنيف وفرز المستندات!' : 'Bulk document classification complete!');

    } catch (e) {
      console.error(e);
      showToast(lang === 'ar' ? 'فشل تحميل نموذج التصنيف.' : 'Classification model error.');
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  const handleClearAllDocs = () => {
    setDocuments([]);
  };

  // Export results categorized list as JSON
  const handleExportJSON = () => {
    const completed = documents.filter(d => d.status === 'completed');
    if (completed.length === 0) return;

    const exportData = completed.map(({ name, size, classification, confidence }) => ({
      document_name: name,
      file_size_bytes: size,
      inferred_category: classification,
      confidence_score_percentage: confidence,
      classified_at: new Date().toISOString()
    }));

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(exportData, null, 2))}`;
    const link = document.createElement('a');
    link.setAttribute('href', jsonString);
    link.setAttribute('download', `document_classifications_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            <FolderSync className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg text-slate-950 dark:text-white flex items-center gap-2">
              {lang === 'ar' ? 'مصنف المجلدات والمستندات الذكي' : 'Zero-Shot Document Classifier'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'ar'
                ? 'تصنيف فوري وتلقائي لأنواع الملفات والعقود والفواتير محلياً بفضل نموذج MNLI لغوي متقدم.'
                : 'Bulk classify text sheets, JSON reports, contracts and letters locally using DistilBERT MNLI.'}
            </p>
          </div>
        </div>
      </div>

      {/* Loading progress bar */}
      {status.loading && (
        <div className="bg-purple-50 dark:bg-slate-755 border border-purple-100 dark:border-purple-900 p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold flex items-center gap-1.5 text-purple-950 dark:text-purple-300">
              <Loader2 className="w-4 h-4 animate-spin text-purple-650" />
              {lang === 'ar' ? 'جاري استيراد وتحميل نموذج MNLI اللغوي...' : 'Downloading MNLI Classfier Model...'}
            </span>
            <span className="font-bold font-mono text-purple-850 dark:text-purple-400">{status.progress}%</span>
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

      {/* Setup Categories and Upload Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left column: categories settings */}
        <div className="lg:col-span-4 bg-slate-55 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-4">
          <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-350 flex items-center gap-1.5 pb-2 border-b border-slate-200 dark:border-slate-750">
            <Tag className="w-4 h-4 text-purple-600" />
            <span>{lang === 'ar' ? 'التصنيفات المستهدفة' : 'Classification Labels'}</span>
          </h3>

          {/* New Category input */}
          <div className="flex gap-2">
            <input 
              type="text"
              value={newCategoryInput}
              onChange={(e) => setNewCategoryInput(e.target.value)}
              placeholder={lang === 'ar' ? 'إضافة تصنيف جديد...' : 'Add custom label...'}
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 px-3 py-1.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-purple-400"
            />
            <button 
              onClick={handleAddCategory}
              className="p-2 rounded-xl bg-purple-650 hover:bg-purple-550 text-white cursor-pointer transition-colors"
              title={lang === 'ar' ? 'تأكيد الإضافة' : 'Confirm addition'}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Current Category Badges List */}
          <div className="flex flex-wrap gap-1.5 pt-1 max-h-[140px] overflow-y-auto">
            {categories.map((cat) => (
              <span 
                key={cat} 
                className="bg-purple-50 dark:bg-purple-950/60 text-purple-900 dark:text-purple-300 text-[10px] font-extrabold py-1 px-2.5 rounded-xl flex items-center gap-1"
              >
                <span>{cat}</span>
                <button 
                  onClick={() => handleRemoveCategory(cat)}
                  className="hover:text-red-500 cursor-pointer"
                  title={lang === 'ar' ? 'حذف' : 'Remove'}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Right column: uploads and results table */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* File adder row */}
          <div className="flex flex-wrap gap-2.5 items-center justify-between border-b pb-4 dark:border-slate-750">
            <div className="flex items-center gap-2">
              <input 
                type="file"
                accept=".txt,.json,.csv"
                multiple
                onChange={handleFilesAdded}
                className="hidden"
                id="doc-bulk-picker"
              />
              <label 
                htmlFor="doc-bulk-picker"
                className="flex items-center gap-1.5 bg-purple-55 dark:bg-slate-755 text-purple-750 dark:text-purple-300 border border-purple-100 dark:border-slate-700 py-2.5 px-4 rounded-xl text-xs font-bold cursor-pointer transition-all"
              >
                <span>{lang === 'ar' ? 'إضافة مستندات نصية للفرز' : 'Upload Text Documents'}</span>
              </label>

              {documents.length > 0 && (
                <button 
                  onClick={handleClearAllDocs}
                  className="text-xs text-red-500 font-bold hover:underline cursor-pointer"
                >
                  {lang === 'ar' ? 'حذف الجميع' : 'Clean all'}
                </button>
              )}
            </div>

            {/* Inferences trigger button */}
            {documents.some(d => d.status === 'pending') && (
              <button
                onClick={runBulkClassification}
                disabled={processing || categories.length === 0}
                className="flex items-center gap-1.5 bg-gradient-to-r from-purple-650 to-indigo-650 text-white font-extrabold py-2.5 px-5 rounded-xl text-xs cursor-pointer shadow transition-opacity"
              >
                <Sparkles className="w-4 h-4" />
                <span>{lang === 'ar' ? 'فرز وتصنيف المستندات دفعة واحدة' : 'Bulk classify files now'}</span>
              </button>
            )}

            {/* JSON Export button */}
            {documents.some(d => d.status === 'completed') && (
              <button
                onClick={handleExportJSON}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-505 text-white font-bold py-2.5 px-4 rounded-xl text-xs cursor-pointer transition-colors"
              >
                <FileJson className="w-4 h-4" />
                <span>{lang === 'ar' ? 'تصدير النتائج كـ JSON' : 'Export Classifications JSON'}</span>
              </button>
            )}
          </div>

          {/* Document list render */}
          {documents.length > 0 ? (
            <div className="border border-slate-150 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {documents.map((doc, idx) => (
                <div 
                  key={doc.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/10 hover:bg-white transition-colors"
                >
                  
                  {/* Left part: doc details */}
                  <div className="flex items-start gap-2.5 min-w-0">
                    <FileText className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-300 truncate" title={doc.name}>
                        {doc.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono italic truncate max-w-sm mt-0.5">
                        "{doc.contentSnippet.trim() || 'Empty content...'}"
                      </p>
                    </div>
                  </div>

                  {/* Right part: classification badges and deletes */}
                  <div className="flex items-center justify-between sm:justify-end gap-3.5 mt-1 sm:mt-0 font-bold shrink-0">
                    
                    {/* Status badges */}
                    {doc.status === 'pending' && (
                      <span className="text-[10px] text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {lang === 'ar' ? 'جاهز للفرز' : 'Pending Classification'}
                      </span>
                    )}

                    {doc.status === 'processing' && (
                      <span className="text-[10px] text-purple-800 bg-purple-50 flex items-center gap-1 px-2.5 py-1 rounded-lg">
                        <Loader2 className="w-3 h-3 animate-spin text-purple-600" />
                        <span>{lang === 'ar' ? 'جاري الفرز...' : 'Sorting...'}</span>
                      </span>
                    )}

                    {doc.status === 'completed' && (
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="bg-emerald-50 dark:bg-emerald-950 text-emerald-850 dark:text-emerald-300 text-[10px] font-extrabold px-3 py-1 rounded-lg">
                          {doc.classification}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono">
                          {doc.confidence}% {lang === 'ar' ? 'دقة' : 'confidence'}
                        </span>
                      </div>
                    )}

                    <button 
                      onClick={() => handleRemoveDocument(doc.id)}
                      className="text-slate-400 hover:text-red-500 cursor-pointer"
                      title={lang === 'ar' ? 'مسح' : 'Delete'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/10 rounded-2xl border border-slate-150 dark:border-slate-800">
              <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h3 className="font-bold text-xs text-slate-650 dark:text-slate-400">{lang === 'ar' ? 'لا مستندات مضافة للفحص' : 'No Text Documents Added'}</h3>
              <p className="text-[10px] text-slate-400 max-w-xs mx-auto mt-1">
                {lang === 'ar' ? 'قم بإضافة ملفات نصية (.txt, .json) لكتابة محتواها وفرزها محلياً في ثوانٍ.' : 'Supports uploading plain text drafts or files to sort bulk categorizations.'}
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

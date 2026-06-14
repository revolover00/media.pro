import { useState, useEffect, useRef } from 'react';
import { env, pipeline } from '@xenova/transformers';

// Configure Transformers.js to retrieve models from Xenova/HuggingFace CDN 
// and cache them locally in browser cache / IndexedDB
env.allowLocalModels = false;
env.useBrowserCache = true;

export interface ProgressItem {
  file: string;
  progress: number;
  loaded: number;
  total: number;
  status: string;
}

export interface ModelStatus {
  loading: boolean;
  loaded: boolean;
  progress: number;
  error: string | null;
  files: Record<string, ProgressItem>;
}

// In-memory cache for pipelines to avoid multiple downloads
const globalPipelineCache: Record<string, any> = {};

export function useAIModel() {
  const [status, setStatus] = useState<ModelStatus>({
    loading: false,
    loaded: false,
    progress: 0,
    error: null,
    files: {},
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const activePipelinesRef = useRef<string[]>([]);

  // Function to load a model with progress tracking and abort support
  const loadModel = async (task: any, modelName: string) => {
    const cacheKey = `${task}_${modelName}`;
    
    // Check if cached globally
    if (globalPipelineCache[cacheKey]) {
      setStatus({
        loading: false,
        loaded: true,
        progress: 100,
        error: null,
        files: {},
      });
      if (!activePipelinesRef.current.includes(cacheKey)) {
        activePipelinesRef.current.push(cacheKey);
      }
      return globalPipelineCache[cacheKey];
    }

    // Cancel any ongoing loading
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setStatus({
      loading: true,
      loaded: false,
      progress: 0,
      error: null,
      files: {},
    });

    try {
      const model = await pipeline(task, modelName, {
        progress_callback: (data: any) => {
          // If aborted, do nothing
          if (abortControllerRef.current?.signal.aborted) return;

          if (data.status === 'progress' || data.status === 'initiate' || data.status === 'done' || data.status === 'downloading') {
            const fileName = data.file || 'model.onnx';
            
            setStatus((prev) => {
              const updatedFiles = {
                ...prev.files,
                [fileName]: {
                  file: fileName,
                  progress: data.progress || 0,
                  loaded: data.loaded || 0,
                  total: data.total || 0,
                  status: data.status,
                },
              };

              // Compute aggregate progress
              const fileList = Object.values(updatedFiles) as any[];
              const totalProgress = fileList.reduce((sum, f) => sum + (f.progress || 0), 0);
              const avgProgress = fileList.length > 0 ? Math.round(totalProgress / fileList.length) : 0;

              return {
                ...prev,
                progress: avgProgress,
                files: updatedFiles,
              };
            });
          }
        },
      });

      // Cache the loaded model
      globalPipelineCache[cacheKey] = model;
      if (!activePipelinesRef.current.includes(cacheKey)) {
        activePipelinesRef.current.push(cacheKey);
      }

      setStatus({
        loading: false,
        loaded: true,
        progress: 100,
        error: null,
        files: {},
      });

      return model;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setStatus((prev) => ({
          ...prev,
          loading: false,
          error: 'تم إلغاء عملية تحميل النموذج.',
        }));
        throw err;
      }

      console.error('Error loading AI model in useAIModel hook:', err);
      // Graceful error handling for large models
      const errorMsg = err.message || '';
      let friendlyError = 'خطأ في تحميل نموذج الذكاء الاصطناعي.';
      if (errorMsg.includes('out of memory') || errorMsg.includes('allocation')) {
        friendlyError = 'نفدت ذاكرة المتصفح أثناء تحميل النموذج. يرجى إغلاق علامات التبويب الأخرى وإعادة المحاولة.';
      } else {
        friendlyError = `فشل تحميل النموذج المحلي: ${errorMsg || 'تأكد من اتصال الإنترنت لتنزيل الكاش لأول مرة.'}`;
      }

      setStatus({
        loading: false,
        loaded: false,
        progress: 0,
        error: friendlyError,
        files: {},
      });
      throw err;
    }
  };

  const cancelLoading = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  // Perform cleanups on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Note: We keep globalPipelineCache to speed up future navigation, 
      // but activePipelinesRef is page-specific.
    };
  }, []);

  return {
    status,
    loadModel,
    cancelLoading,
  };
}

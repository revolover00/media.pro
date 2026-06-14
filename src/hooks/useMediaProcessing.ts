import { useState, useCallback } from 'react';

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
}

export const useMediaProcessing = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Helper to format bytes to human readable form
  const formatBytes = useCallback((bytes: number, decimals: number = 2): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }, []);

  // Helper to format seconds to MM:SS or HH:MM:SS
  const formatTime = useCallback((seconds: number): string => {
    if (isNaN(seconds) || seconds === Infinity) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const pad = (num: number) => num.toString().padStart(2, '0');

    if (h > 0) {
      return `${pad(h)}:${pad(m)}:${pad(s)}`;
    }
    return `${pad(m)}:${pad(s)}`;
  }, []);

  // Promise-based video metadata extractor
  const getVideoMetadata = useCallback((file: File): Promise<VideoMetadata> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      const url = URL.createObjectURL(file);
      video.src = url;

      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight
        });
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load video metadata. File might be corrupted or in an unsupported codec.'));
      };
    });
  }, []);

  // Extracts frames at specific intervals or timestamps and returns array of base64 images
  const extractVideoFrames = useCallback(async (
    file: File, 
    timestamps: number[], 
    targetWidth?: number,
    onProgress?: (index: number, total: number) => void
  ): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      const url = URL.createObjectURL(file);
      video.src = url;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Could not initialize 2D context on offscreen Canvas'));
        return;
      }

      const frames: string[] = [];
      let currentIndex = 0;

      video.onloadeddata = async () => {
        try {
          const width = targetWidth || video.videoWidth || 640;
          const scale = width / video.videoWidth;
          const height = video.videoHeight * scale;

          canvas.width = width;
          canvas.height = height;

          const extractNext = async () => {
            if (currentIndex >= timestamps.length) {
              URL.revokeObjectURL(url);
              resolve(frames);
              return;
            }

            const targetTime = timestamps[currentIndex];
            video.currentTime = targetTime;
          };

          video.onseeked = () => {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            frames.push(canvas.toDataURL('image/jpeg', 0.85));
            currentIndex++;

            if (onProgress) {
              onProgress(currentIndex, timestamps.length);
            }

            extractNext();
          };

          extractNext();
        } catch (e) {
          URL.revokeObjectURL(url);
          reject(e);
        }
      };

      video.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed during video decoding frame capture.'));
      };
    });
  }, []);

  return {
    isProcessing,
    setIsProcessing,
    progress,
    setProgress,
    error,
    setError,
    formatBytes,
    formatTime,
    getVideoMetadata,
    extractVideoFrames
  };
};

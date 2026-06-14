export type TabId =
  | 'dashboard'
  | 'image-convert'
  | 'image-compress'
  | 'image-resize'
  | 'image-crop'
  | 'image-rotate'
  | 'image-ocr'
  | 'image-remove-bg'
  | 'image-editor'
  | 'image-batch'
  | 'image-metadata'
  | 'image-color-extractor'
  | 'image-splitter'
  | 'image-collage'
  | 'base64-tool'
  | 'image-comparator'
  | 'smart-tools'
  | 'ai-object-detection'
  | 'ai-photo-restoration'
  | 'ai-face-detection'
  | 'ai-image-search'
  | 'ai-text-similarity'
  | 'ai-document-classification'
  | 'pdf-merge'
  | 'pdf-split'
  | 'pdf-to-img'
  | 'pdf-extract-text'
  | 'pdf-edit'
  | 'pdf-protect'
  | 'pdf-unlock'
  | 'pdf-form-filler'
  | 'pdf-page-number'
  | 'pdf-header-footer'
  | 'pdf-repair'
  | 'ocr-business-card'
  | 'ocr-table-extractor'
  | 'ocr-searchable-pdf'
  | 'ocr-multi-language'
  | 'ocr-receipt'
  | 'history'
  | 'guide'
  | 'batch-renamer'
  | 'qr-generator'
  | 'file-info'
  | 'file-comparator'
  | 'favorites-manager'
  | 'video-to-gif'
  | 'gif-editor'
  | 'video-compressor'
  | 'audio-extractor'
  | 'video-to-images'
  | 'screen-recorder'
  | 'webcam-capture'
  | 'media-info'
  | 'text-diff'
  | 'text-formatter'
  | 'markdown-editor'
  | 'text-to-speech'
  | 'speech-to-text'
  | 'password-generator'
  | 'csv-editor'
  | 'json-formatter'
  | 'chart-generator'
  | 'data-extractor'
  | 'unit-converter'
  | 'meme-generator'
  | 'certificate-maker'
  | 'social-media-banner'
  | 'gradient-generator'
  | 'palette-generator'
  | 'file-encryptor'
  | 'file-decryptor'
  | 'metadata-scrubber'
  | 'file-shredder'
  | 'steganography-tool'
  | 'share-menu'
  | 'onboarding'
  | 'keyboard-shortcuts';

export interface ProcessedFile {
  id: string;
  name: string;
  originalSize: number;
  processedSize?: number;
  originalType: string;
  processedType?: string;
  originalPreview: string;
  processedPreview?: string;
  status: 'idle' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
  file: File;
  processedBlob?: Blob;
}

export interface HistoryItem {
  id: string;
  action: string;
  fileName: string;
  timestamp: string;
  originalSize: number;
  processedSize: number;
  type: 'image' | 'pdf' | 'media' | 'text' | 'other';
  downloadUrl: string;
  originalUrl?: string; // Optional field for comparison view
}

export interface AppSettings {
  defaultQuality: number;
  defaultCompressRatio: number;
  maintainAspectRatio: boolean;
  historyLimit: number;
  language: 'ar' | 'en';
  theme: 'light' | 'dark';
  captionModel: string;
  summaryModel: string;
  qaModel: string;
}

import React, { Suspense } from 'react';

const Dashboard = React.lazy(() => import('../components/Dashboard').then(module => ({ default: module.Dashboard })));
const ImageTools = React.lazy(() => import('../components/ImageTools').then(module => ({ default: module.ImageTools })));
const PdfTools = React.lazy(() => import('../components/PdfTools').then(module => ({ default: module.PdfTools })));
const ImageCrop = React.lazy(() => import('../components/ImageCrop').then(module => ({ default: module.ImageCrop })));
const ImageRotate = React.lazy(() => import('../components/ImageRotate').then(module => ({ default: module.ImageRotate })));
const ImageOcr = React.lazy(() => import('../components/ImageOcr').then(module => ({ default: module.ImageOcr })));
const ImageRemoveBg = React.lazy(() => import('../components/ImageRemoveBg').then(module => ({ default: module.ImageRemoveBg })));
const ImageEditor = React.lazy(() => import('../components/ImageEditor').then(module => ({ default: module.ImageEditor })));
const ImageBatch = React.lazy(() => import('../components/ImageBatch').then(module => ({ default: module.ImageBatch })));
const ImageMetadata = React.lazy(() => import('../components/tools/images/ImageMetadata').then(module => ({ default: module.ImageMetadata })));
const ImageColorExtractor = React.lazy(() => import('../components/tools/images/ImageColorExtractor').then(module => ({ default: module.ImageColorExtractor })));
const ImageSplitter = React.lazy(() => import('../components/tools/images/ImageSplitter').then(module => ({ default: module.ImageSplitter })));
const ImageCollage = React.lazy(() => import('../components/tools/images/ImageCollage').then(module => ({ default: module.ImageCollage })));
const Base64Tool = React.lazy(() => import('../components/tools/images/Base64Tool').then(module => ({ default: module.Base64Tool })));
const ImageComparator = React.lazy(() => import('../components/tools/images/ImageComparator').then(module => ({ default: module.ImageComparator })));
const SmartTools = React.lazy(() => import('../components/SmartTools').then(module => ({ default: module.SmartTools })));
const PdfExtractText = React.lazy(() => import('../components/PdfExtractText').then(module => ({ default: module.PdfExtractText })));
const PdfEdit = React.lazy(() => import('../components/PdfEdit').then(module => ({ default: module.PdfEdit })));
const PDFProtect = React.lazy(() => import('../components/tools/pdf/PDFProtect').then(module => ({ default: module.PDFProtect })));
const PDFUnlock = React.lazy(() => import('../components/tools/pdf/PDFUnlock').then(module => ({ default: module.PDFUnlock })));
const PDFFormFiller = React.lazy(() => import('../components/tools/pdf/PDFFormFiller').then(module => ({ default: module.PDFFormFiller })));
const PDFPageNumber = React.lazy(() => import('../components/tools/pdf/PDFPageNumber').then(module => ({ default: module.PDFPageNumber })));
const PDFHeaderFooter = React.lazy(() => import('../components/tools/pdf/PDFHeaderFooter').then(module => ({ default: module.PDFHeaderFooter })));
const PDFRepair = React.lazy(() => import('../components/tools/pdf/PDFRepair').then(module => ({ default: module.PDFRepair })));
const BusinessCardScanner = React.lazy(() => import('../components/tools/ocr/BusinessCardScanner').then(module => ({ default: module.BusinessCardScanner })));
const TableExtractor = React.lazy(() => import('../components/tools/ocr/TableExtractor').then(module => ({ default: module.TableExtractor })));
const ImageToSearchablePDF = React.lazy(() => import('../components/tools/ocr/ImageToSearchablePDF').then(module => ({ default: module.ImageToSearchablePDF })));
const MultiLanguageOCR = React.lazy(() => import('../components/tools/ocr/MultiLanguageOCR').then(module => ({ default: module.MultiLanguageOCR })));
const ReceiptScanner = React.lazy(() => import('../components/tools/ocr/ReceiptScanner').then(module => ({ default: module.ReceiptScanner })));
const GuideCenter = React.lazy(() => import('../components/GuideCenter').then(module => ({ default: module.GuideCenter })));
const TextDiff = React.lazy(() => import('../components/tools/text/TextDiff').then(module => ({ default: module.TextDiff })));
const TextFormatter = React.lazy(() => import('../components/tools/text/TextFormatter').then(module => ({ default: module.TextFormatter })));
const MarkdownEditor = React.lazy(() => import('../components/tools/text/MarkdownEditor').then(module => ({ default: module.MarkdownEditor })));
const TextToSpeech = React.lazy(() => import('../components/tools/text/TextToSpeech').then(module => ({ default: module.TextToSpeech })));
const SpeechToText = React.lazy(() => import('../components/tools/text/SpeechToText').then(module => ({ default: module.SpeechToText })));
const PasswordGenerator = React.lazy(() => import('../components/tools/text/PasswordGenerator').then(module => ({ default: module.PasswordGenerator })));
const BatchRenamer = React.lazy(() => import('../components/tools/utilities/BatchRenamer').then(module => ({ default: module.BatchRenamer })));
const FileInfo = React.lazy(() => import('../components/tools/utilities/FileInfo').then(module => ({ default: module.FileInfo })));
const FileComparator = React.lazy(() => import('../components/tools/utilities/FileComparator').then(module => ({ default: module.FileComparator })));
const FavoritesManager = React.lazy(() => import('../components/tools/utilities/FavoritesManager').then(module => ({ default: module.FavoritesManager })));
const HistoryDashboard = React.lazy(() => import('../components/tools/utilities/HistoryDashboard').then(module => ({ default: module.HistoryDashboard })));
const ShareMenu = React.lazy(() => import('../components/tools/utilities/ShareMenu').then(module => ({ default: module.ShareMenu })));
const UniversalConverter = React.lazy(() => import('../components/tools/utilities/UniversalConverter').then(module => ({ default: module.UniversalConverter })));
const FileEncryptor = React.lazy(() => import('../components/tools/security/FileEncryptor').then(module => ({ default: module.FileEncryptor })));
const FileDecryptor = React.lazy(() => import('../components/tools/security/FileDecryptor').then(module => ({ default: module.FileDecryptor })));
const MetadataScrubber = React.lazy(() => import('../components/tools/security/MetadataScrubber').then(module => ({ default: module.MetadataScrubber })));
const FileShredder = React.lazy(() => import('../components/tools/security/FileShredder').then(module => ({ default: module.FileShredder })));
const SteganographyTool = React.lazy(() => import('../components/tools/security/SteganographyTool').then(module => ({ default: module.SteganographyTool })));
const CSVEditor = React.lazy(() => import('../components/tools/data/CSVEditor').then(module => ({ default: module.CSVEditor })));
const JSONFormatter = React.lazy(() => import('../components/tools/data/JSONFormatter').then(module => ({ default: module.JSONFormatter })));
const ChartGenerator = React.lazy(() => import('../components/tools/data/ChartGenerator').then(module => ({ default: module.ChartGenerator })));
const DataExtractor = React.lazy(() => import('../components/tools/data/DataExtractor').then(module => ({ default: module.DataExtractor })));
const UnitConverter = React.lazy(() => import('../components/tools/data/UnitConverter').then(module => ({ default: module.UnitConverter })));
const MemeGenerator = React.lazy(() => import('../components/tools/design/MemeGenerator').then(module => ({ default: module.MemeGenerator })));
const CertificateMaker = React.lazy(() => import('../components/tools/design/CertificateMaker').then(module => ({ default: module.CertificateMaker })));
const SocialMediaBanner = React.lazy(() => import('../components/tools/design/SocialMediaBanner').then(module => ({ default: module.SocialMediaBanner })));
const QRGenerator = React.lazy(() => import('../components/tools/design/QRGenerator').then(module => ({ default: module.QRGenerator })));
const GradientGenerator = React.lazy(() => import('../components/tools/design/GradientGenerator').then(module => ({ default: module.GradientGenerator })));
const PaletteGenerator = React.lazy(() => import('../components/tools/design/PaletteGenerator').then(module => ({ default: module.PaletteGenerator })));
const ObjectDetector = React.lazy(() => import('../components/tools/ai/ObjectDetector').then(module => ({ default: module.ObjectDetector })));
const PhotoRestorer = React.lazy(() => import('../components/tools/ai/PhotoRestorer').then(module => ({ default: module.PhotoRestorer })));
const FaceDetection = React.lazy(() => import('../components/tools/ai/FaceDetection').then(module => ({ default: module.FaceDetection })));
const ImageSearch = React.lazy(() => import('../components/tools/ai/ImageSearch').then(module => ({ default: module.ImageSearch })));
const TextSimilarity = React.lazy(() => import('../components/tools/ai/TextSimilarity').then(module => ({ default: module.TextSimilarity })));
const DocumentClassifier = React.lazy(() => import('../components/tools/ai/DocumentClassifier').then(module => ({ default: module.DocumentClassifier })));































// Text & Writing Tools







// Advanced Local Utilities







// Security and Privacy Tools






// Data Tools






// Design Tools







// Advanced Local AI Tools







// Video & Multimedia tools loaded lazily for elite performance
const VideoToGIF = React.lazy(() => import('../components/tools/media/VideoToGIF').then(m => ({ default: m.VideoToGIF })));
const GIFEditor = React.lazy(() => import('../components/tools/media/GIFEditor').then(m => ({ default: m.GIFEditor })));
const VideoCompressor = React.lazy(() => import('../components/tools/media/VideoCompressor').then(m => ({ default: m.VideoCompressor })));
const AudioExtractor = React.lazy(() => import('../components/tools/media/AudioExtractor').then(m => ({ default: m.AudioExtractor })));
const VideoToImages = React.lazy(() => import('../components/tools/media/VideoToImages').then(m => ({ default: m.VideoToImages })));
const ScreenRecorder = React.lazy(() => import('../components/tools/media/ScreenRecorder').then(m => ({ default: m.ScreenRecorder })));
const WebcamCapture = React.lazy(() => import('../components/tools/media/WebcamCapture').then(m => ({ default: m.WebcamCapture })));
const MediaInfo = React.lazy(() => import('../components/tools/media/MediaInfo').then(m => ({ default: m.MediaInfo })));

import { TabId, HistoryItem } from '../types';

interface RenderActiveTabProps {
  activeTab: TabId;
  lang: 'ar' | 'en';
  favorites: string[];
  toggleFavorite: (id: string) => void;
  setActiveTab: (tab: TabId) => void;
  historyLength: number;
  processedHistory: HistoryItem[];
  handleAddHistoryItem: any;
  handleClearHistory: () => void;
  handleDeleteHistoryItem: (id: string) => void;
  settingsLanguage: 'ar' | 'en';
}

export function renderActiveTab({
  activeTab,
  lang,
  favorites,
  toggleFavorite,
  setActiveTab,
  historyLength,
  processedHistory,
  handleAddHistoryItem,
  handleClearHistory,
  handleDeleteHistoryItem,
  settingsLanguage
}: RenderActiveTabProps) {
  
  const renderInner = () => {
    switch (activeTab) {
    case 'dashboard':
      return (
        <Dashboard 
          setActiveTab={setActiveTab} 
          favorites={favorites} 
          onToggleFavorite={toggleFavorite}
          lang={lang}
          historyLength={historyLength}
        />
      );

    case 'image-convert':
      return <ImageTools toolType="convert" onAddHistoryItem={handleAddHistoryItem} />;

    case 'image-compress':
      return <ImageTools toolType="compress" onAddHistoryItem={handleAddHistoryItem} />;

    case 'image-resize':
      return <ImageTools toolType="resize" onAddHistoryItem={handleAddHistoryItem} />;

    case 'image-crop':
      return <ImageCrop onAddHistoryItem={handleAddHistoryItem} />;

    case 'image-rotate':
      return <ImageRotate onAddHistoryItem={handleAddHistoryItem} />;

    case 'image-ocr':
      return <ImageOcr onAddHistoryItem={handleAddHistoryItem} />;

    case 'image-remove-bg':
      return <ImageRemoveBg onAddHistoryItem={handleAddHistoryItem} />;

    case 'image-editor':
      return <ImageEditor onAddHistoryItem={handleAddHistoryItem} />;

    case 'image-batch':
      return <ImageBatch onAddHistoryItem={handleAddHistoryItem} />;

    case 'image-metadata':
      return <ImageMetadata lang={lang} />;

    case 'image-color-extractor':
      return <ImageColorExtractor lang={lang} />;

    case 'image-splitter':
      return <ImageSplitter lang={lang} />;

    case 'image-collage':
      return <ImageCollage lang={lang} />;

    case 'base64-tool':
      return <Base64Tool lang={lang} />;

    case 'image-comparator':
      return <ImageComparator lang={lang} />;

    case 'smart-tools':
      return <SmartTools lang={lang} />;

    case 'pdf-merge':
      return <PdfTools toolType="merge" onAddHistoryItem={handleAddHistoryItem} />;

    case 'pdf-split':
      return <PdfTools toolType="split" onAddHistoryItem={handleAddHistoryItem} />;

    case 'pdf-to-img':
      return <PdfTools toolType="to-img" onAddHistoryItem={handleAddHistoryItem} />;

    case 'pdf-extract-text':
      return <PdfExtractText onAddHistoryItem={handleAddHistoryItem} />;

    case 'pdf-edit':
      return <PdfEdit onAddHistoryItem={handleAddHistoryItem} />;

    case 'pdf-protect':
      return <PDFProtect lang={lang} onAddHistoryItem={handleAddHistoryItem} />;

    case 'pdf-unlock':
      return <PDFUnlock lang={lang} onAddHistoryItem={handleAddHistoryItem} />;

    case 'pdf-form-filler':
      return <PDFFormFiller lang={lang} onAddHistoryItem={handleAddHistoryItem} />;

    case 'pdf-page-number':
      return <PDFPageNumber lang={lang} onAddHistoryItem={handleAddHistoryItem} />;

    case 'pdf-header-footer':
      return <PDFHeaderFooter lang={lang} onAddHistoryItem={handleAddHistoryItem} />;

    case 'pdf-repair':
      return <PDFRepair lang={lang} onAddHistoryItem={handleAddHistoryItem} />;

    case 'ocr-business-card':
      return <BusinessCardScanner lang={lang} onAddHistoryItem={handleAddHistoryItem} />;

    case 'ocr-table-extractor':
      return <TableExtractor lang={lang} onAddHistoryItem={handleAddHistoryItem} />;

    case 'ocr-searchable-pdf':
      return <ImageToSearchablePDF lang={lang} onAddHistoryItem={handleAddHistoryItem} />;

    case 'ocr-multi-language':
      return <MultiLanguageOCR lang={lang} onAddHistoryItem={handleAddHistoryItem} />;

    case 'ocr-receipt':
      return <ReceiptScanner lang={lang} onAddHistoryItem={handleAddHistoryItem} />;

    case 'ai-object-detection':
      return <ObjectDetector lang={lang} onAddHistoryItem={handleAddHistoryItem} />;

    case 'ai-photo-restoration':
      return <PhotoRestorer lang={lang} onAddHistoryItem={handleAddHistoryItem} />;

    case 'ai-face-detection':
      return <FaceDetection lang={lang} onAddHistoryItem={handleAddHistoryItem} />;

    case 'ai-image-search':
      return <ImageSearch lang={lang} />;

    case 'ai-text-similarity':
      return <TextSimilarity lang={lang} />;

    case 'ai-document-classification':
      return <DocumentClassifier lang={lang} />;

    case 'batch-renamer':
      return <BatchRenamer lang={lang} onAddHistoryItem={handleAddHistoryItem} />;

    case 'qr-generator':
      return <QRGenerator lang={lang} onAddHistoryItem={handleAddHistoryItem} />;

    case 'csv-editor':
      return <CSVEditor lang={lang} onAddHistoryItem={handleAddHistoryItem} />;

    case 'json-formatter':
      return <JSONFormatter lang={lang} onAddHistoryItem={handleAddHistoryItem} />;

    case 'chart-generator':
      return <ChartGenerator lang={lang} onAddHistoryItem={handleAddHistoryItem} />;

    case 'data-extractor':
      return <DataExtractor lang={lang} onAddHistoryItem={handleAddHistoryItem} />;

    case 'unit-converter':
      return <UnitConverter lang={lang} onAddHistoryItem={handleAddHistoryItem} />;

    case 'meme-generator':
      return <MemeGenerator lang={lang} onAddHistoryItem={handleAddHistoryItem} />;

    case 'certificate-maker':
      return <CertificateMaker lang={lang} onAddHistoryItem={handleAddHistoryItem} />;

    case 'social-media-banner':
      return <SocialMediaBanner lang={lang} onAddHistoryItem={handleAddHistoryItem} />;

    case 'gradient-generator':
      return <GradientGenerator lang={lang} onAddHistoryItem={handleAddHistoryItem} />;

    case 'palette-generator':
      return <PaletteGenerator lang={lang} onAddHistoryItem={handleAddHistoryItem} />;

    case 'file-info':
      return <FileInfo lang={lang} />;

    case 'file-comparator':
      return <FileComparator lang={lang} />;

    case 'favorites-manager':
      return (
        <FavoritesManager 
          lang={lang} 
          favorites={favorites} 
          onToggleFavorite={toggleFavorite} 
          setActiveTab={setActiveTab}
        />
      );

    case 'history':
      return (
        <HistoryDashboard 
          lang={lang}
          historyList={processedHistory} 
          onClearHistory={handleClearHistory} 
          onRemoveHistoryItem={handleDeleteHistoryItem} 
        />
      );

    case 'guide':
      return (
        <GuideCenter 
          lang={lang}
          setActiveTab={setActiveTab}
        />
      );

    case 'text-diff':
      return <TextDiff lang={lang} onAddHistoryItem={handleAddHistoryItem} />;

    case 'text-formatter':
      return <TextFormatter lang={lang} onAddHistoryItem={handleAddHistoryItem} />;

    case 'markdown-editor':
      return <MarkdownEditor lang={lang} onAddHistoryItem={handleAddHistoryItem} />;

    case 'text-to-speech':
      return <TextToSpeech lang={lang} onAddHistoryItem={handleAddHistoryItem} />;

    case 'speech-to-text':
      return <SpeechToText lang={lang} onAddHistoryItem={handleAddHistoryItem} />;

    case 'password-generator':
      return <PasswordGenerator lang={lang} onAddHistoryItem={handleAddHistoryItem} />;

    // Missing rendering blocks (BUG 1)
    case 'file-encryptor':
      return <FileEncryptor lang={lang} onAddHistoryItem={handleAddHistoryItem} />;

    case 'file-decryptor':
      return <FileDecryptor lang={lang} onAddHistoryItem={handleAddHistoryItem} />;

    case 'metadata-scrubber':
      return <MetadataScrubber lang={lang} onAddHistoryItem={handleAddHistoryItem} />;

    case 'file-shredder':
      return <FileShredder lang={lang} onAddHistoryItem={handleAddHistoryItem} />;

    case 'steganography-tool':
      return <SteganographyTool lang={lang} onAddHistoryItem={handleAddHistoryItem} />;

    case 'share-menu':
      return <ShareMenu lang={lang} />;

    // Video & Multimedia Lazy Loaded Sections
    case 'video-to-gif':
    case 'gif-editor':
    case 'video-compressor':
    case 'audio-extractor':
    case 'video-to-images':
    case 'screen-recorder':
    case 'webcam-capture':
    case 'media-info':
      return (
        <React.Suspense fallback={
          <div className="flex flex-col items-center justify-center p-12 text-center space-y-3 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/50 animate-pulse">
            <div className="w-8 h-8 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
            <span className="text-xs text-slate-500 font-extrabold">
              {settingsLanguage === 'ar' ? 'جاري تهيئة وتحميل أداة الوسائط...' : 'Configuring and streaming dynamic media assets...'}
            </span>
          </div>
        }>
          {activeTab === 'video-to-gif' && (
            <VideoToGIF lang={lang} onAddHistoryItem={handleAddHistoryItem as any} />
          )}

          {activeTab === 'gif-editor' && (
            <GIFEditor lang={lang} onAddHistoryItem={handleAddHistoryItem as any} />
          )}

          {activeTab === 'video-compressor' && (
            <VideoCompressor lang={lang} onAddHistoryItem={handleAddHistoryItem as any} />
          )}

          {activeTab === 'audio-extractor' && (
            <AudioExtractor lang={lang} onAddHistoryItem={handleAddHistoryItem as any} />
          )}

          {activeTab === 'video-to-images' && (
            <VideoToImages lang={lang} onAddHistoryItem={handleAddHistoryItem as any} />
          )}

          {activeTab === 'screen-recorder' && (
            <ScreenRecorder lang={lang} onAddHistoryItem={handleAddHistoryItem as any} />
          )}

          {activeTab === 'webcam-capture' && (
            <WebcamCapture lang={lang} onAddHistoryItem={handleAddHistoryItem as any} />
          )}

          {activeTab === 'media-info' && (
            <MediaInfo lang={lang} onAddHistoryItem={handleAddHistoryItem as any} />
          )}
        </React.Suspense>
      );

    default: return null;
    }
  };

  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-3 bg-slate-50 border border-slate-100 dark:bg-slate-900 dark:border-slate-800 rounded-3xl min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
        <span className="text-xs text-slate-500 font-extrabold">Loading Utility...</span>
      </div>
    }>
      {renderInner()}
    </Suspense>
  );
};
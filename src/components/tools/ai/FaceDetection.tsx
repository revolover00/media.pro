import React, { useState, useEffect, useRef } from 'react';
import { useAIModel } from '../../../hooks/useAIModel';
import JSZip from 'jszip';
import { 
  Users, 
  Trash2, 
  Download, 
  Loader2, 
  Sparkles, 
  Image as ImageIcon,
  EyeOff, 
  FolderArchive,
  Grid,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface FaceDetectionProps {
  lang: 'ar' | 'en';
  onAddHistoryItem: (
    itemData: { action: string; fileName: string; originalSize: number; processedSize: number; type: 'image' },
    blob: Blob,
    originalBlobOrUrl: Blob | string
  ) => void;
}

interface FaceItem {
  id: string;
  box: { xmin: number; ymin: number; xmax: number; ymax: number };
  score: number;
  dataUrl: string; // cropped face thumbnail image URL
}

export const FaceDetection: React.FC<FaceDetectionProps> = ({ lang, onAddHistoryItem }) => {
  const { status, loadModel, cancelLoading } = useAIModel();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [faces, setFaces] = useState<FaceItem[]>([]);
  const [detecting, setDetecting] = useState<boolean>(false);
  const [blurFaces, setBlurFaces] = useState<boolean>(false);
  const [minConfidence, setMinConfidence] = useState<number>(45); // threshold 0-100
  const [toast, setToast] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Clean previews on unmount
  useEffect(() => {
    return () => {
      if (selectedImage) URL.revokeObjectURL(selectedImage);
    };
  }, [selectedImage]);

  const handleImageUploaded = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (selectedImage) URL.revokeObjectURL(selectedImage);

    const file = files[0];
    setImageFile(file);
    setSelectedImage(URL.createObjectURL(file));
    setFaces([]);
  };

  // Re-draw main image, bounding boxes and optional privacy blurs on the canvas
  useEffect(() => {
    if (!selectedImage) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = selectedImage;
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      // Draw original image first
      ctx.drawImage(img, 0, 0);

      // Filter faces based on confidence slider
      const activeFaces = faces.filter(f => f.score * 100 >= minConfidence);

      if (blurFaces) {
        // Apply Privacy Blur on detected coordinates
        activeFaces.forEach(face => {
          const { xmin, ymin, xmax, ymax } = face.box;
          const w = xmax - xmin;
          const h = ymax - ymin;

          // Double check box is valid
          if (w <= 0 || h <= 0) return;

          // Create temporary offscreen buffer for face
          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d');
          if (tempCtx) {
            tempCanvas.width = w;
            tempCanvas.height = h;

            // Draw just the face portion onto temp canvas
            tempCtx.drawImage(img, xmin, ymin, w, h, 0, 0, w, h);

            // Apply several pixelated blurs or standard canvas blur
            ctx.save();
            ctx.filter = 'blur(18px)';
            ctx.drawImage(tempCanvas, xmin, ymin, w, h);
            ctx.restore();
          }
        });
      }

      // Draw bounding boxes around faces
      activeFaces.forEach((face, idx) => {
        const { xmin, ymin, xmax, ymax } = face.box;
        const w = xmax - xmin;
        const h = ymax - ymin;

        if (w <= 0 || h <= 0) return;

        // BBox frame
        ctx.strokeStyle = '#ef4444'; // Red bounding frames
        ctx.lineWidth = Math.max(2, Math.round(canvas.width / 200));
        ctx.strokeRect(xmin, ymin, w, h);

        // Render index number
        ctx.fillStyle = '#ef4444';
        const fontSize = Math.max(12, Math.round(canvas.width / 45));
        ctx.font = `bold ${fontSize}px sans-serif`;
        const text = `#${idx + 1} (${(face.score * 100).toFixed(0)}%)`;
        const textW = ctx.measureText(text).width;

        let txtY = ymin - 6;
        if (txtY < fontSize) txtY = ymin + fontSize + 5;

        ctx.fillRect(xmin - 1, txtY - fontSize - 2, textW + 8, fontSize + 5);

        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, xmin + 3, txtY - 2);
      });
    };
  }, [selectedImage, faces, blurFaces, minConfidence]);

  const runFaceDetection = async () => {
    if (!selectedImage || !imageFile) return;

    setDetecting(true);
    setFaces([]);

    try {
      // 1. Load YOLOv8 face detection (or detr person models as fallback)
      // Transformers.js provides Xenova/yolov8n-face for quick local bounding boxes
      const detector = await loadModel('object-detection', 'Xenova/yolov8n-face');

      // Run local face inference
      const response = await detector(selectedImage, { threshold: 0.1 });

      // Transform response into Face ID crops
      const img = new Image();
      img.src = selectedImage;
      img.onload = () => {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;

        const croppedFaces: FaceItem[] = response.map((det: any, idx: number) => {
          const { xmin, ymin, xmax, ymax } = det.box;
          const w = xmax - xmin;
          const h = ymax - ymin;

          let dataUrl = '';
          if (w > 0 && h > 0) {
            tempCanvas.width = w;
            tempCanvas.height = h;
            // Crop face portion from original image
            tempCtx.drawImage(img, xmin, ymin, w, h, 0, 0, w, h);
            dataUrl = tempCanvas.toDataURL('image/jpeg', 0.9);
          }

          return {
            id: `face_${idx}_${Math.random().toString(36).substr(2, 5)}`,
            box: det.box,
            score: det.score,
            dataUrl,
          };
        });

        // Set faces
        setFaces(croppedFaces);
        showToast(lang === 'ar' ? `تم كشف ${croppedFaces.length} وجهاً بنجاح!` : `Successfully detected ${croppedFaces.length} faces!`);
      };

    } catch (err: any) {
      console.error(err);
      showToast(lang === 'ar' ? 'فشل معالجة الوجوه.' : 'Face detection failed.');
    } finally {
      setDetecting(false);
    }
  };

  // Download cropped face thumbnails as a single ZIP file
  const handleDownloadAllFaces = async () => {
    const activeFaces = faces.filter(f => f.score * 100 >= minConfidence);
    if (activeFaces.length === 0) return;

    try {
      const zip = new JSZip();
      
      activeFaces.forEach((face, idx) => {
        if (!face.dataUrl) return;
        const base64Data = face.dataUrl.replace(/^data:image\/(png|jpeg);base64,/, '');
        zip.file(`face_${idx + 1}.jpg`, base64Data, { base64: true });
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `faces_${imageFile?.name || 'photo'}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(lang === 'ar' ? 'اكتمل تنزيل الوجوه كملف ZIP!' : 'Faciology ZIP download complete!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadProcessedImage = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageFile) return;

    canvas.toBlob((blob) => {
      if (!blob) return;

      onAddHistoryItem(
        {
          action: lang === 'ar' ? 'تعتيم وكشف الوجوه' : 'Face Detection Anonymizer',
          fileName: `anonymized_${imageFile.name}`,
          originalSize: imageFile.size,
          processedSize: blob.size,
          type: 'image',
        },
        blob,
        imageFile
      );

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `detected_faces_${imageFile.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 'image/jpeg', 0.95);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-purple-100 dark:border-slate-700 shadow-sm space-y-6">
      
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-900 border border-purple-500/30 text-white py-3 px-5 rounded-2xl shadow-xl animate-slideIn">
          <Users className="w-4 h-4 text-rose-400" />
          <span className="text-xs font-bold font-sans">{toast}</span>
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-50 dark:border-slate-700 pb-5">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-purple-600 to-rose-600 p-2.5 rounded-2xl text-white shadow-md">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg text-slate-950 dark:text-white">
              {lang === 'ar' ? 'التعرف على الوجوه واقتصاصها وتعتيمها' : 'Face Analyzer & Privacy Blur'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'ar'
                ? 'نموذج YOLOv8n-Face فائق السرعة لكشف تعابير الوجوه في الصور الجماعية وتعتيمها لحماية الخصوصية.'
                : 'Local YOLOv8n-face topology designed to crop heads separately and toggle privacy blurs.'}
            </p>
          </div>
        </div>
      </div>

      {/* Model progress widget */}
      {status.loading && (
        <div className="bg-purple-50 dark:bg-slate-700/50 border border-purple-100 dark:border-purple-900 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold flex items-center gap-2 text-purple-900 dark:text-purple-300">
              <Loader2 className="w-4 h-4 animate-spin text-purple-650" />
              {lang === 'ar' ? 'جاري تهيئة كاشف الوجوه YOLOv8...' : 'Spinning up YOLOv8 Face detector...'}
            </span>
            <span className="font-bold font-mono text-purple-800 dark:text-purple-400">{status.progress}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-purple-500 to-rose-500 h-full rounded-full transition-all duration-300" 
              style={{ width: `${status.progress}%` }}
            />
          </div>
          <button onClick={cancelLoading} className="text-[10px] text-red-500 hover:underline font-bold">
            {lang === 'ar' ? 'إلغاء تحميل النموذج' : 'Cancel loader'}
          </button>
        </div>
      )}

      {/* Main Workspace Frame */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Canvas Display View */}
        <div className="lg:col-span-8 space-y-4">
          <div className="border-2 border-dashed border-slate-250 dark:border-slate-700 rounded-3xl p-6 bg-slate-50 dark:bg-slate-900/40 flex flex-col items-center justify-center min-h-[300px]">
            {selectedImage ? (
              <div className="space-y-4 w-full flex flex-col items-center">
                
                <div className="relative max-w-full overflow-hidden rounded-2xl shadow-xl border border-slate-150 dark:border-slate-850">
                  <canvas ref={canvasRef} className="max-h-[420px] max-w-full object-contain mx-auto" />
                </div>

                {!detecting && (
                  <button
                    onClick={() => {
                      setSelectedImage(null);
                      setImageFile(null);
                      setFaces([]);
                    }}
                    className="text-xs font-bold text-red-500 bg-red-50 dark:bg-rose-950/25 hover:bg-red-100 px-4 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    {lang === 'ar' ? 'تغيير صورة الوجوه' : 'Change Photo'}
                  </button>
                )}

              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="bg-rose-50 dark:bg-slate-755 text-rose-500 p-4 rounded-full inline-block">
                  <Users className="w-8 h-8" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-705 dark:text-slate-350">{lang === 'ar' ? 'ضع صورة جماعية أو فردية هنا' : 'Drop a group photo here'}</div>
                  <p className="text-xs text-slate-400 mt-1">{lang === 'ar' ? 'صيغ PNG, JPEG بحد أقصى 25MB' : 'Supports JPG, PNG up to 25MB'}</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUploaded}
                  className="hidden"
                  id="face-img-picker"
                />
                <label
                  htmlFor="face-img-picker"
                  className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-rose-600 hover:opacity-95 text-white font-extrabold py-2.5 px-6 rounded-2xl text-xs cursor-pointer shadow transition-all"
                >
                  {lang === 'ar' ? 'تحميل صورة جماعية' : 'Select Group Photo'}
                </label>
              </div>
            )}
          </div>

          {selectedImage && !status.loading && (
            <button
              onClick={runFaceDetection}
              disabled={detecting}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-md cursor-pointer disabled:opacity-50 transition-colors text-xs"
            >
              {detecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{lang === 'ar' ? 'جاري فحص ملامح الوجوه واقتصاص البعد الفردي...' : 'Scanning facial meshes & isolating eyes...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'كشف وتحديد الوجوه الآن' : 'Scan & Locate Faces'}</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Side Crops & Control Panel */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-slate-55 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-4">
            <h3 className="font-bold text-xs text-slate-800 dark:text-slate-300 flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-750">
              <Sparkles className="w-4 h-4 text-rose-500" />
              <span>{lang === 'ar' ? 'لوحة التحكم والخصوصية' : 'Anonymity & Sensitivity'}</span>
            </h3>

            {/* Slider for sensitivity */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400">{lang === 'ar' ? 'أدنى نسبة تطابق:' : 'Detection Sensitivity:'}</span>
                <span className="font-extrabold text-rose-500 font-mono">{minConfidence}%</span>
              </div>
              <input 
                type="range"
                min="20"
                max="85"
                value={minConfidence}
                onChange={(e) => setMinConfidence(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-750 accent-rose-500 rounded-lg cursor-pointer"
              />
            </div>

            {/* Blur Toggle */}
            <div className="flex items-center justify-between border-t border-slate-250 dark:border-slate-750 pt-3">
              <div className="flex items-center gap-2">
                <EyeOff className="w-4 h-4 text-rose-500" />
                <span className="text-xs font-bold text-slate-750 dark:text-slate-350">{lang === 'ar' ? 'تعتيم وحجب الوجوه:' : 'Blur Faces (Anonymize):'}</span>
              </div>
              <button
                onClick={() => setBlurFaces(!blurFaces)}
                className={`w-12 h-6.5 rounded-full p-1 transition-colors relative cursor-pointer ${blurFaces ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <div className={`w-4.5 h-4.5 bg-white rounded-full transition-transform absolute top-1 ${blurFaces ? (lang === 'ar' ? 'left-1' : 'right-1') : (lang === 'ar' ? 'right-1' : 'left-1')}`} />
              </button>
            </div>
          </div>

          {/* Cropped individual thumbnails */}
          {faces.filter(f => f.score * 100 >= minConfidence).length > 0 && (
            <div className="bg-slate-55 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-4 animate-fadeIn">
              <h3 className="font-bold text-xs text-slate-800 dark:text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Grid className="w-4 h-4 text-purple-600" />
                  <span>{lang === 'ar' ? 'الوجوه المكتشفة منفرداً' : 'Detected Heads'}</span>
                </span>
                <span className="bg-purple-100 dark:bg-purple-950 text-purple-850 dark:text-purple-300 py-0.5 px-2 rounded-lg text-xs font-extrabold font-mono">
                  {faces.filter(f => f.score * 100 >= minConfidence).length}
                </span>
              </h3>

              {/* Crop Grid */}
              <div className="grid grid-cols-4 gap-2 max-h-[140px] overflow-y-auto pr-1">
                {faces
                  .filter(f => f.score * 100 >= minConfidence)
                  .map((face, index) => (
                    <div 
                      key={face.id}
                      className="relative pb-[100%] rounded-lg overflow-hidden border border-slate-205 bg-black/10 group hover:border-rose-500 transition-colors"
                      title={`#${index + 1} - ${(face.score * 100).toFixed(0)}%`}
                    >
                      {face.dataUrl ? (
                        <img 
                          src={face.dataUrl} 
                          alt={`Clipped head ${index + 1}`} 
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-200">
                          <ImageIcon className="w-4 h-4 text-slate-400" />
                        </div>
                      )}
                    </div>
                  ))}
              </div>

              {/* Download / ZIP bulk option */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-750">
                <button
                  onClick={handleDownloadAllFaces}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-2 px-4 rounded-xl text-xs transition-opacity cursor-pointer text-center"
                >
                  <FolderArchive className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'تحميل كافة الوجوه كملف ZIP' : 'Download All as ZIP'}</span>
                </button>

                <button
                  onClick={handleDownloadProcessedImage}
                  className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-250 font-bold py-2 px-4 rounded-xl text-xs transition-colors cursor-pointer text-center border border-slate-205 dark:border-slate-700"
                >
                  <Download className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'تحميل الصورة النهائية المعدلة' : 'Save Final Image'}</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};

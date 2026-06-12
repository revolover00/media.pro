import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, 
  Trash2, 
  Crop,
  RefreshCw,
  Maximize2,
  Minimize2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { UploadZone } from './UploadZone';
import { HistoryItem } from '../types';
import { formatBytes, getImageDimensions } from '../utils/imageUtils';

interface ImageCropProps {
  onAddHistoryItem: (item: Omit<HistoryItem, 'id' | 'timestamp' | 'downloadUrl'>, blob: Blob, originalBlobOrUrl?: Blob | string) => string;
}

export const ImageCrop: React.FC<ImageCropProps> = ({ onAddHistoryItem }) => {
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<string>('free'); // 'free' | '1:1' | '4:3' | '16:9'
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [resultImg, setResultImg] = useState<{ blob: Blob; url: string; size: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Crop box parameters in percentages (0 to 100)
  const [cropBox, setCropBox] = useState({ x: 10, y: 10, width: 80, height: 80 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, boxX: 0, boxY: 0 });
  
  // Resize anchor (e.g. 'nw', 'ne', 'se', 'sw' or null)
  const [activeHandle, setActiveHandle] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
      if (resultImg?.url) URL.revokeObjectURL(resultImg.url);
    };
  }, [filePreview, resultImg]);

  const handleFileDrop = (files: File[]) => {
    if (files.length > 0) {
      const selectedFile = files[0];
      setFile(selectedFile);
      setResultImg(null);
      setErrorMsg(null);
      const url = URL.createObjectURL(selectedFile);
      setFilePreview(url);
      setCropBox({ x: 20, y: 20, width: 60, height: 60 });
    }
  };

  const handleReset = () => {
    setFile(null);
    setFilePreview('');
    setResultImg(null);
    setErrorMsg(null);
    setAspectRatio('free');
  };

  // Adjust crop box based on selected aspect ratio
  const applyRatio = (ratioType: string, currentBox = cropBox) => {
    setAspectRatio(ratioType);
    if (!imageRef.current) return;

    const imgWidth = imageRef.current.clientWidth;
    const imgHeight = imageRef.current.clientHeight;
    
    let newWidth = currentBox.width;
    let newHeight = currentBox.height;

    if (ratioType === '1:1') {
      const sizePix = Math.min(newWidth * imgWidth / 100, newHeight * imgHeight / 100);
      newWidth = (sizePix / imgWidth) * 100;
      newHeight = (sizePix / imgHeight) * 100;
    } else if (ratioType === '4:3') {
      const sizePixWidth = newWidth * imgWidth / 100;
      const sizePixHeight = sizePixWidth * (3 / 4);
      newHeight = (sizePixHeight / imgHeight) * 100;
      if (newHeight > 100 - currentBox.y) {
        newHeight = 100 - currentBox.y;
        newWidth = ((newHeight * imgHeight / 100) * (4 / 3) / imgWidth) * 100;
      }
    } else if (ratioType === '16:9') {
      const sizePixWidth = newWidth * imgWidth / 100;
      const sizePixHeight = sizePixWidth * (9 / 16);
      newHeight = (sizePixHeight / imgHeight) * 100;
      if (newHeight > 100 - currentBox.y) {
        newHeight = 100 - currentBox.y;
        newWidth = ((newHeight * imgHeight / 100) * (16 / 9) / imgWidth) * 100;
      }
    }

    // Keep within bounds
    newWidth = Math.min(100 - currentBox.x, Math.max(5, newWidth));
    newHeight = Math.min(100 - currentBox.y, Math.max(5, newHeight));

    setCropBox(prev => ({
      ...prev,
      width: newWidth,
      height: newHeight
    }));
  };

  // Mouse / Touch handlers for Crop Box
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, handle: string | null = null) => {
    e.preventDefault();
    if (!imageRef.current) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    if (handle) {
      setActiveHandle(handle);
    } else {
      setIsDragging(true);
    }

    setDragStart({
      x: clientX,
      y: clientY,
      boxX: cropBox.x,
      boxY: cropBox.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging && !activeHandle) return;
      if (!imageRef.current) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const imgWidth = imageRef.current.clientWidth;
      const imgHeight = imageRef.current.clientHeight;

      const deltaX = ((clientX - dragStart.x) / imgWidth) * 100;
      const deltaY = ((clientY - dragStart.y) / imgHeight) * 100;

      if (isDragging) {
        let newX = dragStart.boxX + deltaX;
        let newY = dragStart.boxY + deltaY;

        // Boundary checks
        newX = Math.max(0, Math.min(100 - cropBox.width, newX));
        newY = Math.max(0, Math.min(100 - cropBox.height, newY));

        setCropBox(prev => ({ ...prev, x: newX, y: newY }));
      } else if (activeHandle) {
        // Resize Box
        let newX = cropBox.x;
        let newY = cropBox.y;
        let newW = cropBox.width;
        let newH = cropBox.height;

        const right = cropBox.x + cropBox.width;
        const bottom = cropBox.y + cropBox.height;

        if (activeHandle.includes('e')) {
          newW = Math.max(5, Math.min(100 - cropBox.x, cropBox.width + deltaX));
        }
        if (activeHandle.includes('s')) {
          newH = Math.max(5, Math.min(100 - cropBox.y, cropBox.height + deltaY));
        }
        if (activeHandle.includes('w')) {
          const possibleW = cropBox.width - deltaX;
          if (possibleW > 5 && dragStart.boxX + deltaX >= 0) {
            newX = dragStart.boxX + deltaX;
            newW = right - newX;
          }
        }
        if (activeHandle.includes('n')) {
          const possibleH = cropBox.height - deltaY;
          if (possibleH > 5 && dragStart.boxY + deltaY >= 0) {
            newY = dragStart.boxY + deltaY;
            newH = bottom - newY;
          }
        }

        // Apply aspect ratio constraint during resize if selected
        if (aspectRatio === '1:1') {
          // Sync sizes to prevent stretching
          const maxPerc = Math.max(newW, newH);
          newW = maxPerc;
          newH = maxPerc;
        } else if (aspectRatio === '4:3') {
          newH = (newW * imgWidth / 100) * (3 / 4) / imgHeight * 100;
        } else if (aspectRatio === '16:9') {
          newH = (newW * imgWidth / 100) * (9 / 16) / imgHeight * 100;
        }

        // Final boundary confirmation
        if (newX + newW <= 100 && newY + newH <= 100 && newX >= 0 && newY >= 0) {
          setCropBox({
            x: newX,
            y: newY,
            width: newW,
            height: newH
          });
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setActiveHandle(null);
    };

    if (isDragging || activeHandle) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, activeHandle, dragStart, cropBox, aspectRatio]);

  const handleCropExecute = () => {
    if (!file || !imageRef.current) return;

    setIsProcessing(true);
    setErrorMsg(null);

    const img = new Image();
    img.src = filePreview;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Could not get Canvas 2D Context');
        }

        const natWidth = img.naturalWidth;
        const natHeight = img.naturalHeight;

        // Compute pixel coordinates
        const cropX = (cropBox.x / 100) * natWidth;
        const cropY = (cropBox.y / 100) * natHeight;
        const cropW = (cropBox.width / 100) * natWidth;
        const cropH = (cropBox.height / 100) * natHeight;

        canvas.width = cropW;
        canvas.height = cropH;

        // Draw cropped section
        ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

        canvas.toBlob((blob) => {
          if (blob) {
            const croppedUrl = URL.createObjectURL(blob);
            setResultImg({
              blob,
              url: croppedUrl,
              size: blob.size
            });

            onAddHistoryItem({
              action: `قص وتعديل أبعاد الصورة (${aspectRatio === 'free' ? 'حر' : aspectRatio})`,
              fileName: `cropped_${file.name}`,
              originalSize: file.size,
              processedSize: blob.size,
              type: 'image'
            }, blob, file);
          } else {
            setErrorMsg('فشل استخراج الصورة المقتصة.');
          }
          setIsProcessing(false);
        }, file.type || 'image/png', 0.95);

      } catch (err: any) {
        setErrorMsg('فشل تنفيذ عملية القص: ' + err?.message);
        setIsProcessing(false);
      }
    };

    img.onerror = () => {
      setErrorMsg('فشل تحميل الصورة للأبعاد المطلوبة.');
      setIsProcessing(false);
    };
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-purple-50 shadow-sm space-y-6">
      <div className="flex items-center gap-3 border-b border-purple-50 pb-4">
        <div className="bg-purple-100 p-2.5 rounded-2xl text-purple-700">
          <Crop className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-extrabold text-xl text-purple-950">أداة قص وتعديل أبعاد الصور</h2>
          <p className="text-xs text-gray-400 mt-1">قص المنطقة المطلوبة أو اختر نسباً جاهزة بنقرة واحدة</p>
        </div>
      </div>

      {!file ? (
        <UploadZone
          onFilesSelected={handleFileDrop}
          accept="image/*"
          title="اسحب الصورة هنا لقص أبعادها"
          subtitle="اصيغ المدعومة: PNG, JPG, JPEG, WEBP"
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="text-sm font-semibold text-gray-700 truncate max-w-[200px] md:max-w-md">
                {file.name}
              </div>
              <span className="text-[11px] bg-purple-100 text-purple-700 py-1 px-2.5 rounded-lg font-mono">
                {formatBytes(file.size)}
              </span>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-bold transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>إلغاء وتغيير الصورة</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Aspect Ratio and crop controllers */}
            <div className="lg:col-span-1 space-y-6 bg-purple-50/40 p-6 rounded-2xl border border-purple-100/50">
              <h3 className="font-bold text-sm text-purple-900 border-b border-purple-150 pb-2 mb-3">
                خيارات نسبة القص المتناسقة
              </h3>
              
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'free', label: 'حر (تعديل يدوي)' },
                  { id: '1:1', label: 'مربع (1:1)' },
                  { id: '4:3', label: 'شاشة (4:3)' },
                  { id: '16:9', label: 'سينمائي (16:9)' },
                ].map((ratio) => (
                  <button
                    key={ratio.id}
                    onClick={() => applyRatio(ratio.id)}
                    className={`
                      py-2.5 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer text-center
                      ${aspectRatio === ratio.id
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-white hover:bg-purple-100 text-purple-800 border border-purple-150/50'
                      }
                    `}
                  >
                    {ratio.label}
                  </button>
                ))}
              </div>

              <div className="bg-white p-4 rounded-xl border border-purple-100 text-[11px] text-purple-900 leading-relaxed space-y-1">
                <p className="font-bold mb-1 flex items-center gap-1 text-purple-950">
                  <Crop className="w-3.5 h-3.5" />
                  دليل الاستخدام:
                </p>
                <p>• اسحب المقابض الدائرية بحدود الإطار لضبط مقاس القص.</p>
                <p>• يمكنك سحب الإطار نفسه لتغيير موضع منطقة القص.</p>
                <p>• حدد نسبة ثابتة من الأعلى لتسريع العملية.</p>
              </div>

              {!resultImg && (
                <button
                  onClick={handleCropExecute}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
                >
                  <Crop className="w-5 h-5" />
                  <span>{isProcessing ? 'جاري قص الصورة...' : 'تنفيذ قص وحفظ الصورة'}</span>
                </button>
              )}
            </div>

            {/* Interactive Cropper Area */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center bg-slate-900 p-6 rounded-2xl border border-slate-800 min-h-[350px] relative overflow-hidden select-none">
              {!resultImg ? (
                <div 
                  ref={containerRef}
                  className="relative max-w-full max-h-[450px]"
                >
                  <img
                    ref={imageRef}
                    src={filePreview}
                    alt="موقع القص"
                    className="max-w-full max-h-[450px] object-contain block select-none pointer-events-none"
                    onLoad={() => {
                      // Apply default ratio check on first load
                      applyRatio(aspectRatio);
                    }}
                  />
                  
                  {/* Shadow overlays */}
                  <div className="absolute inset-0 bg-black/60 pointer-events-none" />

                  {/* Highlights the cropped square box inside */}
                  <div
                    onMouseDown={(e) => handleMouseDown(e, null)}
                    onTouchStart={(e) => handleMouseDown(e, null)}
                    style={{
                      left: `${cropBox.x}%`,
                      top: `${cropBox.y}%`,
                      width: `${cropBox.width}%`,
                      height: `${cropBox.height}%`,
                    }}
                    className="absolute border-2 border-dashed border-purple-400 bg-transparent ring-1 ring-white cursor-move Box-Highlights"
                  >
                    {/* Clear visual inside the box */}
                    <div 
                      style={{
                        backgroundImage: `url(${filePreview})`,
                        backgroundSize: `${imageRef.current ? (imageRef.current.clientWidth) : 0}px ${imageRef.current ? (imageRef.current.clientHeight) : 0}px`,
                        backgroundPosition: `${imageRef.current ? -(cropBox.x / 100 * imageRef.current.clientWidth) : 0}px ${imageRef.current ? -(cropBox.y / 100 * imageRef.current.clientHeight) : 0}px`,
                        width: '100%',
                        height: '100%',
                      }}
                      className="bg-no-repeat pointer-events-none opacity-100"
                    />

                    {/* Resizing handles: top-left, top-right, bottom-right, bottom-left */}
                    <div
                      onMouseDown={(e) => handleMouseDown(e, 'nw')}
                      onTouchStart={(e) => handleMouseDown(e, 'nw')}
                      className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-purple-500 border border-white rounded-full cursor-nwse-resize z-30"
                    />
                    <div
                      onMouseDown={(e) => handleMouseDown(e, 'ne')}
                      onTouchStart={(e) => handleMouseDown(e, 'ne')}
                      className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-purple-500 border border-white rounded-full cursor-nesw-resize z-30"
                    />
                    <div
                      onMouseDown={(e) => handleMouseDown(e, 'se')}
                      onTouchStart={(e) => handleMouseDown(e, 'se')}
                      className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-purple-500 border border-white rounded-full cursor-nwse-resize z-30"
                    />
                    <div
                      onMouseDown={(e) => handleMouseDown(e, 'sw')}
                      onTouchStart={(e) => handleMouseDown(e, 'sw')}
                      className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-purple-500 border border-white rounded-full cursor-nesw-resize z-30"
                    />
                  </div>
                </div>
              ) : (
                <div className="w-full text-center space-y-4">
                  <div className="flex flex-col items-center justify-center gap-2 text-emerald-400 mb-2">
                    <CheckCircle2 className="w-12 h-12" />
                    <span className="font-bold text-sm text-emerald-250">تم اقتصاص الصورة بنجاح وتوفيرها محلياً!</span>
                  </div>

                  <div className="bg-white/5 p-4 rounded-xl max-w-sm mx-auto border border-white/10 text-right space-y-2">
                    <p className="text-slate-350 text-xs">حجم الملف المنبثق: <strong className="font-mono text-white text-sm">{formatBytes(resultImg.size)}</strong></p>
                    <p className="text-slate-350 text-xs flex justify-between">حجم الملف الأصلي: <span className="text-white font-mono">{formatBytes(file.size)}</span></p>
                  </div>

                  <div className="relative inline-block max-w-full max-h-[300px] border-4 border-emerald-500/30 rounded-2xl overflow-hidden p-1 bg-white/5 shadow-2xl">
                    <img
                      src={resultImg.url}
                      alt="الملف المقتص المخرجات"
                      className="max-w-full max-h-[290px] object-contain rounded-xl"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                    <a
                      href={resultImg.url}
                      download={`cropped_${file.name.split('.')[0]}.${file.name.split('.').pop()}`}
                      className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-3 px-6 rounded-xl font-bold font-sans transition-all cursor-pointer text-sm shadow-lg"
                    >
                      <Download className="w-4 h-4" />
                      <span>تحميل الصورة المقتصة</span>
                    </a>
                    <button
                      onClick={() => {
                        setResultImg(null);
                      }}
                      className="flex items-center justify-center gap-2 bg-white/15 hover:bg-white/20 text-white py-3 px-6 rounded-xl font-bold transition-all cursor-pointer text-sm"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>إعادة ضبط وتعديل القص</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-150 text-red-650 p-4 rounded-xl text-sm font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};

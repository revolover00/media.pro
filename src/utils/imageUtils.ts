export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (src.startsWith('http://') || src.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('فشل تحميل الصورة. قد تكون تالفة أو غير مدعومة.'));
    img.src = src;
  });
}

export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const dataUrl = e.target?.result as string;
        const img = await loadImage(dataUrl);
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('فشل قراءة الملف.'));
    reader.readAsDataURL(file);
  });
}

export async function convertImage(
  file: File,
  outputType: string,
  quality: number
): Promise<{ blob: Blob; dataUrl: string }> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('فشل تهيئة Canvas context');
    }

    if (outputType === 'image/jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(img, 0, 0);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('فشل تحويل الصورة إلى Blob'));
            return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              blob,
              dataUrl: reader.result as string,
            });
          };
          reader.onerror = () => reject(new Error('فشل قراءة بيانات الصورة'));
          reader.readAsDataURL(blob);
        },
        outputType,
        outputType === 'image/png' ? undefined : quality
      );
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function resizeImage(
  file: File,
  width: number,
  height: number,
  outputType: string,
  quality: number
): Promise<{ blob: Blob; dataUrl: string }> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('فشل تهيئة Canvas context');
    }

    if (outputType === 'image/jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(img, 0, 0, width, height);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('فشل تحجيم الصورة'));
            return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              blob,
              dataUrl: reader.result as string,
            });
          };
          reader.onerror = () => reject(new Error('فشل قراءة بيانات الصورة'));
          reader.readAsDataURL(blob);
        },
        outputType,
        outputType === 'image/png' ? undefined : quality
      );
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 بايت';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['بايت', 'كيلوبايت (KB)', 'ميجابايت (MB)', 'جيجابايت (GB)'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

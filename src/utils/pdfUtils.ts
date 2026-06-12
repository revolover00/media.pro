// @ts-ignore
import { PDFDocument } from 'pdf-lib';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export async function mergePDFs(files: File[]): Promise<{ blob: Blob; url: string }> {
  if (files.length === 0) {
    throw new Error('الرجاء إدخال ملف PDF واحد على الأقل للدمج.');
  }

  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const fileBytes = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(fileBytes);
    const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const mergedPdfBytes = await mergedPdf.save();
  const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  return { blob, url };
}

export function parsePageRange(rangeStr: string, maxPages: number): number[] {
  const pages = new Set<number>();
  const parts = rangeStr.replace(/\s+/g, '').split(',');

  for (const part of parts) {
    if (!part) continue;

    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (isNaN(start) || isNaN(end) || start < 1 || end < 1 || start > end) {
        throw new Error(`نطاق الصفحات غير صالح: ${part}`);
      }

      for (let i = start; i <= end; i++) {
        if (i <= maxPages) {
          pages.add(i);
        }
      }
    } else {
      const pageNum = parseInt(part, 10);
      if (isNaN(pageNum) || pageNum < 1) {
        throw new Error(`رقم الصفحة غير صالح: ${part}`);
      }
      if (pageNum <= maxPages) {
        pages.add(pageNum);
      }
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

export async function splitPDF(file: File, rangeStr: string): Promise<{ blob: Blob; url: string; totalPages: number; pagesExtracted: number }> {
  const fileBytes = await file.arrayBuffer();
  const sourcePdfDoc = await PDFDocument.load(fileBytes);
  const totalPages = sourcePdfDoc.getPageCount();

  if (totalPages === 0) {
    throw new Error('ملف PDF غير صالح أو فارغ.');
  }

  const pagesToKeep = parsePageRange(rangeStr, totalPages);
  if (pagesToKeep.length === 0) {
    throw new Error('لم يتم تحديد أي صفحات صالحة للاستخراج.');
  }

  const splitPdfDoc = await PDFDocument.create();
  const pageIndicesToCopy = pagesToKeep.map((p) => p - 1);
  const copiedPages = await splitPdfDoc.copyPages(sourcePdfDoc, pageIndicesToCopy);
  copiedPages.forEach((page) => splitPdfDoc.addPage(page));

  const splitPdfBytes = await splitPdfDoc.save();
  const blob = new Blob([splitPdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  return { 
    blob, 
    url, 
    totalPages, 
    pagesExtracted: pagesToKeep.length 
  };
}

export async function getPdfTotalPages(file: File): Promise<number> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;
  return pdf.numPages;
}

export async function renderPdfPageToImage(
  file: File,
  pageNumber: number,
  scale = 1.5
): Promise<{ dataUrl: string; blob: Blob }> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;
  
  if (pageNumber < 1 || pageNumber > pdf.numPages) {
    throw new Error(`الصفحة رقم ${pageNumber} غير موجودة.`);
  }

  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('فشل تهيئة Canvas context');
  }

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const renderContext: any = {
    canvasContext: ctx,
    viewport: viewport,
  };

  await page.render(renderContext).promise;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('فشل تحويل الصفحة إلى صورة'));
          return;
        }
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        resolve({ dataUrl, blob });
      },
      'image/jpeg',
      0.9
    );
  });
}

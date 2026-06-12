import React, { useState, useRef } from 'react';
import { UploadCloud, FileUp, AlertCircle } from 'lucide-react';

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept: string;
  multiple?: boolean;
  title: string;
  subtitle: string;
  maxSizeMB?: number;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onFilesSelected,
  accept,
  multiple = false,
  title,
  subtitle,
  maxSizeMB = 50,
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const validateFiles = (files: FileList): File[] => {
    const validFiles: File[] = [];
    setErrorMsg(null);

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    const acceptList = accept.split(',').map((type) => type.trim().toLowerCase());

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileType = file.type.toLowerCase();
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

      const matchesType = acceptList.some((accepted) => {
        if (accepted.endsWith('/*')) {
          const prefix = accepted.replace('/*', '');
          return fileType.startsWith(prefix);
        }
        return accepted === fileType || accepted === fileExtension;
      });

      if (!matchesType) {
        setErrorMsg(`صيغة الملف "${file.name}" غير معتمدة لهذه الأداة.`);
        continue;
      }

      if (file.size > maxSizeBytes) {
        setErrorMsg(`الملف "${file.name}" يتجاوز الحد الأقصى المسموح به (${maxSizeMB} ميجابايت).`);
        continue;
      }

      validFiles.push(file);
      if (!multiple) break;
    }

    return validFiles;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = validateFiles(e.dataTransfer.files);
      if (files.length > 0) {
        onFilesSelected(files);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const files = validateFiles(e.target.files);
      if (files.length > 0) {
        onFilesSelected(files);
      }
    }
  };

  return (
    <div className="w-full">
      <div
        id="drop-zone"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-6 sm:p-10 text-center cursor-pointer transition-all duration-300 group
          ${isDragActive 
            ? 'border-purple-500 bg-purple-550/10 shadow-inner' 
            : 'border-purple-300 hover:border-purple-500 hover:bg-purple-50/50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="bg-purple-100 text-purple-600 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
          <UploadCloud className="w-10 h-10" />
        </div>

        <h3 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-purple-750">
          {title}
        </h3>
        <p className="text-sm text-gray-500 mb-4 max-w-md">
          {subtitle}
        </p>

        <button
          type="button"
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-2.5 px-6 rounded-2xl shadow-md transition-all hover:opacity-95"
        >
          <FileUp className="w-4 h-4" />
          <span>اختيار الملفات</span>
        </button>

        <p className="text-[11px] text-gray-400 mt-4">
          أقصى حجم للملف الواحد: {maxSizeMB} ميجابايت • تتم المعالجة بالكامل محلياً وأمان تام
        </p>
      </div>

      {errorMsg && (
        <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};

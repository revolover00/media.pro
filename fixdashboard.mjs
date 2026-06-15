import fs from 'fs';
import path from 'path';

const dashboardPath = path.join(process.cwd(), 'src/components/Dashboard.tsx');
let content = fs.readFileSync(dashboardPath, 'utf8');

const missingTools = `    {
      id: 'file-encryptor' as TabId,
      label: t.sidebar.fileEncryptor,
      descAr: "تشفير عسكري للملفات الخاصة بكلمات مرور محمية غير قابلة للاختراق.",
      descEn: "Military-grade file encryption using AES block ciphers with secure password barriers.",
      icon: Lock,
      color: "from-stone-600 to-slate-800",
      bgLight: "bg-slate-50 border-slate-200 text-slate-800",
      category: "security" as const
    },
    {
      id: 'file-decryptor' as TabId,
      label: t.sidebar.fileDecryptor,
      descAr: "فك تشفير الملفات المقفلة واستعادة البيانات بأمان وفعالية.",
      descEn: "Decrypt securely locked local files instantly to restore original data.",
      icon: Unlock,
      color: "from-stone-500 to-slate-700",
      bgLight: "bg-slate-50 border-slate-200 text-slate-700",
      category: "security" as const
    },
    {
      id: 'metadata-scrubber' as TabId,
      label: t.sidebar.metadataScrubber,
      descAr: "حذف وطمس بصمات وتعقب الميتا داتا وصور المصورين وبيانات أجهزة الجوال من الصور.",
      descEn: "Wipe sensitive EXIF headers, GPS fingerprints, and hardware metadata efficiently.",
      icon: ShieldCheck,
      color: "from-blue-600 to-slate-700",
      bgLight: "bg-blue-50 border-blue-100 text-blue-700",
      category: "security" as const
    },
    {
      id: 'file-shredder' as TabId,
      label: t.sidebar.fileShredder,
      descAr: "تدمير وتمزيق ومسح الملفات الحساسة بحيث لا يمكن استعادتها بواسطة أية برامج نهائياً.",
      descEn: "Secure wipe and permanent multi-layer shredding of highly sensitive materials.",
      icon: Trash2,
      color: "from-red-600 to-rose-700",
      bgLight: "bg-red-50 border-red-100 text-red-700",
      category: "security" as const
    },
    {
      id: 'steganography-tool' as TabId,
      label: t.sidebar.steganographyTool,
      descAr: "إخفاء النصوص والمستندات السرية داخل صور عادية غير ملفتة وتشفيرها.",
      descEn: "Hide confidential messages invisibly deep inside normal image carrier pixels.",
      icon: Eye,
      color: "from-violet-600 to-purple-800",
      bgLight: "bg-violet-50 border-violet-100 text-violet-700",
      category: "security" as const
    },
    {
      id: 'share-menu' as TabId,
      label: t.sidebar.shareMenu,
      descAr: "مشاركة وتوليد روابط سريعة ولون مباشر ونقل سريع للملفات من متصفحك.",
      descEn: "Generate quick shareable links or broadcast items via social API pathways securely.",
      icon: Share2,
      color: "from-teal-500 to-emerald-600",
      bgLight: "bg-teal-50 border-teal-100 text-teal-700",
      category: "other" as const
    },
    {
      id: 'batch-renamer' as TabId,
      label: t.sidebar.batchRenamer,
      descAr: "أداة متقدمة لإعادة تسمية آلاف الملفات دفعة واحدة بأنماط مختلفة وتسلسلات ترقيم.",
      descEn: "Advanced mass batch renaming using custom patterns, timestamps, and iterations.",
      icon: FolderSync,
      color: "from-gray-600 to-neutral-700",
      bgLight: "bg-gray-50 border-gray-100 text-gray-700",
      category: "other" as const
    },`;

content = content.replace("const toolsData = [", "const toolsData = [\n" + missingTools);

fs.writeFileSync(dashboardPath, content);
console.log('Fixed Dashboard ToolsData!');

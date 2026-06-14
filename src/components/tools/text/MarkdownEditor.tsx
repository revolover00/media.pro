'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Eye, 
  Edit3, 
  Bold, 
  Italic, 
  Heading1, 
  List, 
  Link2, 
  Image as ImageIcon, 
  Table as TableIcon, 
  Code, 
  Download, 
  BookOpen, 
  RotateCcw,
  Check,
  Copy,
  Layout,
  Printer
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { HistoryItem } from '../../../types';

interface MarkdownEditorProps {
  lang: 'ar' | 'en';
  onAddHistoryItem?: (item: any, blob?: Blob) => void;
}

const TEMPLATES = {
  readme: `# 📝 Pro Project Title

A clean, modern placeholder describing your developer workspace capabilities. Follow steps below for quick setups.

## 🚀 Speed Guidelines
- Run client environments smoothly.
- Bundle assets inside sandboxed configurations.

## 📦 Installed Packages
| Package | Version | Purpose |
| :--- | :---: | :--- |
| **Vite** | 6.x | Bundle assets |
| **Tailwind** | 4.x | Fast UI rendering |
| **React** | 19.x | Component lifecycle |

\`\`\`bash
# Start your local workspace server
npm run dev
\`\`\`

---
*Created with FileForge Pro.*`,

  article: `# 🌟 The future of localized client-side development

Writing scalable web clients entirely on-device is no longer a fantasy. In this article, find out why native WASM and browser buffers perform securely without any server footprints.

## Key Takeaway points:
1. **100% Privacy**: Client-side parsing files mitigates server leakage vectors.
2. **Speed**: No network roundtrips means latency-free image transformations.
3. **Offline support**: Apps continue functioning regardless of flight or transport modes.

> "The browser is a complete application runtime operating natively in secure sandboxes."

### Code implementation sample
\`\`\`typescript
const compileModule = async (bytes: ArrayBuffer) => {
  const module = await WebAssembly.compile(bytes);
  return new WebAssembly.Instance(module);
};
\`\`\`

Hope you find this read helpful!`,

  doc: `# 📘 API Technical Specifications

Review endpoint details, response structures, and payload variables for custom webhooks integrations.

### Authorization Header
\`\`\`http
Authorization: Bearer <JWT_API_KEY>
\`\`\`

### Retrieve History logs
\`GET /api/v1/history\`

#### Query parameters:
- \`limit\` (optional, default: \`20\`): Count of records to return.
- \`offset\` (optional): Paged index tracking.

#### Response JSON:
\`\`\`json
{
  "status": "success",
  "data": [
    {
      "id": "item_1985732",
      "action": "PDF compression",
      "timestamp": "12:45 PM"
    }
  ]
}
\`\`\``
};

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ lang, onAddHistoryItem }) => {
  const isAr = lang === 'ar';

  const [markdown, setMarkdown] = useState<string>(TEMPLATES.readme);
  const [activeTab, setActiveTab] = useState<'both' | 'edit' | 'preview'>('both');
  const [copied, setCopied] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string>('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load from local storage draft if exists
  useEffect(() => {
    const saved = localStorage.getItem('forge_markdown_draft');
    if (saved) {
      setMarkdown(saved);
      setSaveStatus(isAr ? 'تم استرداد المسودة التلقائية بنجاح' : 'Recovered automatic local draft draft.');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  }, []);

  // Save changes automatically
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('forge_markdown_draft', markdown);
      setSaveStatus(isAr ? 'تم حفظ المسودة محلياً' : 'Draft saved to local storage.');
      setTimeout(() => setSaveStatus(''), 2000);
    }, 1000);

    return () => clearTimeout(timer);
  }, [markdown]);

  // Handle toolbar interactions
  const injectSyntax = (type: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = markdown.substring(start, end);

    let prefix = '';
    let suffix = '';

    switch (type) {
      case 'bold':
        prefix = '**';
        suffix = '**';
        break;
      case 'italic':
        prefix = '*';
        suffix = '*';
        break;
      case 'heading':
        prefix = '### ';
        break;
      case 'list':
        prefix = '- ';
        break;
      case 'link':
        prefix = '[';
        suffix = '](https://example.com)';
        break;
      case 'image':
        prefix = '![';
        suffix = '](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe)';
        break;
      case 'table':
        prefix = '\n| Title 1 | Title 2 |\n| :--- | :--- |\n| Row A | Row B |\n';
        break;
      case 'code':
        prefix = '`';
        suffix = '`';
        break;
    }

    const replacement = prefix + (selectedText || (isAr ? 'نص مضلل' : 'sample text')) + suffix;
    const updated = markdown.substring(0, start) + replacement + markdown.substring(end);
    
    setMarkdown(updated);

    // Focus textbox back
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selectedText || (isAr ? 'نص مضلل' : 'sample text')).length);
    }, 50);
  };

  const loadTemplate = (key: 'readme' | 'article' | 'doc') => {
    if (window.confirm(isAr ? 'هل أنت متأكد من رغبتك بالاستبدال بالنص النموذجي؟ ستفقد المسودة الحالية.' : 'Are you sure you want to load template? Current text will be replaced.')) {
      setMarkdown(TEMPLATES[key]);
    }
  };

  const copyHTMLToClipboard = () => {
    try {
      navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportHTML = () => {
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Markdown Exported • FileForge Pro</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.2.0/github-markdown.min.css">
        <style>
          body { box-sizing: border-box; min-width: 200px; max-width: 980px; margin: 0 auto; padding: 45px; }
          @media (max-width: 767px) { body { padding: 15px; } }
          @media print { .no-print { display: none !important; } }
        </style>
      </head>
      <body class="markdown-body">
        <div class="no-print" style="margin-bottom: 25px; text-align: right;">
          <button onclick="window.print()" style="background-color: #6d28d9; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer;">
            Print / Save to PDF
          </button>
        </div>
        <div>
          ${textareaRef.current ? markdown : 'No content'}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlTemplate], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document_${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (onAddHistoryItem) {
      onAddHistoryItem(
        {
          action: isAr ? 'تصدير مستند Markdown كـ HTML' : 'Export Markdown document to HTML',
          fileName: `markdown_${Date.now()}.html`,
          originalSize: markdown.length,
          processedSize: blob.size,
          type: 'text'
        },
        blob
      );
    }
  };

  return (
    <div className="space-y-6 text-right" style={{ direction: isAr ? 'rtl' : 'ltr' }}>
      {/* Title block */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-purple-100 dark:border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-2xl">
            <BookOpen className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {isAr ? '📝 محرر ومصمم مستندات Markdown المباشر' : '📝 Interactive Markdown Publisher'}
            </h2>
            <p className="text-xs text-slate-405 mt-1">
              {isAr 
                ? 'محرر متطور مع تقسيم الشاشة بالوقت الفعلي وصندوق للأزرار السريعة، مع حفظ فوري لتقرير PDF و HTML.'
                : 'Advanced real-time split screen rendering. Inject formats, toggle layouts, load pre-built readme templates.'}
            </p>
          </div>
        </div>
      </div>

      {/* Templates Selector Toolbar layout */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-slate-405 font-black uppercase">{isAr ? 'النماذج الجاهزة:' : 'Draft Templates:'}</span>
          <button
            onClick={() => loadTemplate('readme')}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-650 dark:text-slate-300 rounded-xl cursor-pointer border border-slate-105"
          >
            README file
          </button>
          <button
            onClick={() => loadTemplate('article')}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-650 dark:text-slate-300 rounded-xl cursor-pointer border border-slate-105"
          >
            {isAr ? 'مقال صحفي' : 'Article WriteUp'}
          </button>
          <button
            onClick={() => loadTemplate('doc')}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-650 dark:text-slate-300 rounded-xl cursor-pointer border border-slate-105"
          >
            {isAr ? 'وثيقة تقنية API' : 'Technical Docs'}
          </button>
        </div>

        {/* Display split choice bar */}
        <div className="flex items-center gap-2">
          <div className="inline-flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-xs border border-slate-105">
            {[
              { id: 'edit', label: isAr ? 'تحرير فقط' : 'Editor', icon: Edit3 },
              { id: 'both', label: isAr ? 'انقسام الشاشة' : 'Split-View', icon: Layout },
              { id: 'preview', label: isAr ? 'معاينة فقط' : 'Preview', icon: Eye },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${activeTab === tab.id ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Editor & Preview Workspace box boundary */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-750 overflow-hidden shadow-xs">
        
        {/* Buttons formatting toolbar */}
        <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 border-b border-slate-100 dark:border-slate-750 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'bold', icon: Bold, label: isAr ? 'غامق' : 'Bold' },
              { id: 'italic', icon: Italic, label: isAr ? 'مائل' : 'Italic' },
              { id: 'heading', icon: Heading1, label: isAr ? 'عنوان رئيسي' : 'Heading' },
              { id: 'list', icon: List, label: isAr ? 'قائمة منقطة' : 'Unordered list' },
              { id: 'link', icon: Link2, label: isAr ? 'رابط ويب' : 'Hyperlink' },
              { id: 'image', icon: ImageIcon, label: isAr ? 'صورة توضيحية' : 'Image link' },
              { id: 'table', icon: TableIcon, label: isAr ? 'جدول خلايا' : 'Bake table' },
              { id: 'code', icon: Code, label: isAr ? 'كتلة برمجية' : 'Inline code code' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => injectSyntax(btn.id)}
                className="p-2 hover:bg-slate-150 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-350 rounded-xl cursor-pointer transition-colors"
                title={btn.label}
              >
                <btn.icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {saveStatus && (
              <span className="text-[10px] text-purple-600 font-bold bg-purple-50 dark:bg-slate-900 px-2.5 py-1 rounded-lg animate-fadeIn">
                {saveStatus}
              </span>
            )}
            
            <button
              onClick={copyHTMLToClipboard}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 text-[10px] font-bold text-slate-700 dark:text-slate-300 border border-slate-105 rounded-xl cursor-pointer flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ المصدر' : 'Copy Source')}</span>
            </button>

            <button
              onClick={handleExportHTML}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-550 text-white text-[10px] font-bold rounded-xl cursor-pointer flex items-center gap-1.5 transition-all shadow-sm"
              style={{ paddingLeft: '14px', paddingRight: '14px' }}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isAr ? 'تصدير كمستند' : 'Print / Save PDF'}</span>
            </button>
          </div>
        </div>

        {/* Dual Text layout space sheets */}
        <div className="grid grid-cols-1 lg:grid-cols-2">
          
          {/* Box A - Edit panel */}
          {(activeTab === 'edit' || activeTab === 'both') && (
            <div className={`p-4 ${activeTab === 'both' ? 'border-l lg:border-l border-slate-100 dark:border-slate-750' : ''}`}>
              <textarea
                ref={textareaRef}
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                className="w-full h-[500px] p-4 bg-slate-50 dark:bg-slate-900 border-none font-mono text-sm focus:outline-none focus:ring-0 leading-relaxed text-left"
                placeholder={isAr ? 'ابدأ كتابة وسوم وعناوين مستند الـ Markdown هنا...' : 'Start composing markdown document files here...'}
                style={{ direction: 'ltr' }}
              />
            </div>
          )}

          {/* Box B - Preview HTML rendering panel */}
          {(activeTab === 'preview' || activeTab === 'both') && (
            <div className="p-6 bg-white dark:bg-slate-850 h-[500px] overflow-y-auto text-left ltr" style={{ direction: 'ltr' }}>
              <div className="markdown-body dark:prose-invert">
                <ReactMarkdown>{markdown}</ReactMarkdown>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

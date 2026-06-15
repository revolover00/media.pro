import React, { useState } from 'react';
import { 
  HelpCircle, BookOpen, Cpu, Shuffle, Sparkles, Wand2, Shield, Eye, Download, Info, CheckCircle, 
  RefreshCw, FileImage, Maximize2, Crop, RotateCw, Palette, Images, Files, Scissors, Type, Layers, ChevronDown, ChevronUp
} from 'lucide-react';
import { translations } from '../translations';

interface GuideCenterProps {
  lang: 'ar' | 'en';
  setActiveTab: (tab: any) => void;
}

export const GuideCenter: React.FC<GuideCenterProps> = ({ lang, setActiveTab }) => {
  const t = translations[lang];
  const isAr = lang === 'ar';

  const [activeAccordion, setActiveAccordion] = useState<number | null>(null);
  const [selectedDemoTab, setSelectedDemoTab] = useState<'compress' | 'remove-bg' | 'ocr' | 'pdf'>('compress');

  const faqs = [
    {
      qAr: "هل تُرفع ملفاتي أو مستنداتي الحساسة إلى أي خادم (Server)؟",
      qEn: "Are my files or sensitive documents uploaded to any server?",
      aAr: "لا نهائياً! تطبيق 'برو ميديا' يعمل بتقنية 'المعالجة المحلية الكاملة بالمتصفح' (On-Device Client-Side Sandbox). يتم تحميل الأكواد والمكتبات الذكية مرة واحدة، وعند معالجة أي صورة أو مستند PDF أو استخراج نص، تجرى العملية كاملةً داخل ذاكرة جهازك الشخصي دون الحاجة لأي اتصال بالإنترنت.",
      aEn: "Absolutely not! Pro Media runs entirely on your device via client-side web sandboxing. All code and neural weights load into your own browser, and files are processed local-to-memory with zero server upload."
    },
    {
      qAr: "كيف يعمل نظام الذكاء الاصطناعي (أدوات تلخيص النص، الـ OCR، وإزالة الخلفية) بدون إنترنت؟",
      qEn: "How do AI tools like Summary, OCR, and Bg Removal work offline?",
      aAr: "نعتمد على الجيل الجديد من مكتبات الويب المفتوحة والمحسنة مثل Transformers.js و WebAssembly. يتم تحميل النماذج الخفيفة مباشرة لجهازك وتخزينها في التخزين المؤقت المحلي للمتصفح (Cache)؛ لذلك تعمل الأدوات فورا بمجرد فتح الواجهة.",
      aEn: "We utilize next-generation WebAssembly engines and Transformers.js. Lightweight pre-compiled model weights are loaded once to your browser storage, operating natively on your graphics card (WebGPU) or CPU without internet access."
    },
    {
      qAr: "ما هي المكتبات البرمجية المستخدمة في النظام؟ وهل هي مجانية؟",
      qEn: "What libraries does this app use? Are they free and open source?",
      aAr: "نعم، كافة الأدوات مبنية على ركائز مجانية ومفتوحة المصدر 100% بالكامل، بما يشمل: PDF-lib لمعالجة مستندات الـ PDF، مكتبة Tesseract.js للتعرف الضوئي الضوئي على النصوص (OCR)، مكتبة PDF.js من موزيلا لعرض ملفات PDF، ومكتبة @imgly/background-removal لعزل الخلفية المتقدم.",
      aEn: "Yes, all processing relies on 100% free and open-source libraries: PDF-lib for structure, Tesseract.js for high-accuracy OCR, Mozilla's PDF.js for reading, and @imgly/background-removal for background segmentation."
    },
    {
      qAr: "هل التطبيق يدعم العمل بالكامل عند انقطاع شبكة الإنترنت؟",
      qEn: "Does this application support working completely with no connection?",
      aAr: "نعم! بفضل ميزة Service Worker وتطبيق الويب التقدمي (PWA)، يمكنك تثبيت التطبيق على هاتفك المحمول أو حاسوبك الشخصي واستخدامه بشكل طبيعي أثناء السفر أو في الأماكن التي لا تحتوي على اتصال بالشبكة.",
      aEn: "Yes! Integrated Service Workers and lightweight PWA caching allow you to install Pro Media on your phone, tablet, or PC, and launch it seamlessly without any active internet connection."
    },
    {
      qAr: "أواجه مشكلة في معالجة الصور الكبيرة جداً، ما السبب؟",
      qEn: "I am having trouble with very large image assets, why?",
      aAr: "بما أن المعالجة تتم محلياً بالكامل، فإن الأداء يعتمد بقوة على مواصفات جهازك (سعة الذاكرة العشوائية وقدرة المعالج). بالنسبة للصور التي تفوق دقتها 30 ميجابكسل، قد تلاحظ تباطؤاً لأن المتصفح يمنح مساحة محدودة للذاكرة؛ ننصح بضغط حجمها أولاً.",
      aEn: "Since execution is 105% client-side, it is powered directly by your current device's hardware RAM and CPU limits. For ultra-high resolution images (above 30MP), we recommend compressing them first."
    }
  ];

  const toolsExplanations = [
    {
      id: "image-convert",
      icon: RefreshCw,
      title: isAr ? "تحويل صيغ الصور" : "Convert Extension",
      desc: isAr ? "تحويل فوري فائق الجودة بين امتدادات الصور الأكثر شيوعا (WebP, PNG, JPG, BMP). ممتاز لتحسين توافق الصور لعرضها على منصات الويب المختلفة." : "Perform format transposition between standard formats (WebP, PNG, JPG) with precise quality conservation.",
      tip: isAr ? "نصيحة: استخدم صيغة WebP لمواقع الويب للحصول على أفضل دقة بأقل مساحة ممكنة." : "Tip: Export as WebP for optimal SEO and high loading speeds on websites."
    },
    {
      id: "image-compress",
      icon: FileImage,
      title: isAr ? "ضغط الصور المتقدم" : "Smart Image Compress",
      desc: isAr ? "تقليل الوزن الإجمالي للملفات بطرق ذكية تعتمد على دمج البكسلات المتطابقة دون إفساد التفاصيل البصرية الأساسية للصورة." : "Reduce physical storage bytes drastically via custom quantization pipelines preserving visual structures.",
      tip: isAr ? "نصيحة: تعيين جودة 80% يمنحك انخفاضاً هائلاً في الحجم يربو على 70% دون أي فارق بالعين المجردة." : "Tip: Standard 80% compression maintains crystal clear vision while cutting storage up to 70%."
    },
    {
      id: "image-resize",
      icon: Maximize2,
      title: isAr ? "تغيير حجم وأبعاد الصور" : "Responsive Image Resizer",
      desc: isAr ? "إعادة ضبط أبعاد العرض والارتفاع بدقة بالبكسل أو كنسب مئوية ثابتة، لموائمة القوالب والمواقع المتنوعة." : "Adjust exact responsive layout constraints or precise pixel bounds (width/height) of any file.",
      tip: isAr ? "نصيحة: حافظ على خيار 'نسبة الارتفاع الثابتة' نشطاً لضمان عدم حدوث تشوه أو تمدد في عناصر الصورة." : "Tip: Keep the ratio lock enabled to avoid unwanted visual squeeze."
    },
    {
      id: "image-crop",
      icon: Crop,
      title: isAr ? "قص وتعديل الأبعاد" : "Digital Cropping & Ratio",
      desc: isAr ? "قص الزوائد أو استقطاع بؤرة محددة داخل الصورة لتناسب إطارات النشر على منصات YouTube أو Twitter أو Instagram بالكامل." : "Tailor edges and focus points of photos to fit common social covers (16:9, 1:1, 4:3) beautifully.",
      tip: isAr ? "نصيحة: اختر النسب الجاهزة من القائمة لتستقطع الأبعاد المثالية لغلاف موقعك بثوانٍ معدودة." : "Tip: Use absolute presets to get identical cropping matching standard internet banner dimensions automatically."
    },
    {
      id: "image-ocr",
      icon: Sparkles,
      title: isAr ? "التعرف الضوئي على النصوص (OCR)" : "Sensory Text Extraction",
      desc: isAr ? "محرك متكامل يعمل بالذكاء الاصطناعي لفحص كتل البكسل وترجمتها اللحظية لنصوص قابلة للتعديل والنسخ باللغتين العربية والإنجليزية." : "Read letter shapes inside scanned papers or photos using pre-trained engine arrays (Tesseract.js).",
      tip: isAr ? "نصيحة: تأكد من التدوير الصحيح للصورة ووضوح الإضاءة للحصول على دقة استخراج تفوق الـ 98%." : "Tip: Ensure clear contrast and rotation for text extractions exceeding 98% accuracy."
    },
    {
      id: "image-remove-bg",
      icon: Wand2,
      title: isAr ? "إزالة كتل الخلفية عصبياً" : "Neural BG Eraser",
      desc: isAr ? "شبكة عصبية اصطناعية تفكك تفاصيل الصورة، وتفصل العناصر الأساسية مثل الأشخاص والمنتجات عن الخلفية دون أي تدخل يدوي." : "Segment and strip backing layers out of portrait or product images using localized computer vision models.",
      tip: isAr ? "نصيحة: تتم العملية بسرعة ممتازة على بطاقة الرسوم المعاصرة لجهازك بفضل تقنيات الـ WASM الحيوية." : "Tip: This operates on-canvas using WASM, ensuring full resolution output with clean borders."
    },
    {
      id: "pdf-merge",
      icon: Files,
      title: isAr ? "دمج وتوليف ملفات PDF" : "PDF Combinations Engine",
      desc: isAr ? "دمج وتوحيد المستندات والتقارير والملفات المتفرقة في كتلة PDF واحدة منسقة ومرتبة بالترتيب الذي تفضله." : "Stitch independent worksheets, invoices, or books into one unified file containing matching fonts.",
      tip: isAr ? "نصيحة: يمكنك سحب وإفلات العناصر لتغيير ترتيب الصفحات والمستندات قبل النقر على زر التجميع." : "Tip: You can reorder files by simple drag interactions to set correct sequence prior to clicking execute."
    }
  ];

  return (
    <div className="space-y-10 animate-fadeIn text-slate-800 dark:text-slate-100">
      
      {/* Intro Banner with beautiful decorative theme */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950 to-purple-950 text-white rounded-4xl p-8 md:p-10 shadow-2xl border border-purple-800/60 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 bg-purple-900/60 text-purple-200 py-1.5 px-3.5 rounded-full border border-purple-800 text-[10px] font-extrabold tracking-wide">
            <BookOpen className="w-4 h-4 text-purple-300" />
            <span>{isAr ? "دليل الاستخدام ومستودع المعرفة" : "User Guide & Knowledge Base"}</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">
            {isAr ? "كيف تعمل منظومة برو ميديا؟" : "How Pro Media Sandbox Operates"}
          </h2>
          <p className="text-purple-200 text-xs md:text-sm leading-relaxed font-bold">
            {isAr 
              ? "مرحبا بك في الدليل الشامل للتطبيق. هنا نوضح لك فلسفتنا البرمجية، وكيف تعمل أدواتنا المحلية بالكامل دون رفع ملفاتك إلى مزودات سحابية خارجية، لتنال السرية والموثوقية المطلقة."
              : "Discover the architectural principles driving this utility hub. Learn about browser storage, local neural weights, and tips to maximize offline processing utility."
            }
          </p>
        </div>
        <div className="shrink-0 p-5 bg-white/5 rounded-3xl border border-white/10 hidden md:block">
          <HelpCircle className="w-16 h-16 text-purple-400 animate-pulse" />
        </div>
      </div>

      {/* SECTION 1: EDUCATIONAL VIDEO SIMULATOR (VISUAL GIF DEMO CARDS) */}
      <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-purple-100/50 dark:border-slate-700/50 shadow-sm space-y-6">
        <div className="flex items-center gap-2.5 border-b border-gray-100 dark:border-slate-700/50 pb-4">
          <Sparkles className="w-5 h-5 text-indigo-600 dark:text-purple-400" />
          <div>
            <h3 className="font-extrabold text-purple-950 dark:text-white text-base">
              {isAr ? "صندوق المحاكاة المرئي التوضيحي" : "Live Visual Simulator Lessons"}
            </h3>
            <p className="text-[11px] text-gray-400">{isAr ? "شروحات تفاعلية تحاكي طريقة عمل أدوات المعالجة والذكاء الاصطناعي" : "Watch real-time browser sandbox execution simulated using lightweight visual graphs."}</p>
          </div>
        </div>

        {/* Simulator Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'compress', label: isAr ? "محاكاة ضغط الصور" : "Image Compress Simulation" },
            { id: 'remove-bg', label: isAr ? "محاكاة عزل الخلفية بالذكاء الاصطناعي" : "AI Background Removal" },
            { id: 'ocr', label: isAr ? "محاكاة الـ OCR والتعرف" : "Local OCR Extract Tool" },
            { id: 'pdf', label: isAr ? "محاكاة توليف وترتيب PDF" : "PDF Pagination Engineer" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedDemoTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${selectedDemoTab === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-gray-300 hover:bg-gray-100'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Interactive Simulated Visual Sandbox acting like a short explainer GIF */}
        <div className="border border-purple-100 dark:border-slate-700 rounded-2xl bg-slate-950 p-6 overflow-hidden relative min-h-[290px] flex flex-col justify-between">
          <div className="absolute top-3 right-3 bg-indigo-600/95 text-white text-[9px] font-mono font-bold px-2 py-1 rounded">
            {isAr ? "محاكاة حية متصفحك المحلي" : "VIRTUAL ON-DEVICE SIMULATION"}
          </div>

          {selectedDemoTab === 'compress' && (
            <div className="space-y-6 my-auto">
              <div className="flex flex-col md:flex-row items-center justify-around gap-6">
                {/* Before Box */}
                <div className="text-center p-4 bg-slate-900 border border-purple-500/20 rounded-2xl max-w-[170px] w-full space-y-2">
                  <span className="text-[10px] text-purple-400 font-bold uppercase">{isAr ? "ملف قبل الضغط" : "Original Asset"}</span>
                  <div className="w-16 h-16 mx-auto bg-slate-800 rounded-xl relative overflow-hidden flex items-center justify-center">
                    <FileImage className="w-8 h-8 text-slate-400" />
                    <div className="absolute top-0 inset-x-0 h-1 bg-purple-500 animate-pulse"></div>
                  </div>
                  <p className="text-sm font-extrabold font-mono text-white">4.21 MB</p>
                  <p className="text-[9px] text-gray-400">PNG Image file</p>
                </div>

                {/* Simulated action line */}
                <div className="flex flex-col items-center">
                  <div className="w-10 h-1 bg-gradient-to-r from-purple-500 to-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] text-purple-305 font-bold mt-2 animate-bounce">{isAr ? "جودة 80٪" : "80% Quality"}</span>
                </div>

                {/* After Box */}
                <div className="text-center p-4 bg-slate-900 border border-emerald-500/20 rounded-2xl max-w-[170px] w-full space-y-2">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase">{isAr ? "ملف بعد الضغط" : "Compressed File"}</span>
                  <div className="w-16 h-16 mx-auto bg-slate-800 rounded-xl relative overflow-hidden flex items-center justify-center">
                    <FileImage className="w-8 h-8 text-emerald-400" />
                    <div className="absolute bottom-0 inset-x-0 h-1 bg-emerald-400"></div>
                  </div>
                  <p className="text-sm font-extrabold font-mono text-emerald-400">388 KB</p>
                  <p className="text-[9px] text-emerald-300 font-bold">{isAr ? "تم توفير 90٪" : "90.7% Reduced"}</p>
                </div>
              </div>

              <p className="text-[11px] text-slate-300 text-center max-w-lg mx-auto">
                ⭐ {isAr 
                  ? "يقوم التطبيق بالمرور على ألوان البيكسلات وحذف الفراغات اللونية الخفية والميتا المقترنة للحصول على أقل وزن ممكن دون أي بهتان في جودة الصورة." 
                  : "Using proprietary canvas sampling algorithms, the explorer compresses bytes from pixel arrays, retaining identical dimensions."
                }
              </p>
            </div>
          )}

          {selectedDemoTab === 'remove-bg' && (
            <div className="space-y-6 my-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="text-center bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  <p className="text-[10px] text-gray-400 font-bold mb-2">{isAr ? "صورة ممنتجة كاملة" : "Raw Input Portrait"}</p>
                  <div className="w-24 h-24 mx-auto border border-dashed border-red-500 rounded-xl relative flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-sky-400 to-indigo-500 opacity-60"></div>
                    <span className="relative text-[10px] text-white font-bold">{isAr ? "عنصر + خلفية زرقاء" : "Object + Sky"}</span>
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <p className="text-[10px] text-purple-400 font-bold animate-pulse">{isAr ? "فصل المصفوفات عصبياً" : "Running On-Device Neural Net"}</p>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-500 to-indigo-505 h-full animate-pulse" style={{ width: '85%' }}></div>
                  </div>
                  <span className="text-[9px] font-mono text-gray-500">@imgly/background-removal</span>
                </div>

                <div className="text-center bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  <p className="text-[10px] text-emerald-400 font-bold mb-2">{isAr ? "تفريغ فوري شفاف PNG" : "Masked Output transparent"}</p>
                  <div className="w-24 h-24 mx-auto border-2 border-emerald-400 bg-[linear-gradient(45deg,#1e293b_25%,transparent_25%),linear-gradient(-45deg,#1e293b_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1e293b_75%),linear-gradient(-45deg,transparent_75%,#1e293b_75%)] bg-[size:10px_10px] rounded-xl flex items-center justify-center overflow-hidden">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-emerald-300 border border-emerald-400/40 font-bold text-[9px]">
                      {isAr ? "رسم شفاف" : "Cutout"}
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-300 text-center max-w-lg mx-auto">
                ⚡ {isAr 
                  ? "تقنية عزل الخلفية تعتمد على تقنية Segmentation مدمجة محليا. تقوم بتوليد قناع حجب يعزل العنصر بدقة فائقة وتصديره بخلفية شفافة تماماً." 
                  : "A lightweight segmentation network draws dynamic contours around focus items (faces/objects), replacing background pixels with solid alpha."
                }
              </p>
            </div>
          )}

          {selectedDemoTab === 'ocr' && (
            <div className="space-y-6 my-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                  <p className="text-[10px] text-amber-500 font-bold">{isAr ? "فحص سطور الصورة المستهدفة" : "Image Document scanning"}</p>
                  <div className="font-serif text-[10px] text-white p-3 bg-slate-950 rounded border border-purple-500/20 relative">
                    <div className="absolute inset-x-0 h-0.5 bg-indigo-500 animate-scan"></div>
                    <p className="text-gray-250 leading-relaxed text-right font-bold">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
                    <p className="text-gray-250 leading-relaxed text-right">مرحبًا بكم في برنامج برو ميديا الذكي</p>
                  </div>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl border border-emerald-500/20 space-y-2">
                  <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>{isAr ? "النص الرقمي المستخرج" : "Digital Text Extracted"}</span>
                  </p>
                  <textarea 
                    readOnly 
                    value={isAr ? "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ\nمرحبًا بكم في برنامج برو ميديا الذكي" : "Welcome to Pro Media Smart Suite"}
                    className="w-full h-16 bg-slate-950 border-0 rounded text-[10px] text-white p-2 focus:outline-none font-sans text-right"
                  />
                  <span className="text-[8px] text-gray-500 float-right font-mono">Powered by Tesseract.js</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-300 text-center max-w-lg mx-auto">
                📝 {isAr 
                  ? "يتم فحص مصفوفات البكسل بمرور تصفية متسلسل، حيث تتعرف الخوارزميات الذكية على الحروف العربية والإنجليزية بشكل مذهل وتقوم باسترجاع النصوص فورياً." 
                  : "The neural networks read pixel density curves and match them to character libraries inside the browser memory sandbox, outputting raw text."
                }
              </p>
            </div>
          )}

          {selectedDemoTab === 'pdf' && (
            <div className="space-y-6 my-auto">
              <div className="flex flex-col md:flex-row items-center justify-around gap-4">
                <div className="flex items-center gap-2">
                  <div className="p-3 bg-slate-900 text-red-400 rounded-xl border border-red-500/30 text-center">
                    <Files className="w-5 h-5 mx-auto" />
                    <span className="text-[8px] font-bold block mt-1">doc_A.pdf</span>
                  </div>
                  <span className="text-white text-xs font-bold">+</span>
                  <div className="p-3 bg-slate-900 text-red-400 rounded-xl border border-red-500/30 text-center">
                    <Files className="w-5 h-5 mx-auto" />
                    <span className="text-[8px] font-bold block mt-1">doc_B.pdf</span>
                  </div>
                </div>

                <div className="text-center">
                  <Shuffle className="w-6 h-6 text-indigo-400 mx-auto animate-spin-slow" />
                  <span className="text-[9px] text-purple-300 font-mono">PDF-lib processing</span>
                </div>

                <div className="p-4 bg-slate-900 border border-emerald-450 text-emerald-400 rounded-2xl text-center max-w-[150px]">
                  <Layers className="w-6 h-6 mx-auto text-emerald-400" />
                  <span className="text-[9px] font-bold block mt-1">merged_result.pdf</span>
                  <p className="text-[8px] text-gray-400">Combined & optimized</p>
                </div>
              </div>

              <p className="text-[11px] text-slate-300 text-center max-w-lg mx-auto">
                📂 {isAr 
                  ? "تقوم المكتبة بتفكيك الخصائص الداخلية لملفات PDF وتجميع الصفحات، التوقيعات، والخطوط، لتنسيق ملف موحد وبثوانٍ معدودة." 
                  : "PDF-lib parses underlying stream blocks from selected documents, assembling pages and cross-references into a clean binary Blob."
                }
              </p>
            </div>
          )}

          <div className="border-t border-slate-900 pt-3 flex justify-between items-center text-[10px] text-gray-400 leading-normal">
            <span>💻 {isAr ? "الخصوصية في المتصفح" : "Browser sandboxing active"}</span>
            <span className="font-extrabold font-mono text-purple-400 animate-pulse">{isAr ? "أمان تام وبدون إعلانات" : "Offline enabled"}</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: EXPLANATION OF EVERY SINGLE TOOL */}
      <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-purple-100/50 dark:border-slate-700/50 shadow-sm space-y-6">
        <div className="flex items-center gap-2.5 border-b border-gray-100 dark:border-slate-700/50 pb-4">
          <BookOpen className="w-5 h-5 text-indigo-600 dark:text-purple-400" />
          <div>
            <h3 className="font-extrabold text-purple-950 dark:text-white text-base">
              {isAr ? "دليل الأدوات: الشرح والاستخدام" : "Toolbook: Features & Guide"}
            </h3>
            <p className="text-[11px] text-gray-400">{isAr ? "تصفح تفاصيل كل أداة موجودة في التطبيق وكيفية توظيفها بالمثالية" : "Comprehensive guide addressing exact procedures for optimal document results."}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {toolsExplanations.map((exp, idx) => {
            const IconComponent = exp.icon;
            return (
              <div 
                key={idx}
                className="bg-gray-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-3.5 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-100 dark:bg-purple-950 text-indigo-700 dark:text-purple-300 rounded-xl">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{exp.title}</h4>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-slate-300 leading-relaxed">
                    {exp.desc}
                  </p>
                </div>
                <div className="bg-indigo-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-indigo-100/50 dark:border-slate-700/60 text-[10px] text-indigo-800 dark:text-indigo-300 font-bold">
                  {exp.tip}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: FAQ SECTION (Collapsible Animated Accordion) */}
      <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-purple-100/50 dark:border-slate-700/50 shadow-sm space-y-6">
        <div className="flex items-center gap-2.5 border-b border-gray-100 dark:border-slate-700/50 pb-4">
          <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-purple-400" />
          <div>
            <h3 className="font-extrabold text-purple-950 dark:text-white text-base">
              {isAr ? "الأسئلة الشائعة والمجيبة" : "Frequently Asked Questions (FAQ)"}
            </h3>
            <p className="text-[11px] text-gray-400">{isAr ? "إجابات مفصلة دقيقة فنية من المهندسين المطورين لتطبيق برو ميديا" : "Learn more about sandbox limits, library mechanics, and overall privacy."}</p>
          </div>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = activeAccordion === idx;
            return (
              <div 
                key={idx}
                className="border border-purple-50 dark:border-slate-700/50 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/40 transition-colors"
              >
                <button
                  onClick={() => setActiveAccordion(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-4.5 text-right font-bold text-xs text-slate-900 dark:text-white cursor-pointer hover:bg-purple-100/20 focus:outline-none"
                >
                  <span className="leading-snug">{isAr ? faq.qAr : faq.qEn}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-purple-650 dark:text-purple-300 shrink-0 select-none" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 select-none" />
                  )}
                </button>

                {isOpen && (
                  <div className="p-4.5 pt-0 text-xs text-gray-500 dark:text-gray-300 leading-relaxed border-t border-purple-50/50 dark:border-slate-700/30 bg-white dark:bg-slate-800/50 animate-slideDown">
                    {isAr ? faq.aAr : faq.aEn}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 4: TECHNICAL ARCHITECTURE SPECIFICATIONS */}
      <div className="bg-gradient-to-br from-indigo-900/20 to-purple-950/20 p-6 md:p-8 rounded-4xl border border-purple-150 dark:border-slate-700/60 space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-purple-100 dark:bg-purple-950/65 p-2.5 rounded-2xl text-purple-700 dark:text-purple-300">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm md:text-base text-purple-950 dark:text-white">
              {isAr ? "المعمارية التقنية للمنصة والاعتمادات" : "On-Device Open Source Stack Hub"}
            </h3>
            <p className="text-[11px] text-gray-400 dark:text-gray-300">{isAr ? "صفر خوادم خارجية، صفر ملفات ترفع للإنترنت، أداء محلي آمن وموثوق" : "We believe in user security and complete tool trust. Here is our completely open architecture:"}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-purple-50 dark:border-slate-700/40 text-center space-y-2">
            <h4 className="font-extrabold text-xs text-purple-950 dark:text-white border-b border-purple-50 dark:border-slate-700/30 pb-2">PDF & Books Engine</h4>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              {isAr 
                ? "مبني على PDF-lib و PDF.js من موزيلا لمعالجة الصفحات واستخراج النصوص والأبعاد محلياً 100% وبسرعة ممتازة." 
                : "Powered by PDF-lib and Mozilla's PDF.js to split, capture, merge and annotate standard books."
              }
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-purple-50 dark:border-slate-705/40 text-center space-y-2">
            <h4 className="font-extrabold text-xs text-purple-950 dark:text-white border-b border-purple-50 dark:border-slate-700/30 pb-2">Vision & OCR Core</h4>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              {isAr 
                ? "يستخدم محرك Tesseract.js الذكي المعتمد دولياً لقراءة ورسم الحروف والتعرف على الخطوط المكتوبة." 
                : "Tesseract.js scans letter alignments in local memory with high neural-network precision."
              }
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-purple-50 dark:border-slate-700/40 text-center space-y-2">
            <h4 className="font-extrabold text-xs text-purple-950 dark:text-white border-b border-purple-50 dark:border-slate-700/30 pb-2">Neural Segmentations</h4>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              {isAr 
                ? "عزل خلفيات صور البورتريه والمنتجات محلياً عبر مكتبات @imgly/background-removal دون مساعدة أي خوادم." 
                : "Imgly neural network components perform offline segmentation masks cleanly inside deep scopes."
              }
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-purple-50 dark:border-slate-700/40 text-center space-y-2">
            <h4 className="font-extrabold text-xs text-purple-950 dark:text-white border-b border-purple-50 dark:border-slate-700/30 pb-2">Transformers Layer</h4>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              {isAr 
                ? "مكتبة Transformers.js للذكاء الاصطناعي تسمح بتنفيذ عمليات الاستنتاج والتلخيص للغة مباشرة بالمتصفح." 
                : "Transformers.js enables on-device deep NLP summarization and generation directly in memory."
              }
            </p>
          </div>
        </div>

        <div className="bg-purple-100/50 dark:bg-slate-800 p-4 rounded-2xl text-center text-[11px] text-purple-900 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-900/50">
          🔒 {isAr ? "جميع المكتبات مجانية مئة بالمائة، آمنة ومفتوحة المصدر بالكامل وخالية من أي ملفات تتبع أو إفشاء للبيانات." : "No cookies tracking, zero external telemetry data leaks. 100% of code belongs in your sandbox."}
        </div>
      </div>

    </div>
  );
};

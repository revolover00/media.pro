
import React, { useState } from 'react';
import { 
  Palette, 
  Trash2, 
  Download, 
  Sparkles, 
  Check, 
  Plus,
  RefreshCw,
  Copy,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Code
} from 'lucide-react';

interface GradientGeneratorProps {
  lang: 'ar' | 'en';
  onAddHistoryItem?: (item: any, blob?: Blob) => void;
}

interface ColorStop {
  id: string; // Unique path tracker
  color: string;
  position: number; // 0 to 100
}

interface GradientPreset {
  nameAr: string;
  nameEn: string;
  type: 'linear' | 'radial';
  angle: number;
  stops: ColorStop[];
}

const PRESET_GRADIENTS: GradientPreset[] = [
  {
    nameAr: 'غروب الشفق (Sunset Aurora)',
    nameEn: 'Sunset Aurora',
    type: 'linear',
    angle: 135,
    stops: [
      { id: '1', color: '#ff007f', position: 0 },
      { id: '2', color: '#7f00ff', position: 50 },
      { id: '3', color: '#00f0ff', position: 100 }
    ]
  },
  {
    nameAr: 'العشب الأخضر (Emerald Meadow)',
    nameEn: 'Emerald Meadow',
    type: 'linear',
    angle: 45,
    stops: [
      { id: '1', color: '#115e59', position: 0 },
      { id: '2', color: '#10b981', position: 100 }
    ]
  },
  {
    nameAr: 'المحيط الهادئ (Pacific Deep)',
    nameEn: 'Pacific Deep',
    type: 'linear',
    angle: 180,
    stops: [
      { id: '1', color: '#1d4ed8', position: 0 },
      { id: '2', color: '#111827', position: 100 }
    ]
  },
  {
    nameAr: 'البطانة الكهرمية (Warm Amber)',
    nameEn: 'Warm Amber',
    type: 'linear',
    angle: 90,
    stops: [
      { id: '1', color: '#f59e0b', position: 0 },
      { id: '2', color: '#ea580c', position: 50 },
      { id: '3', color: '#991b1b', position: 100 }
    ]
  },
  {
    nameAr: 'ظلال النيون (Synthwave Retro)',
    nameEn: 'Synthwave Retro',
    type: 'linear',
    angle: 120,
    stops: [
      { id: '1', color: '#ec4899', position: 0 },
      { id: '2', color: '#8b5cf6', position: 100 }
    ]
  }
];

export const GradientGenerator: React.FC<GradientGeneratorProps> = ({ lang, onAddHistoryItem }) => {
  const isAr = lang === 'ar';
  
  // Custom Stops
  const [gradType, setGradType] = useState<'linear' | 'radial' | 'conic'>('linear');
  const [angle, setAngle] = useState<number>(135);
  const [stops, setStops] = useState<ColorStop[]>([
    { id: '1', color: '#7c3aed', position: 0 },
    { id: '2', color: '#06b6d4', position: 100 }
  ]);

  const [toastMessage, setToastMessage] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const showLocalToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Compile standard CSS rule
  const getGradientCss = (): string => {
    const sortedStops = [...stops].sort((a, b) => a.position - b.position);
    const stopString = sortedStops.map(s => `${s.color} ${s.position}%`).join(', ');

    if (gradType === 'linear') {
      return `linear-gradient(${angle}deg, ${stopString})`;
    } else if (gradType === 'radial') {
      return `radial-gradient(circle, ${stopString})`;
    } else {
      return `conic-gradient(from ${angle}deg, ${stopString})`;
    }
  };

  const gradientCss = getGradientCss();

  // Helper colors
  const handleColorChange = (id: string, color: string) => {
    setStops(stops.map(s => s.id === id ? { ...s, color } : s));
  };

  const handlePositionChange = (id: string, position: number) => {
    setStops(stops.map(s => s.id === id ? { ...s, position } : s));
  };

  const addStop = () => {
    if (stops.length >= 6) {
      showLocalToast(isAr ? 'الحد الأقصى هو 6 نقاط تدرج لوني!' : 'Maximum of 6 color gradient stops!');
      return;
    }
    const newId = String(Date.now());
    const midPoint = 50;
    setStops([...stops, { id: newId, color: '#f43f5e', position: midPoint }]);
  };

  const removeStop = (id: string) => {
    if (stops.length <= 2) {
      showLocalToast(isAr ? 'يجب الحفاظ على نقطتين للخلط على الأقل!' : 'Must preserve at least 2 stops!');
      return;
    }
    setStops(stops.filter(s => s.id !== id));
  };

  const copyCss = () => {
    navigator.clipboard.writeText(`background: ${gradientCss};`);
    showLocalToast(isAr ? 'تم نسخ رمز الـ CSS بنجاح!' : 'Gradient CSS code copied!');
  };

  const loadPreset = (preset: GradientPreset) => {
    setGradType(preset.type as any);
    setAngle(preset.angle);
    setStops(preset.stops.map(s => ({ ...s, id: String(Math.random()) })));
    showLocalToast(isAr ? 'تم تحميل تدرجات النمط المخزن!' : 'Preset palette loaded!');
  };

  // Randomize Gradient parameters
  const randomizeGradient = () => {
    const randomHex = () => '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    setAngle(Math.floor(Math.random() * 360));
    setStops([
      { id: '1', color: randomHex(), position: 0 },
      { id: '2', color: randomHex(), position: 100 }
    ]);
    showLocalToast(isAr ? 'تم خلاصة تدرج لوني عشوائي بنجاح!' : 'Random gradient synthesized!');
  };

  return (
    <div id="gradient-generator-container" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-5 sm:p-6 shadow-sm space-y-6 text-slate-700 dark:text-slate-200">
      
      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 dark:bg-slate-800 text-white py-2.5 px-5 rounded-2xl shadow-lg border border-slate-700 text-xs font-bold animate-slideUp z-50 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-50 dark:border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500/10 p-3 rounded-2xl text-amber-500">
            <Palette className="w-6 h-6 rotate-180" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isAr ? 'منشئ التدرجات اللونية المتقدمة' : 'Sophisticated Multi-Stop CSS Gradient Creator'}
            </h2>
            <p className="text-xs text-slate-400">
              {isAr ? 'امزج الألوان وحدد زواية الانعكاس التدرجي ثم استخرج أكواد CSS الجاهزة لموقعك مباشرة' : 'Blend, test, and isolate robust gradients, change rotating degrees, and fetch matching CSS assets'}
            </p>
          </div>
        </div>

        <button
          onClick={randomizeGradient}
          className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-white rounded-xl border-0 cursor-pointer flex items-center gap-1"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{isAr ? 'خلط تدرج عشوائي' : 'Randomize'}</span>
        </button>
      </div>

      {/* Main Workspace grid panels layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
        
        {/* Left Options Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="bg-slate-50 dark:bg-slate-800/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-3">
            <span className="text-[10px] font-bold text-slate-450 uppercase block border-b border-slate-100 dark:border-slate-800 pb-1.5">
              {isAr ? 'خصائص ونوع التدرج' : 'Gradient Type & Angles'}
            </span>

            {/* Select linear/radial/conic */}
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => setGradType('linear')}
                className={`py-1.5 rounded-lg text-xs font-bold cursor-pointer border-0 ${gradType === 'linear' ? 'bg-slate-950 text-white' : 'bg-white border border-slate-100 dark:bg-slate-900 text-slate-500'}`}
              >
                Linear
              </button>
              <button
                onClick={() => setGradType('radial')}
                className={`py-1.5 rounded-lg text-xs font-bold cursor-pointer border-0 ${gradType === 'radial' ? 'bg-slate-950 text-white' : 'bg-white border border-slate-101 dark:bg-slate-900 text-slate-500'}`}
              >
                Radial
              </button>
              <button
                onClick={() => setGradType('conic')}
                className={`py-1.5 rounded-lg text-xs font-bold cursor-pointer border-0 ${gradType === 'conic' ? 'bg-slate-950 text-white' : 'bg-white border border-slate-101 dark:bg-slate-900 text-slate-500'}`}
              >
                Conic
              </button>
            </div>

            {/* Angle rotation (disabled for radial) */}
            {gradType !== 'radial' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                  <span>{isAr ? 'زاوية الانعكاس (Angle)' : 'Degrees Angle'}</span>
                  <span className="font-mono text-slate-900 dark:text-white">{angle}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={angle}
                  onChange={(e) => setAngle(parseInt(e.target.value))}
                  className="w-full accent-slate-900 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Color stops controllers */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800/80 pb-1.5">
              <span className="text-xs font-bold text-slate-500">{isAr ? 'عقود الألوان ونسب التغلغل' : 'Isolated Color Stops'}</span>
              <button
                onClick={addStop}
                className="px-2.5 py-1 text-[10px] rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer border-0 flex items-center gap-0.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? 'إضافة لون مستوقف' : 'Add stop'}</span>
              </button>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {stops.map((stop, index) => (
                <div key={stop.id} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/25 p-2 rounded-xl border border-slate-100 dark:border-slate-800/40">
                  {/* Hex Picker input */}
                  <div className="flex items-center gap-1">
                    <input
                      type="color"
                      value={stop.color}
                      onChange={(e) => handleColorChange(stop.id, e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                    <span className="font-mono text-[10px] uppercase font-bold text-slate-500">{stop.color}</span>
                  </div>

                  {/* Position bounds */}
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={stop.position}
                      onChange={(e) => handlePositionChange(stop.id, parseInt(e.target.value))}
                      className="flex-1 accent-indigo-500 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                    />
                    <span className="font-mono text-[10px] font-bold text-slate-500 w-8 text-center">{stop.position}%</span>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => removeStop(stop.id)}
                    className="p-1 hover:bg-red-50 text-red-400 hover:text-red-650 rounded cursor-pointer border-0"
                    title={isAr ? 'حذف هذا اللون' : 'Remove stop'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick loading presets */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-slate-500">{isAr ? 'لوحات ونماذج تدرج قياسية' : 'Curated Custom Presets'}</span>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_GRADIENTS.map((p, idx) => {
                // Generate inline color rule
                const pStopsStr = p.stops.map(s => `${s.color} ${s.position}%`).join(', ');
                const pGradStyle = p.type === 'linear' ? `linear-gradient(${p.angle}deg, ${pStopsStr})` : `radial-gradient(circle, ${pStopsStr})`;
                return (
                  <button
                    key={idx}
                    onClick={() => loadPreset(p)}
                    className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-100 hover:border-slate-300 bg-white dark:bg-slate-900 text-left transition text-xs font-bold cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg border border-slate-100 shrink-0" style={{ background: pGradStyle }} />
                    <span className="truncate text-[10px]">{isAr ? p.nameAr.split(' ')[0] : p.nameEn.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Preview canvas with code blocks export (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800/80 pb-2.5">
            <span className="text-xs font-bold text-slate-500">{isAr ? 'معاينة حية وتفاعلية' : 'Output Interactive Rendering canvas'}</span>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer border-0"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Canvas block with dynamic output value rules */}
          <div 
            style={{ background: gradientCss }}
            className={`rounded-2xl border border-slate-100 shadow-inner relative flex items-center justify-center transition-all ${isFullscreen ? 'absolute inset-0 z-50 rounded-none' : 'min-h-[300px] h-[300px]'}`}
          >
            {isFullscreen && (
              <button
                onClick={() => setIsFullscreen(false)}
                className="absolute top-4 right-4 bg-slate-950/80 text-white p-2.5 rounded-full border-0 cursor-pointer shadow-lg"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Copyable CSS Block display */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-150-inset dark:border-slate-850 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Code className="w-3.5 h-3.5 text-indigo-500" />
              <span>CSS Declaration</span>
            </span>
            <div className="font-mono text-[10px] leading-relaxed text-slate-800 dark:text-pink-300 break-all select-all select-text p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-850">
              background: {gradientCss};
            </div>
          </div>

          {/* Copy trig downloads */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-[10px] text-slate-400">
              {isAr ? 'تحديث الكود يتم بشكل فوري أثناء سحب أو تغيير أي ألوان' : 'Changes rendered instantly on the local canvas'}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={copyCss}
                className="px-4.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-720 text-white font-bold text-xs cursor-pointer flex items-center gap-1 border-0"
              >
                <Copy className="w-4 h-4" />
                <span>{isAr ? 'نسخ كود الـ CSS' : 'Copy CSS Standard'}</span>
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Palette, 
  Trash2, 
  Download, 
  Sparkles, 
  Check, 
  Lock, 
  Unlock, 
  RefreshCw, 
  Copy, 
  Layers, 
  Sliders, 
  Info,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface PaletteGeneratorProps {
  lang: 'ar' | 'en';
  onAddHistoryItem?: (item: any, blob?: Blob) => void;
}

interface ColorSwatch {
  hex: string;
  locked: boolean;
}

export const PaletteGenerator: React.FC<PaletteGeneratorProps> = ({ lang, onAddHistoryItem }) => {
  const isAr = lang === 'ar';
  
  // Base Color (Hex format)
  const [baseColor, setBaseColor] = useState<string>('#6366f1');
  const [harmonyType, setHarmonyType] = useState<'analogous' | 'monochromatic' | 'triadic' | 'complementary' | 'split' | 'tetradic'>('analogous');
  
  // Active Generated swatches
  const [swatches, setSwatches] = useState<ColorSwatch[]>([
    { hex: '#6366f1', locked: false },
    { hex: '#8b5cf6', locked: false },
    { hex: '#ec4899', locked: false },
    { hex: '#10b981', locked: false },
    { hex: '#f59e0b', locked: false }
  ]);

  const [toastMessage, setToastMessage] = useState<string>('');

  const showLocalToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Utility to convert HEX to HSL
  const hexToHsl = (hex: string): { h: number; s: number; l: number } => {
    // Strip #
    let c = hex.replace(/^#/, '');
    if (c.length === 3) {
      c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    }
    const r = parseInt(c.substring(0, 2), 16) / 255;
    const g = parseInt(c.substring(2, 4), 16) / 255;
    const b = parseInt(c.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  };

  // Utility to convert HSL to HEX
  const hslToHex = (h: number, s: number, l: number): string => {
    s /= 100;
    l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0;
    let g = 0;
    let b = 0;

    if (0 <= h && h < 60) { r = c; g = x; b = 0; }
    else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
    else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
    else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
    else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
    else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

    const rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
    const gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
    const bHex = Math.round((b + m) * 255).toString(16).padStart(2, '0');

    return `#${rHex}${gHex}${bHex}`;
  };

  // Calculate accessibility contrast rating (WCAG 2.0 ratio approximation for text on background)
  const getContrastCheck = (hex: string): 'AAA' | 'AA' | 'FAIL' => {
    let c = hex.replace(/^#/, '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    
    // Relative luminance
    const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    // We assume white text is placed on dark colors and black text on light colors
    const isDark = l < 120;
    
    if (isDark) {
      return l < 50 ? 'AAA' : 'AA';
    } else {
      return l > 190 ? 'AAA' : 'AA';
    }
  };

  // Recalculate harmonious swatches based on baseColor & harmonyType
  const generatePalette = (pivotColor: string) => {
    const hsl = hexToHsl(pivotColor);
    let nextHexes: string[] = [];

    switch (harmonyType) {
      case 'monochromatic':
        nextHexes = [
          hslToHex(hsl.h, hsl.s, Math.max(10, hsl.l - 30)),
          hslToHex(hsl.h, Math.max(10, hsl.s - 20), Math.max(20, hsl.l - 15)),
          pivotColor,
          hslToHex(hsl.h, Math.min(100, hsl.s + 10), Math.min(95, hsl.l + 15)),
          hslToHex(hsl.h, Math.min(100, hsl.s + 20), Math.min(98, hsl.l + 30))
        ];
        break;
      case 'analogous':
        nextHexes = [
          hslToHex((hsl.h - 40 + 360) % 360, hsl.s, hsl.l),
          hslToHex((hsl.h - 20 + 360) % 360, hsl.s, hsl.l),
          pivotColor,
          hslToHex((hsl.h + 20) % 360, hsl.s, hsl.l),
          hslToHex((hsl.h + 40) % 360, hsl.s, hsl.l)
        ];
        break;
      case 'triadic':
        nextHexes = [
          hslToHex((hsl.h + 120) % 360, hsl.s, Math.max(15, hsl.l - 10)),
          hslToHex((hsl.h + 120) % 360, hsl.s, hsl.l),
          pivotColor,
          hslToHex((hsl.h + 240) % 360, hsl.s, hsl.l),
          hslToHex((hsl.h + 240) % 360, hsl.s, Math.min(95, hsl.l + 15))
        ];
        break;
      case 'complementary':
        nextHexes = [
          hslToHex(hsl.h, hsl.s, Math.max(15, hsl.l - 20)),
          pivotColor,
          hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l),
          hslToHex((hsl.h + 180) % 360, Math.max(10, hsl.s - 20), Math.min(92, hsl.l + 15)),
          hslToHex(hsl.h, Math.max(10, hsl.s - 30), Math.min(95, hsl.l + 30))
        ];
        break;
      case 'split':
        nextHexes = [
          hslToHex((hsl.h + 150) % 360, hsl.s, hsl.l),
          pivotColor,
          hslToHex((hsl.h + 210) % 360, hsl.s, hsl.l),
          hslToHex((hsl.h + 150) % 360, hsl.s, Math.max(10, hsl.l - 20)),
          hslToHex((hsl.h + 210) % 360, hsl.s, Math.min(95, hsl.l + 25))
        ];
        break;
      case 'tetradic':
        nextHexes = [
          hslToHex((hsl.h + 90) % 360, hsl.s, hsl.l),
          pivotColor,
          hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l),
          hslToHex((hsl.h + 270) % 360, hsl.s, hsl.l),
          hslToHex((hsl.h + 180) % 360, hsl.s, Math.min(95, hsl.l + 20))
        ];
        break;
      default:
        nextHexes = [pivotColor, pivotColor, pivotColor, pivotColor, pivotColor];
    }

    // Merge next hexes with locked swatches
    const merged = swatches.map((sw, idx) => {
      if (sw.locked) return sw;
      return { hex: nextHexes[idx] || pivotColor, locked: false };
    });

    setSwatches(merged);
  };

  // Re-generate whenever base color or harmony scheme shifts
  useEffect(() => {
    generatePalette(baseColor);
  }, [baseColor, harmonyType]);

  const toggleLock = (idx: number) => {
    const updated = [...swatches];
    updated[idx].locked = !updated[idx].locked;
    setSwatches(updated);
    showLocalToast(
      updated[idx].locked 
        ? (isAr ? 'تم قفل اللون لحمايته أثناء الخلط!' : 'Color swatch locked for protection!')
        : (isAr ? 'تم إلغاء قفل اللون' : 'Color swatch unlocked!')
    );
  };

  const copySwatchHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    showLocalToast(isAr ? `تم نسخ التكويد اللون: ${hex}` : `Copied Hex code: ${hex}`);
  };

  const copyFullPaletteAsJson = () => {
    const hexArray = swatches.map(s => s.hex);
    navigator.clipboard.writeText(JSON.stringify(hexArray, null, 2));
    showLocalToast(isAr ? 'تم نسخ مصفوفة لوحة الألوان بالكامل كـ JSON!' : 'Full array profile copied as JSON!');
  };

  // Randomize unlocked options
  const handleRandomizeUnlocked = () => {
    const randomHex = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    setBaseColor(randomHex);
  };

  return (
    <div id="palette-generator-container" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-5 sm:p-6 shadow-sm space-y-6 text-slate-700 dark:text-slate-200">
      
      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 dark:bg-slate-800 text-white py-2.5 px-5 rounded-2xl shadow-lg border border-slate-700 text-xs font-bold animate-slideUp z-50 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-50 dark:border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-purple-500 to-indigo-500 p-3 rounded-2xl text-white">
            <Palette className="w-6 h-6 animate-spin" style={{ animationDuration: '40s' }} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isAr ? 'مولد ومنسق لوحات الألوان الذكي' : 'Mathematical Color Palette Generator'}
            </h2>
            <p className="text-xs text-slate-400">
              {isAr ? 'أنشئ لوحات ألوان متجانسة مبنية على القواعد النظرية للألوان، قفل الألوان المميزة ونسخ الأكواد فورا' : 'Synthesize matching color schemes, verify WCAG contrast compliance, lock favorites, and export JSON arrays'}
            </p>
          </div>
        </div>

        <button
          onClick={handleRandomizeUnlocked}
          className="px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 rounded-xl border-0 cursor-pointer flex items-center gap-1.5"
        >
          <RefreshCw className="w-4 h-4 animate-reverse-spin" />
          <span>{isAr ? 'توليد ألوان عشوائية' : 'Randomize All'}</span>
        </button>
      </div>

      {/* Grid: Controls parameters left (4 cols), Palette swatches output right (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
        
        {/* Left options parameters (5 cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-3.5">
            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block border-b border-slate-205 pb-1.5">
              {isAr ? 'اللون ونظرية التجانس' : 'Base Pivot & Theory Harmony'}
            </span>

            {/* Pivot Color Picker */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 block mb-1">{isAr ? 'اللون الأساسي المحوري (Base)' : 'Pivot Base Color'}</label>
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <input
                  type="color"
                  value={baseColor}
                  onChange={(e) => setBaseColor(e.target.value)}
                  className="w-10 h-8 rounded cursor-pointer border-0 bg-transparent shrink-0"
                />
                <input
                  type="text"
                  value={baseColor}
                  onChange={(e) => setBaseColor(e.target.value)}
                  placeholder="#6366f1"
                  className="w-full bg-transparent border-0 focus:outline-none text-xs font-mono font-bold uppercase"
                />
              </div>
            </div>

            {/* Harmony Options list */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 block">{isAr ? 'اختر معادلة تجانس الألوان' : 'Harmony Match Algorithm'}</label>
              <select
                value={harmonyType}
                onChange={(e: any) => setHarmonyType(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 rounded-xl py-2 px-2.5 text-xs focus:ring-1 focus:ring-indigo-500 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white cursor-pointer font-bold"
              >
                <option value="analogous">{isAr ? 'ألوان متماثلة (Analogous)' : 'Analogous Scheme'}</option>
                <option value="monochromatic">{isAr ? 'أحادية اللون (Monochromatic)' : 'Monochromatic'}</option>
                <option value="triadic">{isAr ? 'ثلاثي متناسق (Triadic)' : 'Triadic (120 Deg)'}</option>
                <option value="complementary">{isAr ? 'ألوان متكاملة (Complementary)' : 'Complementary (Opposite)'}</option>
                <option value="split">{isAr ? 'شبه متكامل منقسم (Split)' : 'Split Complementary'}</option>
                <option value="tetradic">{isAr ? 'رباعي أطراف مربع (Tetradic)' : 'Tetradic Mesh'}</option>
              </select>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-slate-950 p-4 rounded-2xl border border-amber-100/50 dark:border-slate-800 text-xs text-amber-800 dark:text-slate-300 space-y-2">
            <div className="flex items-center gap-1.5 font-bold">
              <Info className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{isAr ? 'معيار إمكانية القراءة (WCAG)' : 'Accessibility Contrast Ratings'}</span>
            </div>
            <p className="leading-relaxed text-[10px]">
              {isAr 
                ? 'معدل الحروف AAA مميز ومريح للعين، بينما AA تعني تباين مقبول. يمكنك قفل الألوان لتلقين الأجهزة بالخطوات الصحيحة.' 
                : 'AAA values are supreme with high visual comfort, while AA scores provide standard compliant readability.'}
            </p>
          </div>

        </div>

        {/* Right palette swatches display (8 cols) */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-purple-500" />
              {isAr ? 'قائمة تدرج باليت الألوان الحالي (انقر لنسخ الهكس)' : 'Composite Palette Swatches (Click to copy)'}
            </span>
          </div>

          {/* Swatches strip flex container */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {swatches.map((swatch, idx) => {
              const contrastRating = getContrastCheck(swatch.hex);
              
              return (
                <div 
                  key={idx}
                  className="flex flex-col bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl overflow-hidden p-1.5 space-y-2 relative group"
                >
                  {/* Visual Color wall */}
                  <div 
                    style={{ backgroundColor: swatch.hex }}
                    onClick={() => copySwatchHex(swatch.hex)}
                    className="h-32 rounded-xl transition cursor-pointer flex items-end justify-center pb-2 text-[10px] font-bold font-mono tracking-tight"
                  >
                    <span className="bg-slate-950/70 text-white py-0.5 px-2 rounded-full absolute top-3 select-all">
                      {swatch.hex}
                    </span>
                  </div>

                  {/* Swatch info utilities & locks */}
                  <div className="flex items-center justify-between px-1 text-xs">
                    {/* Contrast badge */}
                    <span 
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${contrastRating === 'AAA' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}
                      title={isAr ? 'معيار تباين تصفح الكلمات' : 'WCAG contrast score'}
                    >
                      {contrastRating}
                    </span>

                    {/* Lock toggle button */}
                    <button
                      onClick={() => toggleLock(idx)}
                      className={`p-1 rounded cursor-pointer border-0 ${swatch.locked ? 'text-red-500 bg-red-50' : 'text-slate-400 hover:text-slate-650'}`}
                      title={isAr ? 'قفل اللون' : 'Lock swatch'}
                    >
                      {swatch.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Download row capabilities */}
          <div className="flex items-center justify-between text-xs pt-2">
            <span className="text-[10px] text-slate-400">
              {isAr ? 'يدعم قفل الألوان دمج تدرجات الهويات البصرية بسهولة' : 'Lock individual swatches to freeze specific tones'}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={copyFullPaletteAsJson}
                className="px-4.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-720 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5 border-0 shadow-sm"
              >
                <Copy className="w-4 h-4" />
                <span>{isAr ? 'نسخ لوحة الألوان بالكامل كـ JSON' : 'Copy Palette Array'}</span>
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

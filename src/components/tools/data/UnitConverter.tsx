
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftRight, 
  Copy, 
  Star, 
  HelpCircle, 
  Scale, 
  Move3d, 
  Thermometer, 
  Layers, 
  Compass, 
  Clock, 
  Coins, 
  HardDrive,
  Check,
  Zap,
  Globe
} from 'lucide-react';

interface UnitConverterProps {
  lang: 'ar' | 'en';
  onAddHistoryItem?: (item: any, blob?: Blob) => void;
}

interface Unit {
  id: string;
  labelAr: string;
  labelEn: string;
  // Multiplier to base unit (or logic for temperature)
  ratio?: number; 
}

interface Category {
  id: string;
  icon: any;
  titleAr: string;
  titleEn: string;
  baseUnitId: string;
  units: Unit[];
}

const CATEGORIES: Category[] = [
  {
    id: 'length',
    icon: Move3d,
    titleAr: 'الطول والمسافات (Length)',
    titleEn: 'Length & Distance',
    baseUnitId: 'm',
    units: [
      { id: 'mm', labelAr: 'مليمتر (mm)', labelEn: 'Millimeter', ratio: 0.001 },
      { id: 'cm', labelAr: 'سنتيمتر (cm)', labelEn: 'Centimeter', ratio: 0.01 },
      { id: 'm', labelAr: 'متر (m)', labelEn: 'Meter', ratio: 1 },
      { id: 'km', labelAr: 'كيلومتر (km)', labelEn: 'Kilometer', ratio: 1000 },
      { id: 'in', labelAr: 'بوصة (in)', labelEn: 'Inch', ratio: 0.0254 },
      { id: 'ft', labelAr: 'قدم (ft)', labelEn: 'Foot', ratio: 0.3048 },
      { id: 'yd', labelAr: 'ياردة (yd)', labelEn: 'Yard', ratio: 0.9144 },
      { id: 'mi', labelAr: 'ميل (mi)', labelEn: 'Mile', ratio: 1609.34 }
    ]
  },
  {
    id: 'weight',
    icon: Scale,
    titleAr: 'الكتلة والوزن (Weight)',
    titleEn: 'Weight & Mass',
    baseUnitId: 'kg',
    units: [
      { id: 'mg', labelAr: 'مليغرام (mg)', labelEn: 'Milligram', ratio: 0.000001 },
      { id: 'g', labelAr: 'غرام (g)', labelEn: 'Gram', ratio: 0.001 },
      { id: 'kg', labelAr: 'كيلوغرام (kg)', labelEn: 'Kilogram', ratio: 1 },
      { id: 'lb', labelAr: 'رطل (lb)', labelEn: 'Pound', ratio: 0.453592 },
      { id: 'oz', labelAr: 'أوقية (oz)', labelEn: 'Ounce', ratio: 0.0283495 },
      { id: 'ton', labelAr: 'طن (Ton)', labelEn: 'Metric Ton', ratio: 1000 }
    ]
  },
  {
    id: 'temperature',
    icon: Thermometer,
    titleAr: 'درجات الحرارة (Temperature)',
    titleEn: 'Temperature',
    baseUnitId: 'c',
    units: [
      { id: 'c', labelAr: 'سليزيوس (C°)', labelEn: 'Celsius' },
      { id: 'f', labelAr: 'فهرنهايت (f°)', labelEn: 'Fahrenheit' },
      { id: 'k', labelAr: 'كلفن (K°)', labelEn: 'Kelvin' }
    ]
  },
  {
    id: 'area',
    icon: Layers,
    titleAr: 'المساحة (Area)',
    titleEn: 'Area Sizes',
    baseUnitId: 'sqm',
    units: [
      { id: 'sqcm', labelAr: 'سم مربع (cm²)', labelEn: 'Sq Centimeter', ratio: 0.0001 },
      { id: 'sqm', labelAr: 'متر مربع (m²)', labelEn: 'Sq Meter', ratio: 1 },
      { id: 'sqkm', labelAr: 'كم مربع (km²)', labelEn: 'Sq Kilometer', ratio: 1000000 },
      { id: 'sqft', labelAr: 'قدم مربع (ft²)', labelEn: 'Sq Foot', ratio: 0.092903 },
      { id: 'acre', labelAr: 'فدان (Acre)', labelEn: 'Acre', ratio: 4046.86 },
      { id: 'hectare', labelAr: 'هكتار (Hectare)', labelEn: 'Hectare', ratio: 10000 }
    ]
  },
  {
    id: 'volume',
    icon: Layers,
    titleAr: 'الحجم والسعة (Volume)',
    titleEn: 'Volume & Capacity',
    baseUnitId: 'l',
    units: [
      { id: 'ml', labelAr: 'مليليتر (ml)', labelEn: 'Milliliter', ratio: 0.001 },
      { id: 'l', labelAr: 'ليتر (L)', labelEn: 'Liter', ratio: 1 },
      { id: 'cum', labelAr: 'متر مكعب (m³)', labelEn: 'Cubic Meter', ratio: 1000 },
      { id: 'gal', labelAr: 'جالون (Gal)', labelEn: 'US Gallon', ratio: 3.78541 },
      { id: 'cup', labelAr: 'كوب (Cup)', labelEn: 'Cup', ratio: 0.236588 }
    ]
  },
  {
    id: 'speed',
    icon: Compass,
    titleAr: 'السرعة والتدفق (Speed)',
    titleEn: 'Velocity & Speed',
    baseUnitId: 'mps',
    units: [
      { id: 'mps', labelAr: 'متر/ثانية (m/s)', labelEn: 'Meters per second', ratio: 1 },
      { id: 'kmh', labelAr: 'كم/ساعة (km/h)', labelEn: 'Kilometers per hour', ratio: 0.277778 },
      { id: 'mph', labelAr: 'ميل/ساعة (mph)', labelEn: 'Miles per hour', ratio: 0.44704 },
      { id: 'knot', labelAr: 'عقدة بحرية (Knot)', labelEn: 'Knots', ratio: 0.514444 }
    ]
  },
  {
    id: 'time',
    icon: Clock,
    titleAr: 'الزمن والوقت (Time)',
    titleEn: 'Time & Duration',
    baseUnitId: 's',
    units: [
      { id: 'ms', labelAr: 'ملي ثانية (ms)', labelEn: 'Millisecond', ratio: 0.001 },
      { id: 's', labelAr: 'ثانية (Sec)', labelEn: 'Second', ratio: 1 },
      { id: 'm', labelAr: 'دقيقة (Min)', labelEn: 'Minute', ratio: 60 },
      { id: 'h', labelAr: 'ساعة (Hr)', labelEn: 'Hour', ratio: 3600 },
      { id: 'd', labelAr: 'يوم (Day)', labelEn: 'Day', ratio: 86400 },
      { id: 'w', labelAr: 'أسبوع (Week)', labelEn: 'Week', ratio: 604800 },
      { id: 'mth', labelAr: 'شهر (Month - 30d)', labelEn: 'Academic Month', ratio: 2592000 },
      { id: 'yr', labelAr: 'سنة (Year)', labelEn: 'Calendar Year', ratio: 31536000 }
    ]
  },
  {
    id: 'currencies',
    icon: Coins,
    titleAr: 'العملات القياسية (Currencies)',
    titleEn: 'Standard Currencies',
    baseUnitId: 'usd',
    units: [
      { id: 'usd', labelAr: 'دولار أمريكي ($)', labelEn: 'US Dollar', ratio: 1 },
      { id: 'eur', labelAr: 'يورو (€)', labelEn: 'Euro', ratio: 1.08 },
      { id: 'sar', labelAr: 'ريال سعودي (SAR)', labelEn: 'Saudi Riyal', ratio: 0.27 },
      { id: 'aed', labelAr: 'درهم إماراتي (AED)', labelEn: 'UAE Dirham', ratio: 0.27 },
      { id: 'egp', labelAr: 'جنيه مصري (EGP)', labelEn: 'Egyptian Pound', ratio: 0.021 },
      { id: 'kwd', labelAr: 'دينار كويتي (KWD)', labelEn: 'Kuwaiti Dinar', ratio: 3.25 },
      { id: 'gbp', labelAr: 'جنيه إسترليني (£)', labelEn: 'British Pound', ratio: 1.26 }
    ]
  },
  {
    id: 'data',
    icon: HardDrive,
    titleAr: 'تخزين البيانات والملفات (Data)',
    titleEn: 'Data & Digital Sizes',
    baseUnitId: 'kb',
    units: [
      { id: 'b', labelAr: 'بايت (Byte)', labelEn: 'Bytes', ratio: 0.001 },
      { id: 'kb', labelAr: 'كيلوبايت (KB)', labelEn: 'Kilobytes', ratio: 1 },
      { id: 'mb', labelAr: 'ميغابايت (MB)', labelEn: 'Megabytes', ratio: 1000 },
      { id: 'gb', labelAr: 'جيجابايت (GB)', labelEn: 'Gigabytes', ratio: 1000000 },
      { id: 'tb', labelAr: 'تيرابايت (TB)', labelEn: 'Terabytes', ratio: 1000000000 }
    ]
  }
];

export const UnitConverter: React.FC<UnitConverterProps> = ({ lang, onAddHistoryItem }) => {
  const isAr = lang === 'ar';
  
  // Converter States
  const [activeCatId, setActiveCatId] = useState<string>('length');
  const [pinnedCatIds, setPinnedCatIds] = useState<string[]>(['length', 'data']);
  const [inputValue, setInputValue] = useState<string>('1');
  const [outputValue, setOutputValue] = useState<string>('');
  
  const currentCategory = CATEGORIES.find(c => c.id === activeCatId) || CATEGORIES[0];
  const [fromUnitId, setFromUnitId] = useState<string>(currentCategory.units[2]?.id || currentCategory.units[0].id);
  const [toUnitId, setToUnitId] = useState<string>(currentCategory.units[3]?.id || currentCategory.units[1].id);
  const [copiedText, setCopiedText] = useState<string>('');

  const showLocalToast = (msg: string) => {
    setCopiedText(msg);
    setTimeout(() => setCopiedText(''), 3000);
  };

  // Whenever category shifts, reset defaults
  useEffect(() => {
    setFromUnitId(currentCategory.units[2]?.id || currentCategory.units[0].id);
    setToUnitId(currentCategory.units[3]?.id || currentCategory.units[1].id);
  }, [activeCatId]);

  // Mathematical logic conversions
  const runConversion = () => {
    const rawVal = parseFloat(inputValue);
    if (isNaN(rawVal)) return '';

    // Temperature requires custom formulas instead of multipliers
    if (activeCatId === 'temperature') {
      if (fromUnitId === toUnitId) return rawVal.toFixed(4);
      
      let tempInC = rawVal;
      if (fromUnitId === 'f') tempInC = (rawVal - 32) * 5 / 9;
      if (fromUnitId === 'k') tempInC = rawVal - 273.15;

      let finalTemp = tempInC;
      if (toUnitId === 'f') finalTemp = (tempInC * 9 / 5) + 32;
      if (toUnitId === 'k') finalTemp = tempInC + 273.15;

      return parseFloat(finalTemp.toFixed(5)).toString();
    }

    // Standard Multiplier logic
    const fromUnitObj = currentCategory.units.find(u => u.id === fromUnitId);
    const toUnitObj = currentCategory.units.find(u => u.id === toUnitId);

    if (!fromUnitObj || !toUnitObj) return '';

    const valInBase = rawVal * (fromUnitObj.ratio || 1);
    const valInTarget = valInBase / (toUnitObj.ratio || 1);

    return parseFloat(valInTarget.toFixed(7)).toString();
  };

  const calculatedResult = runConversion();

  // Star Pinning Toggle
  const togglePin = (catId: string) => {
    if (pinnedCatIds.includes(catId)) {
      setPinnedCatIds(pinnedCatIds.filter(id => id !== catId));
      showLocalToast(isAr ? 'تمت الإزالة من فئاتك المفضلة' : 'Removed from pinned converter category');
    } else {
      setPinnedCatIds([...pinnedCatIds, catId]);
      showLocalToast(isAr ? 'تم حفظ الفئة وتثبيتها بالأعلى' : 'Category pinned to top successfully!');
    }
  };

  // Swap Units
  const swapUnits = () => {
    const prevFrom = fromUnitId;
    setFromUnitId(toUnitId);
    setToUnitId(prevFrom);
    if (calculatedResult) {
      setInputValue(calculatedResult);
    }
  };

  const copyResult = () => {
    if (!calculatedResult) return;
    navigator.clipboard.writeText(calculatedResult);
    showLocalToast(isAr ? 'تم نسخ ناتج التحويل بنجاح!' : 'Result value copied!');
  };

  // Sort CATEGORIES so pinned ones come first, then others
  const sortedCategories = [...CATEGORIES].sort((a, b) => {
    const aPinned = pinnedCatIds.includes(a.id);
    const bPinned = pinnedCatIds.includes(b.id);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return a.id.localeCompare(b.id);
  });

  return (
    <div id="unit-converter-container" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-5 sm:p-6 shadow-sm space-y-6 text-slate-700 dark:text-slate-200">
      
      {/* Toast Alert popup */}
      {copiedText && (
        <div className="fixed bottom-6 right-6 bg-slate-900 dark:bg-slate-800 text-white py-2.5 px-5 rounded-2xl shadow-lg border border-slate-700 text-xs font-bold animate-slideUp z-50 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{copiedText}</span>
        </div>
      )}

      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-50 dark:border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500/10 p-3 rounded-2xl text-orange-500">
            <ArrowLeftRight className="w-6 h-6 rotate-90" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isAr ? 'محول الوحدات الرياضية والتحليلية' : 'Comprehensive Metric Converter'}
            </h2>
            <p className="text-xs text-slate-400">
              {isAr ? 'تثبيت الفئات المفضلة في الأعلى وتحويل فوري لجميع الأبعاد من درجات الحرارة والأطوال وسعات تخزين البيانات' : 'Pin your favorite gauges and instantly convert values between 9 physical & analytical scales'}
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Left Categorization list, Right input details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left list options (3 cols) */}
        <div className="lg:col-span-4 space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {sortedCategories.map((cat) => {
            const CatIcon = cat.icon;
            const isPinned = pinnedCatIds.includes(cat.id);
            const isActive = activeCatId === cat.id;

            return (
              <div 
                key={cat.id}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${isActive ? 'bg-orange-50/40 dark:bg-orange-950/10 border-orange-310 shadow-sm' : 'bg-slate-50/55 hover:bg-slate-100/50 border-slate-100/50 dark:bg-slate-800 dark:border-slate-800/70'}`}
                onClick={() => setActiveCatId(cat.id)}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl bg-white dark:bg-slate-900 ${isActive ? 'text-orange-500' : 'text-slate-400'}`}>
                    <CatIcon className="w-4 h-4" />
                  </div>
                  <span className={`text-xs font-bold ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-650 dark:text-slate-300'}`}>
                    {isAr ? cat.titleAr : cat.titleEn}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePin(cat.id);
                  }}
                  className={`p-1.5 rounded-lg border-0 cursor-pointer hover:bg-slate-205 text-slate-400 ${isPinned ? 'text-amber-500 hover:text-amber-600' : 'hover:text-slate-600'}`}
                  title={isAr ? 'تثبيت في الأعلى' : 'Pin to top'}
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Right Input calculation dashboard panel (8 cols) */}
        <div className="lg:col-span-8 bg-slate-50 dark:bg-slate-800/20 p-5 rounded-3xl border border-slate-100/50 dark:border-slate-800/50 flex flex-col justify-between">
          <div className="space-y-6">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <Zap className="w-4 h-4 text-orange-500 animate-pulse" />
              {isAr ? 'سياق التحويل الفوري المفتوح' : 'Active Conversion Context'}
            </span>

            {/* Input grid */}
            <div className="grid grid-cols-1 md:grid-cols-9 gap-4 items-center">
              
              {/* From value column */}
              <div className="md:col-span-4 space-y-2">
                <label className="text-[11px] font-bold text-slate-400 block">{isAr ? 'القيمة والمصدر' : 'Source dimension'}</label>
                <div className="space-y-1.5 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <input
                    type="number"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full bg-transparent font-mono font-bold text-slate-800 dark:text-white text-base focus:outline-none focus:ring-0 border-0"
                  />
                  <select
                    value={fromUnitId}
                    onChange={(e) => setFromUnitId(e.target.value)}
                    className="w-full bg-transparent border-0 focus:outline-none text-xs text-slate-500 font-bold font-sans cursor-pointer mt-1"
                  >
                    {currentCategory.units.map(unit => (
                      <option key={unit.id} value={unit.id}>{isAr ? unit.labelAr : unit.labelEn}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Central Swap Trigger direction */}
              <div className="md:col-span-1 flex justify-center">
                <button
                  onClick={swapUnits}
                  className="p-3 bg-white hover:bg-slate-100 text-orange-500 shadow hover:scale-105 border border-slate-100 dark:bg-slate-900 dark:border-slate-850 rounded-full cursor-pointer transition-transform"
                  title={isAr ? 'عكس اتجاه الوحدتين' : 'Swap target units'}
                >
                  <ArrowLeftRight className="w-4 h-4 hover:rotate-180 transition-transform duration-300" />
                </button>
              </div>

              {/* To value column */}
              <div className="md:col-span-4 space-y-2">
                <label className="text-[11px] font-bold text-slate-400 block">{isAr ? 'النتيجة والمستهدف' : 'Result vector'}</label>
                <div className="space-y-1.5 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative group">
                  <div className="w-full bg-transparent font-mono font-bold text-orange-600 dark:text-orange-400 text-base truncate select-all">
                    {calculatedResult || '0'}
                  </div>
                  <select
                    value={toUnitId}
                    onChange={(e) => setToUnitId(e.target.value)}
                    className="w-full bg-transparent border-0 focus:outline-none text-xs text-slate-500 font-bold font-sans cursor-pointer mt-1"
                  >
                    {currentCategory.units.map(unit => (
                      <option key={unit.id} value={unit.id}>{isAr ? unit.labelAr : unit.labelEn}</option>
                    ))}
                  </select>
                  
                  {/* Single cell copy result hover triggers */}
                  {calculatedResult && (
                    <button
                      onClick={copyResult}
                      className="absolute top-3.5 right-3 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-80s text-slate-400 hover:text-orange-500 rounded-lg cursor-pointer border-0"
                      title={isAr ? 'نسخ النتيجة' : 'Copy result'}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>

          <div className="border-t border-slate-200/40 dark:border-slate-700/50 pt-4 mt-6 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-orange-500" />
              {isAr 
                ? 'الحساب والمطابقة المباشرة تتم بالكامل في المتصفح محلياً دون إرسال بياناتك' 
                : '100% Client-side responsive calculation conforming to standard parameters'}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};

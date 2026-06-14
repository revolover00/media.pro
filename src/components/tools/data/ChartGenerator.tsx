'use client';

import React, { useState, useRef } from 'react';
import { 
  BarChart3, 
  Plus, 
  Trash2, 
  Download, 
  Sparkles, 
  RefreshCw, 
  Check, 
  Settings,
  Eye,
  FileImage
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title as ChartTitle,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut, PolarArea, Radar } from 'react-chartjs-2';

// Register core elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  ChartTitle,
  Tooltip,
  Legend
);

interface ChartItem {
  label: string;
  value: number;
}

interface ChartGeneratorProps {
  lang: 'ar' | 'en';
  onAddHistoryItem?: (item: any, blob?: Blob) => void;
}

const PRESET_THEMES = [
  { nameAr: 'طيف المرجان (Coral Glow)', nameEn: 'Coral Glow', colors: ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#6366f1', '#3b82f6', '#0ea5e9', '#14b8a6'] },
  { nameAr: 'الغابة والزمرد (Emerald Breeze)', nameEn: 'Emerald Breeze', colors: ['#10b981', '#059669', '#047857', '#065f46', '#0f766e', '#14b8a6', '#2dd4bf', '#a7f3d0'] },
  { nameAr: 'المحيط العميق (Deep ocean)', nameEn: 'Deep Ocean', colors: ['#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'] },
  { nameAr: 'الحمضيات الدافئة (Sunset Citrus)', nameEn: 'Sunset Citrus', colors: ['#f59e0b', '#d97706', '#b45309', '#f97316', '#ea580c', '#c2410c', '#e11d48', '#fca5a5'] },
  { nameAr: 'النيون البركاني (Retro Synth)', nameEn: 'Retro Synth', colors: ['#ff007f', '#7f00ff', '#00f0ff', '#ffaa00', '#00ff66', '#ec4899', '#8b5cf6', '#3b82f6'] }
];

export const ChartGenerator: React.FC<ChartGeneratorProps> = ({ lang, onAddHistoryItem }) => {
  const isAr = lang === 'ar';
  const chartRef = useRef<any>(null);

  // Chart data inputs
  const [title, setTitle] = useState<string>(isAr ? 'عائدات المبيعات السنوية' : 'Annual Sales Revenue');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'doughnut' | 'polarArea' | 'radar'>('bar');
  const [dataPoints, setDataPoints] = useState<ChartItem[]>([
    { label: isAr ? 'الربع الأول' : 'Q1', value: 120 },
    { label: isAr ? 'الربع الثاني' : 'Q2', value: 190 },
    { label: isAr ? 'الربع الثالث' : 'Q3', value: 320 },
    { label: isAr ? 'الربع الرابع' : 'Q4', value: 250 },
    { label: isAr ? 'مستهدف سنوي' : 'Target YoY', value: 180 }
  ]);
  
  // Customization
  const [themeIndex, setThemeIndex] = useState<number>(0);
  const [showLegend, setShowLegend] = useState<boolean>(true);
  const [fillArea, setFillArea] = useState<boolean>(true);
  const [isGridVisible, setIsGridVisible] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string>('');

  const showLocalToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleDataChange = (index: number, field: keyof ChartItem, val: string) => {
    const updated = [...dataPoints];
    if (field === 'value') {
      updated[index].value = parseFloat(val) || 0;
    } else {
      updated[index].label = val;
    }
    setDataPoints(updated);
  };

  const addPoint = () => {
    const label = isAr ? `مؤشر جديد ${dataPoints.length + 1}` : `Key ${dataPoints.length + 1}`;
    setDataPoints([...dataPoints, { label, value: 50 }]);
  };

  const removePoint = (idx: number) => {
    if (dataPoints.length <= 2) {
      showLocalToast(isAr ? 'يجب الإبقاء على نقطتين على الأقل!' : 'Must preserve at least 2 points!');
      return;
    }
    setDataPoints(dataPoints.filter((_, i) => i !== idx));
  };

  // Re-map colors based on labels
  const colors = PRESET_THEMES[themeIndex].colors;
  const backgroundColors = dataPoints.map((_, i) => colors[i % colors.length] + 'dd');
  const borderColors = dataPoints.map((_, i) => colors[i % colors.length]);

  const chartData = {
    labels: dataPoints.map(p => p.label),
    datasets: [
      {
        label: title || (isAr ? 'القيم الإحصائية' : 'Value'),
        data: dataPoints.map(p => p.value),
        backgroundColor: chartType === 'line' || chartType === 'radar' 
          ? (fillArea ? colors[0] + '33' : 'transparent') 
          : backgroundColors,
        borderColor: chartType === 'line' || chartType === 'radar' ? colors[0] : borderColors,
        borderWidth: chartType === 'line' || chartType === 'radar' ? 3 : 1.5,
        fill: fillArea,
        tension: 0.35,
        pointBackgroundColor: colors[0],
        pointBorderColor: '#fff',
        pointHoverRadius: 7,
      }
    ]
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'top',
        labels: {
          font: { family: 'Cairo, Inter, system-ui', size: 11 },
          color: '#64748b'
        }
      },
      title: {
        display: false,
      }
    },
    scales: (chartType === 'pie' || chartType === 'doughnut' || chartType === 'polarArea') ? {} : {
      x: {
        grid: { display: isGridVisible, color: 'rgba(100,116,139,0.08)' },
        ticks: { font: { family: 'Cairo, Inter', size: 10 }, color: '#64748b' }
      },
      y: {
        grid: { display: isGridVisible, color: 'rgba(100,116,139,0.08)' },
        ticks: { font: { family: 'Cairo, Inter', size: 10 }, color: '#64748b' }
      }
    }
  };

  // Download Chart Ref PNG / SVG
  const downloadChart = (format: 'png' | 'svg') => {
    if (!chartRef.current) return;
    const canvas = chartRef.current.canvas;
    if (!canvas) return;

    if (format === 'png') {
      const url = canvas.toDataURL('image/png', 1.0);
      const blob = dataURLtoBlob(url);
      const filename = `chart_${Date.now()}.png`;

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      showLocalToast(isAr ? 'تم تصدير وحفظ الرسم البياني بنجاح!' : 'Chart exported successfully!');

      if (onAddHistoryItem) {
        onAddHistoryItem({
          action: isAr ? 'إنشاء وتصدير رسم بياني إحصائي' : 'Visual Chart Synthesis',
          fileName: filename,
          originalSize: dataPoints.length * 15,
          processedSize: blob.size,
          type: 'image'
        }, blob);
      }
    } else {
      // SVG download fallback - convert simple grid representation
      const svgNS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('width', '600');
      svg.setAttribute('height', '400');
      svg.setAttribute('viewBox', '0 0 600 400');
      svg.style.backgroundColor = '#ffffff';

      // Title
      const text = document.createElementNS(svgNS, 'text');
      text.setAttribute('x', '300');
      text.setAttribute('y', '35');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-family', 'sans-serif');
      text.setAttribute('font-size', '18');
      text.setAttribute('fill', '#000000');
      text.textContent = title;
      svg.appendChild(text);

      // Render simplified bars inside SVG for absolute fidelity
      const maxVal = Math.max(...dataPoints.map(p => p.value), 1);
      const barWidth = 400 / dataPoints.length;
      dataPoints.forEach((p, idx) => {
        const barHeight = (p.value / maxVal) * 220;
        const x = 100 + idx * barWidth + (barWidth - 30) / 2;
        const y = 300 - barHeight;

        const rect = document.createElementNS(svgNS, 'rect');
        rect.setAttribute('x', String(x));
        rect.setAttribute('y', String(y));
        rect.setAttribute('width', '30');
        rect.setAttribute('height', String(Math.max(barHeight, 2)));
        rect.setAttribute('fill', colors[idx % colors.length]);
        svg.appendChild(rect);

        // Label
        const labelText = document.createElementNS(svgNS, 'text');
        labelText.setAttribute('x', String(x + 15));
        labelText.setAttribute('y', '320');
        labelText.setAttribute('text-anchor', 'middle');
        labelText.setAttribute('font-family', 'sans-serif');
        labelText.setAttribute('font-size', '11');
        labelText.setAttribute('fill', '#64748b');
        labelText.textContent = p.label;
        svg.appendChild(labelText);

        // Value text
        const valueText = document.createElementNS(svgNS, 'text');
        valueText.setAttribute('x', String(x + 15));
        valueText.setAttribute('y', String(y - 8));
        valueText.setAttribute('text-anchor', 'middle');
        valueText.setAttribute('font-family', 'monospace');
        valueText.setAttribute('font-size', '11');
        valueText.setAttribute('fill', '#111827');
        valueText.textContent = String(p.value);
        svg.appendChild(valueText);
      });

      const serializer = new XMLSerializer();
      const svgStr = serializer.serializeToString(svg);
      const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const filename = `chart_${Date.now()}.svg`;
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      if (onAddHistoryItem) {
        onAddHistoryItem({
          action: isAr ? 'إنشاء رسم بياني مجسم SVG' : 'Vector Diagram Generation',
          fileName: filename,
          originalSize: dataPoints.length * 15,
          processedSize: blob.size,
          type: 'image'
        }, blob);
      }
    }
  };

  const dataURLtoBlob = (dataurl: string) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  return (
    <div id="chart-generator-container" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-5 sm:p-6 shadow-sm space-y-6 text-slate-700 dark:text-slate-200">
      
      {/* Local floating alerts */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 dark:bg-slate-800 text-white py-2.5 px-5 rounded-2xl shadow-lg border border-slate-700 text-xs font-bold animate-slideUp z-50 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-50 dark:border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-sky-500/10 p-3 rounded-2xl text-sky-500">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isAr ? 'منشئ المخططات والرسوم البيانية' : 'Interactive Graphic Chart Builder'}
            </h2>
            <p className="text-xs text-slate-400">
              {isAr ? 'حوّل قوائم الأرقام الصامتة إلى رسوم بيانية ومجسمات مذهلة وتنزيلها كملفات عالية الدقة' : 'Transform raw arrays of metrics into elegant, publication-ready vector or bitmap charts'}
            </p>
          </div>
        </div>
      </div>

      {/* Main dashboard grid panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Parameters Form / Inputs */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100/60 dark:border-slate-800/60 space-y-3.5">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 border-b border-slate-200/50 pb-2">
              <Settings className="w-4 h-4 text-sky-500" />
              {isAr ? 'إعدادات وخصائص المخطط' : 'Graphic Properties'}
            </span>

            {/* Title field */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500">{isAr ? 'عنوان المخطط العام' : 'Global Chart Title'}</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 cursor-text rounded-xl py-2 px-3 text-xs focus:ring-1 focus:ring-sky-500 border border-slate-200 dark:border-slate-700/80 text-slate-805"
              />
            </div>

            {/* Select Types of Charts */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500">{isAr ? 'نوع المخطط البياني' : 'Chart Type'}</label>
                <select
                  value={chartType}
                  onChange={(e: any) => setChartType(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 rounded-xl py-2 px-2.5 text-xs focus:ring-1 focus:ring-sky-500 border border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-white cursor-pointer"
                >
                  <option value="bar">{isAr ? 'مخطط الأعمدة (Bar)' : 'Bar Chart'}</option>
                  <option value="line">{isAr ? 'مخطط الخطي (Line)' : 'Line Graph'}</option>
                  <option value="pie">{isAr ? 'الدائري الجزئي (Pie)' : 'Pie Chart'}</option>
                  <option value="doughnut">{isAr ? 'دونات مجوف (Doughnut)' : 'Doughnut'}</option>
                  <option value="polarArea">{isAr ? 'جغرافي شبكي (Polar Area)' : 'Polar Area'}</option>
                  <option value="radar">{isAr ? 'رادار شبكة العنكبوت' : 'Radar Mesh'}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500">{isAr ? 'طيف لوحة الألوان' : 'Color Palette Theme'}</label>
                <select
                  value={themeIndex}
                  onChange={(e) => setThemeIndex(parseInt(e.target.value))}
                  className="w-full bg-white dark:bg-slate-900 rounded-xl py-2 px-2.5 text-xs focus:ring-1 focus:ring-sky-500 border border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-white cursor-pointer"
                >
                  {PRESET_THEMES.map((theme, idx) => (
                    <option key={idx} value={idx}>
                      {isAr ? theme.nameAr : theme.nameEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Checkboxes settings */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <label className="flex items-center gap-1.5 text-[10px] text-slate-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLegend}
                  onChange={(e) => setShowLegend(e.target.checked)}
                  className="accent-sky-500 rounded"
                />
                <span>{isAr ? 'دليل الألوان' : 'Legend'}</span>
              </label>

              {(chartType === 'line' || chartType === 'radar') && (
                <label className="flex items-center gap-1.5 text-[10px] text-slate-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fillArea}
                    onChange={(e) => setFillArea(e.target.checked)}
                    className="accent-sky-500 rounded"
                  />
                  <span>{isAr ? 'ملء المساحة' : 'Fill Mesh'}</span>
                </label>
              )}

              {(chartType !== 'pie' && chartType !== 'doughnut' && chartType !== 'polarArea') && (
                <label className="flex items-center gap-1.5 text-[10px] text-slate-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isGridVisible}
                    onChange={(e) => setIsGridVisible(e.target.checked)}
                    className="accent-sky-500 rounded"
                  />
                  <span>{isAr ? 'شبكة المحاور' : 'Axis Grids'}</span>
                </label>
              )}
            </div>
          </div>

          {/* Grid fields for items entry */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
              <span className="text-xs font-bold text-slate-500">{isAr ? 'بيانات الجدول الحالية' : 'Tabular Entry Metrics'}</span>
              <button
                onClick={addPoint}
                className="bg-sky-500 hover:bg-sky-600 text-white font-bold text-[10px] py-1 px-2.5 rounded-lg cursor-pointer flex items-center gap-0.5 border-0"
              >
                <Plus className="w-3 h-3" />
                <span>{isAr ? 'إضافة خانة' : 'Add metric'}</span>
              </button>
            </div>

            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {dataPoints.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/25 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800/40">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder={isAr ? 'العلامة / المسمى' : 'Label'}
                      value={item.label}
                      onChange={(e) => handleDataChange(idx, 'label', e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 rounded-lg py-1 px-2.5 text-[11px] focus:ring-1 focus:ring-sky-400 border border-slate-200 dark:border-slate-800 text-slate-880 text-center"
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      placeholder={isAr ? 'القيمة' : 'Value'}
                      value={item.value}
                      onChange={(e) => handleDataChange(idx, 'value', e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 rounded-lg py-1 px-2 text-[11px] font-mono focus:ring-1 focus:ring-sky-400 border border-slate-200 dark:border-slate-800 text-center"
                    />
                  </div>
                  <div>
                    <button
                      onClick={() => removePoint(idx)}
                      className="p-1 hover:bg-red-50 dark:hover:bg-red-950/45 rounded text-red-400 hover:text-red-600 cursor-pointer border-0"
                      title={isAr ? 'حذف هذه الخانة' : 'Remove entry'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Graphic Canvas Live rendering */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-emerald-500" />
              {isAr ? 'معاينة حية وتفاعلية للمخطط' : 'Interactive Chart Canvas Live'}
            </span>
          </div>

          <div className="border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 flex items-center justify-center min-h-[340px] h-[340px] relative">
            <div className="w-full h-full relative">
              {/* Conditional renderings by chart type */}
              {chartType === 'bar' && <Bar ref={chartRef} data={chartData} options={options} />}
              {chartType === 'line' && <Line ref={chartRef} data={chartData} options={options} />}
              {chartType === 'pie' && <Pie ref={chartRef} data={chartData} options={options} />}
              {chartType === 'doughnut' && <Doughnut ref={chartRef} data={chartData} options={options} />}
              {chartType === 'polarArea' && <PolarArea ref={chartRef} data={chartData} options={options} />}
              {chartType === 'radar' && <Radar ref={chartRef} data={chartData} options={options} />}
            </div>
          </div>

          {/* Download buttons row */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-400">
              {isAr ? 'يتم التحديث المباشر أثناء كتابة أو تغيير أي قيم' : 'Synthesized dynamically from values above'}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadChart('svg')}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-white cursor-pointer font-bold text-xs flex items-center gap-1 border-0"
              >
                <FileImage className="w-4 h-4 text-sky-500" />
                <span>SVG (Vector)</span>
              </button>
              <button
                onClick={() => downloadChart('png')}
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white cursor-pointer font-bold text-xs flex items-center gap-1.5 border-0"
              >
                <Download className="w-4 h-4" />
                <span>{isAr ? 'تنزيل كصورة عالية الدقة' : 'Download PNG'}</span>
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

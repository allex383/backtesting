import React, { useState, useMemo } from 'react';
import { EquityPoint } from '../utils/analytics';
import { TrendingUp, Activity } from 'lucide-react';

interface EquityChartProps {
  data: EquityPoint[];
}

export const EquityChart: React.FC<EquityChartProps> = ({ data }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const { points, minVal, maxVal, width, height, padding, highWaterMark, maxDd } = useMemo(() => {
    const w = 800;
    const h = 260;
    const p = { top: 20, right: 30, bottom: 30, left: 50 };

    if (data.length <= 1) {
      return {
        points: [],
        minVal: -2,
        maxVal: 5,
        width: w,
        height: h,
        padding: p,
        highWaterMark: 0,
        maxDd: 0,
      };
    }

    const values = data.map(d => d.cumulativeR);
    let min = Math.min(0, ...values);
    let max = Math.max(1, ...values);
    
    // Add margin
    const range = max - min;
    min -= range * 0.1;
    max += range * 0.1;

    let peak = 0;
    let dd = 0;
    data.forEach(d => {
      if (d.cumulativeR > peak) peak = d.cumulativeR;
      const curDd = peak - d.cumulativeR;
      if (curDd > dd) dd = curDd;
    });

    const plotW = w - p.left - p.right;
    const plotH = h - p.top - p.bottom;

    const coords = data.map((d, i) => {
      const x = p.left + (i / (data.length - 1)) * plotW;
      const y = p.top + plotH - ((d.cumulativeR - min) / (max - min)) * plotH;
      return { ...d, x, y };
    });

    return {
      points: coords,
      minVal: min,
      maxVal: max,
      width: w,
      height: h,
      padding: p,
      highWaterMark: peak,
      maxDd: dd,
    };
  }, [data]);

  if (data.length <= 1) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
        <Activity className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <h4 className="text-sm font-semibold text-slate-300">Кривая доходности в R</h4>
        <p className="text-xs text-slate-500 mt-1">Добавьте хотя бы 2 сделки для отображения динамики эквити.</p>
      </div>
    );
  }

  // Generate SVG path for equity line
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Zero-line Y
  const plotH = height - padding.top - padding.bottom;
  const zeroY = padding.top + plotH - ((0 - minVal) / (maxVal - minVal)) * plotH;

  // Area under curve down to zeroY
  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  const areaPath = `${linePath} L ${lastPoint.x} ${zeroY} L ${firstPoint.x} ${zeroY} Z`;

  const hoveredPoint = hoveredIndex !== null ? points[hoveredIndex] : null;
  const lastR = data[data.length - 1]?.cumulativeR ?? 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs">
      {/* Header with quick stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">Кривая доходности (R-Multiple Equity)</h4>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Кумулятивный прирост в единицах риска (без влияния размера депозита)
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-500 block text-[10px]">Текущий итог:</span>
            <span className={`text-base font-bold tabular-nums ${lastR >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {lastR >= 0 ? `+${lastR.toFixed(1)} R` : `${lastR.toFixed(1)} R`}
            </span>
          </div>
          <div className="border-l border-slate-800 pl-3">
            <span className="text-slate-500 block text-[10px]">Пик эквити:</span>
            <span className="text-sm font-semibold text-slate-200 tabular-nums">
              +{highWaterMark.toFixed(1)} R
            </span>
          </div>
          <div className="border-l border-slate-800 pl-3">
            <span className="text-slate-500 block text-[10px]">Макс. просадка:</span>
            <span className="text-sm font-semibold text-rose-400 tabular-nums">
              -{maxDd.toFixed(1)} R
            </span>
          </div>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={padding.left}
            y1={zeroY}
            x2={width - padding.right}
            y2={zeroY}
            stroke="#334155"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          <text
            x={padding.left - 8}
            y={zeroY + 3}
            textAnchor="end"
            className="text-[10px] fill-slate-500 font-mono"
          >
            0 R
          </text>

          {/* Top axis label */}
          <text
            x={padding.left - 8}
            y={padding.top + 5}
            textAnchor="end"
            className="text-[10px] fill-slate-500 font-mono"
          >
            +{maxVal.toFixed(1)}R
          </text>

          {/* Bottom axis label */}
          <text
            x={padding.left - 8}
            y={height - padding.bottom}
            textAnchor="end"
            className="text-[10px] fill-slate-500 font-mono"
          >
            {minVal.toFixed(1)}R
          </text>

          {/* Filled Area */}
          <path d={areaPath} fill="url(#equityGrad)" />

          {/* Equity Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points & Hover detectors */}
          {points.map((p, idx) => (
            <g key={idx}>
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIndex === idx ? 5 : 2.5}
                className={`transition-all duration-100 ${
                  hoveredIndex === idx
                    ? 'fill-emerald-300 stroke-slate-900 stroke-2'
                    : 'fill-emerald-500'
                }`}
              />
              {/* Invisible wider hit area */}
              <circle
                cx={p.x}
                cy={p.y}
                r={12}
                fill="transparent"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              />
            </g>
          ))}

          {/* Hover Crosshair and Tooltip */}
          {hoveredPoint && (
            <g>
              <line
                x1={hoveredPoint.x}
                y1={padding.top}
                x2={hoveredPoint.x}
                y2={height - padding.bottom}
                stroke="#64748b"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
            </g>
          )}
        </svg>

        {/* Floating tooltip html overlay */}
        {hoveredPoint && (
          <div
            className="absolute pointer-events-none bg-slate-950/95 border border-slate-700 rounded-lg p-2.5 text-xs font-mono shadow-xl z-20"
            style={{
              left: `${Math.min(75, Math.max(10, (hoveredPoint.x / width) * 100))}%`,
              top: '15px',
              transform: 'translateX(-50%)',
            }}
          >
            <div className="text-slate-400 text-[10px]">{hoveredPoint.date} · Сделка #{hoveredPoint.index}</div>
            <div className="flex items-center gap-3 mt-1">
              <div>
                <span className="text-[10px] text-slate-500 block">Результат:</span>
                <span className={`font-bold ${hoveredPoint.changeR > 0 ? 'text-emerald-400' : hoveredPoint.changeR < 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                  {hoveredPoint.changeR > 0 ? `+${hoveredPoint.changeR} R` : `${hoveredPoint.changeR} R`}
                </span>
              </div>
              <div className="border-l border-slate-800 pl-3">
                <span className="text-[10px] text-slate-500 block">Баланс R:</span>
                <span className="font-bold text-white">
                  {hoveredPoint.cumulativeR > 0 ? `+${hoveredPoint.cumulativeR} R` : `${hoveredPoint.cumulativeR} R`}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

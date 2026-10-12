import React from 'react';
import { AuroraForecastResult } from '../simulator/auroraEngine';

interface SecondaryWidgetFaceProps {
  data: AuroraForecastResult | null;
  locationDisplayText: string;
  onOpenApp: () => void;
  scale?: number;
}

export const SecondaryWidgetFace: React.FC<SecondaryWidgetFaceProps> = ({
  data,
  locationDisplayText,
  onOpenApp,
  scale = 1.0,
}) => {
  const chance = data?.chancePercent ?? 85;
  const clouds = data?.clouds ?? 12;
  const kp = data?.kp ?? 5.2;

  let chanceColor = '#10b981';
  let statusText = 'VERY HIGH VISIBILITY';

  if (clouds > 80 && chance > 20) {
    chanceColor = '#ef4444';
    statusText = 'OVERCAST · BLOCKED';
  } else if (chance >= 70) {
    chanceColor = '#10b981';
    statusText = 'VERY HIGH VISIBILITY';
  } else if (chance >= 45) {
    chanceColor = '#06b6d4';
    statusText = 'MODERATE VISIBILITY';
  } else if (chance >= 20) {
    chanceColor = '#f59e0b';
    statusText = 'POSSIBLE AT HORIZON';
  } else {
    chanceColor = '#ef4444';
    statusText = 'LOW PROBABILITY';
  }

  // Arc calculation (270 degrees sweep from 135 to 405)
  const radius = 185;
  const circumference = 2 * Math.PI * radius;
  const sweepPercent = Math.min(100, Math.max(0, chance)) / 100;
  const arcLength = circumference * (270 / 360);
  const strokeDashoffset = arcLength * (1 - sweepPercent);

  return (
    <div
      style={{
        width: 466 * scale,
        height: 466 * scale,
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top left',
      }}
      onClick={onOpenApp}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpenApp()}
      className="relative rounded-full bg-black border-[7px] border-slate-900 shadow-2xl overflow-hidden select-none font-sans flex flex-col items-center justify-center p-6 text-white cursor-pointer group"
    >
      {/* Background and Active Arcs */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 466 466"
      >
        <circle
          cx="233"
          cy="233"
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference}`}
          transform="rotate(135 233 233)"
        />
        <circle
          cx="233"
          cy="233"
          r={radius}
          fill="none"
          stroke={chanceColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(135 233 233)"
          className="transition-all duration-700 ease-out"
        />
      </svg>

      {/* Screen Title */}
      <div className="absolute top-12 flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
        <span>SECONDARY WIDGET</span>
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center text-center z-10 space-y-1">
        <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
          {locationDisplayText}
        </span>
        <span
          className="text-7xl font-black tracking-tight"
          style={{ color: chanceColor }}
        >
          {chance}%
        </span>
        <span className="text-sm font-bold text-slate-100 tracking-wider uppercase">
          {statusText}
        </span>
        <span className="text-sm font-semibold text-sky-400">
          Kp {kp} · Clouds {clouds}%
        </span>
      </div>

      {/* Bottom Hint */}
      <div className="absolute bottom-12 flex flex-col items-center gap-1 text-[11px] text-slate-400 group-hover:text-emerald-400 transition-colors">
        <span>Tap to open full Aurora Tracker</span>
      </div>
    </div>
  );
};

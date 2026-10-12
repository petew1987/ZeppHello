import React from 'react';
import { AuroraForecastResult } from '../simulator/auroraEngine';

interface ShortcutCardProps {
  data: AuroraForecastResult | null;
  locationDisplayText: string;
  onOpenApp: () => void;
  scale?: number;
}

export const ShortcutCard: React.FC<ShortcutCardProps> = ({
  data,
  locationDisplayText,
  onOpenApp,
  scale = 1.0,
}) => {
  const chance = data?.chancePercent ?? 85;
  const clouds = data?.clouds ?? 12;
  const kp = data?.kp ?? 5.2;

  let chanceColor = '#10b981'; // Emerald
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

  const hourly = data?.hourlyForecast?.slice(0, 4) || [
    { hour: '+1h', chance: 85, clouds: 12 },
    { hour: '+2h', chance: 90, clouds: 10 },
    { hour: '+3h', chance: 80, clouds: 18 },
    { hour: '+4h', chance: 65, clouds: 25 },
  ];

  return (
    <div
      style={{
        width: 466 * scale,
        height: 466 * scale,
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top left',
      }}
      className="relative rounded-full bg-black border-[7px] border-slate-900 shadow-2xl overflow-hidden select-none font-sans flex flex-col items-center justify-center p-6 text-white"
    >
      {/* Shortcut Screen Header Indicator */}
      <div className="absolute top-8 flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
        <span>SHORTCUT CARDS</span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      </div>

      {/* Zepp OS AppWidget Container */}
      <div
        onClick={onOpenApp}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onOpenApp()}
        className="w-[390px] h-[190px] bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 rounded-3xl p-5 shadow-2xl cursor-pointer transition-all duration-150 active:scale-98 flex flex-col justify-between group"
      >
        {/* Card Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shadow-sm"
              style={{ backgroundColor: chanceColor }}
            />
            <span className="text-[12px] font-bold tracking-wider text-emerald-400">
              AURORA FORECAST
            </span>
          </div>
          <span className="text-[12px] font-semibold text-slate-400 truncate max-w-[150px]">
            {locationDisplayText}
          </span>
        </div>

        {/* Hero Value Row */}
        <div className="flex items-baseline gap-4 my-1">
          <span
            className="text-5xl font-black tracking-tight"
            style={{ color: chanceColor }}
          >
            {chance}%
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-100 tracking-wide uppercase">
              {statusText}
            </span>
            <span className="text-xs font-semibold text-sky-400 mt-0.5">
              Kp {kp} · Clouds {clouds}%
            </span>
          </div>
        </div>

        {/* 4-Hour Mini Trend Bars */}
        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
          {hourly.map((item, idx) => {
            const barChance = item.chance ?? 0;
            const barHeightPercent = Math.max(15, Math.min(100, barChance));
            let barColor = '#10b981';
            if (item.clouds > 80 && barChance > 10) barColor = '#ef4444';
            else if (barChance >= 60) barColor = '#10b981';
            else if (barChance >= 30) barColor = '#06b6d4';
            else if (barChance >= 10) barColor = '#f59e0b';
            else barColor = '#ef4444';

            return (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className="w-full h-4 bg-slate-800/80 rounded flex items-end overflow-hidden p-0.5">
                  <div
                    className="w-full rounded-sm transition-all"
                    style={{
                      height: `${barHeightPercent}%`,
                      backgroundColor: barColor,
                    }}
                  />
                </div>
                <div className="text-[9px] font-bold text-slate-400 flex items-center justify-between w-full px-0.5">
                  <span>{item.hour.split(':')[0]}</span>
                  <span className="text-slate-300">{barChance}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Card tap hint */}
      <div className="absolute bottom-10 flex items-center gap-1.5 text-xs text-slate-500 font-medium animate-bounce">
        <span>Tap card to open full app</span>
        <span>→</span>
      </div>
    </div>
  );
};

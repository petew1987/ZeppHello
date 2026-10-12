import React from 'react';
import { AuroraForecastResult } from '../simulator/auroraEngine';

interface WatchFaceProps {
  data: AuroraForecastResult | null;
  isLoading: boolean;
  isBleConnected: boolean;
  locationDisplayText: string;
  onCycleLocation: () => void;
  onRefresh: () => void;
  scale?: number;
}

/**
 * High-fidelity virtual preview of the Amazfit Active 3 (466x466 AMOLED)
 *
 * Implements the Zepp OS layout:
 * - Vertically centered display on round 466x466 AMOLED screen.
 * - Arc gauge sweep reflecting probability.
 * - Big probability counter, geomagnetic Kp, and cloud cover.
 * - 10-hour forecast chart bars.
 * - REFRESH button with Location switch line directly underneath.
 */
export const WatchFace: React.FC<WatchFaceProps> = ({
  data,
  isLoading,
  isBleConnected,
  locationDisplayText,
  onCycleLocation,
  onRefresh,
  scale = 1.0,
}) => {
  const chance = data?.chancePercent ?? 0;
  const clouds = data?.clouds ?? 0;

  // Determine dynamic accent color according to state
  let arcColor = '#10b981'; // Emerald 500
  if (clouds > 80 && chance > 10) {
    arcColor = '#ef4444'; // Red 500
  } else if (chance >= 60) {
    arcColor = '#10b981'; // Emerald
  } else if (chance >= 30) {
    arcColor = '#06b6d4'; // Cyan 500
  } else if (chance >= 10) {
    arcColor = '#f59e0b'; // Amber 500
  } else {
    arcColor = '#ef4444'; // Red
  }

  // Circular Arc SVG dimensions
  const radius = 197;
  const cx = 233;
  const cy = 233;
  const totalSweepDegrees = 270;
  const startAngleDegrees = 135;

  const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x: number, y: number, r: number, startAngle: number, sweepAngle: number) => {
    const start = polarToCartesian(x, y, r, startAngle);
    const end = polarToCartesian(x, y, r, startAngle + sweepAngle);
    const largeArcFlag = sweepAngle <= 180 ? '0' : '1';
    return ['M', start.x, start.y, 'A', r, r, 0, largeArcFlag, 1, end.x, end.y].join(' ');
  };

  const bgArcPath = describeArc(cx, cy, radius, startAngleDegrees, totalSweepDegrees);
  const currentSweep = Math.max(2, Math.round((chance / 100) * totalSweepDegrees));
  const activeArcPath = describeArc(cx, cy, radius, startAngleDegrees, currentSweep);

  const statusText = React.useMemo(() => {
    if (!isBleConnected) return 'BLUETOOTH OFFLINE';
    if (isLoading) return 'SCANNING SKIES';
    if (clouds > 80 && chance > 20) return 'OVERCAST · BLOCKED';
    if (chance >= 70) return 'VERY HIGH VISIBILITY';
    if (chance >= 45) return 'MODERATE VISIBILITY';
    if (chance >= 20) return 'POSSIBLE AT HORIZON';
    return 'LOW PROBABILITY';
  }, [isBleConnected, isLoading, clouds, chance]);

  const hourly = data?.hourlyForecast || [];

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
      }}
    >
      {/* Outer Watch Bezel (Amazfit Active 3 Style - 466x466 AMOLED) */}
      <div className="relative w-[466px] h-[466px] rounded-full bg-black p-2.5 shadow-2xl border-[10px] border-slate-900 ring-4 ring-slate-800/80">
        
        {/* Subtle Ambient Bezel Gradient */}
        <div className="absolute inset-0 rounded-full border border-slate-700/40 pointer-events-none" />

        {/* Outer Background Arc Ring */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 466 466">
          <path
            d={bgArcPath}
            fill="none"
            stroke="#1e293b"
            strokeWidth="10"
            strokeLinecap="round"
          />
          {chance > 0 && !isLoading && isBleConnected && (
            <path
              d={activeArcPath}
              fill="none"
              stroke={arcColor}
              strokeWidth="10"
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
              style={{
                filter: chance >= 30 ? `drop-shadow(0 0 5px ${arcColor}88)` : 'none',
              }}
            />
          )}
        </svg>

        {/* Watch Canvas: Vertically Centered Round Layout */}
        <div className="relative w-full h-full flex flex-col items-center justify-center text-center text-white font-sans overflow-hidden py-3">
          
          {/* Probability Counter (y: 60, h: 58) */}
          <div
            className="text-[54px] leading-none font-black tracking-tight transition-colors duration-500 h-[58px] flex items-center justify-center mt-2"
            style={{
              color: arcColor,
              textShadow: chance >= 40 ? `0 0 20px ${arcColor}55` : 'none',
            }}
          >
            {isLoading ? (
              <span className="animate-pulse">--%</span>
            ) : !isBleConnected ? (
              <span className="text-red-400 text-[36px]">OFFLINE</span>
            ) : (
              `${chance}%`
            )}
          </div>

          {/* Probability Status Label (y: 118, h: 20) */}
          <div className="text-[13px] font-semibold tracking-wider uppercase text-slate-200 h-[20px] flex items-center justify-center mt-0.5">
            {statusText}
          </div>

          {/* Metric Displays (y: 144, h: 38) */}
          <div className="flex items-center gap-8 mt-1.5 w-[300px] justify-center">
            {/* Left: Geomagnetic */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] tracking-wider text-slate-400 font-medium">GEOMAGNETIC</span>
              <span className="text-[17px] font-bold text-white leading-tight">
                {isLoading ? 'Kp --' : `Kp ${data?.kp?.toFixed(1) ?? '--'}`}
              </span>
            </div>

            {/* Subtle divider */}
            <div className="h-6 w-px bg-slate-800" />

            {/* Right: Cloud Cover */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] tracking-wider text-slate-400 font-medium">CLOUD COVER</span>
              <span className="text-[17px] font-bold text-sky-400 leading-tight">
                {isLoading ? '--%' : `${clouds}%`}
              </span>
            </div>
          </div>

          {/* 10-HOUR FORECAST MINI-CHART (y: 190 to 282) */}
          <div className="w-[280px] mt-2 pt-2 border-t border-slate-800/80 flex flex-col items-center">
            <div className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase mb-1.5">
              10-Hour Forecast
            </div>

            {/* 10 Vertical Bars */}
            <div className="flex items-end justify-between w-full h-[34px] px-1 bg-slate-950/60 rounded border border-slate-900 py-0.5">
              {(hourly.length > 0 ? hourly : Array.from({ length: 10 }).map((_, i) => ({
                hour: `+${i + 1}h`,
                chance: Math.max(10, Math.round(chance * (0.8 + (i % 3) * 0.15))),
                clouds: 20,
                kp: 3.0,
                offsetHours: i + 1
              }))).slice(0, 10).map((item, idx) => {
                const barH = Math.max(3, Math.min(30, Math.round((item.chance / 100) * 30)));
                let barColor = '#10b981';
                if (item.clouds > 80 && item.chance > 10) barColor = '#ef4444';
                else if (item.chance >= 60) barColor = '#10b981';
                else if (item.chance >= 30) barColor = '#06b6d4';
                else if (item.chance >= 10) barColor = '#f59e0b';
                else barColor = '#ef4444';

                return (
                  <div
                    key={idx}
                    className="flex flex-col items-center w-[18px] group relative cursor-pointer"
                    title={`${item.hour}: ${item.chance}% viewing chance (Kp ${item.kp}, ${item.clouds}% clouds)`}
                  >
                    {/* Background slot */}
                    <div className="w-[14px] h-[30px] bg-slate-800/60 rounded-xs flex items-end justify-center overflow-hidden">
                      <div
                        className="w-full rounded-xs transition-all duration-500"
                        style={{
                          height: `${barH}px`,
                          backgroundColor: barColor,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Time axis labels */}
            <div className="flex justify-between w-full px-1 text-[9px] text-slate-500 font-mono mt-0.5">
              <span>{hourly[0]?.hour || '+1h'}</span>
              <span className="text-[8px] text-slate-600">HOURLY CHANCE</span>
              <span>{hourly[9]?.hour || '+10h'}</span>
            </div>
          </div>

          {/* Astronomical & Meteorological Guidance (y: 302, h: 36) */}
          <div className="text-[12px] leading-snug text-slate-400 max-w-[340px] h-[34px] flex items-center justify-center mt-1 px-3">
            {!isBleConnected
              ? 'Check phone Bluetooth and open Zepp app.'
              : isLoading
              ? 'Contacting NOAA SWPC & Open-Meteo...'
              : data?.textGuidance || 'Tap Refresh to scan the northern skies.'}
          </div>

          {/* ACTION SECTION: Refresh Button + Location Line Directly Underneath */}
          <div className="mt-2 flex flex-col items-center z-10 w-full px-6">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className={`
                w-[160px] h-[40px] rounded-xl font-bold tracking-wider text-[14px] uppercase
                transition-all duration-200 active:scale-95 shadow-md flex items-center justify-center
                ${
                  isLoading
                    ? 'bg-teal-950 text-teal-400 border border-teal-800 cursor-wait'
                    : 'bg-teal-700 hover:bg-teal-600 active:bg-teal-800 text-white border border-teal-500/30 cursor-pointer'
                }
              `}
            >
              {isLoading ? (
                <span className="flex items-center gap-1.5">
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  UPDATING
                </span>
              ) : (
                'REFRESH'
              )}
            </button>

            {/* Location Display Line Directly Underneath Refresh Button */}
            <button
              onClick={onCycleLocation}
              disabled={isLoading}
              title="Tap to switch between Live GPS and Saved Locations"
              className="mt-1 h-[26px] max-w-[320px] px-2 flex items-center justify-center hover:opacity-80 active:opacity-60 transition-opacity cursor-pointer group"
            >
              <span className="text-[13px] font-medium text-sky-400 truncate max-w-[300px]">
                {!isBleConnected
                  ? 'Offline · Check Phone'
                  : isLoading
                  ? 'Resolving Location...'
                  : `${locationDisplayText} · Switch`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Amazfit Hardware Right Crown Button Simulation */}
      <div
        onClick={onRefresh}
        title="Physical Crown: Tap to Refresh"
        className="absolute -right-2.5 top-[218px] w-3 h-8 bg-gradient-to-r from-slate-600 to-slate-400 rounded-r-md cursor-pointer hover:brightness-125 active:scale-95 transition-all shadow-md z-30"
      />
    </div>
  );
};
export default WatchFace;

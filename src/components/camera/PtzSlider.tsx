import React, { useRef, useState, useCallback, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';

export interface TickMark {
  value: number;
  label: string;
  primary?: boolean;
}

interface PtzSliderProps {
  label: string;
  sublabel?: string;
  value: number;
  min: number;
  max: number;
  ticks: TickMark[];
  minorInterval?: number;
  onChange: (value: number) => void;
  onReset: () => void;
  unit?: string;
  leftIndicator?: string;
  rightIndicator?: string;
  centerIndicator?: string;
  step?: number;
}

export const PtzSlider: React.FC<PtzSliderProps> = ({
  label,
  sublabel,
  value,
  min,
  max,
  ticks,
  minorInterval,
  onChange,
  onReset,
  unit = '°',
  leftIndicator,
  rightIndicator,
  centerIndicator = '0°',
  step = 1,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Clamp value
  const clampedValue = Math.min(max, Math.max(min, value));

  // Compute percentage from min to max (0 to 100)
  const range = max - min;
  const currentPct = ((clampedValue - min) / range) * 100;
  const zeroPct = ((0 - min) / range) * 100; // 50% for symmetric ranges

  // Fill bar geometry: extends from zeroPct to currentPct
  const fillLeft = Math.min(zeroPct, currentPct);
  const fillWidth = Math.abs(currentPct - zeroPct);

  // Update value based on pointer coordinate
  const updateFromPointer = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const rawVal = min + ratio * range;
      const stepped = Math.round(rawVal / step) * step;
      const clamped = Math.min(max, Math.max(min, stepped));
      onChange(clamped);
    },
    [min, max, range, step, onChange]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    updateFromPointer(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    updateFromPointer(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe fallback
      }
    }
  };

  const handlePointerCancel = () => {
    setIsDragging(false);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const isShift = e.shiftKey;
    const fineStep = isShift ? 1 : 5;

    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        e.preventDefault();
        onChange(Math.max(min, clampedValue - fineStep));
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        e.preventDefault();
        onChange(Math.min(max, clampedValue + fineStep));
        break;
      case 'PageDown':
        e.preventDefault();
        onChange(Math.max(min, clampedValue - 15));
        break;
      case 'PageUp':
        e.preventDefault();
        onChange(Math.min(max, clampedValue + 15));
        break;
      case 'Home':
        e.preventDefault();
        onChange(min);
        break;
      case 'End':
        e.preventDefault();
        onChange(max);
        break;
      default:
        break;
    }
  };

  // Double click resets to 0°
  const handleDoubleClick = () => {
    onReset();
  };

  // Generate minor ticks if specified
  const minorTicks: number[] = [];
  if (minorInterval && minorInterval > 0) {
    for (let val = min; val <= max; val += minorInterval) {
      // Don't duplicate major ticks
      if (!ticks.some((t) => Math.abs(t.value - val) < 0.1)) {
        minorTicks.push(val);
      }
    }
  }

  // Format value display: e.g. "+45°" or "-90°" or "0°"
  const formattedValue =
    clampedValue > 0
      ? `+${clampedValue}${unit}`
      : `${clampedValue}${unit}`;

  return (
    <div
      className={`p-5 sm:p-6 rounded-2xl bg-white border border-stone-200/90 shadow-xs transition-all ${
        isHovered || isDragging
          ? 'border-emerald-300/80 ring-2 ring-emerald-600/5'
          : 'hover:border-stone-300'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top Header Row: Label, Dynamic Value & Quick Actions */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base sm:text-lg tracking-tight text-stone-900 font-sans">
              {label}
            </span>
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80 font-mono">
              {clampedValue === 0 ? 'CENTER 0°' : clampedValue > 0 ? `POS +${clampedValue}°` : `NEG ${clampedValue}°`}
            </span>
          </div>
          {sublabel && (
            <p className="text-[11px] text-stone-400 font-mono mt-0.5 tracking-wide">
              {sublabel}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Fine Nudge Buttons */}
          <div className="hidden sm:flex items-center rounded-lg border border-stone-200 bg-stone-50 p-0.5 font-mono text-xs">
            <button
              type="button"
              onClick={() => onChange(Math.max(min, clampedValue - 1))}
              title="Fine decrement 1° (Shift + Arrow Left)"
              className="px-2 py-1 rounded text-stone-600 hover:text-stone-900 hover:bg-white active:bg-stone-100 transition-colors"
            >
              -1°
            </button>
            <button
              type="button"
              onClick={() => onChange(Math.max(min, clampedValue - 5))}
              title="Step decrement 5°"
              className="px-2 py-1 rounded text-stone-600 hover:text-stone-900 hover:bg-white active:bg-stone-100 transition-colors font-bold"
            >
              -5°
            </button>
            <span className="w-px h-3.5 bg-stone-300 mx-0.5" />
            <button
              type="button"
              onClick={() => onChange(Math.min(max, clampedValue + 5))}
              title="Step increment 5°"
              className="px-2 py-1 rounded text-stone-600 hover:text-stone-900 hover:bg-white active:bg-stone-100 transition-colors font-bold"
            >
              +5°
            </button>
            <button
              type="button"
              onClick={() => onChange(Math.min(max, clampedValue + 1))}
              title="Fine increment 1° (Shift + Arrow Right)"
              className="px-2 py-1 rounded text-stone-600 hover:text-stone-900 hover:bg-white active:bg-stone-100 transition-colors"
            >
              +1°
            </button>
          </div>

          {/* Reset / Center Button */}
          <button
            type="button"
            onClick={onReset}
            disabled={clampedValue === 0}
            title={`Center ${label} to 0°`}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
              clampedValue === 0
                ? 'bg-stone-100 text-stone-400 border border-stone-200/60 cursor-default'
                : 'bg-stone-100 hover:bg-emerald-50 text-stone-700 hover:text-emerald-900 border border-stone-200 hover:border-emerald-300 shadow-2xs'
            }`}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${clampedValue !== 0 ? 'text-emerald-700' : 'text-stone-400'}`} />
            <span>Center (0°)</span>
          </button>

          {/* Dynamic Digital Readout Box */}
          <div className="min-w-[80px] text-right">
            <span className="inline-block px-3 py-1.5 rounded-xl bg-stone-900 text-emerald-400 font-mono font-bold text-lg sm:text-xl tracking-tight shadow-inner border border-stone-800">
              {formattedValue}
            </span>
          </div>
        </div>
      </div>

      {/* Slider Interactive Track & Control Area */}
      <div className="relative pt-3 pb-8 select-none">
        {/* Directional Zone Labels */}
        <div className="flex justify-between items-center text-[10px] sm:text-[11px] font-mono text-stone-400 mb-2 px-1">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
            {leftIndicator || `${min}°`}
          </span>
          <span className="text-stone-500 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            {centerIndicator}
          </span>
          <span className="flex items-center gap-1">
            {rightIndicator || `+${max}°`}
            <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
          </span>
        </div>

        {/* Outer Touch Target Area & Track Container */}
        <div
          ref={trackRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onDoubleClick={handleDoubleClick}
          className={`relative h-10 flex items-center cursor-pointer touch-none ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          title="Drag slider or double-click to center (0°)"
        >
          {/* Track Bar Background */}
          <div className="w-full h-3 rounded-full bg-stone-100 border border-stone-200/90 shadow-inner relative overflow-hidden">
            {/* Center zero reference line inside track */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-stone-300 z-0 -translate-x-1/2"
              style={{ left: `${zeroPct}%` }}
            />

            {/* Active Bi-directional Fill Bar from Center (0°) to Current Value */}
            <div
              className="absolute top-0 bottom-0 bg-gradient-to-r from-emerald-600 to-emerald-500 transition-[width,left] duration-75 ease-out shadow-xs"
              style={{
                left: `${fillLeft}%`,
                width: `${fillWidth}%`,
              }}
            />
          </div>

          {/* Center 0° Calibrated Center Marker Notch */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-stone-400 z-10 pointer-events-none -translate-x-1/2 shadow-xs"
            style={{ left: `${zeroPct}%` }}
            title="Mechanical 0° Center Axis"
          />

          {/* Intermediate Minor Tick Notches */}
          {minorTicks.map((val) => {
            const pct = ((val - min) / range) * 100;
            return (
              <div
                key={val}
                className="absolute top-1/2 -translate-y-1/2 w-0.5 h-2 bg-stone-300/80 pointer-events-none -translate-x-1/2 z-5"
                style={{ left: `${pct}%` }}
              />
            );
          })}

          {/* Major Calibrated Tick Notches */}
          {ticks.map((t) => {
            const pct = ((t.value - min) / range) * 100;
            const isZero = t.value === 0;
            return (
              <div
                key={t.value}
                className={`absolute top-1/2 -translate-y-1/2 pointer-events-none -translate-x-1/2 z-10 ${
                  isZero
                    ? 'w-1 h-5 bg-emerald-700/80 rounded-full'
                    : 'w-0.5 h-3.5 bg-stone-400'
                }`}
                style={{ left: `${pct}%` }}
              />
            );
          })}

          {/* Large Ergonomic Slider Thumb */}
          <div
            role="slider"
            tabIndex={0}
            aria-label={`${label} angle position`}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={clampedValue}
            aria-valuetext={`${clampedValue} degrees`}
            onKeyDown={handleKeyDown}
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border-2 border-emerald-700 shadow-md flex items-center justify-center transition-transform outline-none focus-visible:ring-4 focus-visible:ring-emerald-700/30 ${
              isDragging ? 'scale-110 shadow-lg cursor-grabbing' : 'hover:scale-105 cursor-grab'
            }`}
            style={{
              left: `${currentPct}%`,
            }}
          >
            {/* Inner jewel indicator / tactile crosshair */}
            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-emerald-800 flex items-center justify-center shadow-xs">
              <div className="w-1 h-1 rounded-full bg-white" />
            </div>

            {/* Small active tooltip on drag */}
            {isDragging && (
              <div className="absolute -top-8 px-2 py-0.5 rounded-md bg-stone-900 text-emerald-400 font-mono text-[10px] font-bold shadow-md whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95">
                {formattedValue}
              </div>
            )}
          </div>
        </div>

        {/* Tick Labels Row Below Slider */}
        <div className="relative w-full h-5 mt-1 select-none pointer-events-auto">
          {ticks.map((t) => {
            const pct = ((t.value - min) / range) * 100;
            const isZero = t.value === 0;
            const isSelected = Math.abs(clampedValue - t.value) < 1;

            return (
              <button
                key={t.value}
                type="button"
                onClick={() => onChange(t.value)}
                className={`absolute top-0 -translate-x-1/2 text-[10px] sm:text-xs font-mono font-medium transition-colors hover:text-emerald-800 ${
                  isSelected
                    ? 'text-emerald-800 font-bold underline decoration-emerald-600 decoration-2 underline-offset-2'
                    : isZero
                    ? 'text-stone-800 font-bold'
                    : 'text-stone-400'
                }`}
                style={{ left: `${pct}%` }}
                title={`Jump to ${t.label}`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Micro UX Tips */}
      <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono pt-2 border-t border-stone-100">
        <span className="hidden sm:inline">
          Tip: Arrow keys adjust by 5° • Shift + Arrow by 1° • Double-click to center
        </span>
        <span className="sm:hidden">Double-click track to center 0°</span>
        <span className="text-emerald-800 font-semibold">
          RS-485 N06 Gimbal • High Precision
        </span>
      </div>
    </div>
  );
};

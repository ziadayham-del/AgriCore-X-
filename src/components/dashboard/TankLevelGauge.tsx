import React from 'react';
import { Droplet, AlertTriangle } from 'lucide-react';
import { WaterTelemetry } from '../../types';

interface TankLevelGaugeProps {
  water: WaterTelemetry;
  lowThreshold?: number;
}

export const TankLevelGauge: React.FC<TankLevelGaugeProps> = ({
  water,
  lowThreshold = 20,
}) => {
  const isLow = water.tankLevelPercent < lowThreshold;

  return (
    <div className="bg-white rounded-xl border border-stone-200/80 p-5 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Water Storage
          </span>
          <h3 className="text-base font-bold text-stone-900 mt-0.5">Reservoir Tank</h3>
        </div>
        <div className="p-2 rounded-xl bg-sky-50 text-sky-700">
          <Droplet className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-center gap-6 my-2">
        {/* Visual Tank Column */}
        <div className="relative w-16 h-36 bg-stone-100 rounded-xl border-2 border-stone-300 overflow-hidden shrink-0 shadow-inner flex flex-col justify-end">
          {/* Depth markings */}
          <div className="absolute inset-0 flex flex-col justify-between py-2 px-1 text-[9px] text-stone-400 font-mono pointer-events-none select-none">
            <span className="border-b border-stone-300">100%</span>
            <span className="border-b border-stone-300">75%</span>
            <span className="border-b border-stone-300">50%</span>
            <span className="border-b border-stone-300">25%</span>
            <span>0%</span>
          </div>

          {/* Liquid level */}
          <div
            className={`w-full transition-all duration-700 relative ${
              isLow ? 'bg-amber-400/80' : 'bg-emerald-500/80'
            }`}
            style={{ height: `${Math.min(100, Math.max(5, water.tankLevelPercent))}%` }}
          >
            {/* Liquid surface wave ripple line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/40" />
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="flex-1 space-y-2">
          <div>
            <div className="text-3xl font-mono font-bold text-stone-900">
              {water.tankLevelPercent}%
            </div>
            <div className="text-xs text-stone-500 font-mono">
              Depth: {water.tankDepthCm} cm
            </div>
          </div>

          <div className="space-y-1 text-xs pt-2 border-t border-stone-100">
            <div className="flex justify-between items-center">
              <span className="text-stone-500">Pump Status:</span>
              <span className={`font-mono font-semibold ${water.pumpState ? 'text-emerald-700' : 'text-stone-500'}`}>
                {water.pumpState ? 'RUNNING' : 'OFF'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-500">Solenoid Valve:</span>
              <span className={`font-mono font-semibold ${water.solenoidState ? 'text-emerald-700' : 'text-stone-500'}`}>
                {water.solenoidState ? 'OPEN' : 'CLOSED'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-500">Dry-Run Interlock:</span>
              <span className="font-mono text-emerald-800 font-semibold">Active OK</span>
            </div>
          </div>

          {isLow && (
            <div className="flex items-center gap-1.5 p-1.5 rounded bg-amber-50 text-amber-900 text-xs border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
              <span>Low water: Pump auto-disabled</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

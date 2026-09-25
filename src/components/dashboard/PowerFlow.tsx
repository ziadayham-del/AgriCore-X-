import React from 'react';
import { Sun, Battery, Zap, Home, ArrowRight } from 'lucide-react';
import { PowerTelemetry } from '../../types';

interface PowerFlowProps {
  power: PowerTelemetry;
}

export const PowerFlow: React.FC<PowerFlowProps> = ({ power }) => {
  const isSolarGenerating = power.solarPower > 10;
  const isBatteryDischarging = power.batteryState === 'discharging';
  const isBatteryCharging = power.batteryState === 'charging';
  const isGridActive = power.activeSource === 'grid';

  return (
    <div className="bg-white rounded-xl border border-stone-200/80 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Hybrid Energy Flow
          </span>
          <h3 className="text-base font-bold text-stone-900 mt-0.5">Live Generation & Distribution</h3>
        </div>
        <div className="text-right">
          <span className="text-xs text-stone-500">Active Supply:</span>
          <span className="ml-1.5 text-xs font-mono font-bold uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            {power.activeSource}
          </span>
        </div>
      </div>

      {/* Interactive Schematic Diagram */}
      <div className="relative py-4 px-2">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          {/* Node 1: Solar Generation */}
          <div className={`p-4 rounded-xl border transition-all text-center ${
            isSolarGenerating 
              ? 'bg-amber-50/70 border-amber-300 text-amber-950 shadow-xs' 
              : 'bg-stone-50 border-stone-200 text-stone-400'
          }`}>
            <Sun className={`w-6 h-6 mx-auto mb-1 ${isSolarGenerating ? 'text-amber-600 animate-spin-slow' : 'text-stone-400'}`} />
            <div className="text-xs font-bold uppercase tracking-wider">Solar Array</div>
            <div className="text-lg font-mono font-bold mt-1 text-stone-900">{power.solarPower} W</div>
            <div className="text-[11px] text-stone-500 font-mono">{power.solarVoltage}V • {power.solarCurrent}A</div>
          </div>

          {/* Node 2: Charge Controller & Battery */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 text-center">
            <Battery className="w-6 h-6 mx-auto mb-1 text-emerald-700" />
            <div className="text-xs font-bold uppercase tracking-wider text-stone-700">12V Battery Pack</div>
            <div className="text-lg font-mono font-bold mt-1 text-stone-900">{power.batterySoc}%</div>
            <div className="text-[11px] text-emerald-800 font-mono font-semibold capitalize">
              {power.batteryState} ({power.batteryVoltage}V)
            </div>
          </div>

          {/* Node 3: AC Grid Connection */}
          <div className={`p-4 rounded-xl border text-center ${
            isGridActive
              ? 'bg-sky-50 border-sky-300 text-sky-950'
              : 'bg-stone-50 border-stone-200 text-stone-500'
          }`}>
            <Zap className={`w-6 h-6 mx-auto mb-1 ${isGridActive ? 'text-sky-600' : 'text-stone-400'}`} />
            <div className="text-xs font-bold uppercase tracking-wider">AC Mains Grid</div>
            <div className="text-lg font-mono font-bold mt-1 text-stone-900">
              {power.gridVoltage ? `${power.gridVoltage} V` : 'Standby'}
            </div>
            <div className="text-[11px] text-stone-500 font-mono">
              {power.gridPower ? `${power.gridPower} W` : 'Isolated / Standby'}
            </div>
          </div>

          {/* Node 4: Farm Field Load */}
          <div className="p-4 rounded-xl border border-stone-300 bg-stone-900 text-white text-center shadow-xs">
            <Home className="w-6 h-6 mx-auto mb-1 text-emerald-400" />
            <div className="text-xs font-bold uppercase tracking-wider text-stone-300">Total Farm Load</div>
            <div className="text-lg font-mono font-bold mt-1 text-emerald-300">
              {(power.solarPower * 0.85 + (isBatteryDischarging ? 40 : 0)).toFixed(0)} W
            </div>
            <div className="text-[11px] text-stone-400 font-mono">Pump + Nodes + CCTV</div>
          </div>
        </div>

        {/* Technical Energy Metrics */}
        <div className="mt-4 pt-3 border-t border-stone-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
          <div>
            <span className="text-stone-400">Daily PV Yield:</span>
            <span className="ml-1 font-mono font-bold text-stone-800">{power.dailySolarKwh} kWh</span>
          </div>
          <div>
            <span className="text-stone-400">Grid Today:</span>
            <span className="ml-1 font-mono font-bold text-stone-800">{power.todayGridKwh} kWh</span>
          </div>
          <div>
            <span className="text-stone-400">Power Controller:</span>
            <span className="ml-1 font-mono font-bold text-emerald-800">N03 + N08</span>
          </div>
          <div>
            <span className="text-stone-400">Bus Interface:</span>
            <span className="ml-1 font-mono font-bold text-stone-800">RS-485 Modbus</span>
          </div>
        </div>
      </div>
    </div>
  );
};

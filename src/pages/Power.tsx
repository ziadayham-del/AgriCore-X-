import React from 'react';
import { useTelemetry } from '../hooks/useTelemetry';
import { useToast } from '../components/common/Toast';
import { PowerFlow } from '../components/dashboard/PowerFlow';
import { StatusBadge } from '../components/common/StatusBadge';
import { setSourcePriority, setManualPowerSource } from '../api/powerApi';
import { PowerSource } from '../types';
import {
  Sun,
  Battery,
  Zap,
  RotateCw,
  Activity,
  Sliders,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const Power: React.FC = () => {
  const { power, tracker, settings } = useTelemetry();
  const { showToast } = useToast();

  const handlePriorityChange = async (priority: 'solar_first' | 'battery_backup' | 'grid_fallback') => {
    await setSourcePriority(priority);
    showToast('success', 'Power Priority Updated', `Source prioritization set to ${priority.replace('_', ' ')}.`);
  };

  const handleManualSourceSwitch = async (source: PowerSource) => {
    await setManualPowerSource(source);
    showToast('info', 'Switchover Dispatched', `Relay controller N08 switching active source to ${source.toUpperCase()}.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-800 text-white font-mono text-xs font-bold">
              NODE N03 & N08
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              Hybrid Power & Energy Management
            </h1>
          </div>
          <p className="text-sm text-stone-500 mt-1">
            Solar PV generation, 12V battery storage monitoring, AC grid isolation, and Nano relay failover
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-white px-3 py-1.5 rounded-lg border border-stone-200">
          <span className="text-stone-400">Nano Relay Link:</span>
          <span className="text-emerald-700 font-bold">UART Active OK</span>
        </div>
      </div>

      {/* Live Power Flow Schematic */}
      <PowerFlow power={power} />

      {/* 3 Detailed Cards: Solar, Battery, Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Solar Card */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                Solar Photovoltaic
              </span>
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
                <Sun className="w-5 h-5" />
              </div>
            </div>

            <div className="text-3xl font-mono font-bold text-stone-900">
              {power.solarPower} W
            </div>
            <div className="text-xs text-stone-500 mt-1">Instantaneous Generation</div>

            <div className="space-y-2 mt-4 pt-3 border-t border-stone-100 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-stone-400">Array Voltage:</span>
                <span className="text-stone-800 font-bold">{power.solarVoltage} V</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Array Current:</span>
                <span className="text-stone-800 font-bold">{power.solarCurrent} A</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Today's Generation:</span>
                <span className="text-emerald-800 font-bold">{power.dailySolarKwh} kWh</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-stone-100">
                <span className="text-stone-400">Tracker Orientation:</span>
                <span className="text-stone-800 font-bold">
                  H: {tracker.horizontalAngle}° | V: {tracker.verticalAngle}°
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleManualSourceSwitch('solar')}
            className={`w-full mt-4 py-2 text-xs font-semibold rounded-lg border transition-all ${
              power.activeSource === 'solar'
                ? 'bg-amber-100 text-amber-950 border-amber-300 font-bold'
                : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
            }`}
          >
            {power.activeSource === 'solar' ? '● Active Source (Solar)' : 'Force Switch to Solar'}
          </button>
        </div>

        {/* Battery Card */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                12V Energy Storage
              </span>
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                <Battery className="w-5 h-5" />
              </div>
            </div>

            <div className="text-3xl font-mono font-bold text-stone-900">
              {power.batterySoc}%
            </div>
            <div className="text-xs text-stone-500 mt-1 capitalize">
              State of Charge ({power.batteryState})
            </div>

            <div className="space-y-2 mt-4 pt-3 border-t border-stone-100 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-stone-400">Terminal Voltage:</span>
                <span className="text-stone-800 font-bold">{power.batteryVoltage} V</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Net Current:</span>
                <span className="text-stone-800 font-bold">{power.batteryCurrent} A</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Charge Controller:</span>
                <span className="text-emerald-800 font-bold">MPPT 12V 20A</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-stone-100">
                <span className="text-stone-400">BMS Protection:</span>
                <span className="text-emerald-700 font-bold">Nominal OK</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleManualSourceSwitch('battery')}
            className={`w-full mt-4 py-2 text-xs font-semibold rounded-lg border transition-all ${
              power.activeSource === 'battery'
                ? 'bg-emerald-100 text-emerald-950 border-emerald-300 font-bold'
                : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
            }`}
          >
            {power.activeSource === 'battery' ? '● Active Source (Battery)' : 'Force Switch to Battery'}
          </button>
        </div>

        {/* Grid Card */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-800">
                Isolated AC Grid
              </span>
              <div className="p-1.5 rounded-lg bg-sky-50 text-sky-700">
                <Zap className="w-5 h-5" />
              </div>
            </div>

            <div className="text-3xl font-mono font-bold text-stone-900">
              {power.gridVoltage ? `${power.gridVoltage} V` : 'Standby'}
            </div>
            <div className="text-xs text-stone-500 mt-1">AC Mains Supply</div>

            <div className="space-y-2 mt-4 pt-3 border-t border-stone-100 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-stone-400">Grid Current:</span>
                <span className="text-stone-800 font-bold">{power.gridCurrent || 0} A</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Grid Power Draw:</span>
                <span className="text-stone-800 font-bold">{power.gridPower || 0} W</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Grid Today:</span>
                <span className="text-stone-800 font-bold">{power.todayGridKwh} kWh</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-stone-100">
                <span className="text-stone-400">AC Transducer:</span>
                <span className="text-sky-700 font-bold">PZEM-004T Isolated</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleManualSourceSwitch('grid')}
            className={`w-full mt-4 py-2 text-xs font-semibold rounded-lg border transition-all ${
              power.activeSource === 'grid'
                ? 'bg-sky-100 text-sky-950 border-sky-300 font-bold'
                : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
            }`}
          >
            {power.activeSource === 'grid' ? '● Active Source (Grid)' : 'Force Switch to Grid'}
          </button>
        </div>
      </div>

      {/* Priority Policy Selector (Section 6.1 of System Design Document) */}
      <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Source Automation Logic
            </span>
            <h3 className="text-base font-bold text-stone-900 mt-0.5">
              Power Prioritization Policy
            </h3>
          </div>
          <span className="text-xs font-mono text-stone-400">
            Node N03 State Machine + N08 Relay
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handlePriorityChange('solar_first')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              power.sourcePriority === 'solar_first'
                ? 'border-emerald-700 bg-emerald-50/60 ring-1 ring-emerald-700/20'
                : 'border-stone-200 hover:bg-stone-50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-stone-900">1. Solar First (Eco)</span>
              {power.sourcePriority === 'solar_first' && <CheckCircle2 className="w-4 h-4 text-emerald-700" />}
            </div>
            <p className="text-[11px] text-stone-500">
              Prioritizes direct solar PV, stores excess in battery, switches to grid only on low SOC.
            </p>
          </button>

          <button
            onClick={() => handlePriorityChange('battery_backup')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              power.sourcePriority === 'battery_backup'
                ? 'border-emerald-700 bg-emerald-50/60 ring-1 ring-emerald-700/20'
                : 'border-stone-200 hover:bg-stone-50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-stone-900">2. Battery Reserve (UPS)</span>
              {power.sourcePriority === 'battery_backup' && <CheckCircle2 className="w-4 h-4 text-emerald-700" />}
            </div>
            <p className="text-[11px] text-stone-500">
              Maintains battery at 90%+ SOC for emergency backup. Uses grid for high motor loads.
            </p>
          </button>

          <button
            onClick={() => handlePriorityChange('grid_fallback')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              power.sourcePriority === 'grid_fallback'
                ? 'border-emerald-700 bg-emerald-50/60 ring-1 ring-emerald-700/20'
                : 'border-stone-200 hover:bg-stone-50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-stone-900">3. Grid Fallback</span>
              {power.sourcePriority === 'grid_fallback' && <CheckCircle2 className="w-4 h-4 text-emerald-700" />}
            </div>
            <p className="text-[11px] text-stone-500">
              Runs farm loads on AC mains whenever available; solar charges battery for outages.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

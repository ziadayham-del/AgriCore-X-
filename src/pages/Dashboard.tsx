import React from 'react';
import { Link } from 'react-router-dom';
import { useTelemetry } from '../hooks/useTelemetry';
import { MetricCard } from '../components/common/MetricCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { PowerFlow } from '../components/dashboard/PowerFlow';
import { TankLevelGauge } from '../components/dashboard/TankLevelGauge';
import { NetworkPriorityCard } from '../components/dashboard/NetworkPriorityCard';
import { openRoof, closeRoof } from '../api/roofApi';
import {
  Thermometer,
  Droplets,
  Sun,
  CloudRain,
  Sprout,
  Shield,
  Home as RoofIcon,
  ArrowUp,
  ArrowDown,
  Cpu,
  ArrowUpRight,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const telemetry = useTelemetry();
  const activeCrop = telemetry.crops[0]; // Rice Field A

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Farm Overview
          </h1>
          <p className="text-sm text-stone-500 mt-0.5">
            Real-time status of your smart agricultural system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-stone-500">
            Last RS-485 scan: Just now
          </span>
        </div>
      </div>

      {/* Network Priority Matrix */}
      <NetworkPriorityCard network={telemetry.network} />

      {/* Top Telemetry Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Avg Soil Moisture"
          value={(
            telemetry.soilZones.reduce((acc, z) => acc + z.moisture, 0) /
            telemetry.soilZones.length
          ).toFixed(1)}
          unit="%"
          subtitle="4-zone capacitive matrix"
          icon={<Sprout className="w-4 h-4" />}
          trend={{ value: 'Optimal (55-65%)', positive: true }}
        />

        <MetricCard
          title="Air Temperature"
          value={telemetry.environment.temperature}
          unit="°C"
          subtitle="SHT31 Ambient probe"
          icon={<Thermometer className="w-4 h-4" />}
          trend={{ value: 'Target: 22-32°C', positive: true }}
        />

        <MetricCard
          title="Relative Humidity"
          value={telemetry.environment.humidity}
          unit="%"
          subtitle="Greenhouse canopy"
          icon={<Droplets className="w-4 h-4" />}
          trend={{ value: 'Moderate vapor', positive: true }}
        />

        <MetricCard
          title="Sunlight Intensity"
          value={(telemetry.environment.lightLux / 1000).toFixed(1)}
          unit="kLux"
          subtitle="BH1750 Sensor"
          icon={<Sun className="w-4 h-4" />}
          trend={{ value: 'Full Daylight', positive: true }}
        />
      </div>

      {/* Hybrid Power Flow & Generation Section */}
      <PowerFlow power={telemetry.power} />

      {/* Main Dual Grid: Soil Zones, Water Tank, Crop Summary & Automation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Col 1 & 2: Soil Moisture 4-Zones & Environmental Sensors */}
        <div className="lg:col-span-2 space-y-6">
          {/* Soil Moisture 4 Zones */}
          <div className="bg-white rounded-xl border border-stone-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Capacitive Moisture
                </span>
                <h3 className="text-base font-bold text-stone-900 mt-0.5">
                  Soil Zones (1 — 4)
                </h3>
              </div>
              <Link
                to="/agriculture"
                className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 flex items-center gap-1"
              >
                <span>Control Page</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {telemetry.soilZones.map((zone) => {
                const isOptimal = zone.moisture >= 45 && zone.moisture <= 75;
                return (
                  <div
                    key={zone.zone}
                    className="p-3.5 rounded-xl border border-stone-200/90 bg-stone-50/50 hover:bg-white hover:border-emerald-700/30 transition-all"
                  >
                    <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                      <span className="font-mono font-bold">Zone {zone.zone}</span>
                      <StatusBadge
                        status={zone.sensorStatus}
                        variant={zone.sensorStatus === 'online' ? 'online' : 'fault'}
                        size="sm"
                      />
                    </div>
                    <div className="text-2xl font-mono font-bold text-stone-900 mt-2">
                      {zone.moisture}%
                    </div>
                    <div className="mt-2 w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOptimal ? 'bg-emerald-600' : 'bg-amber-500'
                        }`}
                        style={{ width: `${zone.moisture}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-stone-400 mt-2 flex justify-between">
                      <span>Bed {String.fromCharCode(64 + zone.zone)}</span>
                      <span>ADC: {zone.rawAdc || 2400}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Crop Intelligence Quick Card (Page 8 & 10) */}
          {activeCrop && (
            <div className="bg-white rounded-xl border border-stone-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                    Active Crop Intelligence
                  </span>
                  <h3 className="text-lg font-bold text-stone-900 mt-0.5">
                    {activeCrop.name} • {activeCrop.fieldName}
                  </h3>
                </div>
                <Link
                  to={`/crops/${activeCrop.id}`}
                  className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 flex items-center gap-1"
                >
                  <span>Crop Details</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-stone-500">Current Day</div>
                  <div className="text-xl font-mono font-bold text-emerald-900 mt-0.5">Day {activeCrop.currentDay}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-stone-500">Growth Stage</div>
                  <div className="text-base font-semibold text-stone-800 mt-1">{activeCrop.growthStage}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-stone-500">Health Indicator</div>
                  <div className="text-xl font-mono font-bold text-emerald-700 mt-0.5">{activeCrop.healthScore}%</div>
                  <div className="text-[9px] text-stone-400">Engineering score</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-stone-500">Expected Harvest</div>
                  <div className="text-xs font-mono font-semibold text-stone-800 mt-1">{activeCrop.expectedHarvest}</div>
                  <div className="text-[9px] text-stone-500">56 days remaining</div>
                </div>
              </div>

              {/* Today & Next Tasks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-3 border-t border-stone-100">
                <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/40">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Today's Task</span>
                  </div>
                  <div className="text-xs font-semibold text-stone-900 mt-1">
                    {activeCrop.todayTask}
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-stone-200 bg-stone-50/70">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                    Next Scheduled Task
                  </div>
                  <div className="text-xs font-medium text-stone-700 mt-1">
                    {activeCrop.nextTask}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Col 3: Water Reservoir & Subsystem Status (Roof, Security) */}
        <div className="space-y-6">
          {/* Water Storage */}
          <TankLevelGauge water={telemetry.water} />

          {/* ROOF Summary Card */}
          <div className="bg-white rounded-xl border border-stone-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Roof
              </span>
              <Link to="/roof" className="text-stone-400 hover:text-emerald-800">
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50 border border-stone-200">
                <div className="flex items-center gap-2">
                  <RoofIcon className="w-4 h-4 text-emerald-800" />
                  <span className="text-xs font-semibold text-stone-800">Roof Status</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    telemetry.roof.state === 'OPEN' ? 'bg-emerald-600' : 'bg-stone-500'
                  }`} />
                  <span className="text-xs font-bold font-mono text-stone-800">
                    ● {telemetry.roof.state}
                  </span>
                </div>
              </div>

              {/* Open / Close Controls */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => openRoof()}
                  disabled={telemetry.roof.state === 'OPEN' || telemetry.roof.state === 'OPENING'}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-bold text-xs bg-emerald-800 text-white hover:bg-emerald-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                  <span>Open</span>
                </button>
                <button
                  type="button"
                  onClick={() => closeRoof()}
                  disabled={telemetry.roof.state === 'CLOSED' || telemetry.roof.state === 'CLOSING'}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-bold text-xs bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                  <span>Close</span>
                </button>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg border text-xs bg-stone-50 border-stone-200">
                <div className="flex items-center gap-1.5 text-stone-600">
                  <CloudRain className="w-3.5 h-3.5 text-sky-600" />
                  <span>Rain Sensor:</span>
                </div>
                <span className={`font-mono font-bold ${telemetry.roof.rainDetected ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {telemetry.roof.rainDetected ? 'RAIN DETECTED' : 'DRY'}
                </span>
              </div>
            </div>
          </div>

          {/* Security & Perimeter Summary Card */}
          <div className="bg-white rounded-xl border border-stone-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Security & Perimeter
              </span>
              <Link to="/security" className="text-stone-400 hover:text-emerald-800">
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50/60 border border-emerald-200 mb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-800" />
                <span className="text-xs font-bold text-emerald-950">Alarm Controller</span>
              </div>
              <StatusBadge status={telemetry.security.alarmState} variant="active" size="sm" pulse />
            </div>

            <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-mono mb-2">
              {[1, 2, 3, 4].map(z => (
                <div key={z} className="p-1.5 rounded bg-stone-50 border border-stone-200">
                  <div className="text-stone-400">Beam {z}</div>
                  <div className="font-bold text-emerald-700">OK</div>
                </div>
              ))}
            </div>

            <div className="text-[11px] text-stone-500 pt-2 border-t border-stone-100 flex items-center justify-between">
              <span>Security Camera N06:</span>
              <span className="font-mono text-emerald-700 font-semibold">Online & Armed</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Health: 8 Distributed Nodes Status (Section 8) */}
      <div className="bg-white rounded-xl border border-stone-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Distributed Hardware Status
            </span>
            <h3 className="text-base font-bold text-stone-900 mt-0.5">
              Controller Nodes (N01 — N08)
            </h3>
          </div>
          <Link
            to="/system"
            className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 flex items-center gap-1"
          >
            <span>Node Diagnostic Manager</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {telemetry.nodes.map((node) => (
            <div
              key={node.nodeId}
              className="p-3 rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-white transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-mono font-bold text-xs text-stone-900 bg-stone-200/70 px-1.5 py-0.5 rounded">
                    {node.nodeId}
                  </span>
                  <StatusBadge
                    status={node.online ? 'ONLINE' : 'OFFLINE'}
                    variant={node.online ? 'online' : 'offline'}
                    size="sm"
                    pulse={node.online}
                  />
                </div>
                <div className="text-xs font-semibold text-stone-800 mt-1 truncate">
                  {node.name}
                </div>
                <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                  {node.controllerMcu}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-stone-200/60 text-[10px] font-mono text-stone-500 flex justify-between">
                <span>Up: {Math.floor(node.uptimeSeconds / 3600)}h</span>
                <span>FW: {node.firmwareVersion}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { useTelemetry } from '../hooks/useTelemetry';
import { useToast } from '../components/common/Toast';
import { StatusBadge } from '../components/common/StatusBadge';
import { ToggleControl } from '../components/common/ToggleControl';
import { TankLevelGauge } from '../components/dashboard/TankLevelGauge';
import {
  setPump,
  setSolenoid,
  setHumidifier,
  setLighting,
} from '../api/agricultureApi';
import {
  Sprout,
  Thermometer,
  Droplets,
  Sun,
  CloudRain,
  Activity,
  Sliders,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const Agriculture: React.FC = () => {
  const telemetry = useTelemetry();
  const { showToast } = useToast();

  const handlePumpToggle = async (target: boolean) => {
    showToast('info', 'Command Dispatched', `N02 Irrigation Controller: Turning pump ${target ? 'ON' : 'OFF'}...`);
    const res = await setPump(target);
    if (res.success) {
      showToast('success', 'Pump State Confirmed', `Irrigation pump motor is now ${target ? 'RUNNING' : 'STOPPED'}.`);
    } else {
      showToast('error', 'Pump Command Blocked', res.error);
    }
    return res;
  };

  const handleSolenoidToggle = async (target: boolean) => {
    showToast('info', 'Command Dispatched', `N02 Valve Controller: Solenoid ${target ? 'OPEN' : 'CLOSE'}...`);
    const res = await setSolenoid(target);
    if (res.success) {
      showToast('success', 'Solenoid Confirmed', `Master distribution valve is now ${target ? 'OPEN' : 'CLOSED'}.`);
    } else {
      showToast('error', 'Solenoid Error', res.error);
    }
    return res;
  };

  const handleHumidifierToggle = async (target: boolean) => {
    const res = await setHumidifier(target);
    if (res.success) {
      showToast('success', 'Humidifier Confirmed', `Humidification mist generator is now ${target ? 'ON' : 'OFF'}.`);
    }
    return res;
  };

  const handleLightingToggle = async (target: boolean) => {
    const res = await setLighting(target);
    if (res.success) {
      showToast('success', 'Supplemental Lighting Confirmed', `Grow lamp relays set to ${target ? 'ON' : 'OFF'}.`);
    }
    return res;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-800 text-white font-mono text-xs font-bold">
              NODE N02
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              Agriculture & Irrigation Automation
            </h1>
          </div>
          <p className="text-sm text-stone-500 mt-1">
            4-zone capacitive soil tracking, microclimate monitoring, and safe actuator switching
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono bg-white px-3 py-1.5 rounded-lg border border-stone-200">
          <span className="text-stone-400">Node N02 Status:</span>
          <span className="text-emerald-700 font-bold">115.2 kbps RS-485 OK</span>
        </div>
      </div>

      {/* 4-Zone Capacitive Soil Moisture Section (Section 9) */}
      <div className="bg-white rounded-xl border border-stone-200/80 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Corrosion-Resistant Capacitive Probes
            </span>
            <h3 className="text-lg font-bold text-stone-900 mt-0.5">
              4-Zone Soil Moisture Matrix
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-stone-600 bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-200 font-mono">
            <Sliders className="w-3.5 h-3.5 text-stone-500" />
            <span>Target Threshold: {telemetry.settings.moistureLowThreshold}% - {telemetry.settings.moistureHighThreshold}%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {telemetry.soilZones.map((zone) => {
            const isLow = zone.moisture < telemetry.settings.moistureLowThreshold;
            const isHigh = zone.moisture > telemetry.settings.moistureHighThreshold;
            const isNormal = !isLow && !isHigh;

            return (
              <div
                key={zone.zone}
                className="bg-stone-50/60 rounded-xl border border-stone-200 p-4 transition-all hover:border-emerald-700/30 hover:bg-white"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-emerald-100/70 text-emerald-800">
                      <Sprout className="w-4 h-4" />
                    </div>
                    <span className="font-mono font-bold text-sm text-stone-900">
                      Zone {zone.zone}
                    </span>
                  </div>
                  <StatusBadge
                    status={zone.sensorStatus}
                    variant={zone.sensorStatus === 'online' ? 'online' : 'fault'}
                    size="sm"
                  />
                </div>

                <div className="flex items-baseline justify-between mt-3">
                  <span className="text-3xl font-mono font-bold text-stone-900">
                    {zone.moisture}%
                  </span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded font-mono ${
                      isNormal
                        ? 'bg-emerald-100 text-emerald-800'
                        : isLow
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-sky-100 text-sky-900'
                    }`}
                  >
                    {isNormal ? 'OPTIMAL' : isLow ? 'DRY' : 'SATURATED'}
                  </span>
                </div>

                {/* Moisture Bar */}
                <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden mt-3">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isNormal ? 'bg-emerald-600' : isLow ? 'bg-amber-500' : 'bg-sky-500'
                    }`}
                    style={{ width: `${zone.moisture}%` }}
                  />
                </div>

                <div className="mt-3 pt-2 border-t border-stone-200/60 flex items-center justify-between text-[11px] text-stone-500 font-mono">
                  <span>ADC: {zone.rawAdc || 2400}</span>
                  <span>Field {String.fromCharCode(64 + zone.zone)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Environmental Sensors Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Temperature */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Temperature
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800">
              <Thermometer className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-mono font-bold text-stone-900">
            {telemetry.environment.temperature}°C
          </div>
          <div className="text-xs text-stone-500 mt-1 flex justify-between">
            <span>SHT31 / DHT22</span>
            <span className="text-emerald-700 font-medium">Nominal Range</span>
          </div>
        </div>

        {/* Humidity */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Humidity
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800">
              <Droplets className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-mono font-bold text-stone-900">
            {telemetry.environment.humidity}%
          </div>
          <div className="text-xs text-stone-500 mt-1 flex justify-between">
            <span>Relative RH</span>
            <span className="text-emerald-700 font-medium">Optimal Canopy</span>
          </div>
        </div>

        {/* Light */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Ambient Light
            </span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-800">
              <Sun className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-mono font-bold text-stone-900">
            {telemetry.environment.lightLux.toLocaleString()}
          </div>
          <div className="text-xs text-stone-500 mt-1 flex justify-between">
            <span>BH1750 (Lux)</span>
            <span className="text-amber-700 font-medium">Photoperiod Active</span>
          </div>
        </div>

        {/* Rain Detection */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Precipitation Sensor
            </span>
            <div className="p-1.5 rounded-lg bg-sky-50 text-sky-800">
              <CloudRain className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-mono font-bold text-stone-900">
            {telemetry.environment.rainDetected ? 'RAIN DETECTED' : 'NO RAIN'}
          </div>
          <div className="text-xs text-stone-500 mt-1 flex justify-between font-mono">
            <span>Raw: {telemetry.environment.rawRainValue || 3820}</span>
            <span className={telemetry.environment.rainDetected ? 'text-rose-600 font-bold' : 'text-emerald-700'}>
              {telemetry.environment.rainDetected ? 'Roof Interlock Active' : 'Clear Sky'}
            </span>
          </div>
        </div>
      </div>

      {/* Water Reservoir and Actuator Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reservoir Gauge */}
        <div className="lg:col-span-1">
          <TankLevelGauge
            water={telemetry.water}
            lowThreshold={telemetry.settings.tankLowThreshold}
          />
        </div>

        {/* Actuators Control Center (Section 9 & 29 Command State Machine) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                8-Channel Relay Module & MOSFET Drivers
              </span>
              <h3 className="text-lg font-bold text-stone-900 mt-0.5">
                Physical Actuator Controls
              </h3>
            </div>
            <div className="text-xs text-stone-500 bg-stone-50 px-2.5 py-1 rounded border border-stone-200 font-mono">
              Command State Machine: IDLE ➔ SENDING ➔ ACKNOWLEDGED
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ToggleControl
              label="Irrigation Pump Motor"
              channel="N02 RELAY CH-01 • 12V DC SUBMERSIBLE"
              description="High-flow submersible irrigation pump with automatic low-water dry-run safety interlock."
              icon={<Droplets className="w-4 h-4" />}
              currentState={telemetry.water.pumpState}
              onToggle={handlePumpToggle}
              runningStatusText="RUNNING"
              stoppedStatusText="STOPPED"
              warningNote={
                telemetry.water.tankLevelPercent < telemetry.settings.tankLowThreshold
                  ? `Safety Interlock Engaged: Tank (${telemetry.water.tankLevelPercent}%) is below minimum safe threshold (${telemetry.settings.tankLowThreshold}%). Dry-run lockout prevents activation.`
                  : undefined
              }
            />

            <ToggleControl
              label="Zone Solenoid Valve"
              channel="N02 RELAY CH-02 • 12V DRIP HEADER"
              description="High-pressure brass solenoid valve governing pressurized water delivery to Field A drip emitters."
              icon={<Sliders className="w-4 h-4" />}
              currentState={telemetry.water.solenoidState}
              onToggle={handleSolenoidToggle}
              runningStatusText="VALVE OPEN"
              stoppedStatusText="VALVE CLOSED"
            />

            <ToggleControl
              label="Micro-Mist Humidifier"
              channel="N02 RELAY CH-03 • ULTRASONIC FOGGER"
              description="Piezoelectric ultrasonic mist generator balancing vapor pressure deficit (VPD) during peak daytime heat."
              icon={<CloudRain className="w-4 h-4" />}
              currentState={telemetry.water.humidifierState}
              onToggle={handleHumidifierToggle}
              runningStatusText="MISTING (ON)"
              stoppedStatusText="STANDBY (OFF)"
            />

            <ToggleControl
              label="Supplemental Farm Lighting"
              channel="N02 RELAY CH-04 • FULL-SPECTRUM LED"
              description="High-efficiency full-spectrum horticulture grow arrays extending photosynthetic active radiation (PAR)."
              icon={<Sun className="w-4 h-4" />}
              currentState={telemetry.water.lightingState}
              onToggle={handleLightingToggle}
              runningStatusText="LAMPS ON"
              stoppedStatusText="LAMPS OFF"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

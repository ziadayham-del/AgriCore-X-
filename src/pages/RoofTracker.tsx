import React, { useState } from 'react';
import { useTelemetry } from '../hooks/useTelemetry';
import { useToast } from '../components/common/Toast';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  openRoof,
  closeRoof,
  stopRoof,
  moveTrackerLeft,
  moveTrackerRight,
  moveTrackerUp,
  moveTrackerDown,
  centerTracker,
} from '../api/roofApi';
import {
  Home as RoofIcon,
  CloudRain,
  RotateCw,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Sun,
  ShieldAlert,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Crosshair,
  OctagonAlert,
} from 'lucide-react';

export const RoofTracker: React.FC = () => {
  const { roof, tracker } = useTelemetry();
  const { showToast } = useToast();
  const [moving, setMoving] = useState(false);

  const handleOpenRoof = async () => {
    setMoving(true);
    showToast('info', 'Command Dispatched', 'N04 Motor Driver: Opening greenhouse roof...');
    try {
      const res = await openRoof();
      if (res.success) {
        showToast('success', 'Roof Opened', 'Roof opened to positive mechanical limit switch.');
      } else {
        showToast('error', 'Safety Interlock Blocked', res.error);
      }
    } finally {
      setMoving(false);
    }
  };

  const handleCloseRoof = async () => {
    setMoving(true);
    showToast('info', 'Command Dispatched', 'N04 Motor Driver: Closing greenhouse roof...');
    try {
      const res = await closeRoof();
      if (res.success) {
        showToast('success', 'Roof Closed', 'Roof closed securely to endstop limit switch.');
      } else {
        showToast('error', 'Safety Interlock Blocked', res.error);
      }
    } finally {
      setMoving(false);
    }
  };

  const handleStopRoof = async () => {
    await stopRoof();
    showToast('warning', 'Roof Stopped', 'Emergency stop: N20 motor driver power cut.');
  };

  const handleTrackerNudge = async (dir: 'left' | 'right' | 'up' | 'down') => {
    if (dir === 'left') await moveTrackerLeft();
    if (dir === 'right') await moveTrackerRight();
    if (dir === 'up') await moveTrackerUp();
    if (dir === 'down') await moveTrackerDown();
  };

  const handleCenterTracker = async () => {
    showToast('info', 'Centering Tracker', 'Returning dual-axis servos to solar noon baseline...');
    await centerTracker();
    showToast('success', 'Tracker Calibrated', 'Oriented to 90° azimuth, 45° zenith.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-800 text-white font-mono text-xs font-bold">
              NODE N04
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              Automated Roof & Dual-Axis Solar Tracker
            </h1>
          </div>
          <p className="text-sm text-stone-500 mt-1">
            N20 geared motor roof actuator with mechanical limit switches & quadrant LDR sun-tracking servos
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-white px-3 py-1.5 rounded-lg border border-stone-200">
          <span className="text-stone-400">Node N04 Bus:</span>
          <span className="text-emerald-700 font-bold">Limit Switches Engaged OK</span>
        </div>
      </div>

      {/* Automated Roof Subsystem */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Actuated Greenhouse Canopy
            </span>
            <h3 className="text-lg font-bold text-stone-900 mt-0.5">
              Automated Protective Roof Control
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge
              status={roof.state}
              variant={roof.state === 'OPEN' || roof.state === 'OPENING' ? 'running' : 'stopped'}
              pulse={roof.state === 'OPENING' || roof.state === 'CLOSING'}
            />
          </div>
        </div>

        {/* Limit Switches & Rain Safety Interlock Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Limit Switch Open */}
          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-stone-800">Limit Switch: OPEN</div>
              <div className="text-[10px] text-stone-400 font-mono">Endstop 1 (Microswitch)</div>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                roof.limitSwitchOpen
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-stone-200/70 text-stone-500'
              }`}
            >
              {roof.limitSwitchOpen ? 'ENGAGED' : 'OPEN'}
            </span>
          </div>

          {/* Limit Switch Closed */}
          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-stone-800">Limit Switch: CLOSED</div>
              <div className="text-[10px] text-stone-400 font-mono">Endstop 2 (Microswitch)</div>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                roof.limitSwitchClosed
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-stone-200/70 text-stone-500'
              }`}
            >
              {roof.limitSwitchClosed ? 'ENGAGED' : 'OPEN'}
            </span>
          </div>

          {/* Rain Sensor Interlock */}
          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CloudRain className={`w-4 h-4 ${roof.rainDetected ? 'text-rose-600' : 'text-sky-600'}`} />
              <div>
                <div className="text-xs font-bold text-stone-800">Rain Interlock</div>
                <div className="text-[10px] text-stone-400 font-mono">Auto-Close Policy Active</div>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                roof.rainDetected
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {roof.rainDetected ? 'RAIN: LOCK' : 'DRY: CLEAR'}
            </span>
          </div>
        </div>

        {/* Safety Interlock Enforced Movement Controls */}
        <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center gap-3">
          <button
            onClick={handleOpenRoof}
            disabled={moving || roof.limitSwitchOpen || (roof.rainDetected && roof.autoCloseOnRain)}
            className="flex-1 min-w-[140px] py-2.5 px-4 text-xs font-bold rounded-lg bg-emerald-800 hover:bg-emerald-900 disabled:opacity-40 disabled:pointer-events-none text-white shadow-xs transition-all active:scale-[0.98]"
          >
            {roof.limitSwitchOpen ? 'Already Open (Limit Met)' : 'Open Roof Canopy'}
          </button>

          <button
            onClick={handleCloseRoof}
            disabled={moving || roof.limitSwitchClosed}
            className="flex-1 min-w-[140px] py-2.5 px-4 text-xs font-bold rounded-lg bg-stone-800 hover:bg-stone-900 disabled:opacity-40 disabled:pointer-events-none text-white shadow-xs transition-all active:scale-[0.98]"
          >
            {roof.limitSwitchClosed ? 'Already Closed (Limit Met)' : 'Close Roof Canopy'}
          </button>

          <button
            onClick={handleStopRoof}
            className="py-2.5 px-5 text-xs font-bold rounded-lg bg-rose-700 hover:bg-rose-800 text-white shadow-xs flex items-center gap-1.5 transition-all active:scale-[0.98]"
          >
            <OctagonAlert className="w-4 h-4" />
            <span>Emergency Stop</span>
          </button>
        </div>
      </div>

      {/* Solar Tracker Subsystem */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Quadrant Photodiode Tracking
            </span>
            <h3 className="text-lg font-bold text-stone-900 mt-0.5">
              Dual-Axis Solar Tracker Positioner
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-amber-50 text-amber-900 border border-amber-200">
              Mode: {tracker.mode}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tracker Visual Graphical Display */}
          <div className="p-5 rounded-xl bg-stone-50 border border-stone-200 flex flex-col items-center justify-center text-center">
            <div className="relative w-40 h-40 flex items-center justify-center">
              {/* Compass circle */}
              <div className="absolute inset-0 rounded-full border-2 border-stone-300" />
              <div className="absolute top-1 text-[10px] font-mono text-stone-400">N (0°)</div>
              <div className="absolute bottom-1 text-[10px] font-mono text-stone-400">S (180°)</div>
              <div className="absolute left-1 text-[10px] font-mono text-stone-400">W</div>
              <div className="absolute right-1 text-[10px] font-mono text-stone-400">E</div>

              {/* Rotatable Solar Panel Symbol */}
              <div
                className="w-24 h-16 bg-amber-500 rounded border-2 border-amber-700 shadow-md flex items-center justify-center text-white font-mono text-[10px] font-bold transition-all duration-500"
                style={{
                  transform: `rotate(${tracker.horizontalAngle - 90}deg) skewX(${tracker.verticalAngle - 45}deg)`,
                }}
              >
                PV ARRAY
              </div>
            </div>

            <div className="mt-4 font-mono text-xs">
              <span className="text-stone-400">Orientation: </span>
              <span className="font-bold text-stone-800">
                Azimuth {tracker.horizontalAngle}° • Elevation {tracker.verticalAngle}°
              </span>
            </div>
          </div>

          {/* 4 Quadrant LDR Sensor Readouts */}
          <div className="p-5 rounded-xl bg-stone-50 border border-stone-200 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-stone-800 mb-3">
                4-Quadrant LDR Array (Node N04 ADC)
              </div>
              <div className="grid grid-cols-2 gap-3 font-mono text-center">
                <div className="p-3 bg-white rounded-lg border border-stone-200">
                  <div className="text-[10px] text-stone-400">Top-Left</div>
                  <div className="text-sm font-bold text-emerald-800 mt-1">
                    {tracker.ldrSensors.topLeft}
                  </div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-stone-200">
                  <div className="text-[10px] text-stone-400">Top-Right</div>
                  <div className="text-sm font-bold text-emerald-800 mt-1">
                    {tracker.ldrSensors.topRight}
                  </div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-stone-200">
                  <div className="text-[10px] text-stone-400">Bottom-Left</div>
                  <div className="text-sm font-bold text-emerald-800 mt-1">
                    {tracker.ldrSensors.bottomLeft}
                  </div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-stone-200">
                  <div className="text-[10px] text-stone-400">Bottom-Right</div>
                  <div className="text-sm font-bold text-emerald-800 mt-1">
                    {tracker.ldrSensors.bottomRight}
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-stone-400 font-mono mt-3">
              Balanced delta differential triggers MG996R high-torque servos
            </div>
          </div>

          {/* Manual Nudge Controls */}
          <div className="p-5 rounded-xl bg-stone-50 border border-stone-200 flex flex-col justify-between items-center">
            <div className="w-full text-xs font-bold text-stone-800 mb-2">
              Manual Servo Nudge
            </div>

            <div className="grid grid-cols-3 gap-2 my-2">
              <div></div>
              <button
                onClick={() => handleTrackerNudge('up')}
                className="w-10 h-10 rounded-lg bg-white hover:bg-stone-100 border border-stone-300 flex items-center justify-center text-stone-700 shadow-2xs"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <div></div>

              <button
                onClick={() => handleTrackerNudge('left')}
                className="w-10 h-10 rounded-lg bg-white hover:bg-stone-100 border border-stone-300 flex items-center justify-center text-stone-700 shadow-2xs"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleCenterTracker}
                title="Center (90° / 45°)"
                className="w-10 h-10 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white flex items-center justify-center shadow-xs"
              >
                <Crosshair className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleTrackerNudge('right')}
                className="w-10 h-10 rounded-lg bg-white hover:bg-stone-100 border border-stone-300 flex items-center justify-center text-stone-700 shadow-2xs"
              >
                <ArrowRight className="w-4 h-4" />
              </button>

              <div></div>
              <button
                onClick={() => handleTrackerNudge('down')}
                className="w-10 h-10 rounded-lg bg-white hover:bg-stone-100 border border-stone-300 flex items-center justify-center text-stone-700 shadow-2xs"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
              <div></div>
            </div>

            <button
              onClick={handleCenterTracker}
              className="w-full mt-3 py-1.5 px-3 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700"
            >
              Resume Auto Sun Tracking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

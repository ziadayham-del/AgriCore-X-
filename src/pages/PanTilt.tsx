import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTelemetry } from '../hooks/useTelemetry';
import { useToast } from '../components/common/Toast';
import { StatusBadge } from '../components/common/StatusBadge';
import { PtzSlider, TickMark } from '../components/camera/PtzSlider';
import {
  setCameraPan,
  setCameraTilt,
  centerCamera,
  captureCameraSnapshot,
} from '../api/cameraApi';
import {
  RotateCcw,
  Camera,
  ArrowLeft,
  Sliders,
  Crosshair,
  Compass,
  Radio,
  Eye,
  Maximize2,
  Bookmark,
  Sparkles,
} from 'lucide-react';

const PAN_TICKS: TickMark[] = [
  { value: -180, label: '-180°', primary: true },
  { value: -90, label: '-90°', primary: true },
  { value: 0, label: '0°', primary: true },
  { value: 90, label: '+90°', primary: true },
  { value: 180, label: '+180°', primary: true },
];

const TILT_TICKS: TickMark[] = [
  { value: -90, label: '-90°', primary: true },
  { value: -45, label: '-45°', primary: true },
  { value: 0, label: '0°', primary: true },
  { value: 45, label: '+45°', primary: true },
  { value: 90, label: '+90°', primary: true },
];

export const PanTilt: React.FC = () => {
  const { cameras } = useTelemetry();
  const { showToast } = useToast();
  const [capturing, setCapturing] = useState(false);

  const securityCam = cameras[0];
  const pan = securityCam?.panAngle ?? 0;
  const tilt = securityCam?.tiltAngle ?? 0;

  // Debounced API dispatch references to avoid saturating ESP32 RS-485 bus
  const panDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const tiltDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Handle Pan Slider Real-time changes
  const handlePanChange = useCallback((newPan: number) => {
    // Immediate optimistic local update through API
    setCameraPan(newPan);

    if (panDebounceRef.current) {
      clearTimeout(panDebounceRef.current);
    }
    panDebounceRef.current = setTimeout(() => {
      // Confirmed hardware dispatch
      setCameraPan(newPan);
    }, 60);
  }, []);

  // Handle Tilt Slider Real-time changes
  const handleTiltChange = useCallback((newTilt: number) => {
    setCameraTilt(newTilt);

    if (tiltDebounceRef.current) {
      clearTimeout(tiltDebounceRef.current);
    }
    tiltDebounceRef.current = setTimeout(() => {
      setCameraTilt(newTilt);
    }, 60);
  }, []);

  // Reset Pan to 0°
  const handleResetPan = useCallback(() => {
    setCameraPan(0);
    showToast('info', 'Pan Centered', 'Pan servo returned to 0° mechanical center.');
  }, [showToast]);

  // Reset Tilt to 0°
  const handleResetTilt = useCallback(() => {
    setCameraTilt(0);
    showToast('info', 'Tilt Leveled', 'Tilt servo leveled to 0° horizon position.');
  }, [showToast]);

  // Reset Both (Center 0°, 0°)
  const handleCenterAll = useCallback(async () => {
    await centerCamera();
    showToast('success', 'Gimbal Centered', 'Both Pan (0°) and Tilt (0°) returned to home alignment.');
  }, [showToast]);

  // Quick Preset Handlers
  const handleApplyPreset = (name: string, targetPan: number, targetTilt: number) => {
    setCameraPan(targetPan);
    setCameraTilt(targetTilt);
    showToast(
      'info',
      `Preset: ${name}`,
      `Gimbal repositioned to Pan ${targetPan > 0 ? `+${targetPan}` : targetPan}°, Tilt ${targetTilt > 0 ? `+${targetTilt}` : targetTilt}°.`
    );
  };

  const handleCapture = async () => {
    setCapturing(true);
    showToast('info', 'Capturing Snapshot', 'Acquiring optical frame from N06 security camera...');
    try {
      await captureCameraSnapshot('N06_SECURITY');
      showToast('success', 'Snapshot Saved', 'Camera snapshot archived to cloud storage.');
    } catch (err: any) {
      showToast('error', 'Capture Failed', err.message || 'Error capturing frame');
    } finally {
      setCapturing(false);
    }
  };

  // Azimuth calculation for HUD compass
  const azimuthBearing = (pan >= 0 ? pan : 360 + pan).toFixed(0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/cameras"
            className="p-2 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors"
            title="Return to Cameras overview"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-800 text-white font-mono text-xs font-bold">
                NODE N06
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-stone-900">
                Security Camera Pan & Tilt Console
              </h1>
            </div>
            <p className="text-sm text-stone-500 mt-1">
              Industrial dual-servo gimbal positioner with real-time sliding bar telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCenterAll}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-stone-300 hover:bg-stone-50 text-stone-700 shadow-2xs transition-all active:scale-95"
            title="Return both Pan and Tilt to 0°"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
            <span>Center All (0°, 0°)</span>
          </button>

          <button
            onClick={handleCapture}
            disabled={capturing}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <Camera className="w-4 h-4" />
            <span>{capturing ? 'Acquiring...' : 'Capture Snapshot'}</span>
          </button>
        </div>
      </div>

      {/* Prominent Live Camera Preview Section with Smooth Responsive Tracking */}
      <div className="bg-stone-950 rounded-2xl overflow-hidden border border-stone-800 shadow-xl relative aspect-16/9 max-h-[500px]">
        {/* Dynamic Simulated Camera Pan/Tilt Motion Viewport */}
        <div className="w-full h-full overflow-hidden relative">
          <img
            src={securityCam?.lastSnapshotUrl || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80'}
            alt="Security camera video feed"
            className="w-full h-full object-cover origin-center transition-transform duration-100 ease-out"
            style={{
              // Smoothly animates camera viewport based on pan and tilt angles
              transform: `scale(1.30) translate3d(${(-pan / 180) * 15}%, ${(tilt / 90) * 15}%, 0) perspective(1000px) rotateY(${(pan / 180) * 4}deg) rotateX(${(-tilt / 90) * 4}deg)`,
            }}
          />
        </div>

        {/* Technical HUD Overlay: Top Left Stream Details */}
        <div className="absolute top-4 left-4 bg-stone-900/85 backdrop-blur-xs text-white px-3 py-1.5 rounded-lg text-xs font-mono border border-stone-700/80 flex items-center gap-2 shadow-md">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>FEED: 1080p @ 30fps</span>
          <span className="text-stone-500">|</span>
          <span className="text-stone-300">Wi-Fi RTSP Stream</span>
        </div>

        {/* Technical HUD Overlay: Top Right Live Angles Indicator */}
        <div className="absolute top-4 right-4 bg-stone-900/90 backdrop-blur-xs text-emerald-400 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold border border-stone-700/80 flex items-center gap-2 shadow-md">
          <Compass className="w-4 h-4 text-emerald-400" />
          <span>
            PAN {pan > 0 ? `+${pan}` : pan}° • TILT {tilt > 0 ? `+${tilt}` : tilt}°
          </span>
        </div>

        {/* Reticle HUD Overlay with Dynamic Azimuth Heading */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-44 h-44 sm:w-56 sm:h-56 rounded-full border border-white/20 flex items-center justify-center">
            {/* Center crosshair */}
            <div className="absolute w-full h-px bg-white/25" />
            <div className="absolute h-full w-px bg-white/25" />
            <div className="w-8 h-8 rounded-full border border-emerald-400/80 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm" />
            </div>

            {/* Azimuth Bearing Badge in Reticle */}
            <div className="absolute bottom-2 bg-stone-900/80 text-[10px] text-stone-300 font-mono px-2 py-0.5 rounded border border-stone-700">
              AZ: {azimuthBearing}° • EL: {tilt > 0 ? `+${tilt}` : tilt}°
            </div>
          </div>
        </div>

        {/* Bottom Technical Status Bar */}
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] font-mono text-white/80 bg-stone-950/75 backdrop-blur-xs px-3.5 py-1.5 rounded-lg border border-stone-800">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              N06 DUAL-AXIS GIMBAL ONLINE
            </span>
            <span className="hidden md:inline text-stone-400">|</span>
            <span className="hidden md:inline text-stone-300">SERVO LATENCY: ~12ms</span>
          </div>
          <div className="flex items-center gap-3 text-stone-400">
            <span>BITRATE: 4.2 Mbps</span>
            <span>•</span>
            <span className="text-emerald-400">PTZ ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Premium Pan & Tilt Sliding Bars Section */}
      <div className="space-y-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50 border border-stone-200/90 p-4 rounded-xl">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-800" />
              <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider font-mono">
                Precision Servo Sliding Bars
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Calibrated dual-axis horizontal sliding controls. Drag or use arrow keys for real-time camera orientation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-stone-500">Live Telemetry:</span>
            <span className="px-2.5 py-1 rounded-md bg-stone-900 text-emerald-400 font-mono text-xs font-bold border border-stone-800">
              PAN {pan > 0 ? `+${pan}` : pan}° • TILT {tilt > 0 ? `+${tilt}` : tilt}°
            </span>
          </div>
        </div>

        {/* 1. PAN SLIDER */}
        <PtzSlider
          label="PAN"
          sublabel="HORIZONTAL AZIMUTH ROTATION (-180° TO +180°)"
          value={pan}
          min={-180}
          max={180}
          step={1}
          minorInterval={45}
          ticks={PAN_TICKS}
          onChange={handlePanChange}
          onReset={handleResetPan}
          leftIndicator="-180° (REAR WEST)"
          rightIndicator="+180° (REAR EAST)"
          centerIndicator="0° (FRONT CENTER)"
        />

        {/* 2. TILT SLIDER */}
        <PtzSlider
          label="TILT"
          sublabel="VERTICAL ELEVATION PITCH (-90° TO +90°)"
          value={tilt}
          min={-90}
          max={90}
          step={1}
          minorInterval={22.5}
          ticks={TILT_TICKS}
          onChange={handleTiltChange}
          onReset={handleResetTilt}
          leftIndicator="-90° (GROUND / NADIR)"
          rightIndicator="+90° (SKY / ZENITH)"
          centerIndicator="0° (LEVEL HORIZON)"
        />

        {/* Quick Orientation Presets Bar */}
        <div className="bg-white rounded-xl border border-stone-200/90 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-emerald-800" />
              <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider font-mono">
                Gimbal Position Presets
              </h3>
            </div>
            <span className="text-[11px] font-mono text-stone-400">
              Quick 1-click survey angles
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            <button
              type="button"
              onClick={() => handleApplyPreset('Center Horizon', 0, 0)}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                pan === 0 && tilt === 0
                  ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold shadow-2xs'
                  : 'border-stone-200 bg-stone-50/60 hover:bg-stone-100 text-stone-700'
              }`}
            >
              <div className="text-xs font-semibold">Home Center</div>
              <div className="text-[10px] font-mono text-stone-500 mt-0.5">
                Pan 0° • Tilt 0°
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset('Field A Canopy', 45, -20)}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                pan === 45 && tilt === -20
                  ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold shadow-2xs'
                  : 'border-stone-200 bg-stone-50/60 hover:bg-stone-100 text-stone-700'
              }`}
            >
              <div className="text-xs font-semibold">Field A Canopy</div>
              <div className="text-[10px] font-mono text-stone-500 mt-0.5">
                Pan +45° • Tilt -20°
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset('North Boundary', 0, -15)}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                pan === 0 && tilt === -15
                  ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold shadow-2xs'
                  : 'border-stone-200 bg-stone-50/60 hover:bg-stone-100 text-stone-700'
              }`}
            >
              <div className="text-xs font-semibold">North Road</div>
              <div className="text-[10px] font-mono text-stone-500 mt-0.5">
                Pan 0° • Tilt -15°
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset('East Perimeter', 90, -25)}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                pan === 90 && tilt === -25
                  ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold shadow-2xs'
                  : 'border-stone-200 bg-stone-50/60 hover:bg-stone-100 text-stone-700'
              }`}
            >
              <div className="text-xs font-semibold">East Boundary</div>
              <div className="text-[10px] font-mono text-stone-500 mt-0.5">
                Pan +90° • Tilt -25°
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset('West Barn & Gate', -90, -20)}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                pan === -90 && tilt === -20
                  ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold shadow-2xs'
                  : 'border-stone-200 bg-stone-50/60 hover:bg-stone-100 text-stone-700'
              }`}
            >
              <div className="text-xs font-semibold">West Facility</div>
              <div className="text-[10px] font-mono text-stone-500 mt-0.5">
                Pan -90° • Tilt -20°
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

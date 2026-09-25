import React from 'react';
import { Link } from 'react-router-dom';
import { useTelemetry } from '../hooks/useTelemetry';
import { useToast } from '../components/common/Toast';
import { StatusBadge } from '../components/common/StatusBadge';
import { captureCameraSnapshot } from '../api/cameraApi';
import {
  Camera,
  Sliders,
  Maximize2,
  RefreshCw,
  Video,
  Radio,
  Clock,
  ArrowRight,
} from 'lucide-react';

export const Cameras: React.FC = () => {
  const { cameras } = useTelemetry();
  const { showToast } = useToast();

  const securityCam = cameras[0];
  const cropCam = cameras[1];

  const handleSnapshot = async (id: 'N06_SECURITY' | 'N07_CROP') => {
    showToast('info', 'Triggering Snapshot', `Requesting frame capture from ${id}...`);
    try {
      await captureCameraSnapshot(id);
      showToast('success', 'Snapshot Captured', `Frame successfully stored from ${id}.`);
    } catch (err: any) {
      showToast('error', 'Capture Error', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-800 text-white font-mono text-xs font-bold">
              NODE N06 & N07
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              Farm Cameras & Surveillance Hub
            </h1>
          </div>
          <p className="text-sm text-stone-500 mt-1">
            Dedicated IP video streams over Wi-Fi/LAN with RS-485 servo pan/tilt control
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/cameras/security/pan-tilt"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs transition-all active:scale-[0.98]"
          >
            <Sliders className="w-4 h-4" />
            <span>Open Pan/Tilt Controller</span>
          </Link>
        </div>
      </div>

      {/* High-bandwidth Architecture Notice (Page 3 of System Design Document) */}
      <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 text-xs text-stone-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-800 shrink-0" />
          <span>
            <strong>Bandwidth Isolation Policy:</strong> IP video streams transport over Wi-Fi / LAN. RS-485 bus carries command/status telemetry only.
          </span>
        </div>
        <span className="font-mono text-emerald-800 font-bold hidden sm:inline">
          RTSP / WebRTC Ready
        </span>
      </div>

      {/* Dual Camera Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* N06 Security Camera */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-stone-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs bg-stone-100 px-1.5 py-0.5 rounded">
                    N06
                  </span>
                  <h3 className="font-bold text-stone-900 text-sm">{securityCam.name}</h3>
                </div>
                <div className="text-[11px] text-stone-400 font-mono mt-0.5">
                  IP: {securityCam.ipAddress} • Dual-Axis Servo Gimbal
                </div>
              </div>

              <StatusBadge
                status={securityCam.online ? 'ONLINE' : 'OFFLINE'}
                variant={securityCam.online ? 'online' : 'offline'}
                size="sm"
                pulse={securityCam.online}
              />
            </div>

            {/* Video Preview Frame */}
            <div className="relative aspect-16/10 bg-stone-950 overflow-hidden">
              <img
                src={securityCam.lastSnapshotUrl}
                alt="Security camera preview"
                className="w-full h-full object-cover opacity-90"
              />
              <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-xs text-white px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>LIVE FEED</span>
              </div>

              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-mono bg-stone-900/70 backdrop-blur-xs px-3 py-1.5 rounded-lg">
                <span>Pan: {(securityCam.panAngle ?? 0) > 0 ? `+${securityCam.panAngle}` : securityCam.panAngle ?? 0}°</span>
                <span>Tilt: {(securityCam.tiltAngle ?? 0) > 0 ? `+${securityCam.tiltAngle}` : securityCam.tiltAngle ?? 0}°</span>
                <span>PIR: Motion Clear</span>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between">
            <button
              onClick={() => handleSnapshot('N06_SECURITY')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold shadow-xs"
            >
              <Camera className="w-3.5 h-3.5 text-stone-500" />
              <span>Capture Snapshot</span>
            </button>

            <Link
              to="/cameras/security/pan-tilt"
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-950"
            >
              <span>Servo Directional Control</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* N07 Crop Time-Lapse Camera */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-stone-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs bg-stone-100 px-1.5 py-0.5 rounded">
                    N07
                  </span>
                  <h3 className="font-bold text-stone-900 text-sm">{cropCam.name}</h3>
                </div>
                <div className="text-[11px] text-stone-400 font-mono mt-0.5">
                  IP: {cropCam.ipAddress} • Fixed Macro Framing Mount
                </div>
              </div>

              <StatusBadge
                status={cropCam.online ? 'ONLINE' : 'OFFLINE'}
                variant={cropCam.online ? 'online' : 'offline'}
                size="sm"
                pulse={cropCam.online}
              />
            </div>

            {/* Video Preview Frame */}
            <div className="relative aspect-16/10 bg-stone-950 overflow-hidden">
              <img
                src={cropCam.lastSnapshotUrl}
                alt="Crop macro preview"
                className="w-full h-full object-cover opacity-90"
              />
              <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-xs text-white px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>PERIODIC CAPTURE</span>
              </div>

              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-mono bg-stone-900/70 backdrop-blur-xs px-3 py-1.5 rounded-lg">
                <span>Field A (Rice Canopy)</span>
                <span>Interval: 12h</span>
                <span>LED Fill: Auto</span>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between">
            <button
              onClick={() => handleSnapshot('N07_CROP')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold shadow-xs"
            >
              <Camera className="w-3.5 h-3.5 text-stone-500" />
              <span>Capture Growth Frame</span>
            </button>

            <Link
              to="/crops/crop-rice-01/images"
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-950"
            >
              <span>View Time-Lapse Gallery</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

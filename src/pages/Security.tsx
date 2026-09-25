import React from 'react';
import { useTelemetry } from '../hooks/useTelemetry';
import { useToast } from '../components/common/Toast';
import { StatusBadge } from '../components/common/StatusBadge';
import { PowerControlCard } from '../components/common/PowerControlCard';
import { hardwareService } from '../services/hardware';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Bell,
  Eye,
  Radio,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export const Security: React.FC = () => {
  const { security, cameras, events } = useTelemetry();
  const { showToast } = useToast();

  const handleArmToggle = async () => {
    const nextState = security.alarmState === 'ARMED' ? 'DISARMED' : 'ARMED';
    await hardwareService.setAlarmState(nextState);
    showToast(
      nextState === 'ARMED' ? 'success' : 'warning',
      `System ${nextState}`,
      `Perimeter optical beams and PIR motion sensor ${nextState.toLowerCase()}.`
    );
  };

  const handleResetAlarm = async () => {
    await hardwareService.resetAlarm();
    showToast('success', 'Security Reset', 'Perimeter zones cleared and alarm siren silenced.');
  };

  // Filter security events
  const securityEvents = events.filter(
    (e) =>
      e.eventType.includes('MOTION') ||
      e.eventType.includes('PERIMETER') ||
      e.eventType.includes('ALARM') ||
      e.eventType.includes('CAMERA')
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-800 text-white font-mono text-xs font-bold">
              NODE N04 & N06
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              Farm Security & Perimeter Detection
            </h1>
          </div>
          <p className="text-sm text-stone-500 mt-1">
            4 optical laser beam receiver zones, passive infrared motion sensing, and audible alert engine
          </p>
        </div>

        <div className="flex items-center gap-2">
          {security.sirenActive && (
            <button
              onClick={handleResetAlarm}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-rose-700 hover:bg-rose-800 text-white shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Silence Siren & Reset</span>
            </button>
          )}

          <button
            onClick={handleArmToggle}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg shadow-xs transition-all active:scale-[0.98] ${
              security.alarmState === 'ARMED'
                ? 'bg-stone-900 hover:bg-stone-800 text-stone-100'
                : 'bg-emerald-800 hover:bg-emerald-900 text-white'
            }`}
          >
            {security.alarmState === 'ARMED' ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Disarm Perimeter</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4 text-amber-300" />
                <span>Arm System</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Safety Notice (System Design Document requirement) */}
      <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50 text-xs text-stone-600 flex items-center justify-between">
        <span>
          <strong>Detection & Alert Notice:</strong> The optical perimeter system operates as a non-contact intrusion notification and camera trigger network. It is entirely safe and has no electrified components.
        </span>
        <span className="font-mono text-stone-500 text-[11px] hidden md:inline">
          Opto-Isolated Photodiode Array
        </span>
      </div>

      {/* 4 Optical Perimeter Zones */}
      <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Low-Power Optical Beam Transmitters
            </span>
            <h3 className="text-base font-bold text-stone-900 mt-0.5">
              4 Monitored Perimeter Zones
            </h3>
          </div>
          <StatusBadge
            status={security.alarmState}
            variant={security.alarmState === 'ARMED' ? 'active' : 'warning'}
            pulse={security.alarmState === 'ARMED'}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { id: 1, name: 'Zone 1: North Boundary (Road Access)', status: security.perimeterZones.zone1 },
            { id: 2, name: 'Zone 2: East Boundary (Field A)', status: security.perimeterZones.zone2 },
            { id: 3, name: 'Zone 3: South Gate (Reservoir)', status: security.perimeterZones.zone3 },
            { id: 4, name: 'Zone 4: West Barn & Equipment', status: security.perimeterZones.zone4 },
          ].map((z) => {
            const isTriggered = z.status === 'triggered';

            return (
              <div
                key={z.id}
                className={`p-4 rounded-xl border transition-all ${
                  isTriggered
                    ? 'border-rose-400 bg-rose-50/80 shadow-xs ring-2 ring-rose-400/30'
                    : 'border-stone-200 bg-stone-50/50 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-xs text-stone-700">
                    ZONE 0{z.id}
                  </span>
                  <StatusBadge
                    status={isTriggered ? 'TRIGGERED' : 'NORMAL'}
                    variant={isTriggered ? 'fault' : 'online'}
                    size="sm"
                    pulse={isTriggered}
                  />
                </div>
                <div className="text-xs font-semibold text-stone-900 mt-1">{z.name}</div>
                <div className="text-[11px] font-mono text-stone-400 mt-2 flex items-center justify-between">
                  <span>Beam: Intact</span>
                  <span>LDR: Nominal</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PIR Motion & Siren Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* PIR Sensor */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              PIR Motion Sensor
            </span>
            <Eye className="w-5 h-5 text-emerald-800" />
          </div>
          <div className="text-2xl font-mono font-bold text-stone-900 mt-2">
            {security.pirDetected ? 'MOTION DETECTED' : 'STANDBY (CLEAR)'}
          </div>
          <div className="text-xs text-stone-500 mt-1">
            Hardware: HC-SR501 / N04 Input
          </div>
        </div>

        {/* Siren Alert Status */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Acoustic Siren
            </span>
            <Bell className={`w-5 h-5 ${security.sirenActive ? 'text-rose-600 animate-bounce' : 'text-stone-400'}`} />
          </div>
          <div className="text-2xl font-mono font-bold text-stone-900 mt-2">
            {security.sirenActive ? 'ALARM ACTIVE' : 'SILENCED'}
          </div>
          <div className="text-xs text-stone-500 mt-1">
            Output: 12V 110dB Piezo Driver
          </div>
        </div>

        {/* Security Camera N06 Link */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Auto CCTV Target Lock
            </span>
            <Radio className="w-5 h-5 text-emerald-800" />
          </div>
          <div className="text-2xl font-mono font-bold text-stone-900 mt-2">
            ARMED
          </div>
          <div className="text-xs text-stone-500 mt-1">
            Pan/Tilt automatically slews to tripped optical beam
          </div>
        </div>
      </div>

      {/* Security Equipment Power Controls */}
      <div className="bg-white rounded-xl border border-stone-200/90 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 font-mono">
              Hardware Relay & Sounder Drivers
            </span>
            <h3 className="text-base font-bold text-stone-900 mt-0.5">
              Security Power & Alert Controls
            </h3>
          </div>
          <span className="text-xs font-mono text-stone-500 bg-stone-50 px-2.5 py-1 rounded border border-stone-200">
            Node N04 Actuator Bus
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PowerControlCard
            label="Perimeter Intrusion System"
            channel="NODE N04 / N06 • OPTICAL BEAM INTERLOCK"
            description="Arm or disarm the 4 optical laser beam receiver array and automatic CCTV pan/tilt target tracking."
            icon={<Shield className="w-4 h-4" />}
            currentState={security.alarmState === 'ARMED'}
            onToggle={async (target) => {
              const nextState = target ? 'ARMED' : 'DISARMED';
              await hardwareService.setAlarmState(nextState);
              showToast(
                target ? 'success' : 'warning',
                `System ${nextState}`,
                `Perimeter optical beams and PIR motion sensor ${nextState.toLowerCase()}.`
              );
              return { success: true };
            }}
            onLabel="POWER ON"
            offLabel="POWER OFF"
            runningStatusText="ARMED"
            stoppedStatusText="DISARMED"
          />

          <PowerControlCard
            label="Acoustic Piezo Siren"
            channel="N04 RELAY • 12V 110dB SOUNDER"
            description="110-decibel pulsed acoustic intrusion alarm for deterrent broadcast and emergency evacuation warning."
            icon={<Bell className="w-4 h-4" />}
            currentState={security.sirenActive}
            onToggle={async (target) => {
              if (target) {
                await hardwareService.setSiren(true);
                showToast('warning', 'Siren Activated', 'Acoustic siren driver turned ON.');
                return { success: true };
              } else {
                await hardwareService.setSiren(false);
                showToast('success', 'Siren Silenced', 'Acoustic siren silenced and perimeter alarms reset.');
                return { success: true };
              }
            }}
            onLabel="POWER ON"
            offLabel="POWER OFF"
            runningStatusText="SIREN ACTIVE"
            stoppedStatusText="SILENCED"
          />
        </div>
      </div>

      {/* Security Event Timeline */}
      <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-800" />
            <h3 className="font-bold text-base text-stone-900">Security Audit Log</h3>
          </div>
          <span className="text-xs font-mono text-stone-400">RS-485 N04 Packet Stream</span>
        </div>

        <div className="space-y-2">
          {securityEvents.length > 0 ? (
            securityEvents.slice(0, 5).map((evt) => (
              <div
                key={evt.id}
                className="p-3 rounded-lg border border-stone-200 bg-stone-50/60 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <span className="font-mono font-bold text-stone-800">{evt.eventType}</span>
                  <span className="text-stone-600">— {evt.description}</span>
                </div>
                <span className="text-stone-400 font-mono text-[11px]">
                  {new Date(evt.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-xs text-stone-400">
              No security anomalies registered.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

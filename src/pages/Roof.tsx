import React, { useState } from 'react';
import { useTelemetry } from '../hooks/useTelemetry';
import { useToast } from '../components/common/Toast';
import { openRoof, closeRoof, stopRoof } from '../api/roofApi';
import {
  Home as RoofIcon,
  ArrowUp,
  ArrowDown,
  Square,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Activity,
  CheckCircle2,
  CloudRain,
  Cpu,
  RefreshCw,
  X
} from 'lucide-react';
import { RoofState } from '../types';

export const Roof: React.FC = () => {
  const { roof, nodes } = useTelemetry();
  const { showToast } = useToast();

  // Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    action: 'OPEN' | 'CLOSE' | null;
  }>({
    isOpen: false,
    action: null,
  });

  // Local command lifecycle status
  const [commandFeedback, setCommandFeedback] = useState<{
    phase: 'idle' | 'sending' | 'in_motion' | 'confirmed' | 'failed' | 'timeout';
    text: string;
    details?: string;
  }>({
    phase: 'idle',
    text: '',
  });

  const [isProcessing, setIsProcessing] = useState(false);

  // Check N04 node online status
  const n04Node = nodes.find(n => n.nodeId === 'N04');
  const isN04Online = n04Node ? n04Node.online : true;

  // Determine current effective roof state
  const effectiveState: RoofState = !isN04Online
    ? 'OFFLINE'
    : roof.state;

  // Safety interlock check before opening dialog or sending command
  const getSafetyInterlockIssue = (targetAction: 'OPEN' | 'CLOSE'): string | null => {
    if (!isN04Online) {
      return 'Roof controller (Node N04) is OFFLINE. Roof control unavailable. Check roof controller status.';
    }
    if (roof.state === 'FAULT') {
      return `Roof controller is in FAULT state: ${roof.faultReason || 'Mechanical fault active'}. Check roof controller status.`;
    }
    if (roof.state === 'OFFLINE') {
      return 'Roof control unavailable. Check roof controller status.';
    }
    if (roof.limitSwitchOpen && roof.limitSwitchClosed) {
      return 'Limit-switch fault: Both OPEN and CLOSED switches reporting active simultaneously. Check roof controller status.';
    }
    if (targetAction === 'OPEN') {
      if (roof.limitSwitchOpen || roof.state === 'OPEN') {
        return 'Roof is already fully OPEN (limit switch engaged).';
      }
      if (roof.rainDetected && roof.autoCloseOnRain) {
        return 'Rain sensor active: Cannot open roof during precipitation event.';
      }
    }
    if (targetAction === 'CLOSE') {
      if (roof.limitSwitchClosed || roof.state === 'CLOSED') {
        return 'Roof is already fully CLOSED (limit switch engaged).';
      }
    }
    return null;
  };

  const handleOpenClick = () => {
    const issue = getSafetyInterlockIssue('OPEN');
    if (issue) {
      showToast('warning', 'Safety Interlock Engaged', issue);
      setCommandFeedback({
        phase: 'failed',
        text: 'Roof control unavailable',
        details: issue,
      });
      return;
    }
    setConfirmDialog({ isOpen: true, action: 'OPEN' });
  };

  const handleCloseClick = () => {
    const issue = getSafetyInterlockIssue('CLOSE');
    if (issue) {
      showToast('warning', 'Safety Interlock Engaged', issue);
      setCommandFeedback({
        phase: 'failed',
        text: 'Roof control unavailable',
        details: issue,
      });
      return;
    }
    setConfirmDialog({ isOpen: true, action: 'CLOSE' });
  };

  const handleConfirmAction = async () => {
    const action = confirmDialog.action;
    setConfirmDialog({ isOpen: false, action: null });
    if (!action) return;

    setIsProcessing(true);
    setCommandFeedback({
      phase: 'sending',
      text: 'Sending command...',
      details: `Dispatching ${action} packet to Server ESP32 -> Node N04`,
    });

    try {
      if (action === 'OPEN') {
        // Step 1: Sending -> Opening
        const sendTimer = setTimeout(() => {
          setCommandFeedback({
            phase: 'in_motion',
            text: 'Opening...',
            details: 'N20 geared motor driving canopy to mechanical OPEN endstop.',
          });
        }, 500);

        const res = await openRoof();
        clearTimeout(sendTimer);

        if (res.success) {
          setCommandFeedback({
            phase: 'confirmed',
            text: '● OPEN',
            details: 'Limit switch confirmed: Fully opened.',
          });
          showToast('success', 'Roof Opened', 'Positive limit switch confirmed open position.');
        } else {
          setCommandFeedback({
            phase: 'failed',
            text: 'Command failed',
            details: res.error || 'Hardware interlock rejected the command.',
          });
          showToast('error', 'Command Failed', res.error);
        }
      } else if (action === 'CLOSE') {
        const sendTimer = setTimeout(() => {
          setCommandFeedback({
            phase: 'in_motion',
            text: 'Closing...',
            details: 'N20 geared motor driving canopy to mechanical CLOSE endstop.',
          });
        }, 500);

        const res = await closeRoof();
        clearTimeout(sendTimer);

        if (res.success) {
          setCommandFeedback({
            phase: 'confirmed',
            text: '● CLOSED',
            details: 'Limit switch confirmed: Fully closed & sealed.',
          });
          showToast('success', 'Roof Closed', 'Positive limit switch confirmed closed position.');
        } else {
          setCommandFeedback({
            phase: 'failed',
            text: 'Command failed',
            details: res.error || 'Hardware interlock rejected the command.',
          });
          showToast('error', 'Command Failed', res.error);
        }
      }
    } catch {
      setCommandFeedback({
        phase: 'timeout',
        text: 'Command timeout',
        details: 'Server ESP32 did not receive ACK from Node N04 within 4000ms.',
      });
      showToast('error', 'Command Timeout', 'RS-485 bus response timeout from Node N04.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEmergencyStop = async () => {
    setIsProcessing(true);
    try {
      await stopRoof();
      setCommandFeedback({
        phase: 'confirmed',
        text: '● STOPPED',
        details: 'Emergency stop executed: Motor driver isolated.',
      });
      showToast('warning', 'Emergency Stop', 'Roof motor power interrupted.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Format timestamp helper
  const formatTime = (isoString?: string) => {
    if (!isoString) return '--:--:--';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour12: false });
    } catch {
      return '--:--:--';
    }
  };

  // Status visual mapping
  const getStatusColor = (status: RoofState) => {
    switch (status) {
      case 'OPEN':
        return {
          dot: 'bg-emerald-600',
          text: 'text-emerald-900',
          bg: 'bg-emerald-50 border-emerald-200',
        };
      case 'CLOSED':
        return {
          dot: 'bg-stone-500',
          text: 'text-stone-800',
          bg: 'bg-stone-100 border-stone-200',
        };
      case 'OPENING':
      case 'CLOSING':
        return {
          dot: 'bg-amber-500 animate-ping',
          text: 'text-amber-800',
          bg: 'bg-amber-50 border-amber-200',
        };
      case 'STOPPED':
        return {
          dot: 'bg-amber-600',
          text: 'text-amber-900',
          bg: 'bg-amber-50 border-amber-200',
        };
      case 'FAULT':
        return {
          dot: 'bg-rose-600',
          text: 'text-rose-900',
          bg: 'bg-rose-50 border-rose-200',
        };
      case 'OFFLINE':
      default:
        return {
          dot: 'bg-stone-400',
          text: 'text-stone-600',
          bg: 'bg-stone-100 border-stone-200',
        };
    }
  };

  const statusStyle = getStatusColor(effectiveState);
  const hasInterlockActive = effectiveState === 'FAULT' || effectiveState === 'OFFLINE' || (roof.limitSwitchOpen && roof.limitSwitchClosed);

  return (
    <div className="space-y-6">
      {/* Confirmation Dialog Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <RoofIcon className="w-5 h-5 text-emerald-800" />
                <h3 className="font-bold text-stone-900 text-base">
                  {confirmDialog.action === 'OPEN' ? 'Open roof?' : 'Close roof?'}
                </h3>
              </div>
              <button
                onClick={() => setConfirmDialog({ isOpen: false, action: null })}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200/80 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 font-medium">Current status:</span>
                  <span className="font-mono font-bold text-stone-900 bg-white px-2 py-0.5 rounded border border-stone-200">
                    {effectiveState}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 font-medium">Requested action:</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                    confirmDialog.action === 'OPEN'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-stone-200 text-stone-800'
                  }`}>
                    {confirmDialog.action}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 font-medium">Target Node:</span>
                  <span className="font-mono text-stone-700">N04 ESP32-WROOM-32UE</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  Physical moving mechanism. Confirm the greenhouse canopy path is unobstructed before proceeding.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog({ isOpen: false, action: null })}
                className="px-4 py-2 text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className={`px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-xs transition-colors flex items-center gap-1.5 ${
                  confirmDialog.action === 'OPEN'
                    ? 'bg-emerald-800 hover:bg-emerald-900'
                    : 'bg-stone-800 hover:bg-stone-900'
                }`}
              >
                {confirmDialog.action === 'OPEN' ? (
                  <>
                    <ArrowUp className="w-3.5 h-3.5" />
                    <span>Open Roof</span>
                  </>
                ) : (
                  <>
                    <ArrowDown className="w-3.5 h-3.5" />
                    <span>Close Roof</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-800 text-white font-mono text-xs font-bold shadow-xs">
              NODE N04
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              Roof Control
            </h1>
          </div>
          <p className="text-sm text-stone-500 mt-1">
            Manual greenhouse roof canopy motor actuation with positive limit-switch feedback
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-xs font-mono text-stone-600">
            <Cpu className="w-3.5 h-3.5 text-emerald-800" />
            <span>N04 ESP32 • RS-485</span>
          </div>
        </div>
      </div>

      {/* Safety Interlock Banner if Fault or Offline */}
      {hasInterlockActive && (
        <div className="p-4 rounded-xl border border-rose-300 bg-rose-50 text-rose-900 flex items-start gap-3 shadow-xs">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-bold text-rose-950">Roof control unavailable</div>
            <div className="text-xs text-rose-800 mt-0.5">
              Check roof controller status. Physical hardware interlocks are actively disallowing motor drive commands.
            </div>
          </div>
        </div>
      )}

      {/* Rain Interlock Notification */}
      {roof.rainDetected && roof.autoCloseOnRain && (
        <div className="p-3.5 rounded-xl border border-sky-200 bg-sky-50 text-sky-900 flex items-center gap-2.5 text-xs">
          <CloudRain className="w-4 h-4 text-sky-700 shrink-0" />
          <span>
            <strong>Precipitation Sensor Active:</strong> Rain protective lockout engaged. Roof will remain sealed to protect crops.
          </span>
        </div>
      )}

      {/* Main Premium Card: ROOF CONTROL */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-stone-100">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Actuator Unit
            </div>
            <h2 className="text-xl font-bold text-stone-900 mt-0.5">
              ROOF CONTROL
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Industrial N20 DC gear motor • Bi-directional relay H-bridge
            </p>
          </div>

          {/* Prominent ROOF STATUS Box */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 bg-stone-50/80 p-4 rounded-xl border border-stone-200">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                ROOF STATUS
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-3 h-3 rounded-full ${statusStyle.dot}`} />
                <span className={`text-base font-bold font-mono tracking-wide ${statusStyle.text}`}>
                  {effectiveState}
                </span>
              </div>
            </div>

            <div className="sm:border-l sm:border-stone-200 sm:pl-6 text-xs font-mono text-stone-500">
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Last updated:
              </div>
              <div className="flex items-center gap-1.5 text-stone-800 font-semibold mt-1">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                <span>{formatTime(roof.lastUpdate)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Command Feedback Strip */}
        {commandFeedback.text && (
          <div className={`mt-6 p-3.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
            commandFeedback.phase === 'sending' || commandFeedback.phase === 'in_motion'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : commandFeedback.phase === 'confirmed'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            <div className="flex items-center gap-2.5">
              {commandFeedback.phase === 'sending' || commandFeedback.phase === 'in_motion' ? (
                <RefreshCw className="w-4 h-4 animate-spin text-amber-700" />
              ) : commandFeedback.phase === 'confirmed' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-700" />
              )}
              <div>
                <span className="font-bold">{commandFeedback.text}</span>
                {commandFeedback.details && (
                  <span className="text-stone-600 ml-2">({commandFeedback.details})</span>
                )}
              </div>
            </div>
            <button
              onClick={() => setCommandFeedback({ phase: 'idle', text: '' })}
              className="text-stone-400 hover:text-stone-700 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Control Buttons Grid */}
        <div className="mt-8 space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Manual Controls
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* OPEN ROOF */}
            <button
              type="button"
              onClick={handleOpenClick}
              disabled={
                isProcessing ||
                effectiveState === 'OPEN' ||
                effectiveState === 'OPENING' ||
                effectiveState === 'CLOSING' ||
                effectiveState === 'FAULT' ||
                effectiveState === 'OFFLINE' ||
                (roof.rainDetected && roof.autoCloseOnRain)
              }
              className="flex items-center justify-center gap-2.5 py-4 px-6 rounded-xl font-bold text-sm bg-emerald-800 text-white hover:bg-emerald-900 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-all"
            >
              <ArrowUp className="w-4 h-4" />
              <span>OPEN ROOF</span>
            </button>

            {/* CLOSE ROOF */}
            <button
              type="button"
              onClick={handleCloseClick}
              disabled={
                isProcessing ||
                effectiveState === 'CLOSED' ||
                effectiveState === 'OPENING' ||
                effectiveState === 'CLOSING' ||
                effectiveState === 'FAULT' ||
                effectiveState === 'OFFLINE'
              }
              className="flex items-center justify-center gap-2.5 py-4 px-6 rounded-xl font-bold text-sm bg-stone-900 text-white hover:bg-stone-800 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-all"
            >
              <ArrowDown className="w-4 h-4" />
              <span>CLOSE ROOF</span>
            </button>

            {/* EMERGENCY STOP */}
            <button
              type="button"
              onClick={handleEmergencyStop}
              disabled={isProcessing}
              className="flex items-center justify-center gap-2.5 py-4 px-6 rounded-xl font-bold text-sm bg-amber-50 border border-amber-300 text-amber-950 hover:bg-amber-100 active:scale-[0.99] disabled:opacity-40 shadow-xs transition-all"
            >
              <Square className="w-4 h-4 fill-amber-700 text-amber-700" />
              <span>STOP</span>
            </button>
          </div>
        </div>

        {/* Closed-Loop Hardware Diagnostic Readouts */}
        <div className="mt-8 pt-6 border-t border-stone-100">
          <div className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">
            Hardware Limit Switches & Diagnostics
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {/* Limit Switch (Closed) */}
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80">
              <div className="text-stone-500 font-medium">Limit Switch (Closed)</div>
              <div className="flex items-center gap-1.5 mt-1 font-mono font-bold">
                <span className={`w-2 h-2 rounded-full ${roof.limitSwitchClosed ? 'bg-emerald-600' : 'bg-stone-300'}`} />
                <span className={roof.limitSwitchClosed ? 'text-emerald-800' : 'text-stone-500'}>
                  {roof.limitSwitchClosed ? 'ENGAGED' : 'INACTIVE'}
                </span>
              </div>
            </div>

            {/* Limit Switch (Open) */}
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80">
              <div className="text-stone-500 font-medium">Limit Switch (Open)</div>
              <div className="flex items-center gap-1.5 mt-1 font-mono font-bold">
                <span className={`w-2 h-2 rounded-full ${roof.limitSwitchOpen ? 'bg-emerald-600' : 'bg-stone-300'}`} />
                <span className={roof.limitSwitchOpen ? 'text-emerald-800' : 'text-stone-500'}>
                  {roof.limitSwitchOpen ? 'ENGAGED' : 'INACTIVE'}
                </span>
              </div>
            </div>

            {/* Motor Drive Current */}
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80">
              <div className="text-stone-500 font-medium">Motor Current</div>
              <div className="flex items-center gap-1.5 mt-1 font-mono font-bold text-stone-900">
                <Activity className="w-3.5 h-3.5 text-stone-400" />
                <span>{roof.motorCurrentMa || 0} mA</span>
              </div>
            </div>

            {/* Rain Protective Interlock */}
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80">
              <div className="text-stone-500 font-medium">Rain Sensor Interlock</div>
              <div className="flex items-center gap-1.5 mt-1 font-mono font-bold">
                <span className={`w-2 h-2 rounded-full ${roof.rainDetected ? 'bg-sky-500' : 'bg-emerald-600'}`} />
                <span className={roof.rainDetected ? 'text-sky-800' : 'text-emerald-800'}>
                  {roof.rainDetected ? 'RAIN DETECTED' : 'DRY (CLEAR)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

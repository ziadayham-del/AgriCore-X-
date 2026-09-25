import React, { useState } from 'react';
import { Power, Loader2, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

export interface PowerControlCardProps {
  label: string;
  description?: string;
  channel?: string;
  currentState: boolean;
  onToggle: (nextState: boolean) => Promise<{ success: boolean; error?: string; reason?: string }>;
  icon?: React.ReactNode;
  disabled?: boolean;
  warningNote?: string;
  onLabel?: string;
  offLabel?: string;
  runningStatusText?: string;
  stoppedStatusText?: string;
  className?: string;
}

export const PowerControlCard: React.FC<PowerControlCardProps> = ({
  label,
  description,
  channel,
  currentState,
  onToggle,
  icon,
  disabled = false,
  warningNote,
  onLabel = 'POWER ON',
  offLabel = 'POWER OFF',
  runningStatusText = 'RUNNING',
  stoppedStatusText = 'STANDBY',
  className = '',
}) => {
  const [commandState, setCommandState] = useState<'idle' | 'sending' | 'acknowledged' | 'failed'>('idle');
  const [targetAction, setTargetAction] = useState<'on' | 'off' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCommand = async (target: boolean) => {
    if (disabled || commandState === 'sending' || target === currentState) return;

    const action = target ? 'on' : 'off';
    setTargetAction(action);
    setCommandState('sending');
    setErrorMessage(null);

    try {
      const res = await onToggle(target);
      if (res.success) {
        setCommandState('acknowledged');
        // Brief visual hold on 'Command acknowledged' then return to idle
        setTimeout(() => {
          setCommandState('idle');
          setTargetAction(null);
        }, 1100);
      } else {
        setCommandState('failed');
        setErrorMessage(res.error || res.reason || 'Device state not confirmed by Server ESP32');
        setTimeout(() => {
          setCommandState('idle');
          setTargetAction(null);
        }, 4500);
      }
    } catch (err: any) {
      setCommandState('failed');
      setErrorMessage(err.message || 'Network error communicating with Node RS-485 controller');
      setTimeout(() => {
        setCommandState('idle');
        setTargetAction(null);
      }, 4500);
    }
  };

  const isPowerOnActive = (currentState && commandState !== 'sending') || (commandState === 'acknowledged' && targetAction === 'on');
  const isPowerOffActive = (!currentState && commandState !== 'sending') || (commandState === 'acknowledged' && targetAction === 'off');

  return (
    <div className={`bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs flex flex-col justify-between transition-all hover:border-stone-300 hover:shadow-sm ${className}`}>
      <div>
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-start gap-3">
            {icon && (
              <div className="p-2 rounded-xl bg-stone-100/80 text-emerald-800 border border-stone-200/60 shrink-0">
                {icon}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-stone-900 tracking-tight font-sans">
                  {label}
                </h4>
              </div>
              {channel && (
                <div className="text-[10px] font-mono text-stone-400 font-medium mt-0.5">
                  {channel}
                </div>
              )}
            </div>
          </div>

          {/* Physical Device Status Badge */}
          <div className="shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold tracking-tight border transition-colors ${
                currentState
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                  : 'bg-stone-100 text-stone-600 border-stone-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  currentState ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'
                }`}
              />
              <span>{currentState ? runningStatusText : stoppedStatusText}</span>
            </span>
          </div>
        </div>

        {/* Technical Description */}
        {description && (
          <p className="text-xs text-stone-500 leading-relaxed mb-3 mt-1 font-sans">
            {description}
          </p>
        )}

        {/* Safety Warning Interlock Note */}
        {warningNote && (
          <div className="mb-3 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/90 text-[11px] text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span className="leading-snug">{warningNote}</span>
          </div>
        )}
      </div>

      <div>
        {/* Real-time Status / Command State Indicator */}
        <div className="flex items-center justify-between text-xs font-mono py-1.5 px-3 rounded-lg bg-stone-50 border border-stone-200/70 mb-3">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
            Power Control:
          </span>

          <span className="font-bold">
            {commandState === 'sending' ? (
              <span className="text-amber-700 flex items-center gap-1.5 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Sending command...</span>
              </span>
            ) : commandState === 'acknowledged' ? (
              <span className="text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Command acknowledged</span>
              </span>
            ) : commandState === 'failed' ? (
              <span className="text-rose-700 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Command failed</span>
              </span>
            ) : currentState ? (
              <span className="text-emerald-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs animate-pulse" />
                <span>● POWER ON</span>
              </span>
            ) : (
              <span className="text-rose-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 shadow-xs" />
                <span>● POWER OFF</span>
              </span>
            )}
          </span>
        </div>

        {/* The Two Power-State Control Buttons: GREEN POWER ON & RED POWER OFF */}
        <div className="grid grid-cols-2 gap-3">
          {/* GREEN POWER ON BUTTON */}
          <button
            type="button"
            disabled={disabled || commandState === 'sending' || isPowerOnActive}
            onClick={() => handleCommand(true)}
            title={`Switch ${label} to POWER ON`}
            className={`group relative flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold font-mono tracking-wider transition-all duration-200 select-none min-h-[44px] ${
              isPowerOnActive
                ? 'bg-emerald-600 text-white border border-emerald-700 shadow-md shadow-emerald-600/25 ring-2 ring-emerald-500/25 cursor-default'
                : 'bg-stone-50 hover:bg-emerald-50/70 text-stone-600 hover:text-emerald-900 border border-stone-200 hover:border-emerald-300 hover:shadow-xs active:scale-[0.98]'
            } ${disabled || (commandState === 'sending' && targetAction !== 'on') ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            {commandState === 'sending' && targetAction === 'on' ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-700 shrink-0" />
            ) : (
              <Power
                className={`w-4 h-4 shrink-0 transition-transform ${
                  isPowerOnActive
                    ? 'text-white'
                    : 'text-stone-400 group-hover:text-emerald-600 group-hover:scale-110'
                }`}
              />
            )}
            <span>
              {commandState === 'sending' && targetAction === 'on'
                ? 'SENDING...'
                : onLabel}
            </span>
          </button>

          {/* RED POWER OFF BUTTON */}
          <button
            type="button"
            disabled={disabled || commandState === 'sending' || isPowerOffActive}
            onClick={() => handleCommand(false)}
            title={`Switch ${label} to POWER OFF`}
            className={`group relative flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold font-mono tracking-wider transition-all duration-200 select-none min-h-[44px] ${
              isPowerOffActive
                ? 'bg-rose-600 text-white border border-rose-700 shadow-md shadow-rose-600/25 ring-2 ring-rose-500/25 cursor-default'
                : 'bg-stone-50 hover:bg-rose-50/70 text-stone-600 hover:text-rose-900 border border-stone-200 hover:border-rose-300 hover:shadow-xs active:scale-[0.98]'
            } ${disabled || (commandState === 'sending' && targetAction !== 'off') ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            {commandState === 'sending' && targetAction === 'off' ? (
              <Loader2 className="w-4 h-4 animate-spin text-rose-700 shrink-0" />
            ) : (
              <Power
                className={`w-4 h-4 shrink-0 transition-transform ${
                  isPowerOffActive
                    ? 'text-white'
                    : 'text-stone-400 group-hover:text-rose-600 group-hover:scale-110'
                }`}
              />
            )}
            <span>
              {commandState === 'sending' && targetAction === 'off'
                ? 'SENDING...'
                : offLabel}
            </span>
          </button>
        </div>

        {/* Error / Command Failed Callout */}
        {commandState === 'failed' && (
          <div className="mt-2.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2 animate-in fade-in zoom-in-95">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-[11px] font-mono">
                Command failed • Device state not confirmed
              </div>
              {errorMessage && (
                <div className="text-[10px] text-rose-600 mt-0.5">
                  {errorMessage}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

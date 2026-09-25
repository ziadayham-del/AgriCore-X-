import React, { useState } from 'react';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { CommandStatus } from '../../types';

interface CommandButtonProps {
  label: string;
  active?: boolean;
  variant?: 'primary' | 'danger' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  disabled?: boolean;
  onExecute: () => Promise<{ success: boolean; error?: string }>;
  confirmPrompt?: string;
  className?: string;
}

export const CommandButton: React.FC<CommandButtonProps> = ({
  label,
  active = false,
  variant = 'primary',
  size = 'md',
  icon,
  disabled = false,
  onExecute,
  confirmPrompt,
  className = '',
}) => {
  const [status, setStatus] = useState<CommandStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClick = async () => {
    if (disabled || status === 'sending') return;

    if (confirmPrompt && !window.confirm(confirmPrompt)) {
      return;
    }

    setStatus('sending');
    setErrorMessage(null);

    try {
      const res = await onExecute();
      if (res.success) {
        setStatus('acknowledged');
        setTimeout(() => setStatus('idle'), 2500);
      } else {
        setStatus('failed');
        setErrorMessage(res.error || 'Command failed');
        setTimeout(() => setStatus('idle'), 4000);
      }
    } catch (err: any) {
      setStatus('failed');
      setErrorMessage(err.message || 'Error executing command');
      setTimeout(() => setStatus('idle'), 4000);
    }
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  }[size];

  const getVariantStyles = () => {
    if (status === 'acknowledged') {
      return 'bg-emerald-600 text-white border-emerald-600';
    }
    if (status === 'failed') {
      return 'bg-rose-600 text-white border-rose-600';
    }

    if (active) {
      return 'bg-emerald-800 text-white border-emerald-900 shadow-sm';
    }

    switch (variant) {
      case 'primary':
        return 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-800 shadow-xs';
      case 'danger':
        return 'bg-rose-700 hover:bg-rose-800 text-white border-rose-800 shadow-xs';
      case 'secondary':
        return 'bg-stone-100 hover:bg-stone-200 text-stone-800 border-stone-200';
      case 'outline':
      default:
        return 'bg-white hover:bg-stone-50 text-stone-800 border-stone-300';
    }
  };

  return (
    <div className="relative inline-flex flex-col">
      <button
        type="button"
        disabled={disabled || status === 'sending'}
        onClick={handleClick}
        className={`inline-flex items-center justify-center gap-2 font-medium rounded-lg border transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${sizeClasses} ${getVariantStyles()} ${className}`}
      >
        {status === 'sending' ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-current" />
            <span>Sending...</span>
          </>
        ) : status === 'acknowledged' ? (
          <>
            <Check className="w-4 h-4 text-white" />
            <span>Acknowledged</span>
          </>
        ) : status === 'failed' ? (
          <>
            <AlertCircle className="w-4 h-4 text-white" />
            <span>Failed</span>
          </>
        ) : (
          <>
            {icon}
            <span>{label}</span>
          </>
        )}
      </button>
      {errorMessage && (
        <span className="absolute top-full left-0 mt-1 z-20 text-[10px] text-rose-600 bg-white px-2 py-0.5 rounded shadow border border-rose-200 whitespace-nowrap">
          {errorMessage}
        </span>
      )}
    </div>
  );
};

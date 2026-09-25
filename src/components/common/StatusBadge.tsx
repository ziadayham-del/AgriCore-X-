import React from 'react';

export type BadgeVariant = 
  | 'online' 
  | 'offline' 
  | 'running' 
  | 'stopped' 
  | 'active' 
  | 'warning' 
  | 'fault' 
  | 'syncing' 
  | 'demo' 
  | 'neutral';

interface StatusBadgeProps {
  status: string;
  variant?: BadgeVariant;
  pulse?: boolean;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant = 'neutral',
  pulse = false,
  size = 'md',
}) => {
  const normalized = (variant || status.toLowerCase()) as BadgeVariant;

  const styles: Record<BadgeVariant, { bg: string; text: string; dot: string; border: string }> = {
    online: { bg: 'bg-emerald-50', text: 'text-emerald-800', dot: 'bg-emerald-500', border: 'border-emerald-200/80' },
    active: { bg: 'bg-emerald-50', text: 'text-emerald-800', dot: 'bg-emerald-500', border: 'border-emerald-200/80' },
    running: { bg: 'bg-emerald-50', text: 'text-emerald-800', dot: 'bg-emerald-500', border: 'border-emerald-200/80' },
    stopped: { bg: 'bg-stone-100', text: 'text-stone-700', dot: 'bg-stone-400', border: 'border-stone-200' },
    offline: { bg: 'bg-rose-50', text: 'text-rose-800', dot: 'bg-rose-500', border: 'border-rose-200' },
    fault: { bg: 'bg-rose-50', text: 'text-rose-800', dot: 'bg-rose-500', border: 'border-rose-200' },
    warning: { bg: 'bg-amber-50', text: 'text-amber-800', dot: 'bg-amber-500', border: 'border-amber-200' },
    syncing: { bg: 'bg-sky-50', text: 'text-sky-800', dot: 'bg-sky-500', border: 'border-sky-200' },
    demo: { bg: 'bg-teal-50', text: 'text-teal-800', dot: 'bg-teal-500', border: 'border-teal-300' },
    neutral: { bg: 'bg-stone-50', text: 'text-stone-700', dot: 'bg-stone-400', border: 'border-stone-200' },
  };

  const current = styles[normalized] || styles.neutral;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border ${current.bg} ${current.text} ${current.border} ${sizeClasses}`}
    >
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${current.dot} opacity-75`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${current.dot}`} />
      </span>
      <span className="tracking-wide uppercase font-semibold">{status}</span>
    </span>
  );
};

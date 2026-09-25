import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  trend?: {
    value: string;
    positive?: boolean;
    neutral?: boolean;
  };
  className?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  icon,
  badge,
  trend,
  className = '',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-stone-200/80 p-5 shadow-xs transition-all hover:border-emerald-800/25 ${onClick ? 'cursor-pointer hover:shadow-sm' : ''} ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-semibold tracking-wider uppercase text-stone-500">{title}</span>
        <div className="flex items-center gap-1.5">
          {badge}
          {icon && <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800">{icon}</div>}
        </div>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 font-mono">
          {value}
        </span>
        {unit && <span className="text-sm font-medium text-stone-500">{unit}</span>}
      </div>

      {(subtitle || trend) && (
        <div className="mt-2.5 flex items-center justify-between text-xs text-stone-500 border-t border-stone-100 pt-2">
          {subtitle && <span className="truncate">{subtitle}</span>}
          {trend && (
            <span
              className={`font-medium ${
                trend.neutral
                  ? 'text-stone-500'
                  : trend.positive
                  ? 'text-emerald-700'
                  : 'text-amber-700'
              }`}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

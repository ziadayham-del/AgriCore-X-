import React from 'react';
import { useTelemetry } from '../../hooks/useTelemetry';
import { StatusBadge } from '../common/StatusBadge';
import {
  Wifi,
  Radio,
  Server,
  Zap,
  Menu,
  Sun,
  ShieldCheck,
} from 'lucide-react';

interface TopbarProps {
  onToggleMobileNav: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleMobileNav }) => {
  const { network, power, nodes, settings } = useTelemetry();

  const onlineNodesCount = nodes.filter(n => n.online).length;

  return (
    <header className="h-16 bg-white border-b border-stone-200/80 px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
      {/* Left: Mobile Toggle & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileNav}
          className="lg:hidden p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-stone-900 text-sm tracking-tight truncate max-w-xs sm:max-w-md">
            {settings.farmName}
          </span>
        </div>
      </div>

      {/* Right: Technical Telemetry Indicators */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Network Status Pill (LAN > Wi-Fi > 4G > Offline) */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-stone-200 bg-stone-50/70 text-xs text-stone-700">
          {network.activeInterface === 'LAN' ? (
            <Server className="w-3.5 h-3.5 text-emerald-700" />
          ) : network.activeInterface === 'Wi-Fi' ? (
            <Wifi className="w-3.5 h-3.5 text-emerald-700" />
          ) : network.activeInterface === '4G' ? (
            <Radio className="w-3.5 h-3.5 text-amber-700" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-rose-500" />
          )}
          <span className="font-mono font-semibold">{network.activeInterface}</span>
          {network.activeInterface !== 'Offline' && (
            <span className="text-[10px] text-stone-400 font-mono hidden md:inline">
              ({network.signalQualityPercent}%)
            </span>
          )}
        </div>

        {/* Power Source Pill */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-stone-200 bg-stone-50/70 text-xs text-stone-700 font-mono">
          {power.activeSource === 'solar' ? (
            <Sun className="w-3.5 h-3.5 text-amber-600" />
          ) : (
            <Zap className="w-3.5 h-3.5 text-emerald-700" />
          )}
          <span className="capitalize">{power.activeSource}</span>
          <span className="text-emerald-700 font-bold">{power.batterySoc}%</span>
        </div>

        {/* Nodes Health Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-emerald-200 bg-emerald-50/60 text-xs text-emerald-900 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
          <span>{onlineNodesCount}/{nodes.length} Nodes</span>
        </div>

        {/* Demo Mode Badge */}
        {settings.demoModeActive && (
          <StatusBadge status="DEMO" variant="demo" size="sm" pulse />
        )}

        {/* Operator Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-stone-200">
          <div className="w-7 h-7 rounded-full bg-emerald-800 text-white font-mono text-xs font-bold flex items-center justify-center">
            AG
          </div>
          <span className="hidden xl:inline text-xs font-medium text-stone-700">Operator</span>
        </div>
      </div>
    </header>
  );
};

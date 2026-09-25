import React from 'react';
import { Server, Wifi, Radio, CloudOff, CheckCircle2 } from 'lucide-react';
import { NetworkTelemetry } from '../../types';

interface NetworkPriorityCardProps {
  network: NetworkTelemetry;
}

export const NetworkPriorityCard: React.FC<NetworkPriorityCardProps> = ({ network }) => {
  const tiers = [
    {
      id: 'LAN',
      name: 'Wired Ethernet (W5500)',
      priority: 1,
      connected: network.lanConnected,
      icon: Server,
      detail: network.lanConnected ? '100 Mbps Full Duplex' : 'Disconnected',
    },
    {
      id: 'Wi-Fi',
      name: 'Local Farm Wi-Fi',
      priority: 2,
      connected: network.wifiConnected,
      icon: Wifi,
      detail: network.wifiConnected ? `${network.signalQualityPercent}% RSSI (-58 dBm)` : 'Standby',
    },
    {
      id: '4G',
      name: 'Cellular LTE Fallback',
      priority: 3,
      connected: network.cellularConnected,
      icon: Radio,
      detail: network.cellularConnected ? 'Connected' : 'Standby fallback',
    },
    {
      id: 'Offline',
      name: 'RTC + microSD Local Buffering',
      priority: 4,
      connected: network.syncState === 'queued_offline',
      icon: CloudOff,
      detail: network.offlineQueueCount > 0 ? `${network.offlineQueueCount} packets queued` : 'Synchronized',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-stone-200/80 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Network Redundancy
          </span>
          <h3 className="text-base font-bold text-stone-900 mt-0.5">Priority: LAN &gt; Wi-Fi &gt; 4G &gt; Offline</h3>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
            Active: {network.activeInterface}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {tiers.map((tier) => {
          const Icon = tier.icon;
          const isActive = network.activeInterface === tier.id;

          return (
            <div
              key={tier.id}
              className={`p-3 rounded-lg border transition-all ${
                isActive
                  ? 'border-emerald-700 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-700/20'
                  : 'border-stone-200 bg-stone-50/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-emerald-800' : 'text-stone-500'
                    }`}
                  />
                  <span className="text-xs font-bold text-stone-800 font-mono">
                    P{tier.priority}: {tier.id}
                  </span>
                </div>
                {isActive && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                )}
              </div>
              <div className="text-[11px] text-stone-600 truncate">{tier.name}</div>
              <div className="text-[10px] font-mono text-stone-400 mt-1">{tier.detail}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between text-xs text-stone-500">
        <div>
          <span>Server IP: </span>
          <span className="font-mono text-stone-700 font-medium">{network.ipAddress}</span>
        </div>
        <div>
          <span>MAC: </span>
          <span className="font-mono text-stone-700 font-medium">{network.macAddress}</span>
        </div>
        <div>
          <span>Cloud Sync: </span>
          <span className="font-mono text-emerald-700 font-semibold uppercase">{network.syncState}</span>
        </div>
      </div>
    </div>
  );
};

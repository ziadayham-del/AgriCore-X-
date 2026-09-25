import React from 'react';
import { useTelemetry } from '../hooks/useTelemetry';
import { StatusBadge } from '../components/common/StatusBadge';
import { NetworkPriorityCard } from '../components/dashboard/NetworkPriorityCard';
import {
  Cpu,
  Server,
  Activity,
  HardDrive,
  Clock,
  ShieldCheck,
  Radio,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

export const System: React.FC = () => {
  const { nodes, network, settings } = useTelemetry();

  const totalErrors = nodes.reduce((acc, n) => acc + n.errorCount, 0);
  const onlineCount = nodes.filter((n) => n.online).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-800 text-white font-mono text-xs font-bold">
              SYSTEM DIAGNOSTICS
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              Distributed Hardware Health & Node Manager
            </h1>
          </div>
          <p className="text-sm text-stone-500 mt-1">
            Real-time RS-485 bus telemetry, controller heartbeats, memory heaps, and firmware versions
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="bg-emerald-100 text-emerald-900 px-3 py-1.5 rounded-lg font-bold">
            {onlineCount}/{nodes.length} Controllers Online
          </span>
        </div>
      </div>

      {/* Network Redundancy Section */}
      <NetworkPriorityCard network={network} />

      {/* RS-485 Bus & Core System Architecture Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
          <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
            RS-485 Physical Bus
          </div>
          <div className="text-2xl font-mono font-bold text-stone-900 mt-1">
            MAX3485
          </div>
          <div className="text-[11px] text-stone-500 font-mono mt-0.5">
            3.3V Logic • 115,200 Baud
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
          <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
            Bus CRC Errors
          </div>
          <div className="text-2xl font-mono font-bold text-emerald-800 mt-1">
            {totalErrors} Errors
          </div>
          <div className="text-[11px] text-stone-500 font-mono mt-0.5">
            CRC16 Frame Validation OK
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
          <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
            RTC & SD Logger
          </div>
          <div className="text-2xl font-mono font-bold text-stone-900 mt-1">
            DS3231 + FAT32
          </div>
          <div className="text-[11px] text-stone-500 font-mono mt-0.5">
            MicroSD Sync: Operational
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
          <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
            Offline Buffering
          </div>
          <div className="text-2xl font-mono font-bold text-emerald-800 mt-1">
            {network.offlineQueueCount} Queued
          </div>
          <div className="text-[11px] text-stone-500 font-mono mt-0.5">
            Auto-Sync to Cloud on link
          </div>
        </div>
      </div>

      {/* Complete Table of 8 Distributed Nodes (Section 21) */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-stone-200/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Hardware Architecture Nodes
            </span>
            <h3 className="text-base font-bold text-stone-900 mt-0.5">
              Controller Health & Diagnostics Matrix
            </h3>
          </div>
          <span className="text-xs font-mono text-stone-400">
            Heartbeat timeout window: 5000ms
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50/70 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Node ID</th>
                <th className="px-5 py-3">Subsystem Role</th>
                <th className="px-5 py-3">Controller MCU</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 font-mono">Uptime</th>
                <th className="px-5 py-3 font-mono">Free Heap</th>
                <th className="px-5 py-3 font-mono">Firmware</th>
                <th className="px-5 py-3 font-mono">Last Heartbeat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
              {nodes.map((node) => (
                <tr key={node.nodeId} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-5 py-3 font-mono font-bold text-stone-900">
                    <span className="bg-stone-100 px-2 py-1 rounded border border-stone-200">
                      {node.nodeId}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="font-bold text-stone-900">{node.name}</div>
                    <div className="text-[11px] text-stone-400 line-clamp-1">{node.role}</div>
                  </td>
                  <td className="px-5 py-3 font-mono text-stone-600">
                    {node.controllerMcu}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge
                      status={node.online ? 'ONLINE' : 'OFFLINE'}
                      variant={node.online ? 'online' : 'offline'}
                      size="sm"
                      pulse={node.online}
                    />
                  </td>
                  <td className="px-5 py-3 font-mono text-stone-600">
                    {Math.floor(node.uptimeSeconds / 3600)}h {Math.floor((node.uptimeSeconds % 3600) / 60)}m
                  </td>
                  <td className="px-5 py-3 font-mono">
                    {node.freeHeapBytes ? (
                      <span className="text-emerald-800 font-bold">
                        {(node.freeHeapBytes / 1024).toFixed(1)} KB
                      </span>
                    ) : (
                      <span className="text-stone-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 font-mono text-stone-500">
                    {node.firmwareVersion}
                  </td>
                  <td className="px-5 py-3 font-mono text-stone-400">
                    {new Date(node.lastHeartbeat).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useTelemetry } from '../hooks/useTelemetry';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  ScrollText,
  Search,
  Filter,
  Download,
  AlertTriangle,
  Info,
  AlertCircle,
  Clock,
} from 'lucide-react';

export const Events: React.FC = () => {
  const { events } = useTelemetry();
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'info' | 'warning' | 'critical'>('all');
  const [nodeFilter, setNodeFilter] = useState<string>('all');

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.eventType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.nodeId && e.nodeId.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSeverity = severityFilter === 'all' || e.severity === severityFilter;
    const matchesNode = nodeFilter === 'all' || e.nodeId === nodeFilter;

    return matchesSearch && matchesSeverity && matchesNode;
  });

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Event Type', 'Node ID', 'Severity', 'Description', 'Status'];
    const rows = filteredEvents.map(e => [
      e.timestamp,
      e.eventType,
      e.nodeId || '',
      e.severity,
      `"${e.description.replace(/"/g, '""')}"`,
      e.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smartagriculture_events_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-800 text-white font-mono text-xs font-bold">
              SYSTEM LOGS
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              Audit Events & Hardware Logs
            </h1>
          </div>
          <p className="text-sm text-stone-500 mt-1">
            Searchable event trail aggregated from Server ESP32 event engine and field-bus packets
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 shadow-xs"
        >
          <Download className="w-3.5 h-3.5 text-stone-500" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search event type, description, node..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 font-medium"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Severity */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
            className="px-3 py-2 rounded-lg border border-stone-300 text-xs font-semibold bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
          >
            <option value="all">All Severities</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>

          {/* Node */}
          <select
            value={nodeFilter}
            onChange={(e) => setNodeFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-stone-300 text-xs font-semibold bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
          >
            <option value="all">All Nodes</option>
            <option value="N01">N01 Server</option>
            <option value="N02">N02 Agriculture</option>
            <option value="N03">N03 Power</option>
            <option value="N04">N04 Roof & Perimeter</option>
            <option value="N05">N05 TFT HMI</option>
            <option value="N06">N06 Security Cam</option>
            <option value="N07">N07 Crop Cam</option>
            <option value="N08">N08 Arduino Nano</option>
          </select>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50/70 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 font-mono">Timestamp</th>
                <th className="px-5 py-3">Event Code</th>
                <th className="px-5 py-3">Origin Node</th>
                <th className="px-5 py-3">Severity</th>
                <th className="px-5 py-3">Audit Description</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
              {filteredEvents.map((evt) => {
                const isCritical = evt.severity === 'critical';
                const isWarning = evt.severity === 'warning';

                return (
                  <tr key={evt.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-5 py-3 font-mono text-stone-500 whitespace-nowrap">
                      {new Date(evt.timestamp).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 font-mono font-bold text-stone-900 whitespace-nowrap">
                      {evt.eventType}
                    </td>
                    <td className="px-5 py-3 font-mono">
                      {evt.nodeId ? (
                        <span className="bg-stone-100 px-2 py-0.5 rounded border border-stone-200 font-bold">
                          {evt.nodeId}
                        </span>
                      ) : (
                        <span className="text-stone-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase ${
                          isCritical
                            ? 'bg-rose-100 text-rose-800'
                            : isWarning
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isCritical ? (
                          <AlertCircle className="w-3 h-3 text-rose-700" />
                        ) : isWarning ? (
                          <AlertTriangle className="w-3 h-3 text-amber-700" />
                        ) : (
                          <Info className="w-3 h-3 text-emerald-700" />
                        )}
                        {evt.severity}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-stone-800 max-w-md">
                      {evt.description}
                    </td>
                    <td className="px-5 py-3 font-mono text-[11px] text-stone-500 uppercase">
                      {evt.status}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

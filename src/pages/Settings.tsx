import React, { useState, useEffect } from 'react';
import { useTelemetry } from '../hooks/useTelemetry';
import { useToast } from '../components/common/Toast';
import { hardwareService } from '../services/hardware';
import {
  getSupabaseCredentials,
  initSupabase,
  testSupabaseConnection,
} from '../services/supabase';
import {
  Settings as SettingsIcon,
  Sliders,
  Server,
  Cloud,
  CheckCircle2,
  Cpu,
  User,
  Shield,
  Bell,
  Database,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { settings } = useTelemetry();
  const { showToast } = useToast();

  const [farmName, setFarmName] = useState(settings.farmName);
  const [moistureLow, setMoistureLow] = useState(settings.moistureLowThreshold);
  const [moistureHigh, setMoistureHigh] = useState(settings.moistureHighThreshold);
  const [tankLow, setTankLow] = useState(settings.tankLowThreshold);
  const [esp32Ip, setEsp32Ip] = useState(settings.esp32ServerIp);
  const [demoActive, setDemoActive] = useState(settings.demoModeActive);

  // Supabase Configuration State
  const initialCreds = getSupabaseCredentials();
  const [supabaseUrl, setSupabaseUrl] = useState(initialCreds.url);
  const [supabaseKey, setSupabaseKey] = useState(initialCreds.key);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
  } | null>(null);

  const handleTestSupabase = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    try {
      const res = await testSupabaseConnection(supabaseUrl, supabaseKey);
      setConnectionStatus({
        tested: true,
        success: res.success,
        message: res.message,
      });
      if (res.success) {
        showToast('success', 'Supabase Connected', 'Successfully verified REST & Realtime connection.');
      } else {
        showToast('warning', 'Supabase Connection Notice', res.message);
      }
    } catch (err: any) {
      setConnectionStatus({
        tested: true,
        success: false,
        message: err.message || 'Connection attempt failed',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Save Supabase credentials to localStorage and re-initialize client
    if (typeof window !== 'undefined') {
      localStorage.setItem('smartagri_supabase_url', supabaseUrl.trim());
      localStorage.setItem('smartagri_supabase_key', supabaseKey.trim());
      initSupabase(supabaseUrl.trim(), supabaseKey.trim());
    }

    hardwareService.updateSettings({
      farmName,
      moistureLowThreshold: Number(moistureLow),
      moistureHighThreshold: Number(moistureHigh),
      tankLowThreshold: Number(tankLow),
      esp32ServerIp: esp32Ip,
      demoModeActive: demoActive,
    });

    if (demoActive) {
      hardwareService.startSimulation();
    } else {
      hardwareService.stopSimulation();
    }

    showToast('success', 'Configuration Saved', 'System parameters & database keys updated successfully.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-800 text-white font-mono text-xs font-bold">
              SYSTEM CONFIG
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              Station Settings & Hardware Profiles
            </h1>
          </div>
          <p className="text-sm text-stone-500 mt-1">
            Configure agronomic sensor thresholds, ESP32 Server connectivity, and simulation mode
          </p>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs transition-all active:scale-[0.98]"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Farm & Station Profile */}
        <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
            <User className="w-4 h-4 text-emerald-800" />
            <h3 className="font-bold text-sm text-stone-900">Farm Station Profile</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Farm / Facility Name
              </label>
              <input
                type="text"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Operator Role
              </label>
              <input
                type="text"
                readOnly
                value="Lead Agricultural Systems Engineer"
                className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-stone-200 bg-stone-50 text-stone-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Agronomic Thresholds */}
        <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
            <Sliders className="w-4 h-4 text-emerald-800" />
            <h3 className="font-bold text-sm text-stone-900">
              Sensor Thresholds & Safety Limits
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1 font-sans">
                Soil Moisture Low Trigger (%)
              </label>
              <input
                type="number"
                value={moistureLow}
                onChange={(e) => setMoistureLow(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
              />
              <span className="text-[10px] text-stone-400 font-sans mt-0.5 block">
                Irrigation advisory trigger
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1 font-sans">
                Soil Moisture High Saturation (%)
              </label>
              <input
                type="number"
                value={moistureHigh}
                onChange={(e) => setMoistureHigh(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
              />
              <span className="text-[10px] text-stone-400 font-sans mt-0.5 block">
                Over-saturation warning limit
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1 font-sans">
                Water Tank Dry-Run Cutoff (%)
              </label>
              <input
                type="number"
                value={tankLow}
                onChange={(e) => setTankLow(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
              />
              <span className="text-[10px] text-stone-400 font-sans mt-0.5 block">
                Automatic pump interlock cutoff
              </span>
            </div>
          </div>
        </div>

        {/* Supabase Cloud Database & Storage */}
        <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-800" />
              <div>
                <h3 className="font-bold text-sm text-stone-900">
                  Supabase Cloud Database & Auth Gateway
                </h3>
                <p className="text-xs text-stone-500">
                  PostgreSQL, Realtime Telemetry Sync, Storage & Authentication
                </p>
              </div>
            </div>

            <a
              href="https://supabase.com/dashboard/project/nawevbzqjzsobzvuzwuq"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold transition-colors"
            >
              <span>Project Dashboard</span>
              <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
            </a>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Supabase Project URL
              </label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://nawevbzqjzsobzvuzwuq.supabase.co"
                className="w-full px-3 py-2 font-mono text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-stone-700">
                  Supabase Anon Public API Key (JWT)
                </label>
                <span className="text-[11px] text-stone-400 font-mono">
                  Safe for browser client usage
                </span>
              </div>
              <textarea
                rows={3}
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                placeholder="eyjhbgcioijiuzi1niisinr5c..."
                className="w-full px-3 py-2 font-mono text-[11px] rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleTestSupabase}
                disabled={testingConnection}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100/80 text-emerald-900 border border-emerald-300 font-semibold text-xs transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
                <span>{testingConnection ? 'Testing Gateway...' : 'Test Connection'}</span>
              </button>

              <div className="text-[11px] text-stone-500">
                Found in <span className="font-semibold text-stone-700">Project Settings &gt; API &gt; Project API keys (anon public)</span>
              </div>
            </div>

            {connectionStatus && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                  connectionStatus.success
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50/70 border-amber-200 text-amber-900'
                }`}
              >
                {connectionStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold">
                    {connectionStatus.success ? 'Connection Successful' : 'Connection Status'}
                  </p>
                  <p className="mt-0.5 text-[11px] opacity-90 leading-relaxed">
                    {connectionStatus.message}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Server ESP32 Connectivity */}
        <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
            <Server className="w-4 h-4 text-emerald-800" />
            <h3 className="font-bold text-sm text-stone-900">
              Hardware Server ESP32 (Node N01)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Server ESP32 IP Address
              </label>
              <input
                type="text"
                value={esp32Ip}
                onChange={(e) => setEsp32Ip(e.target.value)}
                placeholder="192.168.1.100"
                className="w-full px-3 py-2 font-mono rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                REST API Port
              </label>
              <input
                type="number"
                readOnly
                value={80}
                className="w-full px-3 py-2 font-mono rounded-lg border border-stone-200 bg-stone-50 text-stone-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                WebSocket Port
              </label>
              <input
                type="number"
                readOnly
                value={81}
                className="w-full px-3 py-2 font-mono rounded-lg border border-stone-200 bg-stone-50 text-stone-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Development Simulation / Demo Mode */}
        <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-800" />
              <div>
                <h3 className="font-bold text-sm text-stone-900">
                  Development Simulation Mode
                </h3>
                <p className="text-xs text-stone-500">
                  Simulates full ESP32 telemetry, RS-485 packet streams, and actuator feedback loops
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={demoActive}
                onChange={(e) => setDemoActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-800"></div>
            </label>
          </div>

          <div className="text-xs text-stone-500 leading-relaxed">
            When Simulation Mode is enabled, the web console communicates with realistic local emulators for all 8 controller nodes (N01 - N08). When disabled, commands are routed via HTTP/WebSocket to the physical Server ESP32 at <code className="text-emerald-800 font-mono font-bold">{esp32Ip}</code>.
          </div>
        </div>
      </form>
    </div>
  );
};

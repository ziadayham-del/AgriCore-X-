import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Sprout,
  Wheat,
  Zap,
  Camera,
  Shield,
  Home as RoofIcon,
  Cpu,
  ScrollText,
  Settings,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/agriculture', label: 'Agriculture', icon: Sprout },
    { to: '/crops', label: 'Crop Manager', icon: Wheat },
    { to: '/power', label: 'Power & Energy', icon: Zap },
    { to: '/cameras', label: 'Cameras', icon: Camera },
    { to: '/security', label: 'Security', icon: Shield },
    { to: '/roof-tracker', label: 'Roof & Tracker', icon: RoofIcon },
    { to: '/system', label: 'System Health', icon: Cpu },
    { to: '/events', label: 'Events & Logs', icon: ScrollText },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-stone-200/80 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-stone-200/80">
        <div className="w-9 h-9 rounded-xl bg-emerald-800 text-white flex items-center justify-center shadow-xs">
          {/* Custom Precision Tech Leaf Icon */}
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.4z" />
          </svg>
        </div>
        <div>
          <div className="font-bold text-sm tracking-tight text-stone-900 flex items-center gap-1.5">
            <span>AgriCore</span>
            <span className="text-emerald-700 font-mono text-xs font-black">X</span>
          </div>
          <div className="text-[10px] text-stone-500 font-medium tracking-wide uppercase">
            Farm Control Console
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-stone-400">
          Farm Modules
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Node Bus Status Footer */}
      <div className="p-4 border-t border-stone-100 bg-stone-50/50 text-[11px] text-stone-500">
        <div className="flex items-center justify-between font-mono">
          <span>RS-485 Field Bus</span>
          <span className="text-emerald-700 font-bold">115.2 kbps</span>
        </div>
        <div className="flex items-center justify-between text-stone-400 mt-1">
          <span>Coordinator</span>
          <span>N01 ESP32</span>
        </div>
      </div>
    </aside>
  );
};

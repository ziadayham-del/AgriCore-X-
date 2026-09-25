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
  X,
} from 'lucide-react';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 lg:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col z-10">
        <div className="h-16 px-5 flex items-center justify-between border-b border-stone-200">
          <div className="font-bold text-stone-900 text-sm">
            AgriCore <span className="text-emerald-700 font-mono">X</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-800 text-white font-semibold'
                      : 'text-stone-700 hover:bg-stone-50'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
};

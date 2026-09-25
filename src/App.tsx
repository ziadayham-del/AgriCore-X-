/**
 * SmartAgriculture X - Main Router & Application Root
 * Distributed Smart Agriculture & Farm Management Platform
 */
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/common/Toast';
import { AppShell } from './components/layout/AppShell';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Agriculture } from './pages/Agriculture';
import { CropManager } from './pages/CropManager';
import { CropDetails } from './pages/CropDetails';
import { CropCalendar } from './pages/CropCalendar';
import { CropImages } from './pages/CropImages';
import { Power } from './pages/Power';
import { Cameras } from './pages/Cameras';
import { PanTilt } from './pages/PanTilt';
import { Security } from './pages/Security';
import { Roof } from './pages/Roof';
import { System } from './pages/System';
import { Events } from './pages/Events';

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Persistent Farm Station App Shell */}
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/agriculture" element={<Agriculture />} />
            <Route path="/crops" element={<CropManager />} />
            <Route path="/crops/:id" element={<CropDetails />} />
            <Route path="/crops/calendar" element={<CropCalendar />} />
            <Route path="/crops/:id/images" element={<CropImages />} />
            <Route path="/power" element={<Power />} />
            <Route path="/cameras" element={<Cameras />} />
            <Route path="/cameras/security/pan-tilt" element={<PanTilt />} />
            <Route path="/security" element={<Security />} />
            <Route path="/roof" element={<Roof />} />
            <Route path="/roof-tracker" element={<Navigate to="/roof" replace />} />
            <Route path="/system" element={<System />} />
            <Route path="/events" element={<Events />} />
          </Route>

          {/* Catch-all redirect to Dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

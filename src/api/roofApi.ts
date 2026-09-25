/**
 * SmartAgriculture X - Roof & Solar Tracker Hardware API
 * Controls N04 (N20 motor, limit switches, dual-axis tracker servos).
 */
import { hardwareService } from '../services/hardware';

export async function openRoof() {
  return hardwareService.openRoof();
}

export async function closeRoof() {
  return hardwareService.closeRoof();
}

export async function stopRoof() {
  return hardwareService.stopRoof();
}

export async function moveTrackerLeft(step = 5) {
  return hardwareService.adjustTracker(-step, 0);
}

export async function moveTrackerRight(step = 5) {
  return hardwareService.adjustTracker(step, 0);
}

export async function moveTrackerUp(step = 5) {
  return hardwareService.adjustTracker(0, step);
}

export async function moveTrackerDown(step = 5) {
  return hardwareService.adjustTracker(0, -step);
}

export async function centerTracker() {
  return hardwareService.centerTracker();
}

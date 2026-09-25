/**
 * SmartAgriculture X - Power Hardware API
 * Interfaces with N03 ESP32 and N08 Arduino Nano power controller.
 */
import { hardwareService } from '../services/hardware';
import { PowerSource } from '../types';

export async function setSourcePriority(priority: 'solar_first' | 'battery_backup' | 'grid_fallback') {
  hardwareService.power = {
    ...hardwareService.power,
    sourcePriority: priority,
    lastUpdate: new Date().toISOString(),
  };
  hardwareService.addEvent({
    eventType: 'POWER_SOURCE_CHANGED',
    nodeId: 'N03',
    severity: 'info',
    description: `Power priority mode set to ${priority}`,
  });
  return { success: true };
}

export async function setManualPowerSource(source: PowerSource) {
  hardwareService.power = {
    ...hardwareService.power,
    activeSource: source,
    lastUpdate: new Date().toISOString(),
  };
  hardwareService.addEvent({
    eventType: 'POWER_SOURCE_CHANGED',
    nodeId: 'N03',
    severity: 'info',
    description: `Manual switchover to ${source.toUpperCase()} power active`,
  });
  return { success: true };
}

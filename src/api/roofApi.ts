/**
 * AgriCore-X - Manual Roof Control Hardware API
 * Controls N04 (ESP32-WROOM-32UE, N20 DC motor, limit switches).
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

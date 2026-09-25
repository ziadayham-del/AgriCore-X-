/**
 * SmartAgriculture X - Agriculture & Irrigation Hardware API
 * Routes commands to N02 via Server ESP32.
 */
import { hardwareService } from '../services/hardware';

export async function setPump(state: boolean) {
  return hardwareService.setPump(state);
}

export async function setSolenoid(state: boolean) {
  return hardwareService.setSolenoid(state);
}

export async function setHumidifier(state: boolean) {
  return hardwareService.setHumidifier(state);
}

export async function setLighting(state: boolean) {
  return hardwareService.setLighting(state);
}

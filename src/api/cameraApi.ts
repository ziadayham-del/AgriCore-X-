/**
 * SmartAgriculture X - Camera Hardware API
 * Pan, tilt, center, reset, and capture abstractions for N06 and N07.
 */
import { hardwareService } from '../services/hardware';

export async function setCameraPan(angle: number) {
  return hardwareService.setCameraPan(angle);
}

export async function setCameraTilt(angle: number) {
  return hardwareService.setCameraTilt(angle);
}

export async function panCamera(direction: 'left' | 'right', step = 10) {
  const delta = direction === 'left' ? -step : step;
  return hardwareService.panCamera(delta);
}

export async function tiltCamera(direction: 'up' | 'down', step = 10) {
  const delta = direction === 'up' ? -step : step;
  return hardwareService.tiltCamera(delta);
}

export async function centerCamera() {
  return hardwareService.centerCamera();
}

export async function captureCameraSnapshot(cameraId: 'N06_SECURITY' | 'N07_CROP') {
  return hardwareService.captureSnapshot(cameraId);
}

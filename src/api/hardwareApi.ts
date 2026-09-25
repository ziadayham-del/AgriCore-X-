/**
 * SmartAgriculture X - Hardware API Base Layer
 * Provides clean endpoint abstractions for the Server ESP32 REST API.
 */
import { hardwareService } from '../services/hardware';

const DEFAULT_API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.100/api';

export class HardwareApi {
  private static getBaseUrl(): string {
    const ip = hardwareService.settings.esp32ServerIp;
    const port = hardwareService.settings.esp32ApiPort;
    return hardwareService.settings.demoModeActive ? DEFAULT_API_BASE : `http://${ip}:${port}/api`;
  }

  public static async sendCommand(endpoint: string, payload: any): Promise<any> {
    if (hardwareService.settings.demoModeActive) {
      // In demo mode, command is handled through hardwareService/simulation layer
      return { status: 'acknowledged', simulated: true };
    }

    const url = `${this.getBaseUrl()}${endpoint}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`ESP32 returned error HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      console.error(`Hardware API POST ${endpoint} failed:`, err);
      throw err;
    }
  }

  public static async fetchTelemetry(endpoint: string): Promise<any> {
    const url = `${this.getBaseUrl()}${endpoint}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  }
}

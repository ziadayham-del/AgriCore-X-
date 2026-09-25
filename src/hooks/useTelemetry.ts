/**
 * React Hook: useTelemetry
 * Subscribes to hardwareService live telemetry with zero-lag re-renders.
 */
import { useEffect, useState } from 'react';
import { hardwareService } from '../services/hardware';
import {
  SoilZoneReading,
  EnvironmentTelemetry,
  WaterTelemetry,
  PowerTelemetry,
  SecurityTelemetry,
  RoofTelemetry,
  NetworkTelemetry,
  NodeStatus,
  SystemSettings
} from '../types';

export function useTelemetry() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = hardwareService.subscribe(() => {
      setTick(t => t + 1);
    });
    return unsubscribe;
  }, []);

  return {
    soilZones: hardwareService.soilZones as SoilZoneReading[],
    environment: hardwareService.environment as EnvironmentTelemetry,
    water: hardwareService.water as WaterTelemetry,
    power: hardwareService.power as PowerTelemetry,
    security: hardwareService.security as SecurityTelemetry,
    roof: hardwareService.roof as RoofTelemetry,
    network: hardwareService.network as NetworkTelemetry,
    nodes: hardwareService.nodes as NodeStatus[],
    settings: hardwareService.settings as SystemSettings,
    cameras: hardwareService.cameras,
    crops: hardwareService.crops,
    events: hardwareService.events,
  };
}

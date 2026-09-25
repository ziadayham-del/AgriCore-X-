/**
 * SmartAgriculture X - Hardware & Telemetry Service Layer
 * Coordinates real-time state, Server ESP32 communication, and Demo Mode simulation.
 */
import {
  NodeStatus,
  SoilZoneReading,
  EnvironmentTelemetry,
  WaterTelemetry,
  PowerTelemetry,
  SecurityTelemetry,
  RoofTelemetry,
  TrackerTelemetry,
  CameraTelemetry,
  NetworkTelemetry,
  Crop,
  FarmEvent,
  SystemSettings
} from '../types';
import { INITIAL_NODES, INITIAL_CROPS, INITIAL_EVENTS, INITIAL_SETTINGS } from './simulation';
import { commandService } from './commandService';

type TelemetryListener = () => void;

class HardwareService {
  private listeners: Set<TelemetryListener> = new Set();
  
  // Settings
  public settings: SystemSettings = { ...INITIAL_SETTINGS };
  
  // Controller Nodes
  public nodes: NodeStatus[] = [...INITIAL_NODES];

  // Soil Telemetry (4 zones)
  public soilZones: SoilZoneReading[] = [
    { zone: 1, moisture: 61.4, rawAdc: 2410, sensorStatus: 'online', lastUpdate: new Date().toISOString() },
    { zone: 2, moisture: 58.2, rawAdc: 2490, sensorStatus: 'online', lastUpdate: new Date().toISOString() },
    { zone: 3, moisture: 64.0, rawAdc: 2360, sensorStatus: 'online', lastUpdate: new Date().toISOString() },
    { zone: 4, moisture: 57.5, rawAdc: 2510, sensorStatus: 'online', lastUpdate: new Date().toISOString() },
  ];

  // Environment Telemetry
  public environment: EnvironmentTelemetry = {
    temperature: 29.1,
    humidity: 73.0,
    lightLux: 52400,
    rainDetected: false,
    rawRainValue: 3820,
    lastUpdate: new Date().toISOString(),
  };

  // Water & Irrigation Telemetry
  public water: WaterTelemetry = {
    tankLevelPercent: 84.0,
    tankDepthCm: 168.0,
    pumpState: false,
    solenoidState: false,
    humidifierState: false,
    lightingState: false,
    lowWaterInterlock: false,
    lastUpdate: new Date().toISOString(),
  };

  // Power & Energy Telemetry
  public power: PowerTelemetry = {
    solarVoltage: 38.4,
    solarCurrent: 6.3,
    solarPower: 241.9,
    dailySolarKwh: 4.82,
    batteryVoltage: 13.4,
    batteryCurrent: 4.2,
    batterySoc: 84.0,
    batteryState: 'charging',
    isLowBattery: false,
    gridVoltage: 228.0,
    gridCurrent: 0.0,
    gridPower: 0.0,
    todayGridKwh: 0.42,
    gridAvailable: true,
    activeSource: 'solar',
    sourcePriority: 'solar_first',
    lastUpdate: new Date().toISOString(),
  };

  // Security Telemetry
  public security: SecurityTelemetry = {
    pirDetected: false,
    perimeterZones: {
      zone1: 'normal',
      zone2: 'normal',
      zone3: 'normal',
      zone4: 'normal',
    },
    alarmState: 'ARMED',
    sirenActive: false,
    lastMotionTimestamp: undefined,
    lastEventDescription: 'All 4 perimeter optical beams intact',
    lastUpdate: new Date().toISOString(),
  };

  // Roof Telemetry
  public roof: RoofTelemetry = {
    state: 'CLOSED',
    limitSwitchOpen: false,
    limitSwitchClosed: true,
    rainDetected: false,
    autoCloseOnRain: true,
    motorCurrentMa: 0,
    lastUpdate: new Date().toISOString(),
  };

  // Tracker Telemetry
  public tracker: TrackerTelemetry = {
    horizontalAngle: 42,
    verticalAngle: 18,
    mode: 'AUTO',
    ldrSensors: {
      topLeft: 840,
      topRight: 825,
      bottomLeft: 810,
      bottomRight: 830,
    },
    lastUpdate: new Date().toISOString(),
  };

  // Cameras Telemetry
  public cameras: CameraTelemetry[] = [
    {
      id: 'N06_SECURITY',
      name: 'Security Pan/Tilt Camera',
      online: true,
      streamState: 'online',
      panAngle: 0,
      tiltAngle: 0,
      isRecording: false,
      ipAddress: '192.168.1.106',
      streamUrl: '',
      lastSnapshotUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1000&q=80',
      lastUpdate: new Date().toISOString(),
    },
    {
      id: 'N07_CROP',
      name: 'Crop Time-Lapse Camera',
      online: true,
      streamState: 'online',
      isRecording: false,
      ipAddress: '192.168.1.107',
      streamUrl: '',
      lastSnapshotUrl: 'https://images.unsplash.com/photo-1536657464919-892534f60d6e?auto=format&fit=crop&w=1000&q=80',
      lastUpdate: new Date().toISOString(),
    }
  ];

  // Network Telemetry
  public network: NetworkTelemetry = {
    activeInterface: 'LAN',
    lanConnected: true,
    wifiConnected: true,
    cellularConnected: false,
    signalQualityPercent: 96,
    ipAddress: '192.168.1.100',
    macAddress: '24:6F:28:B4:8E:22',
    syncState: 'synced',
    offlineQueueCount: 0,
    lastStateChange: new Date().toISOString(),
  };

  // Crops
  public crops: Crop[] = [...INITIAL_CROPS];

  // Events
  public events: FarmEvent[] = [...INITIAL_EVENTS];

  // Simulation timer
  private simulationInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startSimulation();
  }

  public subscribe(listener: TelemetryListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  /**
   * Start live simulation loop (runs every 3.5 seconds to gently evolve sensor data)
   */
  public startSimulation() {
    if (this.simulationInterval) return;

    this.simulationInterval = setInterval(() => {
      if (!this.settings.demoModeActive) return;

      const now = new Date().toISOString();

      // Fluctuate soil moistures slightly
      this.soilZones = this.soilZones.map(zone => {
        const delta = (Math.random() - 0.5) * 0.4;
        const newMoisture = Math.min(95, Math.max(15, Number((zone.moisture + delta).toFixed(1))));
        return {
          ...zone,
          moisture: newMoisture,
          lastUpdate: now,
        };
      });

      // Fluctuate environment
      const tempDelta = (Math.random() - 0.5) * 0.15;
      const humDelta = (Math.random() - 0.5) * 0.3;
      this.environment = {
        ...this.environment,
        temperature: Number((this.environment.temperature + tempDelta).toFixed(1)),
        humidity: Number((this.environment.humidity + humDelta).toFixed(0)),
        lastUpdate: now,
      };

      // Solar generation curve simulation
      const solarPowerBase = 240 + Math.sin(Date.now() / 10000) * 15;
      this.power = {
        ...this.power,
        solarPower: Number(solarPowerBase.toFixed(1)),
        solarCurrent: Number((solarPowerBase / this.power.solarVoltage).toFixed(2)),
        lastUpdate: now,
      };

      // Heartbeats
      this.nodes = this.nodes.map(n => ({
        ...n,
        uptimeSeconds: n.uptimeSeconds + 3,
        lastHeartbeat: now,
        lastSensorUpdate: now,
      }));

      this.notify();
    }, 3500);
  }

  public stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  // --- HARDWARE ACTIONS VIA COMMAND SERVICE ---

  /**
   * Irrigation: Set Pump State with Dry-Run Protection
   */
  public async setPump(targetState: boolean) {
    return commandService.executeCommand({
      targetNode: 'N02',
      action: targetState ? 'PUMP_START' : 'PUMP_STOP',
      payload: { pump: targetState },
      safetyCheck: () => {
        if (targetState && this.water.tankLevelPercent < this.settings.tankLowThreshold) {
          return {
            allowed: false,
            reason: `Safety dry-run interlock: Tank level (${this.water.tankLevelPercent}%) is below safe minimum (${this.settings.tankLowThreshold}%).`,
          };
        }
        return { allowed: true };
      },
      executor: async () => {
        await new Promise(r => setTimeout(r, 650));
        this.water = {
          ...this.water,
          pumpState: targetState,
          lastUpdate: new Date().toISOString(),
        };
        this.addEvent({
          eventType: targetState ? 'PUMP_ON' : 'PUMP_OFF',
          nodeId: 'N02',
          severity: 'info',
          description: `Irrigation pump motor ${targetState ? 'started' : 'stopped'} by operator`,
        });
        this.notify();
        return true;
      }
    });
  }

  /**
   * Irrigation: Set Solenoid Valve State
   */
  public async setSolenoid(targetState: boolean) {
    return commandService.executeCommand({
      targetNode: 'N02',
      action: targetState ? 'SOLENOID_OPEN' : 'SOLENOID_CLOSE',
      payload: { solenoid: targetState },
      executor: async () => {
        await new Promise(r => setTimeout(r, 500));
        this.water = {
          ...this.water,
          solenoidState: targetState,
          lastUpdate: new Date().toISOString(),
        };
        this.addEvent({
          eventType: targetState ? 'SOLENOID_ON' : 'SOLENOID_OFF',
          nodeId: 'N02',
          severity: 'info',
          description: `Zone 1 master solenoid valve ${targetState ? 'opened' : 'closed'}`,
        });
        this.notify();
        return true;
      }
    });
  }

  /**
   * Irrigation: Set Humidifier
   */
  public async setHumidifier(targetState: boolean) {
    return commandService.executeCommand({
      targetNode: 'N02',
      action: 'SET_HUMIDIFIER',
      payload: { humidifier: targetState },
      executor: async () => {
        await new Promise(r => setTimeout(r, 450));
        this.water = {
          ...this.water,
          humidifierState: targetState,
          lastUpdate: new Date().toISOString(),
        };
        this.notify();
        return true;
      }
    });
  }

  /**
   * Irrigation: Set Lighting
   */
  public async setLighting(targetState: boolean) {
    return commandService.executeCommand({
      targetNode: 'N02',
      action: 'SET_LIGHTING',
      payload: { lighting: targetState },
      executor: async () => {
        await new Promise(r => setTimeout(r, 450));
        this.water = {
          ...this.water,
          lightingState: targetState,
          lastUpdate: new Date().toISOString(),
        };
        this.notify();
        return true;
      }
    });
  }

  /**
   * Roof: Open Roof with Limit Switch Check
   */
  public async openRoof() {
    return commandService.executeCommand({
      targetNode: 'N04',
      action: 'ROOF_OPEN',
      safetyCheck: () => {
        if (this.roof.limitSwitchOpen) {
          return { allowed: false, reason: 'Roof is already fully OPEN (limit switch engaged).' };
        }
        if (this.roof.rainDetected && this.roof.autoCloseOnRain) {
          return { allowed: false, reason: 'Rain sensor active: Cannot open roof during rain event.' };
        }
        return { allowed: true };
      },
      executor: async () => {
        this.roof = { ...this.roof, state: 'OPENING', motorCurrentMa: 180 };
        this.notify();
        
        await new Promise(r => setTimeout(r, 1200));
        this.roof = {
          ...this.roof,
          state: 'OPEN',
          limitSwitchOpen: true,
          limitSwitchClosed: false,
          motorCurrentMa: 0,
          lastUpdate: new Date().toISOString(),
        };
        this.addEvent({
          eventType: 'ROOF_OPENED',
          nodeId: 'N04',
          severity: 'info',
          description: 'N04 Motor drive completed roof OPEN transition to mechanical limit stop.',
        });
        this.notify();
        return true;
      }
    });
  }

  /**
   * Roof: Close Roof
   */
  public async closeRoof() {
    return commandService.executeCommand({
      targetNode: 'N04',
      action: 'ROOF_CLOSE',
      safetyCheck: () => {
        if (this.roof.limitSwitchClosed) {
          return { allowed: false, reason: 'Roof is already fully CLOSED (limit switch engaged).' };
        }
        return { allowed: true };
      },
      executor: async () => {
        this.roof = { ...this.roof, state: 'CLOSING', motorCurrentMa: 185 };
        this.notify();
        
        await new Promise(r => setTimeout(r, 1200));
        this.roof = {
          ...this.roof,
          state: 'CLOSED',
          limitSwitchOpen: false,
          limitSwitchClosed: true,
          motorCurrentMa: 0,
          lastUpdate: new Date().toISOString(),
        };
        this.addEvent({
          eventType: 'ROOF_CLOSED',
          nodeId: 'N04',
          severity: 'info',
          description: 'N04 Motor drive completed roof CLOSE transition to mechanical limit stop.',
        });
        this.notify();
        return true;
      }
    });
  }

  /**
   * Roof: Emergency Stop
   */
  public async stopRoof() {
    return commandService.executeCommand({
      targetNode: 'N04',
      action: 'ROOF_STOP',
      executor: async () => {
        await new Promise(r => setTimeout(r, 300));
        this.roof = {
          ...this.roof,
          state: 'STOPPED',
          motorCurrentMa: 0,
          lastUpdate: new Date().toISOString(),
        };
        this.notify();
        return true;
      }
    });
  }

  /**
   * Solar Tracker: Nudge or set angles
   */
  public async adjustTracker(hDelta: number, vDelta: number) {
    return commandService.executeCommand({
      targetNode: 'N04',
      action: 'TRACKER_ADJUST',
      payload: { hDelta, vDelta },
      executor: async () => {
        await new Promise(r => setTimeout(r, 400));
        const newH = Math.min(180, Math.max(0, this.tracker.horizontalAngle + hDelta));
        const newV = Math.min(90, Math.max(0, this.tracker.verticalAngle + vDelta));
        this.tracker = {
          ...this.tracker,
          horizontalAngle: newH,
          verticalAngle: newV,
          mode: 'MANUAL',
          lastUpdate: new Date().toISOString(),
        };
        this.notify();
        return true;
      }
    });
  }

  public async centerTracker() {
    return commandService.executeCommand({
      targetNode: 'N04',
      action: 'TRACKER_CENTER',
      executor: async () => {
        await new Promise(r => setTimeout(r, 500));
        this.tracker = {
          ...this.tracker,
          horizontalAngle: 90,
          verticalAngle: 45,
          mode: 'AUTO',
          lastUpdate: new Date().toISOString(),
        };
        this.notify();
        return true;
      }
    });
  }

  /**
   * Pan/Tilt Security Camera (N06)
   * Pan range: -180° to +180° (0° center)
   * Tilt range: -90° to +90° (0° center)
   */
  public async setCameraPan(targetPan: number) {
    const clampedPan = Math.min(180, Math.max(-180, Math.round(targetPan)));
    this.cameras[0] = {
      ...this.cameras[0],
      panAngle: clampedPan,
      lastUpdate: new Date().toISOString(),
    };
    this.notify();

    return commandService.executeCommand({
      targetNode: 'N06',
      action: 'CAMERA_PAN',
      payload: { pan: clampedPan },
      executor: async () => {
        return true;
      }
    });
  }

  public async setCameraTilt(targetTilt: number) {
    const clampedTilt = Math.min(90, Math.max(-90, Math.round(targetTilt)));
    this.cameras[0] = {
      ...this.cameras[0],
      tiltAngle: clampedTilt,
      lastUpdate: new Date().toISOString(),
    };
    this.notify();

    return commandService.executeCommand({
      targetNode: 'N06',
      action: 'CAMERA_TILT',
      payload: { tilt: clampedTilt },
      executor: async () => {
        return true;
      }
    });
  }

  public async panCamera(delta: number) {
    const currentPan = this.cameras[0].panAngle ?? 0;
    return this.setCameraPan(currentPan + delta);
  }

  public async tiltCamera(delta: number) {
    const currentTilt = this.cameras[0].tiltAngle ?? 0;
    return this.setCameraTilt(currentTilt + delta);
  }

  public async centerCamera() {
    this.cameras[0] = {
      ...this.cameras[0],
      panAngle: 0,
      tiltAngle: 0,
      lastUpdate: new Date().toISOString(),
    };
    this.notify();

    return commandService.executeCommand({
      targetNode: 'N06',
      action: 'CAMERA_CENTER',
      payload: { pan: 0, tilt: 0 },
      executor: async () => {
        return true;
      }
    });
  }

  public async captureSnapshot(camId: 'N06_SECURITY' | 'N07_CROP') {
    return commandService.executeCommand({
      targetNode: camId === 'N06_SECURITY' ? 'N06' : 'N07',
      action: 'CAPTURE_SNAPSHOT',
      executor: async () => {
        await new Promise(r => setTimeout(r, 800));
        const idx = camId === 'N06_SECURITY' ? 0 : 1;
        this.cameras[idx] = {
          ...this.cameras[idx],
          lastUpdate: new Date().toISOString(),
        };
        this.notify();
        return true;
      }
    });
  }

  /**
   * Security Alarm Controls
   */
  public async setAlarmState(state: 'ARMED' | 'DISARMED') {
    return commandService.executeCommand({
      targetNode: 'N04',
      action: state === 'ARMED' ? 'ARM_SYSTEM' : 'DISARM_SYSTEM',
      executor: async () => {
        await new Promise(r => setTimeout(r, 450));
        this.security = {
          ...this.security,
          alarmState: state,
          sirenActive: false,
          lastUpdate: new Date().toISOString(),
        };
        this.addEvent({
          eventType: state === 'ARMED' ? 'ROOF_CLOSED' : 'ROOF_OPENED', // general security audit
          nodeId: 'N04',
          severity: 'info',
          description: `Perimeter detection and siren system ${state}`,
        });
        this.notify();
        return true;
      }
    });
  }

  public async setSiren(active: boolean) {
    return commandService.executeCommand({
      targetNode: 'N04',
      action: active ? 'SIREN_ON' : 'SIREN_OFF',
      executor: async () => {
        await new Promise(r => setTimeout(r, 300));
        this.security = {
          ...this.security,
          sirenActive: active,
          lastUpdate: new Date().toISOString(),
        };
        this.notify();
        return true;
      }
    });
  }

  public async resetAlarm() {
    return commandService.executeCommand({
      targetNode: 'N04',
      action: 'ALARM_RESET',
      executor: async () => {
        await new Promise(r => setTimeout(r, 300));
        this.security = {
          ...this.security,
          sirenActive: false,
          alarmState: 'ARMED',
          perimeterZones: {
            zone1: 'normal',
            zone2: 'normal',
            zone3: 'normal',
            zone4: 'normal',
          },
          lastUpdate: new Date().toISOString(),
        };
        this.notify();
        return true;
      }
    });
  }

  /**
   * Crop Management: Register / Update / Complete Task
   */
  public registerCrop(cropData: Omit<Crop, 'id' | 'createdAt'>): Crop {
    const newCrop: Crop = {
      ...cropData,
      id: `crop_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.crops.unshift(newCrop);
    this.addEvent({
      eventType: 'CROP_TASK_DUE',
      nodeId: 'N02',
      severity: 'info',
      description: `New crop registered: ${newCrop.name} in ${newCrop.fieldName}`,
    });
    this.notify();
    return newCrop;
  }

  public completeCropTask(cropId: string, taskId: string) {
    const crop = this.crops.find(c => c.id === cropId);
    if (!crop || !crop.tasks) return;

    const task = crop.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = 'completed';
      task.completedAt = new Date().toISOString();
      this.addEvent({
        eventType: 'CROP_TASK_COMPLETED',
        nodeId: 'N02',
        severity: 'info',
        description: `Completed task: "${task.title}" for ${crop.name}`,
      });
      this.notify();
    }
  }

  /**
   * Add Farm Event
   */
  public addEvent(evt: Omit<FarmEvent, 'id' | 'timestamp' | 'status'>) {
    const newEvt: FarmEvent = {
      id: `evt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'logged',
      ...evt,
    };
    this.events.unshift(newEvt);
    commandService.logEvent(newEvt);
    this.notify();
  }

  /**
   * Update Settings
   */
  public updateSettings(partial: Partial<SystemSettings>) {
    this.settings = { ...this.settings, ...partial };
    this.notify();
  }
}

export const hardwareService = new HardwareService();

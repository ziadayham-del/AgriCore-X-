/**
 * SmartAgriculture X - Core TypeScript Type Definitions
 * Distributed Smart Agriculture & Farm Management Platform
 */

export type NetworkInterface = 'LAN' | 'Wi-Fi' | '4G' | 'Offline';
export type PowerSource = 'solar' | 'battery' | 'grid';
export type CommandStatus = 'idle' | 'sending' | 'acknowledged' | 'failed' | 'timeout';

export type NodeId = 
  | 'N01' // Server ESP32-WROOM-32UE
  | 'N02' // Agriculture + Crop Manager ESP32-WROOM-32UE
  | 'N03' // Power ESP32-WROOM-32UE
  | 'N04' // Roof & Perimeter ESP32-WROOM-32UE
  | 'N05' // TFT HMI ESP32-WROOM-32UE
  | 'N06' // Security Camera ESP32-AI Thinker CAM
  | 'N07' // Crop Camera ESP32-AI Thinker CAM
  | 'N08'; // Arduino Nano Power Controller

export interface NodeStatus {
  nodeId: NodeId;
  name: string;
  role: string;
  controllerMcu: string;
  online: boolean;
  uptimeSeconds: number;
  firmwareVersion: string;
  freeHeapBytes?: number;
  supplyStatus: 'nominal' | 'warning' | 'fault';
  errorCount: number;
  lastHeartbeat: string;
  lastSensorUpdate?: string;
}

export interface SoilZoneReading {
  zone: 1 | 2 | 3 | 4;
  moisture: number; // percentage 0-100%
  rawAdc?: number;
  sensorStatus: 'online' | 'fault' | 'offline';
  lastUpdate: string;
  history?: { timestamp: string; moisture: number }[];
}

export interface EnvironmentTelemetry {
  temperature: number; // °C
  humidity: number; // %
  lightLux: number; // Lux
  rainDetected: boolean;
  rawRainValue?: number;
  lastUpdate: string;
}

export interface WaterTelemetry {
  tankLevelPercent: number; // 0-100%
  tankDepthCm: number;
  pumpState: boolean;
  solenoidState: boolean;
  humidifierState: boolean;
  lightingState: boolean;
  lowWaterInterlock: boolean;
  lastUpdate: string;
}

export interface PowerTelemetry {
  solarVoltage: number; // V
  solarCurrent: number; // A
  solarPower: number; // W
  dailySolarKwh: number;
  batteryVoltage: number; // V
  batteryCurrent: number; // A
  batterySoc: number; // %
  batteryState: 'charging' | 'discharging' | 'float' | 'standby' | 'critical';
  isLowBattery: boolean;
  gridVoltage: number; // V
  gridCurrent: number; // A
  gridPower: number; // W
  todayGridKwh: number;
  gridAvailable: boolean;
  activeSource: PowerSource;
  sourcePriority: 'solar_first' | 'battery_backup' | 'grid_fallback';
  lastUpdate: string;
}

export type PerimeterZoneStatus = 'normal' | 'triggered' | 'fault';
export type AlarmState = 'ARMED' | 'DISARMED' | 'ALERT';

export interface SecurityTelemetry {
  pirDetected: boolean;
  perimeterZones: {
    zone1: PerimeterZoneStatus;
    zone2: PerimeterZoneStatus;
    zone3: PerimeterZoneStatus;
    zone4: PerimeterZoneStatus;
  };
  alarmState: AlarmState;
  sirenActive: boolean;
  lastMotionTimestamp?: string;
  lastEventDescription?: string;
  lastUpdate: string;
}

export type RoofState = 'CLOSED' | 'OPEN' | 'OPENING' | 'CLOSING' | 'STOPPED' | 'FAULT' | 'OFFLINE';

export interface RoofTelemetry {
  state: RoofState;
  limitSwitchOpen: boolean;
  limitSwitchClosed: boolean;
  rainDetected: boolean;
  autoCloseOnRain: boolean;
  motorCurrentMa?: number;
  lastCommandTimestamp?: string;
  lastUpdate: string;
  faultReason?: string;
}

export interface CameraTelemetry {
  id: 'N06_SECURITY' | 'N07_CROP';
  name: string;
  online: boolean;
  streamState: 'online' | 'offline' | 'connecting';
  panAngle?: number; // 0-180°
  tiltAngle?: number; // 0-90°
  isRecording?: boolean;
  ipAddress?: string;
  streamUrl?: string;
  lastSnapshotUrl?: string;
  lastUpdate: string;
}

export interface NetworkTelemetry {
  activeInterface: NetworkInterface;
  lanConnected: boolean;
  wifiConnected: boolean;
  cellularConnected: boolean;
  signalQualityPercent: number;
  ipAddress: string;
  macAddress: string;
  syncState: 'synced' | 'syncing' | 'queued_offline' | 'failed';
  offlineQueueCount: number;
  lastStateChange: string;
}

export type GrowthStage = 
  | 'Germination'
  | 'Seedling'
  | 'Vegetative'
  | 'Flowering'
  | 'Fruiting'
  | 'Maturation'
  | 'Harvest';

export interface CropTask {
  id: string;
  cropId: string;
  title: string;
  description?: string;
  taskType: 'fertilization' | 'irrigation' | 'inspection' | 'pruning' | 'pest_control' | 'harvest' | 'general';
  scheduledDay?: number;
  dueDate: string;
  status: 'pending' | 'completed' | 'skipped' | 'overdue';
  completedAt?: string;
}

export interface CropImage {
  id: string;
  cropId: string;
  imageUrl: string;
  thumbnailUrl?: string;
  captureDate: string;
  dayNumber: number;
  growthStage: GrowthStage;
  engineeringHealthScore: number;
  leafGreennessIndex?: number;
  illuminationLux?: number;
  notes?: string;
}

export interface Crop {
  id: string;
  name: string;
  variety?: string;
  fieldName: string;
  plantingDate: string;
  expectedHarvest: string;
  growthStage: GrowthStage;
  currentDay: number;
  healthScore: number; // 0-100% Engineering indicator
  todayTask: string;
  nextTask: string;
  nextTaskInDays: number;
  status: 'active' | 'harvested' | 'archived';
  notes?: string;
  tasks?: CropTask[];
  images?: CropImage[];
  createdAt: string;
}

export interface FarmEvent {
  id: string;
  timestamp: string;
  eventType: 
    | 'NODE_ONLINE'
    | 'NODE_OFFLINE'
    | 'LOW_BATTERY'
    | 'POWER_SOURCE_CHANGED'
    | 'RAIN_DETECTED'
    | 'ROOF_CLOSED'
    | 'ROOF_OPENED'
    | 'ROOF_STOPPED'
    | 'MOTION_DETECTED'
    | 'PERIMETER_ZONE_TRIGGERED'
    | 'PUMP_ON'
    | 'PUMP_OFF'
    | 'SOLENOID_ON'
    | 'SOLENOID_OFF'
    | 'CROP_TASK_DUE'
    | 'CROP_TASK_COMPLETED'
    | 'CAMERA_ONLINE'
    | 'CAMERA_OFFLINE'
    | 'NETWORK_CHANGED'
    | 'OFFLINE_STARTED'
    | 'SYNC_COMPLETED'
    | 'SD_FULL'
    | 'SENSOR_FAULT'
    | 'COMMUNICATION_ERROR';
  nodeId?: NodeId;
  severity: 'info' | 'warning' | 'critical';
  description: string;
  status: 'logged' | 'acknowledged' | 'resolved';
}

export interface HardwareCommandLog {
  id: string;
  target: string;
  action: string;
  payload?: any;
  status: CommandStatus;
  sentAt: string;
  acknowledgedAt?: string;
  error?: string;
}

export interface SystemSettings {
  farmName: string;
  moistureLowThreshold: number;
  moistureHighThreshold: number;
  temperatureHighThreshold: number;
  tankLowThreshold: number;
  autoIrrigationEnabled: boolean;
  autoRoofRainProtection: boolean;
  autoSolarTracking: boolean;
  securityArmed: boolean;
  cloudSyncIntervalSeconds: number;
  esp32ServerIp: string;
  esp32ApiPort: number;
  esp32WsPort: number;
  demoModeActive: boolean;
}

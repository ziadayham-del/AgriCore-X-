-- SmartAgriculture X: Complete Production Database Schema
-- Architecture target: Supabase PostgreSQL with Realtime & Row Level Security

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (User Accounts)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('admin', 'farm_manager', 'operator', 'technician', 'viewer')),
  notification_preferences JSONB DEFAULT '{"push": true, "sms": false, "email": true}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 2. Farms Table
CREATE TABLE IF NOT EXISTS farms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  timezone TEXT DEFAULT 'UTC',
  total_area_hectares NUMERIC(8, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 3. Fields / Beds Table
CREATE TABLE IF NOT EXISTS fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  zone_index INT CHECK (zone_index BETWEEN 1 AND 4),
  area_sqm NUMERIC(10, 2),
  soil_type TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 4. Crops Table
CREATE TABLE IF NOT EXISTS crops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  field_id UUID REFERENCES fields(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  variety TEXT,
  field_name TEXT NOT NULL,
  planting_date DATE NOT NULL,
  expected_harvest DATE NOT NULL,
  growth_stage TEXT NOT NULL CHECK (growth_stage IN ('Germination', 'Seedling', 'Vegetative', 'Flowering', 'Fruiting', 'Maturation', 'Harvest')),
  current_day INT NOT NULL DEFAULT 1,
  health_score NUMERIC(5, 2) NOT NULL DEFAULT 90.0,
  today_task TEXT,
  next_task TEXT,
  next_task_in_days INT DEFAULT 2,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'harvested', 'archived')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 5. Crop Tasks Table
CREATE TABLE IF NOT EXISTS crop_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crop_id UUID NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL CHECK (task_type IN ('fertilization', 'irrigation', 'inspection', 'pruning', 'pest_control', 'harvest', 'general')),
  scheduled_day INT,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped', 'overdue')),
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 6. Crop Images Table (ESP32-CAM N07 periodic growth captures)
CREATE TABLE IF NOT EXISTS crop_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crop_id UUID NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  capture_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  day_number INT,
  growth_stage TEXT,
  engineering_health_score NUMERIC(5, 2),
  leaf_greenness_index NUMERIC(5, 3),
  illumination_lux NUMERIC(8, 2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 7. Soil Readings Table (N02 Agriculture 4-zone capacitive sensors)
CREATE TABLE IF NOT EXISTS soil_readings (
  id BIGSERIAL PRIMARY KEY,
  zone INT NOT NULL CHECK (zone BETWEEN 1 AND 4),
  moisture NUMERIC(5, 2) NOT NULL,
  raw_adc INT,
  sensor_status TEXT NOT NULL DEFAULT 'online' CHECK (sensor_status IN ('online', 'fault', 'offline')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 8. Environment Readings Table (N02 Agriculture SHT31/DHT22 + BH1750 + Rain)
CREATE TABLE IF NOT EXISTS environment_readings (
  id BIGSERIAL PRIMARY KEY,
  temperature NUMERIC(5, 2) NOT NULL,
  humidity NUMERIC(5, 2) NOT NULL,
  light_lux NUMERIC(8, 1),
  rain_detected BOOLEAN NOT NULL DEFAULT false,
  raw_rain_value INT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 9. Water Status Table (N02 Water Tank level, Pump, Solenoid)
CREATE TABLE IF NOT EXISTS water_status (
  id BIGSERIAL PRIMARY KEY,
  tank_level_percent NUMERIC(5, 2) NOT NULL,
  tank_depth_cm NUMERIC(6, 2),
  pump_state BOOLEAN NOT NULL DEFAULT false,
  solenoid_state BOOLEAN NOT NULL DEFAULT false,
  humidifier_state BOOLEAN NOT NULL DEFAULT false,
  lighting_state BOOLEAN NOT NULL DEFAULT false,
  low_water_interlock BOOLEAN NOT NULL DEFAULT false,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 10. Irrigation Commands Table
CREATE TABLE IF NOT EXISTS irrigation_commands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  target_device TEXT NOT NULL CHECK (target_device IN ('pump', 'solenoid', 'humidifier', 'lighting')),
  requested_state BOOLEAN NOT NULL,
  current_state BOOLEAN,
  status TEXT NOT NULL DEFAULT 'sending' CHECK (status IN ('idle', 'sending', 'acknowledged', 'failed', 'timeout')),
  issued_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 11. Power Readings Table (N03 Hybrid Power ESP32 + N08 Arduino Nano)
CREATE TABLE IF NOT EXISTS power_readings (
  id BIGSERIAL PRIMARY KEY,
  solar_voltage NUMERIC(6, 2) NOT NULL,
  solar_current NUMERIC(6, 2) NOT NULL,
  solar_power NUMERIC(8, 2) NOT NULL,
  daily_solar_kwh NUMERIC(8, 3) NOT NULL DEFAULT 0.0,
  active_source TEXT NOT NULL CHECK (active_source IN ('solar', 'battery', 'grid')),
  source_priority TEXT NOT NULL DEFAULT 'solar_first',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 12. Battery Readings Table
CREATE TABLE IF NOT EXISTS battery_readings (
  id BIGSERIAL PRIMARY KEY,
  battery_voltage NUMERIC(5, 2) NOT NULL,
  battery_current NUMERIC(5, 2) NOT NULL,
  battery_soc_percent NUMERIC(5, 2) NOT NULL,
  battery_state TEXT NOT NULL CHECK (battery_state IN ('charging', 'discharging', 'float', 'standby', 'critical')),
  is_low_battery BOOLEAN NOT NULL DEFAULT false,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 13. Grid Readings Table
CREATE TABLE IF NOT EXISTS grid_readings (
  id BIGSERIAL PRIMARY KEY,
  grid_voltage NUMERIC(6, 2),
  grid_current NUMERIC(6, 2),
  grid_power NUMERIC(8, 2),
  today_grid_kwh NUMERIC(8, 3) DEFAULT 0.0,
  grid_available BOOLEAN NOT NULL DEFAULT true,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 14. Security Events Table
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL CHECK (event_type IN ('MOTION_DETECTED', 'PERIMETER_ZONE_TRIGGERED', 'ALARM_TRIGGERED', 'ALARM_DISARMED', 'ALARM_ARMED', 'TAMPER_DETECTED', 'CAMERA_OFFLINE', 'CAMERA_ONLINE')),
  zone INT CHECK (zone BETWEEN 1 AND 4),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  description TEXT NOT NULL,
  snapshot_url TEXT,
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 15. Perimeter Status Table (N04 4 optical laser beam receiver zones)
CREATE TABLE IF NOT EXISTS perimeter_status (
  id BIGSERIAL PRIMARY KEY,
  zone_1_status TEXT NOT NULL CHECK (zone_1_status IN ('normal', 'triggered', 'fault')),
  zone_2_status TEXT NOT NULL CHECK (zone_2_status IN ('normal', 'triggered', 'fault')),
  zone_3_status TEXT NOT NULL CHECK (zone_3_status IN ('normal', 'triggered', 'fault')),
  zone_4_status TEXT NOT NULL CHECK (zone_4_status IN ('normal', 'triggered', 'fault')),
  pir_motion_detected BOOLEAN NOT NULL DEFAULT false,
  alarm_state TEXT NOT NULL CHECK (alarm_state IN ('ARMED', 'DISARMED', 'ALERT')),
  siren_active BOOLEAN NOT NULL DEFAULT false,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 16. Camera Status Table (N06 Security Pan/Tilt & N07 Crop Camera)
CREATE TABLE IF NOT EXISTS camera_status (
  id BIGSERIAL PRIMARY KEY,
  camera_id TEXT NOT NULL CHECK (camera_id IN ('N06_SECURITY', 'N07_CROP')),
  online BOOLEAN NOT NULL DEFAULT true,
  stream_state TEXT NOT NULL CHECK (stream_state IN ('online', 'offline', 'connecting')),
  pan_angle INT DEFAULT 90,
  tilt_angle INT DEFAULT 45,
  is_recording BOOLEAN NOT NULL DEFAULT false,
  ip_address TEXT,
  last_snapshot_url TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 17. Camera Commands Table
CREATE TABLE IF NOT EXISTS camera_commands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  camera_id TEXT NOT NULL DEFAULT 'N06_SECURITY',
  command TEXT NOT NULL CHECK (command IN ('pan_left', 'pan_right', 'tilt_up', 'tilt_down', 'center', 'home', 'reset', 'set_angle', 'capture_image', 'start_record', 'stop_record')),
  params JSONB,
  status TEXT NOT NULL DEFAULT 'sending' CHECK (status IN ('idle', 'sending', 'acknowledged', 'failed', 'timeout')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  acknowledged_at TIMESTAMPTZ
);

-- 18. Roof Status Table (N04 Automatic Roof with N20 motor and limit switches)
CREATE TABLE IF NOT EXISTS roof_status (
  id BIGSERIAL PRIMARY KEY,
  state TEXT NOT NULL CHECK (state IN ('OPEN', 'CLOSED', 'OPENING', 'CLOSING', 'STOPPED', 'FAULT')),
  limit_switch_open BOOLEAN NOT NULL DEFAULT false,
  limit_switch_closed BOOLEAN NOT NULL DEFAULT true,
  rain_detected BOOLEAN NOT NULL DEFAULT false,
  auto_close_on_rain BOOLEAN NOT NULL DEFAULT true,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 19. Roof Commands Table
CREATE TABLE IF NOT EXISTS roof_commands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  command TEXT NOT NULL CHECK (command IN ('OPEN', 'CLOSE', 'STOP')),
  status TEXT NOT NULL DEFAULT 'sending' CHECK (status IN ('idle', 'sending', 'acknowledged', 'failed', 'timeout')),
  safety_interlock_applied BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  acknowledged_at TIMESTAMPTZ
);

-- 20. Tracker Status Table (N04 Dual-Axis Solar Tracker with 4 LDRs and Servos)
CREATE TABLE IF NOT EXISTS tracker_status (
  id BIGSERIAL PRIMARY KEY,
  horizontal_angle INT NOT NULL DEFAULT 90,
  vertical_angle INT NOT NULL DEFAULT 45,
  ldr_top_left INT,
  ldr_top_right INT,
  ldr_bottom_left INT,
  ldr_bottom_right INT,
  mode TEXT NOT NULL CHECK (mode IN ('AUTO', 'MANUAL', 'CALIBRATING', 'PARKED')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 21. Tracker Commands Table
CREATE TABLE IF NOT EXISTS tracker_commands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  command TEXT NOT NULL CHECK (command IN ('left', 'right', 'up', 'down', 'center', 'set_mode', 'calibrate')),
  params JSONB,
  status TEXT NOT NULL DEFAULT 'sending' CHECK (status IN ('idle', 'sending', 'acknowledged', 'failed', 'timeout')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  acknowledged_at TIMESTAMPTZ
);

-- 22. Node Status Table (Controller Health: N01 - N08)
CREATE TABLE IF NOT EXISTS node_status (
  node_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  controller_mcu TEXT NOT NULL,
  online BOOLEAN NOT NULL DEFAULT true,
  uptime_seconds BIGINT NOT NULL DEFAULT 0,
  firmware_version TEXT NOT NULL,
  free_heap_bytes INT,
  supply_status TEXT NOT NULL DEFAULT 'nominal',
  error_count INT NOT NULL DEFAULT 0,
  last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  last_sensor_update TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 23. Network Status Table (Priority: LAN > Wi-Fi > 4G > Offline)
CREATE TABLE IF NOT EXISTS network_status (
  id BIGSERIAL PRIMARY KEY,
  active_interface TEXT NOT NULL CHECK (active_interface IN ('LAN', 'Wi-Fi', '4G', 'Offline')),
  lan_connected BOOLEAN NOT NULL DEFAULT false,
  wifi_connected BOOLEAN NOT NULL DEFAULT true,
  cellular_connected BOOLEAN NOT NULL DEFAULT false,
  signal_quality_percent INT,
  ip_address TEXT,
  mac_address TEXT,
  sync_state TEXT NOT NULL CHECK (sync_state IN ('synced', 'syncing', 'queued_offline', 'failed')),
  offline_queue_count INT NOT NULL DEFAULT 0,
  last_state_change TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 24. System Events Table (Unified audit/event log)
CREATE TABLE IF NOT EXISTS system_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  event_type TEXT NOT NULL,
  node_id TEXT REFERENCES node_status(node_id),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  description TEXT NOT NULL,
  metadata JSONB,
  status TEXT NOT NULL DEFAULT 'logged' CHECK (status IN ('logged', 'acknowledged', 'resolved'))
);

-- 25. Settings Table
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farm_name TEXT NOT NULL DEFAULT 'SmartAgriculture Green Horizon',
  moisture_low_threshold NUMERIC(5, 2) NOT NULL DEFAULT 35.0,
  moisture_high_threshold NUMERIC(5, 2) NOT NULL DEFAULT 75.0,
  temperature_high_threshold NUMERIC(5, 2) NOT NULL DEFAULT 35.0,
  tank_low_threshold NUMERIC(5, 2) NOT NULL DEFAULT 20.0,
  auto_irrigation_enabled BOOLEAN NOT NULL DEFAULT true,
  auto_roof_rain_protection BOOLEAN NOT NULL DEFAULT true,
  auto_solar_tracking BOOLEAN NOT NULL DEFAULT true,
  security_armed BOOLEAN NOT NULL DEFAULT true,
  cloud_sync_interval_seconds INT NOT NULL DEFAULT 10,
  esp32_server_ip TEXT NOT NULL DEFAULT '192.168.1.100',
  esp32_api_port INT NOT NULL DEFAULT 80,
  esp32_ws_port INT NOT NULL DEFAULT 81,
  demo_mode_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Performance Indexes on Telemetry & Events
CREATE INDEX IF NOT EXISTS idx_soil_readings_zone_time ON soil_readings(zone, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_env_readings_time ON environment_readings(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_water_status_time ON water_status(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_power_readings_time ON power_readings(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_time ON security_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_events_time ON system_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_crops_field ON crops(field_id);
CREATE INDEX IF NOT EXISTS idx_crop_tasks_crop ON crop_tasks(crop_id, due_date);

-- Row Level Security (RLS) Configuration
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE soil_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE environment_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE irrigation_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE power_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE battery_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE grid_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE perimeter_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE camera_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE camera_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE roof_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE roof_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracker_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracker_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE node_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Standard Policies: Authenticated users can read and insert telemetry & commands
CREATE POLICY "Allow authenticated read on all tables" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read farms" ON farms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read fields" ON fields FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read crops" ON crops FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read crop_tasks" ON crop_tasks FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read crop_images" ON crop_images FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read soil" ON soil_readings FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read env" ON environment_readings FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read water" ON water_status FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read irrigation_commands" ON irrigation_commands FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read power" ON power_readings FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read battery" ON battery_readings FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read grid" ON grid_readings FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read security_events" ON security_events FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read perimeter_status" ON perimeter_status FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read camera_status" ON camera_status FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read camera_commands" ON camera_commands FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read roof_status" ON roof_status FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read roof_commands" ON roof_commands FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read tracker_status" ON tracker_status FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read tracker_commands" ON tracker_commands FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read node_status" ON node_status FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read network_status" ON network_status FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read system_events" ON system_events FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read settings" ON settings FOR ALL TO authenticated USING (true);

-- Initial Hardware Seed Data (All 8 Nodes from System Design Document)
INSERT INTO node_status (node_id, name, role, controller_mcu, online, uptime_seconds, firmware_version, free_heap_bytes, supply_status, error_count)
VALUES
  ('N01', 'Server Coordinator', 'Central Server, Network Manager, SD Logger, API & RS-485 Router', 'ESP32-WROOM-32UE', true, 184320, 'v1.4.2-rel', 165400, 'nominal', 0),
  ('N02', 'Agriculture & Crop Manager', 'Soil, SHT31, Tank, Relays, Crop Advisory Engine', 'ESP32-WROOM-32UE', true, 184318, 'v1.4.2-rel', 142100, 'nominal', 0),
  ('N03', 'Hybrid Power Node', 'Solar, Battery, Grid telemetry & Nano failover bus', 'ESP32-WROOM-32UE', true, 184315, 'v1.4.2-rel', 158900, 'nominal', 0),
  ('N04', 'Roof, Tracker & Perimeter', 'N20 DC Motor, Limit Switches, Dual Servos, 4-Beam Optical Laser', 'ESP32-WROOM-32UE', true, 184310, 'v1.4.2-rel', 139800, 'nominal', 0),
  ('N05', 'TFT Local HMI', '3.2-inch SPI Display & 7-Button Physical Console', 'ESP32-WROOM-32UE', true, 184290, 'v1.4.2-rel', 188200, 'nominal', 0),
  ('N06', 'Security Camera', 'Pan/Tilt Servos, PIR motion detection, RTSP/H.264 IP Stream', 'ESP32-AI Thinker CAM', true, 184250, 'v1.3.8-cam', 98400, 'nominal', 0),
  ('N07', 'Crop Camera', 'Fixed Macro Framing, Periodic Image Capture, Time-lapse', 'ESP32-AI Thinker CAM', true, 184240, 'v1.3.8-cam', 104200, 'nominal', 0),
  ('N08', 'Arduino Nano Relay', 'Dedicated failover and isolation relay controller', 'Arduino Nano (ATmega328P)', true, 184325, 'v1.1.0-nano', 1024, 'nominal', 0)
ON CONFLICT (node_id) DO NOTHING;

-- Initial Settings Seed
INSERT INTO settings (farm_name, moisture_low_threshold, moisture_high_threshold, temperature_high_threshold, tank_low_threshold, auto_irrigation_enabled, auto_roof_rain_protection, auto_solar_tracking, security_armed, demo_mode_active)
VALUES ('SmartAgriculture X Demo Farm', 35.0, 75.0, 35.0, 20.0, true, true, true, true, true)
ON CONFLICT DO NOTHING;

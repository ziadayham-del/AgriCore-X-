# AgriCore-X 🌾⚡

> **Distributed Smart Agriculture, Renewable Energy & Precision Security Management Platform**

[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Database_%26_Realtime-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![Groq AI](https://img.shields.io/badge/Groq_AI-LPU_Inference-F05A28?style=flat)](https://groq.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🌟 Overview

**AgriCore-X** is an enterprise-grade IoT precision farming and perimeter security command dashboard. It connects distributed edge microcontroller nodes (ESP32 / Arduino) communicating over an industrial **3.3V RS-485 differential field bus**, synchronizes telemetry with **Supabase PostgreSQL & Realtime**, and delivers instant agronomic intelligence via **Groq Cloud AI LPU inference**.

---

## 🏗️ System Architecture

```text
               SMARTPHONE / TABLET / WORKSTATION (React SPA Console)
                                       │
                                       ▼ HTTPS / WebSocket / REST
┌─────────────────────────────────────────────────────────────────────────────┐
│                     SERVER ESP32-WROOM-32UE (Node N01)                      │
│   Central Controller • MicroSD Telemetry Logger • DS3231 Precision RTC      │
│   RS-485 Bus Master • Network Failover Manager (Ethernet W5500 / Wi-Fi / LTE)│
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Industrial RS-485 Differential Bus
       ┌───────────────────────────────┼───────────────────────────────┐
┌──────▼────────┐              ┌───────▼───────┐               ┌───────▼───────┐
│ N02 AGRI NODE │              │ N03 POWER     │               │ N04 ROOF/TRK  │
│ 4-Zone Soil   │              │ Solar MPPT    │               │ N20 Canopy    │
│ SHT31 Air / RH│              │ 12V Battery   │               │ Dual Tracker  │
│ Relays & Pump │              │ Grid Monitor  │               │ Laser Beams   │
└──────┬────────┘              └───────┬───────┘               └───────┬───────┘
       │                               │                               │
       │                               ▼                               ▼
       │                       ┌───────────────┐               ┌───────────────┐
       │                       │ N06 PTZ CAM   │               │ N07 CROP CAM  │
       │                       │ Dual Servos   │               │ Time-Lapse    │
       │                       │ PIR Sensor    │               │ Macro Growth  │
       │                       └───────────────┘               └───────────────┘
       ▼
┌───────────────┐
│ N08 WATCHDOG  │
│ Arduino Nano  │
│ Relay Monitor │
└───────────────┘
```

### Hardware Controller Nodes:

| Node ID | Controller | Role & Peripherals | Bus Address |
| :--- | :--- | :--- | :--- |
| **N01** | ESP32-WROOM-32UE | **Central Server Master**: SD Logger, RTC DS3231, W5500 LAN, Wi-Fi AP | `0x01` |
| **N02** | ESP32-WROOM-32 | **Agriculture & Irrigation**: 4x Capacitive Soil Probes, SHT31, Water Tank Sensor, 4x Relays | `0x02` |
| **N03** | ESP32-WROOM-32 | **Hybrid Microgrid**: Solar PV MPPT telemetry, 12V LiFePO4 battery BMS, AC Mains monitor | `0x03` |
| **N04** | ESP32-WROOM-32 | **Actuators & Perimeter**: N20 roof motor, limit switches, dual-axis solar tracker, 4x laser beams | `0x04` |
| **N06** | ESP32-CAM | **Security Surveillance**: RTSP 1080p stream, -180°..+180° Pan & -90°..+90° Tilt Gimbal, PIR | `0x06` |
| **N07** | ESP32-CAM | **Crop Phenology Imaging**: Macro plant canopy photography, chronological time-lapse archive | `0x07` |
| **N08** | Arduino Nano | **Hardware Watchdog**: Secondary failover interlock and galvanic isolation relay | `0x08` |

---

## 🚀 Key Features

### 1. Dual-Axis PTZ Camera Gimbal Controls
* **Precision Pan Slider**: Range **-180° to +180°** with zero center at **0°**, calibrated ticks at -180°, -90°, 0°, +90°, +180°, and dual-direction emerald fill.
* **Precision Tilt Slider**: Range **-90° to +90°** with zero center at **0°**, calibrated ticks at -90°, -45°, 0°, +45°, +90°.
* **Smooth Viewport Motion Sync**: Real-time 3D perspective gimbal tilt and panoramic tracking directly in the live camera preview.
* **Ergonomic Control**: Pointer-capture drag, keyboard arrow keys (5° standard, 1° with Shift), double-click to center, and quick 1-click survey presets.

### 2. Closed-Loop Industrial IoT Equipment Controls
* **Green POWER ON & Red POWER OFF**: Visually distinct state buttons with active glowing highlights and tactile press micro-interactions.
* **Strict Command Confirmation Lifecycle**:
  ```text
  User Click ➔ [Sending command...] ➔ [Command acknowledged] ➔ [● POWER ON / OFF]
  ```
  If hardware interlock triggers or controller fails:
  ```text
  [Command failed • Device state not confirmed] (displays specific interlock reason)
  ```
* Integrated across:
  * **Irrigation Pump Motor** (with dry-run reservoir cutoff interlock)
  * **Zone Solenoid Valve** (12V pressurized drip header)
  * **Micro-Mist Humidifier** (ultrasonic vapor pressure deficit balancing)
  * **Supplemental Grow Lighting** (full-spectrum PAR LED arrays)
  * **Perimeter Intrusion System** (4-zone optical laser beam interlock)
  * **Acoustic Warning Siren** (12V 110dB piezo intrusion alarm)

### 3. Groq AI Agronomic Advisory
* High-speed LPU inference proxy powered by `openai/gpt-oss-20b` via server-side Express API.
* Synthesizes live soil moisture across 4 zones, canopy air temperature, and relative humidity to generate precision irrigation dosage, fertilizer adjustment, and fungal risk alerts.

---

## 🛠️ Quickstart & Local Setup

### Prerequisites
* **Node.js** v18.0.0 or later
* **npm** v9.0.0 or later (or `pnpm` / `yarn`)

### 1. Clone the Repository
```bash
git clone https://github.com/<YOUR_USERNAME>/agricore-x.git
cd agricore-x
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy the template file to `.env`:
```bash
cp .env.example .env
```
Open `.env` and fill in your credentials:
```env
VITE_SUPABASE_PROJECT_ID="your_supabase_project_id"
VITE_SUPABASE_URL="https://your_supabase_project_id.supabase.co"
VITE_SUPABASE_ANON_KEY="your_supabase_anon_key"
GROQ_API_KEY="your_groq_api_key"
VITE_DEMO_MODE="true"
```

### 4. Start Development Server
```bash
npm run dev
```
The application will launch at **`http://localhost:3000`**.

### 5. Build for Production
```bash
npm run build
```

---

## 📤 Pushing to GitHub

Follow these steps to push this project to a new repository on your GitHub account:

### Step 1: Create a New GitHub Repository
1. Go to [GitHub New Repository](https://github.com/new).
2. Choose a repository name (e.g., `agricore-x`).
3. Set the repository to **Public** or **Private**.
4. **Do NOT** initialize with a README, .gitignore, or license (these are already configured in this repository).
5. Click **Create repository**.

### Step 2: Commit Changes
```bash
git add .
git commit -m "chore: remove TFT HMI module and update branding to AgriCore-X"
```

### Step 3: Link Remote & Push
```bash
# Add your GitHub remote URL
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPOSITORY_NAME>.git

# Push main branch
git push -u origin main
```

---

## 📂 Project Structure

```text
agricore-x/
├── .env.example              # Clean environment template (safe for commit)
├── .gitignore                # Production ignore rules (protects .env and secrets)
├── package.json              # NPM dependencies and scripts
├── server.ts                 # Full-stack Express server & Groq AI proxy
├── vite.config.ts            # Vite 6 configuration & plugins
├── src/
│   ├── api/                  # Hardware & camera abstraction API layer
│   │   ├── agricultureApi.ts
│   │   ├── cameraApi.ts
│   │   └── securityApi.ts
│   ├── components/
│   │   ├── camera/
│   │   │   └── PtzSlider.tsx # Broadcast-grade dual horizontal sliding controls
│   │   ├── common/
│   │   │   ├── PowerControlCard.tsx # Industrial Green ON / Red OFF control cards
│   │   │   ├── ToggleControl.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   └── MetricCard.tsx
│   │   ├── dashboard/        # Soil matrix, energy flow, & tank level gauges
│   │   └── layout/           # Sidebar, navigation, & header components
│   ├── hooks/                # Telemetry state & hardware hooks
│   ├── pages/
│   │   ├── Dashboard.tsx     # Central farm telemetry command center
│   │   ├── Agriculture.tsx   # Soil probes & Power ON/OFF actuator controls
│   │   ├── CropDetails.tsx   # Phenology timeline & Groq AI agronomic engine
│   │   ├── PanTilt.tsx       # Dual-slider PTZ camera gimbal control console
│   │   ├── Cameras.tsx       # IP camera streams & snapshot gallery
│   │   ├── Power.tsx         # Solar PV, battery BMS, & energy flow diagram
│   │   ├── RoofTracker.tsx   # Motorized canopy & dual-axis sun tracker
│   │   ├── Security.tsx      # Optical laser perimeter & acoustic siren
│   │   └── System.tsx        # Node RS-485 bus diagnostics & health matrix
│   └── services/
│       ├── hardware.ts       # Closed-loop hardware state machine
│       ├── commandService.ts # RS-485 packet router with CRC validation
│       └── supabase.ts       # Supabase client & table subscriptions
└── supabase/
    └── migrations/           # 25 normalized PostgreSQL schema tables & RLS
```

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

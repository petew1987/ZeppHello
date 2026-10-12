# Aurora Tracker - Zepp OS Mini-App for Amazfit Active 3 Premium

A real-time Aurora Borealis & Australis prediction mini-app designed for the **Amazfit Active 3 Premium** (Round 466x466 AMOLED screen) running Zepp OS 3.0 / 2.x.

## Project Structure
```text
aurora-tracker/
├── app.json            # Zepp OS Manifest, permissions (GPS, network), round-466 target & module paths
├── page/
│   └── index.js        # Watch UI (zero-overlap 466x466 layout, interactive location switcher, arc gauge)
├── app-side/
│   └── index.js        # Companion Service (runs on phone Zepp app, queries NOAA & Open-Meteo APIs)
└── setting/
    └── index.js        # Phone Settings App (runs in Zepp App on Android & iOS via settingsStorage)
```

## Key Features & Compatibility

### 1. Zero UI Overlap on 466x466 AMOLED Screen
Every visual element has an explicit, non-overlapping coordinate window tailored for circular geometry:
- **Title (`y: 36, h: 18`)**: `"AURORA TRACKER"`
- **Location Switcher Pill (`y: 58, h: 32, w: 260`)**: Interactive button. Tapping cycles between live GPS and phone-saved locations.
- **Viewing Probability Counter (`y: 96, h: 54`)**: Proportional 54px bold font with dynamic color coding (Emerald/Cyan/Amber/Red).
- **Status Banner (`y: 152, h: 22`)**: `"VERY HIGH CHANCE"`, `"CLOUDY (BLOCKED)"`, etc.
- **Space Weather & Cloud Metric Cards (`y: 180, h: 48`)**: Left card for Planetary Kp Index, Right card for Cloud Cover percentage.
- **Guidance Text (`y: 236, h: 40`)**: Horizon direction and visibility conditions.
- **Refresh Button (`y: 286, h: 46`)**: Pill action button restarting the fetch sequence.
- **Footer (`y: 342, h: 18`)**: Last updated timestamp and space weather status, leaving over 100px of safe circular bezel margin at the bottom.

### 2. Saved Locations via Phone Zepp App (`setting/index.js`)
Configured according to the official Zepp OS Settings documentation:
- Uses `AppSettingsPage` with `settingsStorage`.
- Users can manage target locations in the **Zepp App on Android or iOS**:
  - Select between **Live Watch GPS** or any saved location.
  - Add custom locations with Name, Latitude (°N), and Longitude (°E/W).
  - Delete or reorder locations.
- Any change saved on the phone immediately synchronizes with `app-side/index.js` and can be cycled directly from the watch face!

### 3. Real-Time Space Weather & Cloud Model
- Queries NOAA SWPC Planetary K-Index (`https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json`).
- Queries Open-Meteo Cloud Cover (`https://api.open-meteo.com/v1/forecast?latitude=...&current=cloud_cover`).
- Calculates geomagnetic latitude relative to the North Geomagnetic Pole ($80.5^\circ\text{N}, 72.6^\circ\text{W}$) and checks intersection with the auroral oval equatorward boundary.

## How to Build & Deploy to Amazfit Active 3 Premium
1. **Install Zepp CLI:**
   ```bash
   npm install -g @zeppos/zepp-cli
   ```
2. **Login to Zepp Account:**
   ```bash
   zepp login
   ```
3. **Start Dev Server:**
   ```bash
   zepp dev
   ```
4. **Wireless Installation:**
   In the **Zepp App** on your Android or iOS smartphone:
   - Go to **Profile > Amazfit Active 3 > Developer Mode**
   - Scan the terminal QR code to install wirelessly over Bluetooth!

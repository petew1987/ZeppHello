/**
 * Real-time Space Weather & Atmospheric Model Simulator
 * Mirrors the exact logic used in app-side/index.js
 */

export interface HourlyForecast {
  hour: string;        // e.g. "21:00" or "+1h"
  offsetHours: number; // 1 to 10
  kp: number;
  clouds: number;
  chance: number;
}

export interface AuroraForecastResult {
  kp: number;
  clouds: number;
  chancePercent: number;
  textGuidance: string;
  locationText: string;
  geomagneticLat: number;
  stormLevel: string;
  equatorwardBoundary: number;
  timestamp: string;
  hourlyForecast?: HourlyForecast[];
}

export interface PresetLocation {
  id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  flag: string;
  description: string;
}

export const PRESET_LOCATIONS: PresetLocation[] = [
  {
    id: 'tromso',
    name: 'Tromsø',
    country: 'Norway',
    lat: 69.6492,
    lon: 18.9553,
    flag: '🇳🇴',
    description: 'Inside the auroral oval. Prime Arctic viewing destination.'
  },
  {
    id: 'reykjavik',
    name: 'Reykjavík',
    country: 'Iceland',
    lat: 64.1466,
    lon: -21.9426,
    flag: '🇮🇸',
    description: 'High geomagnetic latitude; regular displays during dark winter nights.'
  },
  {
    id: 'fairbanks',
    name: 'Fairbanks',
    country: 'Alaska, USA',
    lat: 64.8378,
    lon: -147.7164,
    flag: '🇺🇸',
    description: 'Directly under the auroral band; low light pollution inland.'
  },
  {
    id: 'yellowknife',
    name: 'Yellowknife',
    country: 'Canada',
    lat: 62.4540,
    lon: -114.3718,
    flag: '🇨🇦',
    description: 'Extremely high geomagnetic latitude due to North magnetic pole tilt.'
  },
  {
    id: 'abisko',
    name: 'Abisko',
    country: 'Sweden',
    lat: 68.3495,
    lon: 18.8312,
    flag: '🇸🇪',
    description: 'Renowned "Blue Hole" microclimate offering cloud-free skies.'
  },
  {
    id: 'rovaniemi',
    name: 'Rovaniemi',
    country: 'Finland',
    lat: 66.5039,
    lon: 25.7294,
    flag: '🇫🇮',
    description: 'Lapland Arctic circle hub with active displays from Kp 2+.'
  },
  {
    id: 'edinburgh',
    name: 'Edinburgh',
    country: 'Scotland, UK',
    lat: 55.9533,
    lon: -3.1883,
    flag: '🇬🇧',
    description: 'Mid-latitude. Requires Kp 5-6+ geomagnetic storm to view.'
  },
  {
    id: 'seattle',
    name: 'Seattle',
    country: 'Washington, USA',
    lat: 47.6062,
    lon: -122.3321,
    flag: '🇺🇸',
    description: 'Requires Kp 6-7+ major solar storm for horizon sighting.'
  }
];

// Earth Dipole Geomagnetic Pole approx 80.5°N, 72.6°W
const GEO_POLE_LAT = 80.5;
const GEO_POLE_LON = -72.6;

export function calculateGeomagneticLatitude(lat: number, lon: number): number {
  const d2r = Math.PI / 180.0;
  const phi = lat * d2r;
  const lambda = lon * d2r;
  const phiP = GEO_POLE_LAT * d2r;
  const lambdaP = GEO_POLE_LON * d2r;

  const sinGeomLat =
    Math.sin(phi) * Math.sin(phiP) +
    Math.cos(phi) * Math.cos(phiP) * Math.cos(lambda - lambdaP);

  const geomLatRad = Math.asin(Math.max(-1, Math.min(1, sinGeomLat)));
  return geomLatRad * (180.0 / Math.PI);
}

export async function fetchLiveNoaaKp(): Promise<number> {
  try {
    const res = await fetch('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 1) {
        const latest = data[data.length - 1];
        const val = parseFloat(latest[1]);
        if (!isNaN(val)) {
          return Math.round(val * 10) / 10;
        }
      }
    }
  } catch (err) {
    console.warn('[Simulator] NOAA Kp fetch failed, falling back:', err);
  }
  return 3.3; // Realistic active default
}

export async function fetchLiveCloudCover(lat: number, lon: number): Promise<{
  clouds: number;
  locationName: string;
  hourlyClouds?: number[];
}> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current=cloud_cover&hourly=cloud_cover&timezone=auto&forecast_hours=12`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const clouds = data?.current?.cloud_cover !== undefined ? Math.round(data.current.cloud_cover) : 30;
      let locationName = `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
      if (data?.timezone) {
        const parts = data.timezone.split('/');
        if (parts.length > 1) {
          locationName = parts[parts.length - 1].replace(/_/g, ' ');
        }
      }

      let hourlyClouds: number[] = [];
      if (data?.hourly?.cloud_cover && Array.isArray(data.hourly.cloud_cover)) {
        hourlyClouds = data.hourly.cloud_cover.slice(0, 10).map((v: number) => Math.round(v));
      }

      return { clouds, locationName, hourlyClouds };
    }
  } catch (err) {
    console.warn('[Simulator] Open-Meteo cloud cover fetch failed:', err);
  }
  return { clouds: 25, locationName: `${lat.toFixed(2)}°, ${lon.toFixed(2)}°` };
}

export function computeProbabilityForValues(geomLat: number, kp: number, clouds: number): number {
  const equatorwardBoundary = Math.max(45, 67.5 - 2.1 * kp);
  const latDelta = geomLat - equatorwardBoundary;

  let baseChance = 0;
  if (latDelta >= 3.0) {
    baseChance = Math.min(95, 65 + kp * 5);
  } else if (latDelta >= 0.0) {
    baseChance = Math.min(85, 45 + kp * 6);
  } else if (latDelta >= -4.0) {
    baseChance = Math.max(10, 25 + latDelta * 5 + kp * 3);
  } else if (latDelta >= -8.0 && kp >= 5) {
    baseChance = Math.max(5, 15 + (kp - 5) * 8);
  } else {
    baseChance = Math.max(1, Math.round(kp * 1.5));
  }

  let cloudFactor = 1.0;
  if (clouds <= 20) {
    cloudFactor = 1.0;
  } else if (clouds <= 50) {
    cloudFactor = 0.85;
  } else if (clouds <= 80) {
    cloudFactor = 0.50;
  } else {
    cloudFactor = 0.12;
  }

  return Math.min(100, Math.max(0, Math.round(baseChance * cloudFactor)));
}

export function computeAuroraProbability(
  lat: number,
  lon: number,
  kp: number,
  clouds: number,
  locationName: string,
  hourlyClouds?: number[]
): AuroraForecastResult {
  const geomLat = Math.abs(calculateGeomagneticLatitude(lat, lon));
  const equatorwardBoundary = Math.max(45, 67.5 - 2.1 * kp);
  const finalChance = computeProbabilityForValues(geomLat, kp, clouds);

  // Generate 10-Hour Forecast Series
  const currentHour = new Date().getHours();
  const hourlyForecast: HourlyForecast[] = [];

  for (let h = 1; h <= 10; h++) {
    const targetHour = (currentHour + h) % 24;
    const hourLabel = `${targetHour.toString().padStart(2, '0')}:00`;
    
    // Gradual natural space weather drift (-0.4 to +0.6 variation)
    const drift = Math.sin((h + (lat % 5)) * 0.7) * 0.5;
    const forecastKp = Math.max(0.5, Math.min(9.0, Math.round((kp + drift) * 10) / 10));

    // Cloud forecast: use real hourly if provided, or simulated smooth atmospheric drift
    const forecastClouds = hourlyClouds && hourlyClouds[h - 1] !== undefined
      ? hourlyClouds[h - 1]
      : Math.max(0, Math.min(100, Math.round(clouds + Math.cos(h * 0.8) * 12)));

    const forecastChance = computeProbabilityForValues(geomLat, forecastKp, forecastClouds);

    hourlyForecast.push({
      hour: hourLabel,
      offsetHours: h,
      kp: forecastKp,
      clouds: forecastClouds,
      chance: forecastChance
    });
  }

  let textGuidance = '';
  if (clouds > 80) {
    textGuidance = `Heavy overcast (${clouds}%) obscures celestial view. Wait for break in clouds.`;
  } else if (finalChance >= 70) {
    textGuidance = `Vibrant display expected! Look directly overhead and north.`;
  } else if (finalChance >= 40) {
    textGuidance = `Moderate chance overhead. Scan northern horizon away from city lights.`;
  } else if (finalChance >= 15) {
    textGuidance = `Faint green arc possible near northern horizon during peaks.`;
  } else {
    textGuidance = `Quiet space weather for this latitude (Kp ${kp.toFixed(1)}).`;
  }

  let stormLevel = 'G0 (Quiet)';
  if (kp >= 9) stormLevel = 'G5 (Extreme Storm)';
  else if (kp >= 8) stormLevel = 'G4 (Severe Storm)';
  else if (kp >= 7) stormLevel = 'G3 (Strong Storm)';
  else if (kp >= 6) stormLevel = 'G2 (Moderate Storm)';
  else if (kp >= 5) stormLevel = 'G1 (Minor Storm)';
  else if (kp >= 4) stormLevel = 'Active Magnetosphere';

  return {
    kp,
    clouds,
    chancePercent: finalChance,
    textGuidance,
    locationText: locationName,
    geomagneticLat: Math.round(geomLat * 10) / 10,
    stormLevel,
    equatorwardBoundary: Math.round(equatorwardBoundary * 10) / 10,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    hourlyForecast
  };
}

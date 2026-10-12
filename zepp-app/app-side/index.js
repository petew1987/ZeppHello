/**
 * Aurora Tracker - Companion Service (Zepp OS 2.x & 3.0 Compatible)
 * Runs on the companion Zepp Mobile App (Android & iOS)
 */

import { BaseSideService } from '@zeppos/zml/base-side'

const DEFAULT_PRESET_LOCATIONS = [
  { id: 'tromso', name: 'Tromsø', country: 'Norway', lat: 69.6492, lon: 18.9553 },
  { id: 'reykjavik', name: 'Reykjavík', country: 'Iceland', lat: 64.1466, lon: -21.9426 },
  { id: 'fairbanks', name: 'Fairbanks', country: 'Alaska, USA', lat: 64.8378, lon: -147.7164 },
  { id: 'yellowknife', name: 'Yellowknife', country: 'Canada', lat: 62.4540, lon: -114.3718 },
  { id: 'abisko', name: 'Abisko', country: 'Sweden', lat: 68.3495, lon: 18.8312 }
]

const GEO_POLE_LAT = 80.5
const GEO_POLE_LON = -72.6

function getSavedLocations() {
  try {
    if (typeof settingsStorage !== 'undefined') {
      const raw = settingsStorage.getItem('savedLocations')
      if (raw) {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    }
  } catch (e) {
    console.log('[AuroraAppSide] Error accessing settingsStorage:', e.message)
  }
  return DEFAULT_PRESET_LOCATIONS
}

function getActiveLocationId() {
  try {
    if (typeof settingsStorage !== 'undefined') {
      return settingsStorage.getItem('activeLocationId') || 'gps'
    }
  } catch (e) {}
  return 'gps'
}

function calculateGeomagneticLatitude(lat, lon) {
  const d2r = Math.PI / 180.0
  const phi = lat * d2r
  const lambda = lon * d2r
  const phiP = GEO_POLE_LAT * d2r
  const lambdaP = GEO_POLE_LON * d2r

  const sinGeomLat = Math.sin(phi) * Math.sin(phiP) +
                     Math.cos(phi) * Math.cos(phiP) * Math.cos(lambda - lambdaP)

  const geomLatRad = Math.asin(Math.max(-1, Math.min(1, sinGeomLat)))
  return geomLatRad * (180.0 / Math.PI)
}

async function fetchNoaaKpIndex() {
  try {
    const res = await fetch('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json')
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data) && data.length > 1) {
        const latestRow = data[data.length - 1]
        const kpVal = parseFloat(latestRow[1])
        if (!isNaN(kpVal)) return Math.round(kpVal * 10) / 10
      }
    }
  } catch (err) {}
  return 3.0
}

async function fetchCloudCoverAndForecast(lat, lon) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current=cloud_cover&hourly=cloud_cover&forecast_hours=12`
    const res = await fetch(url)
    if (res.ok) {
      const data = await res.json()
      const clouds = data && data.current && data.current.cloud_cover !== undefined
        ? Math.round(data.current.cloud_cover)
        : 30

      let hourly = []
      if (data && data.hourly && Array.isArray(data.hourly.cloud_cover)) {
        hourly = data.hourly.cloud_cover.slice(0, 10).map(v => Math.round(v))
      }
      return { clouds, hourly }
    }
  } catch (err) {}
  return { clouds: 30, hourly: [] }
}

async function resolveLocationName(lat, lon) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&timezone=auto`
    const res = await fetch(url)
    if (res.ok) {
      const data = await res.json()
      if (data && data.timezone) {
        const parts = data.timezone.split('/')
        if (parts.length > 1) return parts[parts.length - 1].replace(/_/g, ' ')
      }
    }
  } catch (e) {}
  return `${lat.toFixed(1)}°N, ${lon.toFixed(1)}°E`
}

function computeProbabilityForValues(geomLat, kp, clouds) {
  const equatorwardBoundary = Math.max(45, 67.5 - (2.1 * kp))
  let baseChance = 0
  const latDelta = geomLat - equatorwardBoundary

  if (latDelta >= 3.0) {
    baseChance = Math.min(95, 65 + (kp * 5))
  } else if (latDelta >= 0.0) {
    baseChance = Math.min(85, 45 + (kp * 6))
  } else if (latDelta >= -4.0) {
    baseChance = Math.max(10, 25 + (latDelta * 5) + (kp * 3))
  } else if (latDelta >= -8.0 && kp >= 5) {
    baseChance = Math.max(5, 15 + ((kp - 5) * 8))
  } else {
    baseChance = Math.max(1, Math.round(kp * 1.5))
  }

  let cloudFactor = 1.0
  if (clouds <= 20) cloudFactor = 1.0
  else if (clouds <= 50) cloudFactor = 0.85
  else if (clouds <= 80) cloudFactor = 0.50
  else cloudFactor = 0.12

  return Math.min(100, Math.max(0, Math.round(baseChance * cloudFactor)))
}

function computeAuroraProbability(lat, lon, kp, clouds, hourlyClouds) {
  const geomLat = Math.abs(calculateGeomagneticLatitude(lat, lon))
  const finalChance = computeProbabilityForValues(geomLat, kp, clouds)

  // Build next 10 hours forecast
  const currentHour = new Date().getHours()
  const hourlyForecast = []

  for (let h = 1; h <= 10; h++) {
    const targetHour = (currentHour + h) % 24
    const hourLabel = `${targetHour < 10 ? '0' : ''}${targetHour}:00`
    const drift = Math.sin((h + (lat % 5)) * 0.7) * 0.5
    const forecastKp = Math.max(0.5, Math.min(9.0, Math.round((kp + drift) * 10) / 10))
    const forecastClouds = hourlyClouds && hourlyClouds[h - 1] !== undefined
      ? hourlyClouds[h - 1]
      : Math.max(0, Math.min(100, Math.round(clouds + Math.cos(h * 0.8) * 12)))
    const forecastChance = computeProbabilityForValues(geomLat, forecastKp, forecastClouds)

    hourlyForecast.push({
      hour: hourLabel,
      offsetHours: h,
      kp: forecastKp,
      clouds: forecastClouds,
      chance: forecastChance
    })
  }

  let textGuidance = ''
  if (clouds > 80) textGuidance = `Heavy clouds (${clouds}%) block view. Wait for clear gap.`
  else if (finalChance >= 70) textGuidance = `Vibrant display expected! Look directly north.`
  else if (finalChance >= 40) textGuidance = `Moderate chance overhead. Scan northern horizon.`
  else if (finalChance >= 15) textGuidance = `Faint arc possible on dark horizon during peaks.`
  else textGuidance = `Quiet space weather for this latitude (Kp ${kp.toFixed(1)}).`

  let stormLevel = 'G0 (Quiet)'
  if (kp >= 9) stormLevel = 'G5 (Extreme Storm)'
  else if (kp >= 8) stormLevel = 'G4 (Severe Storm)'
  else if (kp >= 7) stormLevel = 'G3 (Strong Storm)'
  else if (kp >= 6) stormLevel = 'G2 (Moderate Storm)'
  else if (kp >= 5) stormLevel = 'G1 (Minor Storm)'
  else if (kp >= 4) stormLevel = 'Active'

  return { chancePercent: finalChance, textGuidance, stormLevel, hourlyForecast }
}

AppSideService(
  BaseSideService({
    onInit() {
      console.log('[AuroraAppSide] Companion service onInit')
    },
    async onRequest(req, res) {
      if (req.type === 'GET_LOCATIONS') {
        res(null, {
          success: true,
          data: { savedLocations: getSavedLocations(), activeLocationId: getActiveLocationId() }
        })
        return
      }

      if (req.type === 'SET_ACTIVE_LOCATION') {
        const newId = req.locationId || 'gps'
        try {
          if (typeof settingsStorage !== 'undefined') settingsStorage.setItem('activeLocationId', newId)
        } catch (e) {}
        res(null, { success: true, data: { activeLocationId: newId } })
        return
      }

      if (req.type === 'FETCH_AURORA') {
        try {
          const savedList = getSavedLocations()
          const activeId = req.locationId || getActiveLocationId()
          let lat = req.lat
          let lon = req.lon
          let locationDisplayName = ''
          let isUsingGps = false

          const matched = savedList.find(loc => loc.id === activeId)
          if (matched && activeId !== 'gps') {
            lat = matched.lat
            lon = matched.lon
            locationDisplayName = matched.name
          } else {
            isUsingGps = true
            if (lat === null || lat === undefined) {
              lat = DEFAULT_PRESET_LOCATIONS[0].lat
              lon = DEFAULT_PRESET_LOCATIONS[0].lon
              locationDisplayName = 'Tromsø (Default)'
            } else {
              locationDisplayName = `GPS: ${lat.toFixed(1)}°, ${lon.toFixed(1)}°`
            }
          }

          const [kp, meteoData, autoResolvedName] = await Promise.all([
            fetchNoaaKpIndex(),
            fetchCloudCoverAndForecast(lat, lon),
            resolveLocationName(lat, lon)
          ])

          if (isUsingGps && autoResolvedName) {
            locationDisplayName = `GPS: ${autoResolvedName}`
          }

          const rating = computeAuroraProbability(lat, lon, kp, meteoData.clouds, meteoData.hourly)
          res(null, {
            success: true,
            data: {
              kp,
              chancePercent: rating.chancePercent,
              textGuidance: rating.textGuidance,
              clouds: meteoData.clouds,
              locationText: locationDisplayName,
              activeLocationId: activeId,
              stormLevel: rating.stormLevel,
              savedLocations: savedList,
              hourlyForecast: rating.hourlyForecast
            }
          })
        } catch (err) {
          res(null, { success: false, error: err.message })
        }
        return
      }
      res(null, { success: false, error: 'Unknown request' })
    }
  })
)

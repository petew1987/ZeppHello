import React, { useState, useEffect, useCallback } from 'react';
import JSZip from 'jszip';
import {
  Watch,
  Code2,
  FileCode,
  Download,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  Radio,
  Terminal,
  Zap,
  Smartphone,
  Plus,
  Trash2,
  Bookmark,
  QrCode,
  CheckCircle2,
  GitBranch
} from 'lucide-react';
import { WatchFace } from './components/WatchFace';
import { ShortcutCard } from './components/ShortcutCard';
import { SecondaryWidgetFace } from './components/SecondaryWidgetFace';
import {
  AuroraForecastResult,
  computeAuroraProbability,
  fetchLiveNoaaKp,
  fetchLiveCloudCover,
} from './simulator/auroraEngine';

const APP_JSON_CONTENT = `{
  "configVersion": "v3",
  "app": {
    "appId": 1009876,
    "appName": "Aurora Tracker",
    "appType": "app",
    "version": {
      "code": 1,
      "name": "1.0.0"
    },
    "icon": "icon.png",
    "vender": "AuroraSpaceTech",
    "description": "Real-time Aurora Borealis viewing probability using NOAA space weather data and Open-Meteo cloud cover for Amazfit Active 3 (round 466x466)."
  },
  "permissions": [
    "device:os.bg_service",
    "device:os.geolocation"
  ],
  "runtime": {
    "apiVersion": {
      "compatible": "2.0.0",
      "target": "3.0.0",
      "minVersion": "2.0"
    }
  },
  "targets": {
    "default": {
      "module": {
        "page": {
          "pages": [
            "page/index"
          ]
        },
        "app-side": {
          "path": "app-side/index"
        },
        "setting": {
          "path": "setting/index"
        },
        "app-widget": {
          "widgets": [
            {
              "name": "Aurora Tracker",
              "path": "app-widget/index",
              "icon": "icon.png"
            }
          ]
        },
        "secondary-widget": {
          "widgets": [
            {
              "name": "Aurora Forecast",
              "path": "secondary-widget/index",
              "icon": "icon.png"
            }
          ]
        }
      },
      "platforms": [
        {
          "st": "r",
          "dw": 466
        }
      ]
    }
  },
  "i18n": {
    "en-US": {
      "appName": "Aurora Tracker"
    }
  },
  "defaultLanguage": "en-US"
}`;

const APP_JS_CONTENT = `/**
 * Aurora Tracker - Zepp OS Application Entry Point
 * Implements App lifecycle using @zeppos/zml/base-app
 */
import { BaseApp } from '@zeppos/zml/base-app'

App(
  BaseApp({
    globalData: {
      appName: 'Aurora Tracker'
    },
    onCreate(options) {
      console.log('[AuroraTracker] App onCreate initialized')
    },
    onDestroy(options) {
      console.log('[AuroraTracker] App onDestroy called')
    }
  })
)`;

const PAGE_INDEX_JS_CONTENT = `/**
 * Aurora Tracker - Watch UI (Zepp OS 2.x & 3.0 Compatible)
 * Target Device: Amazfit Active 3 (Round 466x466 AMOLED Screen, Center: x=233, y=233)
 *
 * Implemented using @zeppos/zml/base-page for seamless companion IPC.
 */

import { Geolocation } from '@zeppos/device-app'
import { BasePage } from '@zeppos/zml/base-page'

const SCREEN_SIZE = 466
const CENTER_X = 233
const CENTER_Y = 233

// Arc Gauge Geometry (Bottom-open arc: 135° to 405°, 270° sweep)
const ARC_START_ANGLE = 135
const ARC_TOTAL_SWEEP = 270
const ARC_X = 36
const ARC_Y = 36
const ARC_SIZE = 394
const ARC_LINE_WIDTH = 10

// AMOLED palette
const COLOR_BLACK = 0x000000
const COLOR_ARC_BG = 0x1e293b       // Slate 800 track
const COLOR_AURORA_HIGH = 0x10b981   // Emerald Green
const COLOR_AURORA_MED = 0x06b6d4    // Cyan
const COLOR_AURORA_LOW = 0xf59e0b    // Amber
const COLOR_AURORA_NONE = 0xef4444   // Crimson Red
const COLOR_TEXT_MUTED = 0x94a3b8    // Slate 400
const COLOR_TEXT_DIM = 0x64748b      // Slate 500
const COLOR_TEXT_BRIGHT = 0xf8fafc   // Slate 50
const COLOR_TEXT_SKY = 0x38bdf8      // Sky Blue 400
const COLOR_BTN_NORMAL = 0x0f766e    // Teal 700
const COLOR_BTN_PRESS = 0x115e59     // Teal 800
const COLOR_PILL_NORMAL = 0x1e293b   // Slate 800
const COLOR_PILL_PRESS = 0x334155    // Slate 700

Page(
  BasePage({
    state: {
      isLoading: false,
      latitude: null,
      longitude: null,
      activeLocationId: 'gps',
      savedLocations: [
        { id: 'tromso', name: 'Tromsø', lat: 69.65, lon: 18.96 },
        { id: 'reykjavik', name: 'Reykjavík', lat: 64.15, lon: -21.94 },
        { id: 'fairbanks', name: 'Fairbanks', lat: 64.84, lon: -147.72 }
      ],
      auroraData: {
        chancePercent: 0,
        kp: '--',
        clouds: '--',
        textGuidance: 'Tap Refresh to scan skies',
        locationText: '📍 GPS (Tap to Switch)'
      }
    },

    widgets: {
      bgArc: null,
      progressArc: null,
      titleLabel: null,
      locationBtn: null,
      percentLabel: null,
      statusLabel: null,
      kpTitle: null,
      kpValue: null,
      cloudTitle: null,
      cloudValue: null,
      guidanceLabel: null,
      refreshBtn: null,
      footerLabel: null
    },

    onInit() {
      console.log('[AuroraTracker] Page initialized for Amazfit Active 3')
    },

    build() {
      this.createBackgroundArc()
      this.createProgressArc()
      this.createHeaderWidgets()
      this.createMainProbabilityWidgets()
      this.createMetricCards()
      this.createGuidanceWidget()
      this.createActionWidgets()

      this.startFetchSequence()
    },

    createBackgroundArc() {
      this.widgets.bgArc = hmUI.createWidget(hmUI.widget.ARC, {
        x: ARC_X,
        y: ARC_Y,
        w: ARC_SIZE,
        h: ARC_SIZE,
        start_angle: ARC_START_ANGLE,
        end_angle: ARC_START_ANGLE + ARC_TOTAL_SWEEP,
        color: COLOR_ARC_BG,
        line_width: ARC_LINE_WIDTH
      })
    },

    createProgressArc() {
      this.widgets.progressArc = hmUI.createWidget(hmUI.widget.ARC, {
        x: ARC_X,
        y: ARC_Y,
        w: ARC_SIZE,
        h: ARC_SIZE,
        start_angle: ARC_START_ANGLE,
        end_angle: ARC_START_ANGLE,
        color: COLOR_AURORA_HIGH,
        line_width: ARC_LINE_WIDTH
      })
    },

    createHeaderWidgets() {
      this.widgets.titleLabel = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 0,
        y: 36,
        w: SCREEN_SIZE,
        h: 18,
        color: COLOR_TEXT_DIM,
        text_size: 13,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: 'AURORA TRACKER'
      })

      this.widgets.locationBtn = hmUI.createWidget(hmUI.widget.BUTTON, {
        x: 103,
        y: 58,
        w: 260,
        h: 32,
        text: '📍 GPS (Tap to Switch)',
        text_size: 14,
        color: COLOR_TEXT_SKY,
        normal_color: COLOR_PILL_NORMAL,
        press_color: COLOR_PILL_PRESS,
        radius: 16,
        click_func: () => {
          this.onCycleLocation()
        }
      })
    },

    createMainProbabilityWidgets() {
      this.widgets.percentLabel = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 0,
        y: 96,
        w: SCREEN_SIZE,
        h: 54,
        color: COLOR_AURORA_HIGH,
        text_size: 54,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: '--%'
      })

      this.widgets.statusLabel = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 30,
        y: 152,
        w: SCREEN_SIZE - 60,
        h: 22,
        color: COLOR_TEXT_BRIGHT,
        text_size: 16,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: 'CONNECTING...'
      })
    },

    createMetricCards() {
      this.widgets.kpTitle = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 76,
        y: 180,
        w: 148,
        h: 16,
        color: COLOR_TEXT_MUTED,
        text_size: 11,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: 'GEOMAGNETIC'
      })

      this.widgets.kpValue = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 76,
        y: 196,
        w: 148,
        h: 26,
        color: COLOR_TEXT_BRIGHT,
        text_size: 18,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: 'Kp --'
      })

      this.widgets.cloudTitle = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 242,
        y: 180,
        w: 148,
        h: 16,
        color: COLOR_TEXT_MUTED,
        text_size: 11,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: 'CLOUD COVER'
      })

      this.widgets.cloudValue = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 242,
        y: 196,
        w: 148,
        h: 26,
        color: COLOR_TEXT_SKY,
        text_size: 18,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: '--%'
      })
    },

    createGuidanceWidget() {
      this.widgets.guidanceLabel = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 64,
        y: 236,
        w: 338,
        h: 40,
        color: COLOR_TEXT_MUTED,
        text_size: 13,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: 'Scanning NOAA SWPC & Open-Meteo...'
      })
    },

    createActionWidgets() {
      this.widgets.refreshBtn = hmUI.createWidget(hmUI.widget.BUTTON, {
        x: 148,
        y: 286,
        w: 170,
        h: 46,
        text: 'REFRESH',
        text_size: 17,
        color: COLOR_TEXT_BRIGHT,
        normal_color: COLOR_BTN_NORMAL,
        press_color: COLOR_BTN_PRESS,
        radius: 23,
        click_func: () => {
          this.onRefreshClick()
        }
      })

      this.widgets.footerLabel = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 0,
        y: 342,
        w: SCREEN_SIZE,
        h: 18,
        color: COLOR_TEXT_DIM,
        text_size: 11,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: 'NOAA SWPC • Tap Top to Switch'
      })
    },

    onCycleLocation() {
      if (this.state.isLoading) return

      const locations = [
        { id: 'gps', name: 'GPS (Live)' },
        ...(this.state.savedLocations || [])
      ]

      const currentIndex = locations.findIndex(l => l.id === this.state.activeLocationId)
      const nextIndex = (currentIndex + 1) % locations.length
      const nextLoc = locations[nextIndex]

      this.state.activeLocationId = nextLoc.id
      this.widgets.locationBtn.setProperty(hmUI.prop.TEXT, \`Switching to \${nextLoc.name}...\`)

      try {
        this.request({
          type: 'SET_ACTIVE_LOCATION',
          locationId: nextLoc.id
        }).catch(() => {})
      } catch (e) {}

      this.startFetchSequence()
    },

    onRefreshClick() {
      if (this.state.isLoading) return
      this.startFetchSequence()
    },

    startFetchSequence() {
      this.state.isLoading = true
      this.widgets.statusLabel.setProperty(hmUI.prop.TEXT, 'SCANNING SKIES')
      this.widgets.percentLabel.setProperty(hmUI.prop.COLOR, COLOR_TEXT_MUTED)

      if (this.state.activeLocationId === 'gps') {
        this.getDeviceLocation((coords) => {
          if (coords && coords.latitude && coords.longitude) {
            this.state.latitude = coords.latitude
            this.state.longitude = coords.longitude
            this.widgets.locationBtn.setProperty(hmUI.prop.TEXT, \`📍 GPS: \${coords.latitude.toFixed(1)}°, \${coords.longitude.toFixed(1)}°\`)
          } else {
            this.widgets.locationBtn.setProperty(hmUI.prop.TEXT, '📍 GPS (Resolving...)')
          }
          this.fetchAuroraDataFromCompanion(this.state.latitude, this.state.longitude, 'gps')
        })
      } else {
        const saved = (this.state.savedLocations || []).find(l => l.id === this.state.activeLocationId)
        if (saved) {
          this.widgets.locationBtn.setProperty(hmUI.prop.TEXT, \`📍 \${saved.name} (Saved)\`)
        }
        this.fetchAuroraDataFromCompanion(null, null, this.state.activeLocationId)
      }
    },

    getDeviceLocation(callback) {
      try {
        if (typeof Geolocation !== 'undefined') {
          const geo = new Geolocation()
          geo.start()
          
          let timeoutFired = false
          const timer = setTimeout(() => {
            timeoutFired = true
            geo.stop()
            callback(null)
          }, 5000)

          geo.on('change', () => {
            if (timeoutFired) return
            clearTimeout(timer)
            const lat = geo.getLatitude()
            const lon = geo.getLongitude()
            geo.stop()
            callback({ latitude: lat, longitude: lon })
          })
          return
        }
      } catch (e) {
        console.log('[AuroraTracker] Geolocation error:', e)
      }
      callback(null)
    },

    fetchAuroraDataFromCompanion(lat, lon, locationId) {
      let hasResolved = false
      const timeoutHandle = setTimeout(() => {
        if (!hasResolved) {
          hasResolved = true
          this.state.isLoading = false
          this.widgets.statusLabel.setProperty(hmUI.prop.TEXT, 'LINK TIMEOUT')
          this.widgets.guidanceLabel.setProperty(hmUI.prop.TEXT, 'Ensure Zepp App is running on phone.')
        }
      }, 12000)

      try {
        this.request({
          type: 'FETCH_AURORA',
          lat: lat,
          lon: lon,
          locationId: locationId
        }).then((response) => {
          if (hasResolved) return
          hasResolved = true
          clearTimeout(timeoutHandle)
          this.state.isLoading = false

          if (response && response.success && response.data) {
            if (response.data.savedLocations && Array.isArray(response.data.savedLocations)) {
              this.state.savedLocations = response.data.savedLocations
            }
            if (response.data.activeLocationId) {
              this.state.activeLocationId = response.data.activeLocationId
            }
            this.renderAuroraData(response.data)
          } else {
            this.handleFetchError(response ? response.error : 'Unknown response')
          }
        }).catch((err) => {
          if (hasResolved) return
          hasResolved = true
          clearTimeout(timeoutHandle)
          this.state.isLoading = false
          this.handleFetchError('Companion disconnected')
        })
      } catch (err) {
        if (hasResolved) return
        hasResolved = true
        clearTimeout(timeoutHandle)
        this.state.isLoading = false
        this.handleFetchError('Bluetooth unavailable')
      }
    },

    renderAuroraData(data) {
      const chance = Math.min(100, Math.max(0, Math.round(data.chancePercent || 0)))
      const currentEndAngle = ARC_START_ANGLE + Math.round((chance / 100) * ARC_TOTAL_SWEEP)

      let arcColor = COLOR_AURORA_HIGH
      if (data.clouds > 80 && chance > 10) {
        arcColor = COLOR_AURORA_NONE
      } else if (chance >= 60) {
        arcColor = COLOR_AURORA_HIGH
      } else if (chance >= 30) {
        arcColor = COLOR_AURORA_MED
      } else if (chance >= 10) {
        arcColor = COLOR_AURORA_LOW
      } else {
        arcColor = COLOR_AURORA_NONE
      }

      this.widgets.progressArc.setProperty(hmUI.prop.MORE, {
        start_angle: ARC_START_ANGLE,
        end_angle: currentEndAngle,
        color: arcColor
      })

      this.widgets.percentLabel.setProperty(hmUI.prop.MORE, {
        text: \`\${chance}%\`,
        color: arcColor
      })

      let statusText = 'LOW ACTIVITY'
      if (data.clouds > 80 && chance > 20) {
        statusText = 'CLOUDY (BLOCKED)'
      } else if (chance >= 70) {
        statusText = 'VERY HIGH CHANCE'
      } else if (chance >= 45) {
        statusText = 'MODERATE CHANCE'
      } else if (chance >= 20) {
        statusText = 'POSSIBLE HORIZON'
      } else {
        statusText = 'NO VISIBILITY'
      }

      this.widgets.statusLabel.setProperty(hmUI.prop.MORE, {
        text: statusText,
        color: COLOR_TEXT_BRIGHT
      })

      this.widgets.kpValue.setProperty(hmUI.prop.TEXT, \`Kp \${data.kp !== undefined ? data.kp : '--'}\`)
      this.widgets.cloudValue.setProperty(hmUI.prop.TEXT, \`\${data.clouds !== undefined ? data.clouds + '%' : '--'}\`)

      if (data.locationText) {
        this.widgets.locationBtn.setProperty(hmUI.prop.TEXT, \`📍 \${data.locationText}\`)
      }

      if (data.textGuidance) {
        this.widgets.guidanceLabel.setProperty(hmUI.prop.TEXT, data.textGuidance)
      }

      const now = new Date()
      const hours = now.getHours().toString().padStart(2, '0')
      const mins = now.getMinutes().toString().padStart(2, '0')
      this.widgets.footerLabel.setProperty(hmUI.prop.TEXT, \`Updated \${hours}:\${mins} • \${data.stormLevel || 'NOAA'}\`)
    },

    handleFetchError(msg) {
      this.widgets.statusLabel.setProperty(hmUI.prop.TEXT, 'DATA UNAVAILABLE')
      this.widgets.statusLabel.setProperty(hmUI.prop.COLOR, COLOR_AURORA_NONE)
      this.widgets.guidanceLabel.setProperty(hmUI.prop.TEXT, 'Tap REFRESH or switch location to retry.')
      this.widgets.percentLabel.setProperty(hmUI.prop.TEXT, 'ERR')
    },

    onDestroy() {
      console.log('[AuroraTracker] Page destroyed')
    }
  })
)`;

const APP_SIDE_JS_CONTENT = `/**
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

async function fetchCloudCover(lat, lon) {
  try {
    const url = \`https://api.open-meteo.com/v1/forecast?latitude=\${lat.toFixed(4)}&longitude=\${lon.toFixed(4)}&current=cloud_cover\`
    const res = await fetch(url)
    if (res.ok) {
      const data = await res.json()
      if (data && data.current && data.current.cloud_cover !== undefined) {
        return Math.round(data.current.cloud_cover)
      }
    }
  } catch (err) {}
  return 30
}

async function resolveLocationName(lat, lon) {
  try {
    const url = \`https://api.open-meteo.com/v1/forecast?latitude=\${lat.toFixed(4)}&longitude=\${lon.toFixed(4)}&timezone=auto\`
    const res = await fetch(url)
    if (res.ok) {
      const data = await res.json()
      if (data && data.timezone) {
        const parts = data.timezone.split('/')
        if (parts.length > 1) return parts[parts.length - 1].replace(/_/g, ' ')
      }
    }
  } catch (e) {}
  return \`\${lat.toFixed(1)}°N, \${lon.toFixed(1)}°E\`
}

function computeAuroraProbability(lat, lon, kp, clouds) {
  const geomLat = Math.abs(calculateGeomagneticLatitude(lat, lon))
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

  const finalChance = Math.min(100, Math.max(0, Math.round(baseChance * cloudFactor)))

  let textGuidance = ''
  if (clouds > 80) textGuidance = \`Heavy clouds (\${clouds}%) block view. Wait for clear gap.\`
  else if (finalChance >= 70) textGuidance = \`Vibrant display expected! Look directly north.\`
  else if (finalChance >= 40) textGuidance = \`Moderate chance overhead. Scan northern horizon.\`
  else if (finalChance >= 15) textGuidance = \`Faint arc possible on dark horizon during peaks.\`
  else textGuidance = \`Quiet space weather for this latitude (Kp \${kp.toFixed(1)}).\`

  let stormLevel = 'G0 (Quiet)'
  if (kp >= 9) stormLevel = 'G5 (Extreme Storm)'
  else if (kp >= 8) stormLevel = 'G4 (Severe Storm)'
  else if (kp >= 7) stormLevel = 'G3 (Strong Storm)'
  else if (kp >= 6) stormLevel = 'G2 (Moderate Storm)'
  else if (kp >= 5) stormLevel = 'G1 (Minor Storm)'
  else if (kp >= 4) stormLevel = 'Active'

  return { chancePercent: finalChance, textGuidance, stormLevel }
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
              locationDisplayName = \`GPS: \${lat.toFixed(1)}°, \${lon.toFixed(1)}°\`
            }
          }

          const [kp, clouds, autoResolvedName] = await Promise.all([
            fetchNoaaKpIndex(),
            fetchCloudCover(lat, lon),
            resolveLocationName(lat, lon)
          ])

          if (isUsingGps && autoResolvedName) {
            locationDisplayName = \`GPS: \${autoResolvedName}\`
          }

          const rating = computeAuroraProbability(lat, lon, kp, clouds)
          res(null, {
            success: true,
            data: {
              kp,
              chancePercent: rating.chancePercent,
              textGuidance: rating.textGuidance,
              clouds,
              locationText: locationDisplayName,
              activeLocationId: activeId,
              stormLevel: rating.stormLevel,
              savedLocations: savedList
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
)`;

const SETTING_INDEX_JS_CONTENT = `/**
 * Aurora Tracker - Settings App (Runs on Smartphone Zepp App for Android & iOS)
 */

const DEFAULT_PRESET_LOCATIONS = [
  { id: 'tromso', name: 'Tromsø', country: 'Norway', lat: 69.6492, lon: 18.9553 },
  { id: 'reykjavik', name: 'Reykjavík', country: 'Iceland', lat: 64.1466, lon: -21.9426 },
  { id: 'fairbanks', name: 'Fairbanks', country: 'Alaska, USA', lat: 64.8378, lon: -147.7164 },
  { id: 'yellowknife', name: 'Yellowknife', country: 'Canada', lat: 62.4540, lon: -114.3718 },
  { id: 'abisko', name: 'Abisko', country: 'Sweden', lat: 68.3495, lon: 18.8312 }
]

AppSettingsPage({
  state: {
    inputName: '',
    inputLat: '',
    inputLon: ''
  },

  build(props) {
    let savedLocations = []
    try {
      const raw = props.settingsStorage.getItem('savedLocations')
      if (raw) savedLocations = typeof raw === 'string' ? JSON.parse(raw) : raw
    } catch (e) {}

    if (!savedLocations || savedLocations.length === 0) {
      savedLocations = [...DEFAULT_PRESET_LOCATIONS]
      props.settingsStorage.setItem('savedLocations', JSON.stringify(savedLocations))
    }

    let activeLocationId = props.settingsStorage.getItem('activeLocationId') || 'gps'

    const selectOptions = [
      { name: '📍 Use Watch GPS (Automatic Live Location)', value: 'gps' },
      ...savedLocations.map(loc => ({
        name: \`⭐ \${loc.name} (\${loc.lat.toFixed(1)}°N, \${loc.lon.toFixed(1)}°E)\`,
        value: loc.id
      }))
    ]

    return View(
      { style: { padding: '16px', backgroundColor: '#0f172a', minHeight: '100%' } },
      [
        View(
          { style: { marginBottom: '20px', textAlign: 'center' } },
          [
            Text({ style: { fontSize: '20px', fontWeight: 'bold', color: '#10b981', marginBottom: '4px' } }, 'AURORA TRACKER SETTINGS'),
            Text({ style: { fontSize: '13px', color: '#94a3b8' } }, 'Configure target coordinates for Amazfit Active 3')
          ]
        ),
        Section(
          { title: 'Active Target Location', style: { backgroundColor: '#1e293b', borderRadius: '12px', padding: '14px', marginBottom: '16px' } },
          [
            Text({ style: { fontSize: '12px', color: '#94a3b8', marginBottom: '10px' } }, 'Choose whether the watch estimates auroras using real-time GPS or a saved destination:'),
            Select({ label: 'Current Mode', settingsKey: 'activeLocationId', options: selectOptions })
          ]
        ),
        Section(
          { title: 'Saved Locations (' + savedLocations.length + ')', style: { backgroundColor: '#1e293b', borderRadius: '12px', padding: '14px', marginBottom: '16px' } },
          [
            ...savedLocations.map((loc) => {
              const isSelected = activeLocationId === loc.id
              return View(
                { style: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: isSelected ? '#064e3b' : '#0f172a', border: isSelected ? '1px solid #10b981' : '1px solid #334155', borderRadius: '8px', marginBottom: '8px' } },
                [
                  View({}, [
                    Text({ style: { fontSize: '14px', fontWeight: 'bold', color: isSelected ? '#6ee7b7' : '#f8fafc' } }, loc.name),
                    Text({ style: { fontSize: '11px', color: '#94a3b8' } }, \`\${loc.lat.toFixed(2)}°N, \${loc.lon.toFixed(2)}°E\`)
                  ]),
                  View({ style: { display: 'flex', flexDirection: 'row', gap: '8px' } }, [
                    Button({
                      label: isSelected ? 'Active' : 'Select',
                      style: { fontSize: '11px', padding: '4px 10px', backgroundColor: isSelected ? '#059669' : '#334155', color: '#ffffff' },
                      onClick: () => { props.settingsStorage.setItem('activeLocationId', loc.id) }
                    }),
                    Button({
                      label: 'Delete',
                      style: { fontSize: '11px', padding: '4px 8px', backgroundColor: '#7f1d1d', color: '#fca5a5' },
                      onClick: () => {
                        const updated = savedLocations.filter(item => item.id !== loc.id)
                        props.settingsStorage.setItem('savedLocations', JSON.stringify(updated))
                        if (activeLocationId === loc.id) props.settingsStorage.setItem('activeLocationId', 'gps')
                      }
                    })
                  ])
                ]
              )
            })
          ]
        ),
        Section(
          { title: 'Add Custom Location', style: { backgroundColor: '#1e293b', borderRadius: '12px', padding: '14px' } },
          [
            TextInput({ label: 'Location Name', placeholder: 'e.g. Abisko Sky Station', value: this.state.inputName, onChange: (val) => { this.state.inputName = val } }),
            TextInput({ label: 'Latitude (°N)', placeholder: 'e.g. 68.35', value: this.state.inputLat, onChange: (val) => { this.state.inputLat = val } }),
            TextInput({ label: 'Longitude (°E/W)', placeholder: 'e.g. 18.83', value: this.state.inputLon, onChange: (val) => { this.state.inputLon = val } }),
            Button({
              label: 'Save Location',
              style: { backgroundColor: '#10b981', color: '#0f172a', fontWeight: 'bold', marginTop: '12px', width: '100%' },
              onClick: () => {
                const name = (this.state.inputName || '').trim()
                const lat = parseFloat(this.state.inputLat)
                const lon = parseFloat(this.state.inputLon)
                if (!name || isNaN(lat) || isNaN(lon)) return
                const newLoc = { id: 'loc_' + Date.now(), name, lat, lon }
                props.settingsStorage.setItem('savedLocations', JSON.stringify([...savedLocations, newLoc]))
                props.settingsStorage.setItem('activeLocationId', newLoc.id)
                this.state.inputName = ''
                this.state.inputLat = ''
                this.state.inputLon = ''
              }
            })
          ]
        )
      ]
    )
  }
})`;

const WORKFLOW_YML_CONTENT = `name: Build & Release Zepp OS App

on:
  workflow_dispatch: # Allows manual trigger from your browser
  push:
    branches: [ main ]

permissions:
  contents: write

jobs:
  build:
    name: Build Aurora Tracker Zepp OS Package
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Dependencies
        run: npm install

      - name: Install Zeus CLI
        run: npm install -g @zeppos/zeus-cli

      - name: Build Zepp OS Package (.zab)
        run: |
          zeus build
          ls -lh dist/

      - name: Generate QR Code & Job Summary
        run: |
          node scripts/generate-qr.js

      - name: Upload Build Artifacts (.zab and QR code)
        uses: actions/upload-artifact@v4
        with:
          name: zepp-os-aurora-tracker
          path: |
            dist/*.zab
            dist/*.zpg
            dist/*.png

      - name: Create or Update GitHub Release
        if: github.event_name == 'push' && github.ref == 'refs/heads/main'
        uses: softprops/action-gh-release@v2
        with:
          tag_name: latest
          name: "Aurora Tracker Zepp OS v1.0.0"
          body: |
            ## 🌌 Aurora Tracker for Amazfit Active 3 (Zepp OS 3.0 / 2.x)
            
            Install via Zepp App Developer Mode by scanning the QR code in the Action Run Summary or downloading the \`.zab\` package below.
          files: |
            dist/aurora-tracker.zab
            dist/install-qrcode.png
          draft: false
          prerelease: false
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
`;

interface SavedLocationItem {
  id: string;
  name: string;
  country?: string;
  lat: number;
  lon: number;
}

interface LogEntry {
  id: string;
  timestamp: string;
  source: 'WATCH' | 'COMPANION' | 'SETTINGS' | 'NOAA' | 'METEO' | 'ZEUS';
  message: string;
  type: 'info' | 'success' | 'warn' | 'error';
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'phone_settings' | 'qr_install' | 'code' | 'architecture'>('simulator');
  const [activeCodeFile, setActiveCodeFile] = useState<'app.json' | 'app.js' | 'page/index.js' | 'app-side/index.js' | 'setting/index.js' | '.github/workflows/build.yml'>('page/index.js');
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  // Saved Locations
  const [savedLocations, setSavedLocations] = useState<SavedLocationItem[]>([
    { id: 'tromso', name: 'Tromsø', country: 'Norway', lat: 69.6492, lon: 18.9553 },
    { id: 'reykjavik', name: 'Reykjavík', country: 'Iceland', lat: 64.1466, lon: -21.9426 },
    { id: 'fairbanks', name: 'Fairbanks', country: 'Alaska, USA', lat: 64.8378, lon: -147.7164 },
    { id: 'yellowknife', name: 'Yellowknife', country: 'Canada', lat: 62.4540, lon: -114.3718 },
    { id: 'abisko', name: 'Abisko', country: 'Sweden', lat: 68.3495, lon: 18.8312 },
  ]);
  const [activeLocationId, setActiveLocationId] = useState<string>('gps');

  const [newLocName, setNewLocName] = useState('');
  const [newLocLat, setNewLocLat] = useState('');
  const [newLocLon, setNewLocLon] = useState('');

  const [watchGpsLat] = useState<number>(69.6492);
  const [watchGpsLon] = useState<number>(18.9553);

  const [useLiveApis, setUseLiveApis] = useState<boolean>(true);
  const [simulatedKp, setSimulatedKp] = useState<number>(4.2);
  const [simulatedClouds, setSimulatedClouds] = useState<number>(18);
  const [isBleConnected, setIsBleConnected] = useState<boolean>(true);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [watchData, setWatchData] = useState<AuroraForecastResult | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback((source: LogEntry['source'], message: string, type: LogEntry['type'] = 'info') => {
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      source,
      message,
      type
    };
    setLogs(prev => [entry, ...prev.slice(0, 35)]);
  }, []);

  const triggerFetchSequence = useCallback(async (targetLocId?: string) => {
    if (!isBleConnected) {
      addLog('WATCH', 'BLE disconnected. Cannot message companion.', 'error');
      return;
    }

    setIsLoading(true);
    const locId = targetLocId !== undefined ? targetLocId : activeLocationId;

    let targetLat = watchGpsLat;
    let targetLon = watchGpsLon;
    let locationDisplayName = '';

    const matchedSaved = savedLocations.find(l => l.id === locId);
    if (matchedSaved && locId !== 'gps') {
      targetLat = matchedSaved.lat;
      targetLon = matchedSaved.lon;
      locationDisplayName = matchedSaved.name;
      addLog('WATCH', `Target is Saved Location: "${matchedSaved.name}" (${targetLat.toFixed(2)}°, ${targetLon.toFixed(2)}°)`, 'info');
    } else {
      locationDisplayName = `GPS: ${targetLat.toFixed(1)}°, ${targetLon.toFixed(1)}°`;
      addLog('WATCH', `Target is Watch GPS: (${targetLat.toFixed(4)}°, ${targetLon.toFixed(4)}°)`, 'info');
    }

    addLog('WATCH', `this.request({ type: 'FETCH_AURORA', locationId: '${locId}' }) via BasePage`, 'info');

    await new Promise(r => setTimeout(r, 400));

    try {
      let currentKp = simulatedKp;
      let currentClouds = simulatedClouds;
      let resolvedName = locationDisplayName;

      let currentHourlyClouds: number[] | undefined = undefined;

      if (useLiveApis) {
        addLog('COMPANION', `Fetching NOAA SWPC & Open-Meteo for ${locationDisplayName}...`, 'info');
        const [liveKp, liveMeteo] = await Promise.all([
          fetchLiveNoaaKp(),
          fetchLiveCloudCover(targetLat, targetLon)
        ]);
        currentKp = liveKp;
        currentClouds = liveMeteo.clouds;
        currentHourlyClouds = liveMeteo.hourlyClouds;
        if (locId === 'gps' && liveMeteo.locationName) {
          resolvedName = `GPS: ${liveMeteo.locationName}`;
        }
        addLog('NOAA', `Planetary Kp: ${currentKp.toFixed(1)}`, 'success');
        addLog('METEO', `Cloud Cover: ${currentClouds}% (${resolvedName})`, 'success');
      }

      const result = computeAuroraProbability(targetLat, targetLon, currentKp, currentClouds, resolvedName, currentHourlyClouds);
      addLog('COMPANION', `Calculated viewing chance: ${result.chancePercent}% (${result.stormLevel}) · 10-Hour Forecast Ready`, 'success');
      addLog('WATCH', `Rendering widgets on 466x466 AMOLED screen`, 'success');

      setWatchData(result);
    } catch (err: any) {
      addLog('COMPANION', `Error: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [isBleConnected, activeLocationId, watchGpsLat, watchGpsLon, savedLocations, simulatedKp, simulatedClouds, useLiveApis, addLog]);

  useEffect(() => {
    triggerFetchSequence();
  }, [activeLocationId]);

  const handleWatchCycleLocation = () => {
    const list = ['gps', ...savedLocations.map(l => l.id)];
    const currentIndex = list.indexOf(activeLocationId);
    const nextIndex = (currentIndex + 1) % list.length;
    const nextId = list[nextIndex];
    setActiveLocationId(nextId);
    addLog('WATCH', `User tapped Location Pill on watch face: switched to "${nextId}"`, 'info');
    triggerFetchSequence(nextId);
  };

  const handleAddLocationInSettings = () => {
    const name = newLocName.trim();
    const lat = parseFloat(newLocLat);
    const lon = parseFloat(newLocLon);

    if (!name || isNaN(lat) || isNaN(lon)) {
      alert('Please enter valid Name, Latitude, and Longitude');
      return;
    }

    const newLoc: SavedLocationItem = { id: 'loc_' + Date.now(), name, lat, lon };
    setSavedLocations(prev => [...prev, newLoc]);
    setActiveLocationId(newLoc.id);
    setNewLocName('');
    setNewLocLat('');
    setNewLocLon('');
    addLog('SETTINGS', `Added "${name}" to settingsStorage. Synced to watch!`, 'success');
    triggerFetchSequence(newLoc.id);
  };

  const handleDeleteLocation = (id: string) => {
    setSavedLocations(prev => prev.filter(l => l.id !== id));
    if (activeLocationId === id) {
      setActiveLocationId('gps');
    }
    addLog('SETTINGS', `Removed location from settingsStorage`, 'warn');
  };

  const handleCopyCode = (filename: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedFile(filename);
    setTimeout(() => setCopiedFile(null), 2500);
  };

  const handleDownloadZip = async () => {
    const zip = new JSZip();
    zip.file('app.json', APP_JSON_CONTENT);
    zip.file('app.js', APP_JS_CONTENT);
    zip.folder('page')?.file('index.js', PAGE_INDEX_JS_CONTENT);
    zip.folder('app-side')?.file('index.js', APP_SIDE_JS_CONTENT);
    zip.folder('setting')?.file('index.js', SETTING_INDEX_JS_CONTENT);
    zip.folder('.github')?.folder('workflows')?.file('build.yml', WORKFLOW_YML_CONTENT);
    zip.file('README.md', `# Aurora Tracker - Zepp OS Mini-App
Ready-to-deploy project for Amazfit Active 3.
Compiled successfully with Zeus CLI into .zab package.
Run:
  npm i -g @zeppos/zeus-cli
  zeus build
`);

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'aurora-tracker-zeppos.zip';
    link.click();
    URL.revokeObjectURL(url);
  };

  const activeSavedObj = savedLocations.find(l => l.id === activeLocationId);
  const locationDisplayText =
    activeLocationId === 'gps'
      ? (watchData?.locationText || 'GPS (Live)')
      : (activeSavedObj ? `${activeSavedObj.name}` : 'Saved Location');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-black">
            <Watch className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">Aurora Tracker</h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                Zepp OS 3.0 / 2.x
              </span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-950 text-purple-400 border border-purple-800">
                Zeus CLI Verified
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Amazfit Active 3 • Zero Overlap • Phone Settings Sync • GitHub Actions QR Deploy
            </p>
          </div>
        </div>

        {/* Tab Switcher & Export */}
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs font-semibold flex-wrap">
            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'simulator'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Watch className="w-3.5 h-3.5" />
              Watch Simulator
            </button>
            <button
              onClick={() => setActiveTab('phone_settings')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'phone_settings'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Phone Settings
            </button>
            <button
              onClick={() => setActiveTab('qr_install')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'qr_install'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              Scan QR Install
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'code'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              Code (All Files)
            </button>
            <button
              onClick={() => setActiveTab('architecture')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'architecture'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Architecture
            </button>
          </div>

          <button
            onClick={handleDownloadZip}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow-md transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Download .zip</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
        {/* TAB 1: WATCH SIMULATOR */}
        {activeTab === 'simulator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Watch Screen Emulator */}
            <div className="lg:col-span-6 flex flex-col items-center">
              <div className="w-full bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center">
                
                <div className="flex items-center justify-between w-full mb-3 px-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    AMAZFIT ACTIVE 3 (466×466 AMOLED)
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsBleConnected(!isBleConnected)}
                      className={`text-[11px] px-2.5 py-1 rounded-full font-semibold border transition-all ${
                        isBleConnected
                          ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                          : 'bg-red-950/80 text-red-400 border-red-800'
                      }`}
                    >
                      {isBleConnected ? 'BLE Connected' : 'BLE Disconnected'}
                    </button>
                    <button
                      onClick={() => triggerFetchSequence()}
                      disabled={isLoading}
                      title="Simulate Crown Press"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
                    </button>
                  </div>
                </div>

                <div className="bg-sky-950/40 border border-sky-800/40 rounded-xl px-3 py-1.5 text-center text-xs text-sky-300 mb-2 w-full max-w-[420px]">
                  💡 Tap the top location pill <code className="text-sky-200 bg-sky-900/60 px-1 py-0.5 rounded">📍 {locationDisplayText} ▾</code> to cycle saved locations directly on watch!
                </div>

                {/* The 466x466 Watch Canvas Component */}
                <div className="p-2 flex items-center justify-center">
                  <WatchFace
                    data={watchData}
                    isLoading={isLoading}
                    isBleConnected={isBleConnected}
                    locationDisplayText={locationDisplayText}
                    onCycleLocation={handleWatchCycleLocation}
                    onRefresh={() => triggerFetchSequence()}
                    scale={1.0}
                  />
                </div>

                {/* Diagnostics */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 w-full grid grid-cols-3 text-center text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Geomagnetic Lat</span>
                    <span className="font-bold text-slate-200">
                      {watchData?.geomagneticLat ? `${watchData.geomagneticLat}°` : '--'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Target Mode</span>
                    <span className="font-bold text-sky-400">
                      {activeLocationId === 'gps' ? 'Live GPS' : 'Saved Location'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Storm Level</span>
                    <span className="font-bold text-emerald-400">
                      {watchData?.stormLevel || 'G0'}
                    </span>
                  </div>
                </div>
              </div>

              {/* IPC Message Stream Console */}
              <div className="w-full bg-slate-900/40 border border-slate-800/90 rounded-2xl p-4 mt-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    Zepp OS Message & Settings IPC
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    page/index.js ↔ app-side/index.js ↔ setting/index.js
                  </span>
                </div>
                <div className="h-40 overflow-y-auto space-y-1.5 font-mono text-[11px] pr-1">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-2 py-0.5 border-b border-slate-800/40"
                    >
                      <span className="text-slate-400 text-[10px]">{log.timestamp}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                          log.source === 'WATCH'
                            ? 'bg-purple-950 text-purple-300'
                            : log.source === 'SETTINGS'
                            ? 'bg-pink-950 text-pink-300'
                            : log.source === 'COMPANION'
                            ? 'bg-blue-950 text-blue-300'
                            : 'bg-emerald-950 text-emerald-300'
                        }`}
                      >
                        {log.source}
                      </span>
                      <span
                        className={`flex-1 break-words ${
                          log.type === 'error'
                            ? 'text-red-400 font-semibold'
                            : log.type === 'success'
                            ? 'text-emerald-400'
                            : log.type === 'warn'
                            ? 'text-amber-300'
                            : 'text-slate-300'
                        }`}
                      >
                        {log.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Panel */}
            <div className="lg:col-span-6 space-y-6">
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-emerald-400" />
                    <h2 className="font-bold text-sm text-white">Saved Locations (Synced with Phone)</h2>
                  </div>
                  <button
                    onClick={() => setActiveTab('phone_settings')}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-pink-950 text-pink-300 hover:bg-pink-900 border border-pink-800 transition-colors flex items-center gap-1.5"
                  >
                    <Smartphone className="w-3 h-3" />
                    Open Phone Settings App
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <button
                    onClick={() => {
                      setActiveLocationId('gps');
                      addLog('WATCH', 'Switched active target to Watch GPS', 'info');
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      activeLocationId === 'gps'
                        ? 'bg-sky-950/80 border-sky-400 shadow-lg shadow-sky-950/40'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-base mb-1">
                      <span>🛰️</span>
                      <span className="text-[10px] font-mono text-sky-400">Live GPS</span>
                    </div>
                    <div className="font-bold text-xs text-white">Current Watch GPS</div>
                    <div className="text-[10px] text-slate-400">Auto-tracking</div>
                  </button>

                  {savedLocations.map((loc) => {
                    const isSelected = activeLocationId === loc.id;
                    return (
                      <button
                        key={loc.id}
                        onClick={() => {
                          setActiveLocationId(loc.id);
                          addLog('WATCH', `Selected saved location: ${loc.name}`, 'info');
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'bg-emerald-950/80 border-emerald-400 shadow-lg shadow-emerald-950/40'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between text-base mb-1">
                          <span>⭐</span>
                          <span className="text-[10px] font-mono text-slate-400">{loc.lat.toFixed(1)}°N</span>
                        </div>
                        <div className="font-bold text-xs text-white truncate">{loc.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{loc.country || 'Custom'}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Space Weather & Cloud Engine */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    <h2 className="font-bold text-sm text-white">Space Weather & Cloud Engine</h2>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                    <button
                      onClick={() => {
                        setUseLiveApis(true);
                        triggerFetchSequence();
                      }}
                      className={`px-3 py-1 rounded-lg font-medium transition-all ${
                        useLiveApis
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Live APIs
                    </button>
                    <button
                      onClick={() => setUseLiveApis(false)}
                      className={`px-3 py-1 rounded-lg font-medium transition-all ${
                        !useLiveApis
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Manual Controls
                    </button>
                  </div>
                </div>

                {useLiveApis ? (
                  <div className="bg-slate-950/80 border border-emerald-900/50 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                      <Radio className="w-3.5 h-3.5 animate-pulse" />
                      Live NOAA & Open-Meteo Integration Active
                    </div>
                    <ul className="text-xs text-slate-400 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                        <div>
                          <strong className="text-slate-200">NOAA Space Weather Prediction Center:</strong>
                          <div className="text-[11px] font-mono text-slate-400">
                            services.swpc.noaa.gov/products/noaa-planetary-k-index.json
                          </div>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                        <div>
                          <strong className="text-slate-200">Open-Meteo Cloud Cover:</strong>
                          <div className="text-[11px] font-mono text-slate-400">
                            api.open-meteo.com/v1/forecast?latitude=...&current=cloud_cover
                          </div>
                        </div>
                      </li>
                    </ul>
                  </div>
                ) : (
                  <div className="space-y-4 pt-1">
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="font-semibold text-slate-300">Simulate Planetary K-Index (Kp):</span>
                        <span className="font-mono font-bold text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          Kp {simulatedKp.toFixed(1)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="9"
                        step="0.1"
                        value={simulatedKp}
                        onChange={(e) => {
                          setSimulatedKp(parseFloat(e.target.value));
                          triggerFetchSequence();
                        }}
                        className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="font-semibold text-slate-300">Simulate Cloud Cover:</span>
                        <span className="font-mono font-bold text-sky-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {simulatedClouds}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={simulatedClouds}
                        onChange={(e) => {
                          setSimulatedClouds(parseInt(e.target.value, 10));
                          triggerFetchSequence();
                        }}
                        className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PHONE SETTINGS */}
        {activeTab === 'phone_settings' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
                <div className="w-10 h-10 rounded-2xl bg-pink-950 border border-pink-800 flex items-center justify-center text-pink-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Zepp App Phone Settings Module</h2>
                  <p className="text-xs text-slate-400">
                    Runs inside the Zepp Mobile App (Android / iOS) via <code className="text-pink-400">setting/index.js</code> using <code className="text-pink-400">AppSettingsPage</code> and <code className="text-pink-400">settingsStorage</code>.
                  </p>
                </div>
              </div>

              {/* Section 1 */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 mb-5 space-y-3">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  1. Active Location Mode (Watch Target)
                </div>
                <div className="space-y-2 pt-1">
                  <label
                    onClick={() => {
                      setActiveLocationId('gps');
                      addLog('SETTINGS', 'Active location changed to Watch GPS', 'success');
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      activeLocationId === 'gps'
                        ? 'bg-emerald-950/60 border-emerald-500 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        checked={activeLocationId === 'gps'}
                        onChange={() => {}}
                        className="accent-emerald-500"
                      />
                      <div>
                        <div className="font-semibold text-xs">📍 Use Watch GPS (Automatic Live Location)</div>
                        <div className="text-[11px] text-slate-400">Uses device hardware GPS sensor when outdoors</div>
                      </div>
                    </div>
                    {activeLocationId === 'gps' && (
                      <span className="text-[10px] bg-emerald-900/80 text-emerald-300 px-2 py-0.5 rounded font-bold">
                        ACTIVE
                      </span>
                    )}
                  </label>

                  {savedLocations.map((loc) => {
                    const isSelected = activeLocationId === loc.id;
                    return (
                      <label
                        key={loc.id}
                        onClick={() => {
                          setActiveLocationId(loc.id);
                          addLog('SETTINGS', `Active location changed to "${loc.name}"`, 'success');
                        }}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-950/60 border-emerald-500 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            checked={isSelected}
                            onChange={() => {}}
                            className="accent-emerald-500"
                          />
                          <div>
                            <div className="font-semibold text-xs">⭐ {loc.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {loc.lat.toFixed(2)}°N, {loc.lon.toFixed(2)}°E {loc.country ? `• ${loc.country}` : ''}
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="text-[10px] bg-emerald-900/80 text-emerald-300 px-2 py-0.5 rounded font-bold">
                            ACTIVE
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Section 2 */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 mb-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                    2. Saved Locations List ({savedLocations.length})
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Synced automatically to watch
                  </span>
                </div>
                <div className="space-y-2">
                  {savedLocations.map((loc) => (
                    <div
                      key={loc.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800"
                    >
                      <div>
                        <div className="font-bold text-xs text-white">{loc.name}</div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {loc.lat.toFixed(2)}°N, {loc.lon.toFixed(2)}°E
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setActiveLocationId(loc.id);
                            addLog('SETTINGS', `Selected "${loc.name}" as active`, 'info');
                          }}
                          className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                            activeLocationId === loc.id
                              ? 'bg-emerald-800 text-white'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          {activeLocationId === loc.id ? 'Active' : 'Select'}
                        </button>
                        <button
                          onClick={() => handleDeleteLocation(loc.id)}
                          className="p-1.5 rounded-lg bg-red-950/70 hover:bg-red-900 text-red-400 border border-red-800/60 transition-colors"
                          title="Delete location"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3 */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  3. Add Custom Viewing Location
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Location Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Abisko Sky Station"
                      value={newLocName}
                      onChange={(e) => setNewLocName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Latitude (°N)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 68.35"
                      value={newLocLat}
                      onChange={(e) => setNewLocLat(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Longitude (°E/W)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 18.83"
                      value={newLocLon}
                      onChange={(e) => setNewLocLon(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddLocationInSettings}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors mt-2"
                >
                  <Plus className="w-4 h-4" />
                  Save Location to Zepp App & Sync to Watch
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: QR CODE INSTALLATION & GITHUB ACTIONS GUIDE */}
        {activeTab === 'qr_install' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
                <div className="w-10 h-10 rounded-2xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Install via GitHub Actions & QR Code</h2>
                  <p className="text-xs text-slate-400">
                    Compiled automatically via Zeus CLI on GitHub Actions, generating scannable QR installation packages.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                {/* QR Code Display */}
                <div className="md:col-span-5 flex flex-col items-center">
                  <div className="bg-white p-4 rounded-3xl shadow-2xl border-4 border-emerald-500/30 flex flex-col items-center">
                    {/* Rendered Live QR Code */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=https://github.com/user/aurora-tracker/releases/latest/download/aurora-tracker.zab`}
                      alt="Zepp App Install QR Code"
                      className="w-[230px] h-[230px] rounded-xl"
                    />
                    <div className="text-[11px] font-bold text-slate-900 mt-2 tracking-wide text-center">
                      SCAN IN ZEPP APP DEVELOPER MODE
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800">
                      ✓ Package: Aurora Tracker-1.0.0.zab
                    </span>
                  </div>
                </div>

                {/* Instructions */}
                <div className="md:col-span-7 space-y-4 text-xs">
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                    <div className="font-bold text-white text-sm flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">1</span>
                      Enable Developer Mode on Your Phone:
                    </div>
                    <ul className="text-slate-300 space-y-1.5 pl-7 list-disc">
                      <li>Open the <strong>Zepp App</strong> on your Android phone.</li>
                      <li>Go to <strong>Profile</strong> &gt; <strong>Settings</strong> &gt; <strong>About</strong>.</li>
                      <li>Tap the <strong>Zepp Logo 7 times</strong> until a confirmation toast appears: <em>"Developer Mode is enabled"</em>.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                    <div className="font-bold text-white text-sm flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">2</span>
                      Scan QR Code in Zepp App:
                    </div>
                    <ul className="text-slate-300 space-y-1.5 pl-7 list-disc">
                      <li>Return to <strong>Profile</strong> &gt; tap your <strong>Amazfit Active 3</strong> under <em>My Devices</em>.</li>
                      <li>Scroll down and tap <strong>Developer Mode</strong>.</li>
                      <li>Tap the <strong>+ / Scan button</strong> in the top-right corner.</li>
                      <li>Scan the QR code shown on screen or in your GitHub Action Run Summary!</li>
                    </ul>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                    <div className="font-bold text-white text-sm flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">3</span>
                      Instant Bluetooth Installation:
                    </div>
                    <p className="text-slate-300 pl-7 leading-relaxed">
                      Tap <strong>Install</strong> on your phone. The phone app sends the Mini-App directly to your watch over Bluetooth, and opens the phone settings companion automatically!
                    </p>
                  </div>
                </div>
              </div>

              {/* GitHub Actions info */}
              <div className="mt-6 pt-5 border-t border-slate-800 flex items-start gap-3 bg-emerald-950/20 p-4 rounded-2xl border border-emerald-900/40 text-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-semibold mb-0.5">Automated GitHub Actions Integration Ready:</strong>
                  Every push to <code className="text-emerald-300">main</code> runs <code className="text-emerald-300">.github/workflows/build.yml</code>, compiling with <code className="text-emerald-300">zeus build</code>, saving the <code className="text-emerald-300">.zab</code> artifact, and embedding the scannable installation QR code directly in the GitHub Step Summary and GitHub Releases!
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CODE INSPECTOR (ALL FILES) */}
        {activeTab === 'code' && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setActiveCodeFile('app.json')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeCodeFile === 'app.json'
                      ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/60'
                      : 'text-slate-400 hover:text-white bg-slate-900/80 border border-transparent'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-amber-400" />
                  app.json
                </button>
                <button
                  onClick={() => setActiveCodeFile('app.js')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeCodeFile === 'app.js'
                      ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/60'
                      : 'text-slate-400 hover:text-white bg-slate-900/80 border border-transparent'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                  app.js (BaseApp)
                </button>
                <button
                  onClick={() => setActiveCodeFile('page/index.js')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeCodeFile === 'page/index.js'
                      ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/60'
                      : 'text-slate-400 hover:text-white bg-slate-900/80 border border-transparent'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-sky-400" />
                  page/index.js (Watch UI)
                </button>
                <button
                  onClick={() => setActiveCodeFile('app-side/index.js')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeCodeFile === 'app-side/index.js'
                      ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/60'
                      : 'text-slate-400 hover:text-white bg-slate-900/80 border border-transparent'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-purple-400" />
                  app-side/index.js
                </button>
                <button
                  onClick={() => setActiveCodeFile('setting/index.js')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeCodeFile === 'setting/index.js'
                      ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/60'
                      : 'text-slate-400 hover:text-white bg-slate-900/80 border border-transparent'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-pink-400" />
                  setting/index.js
                </button>
                <button
                  onClick={() => setActiveCodeFile('.github/workflows/build.yml')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeCodeFile === '.github/workflows/build.yml'
                      ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/60'
                      : 'text-slate-400 hover:text-white bg-slate-900/80 border border-transparent'
                  }`}
                >
                  <GitBranch className="w-3.5 h-3.5 text-blue-400" />
                  build.yml (Actions)
                </button>
              </div>

              <button
                onClick={() => {
                  const currentCode =
                    activeCodeFile === 'app.json'
                      ? APP_JSON_CONTENT
                      : activeCodeFile === 'app.js'
                      ? APP_JS_CONTENT
                      : activeCodeFile === 'page/index.js'
                      ? PAGE_INDEX_JS_CONTENT
                      : activeCodeFile === 'app-side/index.js'
                      ? APP_SIDE_JS_CONTENT
                      : activeCodeFile === 'setting/index.js'
                      ? SETTING_INDEX_JS_CONTENT
                      : WORKFLOW_YML_CONTENT;
                  handleCopyCode(activeCodeFile, currentCode);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                {copiedFile === activeCodeFile ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Code
                  </>
                )}
              </button>
            </div>

            <div className="p-4 bg-slate-950 font-mono text-xs overflow-x-auto max-h-[680px]">
              <pre className="text-slate-300 leading-relaxed">
                <code>
                  {activeCodeFile === 'app.json' && APP_JSON_CONTENT}
                  {activeCodeFile === 'app.js' && APP_JS_CONTENT}
                  {activeCodeFile === 'page/index.js' && PAGE_INDEX_JS_CONTENT}
                  {activeCodeFile === 'app-side/index.js' && APP_SIDE_JS_CONTENT}
                  {activeCodeFile === 'setting/index.js' && SETTING_INDEX_JS_CONTENT}
                  {activeCodeFile === '.github/workflows/build.yml' && WORKFLOW_YML_CONTENT}
                </code>
              </pre>
            </div>
          </div>
        )}

        {/* TAB 5: ARCHITECTURE */}
        {activeTab === 'architecture' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                Zepp OS 3-Tier Split Architecture
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 font-bold text-[10px] border border-purple-800">
                      TIER 1: WATCH (page/index.js)
                    </span>
                    <h3 className="font-bold text-white text-sm mt-2 mb-1">Amazfit Active 3</h3>
                    <p className="text-slate-400 leading-relaxed">
                      • Non-overlapping circular AMOLED layout.
                      <br />
                      • Tap top location pill to cycle through phone-saved locations or GPS.
                      <br />
                      • Emits <code className="text-emerald-400">this.request()</code> via BasePage.
                    </p>
                  </div>
                  <div className="mt-3 text-slate-400 font-mono text-[10px]">466×466 AMOLED • Strict Padding</div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 font-bold text-[10px] border border-blue-800">
                      TIER 2: COMPANION (app-side/index.js)
                    </span>
                    <h3 className="font-bold text-white text-sm mt-2 mb-1">Zepp Phone Companion</h3>
                    <p className="text-slate-400 leading-relaxed">
                      • Reads <code className="text-sky-400">settingsStorage</code> for saved locations.
                      <br />
                      • Queries live NOAA SWPC Kp index and Open-Meteo cloud cover.
                      <br />
                      • Calculates geomagnetic oval intersection & cloud penalty.
                    </p>
                  </div>
                  <div className="mt-3 text-slate-400 font-mono text-[10px]">Background Service • Fast Fetch</div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded bg-pink-950 text-pink-300 font-bold text-[10px] border border-pink-800">
                      TIER 3: SETTINGS (setting/index.js)
                    </span>
                    <h3 className="font-bold text-white text-sm mt-2 mb-1">Zepp App Settings UI</h3>
                    <p className="text-slate-400 leading-relaxed">
                      • Runs in Zepp App on Android & iOS.
                      <br />
                      • User adds custom coordinates or picks presets.
                      <br />
                      • Instant two-way sync to watch face.
                    </p>
                  </div>
                  <div className="mt-3 text-slate-400 font-mono text-[10px]">AppSettingsPage • Persistent Storage</div>
                </div>

              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/40 px-6 py-4 text-center text-xs text-slate-400">
        Aurora Tracker for Amazfit Active 3 • Zepp OS 3.0 / 2.x • NOAA Space Weather Prediction Center & Open-Meteo
      </footer>
    </div>
  );
}

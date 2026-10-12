/**
 * Aurora Tracker - Watch UI (Zepp OS 2.x & 3.0 Compatible)
 * Target Device: Amazfit Active 3 (Round 466x466 AMOLED Screen, Center: x=233, y=233)
 *
 * Implemented using @zeppos/zml/base-page for seamless companion IPC.
 *
 * UI Features:
 * - Perfectly centered vertical layout utilizing the round 466x466 AMOLED canvas.
 * - Clean typographic hierarchy, zero badges or pill outlines.
 * - 10-Hour Aurora & Cloud Forecast mini-chart on watch face.
 * - Location display positioned as an interactive line directly underneath the Refresh button.
 * - Interactive Location Switching and Refresh.
 */

import { Geolocation } from '@zeppos/device-app'
import { BasePage } from '@zeppos/zml/base-page'

const SCREEN_SIZE = 466
const CENTER_X = 233
const CENTER_Y = 233

// Arc Gauge Geometry (Top-to-bottom open arc)
const ARC_START_ANGLE = 135
const ARC_TOTAL_SWEEP = 270
const ARC_X = 36
const ARC_Y = 36
const ARC_SIZE = 394
const ARC_LINE_WIDTH = 10

// 10-Hour Forecast Bar Chart Layout (centered on 466px screen)
// 10 bars, bar_w = 20px, gap = 8px => total = 20*10 + 8*9 = 272px.
// Chart start X = (466 - 272) / 2 = 97px.
const CHART_START_X = 97
const CHART_BASE_Y = 278 // bottom baseline of bars
const CHART_MAX_H = 34   // maximum bar height in px
const CHART_BAR_W = 20
const CHART_GAP = 8

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
const COLOR_ROW_NORMAL = 0x000000    // Flat black
const COLOR_ROW_PRESS = 0x1e293b     // Subtle slate press highlight
const COLOR_CHART_BG = 0x1e293b      // Slate 800 bar background track

Page(
  BasePage({
    state: {
      isLoading: false,
      latitude: null,
      longitude: null,
      activeLocationId: 'gps',
      activeLocationName: 'GPS (Live)',
      savedLocations: [
        { id: 'tromso', name: 'Tromsø, Norway', lat: 69.6492, lon: 18.9553 },
        { id: 'fairbanks', name: 'Fairbanks, Alaska', lat: 64.8378, lon: -147.7164 },
        { id: 'reykjavik', name: 'Reykjavik, Iceland', lat: 64.1466, lon: -21.9426 }
      ]
    },

    widgets: {
      bgArc: null,
      progressArc: null,
      percentLabel: null,
      statusLabel: null,
      kpTitle: null,
      kpValue: null,
      cloudTitle: null,
      cloudValue: null,
      chartTitle: null,
      chartBarsBg: [],
      chartBarsActive: [],
      chartTimeStart: null,
      chartTimeEnd: null,
      guidanceLabel: null,
      refreshBtn: null,
      locationBtn: null,
      footerLabel: null
    },

    onInit() {
      console.log('[AuroraTracker] Page initialized for Amazfit Active 3 (Round 466x466)')
    },

    build() {
      this.createBackgroundArcs()
      this.createProgressArc()
      this.createMainProbabilityWidgets()
      this.createMetricCards()
      this.createForecastChartWidgets()
      this.createGuidanceWidget()
      this.createActionWidgets()

      this.startFetchSequence()
    },

    createBackgroundArcs() {
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

    createMainProbabilityWidgets() {
      // Vertically centered in round display:
      // Percentage (y: 60, h: 58)
      this.widgets.percentLabel = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 0,
        y: 60,
        w: SCREEN_SIZE,
        h: 58,
        color: COLOR_AURORA_HIGH,
        text_size: 54,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: '--%'
      })

      // Clean unboxed status (y: 118, h: 20)
      this.widgets.statusLabel = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 30,
        y: 118,
        w: SCREEN_SIZE - 60,
        h: 20,
        color: COLOR_TEXT_BRIGHT,
        text_size: 14,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: 'CONNECTING...'
      })
    },

    createMetricCards() {
      // Left Column: Geomagnetic (x: 80, w: 140, y: 144)
      this.widgets.kpTitle = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 80,
        y: 144,
        w: 140,
        h: 16,
        color: COLOR_TEXT_MUTED,
        text_size: 10,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: 'GEOMAGNETIC'
      })

      this.widgets.kpValue = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 80,
        y: 160,
        w: 140,
        h: 22,
        color: COLOR_TEXT_BRIGHT,
        text_size: 17,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: 'Kp --'
      })

      // Right Column: Cloud Cover (x: 246, w: 140, y: 144)
      this.widgets.cloudTitle = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 246,
        y: 144,
        w: 140,
        h: 16,
        color: COLOR_TEXT_MUTED,
        text_size: 10,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: 'CLOUD COVER'
      })

      this.widgets.cloudValue = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 246,
        y: 160,
        w: 140,
        h: 22,
        color: COLOR_TEXT_SKY,
        text_size: 17,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: '--%'
      })
    },

    createForecastChartWidgets() {
      // Forecast chart header (y: 190, h: 16)
      this.widgets.chartTitle = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 0,
        y: 190,
        w: SCREEN_SIZE,
        h: 16,
        color: COLOR_TEXT_MUTED,
        text_size: 11,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: '10-HOUR AURORA FORECAST'
      })

      this.widgets.chartBarsBg = []
      this.widgets.chartBarsActive = []

      // Create 10 background tracks and active probability bars
      for (let i = 0; i < 10; i++) {
        const barX = CHART_START_X + i * (CHART_BAR_W + CHART_GAP)

        // Background track (height = 34px)
        const bgBar = hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: barX,
          y: CHART_BASE_Y - CHART_MAX_H,
          w: CHART_BAR_W,
          h: CHART_MAX_H,
          color: COLOR_CHART_BG,
          radius: 3
        })
        this.widgets.chartBarsBg.push(bgBar)

        // Active value bar
        const activeBar = hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: barX,
          y: CHART_BASE_Y - 4,
          w: CHART_BAR_W,
          h: 4,
          color: COLOR_AURORA_HIGH,
          radius: 3
        })
        this.widgets.chartBarsActive.push(activeBar)
      }

      // Time range indicators below bars (y: 282, h: 14)
      this.widgets.chartTimeStart = hmUI.createWidget(hmUI.widget.TEXT, {
        x: CHART_START_X,
        y: 282,
        w: 60,
        h: 14,
        color: COLOR_TEXT_DIM,
        text_size: 10,
        align_h: hmUI.align.LEFT,
        align_v: hmUI.align.CENTER_V,
        text: '+1h'
      })

      this.widgets.chartTimeEnd = hmUI.createWidget(hmUI.widget.TEXT, {
        x: CHART_START_X + 272 - 60,
        y: 282,
        w: 60,
        h: 14,
        color: COLOR_TEXT_DIM,
        text_size: 10,
        align_h: hmUI.align.RIGHT,
        align_v: hmUI.align.CENTER_V,
        text: '+10h'
      })
    },

    createGuidanceWidget() {
      // Natural typographic advisory text (y: 302, h: 36)
      this.widgets.guidanceLabel = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 60,
        y: 302,
        w: 346,
        h: 36,
        color: COLOR_TEXT_MUTED,
        text_size: 12,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: 'Scanning NOAA SWPC & Open-Meteo...'
      })
    },

    createActionWidgets() {
      // Refresh Button (y: 346, h: 42, w: 170)
      this.widgets.refreshBtn = hmUI.createWidget(hmUI.widget.BUTTON, {
        x: 148,
        y: 346,
        w: 170,
        h: 42,
        text: 'REFRESH',
        text_size: 15,
        color: COLOR_TEXT_BRIGHT,
        normal_color: COLOR_BTN_NORMAL,
        press_color: COLOR_BTN_PRESS,
        radius: 12,
        click_func: () => {
          this.onRefreshClick()
        }
      })

      // Location Display directly underneath the Refresh button as a clean interactive line (y: 394, h: 26, w: 320)
      // Replaces unnecessary static text and allows cycling location with a tap.
      this.widgets.locationBtn = hmUI.createWidget(hmUI.widget.BUTTON, {
        x: 73,
        y: 394,
        w: 320,
        h: 26,
        text: 'GPS (Live) · Tap to Switch',
        text_size: 13,
        color: COLOR_TEXT_SKY,
        normal_color: COLOR_ROW_NORMAL,
        press_color: COLOR_ROW_PRESS,
        radius: 6,
        click_func: () => {
          this.onCycleLocation()
        }
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
      this.widgets.locationBtn.setProperty(hmUI.prop.TEXT, `${nextLoc.name} · Switching...`)

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
            this.widgets.locationBtn.setProperty(hmUI.prop.TEXT, `GPS · ${coords.latitude.toFixed(1)}°N, ${coords.longitude.toFixed(1)}°E · Switch`)
          } else {
            this.widgets.locationBtn.setProperty(hmUI.prop.TEXT, 'GPS (Live) · Resolving...')
          }
          this.fetchAuroraDataFromCompanion(this.state.latitude, this.state.longitude, 'gps')
        })
      } else {
        const saved = (this.state.savedLocations || []).find(l => l.id === this.state.activeLocationId)
        if (saved) {
          this.widgets.locationBtn.setProperty(hmUI.prop.TEXT, `${saved.name} · Tap to Switch`)
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
          }, 3500)

          geo.on('change', (coords) => {
            if (!timeoutFired) {
              clearTimeout(timer)
              geo.stop()
              callback(coords)
            }
          })
        } else {
          callback(null)
        }
      } catch (e) {
        callback(null)
      }
    },

    fetchAuroraDataFromCompanion(lat, lon, locationId) {
      let hasResolved = false
      const timeoutHandle = setTimeout(() => {
        if (!hasResolved) {
          hasResolved = true
          this.state.isLoading = false
          this.handleFetchError('Companion sync timeout')
        }
      }, 7000)

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
      // Sync with globalData for Shortcut Cards (AppWidget) & SecondaryWidget
      try {
        const app = typeof getApp === 'function' ? getApp() : null
        if (app && app._options && app._options.globalData) {
          app._options.globalData.auroraData = data
          app._options.globalData.currentLocationName = data.locationText || this.state.activeLocationName
          app._options.globalData.lastUpdated = Date.now()
        }
      } catch (e) {
        console.warn('Failed to sync globalData:', e)
      }

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
        text: `${chance}%`,
        color: arcColor
      })

      let statusText = 'QUIET ACTIVITY'
      if (data.clouds > 80 && chance > 20) {
        statusText = 'OVERCAST · BLOCKED'
      } else if (chance >= 70) {
        statusText = 'VERY HIGH VISIBILITY'
      } else if (chance >= 45) {
        statusText = 'MODERATE VISIBILITY'
      } else if (chance >= 20) {
        statusText = 'POSSIBLE AT HORIZON'
      } else {
        statusText = 'LOW PROBABILITY'
      }

      this.widgets.statusLabel.setProperty(hmUI.prop.MORE, {
        text: statusText,
        color: COLOR_TEXT_BRIGHT
      })

      this.widgets.kpValue.setProperty(hmUI.prop.TEXT, `Kp ${data.kp !== undefined ? data.kp : '--'}`)
      this.widgets.cloudValue.setProperty(hmUI.prop.TEXT, `${data.clouds !== undefined ? data.clouds + '%' : '--'}`)

      // Render 10-Hour Forecast Bar Chart
      if (data.hourlyForecast && Array.isArray(data.hourlyForecast)) {
        for (let i = 0; i < 10; i++) {
          const item = data.hourlyForecast[i]
          if (item && this.widgets.chartBarsActive[i]) {
            const barChance = Math.min(100, Math.max(0, item.chance || 0))
            const barH = Math.max(3, Math.round((barChance / 100) * CHART_MAX_H))
            const barY = CHART_BASE_Y - barH

            let barColor = COLOR_AURORA_HIGH
            if (item.clouds > 80 && barChance > 10) barColor = COLOR_AURORA_NONE
            else if (barChance >= 60) barColor = COLOR_AURORA_HIGH
            else if (barChance >= 30) barColor = COLOR_AURORA_MED
            else if (barChance >= 10) barColor = COLOR_AURORA_LOW
            else barColor = COLOR_AURORA_NONE

            this.widgets.chartBarsActive[i].setProperty(hmUI.prop.MORE, {
              y: barY,
              h: barH,
              color: barColor
            })
          }
        }

        if (data.hourlyForecast[0]) {
          this.widgets.chartTimeStart.setProperty(hmUI.prop.TEXT, data.hourlyForecast[0].hour)
        }
        if (data.hourlyForecast[9]) {
          this.widgets.chartTimeEnd.setProperty(hmUI.prop.TEXT, data.hourlyForecast[9].hour)
        }
      }

      if (data.locationText) {
        this.widgets.locationBtn.setProperty(hmUI.prop.TEXT, `${data.locationText} · Tap to Switch`)
      }

      if (data.textGuidance) {
        this.widgets.guidanceLabel.setProperty(hmUI.prop.TEXT, data.textGuidance)
      }
    },

    handleFetchError(msg) {
      this.widgets.statusLabel.setProperty(hmUI.prop.TEXT, 'DATA UNAVAILABLE')
      this.widgets.statusLabel.setProperty(hmUI.prop.COLOR, COLOR_AURORA_NONE)
      this.widgets.guidanceLabel.setProperty(hmUI.prop.TEXT, 'Tap REFRESH or switch location to retry.')
      this.widgets.percentLabel.setProperty(hmUI.prop.TEXT, '--%')
    },

    onDestroy() {
      console.log('[AuroraTracker] Page destroyed')
    }
  })
)

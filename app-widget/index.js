/**
 * Aurora Tracker - Zepp OS Shortcut Card (AppWidget)
 * Target Device: Amazfit Active 3 (Round 466x466 AMOLED Screen)
 *
 * AppWidget allows users to access Aurora Tracker at a glance in the
 * Amazfit Shortcut Screen (swiping right or accessing the negative screen).
 *
 * Implements Zepp OS 2.x & 3.x AppWidget lifecycle:
 * - onInit: initialize state and read cached data
 * - build: render lightweight AMOLED-optimized card
 * - onResume: refresh view if updated data is available
 * - click: jumps directly to the full watch app (page/index)
 */

const SCREEN_WIDTH = 466
const CARD_HEIGHT = 180
const CARD_MARGIN = 24
const CARD_WIDTH = SCREEN_WIDTH - CARD_MARGIN * 2 // 418px

// AMOLED Colors
const COLOR_BLACK = 0x000000
const COLOR_CARD_BG = 0x0f172a       // Slate 900
const COLOR_CARD_BORDER = 0x1e293b   // Slate 800
const COLOR_AURORA_HIGH = 0x10b981   // Emerald Green
const COLOR_AURORA_MED = 0x06b6d4    // Cyan
const COLOR_AURORA_LOW = 0xf59e0b    // Amber
const COLOR_AURORA_NONE = 0xef4444   // Crimson Red
const COLOR_TEXT_MUTED = 0x94a3b8    // Slate 400
const COLOR_TEXT_DIM = 0x64748b      // Slate 500
const COLOR_TEXT_BRIGHT = 0xf8fafc   // Slate 50
const COLOR_TEXT_SKY = 0x38bdf8      // Sky Blue 400

AppWidget({
  state: {
    auroraData: null,
    locationText: 'Live GPS'
  },

  widgets: {
    bgCard: null,
    clickOverlay: null,
    headerIcon: null,
    headerTitle: null,
    locationLabel: null,
    chanceValue: null,
    statusText: null,
    metricsRow: null,
    miniBars: []
  },

  onInit() {
    console.log('[AuroraTracker] AppWidget (Shortcut Card) initialized')
    // Read shared data from globalApp
    const app = typeof getApp === 'function' ? getApp() : null
    if (app && app._options && app._options.globalData && app._options.globalData.auroraData) {
      this.state.auroraData = app._options.globalData.auroraData
      if (app._options.globalData.currentLocationName) {
        this.state.locationText = app._options.globalData.currentLocationName
      }
    }
  },

  build() {
    // Set Shortcut Card height in Zepp OS
    if (typeof hmUI !== 'undefined' && hmUI.setAppWidgetSize) {
      hmUI.setAppWidgetSize({ h: CARD_HEIGHT })
    }

    const startX = CARD_MARGIN
    const startY = 10

    // 1. Background Card Container
    if (typeof hmUI !== 'undefined') {
      this.widgets.bgCard = hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: startX,
        y: startY,
        w: CARD_WIDTH,
        h: CARD_HEIGHT - 20,
        radius: 24,
        color: COLOR_CARD_BG
      })

      // 2. Header Row: Title & Location
      this.widgets.headerTitle = hmUI.createWidget(hmUI.widget.TEXT, {
        x: startX + 20,
        y: startY + 14,
        w: 180,
        h: 22,
        color: COLOR_AURORA_HIGH,
        text_size: 16,
        align_h: hmUI.align.LEFT,
        align_v: hmUI.align.CENTER_V,
        text: 'AURORA FORECAST'
      })

      this.widgets.locationLabel = hmUI.createWidget(hmUI.widget.TEXT, {
        x: startX + CARD_WIDTH - 200,
        y: startY + 14,
        w: 180,
        h: 22,
        color: COLOR_TEXT_MUTED,
        text_size: 15,
        align_h: hmUI.align.RIGHT,
        align_v: hmUI.align.CENTER_V,
        text: this.state.locationText
      })

      // 3. Main Data Row: Big Percentage + Status
      const data = this.state.auroraData
      const chance = data ? data.chancePercent : 85
      let chanceColor = COLOR_AURORA_HIGH
      let statusDesc = 'VERY HIGH VISIBILITY'

      if (chance >= 70) {
        chanceColor = COLOR_AURORA_HIGH
        statusDesc = 'VERY HIGH VISIBILITY'
      } else if (chance >= 45) {
        chanceColor = COLOR_AURORA_MED
        statusDesc = 'MODERATE VISIBILITY'
      } else if (chance >= 20) {
        chanceColor = COLOR_AURORA_LOW
        statusDesc = 'POSSIBLE AT HORIZON'
      } else {
        chanceColor = COLOR_AURORA_NONE
        statusDesc = 'LOW PROBABILITY'
      }

      this.widgets.chanceValue = hmUI.createWidget(hmUI.widget.TEXT, {
        x: startX + 20,
        y: startY + 44,
        w: 110,
        h: 50,
        color: chanceColor,
        text_size: 44,
        align_h: hmUI.align.LEFT,
        align_v: hmUI.align.CENTER_V,
        text: `${chance}%`
      })

      this.widgets.statusText = hmUI.createWidget(hmUI.widget.TEXT, {
        x: startX + 130,
        y: startY + 50,
        w: CARD_WIDTH - 150,
        h: 24,
        color: COLOR_TEXT_BRIGHT,
        text_size: 17,
        align_h: hmUI.align.LEFT,
        align_v: hmUI.align.CENTER_V,
        text: statusDesc
      })

      const kp = data && data.kp !== undefined ? data.kp : 5.2
      const clouds = data && data.clouds !== undefined ? data.clouds : 12

      this.widgets.metricsRow = hmUI.createWidget(hmUI.widget.TEXT, {
        x: startX + 130,
        y: startY + 74,
        w: CARD_WIDTH - 150,
        h: 20,
        color: COLOR_TEXT_SKY,
        text_size: 15,
        align_h: hmUI.align.LEFT,
        align_v: hmUI.align.CENTER_V,
        text: `Kp ${kp} · Clouds ${clouds}%`
      })

      // 4. Mini 4-Hour Trend Sparkline
      const miniForecast = (data && data.hourlyForecast) || [
        { hour: '+1h', chance: 85, clouds: 12 },
        { hour: '+2h', chance: 90, clouds: 10 },
        { hour: '+3h', chance: 80, clouds: 18 },
        { hour: '+4h', chance: 65, clouds: 25 }
      ]

      const barStartX = startX + 20
      const barYBase = startY + 146
      const barMaxH = 26
      const barW = 84
      const barGap = 12

      for (let i = 0; i < 4; i++) {
        const item = miniForecast[i]
        if (!item) continue

        const itemChance = item.chance || 0
        const itemH = Math.max(4, Math.round((itemChance / 100) * barMaxH))
        const itemY = barYBase - itemH

        let barCol = COLOR_AURORA_HIGH
        if (item.clouds > 80 && itemChance > 10) barCol = COLOR_AURORA_NONE
        else if (itemChance >= 60) barCol = COLOR_AURORA_HIGH
        else if (itemChance >= 30) barCol = COLOR_AURORA_MED
        else if (itemChance >= 10) barCol = COLOR_AURORA_LOW
        else barCol = COLOR_AURORA_NONE

        // Background track
        hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: barStartX + i * (barW + barGap),
          y: barYBase - barMaxH,
          w: barW,
          h: barMaxH,
          radius: 3,
          color: 0x1e293b
        })

        // Active trend bar
        hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: barStartX + i * (barW + barGap),
          y: itemY,
          w: barW,
          h: itemH,
          radius: 3,
          color: barCol
        })

        // Mini label under bar
        hmUI.createWidget(hmUI.widget.TEXT, {
          x: barStartX + i * (barW + barGap),
          y: barYBase + 2,
          w: barW,
          h: 16,
          color: COLOR_TEXT_DIM,
          text_size: 11,
          align_h: hmUI.align.CENTER_H,
          align_v: hmUI.align.CENTER_V,
          text: `${item.hour.split(':')[0] || item.hour} ${itemChance}%`
        })
      }

      // 5. Transparent Full-Card Touch Overlay -> Jumps to full page
      this.widgets.clickOverlay = hmUI.createWidget(hmUI.widget.BUTTON, {
        x: startX,
        y: startY,
        w: CARD_WIDTH,
        h: CARD_HEIGHT,
        normal_color: 0x000000,
        press_color: 0x1e293b,
        click_func: () => {
          console.log('[AuroraTracker] Shortcut Card tapped -> Opening main app')
          if (typeof hmApp !== 'undefined' && hmApp.gotoPage) {
            hmApp.gotoPage({ url: 'page/index' })
          }
        }
      })
    }
  },

  onResume() {
    console.log('[AuroraTracker] AppWidget onResume')
    // Check if new data was updated by companion
    const app = typeof getApp === 'function' ? getApp() : null
    if (app && app._options && app._options.globalData && app._options.globalData.auroraData) {
      const data = app._options.globalData.auroraData
      this.state.auroraData = data
      if (this.widgets.chanceValue) {
        this.widgets.chanceValue.setProperty(hmUI.prop.TEXT, `${data.chancePercent}%`)
      }
      if (this.widgets.metricsRow) {
        this.widgets.metricsRow.setProperty(hmUI.prop.TEXT, `Kp ${data.kp} · Clouds ${data.clouds}%`)
      }
    }
  },

  onPause() {
    console.log('[AuroraTracker] AppWidget onPause')
  },

  onDestroy() {
    console.log('[AuroraTracker] AppWidget onDestroy')
  }
})

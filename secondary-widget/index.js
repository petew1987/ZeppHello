/**
 * Aurora Tracker - Zepp OS Secondary Widget (Swipe-Left Widget)
 * Target Device: Amazfit Active 3 (Round 466x466 AMOLED Screen)
 *
 * SecondaryWidget allows users to access an interactive glanceable view
 * by swiping left from their Watchface.
 *
 * Implements Zepp OS 2.x & 3.x SecondaryWidget lifecycle:
 * - onInit: initialize state and read cached data
 * - build: render full-screen AMOLED widget
 * - onResume: refresh view if updated data is available
 * - click: jumps directly to the full watch app (page/index)
 */

const SCREEN_SIZE = 466
const CENTER_X = 233
const CENTER_Y = 233

// AMOLED Colors
const COLOR_BLACK = 0x000000
const COLOR_ARC_BG = 0x1e293b
const COLOR_AURORA_HIGH = 0x10b981
const COLOR_AURORA_MED = 0x06b6d4
const COLOR_AURORA_LOW = 0xf59e0b
const COLOR_AURORA_NONE = 0xef4444
const COLOR_TEXT_MUTED = 0x94a3b8
const COLOR_TEXT_DIM = 0x64748b
const COLOR_TEXT_BRIGHT = 0xf8fafc
const COLOR_TEXT_SKY = 0x38bdf8

SecondaryWidget({
  state: {
    auroraData: null,
    locationText: 'Live GPS'
  },

  widgets: {
    bgArc: null,
    progressArc: null,
    chanceValue: null,
    statusText: null,
    metricsRow: null,
    locationLabel: null,
    tapHint: null,
    clickOverlay: null
  },

  onInit() {
    console.log('[AuroraTracker] SecondaryWidget initialized')
    const app = typeof getApp === 'function' ? getApp() : null
    if (app && app._options && app._options.globalData && app._options.globalData.auroraData) {
      this.state.auroraData = app._options.globalData.auroraData
      if (app._options.globalData.currentLocationName) {
        this.state.locationText = app._options.globalData.currentLocationName
      }
    }
  },

  build() {
    if (typeof hmUI === 'undefined') return

    // 1. Background Arc (sweep 270 deg)
    this.widgets.bgArc = hmUI.createWidget(hmUI.widget.ARC, {
      x: 36,
      y: 36,
      w: 394,
      h: 394,
      start_angle: 135,
      end_angle: 405,
      color: COLOR_ARC_BG,
      line_width: 8
    })

    const data = this.state.auroraData
    const chance = data ? data.chancePercent : 85
    const sweep = Math.round((Math.min(100, Math.max(0, chance)) / 100) * 270)
    const endAngle = 135 + sweep

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

    // 2. Active Arc
    if (sweep > 0) {
      this.widgets.progressArc = hmUI.createWidget(hmUI.widget.ARC, {
        x: 36,
        y: 36,
        w: 394,
        h: 394,
        start_angle: 135,
        end_angle: endAngle,
        color: chanceColor,
        line_width: 8
      })
    }

    // 3. Location & Header
    this.widgets.locationLabel = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 33,
      y: 90,
      w: 400,
      h: 24,
      color: COLOR_TEXT_MUTED,
      text_size: 16,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
      text: `AURORA · ${this.state.locationText}`
    })

    // 4. Probability Value
    this.widgets.chanceValue = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 33,
      y: 130,
      w: 400,
      h: 70,
      color: chanceColor,
      text_size: 64,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
      text: `${chance}%`
    })

    // 5. Status Text
    this.widgets.statusText = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 33,
      y: 212,
      w: 400,
      h: 28,
      color: COLOR_TEXT_BRIGHT,
      text_size: 18,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
      text: statusDesc
    })

    const kp = data && data.kp !== undefined ? data.kp : 5.2
    const clouds = data && data.clouds !== undefined ? data.clouds : 12

    // 6. Metrics
    this.widgets.metricsRow = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 33,
      y: 250,
      w: 400,
      h: 26,
      color: COLOR_TEXT_SKY,
      text_size: 17,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
      text: `Kp ${kp} · Clouds ${clouds}%`
    })

    // 7. Tap to open full app
    this.widgets.tapHint = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 33,
      y: 330,
      w: 400,
      h: 22,
      color: COLOR_TEXT_DIM,
      text_size: 14,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
      text: 'Tap to open Aurora Tracker'
    })

    // 8. Full screen click overlay
    this.widgets.clickOverlay = hmUI.createWidget(hmUI.widget.BUTTON, {
      x: 0,
      y: 0,
      w: SCREEN_SIZE,
      h: SCREEN_SIZE,
      normal_color: 0x000000,
      press_color: 0x1e293b,
      click_func: () => {
        console.log('[AuroraTracker] SecondaryWidget tapped -> Opening main app')
        if (typeof hmApp !== 'undefined' && hmApp.gotoPage) {
          hmApp.gotoPage({ url: 'page/index' })
        }
      }
    })
  },

  onResume() {
    console.log('[AuroraTracker] SecondaryWidget onResume')
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
    console.log('[AuroraTracker] SecondaryWidget onPause')
  },

  onDestroy() {
    console.log('[AuroraTracker] SecondaryWidget onDestroy')
  }
})

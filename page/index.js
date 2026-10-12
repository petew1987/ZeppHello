/**
 * ZeppHello - Watch Page UI (Zepp OS 2.x & 3.x Compatible)
 * Publisher: Stealth Apps
 * Target Device: Amazfit Active 3 Premium (Round 466x466 AMOLED Screen)
 */

import { BasePage } from '@zeppos/zml/base-page'

const SCREEN_SIZE = 466

const COLORS = [
  { name: 'Purple', hex: '#a855f7', int: 0xa855f7 },
  { name: 'Emerald', hex: '#10b981', int: 0x10b981 },
  { name: 'Cyan', hex: '#06b6d4', int: 0x06b6d4 },
  { name: 'Amber', hex: '#f59e0b', int: 0xf59e0b },
  { name: 'Rose', hex: '#f43f5e', int: 0xf43f5e },
  { name: 'Sky', hex: '#38bdf8', int: 0x38bdf8 }
]

Page(
  BasePage({
    state: {
      colorIndex: 0,
      clickCount: 0,
      currentColor: COLORS[0].int,
      colorName: COLORS[0].name
    },

    widgets: {
      bgArc: null,
      titleLabel: null,
      helloBtn: null,
      counterLabel: null,
      infoLabel: null,
      syncBtn: null
    },

    onInit() {
      console.log('[ZeppHello] Watch page onInit')
      try {
        const app = typeof getApp === 'function' ? getApp() : null
        if (app && app._options && app._options.globalData && app._options.globalData.textColor) {
          const storedHex = app._options.globalData.textColor
          const foundIndex = COLORS.findIndex(c => c.hex.toLowerCase() === storedHex.toLowerCase())
          if (foundIndex !== -1) {
            this.state.colorIndex = foundIndex
            this.state.currentColor = COLORS[foundIndex].int
            this.state.colorName = COLORS[foundIndex].name
          }
        }
      } catch (e) {
        console.warn('Could not read globalData color:', e)
      }
    },

    build() {
      console.log('[ZeppHello] Watch page build start')
      this.createBackgroundDesign()
      this.createHelloWidgets()
      console.log('[ZeppHello] Watch page build complete')
    },

    createBackgroundDesign() {
      if (typeof hmUI !== 'undefined' && hmUI.createWidget) {
        try {
          this.widgets.bgArc = hmUI.createWidget(hmUI.widget.ARC, {
            x: 36,
            y: 36,
            w: 394,
            h: 394,
            start_angle: 135,
            end_angle: 405,
            color: 0x334155,
            line_width: 10
          })
        } catch (err) {
          console.warn('Error creating bgArc:', err)
        }
      }
    },

    createHelloWidgets() {
      if (typeof hmUI === 'undefined' || !hmUI.createWidget) return

      try {
        // 1. Subtitle header
        hmUI.createWidget(hmUI.widget.TEXT, {
          x: 43,
          y: 95,
          w: 380,
          h: 30,
          color: 0x94a3b8,
          text_size: 16,
          align_h: hmUI.align.CENTER_H,
          align_v: hmUI.align.CENTER_V,
          text: 'STEALTH APPS'
        })

        // 2. Main interactive Hello Button
        this.widgets.helloBtn = hmUI.createWidget(hmUI.widget.BUTTON, {
          x: 83,
          y: 135,
          w: 300,
          h: 110,
          normal_color: 0x1e293b,
          press_color: 0x334155,
          radius: 24,
          text: 'Hello!',
          text_size: 40,
          color: this.state.currentColor,
          click_func: () => {
            this.onHelloTap()
          }
        })

        // 3. Click Counter label
        this.widgets.counterLabel = hmUI.createWidget(hmUI.widget.TEXT, {
          x: 43,
          y: 265,
          w: 380,
          h: 36,
          color: 0xffffff,
          text_size: 20,
          align_h: hmUI.align.CENTER_H,
          align_v: hmUI.align.CENTER_V,
          text: `Taps: 0 . ${this.state.colorName}`
        })

        // 4. Instructions label
        this.widgets.infoLabel = hmUI.createWidget(hmUI.widget.TEXT, {
          x: 53,
          y: 310,
          w: 360,
          h: 40,
          color: 0x94a3b8,
          text_size: 14,
          align_h: hmUI.align.CENTER_H,
          align_v: hmUI.align.CENTER_V,
          text: 'Tap button to cycle color'
        })

        // 5. Sync / Companion Test Button
        this.widgets.syncBtn = hmUI.createWidget(hmUI.widget.BUTTON, {
          x: 143,
          y: 365,
          w: 180,
          h: 46,
          normal_color: 0x7e22ce,
          press_color: 0x6b21a8,
          radius: 16,
          text: 'SYNC',
          text_size: 16,
          color: 0xffffff,
          click_func: () => {
            this.fetchCompanionSettings()
          }
        })
      } catch (e) {
        console.warn('Error creating watch widgets:', e)
      }
    },

    onHelloTap() {
      this.state.clickCount++
      this.state.colorIndex = (this.state.colorIndex + 1) % COLORS.length
      const activeColor = COLORS[this.state.colorIndex]
      this.state.currentColor = activeColor.int
      this.state.colorName = activeColor.name

      if (this.widgets.helloBtn) {
        try {
          this.widgets.helloBtn.setProperty(hmUI.prop.COLOR, activeColor.int)
        } catch (e) {}
      }
      if (this.widgets.counterLabel) {
        try {
          this.widgets.counterLabel.setProperty(
            hmUI.prop.TEXT,
            `Taps: ${this.state.clickCount} . ${activeColor.name}`
          )
        } catch (e) {}
      }

      try {
        const app = typeof getApp === 'function' ? getApp() : null
        if (app && app._options && app._options.globalData) {
          app._options.globalData.clickCount = this.state.clickCount
          app._options.globalData.textColor = activeColor.hex
        }
      } catch (e) {}
    },

    fetchCompanionSettings() {
      if (this.widgets.counterLabel) {
        try {
          this.widgets.counterLabel.setProperty(hmUI.prop.TEXT, 'Syncing...')
        } catch (e) {}
      }

      try {
        this.request({
          type: 'GET_SETTINGS'
        }).then((response) => {
          if (response && response.success && response.data) {
            const data = response.data
            if (data.textColor) {
              const foundIndex = COLORS.findIndex(c => c.hex.toLowerCase() === data.textColor.toLowerCase())
              if (foundIndex !== -1) {
                this.state.colorIndex = foundIndex
                this.state.currentColor = COLORS[foundIndex].int
                this.state.colorName = COLORS[foundIndex].name
                if (this.widgets.helloBtn) {
                  this.widgets.helloBtn.setProperty(hmUI.prop.COLOR, this.state.currentColor)
                }
              }
            }
            if (this.widgets.counterLabel) {
              this.widgets.counterLabel.setProperty(
                hmUI.prop.TEXT,
                `Synced . ${this.state.colorName}`
              )
            }
          }
        }).catch(() => {
          if (this.widgets.counterLabel) {
            this.widgets.counterLabel.setProperty(hmUI.prop.TEXT, 'Offline')
          }
        })
      } catch (e) {
        if (this.widgets.counterLabel) {
          this.widgets.counterLabel.setProperty(hmUI.prop.TEXT, 'Error')
        }
      }
    },

    onDestroy() {
      console.log('[ZeppHello] Watch page onDestroy')
    }
  })
)

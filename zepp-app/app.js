/**
 * ZeppHello - Zepp OS Application Entry Point
 * Publisher: Stealth Apps
 *
 * TEMPLATE ARCHITECTURE NOTES:
 * - This is the root app.js file executed when the Zepp OS mini-app starts.
 * - globalData is shared across pages, widgets, and side services.
 * - Use BaseApp from @zeppos/zml/base-app for lifecycle management.
 */
import { BaseApp } from '@zeppos/zml/base-app'

App(
  BaseApp({
    globalData: {
      appName: 'ZeppHello',
      vender: 'Stealth Apps',
      textColor: '#10b981', // Default Emerald Green
      clickCount: 0
    },
    onCreate(options) {
      console.log('[ZeppHello] App onCreate initialized by Stealth Apps')
    },
    onDestroy(options) {
      console.log('[ZeppHello] App onDestroy called')
    }
  })
)

/**
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
)

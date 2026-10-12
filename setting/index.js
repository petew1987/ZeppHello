/**
 * ZeppHello - Settings App (Runs on Smartphone Zepp App for Android & iOS)
 *
 * TEMPLATE ARCHITECTURE NOTES:
 * - Rendered in the Zepp smartphone app when configuring the mini-app.
 * - Uses declarative UI components (View, Text, Select, Button, Toggle, etc.).
 * - Persists user preferences to settingsStorage, which syncs to watch & companion.
 */

const COLOR_OPTIONS = [
  { name: 'Purple (#a855f7)', value: '#a855f7' },
  { name: 'Emerald Green (#10b981)', value: '#10b981' },
  { name: 'Cyan Blue (#06b6d4)', value: '#06b6d4' },
  { name: 'Amber Gold (#f59e0b)', value: '#f59e0b' },
  { name: 'Hot Pink (#f43f5e)', value: '#f43f5e' },
  { name: 'Sky Blue (#38bdf8)', value: '#38bdf8' }
]

AppSettingsPage({
  state: {
    selectedColor: '#a855f7'
  },

  build(props) {
    let currentColor = '#a855f7'
    try {
      const stored = props.settingsStorage.getItem('textColor')
      if (stored) {
        currentColor = typeof stored === 'string' ? stored : stored.hex || stored
      }
    } catch (e) {
      console.log('[ZeppHelloSettings] Error reading settingsStorage:', e)
    }

    return View(
      {
        style: {
          padding: '20px 16px',
          backgroundColor: '#090d16',
          minHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }
      },
      [
        // Header
        View(
          { style: { paddingBottom: '12px', borderBottom: '1px solid #1e293b' } },
          [
            Text({
              style: {
                fontSize: '20px',
                fontWeight: '600',
                color: '#f8fafc',
                marginBottom: '4px'
              }
            }, 'ZeppHello Customizer'),
            Text({
              style: { fontSize: '13px', color: '#94a3b8' }
            }, 'Configure default text color for Amazfit smartwatch')
          ]
        ),

        // Color Selection Section
        Section(
          {
            title: 'TEXT COLOR THEME',
            style: {
              backgroundColor: '#111827',
              border: '1px solid #1f2937',
              borderRadius: '12px',
              padding: '16px'
            }
          },
          [
            Text({
              style: { fontSize: '12px', color: '#94a3b8', marginBottom: '12px', lineHeight: '18px' }
            }, 'Select the default highlight color for the Hello message on your watch:'),

            Select({
              label: 'Hello Text Color',
              settingsKey: 'textColor',
              options: COLOR_OPTIONS
            })
          ]
        ),

        // Quick Preset Swatches Section
        Section(
          {
            title: 'QUICK SWATCHES',
            style: {
              backgroundColor: '#111827',
              border: '1px solid #1f2937',
              borderRadius: '12px',
              padding: '16px'
            }
          },
          [
            Text({
              style: { fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }
            }, 'Tap any swatch to apply instantly:'),

            View(
              {
                style: {
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '10px',
                  flexWrap: 'wrap'
                }
              },
              COLOR_OPTIONS.map(opt => {
                const isActive = currentColor.toLowerCase() === opt.value.toLowerCase()
                return Button({
                  label: opt.name.split(' ')[0],
                  style: {
                    fontSize: '12px',
                    fontWeight: '600',
                    padding: '8px 14px',
                    backgroundColor: opt.value,
                    color: '#000000',
                    borderRadius: '8px',
                    border: isActive ? '2px solid #ffffff' : 'none'
                  },
                  onClick: () => {
                    props.settingsStorage.setItem('textColor', opt.value)
                  }
                })
              })
            )
          ]
        ),

        // Template Documentation Footer
        View(
          {
            style: {
              backgroundColor: '#0d131f',
              border: '1px solid #1f2937',
              borderRadius: '12px',
              padding: '16px',
              marginTop: '8px'
            }
          },
          [
            Text({
              style: { fontSize: '13px', fontWeight: '600', color: '#38bdf8', marginBottom: '6px' }
            }, '💡 Developer Template Notes'),
            Text({
              style: { fontSize: '12px', color: '#94a3b8', lineHeight: '18px' }
            }, 'To build your own app, modify page/index.js for watch UI, app-side/index.js for APIs, and setting/index.js for user options.')
          ]
        )
      ]
    )
  }
})

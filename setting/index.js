/**
 * Aurora Tracker - Settings App (Runs on Smartphone Zepp App for Android & iOS)
 *
 * Responsibilities:
 * 1. Allows user to select active location (Current Watch GPS vs Saved Locations).
 * 2. Allows user to save, edit, and delete custom northern lights viewing locations.
 * 3. Persists configuration in Zepp OS settingsStorage.
 * 4. Communicates automatically with app-side/index.js companion service.
 *
 * Visual Finish:
 * - Professional, aligned, and distributed layout.
 * - ZERO BADGES / ZERO PILLS: Clean typographic lists with radio markers and subtle borders.
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
      if (raw) {
        savedLocations = typeof raw === 'string' ? JSON.parse(raw) : raw
      }
    } catch (e) {
      console.log('[AuroraSettings] Error reading savedLocations:', e)
    }

    if (!savedLocations || savedLocations.length === 0) {
      savedLocations = [...DEFAULT_PRESET_LOCATIONS]
      props.settingsStorage.setItem('savedLocations', JSON.stringify(savedLocations))
    }

    let activeLocationId = props.settingsStorage.getItem('activeLocationId') || 'gps'

    const selectOptions = [
      { name: 'Watch GPS (Live Hardware Sensor)', value: 'gps' },
      ...savedLocations.map(loc => ({
        name: `${loc.name} · ${loc.lat.toFixed(2)}°N, ${loc.lon.toFixed(2)}°E`,
        value: loc.id
      }))
    ]

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
        // Clean Title Block without badges
        View(
          { style: { paddingBottom: '12px', borderBottom: '1px solid #1e293b' } },
          [
            Text({
              style: {
                fontSize: '20px',
                fontWeight: '600',
                color: '#f8fafc',
                letterSpacing: '-0.02em',
                marginBottom: '4px'
              }
            }, 'Aurora Target & Locations'),
            Text({
              style: { fontSize: '13px', color: '#94a3b8' }
            }, 'Choose active target coordinates synced to Amazfit Active 3')
          ]
        ),

        // Section 1: Active Target Mode
        Section(
          {
            title: 'ACTIVE TARGET MODE',
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
            }, 'Select whether the watch queries NOAA space weather using real-time GPS or a saved destination:'),
            Select({
              label: 'Selected Location',
              settingsKey: 'activeLocationId',
              options: selectOptions
            })
          ]
        ),

        // Section 2: Saved Locations List
        Section(
          {
            title: `SAVED DESTINATIONS (${savedLocations.length})`,
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
            }, 'Synced to watch. Tap the top location on the watch face to cycle through these destinations.'),

            ...savedLocations.map((loc) => {
              const isSelected = activeLocationId === loc.id
              return View(
                {
                  style: {
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    backgroundColor: isSelected ? '#132e27' : '#0d131f',
                    border: isSelected ? '1px solid #059669' : '1px solid #1f2937',
                    borderRadius: '8px',
                    marginBottom: '8px'
                  }
                },
                [
                  View({ style: { display: 'flex', flexDirection: 'column', gap: '2px' } }, [
                    View({ style: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px' } }, [
                      Text({
                        style: {
                          fontSize: '14px',
                          fontWeight: '600',
                          color: isSelected ? '#34d399' : '#f8fafc'
                        }
                      }, loc.name),
                      isSelected
                        ? Text({ style: { fontSize: '12px', color: '#34d399', fontWeight: '500' } }, '· Active')
                        : null
                    ]),
                    Text({
                      style: { fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }
                    }, `${loc.lat.toFixed(2)}°N, ${loc.lon.toFixed(2)}°E ${loc.country ? `· ${loc.country}` : ''}`)
                  ]),
                  View({ style: { display: 'flex', flexDirection: 'row', gap: '8px' } }, [
                    !isSelected
                      ? Button({
                          label: 'Set Active',
                          style: {
                            fontSize: '12px',
                            fontWeight: '500',
                            padding: '6px 12px',
                            backgroundColor: '#1e293b',
                            color: '#e2e8f0',
                            borderRadius: '6px'
                          },
                          onClick: () => {
                            props.settingsStorage.setItem('activeLocationId', loc.id)
                          }
                        })
                      : null,
                    Button({
                      label: 'Delete',
                      style: {
                        fontSize: '12px',
                        fontWeight: '500',
                        padding: '6px 10px',
                        backgroundColor: '#2d1517',
                        color: '#f87171',
                        borderRadius: '6px'
                      },
                      onClick: () => {
                        const updated = savedLocations.filter(item => item.id !== loc.id)
                        props.settingsStorage.setItem('savedLocations', JSON.stringify(updated))
                        if (activeLocationId === loc.id) {
                          props.settingsStorage.setItem('activeLocationId', 'gps')
                        }
                      }
                    })
                  ])
                ]
              )
            })
          ]
        ),

        // Section 3: Add Custom Coordinates
        Section(
          {
            title: 'ADD DESTINATION',
            style: {
              backgroundColor: '#111827',
              border: '1px solid #1f2937',
              borderRadius: '12px',
              padding: '16px'
            }
          },
          [
            TextInput({
              label: 'Destination Name',
              placeholder: 'e.g. Abisko Sky Station',
              value: this.state.inputName,
              onChange: (val) => {
                this.state.inputName = val
              }
            }),
            TextInput({
              label: 'Latitude (°N)',
              placeholder: 'e.g. 68.35',
              value: this.state.inputLat,
              onChange: (val) => {
                this.state.inputLat = val
              }
            }),
            TextInput({
              label: 'Longitude (°E/W)',
              placeholder: 'e.g. 18.83 (negative for West)',
              value: this.state.inputLon,
              onChange: (val) => {
                this.state.inputLon = val
              }
            }),
            Button({
              label: 'Add Destination',
              style: {
                backgroundColor: '#059669',
                color: '#ffffff',
                fontWeight: '600',
                fontSize: '14px',
                marginTop: '14px',
                padding: '10px',
                borderRadius: '8px',
                width: '100%'
              },
              onClick: () => {
                const name = (this.state.inputName || '').trim()
                const lat = parseFloat(this.state.inputLat)
                const lon = parseFloat(this.state.inputLon)

                if (!name || isNaN(lat) || isNaN(lon)) {
                  return
                }

                const newLoc = {
                  id: 'loc_' + Date.now(),
                  name,
                  lat,
                  lon
                }

                const updated = [...savedLocations, newLoc]
                props.settingsStorage.setItem('savedLocations', JSON.stringify(updated))
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
})

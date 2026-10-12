import React, { useState, useEffect } from 'react';
import {
  Watch,
  Sliders,
  QrCode,
  BookOpen,
  Zap,
  Check,
  Copy,
  RefreshCw,
  LayoutGrid,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import QRCode from 'qrcode';

const COLORS = [
  { name: 'Emerald', hex: '#10b981', int: 0x10b981 },
  { name: 'Cyan', hex: '#06b6d4', int: 0x06b6d4 },
  { name: 'Amber', hex: '#f59e0b', int: 0xf59e0b },
  { name: 'Pink', hex: '#ec4899', int: 0xec4899 },
  { name: 'Violet', hex: '#8b5cf6', int: 0x8b5cf6 },
  { name: 'Sky', hex: '#38bdf8', int: 0x38bdf8 }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'emulator' | 'settings' | 'builder' | 'docs'>('emulator');
  const [watchView, setWatchView] = useState<'page' | 'app-widget' | 'secondary-widget'>('page');
  const [currentColorHex, setCurrentColorHex] = useState('#10b981');
  const [defaultColorHex, setDefaultColorHex] = useState('#10b981');
  const [clickCount, setClickCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildSuccess, setBuildSuccess] = useState(false);

  const zpkd1Url = 'zpkd1://github.com/stealth-apps/zepphello/releases/latest/download/zepphello.zab';

  // Generate QR code for Zepp App Developer Mode (`zpkd1://` protocol)
  useEffect(() => {
    QRCode.toDataURL(zpkd1Url, {
      width: 280,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    })
      .then((url: string) => setQrDataUrl(url))
      .catch((err: unknown) => console.error('QR generation error:', err));
  }, []);

  // When clicking the watch face, cycle through colors and increment taps
  const handleWatchClick = () => {
    setClickCount(prev => prev + 1);
    const currentIndex = COLORS.findIndex(c => c.hex.toLowerCase() === currentColorHex.toLowerCase());
    const nextIndex = (currentIndex + 1) % COLORS.length;
    setCurrentColorHex(COLORS[nextIndex].hex);
  };

  // Change default color in settings
  const handleDefaultColorSelect = (hex: string) => {
    setDefaultColorHex(hex);
    setCurrentColorHex(hex);
  };

  const triggerBuild = () => {
    setIsBuilding(true);
    setBuildSuccess(false);
    setTimeout(() => {
      setIsBuilding(false);
      setBuildSuccess(true);
    }, 1000);
  };

  const copyScheme = () => {
    navigator.clipboard.writeText(zpkd1Url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeColorObj = COLORS.find(c => c.hex.toLowerCase() === currentColorHex.toLowerCase()) || COLORS[0];

  return (
    <div className="min-h-screen bg-black text-slate-100 font-sans antialiased selection:bg-teal-500/30 selection:text-teal-200">
      {/* Top Header with responsive wrapping */}
      <header className="border-b border-slate-900 bg-black/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Company */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
              <Watch className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base font-bold text-white tracking-tight">ZeppHello</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400">
                  Stealth Apps Template
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">Zepp OS 3.0 / 2.x Builder & Tester</p>
            </div>
          </div>

          {/* Navigation Menus with Flex-Wrap */}
          <nav className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setActiveTab('emulator')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'emulator'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Watch className="w-3.5 h-3.5" /> Watch Tester
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'settings'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" /> Settings
            </button>

            <button
              onClick={() => setActiveTab('builder')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'builder'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" /> QR Installer
            </button>

            <button
              onClick={() => setActiveTab('docs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'docs'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> Code Guide
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {/* TAB 1: EMULATOR & WATCH TESTER */}
        {activeTab === 'emulator' && (
          <div className="space-y-6">
            {/* View Selector for Watch Screens */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-950 border border-slate-900">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Select Watch View:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setWatchView('page')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      watchView === 'page'
                        ? 'bg-teal-900/60 text-teal-300 border border-teal-700/50'
                        : 'bg-black text-slate-400 hover:text-slate-300 border border-slate-800'
                    }`}
                  >
                    Main Watch App (page/index.js)
                  </button>
                  <button
                    onClick={() => setWatchView('app-widget')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      watchView === 'app-widget'
                        ? 'bg-teal-900/60 text-teal-300 border border-teal-700/50'
                        : 'bg-black text-slate-400 hover:text-slate-300 border border-slate-800'
                    }`}
                  >
                    Shortcut Card (app-widget/index.js)
                  </button>
                  <button
                    onClick={() => setWatchView('secondary-widget')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      watchView === 'secondary-widget'
                        ? 'bg-teal-900/60 text-teal-300 border border-teal-700/50'
                        : 'bg-black text-slate-400 hover:text-slate-300 border border-slate-800'
                    }`}
                  >
                    Secondary Widget (secondary-widget/index.js)
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Amazfit Active 3 (466x466)</span>
              </div>
            </div>

            {/* Emulator + Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Interactive Watch Simulator */}
              <div className="lg:col-span-6 flex justify-center order-2 lg:order-1">
                <div className="relative p-4 sm:p-6 rounded-[52px] bg-gradient-to-b from-slate-900 via-black to-slate-950 border-4 border-slate-800 shadow-2xl">
                  {/* Bezel */}
                  <div className="relative w-[300px] h-[300px] sm:w-[360px] sm:h-[360px] rounded-full bg-black border border-slate-800 overflow-hidden flex flex-col items-center justify-center p-6 text-center select-none shadow-inner">
                    {/* VIEW 1: Main Watch App */}
                    {watchView === 'page' && (
                      <div
                        onClick={handleWatchClick}
                        className="w-full h-full flex flex-col items-center justify-center cursor-pointer group"
                      >
                        {/* Outer Arc */}
                        <div className="absolute inset-3 rounded-full border-2 border-slate-800/80 pointer-events-none"></div>

                        <span className="text-[11px] tracking-widest text-slate-400 font-semibold mb-1">
                          STEALTH APPS · ZEPP OS
                        </span>

                        <div
                          className="text-3xl sm:text-4xl font-extrabold tracking-tight transition-all duration-200 group-hover:scale-105 my-2"
                          style={{ color: currentColorHex }}
                        >
                          Hello, Zepp OS!
                        </div>

                        <div className="text-xs text-slate-400 font-medium">
                          Taps: {clickCount} · {activeColorObj.name}
                        </div>

                        <div className="mt-4 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-teal-400 font-medium group-hover:border-teal-500/40 transition-colors">
                          Tap screen to cycle color ✨
                        </div>

                        <div className="absolute bottom-5 text-[10px] text-slate-400">
                          page/index.js · Round 466x466
                        </div>
                      </div>
                    )}

                    {/* VIEW 2: Shortcut Card Widget */}
                    {watchView === 'app-widget' && (
                      <div
                        onClick={handleWatchClick}
                        className="w-full h-full flex flex-col items-center justify-center p-4 cursor-pointer group"
                      >
                        <div className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-2 group-hover:border-teal-500/40 transition-all">
                          <div className="text-[10px] font-semibold text-sky-400 tracking-wider uppercase">
                            Shortcut Card Widget
                          </div>
                          <div className="text-2xl font-bold" style={{ color: currentColorHex }}>
                            Hello, Zepp OS!
                          </div>
                          <div className="text-xs text-slate-400">
                            Stealth Apps · Taps: {clickCount}
                          </div>
                        </div>
                        <div className="mt-4 text-[11px] text-slate-400">
                          Amazfit Shortcut Screen (Swipe Right)
                        </div>
                      </div>
                    )}

                    {/* VIEW 3: Secondary Widget */}
                    {watchView === 'secondary-widget' && (
                      <div
                        onClick={handleWatchClick}
                        className="w-full h-full flex flex-col items-center justify-center cursor-pointer group"
                      >
                        <div className="absolute inset-3 rounded-full border-2 border-slate-800 pointer-events-none"></div>
                        <div className="text-xs text-sky-400 font-medium mb-1">STEALTH APPS GLANCE</div>
                        <div className="text-3xl font-black my-1" style={{ color: currentColorHex }}>
                          Hello, Zepp OS!
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          Total Taps: {clickCount}
                        </div>
                        <div className="mt-4 text-[10px] text-slate-400">
                          Swipe-Left Widget (secondary-widget)
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Interaction Controls & Metrics */}
              <div className="lg:col-span-6 space-y-5 order-1 lg:order-2">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-medium">
                    <Sparkles className="w-3 h-3" /> Live Event & State Tester
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-2">
                    Click watch to test interactive color shifts.
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                    This template includes the complete Zepp OS architecture: watch UI, companion service, shortcut widgets, and mobile settings. Tapping the watch updates reactive state and cycles through vibrant AMOLED colors.
                  </p>
                </div>

                {/* Metrics Cards with Flex Wrapping */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-900">
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">Active Color</span>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: currentColorHex }}></span>
                      <span className="text-sm font-semibold text-slate-200">{activeColorObj.name}</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-900">
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">Interaction Taps</span>
                    <div className="text-lg font-bold text-teal-400 mt-1">{clickCount} Taps</div>
                  </div>
                </div>

                {/* Action Shortcuts */}
                <div className="flex flex-wrap gap-2.5 pt-1">
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs transition-all flex items-center gap-1.5 shadow"
                  >
                    <Sliders className="w-3.5 h-3.5" /> Customize Default Color
                  </button>

                  <button
                    onClick={() => setActiveTab('builder')}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-medium text-xs transition-all border border-slate-800 flex items-center gap-1.5"
                  >
                    <QrCode className="w-3.5 h-3.5" /> Zepp App QR Code
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SETTINGS (Zepp App Smartphone UI Simulator) */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-950 border border-slate-900 space-y-5">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-teal-400" /> Zepp App Settings Customizer
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">setting/index.js</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Simulates the smartphone configuration screen. In Zepp OS, settings are saved in <code>settingsStorage</code> and synchronized to the watch via <code>app-side/index.js</code>.
                </p>
              </div>

              {/* Color Selection Palette */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  Select Default Hello Color
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {COLORS.map(c => {
                    const isSelected = defaultColorHex.toLowerCase() === c.hex.toLowerCase();
                    return (
                      <button
                        key={c.hex}
                        onClick={() => handleDefaultColorSelect(c.hex)}
                        className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-teal-950/40 border-teal-500 text-white'
                            : 'bg-black border-slate-900 text-slate-400 hover:border-slate-800'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: c.hex }}></span>
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-slate-200">{c.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{c.hex}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Settings Storage Explainer */}
              <div className="p-3.5 rounded-xl bg-black border border-slate-900 text-xs text-slate-400 space-y-1.5">
                <span className="font-semibold text-slate-300 block">How settings synchronization works:</span>
                <p className="leading-relaxed">
                  When a user picks a color on their smartphone, <code>props.settingsStorage.setItem('textColor', value)</code> persists it. The companion service (<code>app-side/index.js</code>) reads it and responds to watch IPC queries.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setActiveTab('emulator')}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition-all shadow"
                >
                  Apply & Return to Watch Face
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BUILDER & QR CODE INSTALLER */}
        {activeTab === 'builder' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-950 border border-slate-900 space-y-5">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-teal-400" /> Zepp App Developer Mode QR Installer
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Scan this QR code with the Zepp App to wirelessly install your mini-app onto your Amazfit smartwatch.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center p-4 sm:p-5 rounded-xl bg-black border border-slate-900">
                {/* QR Code Container */}
                <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow shrink-0">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="Zepp Developer Mode QR Code" className="w-48 h-48 sm:w-56 sm:h-56" />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">Generating QR...</div>
                  )}
                  <span className="text-[10px] text-slate-700 font-mono font-semibold mt-2">
                    Protocol: zpkd1:// (Recognized by Zepp App)
                  </span>
                </div>

                {/* Step-by-Step Instructions with Wrap */}
                <div className="space-y-3.5">
                  <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    How to Install Step-by-Step:
                  </h4>
                  <ol className="text-xs text-slate-400 space-y-2 list-decimal list-inside leading-relaxed">
                    <li>Open <strong>Zepp App</strong> on your phone.</li>
                    <li>Go to <strong>Profile &rarr; Settings &rarr; About</strong> and tap the Zepp logo <strong>7 times</strong> to enable Developer Mode.</li>
                    <li>Return to <strong>Profile &rarr; [Amazfit Device] &rarr; Developer Mode</strong>.</li>
                    <li>Tap the <strong>QR scanner icon</strong> (top right) and scan the QR code!</li>
                  </ol>

                  {/* Copy URL Scheme Box with break-all to prevent overflow */}
                  <div className="pt-1">
                    <button
                      onClick={copyScheme}
                      className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-mono text-teal-300 flex items-center justify-between gap-2 text-left transition-all"
                    >
                      <span className="truncate break-all">zpkd1://.../zepphello.zab</span>
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Copy className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Build Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={triggerBuild}
                    disabled={isBuilding}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-medium text-xs transition-all flex items-center gap-1.5 shadow"
                  >
                    {isBuilding ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                    {isBuilding ? 'Building Package...' : 'Simulate Build (.zab)'}
                  </button>

                  {buildSuccess && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Package compiled successfully
                    </span>
                  )}
                </div>

                <span className="text-xs text-slate-400">
                  Published by Stealth Apps
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TEMPLATE CODEBASE GUIDE */}
        {activeTab === 'docs' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-950 border border-slate-900 space-y-5">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-teal-400" /> Zepp OS Template Architecture Notes
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Keep this guide handy when building your next Zepp OS app using this template by Stealth Apps.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-xl bg-black border border-slate-900 space-y-1.5">
                  <div className="text-xs font-semibold text-teal-400 font-mono">1. /page/index.js (Watch Face UI)</div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Builds the primary watch canvas using <code>hmUI.createWidget()</code> for the 466x466 AMOLED screen. Receives touch events and communicates with companion services via <code>this.request()</code>.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-black border border-slate-900 space-y-1.5">
                  <div className="text-xs font-semibold text-teal-400 font-mono">2. /app-side/index.js (Companion Service)</div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Background service running on the mobile phone. Provides full fetch network access, performs heavy background tasks, and syncs configurations from <code>settingsStorage</code>.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-black border border-slate-900 space-y-1.5">
                  <div className="text-xs font-semibold text-teal-400 font-mono">3. /setting/index.js (Phone Settings App)</div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Rendered inside the Zepp App on smartphone. Uses <code>AppSettingsPage</code> and <code>props.settingsStorage</code> so users can customize themes, colors, and options.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-black border border-slate-900 space-y-1.5">
                  <div className="text-xs font-semibold text-teal-400 font-mono">4. /app-widget/index.js (Shortcut Card)</div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Shortcut Card widget on the Amazfit negative screen (swiping right). Displays quick info and opens the main app on click.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-black border border-slate-900 space-y-1.5">
                  <div className="text-xs font-semibold text-teal-400 font-mono">5. /secondary-widget/index.js (Glance Widget)</div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Full-circle glanceable widget accessible when swiping left from the watchface. Ideal for fast status checks.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-black border border-slate-900 space-y-1.5">
                  <div className="text-xs font-semibold text-teal-400 font-mono">6. /app.json & /scripts/generate-qr.js</div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Manifest file specifying target 466x466 resolution and permissions. The QR generator creates <code>zpkd1://</code> QR codes for seamless Zepp App Developer Mode installation.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-teal-950/20 border border-teal-900/40 text-xs text-teal-300 flex items-center justify-between gap-3">
                <span>Template created and maintained by <strong>Stealth Apps</strong>.</span>
                <span className="font-mono text-[11px] text-teal-400">Zepp OS v2.x / v3.x Ready</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

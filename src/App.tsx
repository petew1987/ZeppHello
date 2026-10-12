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
  Sparkles,
  ExternalLink,
  Download,
  Globe,
  Github,
  CheckCircle2,
  Info
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
  const [activeTab, setActiveTab] = useState<'builder' | 'emulator' | 'settings' | 'docs'>('builder');
  const [watchView, setWatchView] = useState<'page' | 'app-widget' | 'secondary-widget'>('page');
  const [currentColorHex, setCurrentColorHex] = useState('#10b981');
  const [defaultColorHex, setDefaultColorHex] = useState('#10b981');
  const [clickCount, setClickCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildSuccess, setBuildSuccess] = useState(false);

  // QR Code Source Configuration
  const [qrSource, setQrSource] = useState<'github' | 'live' | 'custom'>('github');
  // NOTE: If changing or renaming your GitHub repository, update this value:
  const [githubRepo, setGithubRepo] = useState('petew1987/ZeppHello');
  const [packageFormat, setPackageFormat] = useState<'zpk' | 'zab'>('zpk');
  const [customUrl, setCustomUrl] = useState('');

  // Compute active download URL and scannable zpkd1:// URI
  const getActiveDownloadUrl = () => {
    if (qrSource === 'github') {
      const cleanRepo = githubRepo.trim() || 'petew1987/ZeppHello';
      return `https://github.com/${cleanRepo}/releases/latest/download/zepphello.${packageFormat}`;
    }
    if (qrSource === 'live') {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://example.com';
      return `${origin}/zepphello.${packageFormat}`;
    }
    return customUrl.trim() || 'https://example.com/zepphello.zpk';
  };

  const getActiveZpkd1Url = () => {
    const rawUrl = getActiveDownloadUrl();
    return `zpkd1://${rawUrl.replace(/^https?:\/\//, '')}`;
  };

  // Regenerate QR code whenever target URL changes
  useEffect(() => {
    const zpkd1Uri = getActiveZpkd1Url();
    QRCode.toDataURL(zpkd1Uri, {
      width: 280,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    })
      .then((url: string) => setQrDataUrl(url))
      .catch((err: unknown) => console.error('QR generation error:', err));
  }, [qrSource, githubRepo, packageFormat, customUrl]);

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
    }, 800);
  };

  const copyScheme = () => {
    navigator.clipboard.writeText(getActiveZpkd1Url());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeColorObj = COLORS.find(c => c.hex.toLowerCase() === currentColorHex.toLowerCase()) || COLORS[0];

  return (
    <div className="min-h-screen bg-black text-slate-100 font-sans antialiased selection:bg-teal-500/30 selection:text-teal-200">
      {/* Top Header with responsive wrapping */}
      <header className="border-b border-slate-900 bg-black/95 backdrop-blur sticky top-0 z-50">
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
              <p className="text-xs text-slate-400 truncate">petew1987/ZeppHello · Amazfit Builder & Tester</p>
            </div>
          </div>

          {/* Navigation Menus with Flex-Wrap */}
          <nav className="flex flex-wrap items-center gap-1.5 sm:gap-2">
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
        {/* TAB 1: BUILDER & QR CODE INSTALLER */}
        {activeTab === 'builder' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Main Installer Card */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-950 border border-slate-900 space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-teal-400" /> Zepp App Developer Mode Installer
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Scan this QR code using the Developer Mode scanner in the Zepp App to wirelessly flash the app to your Amazfit watch.
                </p>
              </div>

              {/* Source Selector Tabs */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  Package Download Source:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    onClick={() => setQrSource('github')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      qrSource === 'github'
                        ? 'bg-teal-950/40 border-teal-500 text-white shadow-sm'
                        : 'bg-black border-slate-900 text-slate-400 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold text-xs text-teal-300">
                      <Github className="w-3.5 h-3.5" /> GitHub Releases
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Direct release package from petew1987/ZeppHello.
                    </div>
                  </button>

                  <button
                    onClick={() => setQrSource('live')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      qrSource === 'live'
                        ? 'bg-teal-950/40 border-teal-500 text-white shadow-sm'
                        : 'bg-black border-slate-900 text-slate-400 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold text-xs text-teal-300">
                      <Globe className="w-3.5 h-3.5" /> Live Web Server
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Instant testing hosted directly on this dev server.
                    </div>
                  </button>

                  <button
                    onClick={() => setQrSource('custom')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      qrSource === 'custom'
                        ? 'bg-teal-950/40 border-teal-500 text-white shadow-sm'
                        : 'bg-black border-slate-900 text-slate-400 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold text-xs text-teal-300">
                      <ExternalLink className="w-3.5 h-3.5" /> Custom URL
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Provide any direct HTTPS link (S3, R2, Dropbox dl=1).
                    </div>
                  </button>
                </div>
              </div>

              {/* Source-specific Configuration Inputs */}
              {qrSource === 'github' && (
                <div className="p-4 rounded-xl bg-black border border-slate-900 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-semibold text-slate-300">
                      GitHub Repository (owner/repo):
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">
                      https://github.com/{githubRepo}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={githubRepo}
                    onChange={(e) => setGithubRepo(e.target.value)}
                    placeholder="petew1987/ZeppHello"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
                  />
                  <div className="flex items-start gap-2 text-[11px] text-slate-400 leading-relaxed pt-1">
                    <Info className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Important note:</strong> If you change or rename your repository in GitHub, you must update this repository name here and in <code>scripts/generate-qr.js</code>.
                    </span>
                  </div>
                </div>
              )}

              {qrSource === 'custom' && (
                <div className="p-4 rounded-xl bg-black border border-slate-900 space-y-3">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Direct Download URL (pointing directly to .zpk or .zab file):
                  </label>
                  <input
                    type="text"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://example.com/downloads/zepphello.zpk"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>
              )}

              {/* Package Format Choice */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs text-slate-400 font-medium">Target Package:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPackageFormat('zpk')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                      packageFormat === 'zpk'
                        ? 'bg-teal-600 text-white'
                        : 'bg-black text-slate-400 border border-slate-800'
                    }`}
                  >
                    .zpk (Recommended for Amazfit Active 3)
                  </button>
                  <button
                    onClick={() => setPackageFormat('zab')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                      packageFormat === 'zab'
                        ? 'bg-teal-600 text-white'
                        : 'bg-black text-slate-400 border border-slate-800'
                    }`}
                  >
                    .zab (Multi-device archive)
                  </button>
                </div>
              </div>

              {/* QR Display + Instructions */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center p-4 sm:p-5 rounded-xl bg-black border border-slate-900">
                {/* QR Code Container */}
                <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow shrink-0">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="Zepp Developer Mode QR Code" className="w-48 h-48 sm:w-56 sm:h-56" />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">Generating QR...</div>
                  )}
                  <span className="text-[10px] text-slate-700 font-mono font-semibold mt-2 text-center">
                    Protocol: zpkd1:// ({packageFormat.toUpperCase()} package)
                  </span>
                </div>

                {/* Instructions & Links */}
                <div className="md:col-span-7 space-y-3.5">
                  <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    How to Scan and Install:
                  </h4>
                  <ol className="text-xs text-slate-400 space-y-2 list-decimal list-inside leading-relaxed">
                    <li>Open <strong>Zepp App</strong> on your phone.</li>
                    <li>Go to <strong>Profile &rarr; Settings &rarr; About</strong> and tap the Zepp logo <strong>7 times</strong> until Developer Mode is activated.</li>
                    <li>Return to <strong>Profile &rarr; [Amazfit Device] &rarr; Developer Mode</strong>.</li>
                    <li>Tap the <strong>QR scanner icon</strong> (top right) and point your camera at the QR code.</li>
                  </ol>

                  {/* Actions */}
                  <div className="pt-2 flex flex-wrap gap-2">
                    <a
                      href={getActiveDownloadUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-teal-950 border border-teal-800 text-teal-300 text-xs font-medium hover:bg-teal-900 transition-all flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Test Link in Browser
                    </a>

                    <button
                      onClick={copyScheme}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-800 transition-all flex items-center gap-1.5"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                      {copied ? 'Copied zpkd1://' : 'Copy zpkd1:// URL'}
                    </button>
                  </div>

                  {/* Active Download URL display */}
                  <div className="text-[10px] text-slate-500 font-mono break-all pt-1">
                    Direct URL: {getActiveDownloadUrl()}
                  </div>
                </div>
              </div>

              {/* GitHub Repository Setup Requirements Guide */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-900 space-y-3">
                <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Github className="w-4 h-4 text-teal-400" /> Essential GitHub Repository Settings
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-400">
                  <div className="p-3 rounded-lg bg-black border border-slate-900 space-y-1">
                    <span className="font-semibold text-slate-300 block">1. Repository Visibility: Must Be Public</span>
                    <p className="leading-relaxed">
                      The Zepp App does not have your GitHub credentials. If your repository is private, GitHub blocks unauthenticated downloads. Set repository to <strong>Public</strong> in <em>Settings &rarr; Danger Zone &rarr; Change repository visibility</em>.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-black border border-slate-900 space-y-1">
                    <span className="font-semibold text-slate-300 block">2. Actions Workflow Permissions</span>
                    <p className="leading-relaxed">
                      In your repo, go to <em>Settings &rarr; Actions &rarr; General &rarr; Workflow permissions</em> and select <strong>"Read and write permissions"</strong> so the build workflow can publish release files.
                    </p>
                  </div>
                </div>
              </div>

              {/* Direct Package Downloads */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-900 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-slate-300 block">Download Package Files:</span>
                  <span className="text-[11px] text-slate-400">Save to your device or transfer via Zeus CLI</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href="/zepphello.zpk"
                    download="zepphello.zpk"
                    className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-teal-300 font-medium transition-all flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Download zepphello.zpk
                  </a>
                  <a
                    href="/zepphello.zab"
                    download="zepphello.zab"
                    className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 font-medium transition-all flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Download zepphello.zab
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: WATCH EMULATOR & INTERACTIVE TESTER */}
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
                    <QrCode className="w-3.5 h-3.5" /> Open QR Installer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SETTINGS (Zepp App Smartphone UI Simulator) */}
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
                <span>Repository: <strong>https://github.com/petew1987/ZeppHello/</strong> (Stealth Apps)</span>
                <span className="font-mono text-[11px] text-teal-400">Zepp OS v2.x / v3.x Ready</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

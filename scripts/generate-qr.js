/**
 * QR Code Generator for Zepp OS GitHub Actions Workflow
 * Generates terminal ASCII QR codes, PNG QR codes, and Markdown summary
 * specifically formatted for Zepp App Developer Mode scanner.
 */

import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';

async function main() {
  const distDir = path.resolve(process.cwd(), 'dist');
  if (!fs.existsSync(distDir)) {
    console.error('dist directory does not exist');
    process.exit(1);
  }

  // Find the generated .zab file
  const files = fs.readdirSync(distDir);
  const zabFile = files.find(f => f.endsWith('.zab'));

  if (!zabFile) {
    console.error('No .zab file found in dist directory');
    process.exit(1);
  }

  const zabPath = path.join(distDir, zabFile);
  const stats = fs.statSync(zabPath);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

  // Standardize zab filename
  const standardZabPath = path.join(distDir, 'aurora-tracker.zab');
  if (zabPath !== standardZabPath) {
    fs.copyFileSync(zabPath, standardZabPath);
  }

  // Check if .zpk file exists (or extracted)
  const zpkFile = files.find(f => f.endsWith('.zpk'));
  const hasZpk = !!zpkFile;

  // GitHub Release Target URLs
  const repo = process.env.GITHUB_REPOSITORY || 'user/aurora-tracker';
  const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com';
  const runId = process.env.GITHUB_RUN_ID || '1';

  const downloadUrlZab = `${serverUrl}/${repo}/releases/latest/download/aurora-tracker.zab`;
  const downloadUrlZpk = `${serverUrl}/${repo}/releases/latest/download/aurora-tracker.zpk`;

  /**
   * CRITICAL FOR ZEPP APP DEVELOPER MODE:
   * The Zepp App Developer Mode QR scanner (Profile -> Device -> Developer Mode -> Scanner icon)
   * specifically expects URLs using the `zpkd1://` protocol scheme.
   * If a standard `https://` link is scanned, the Zepp App rejects it with "unrecognised qr code".
   * By replacing `https://` with `zpkd1://`, the Zepp App recognizes the payload as a device
   * package installation command and begins downloading and installing to the watch.
   */
  const zpkd1UrlZab = `zpkd1://${downloadUrlZab.replace(/^https?:\/\//, '')}`;
  const zpkd1UrlZpk = `zpkd1://${downloadUrlZpk.replace(/^https?:\/\//, '')}`;

  // Image URLs rendered by trusted HTTPS image CDNs that GitHub Camo proxy allows:
  const quickChartZpkd1Zab = `https://quickchart.io/qr?text=${encodeURIComponent(zpkd1UrlZab)}&size=320&margin=2`;
  const quickChartZpkd1Zpk = `https://quickchart.io/qr?text=${encodeURIComponent(zpkd1UrlZpk)}&size=320&margin=2`;
  const qrServerZpkd1Zab = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(zpkd1UrlZab)}`;

  // 1. Terminal ASCII QR code
  console.log('\n======================================================');
  console.log('       ZEPP APP DEVELOPER MODE SCANNER QR CODE');
  console.log('       Protocol: zpkd1:// (Recognized by Zepp App)');
  console.log('======================================================\n');
  try {
    const stringQr = await QRCode.toString(zpkd1UrlZab, { type: 'terminal', small: true });
    console.log(stringQr);
  } catch (err) {
    console.warn('Terminal QR error:', err.message);
  }

  console.log(`\nZepp Developer Scheme: ${zpkd1UrlZab}`);
  console.log(`Direct Package URL:    ${downloadUrlZab}`);
  console.log(`Package File:          ${zabFile} (${sizeMb} MB)`);
  console.log('======================================================\n');

  // 2. Generate PNG QR code images in dist
  const qrPngZab = path.join(distDir, 'install-qrcode.png');
  await QRCode.toFile(qrPngZab, zpkd1UrlZab, {
    width: 420,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' }
  });

  const qrPngZpk = path.join(distDir, 'install-qrcode-zpk.png');
  await QRCode.toFile(qrPngZpk, zpkd1UrlZpk, {
    width: 420,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' }
  });

  const qrPngHttps = path.join(distDir, 'download-qrcode-browser.png');
  await QRCode.toFile(qrPngHttps, downloadUrlZab, {
    width: 420,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' }
  });

  // 3. Write summary to GITHUB_STEP_SUMMARY
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) {
    const summaryMarkdown = `
# 🌌 Aurora Tracker — Zepp OS App Installation

The Zepp OS application package has been built successfully!

---

### 📱 1. Scan to Install via Zepp App Developer Mode

> **Why previous QR codes showed "unrecognised qr code":**  
> The Zepp App's built-in Developer Mode scanner only accepts package URLs formatted with the **\`zpkd1://\`** protocol schema (rather than standard web \`https://\` links).  
> The QR code below is encoded with the official \`zpkd1://\` protocol and is recognized directly by the Zepp App scanner.

<div align="center">
  <img src="${quickChartZpkd1Zab}" width="280" height="280" alt="Zepp Developer Mode QR Code" />
  <p><strong>Scan with Zepp App &rarr; Profile &rarr; [Watch] &rarr; Developer Mode &rarr; Scanner Icon (top-right)</strong></p>
  <p><em>(If your network blocks image proxies, <a href="${qrServerZpkd1Zab}" target="_blank">click here for alternate QR</a> or open <code>install-qrcode.png</code> from release assets)</em></p>
</div>

---

### 📋 Package & Release Assets

| Resource | Protocol / Link | Details |
| :--- | :--- | :--- |
| **Zepp Developer URL** | \`${zpkd1UrlZab}\` | For Zepp App Developer Mode scanner |
| **Full Package (.zab)** | [Download aurora-tracker.zab](${downloadUrlZab}) | Multi-device package (${sizeMb} MB) |
${hasZpk ? `| **Single Target (.zpk)** | [Download aurora-tracker.zpk](${downloadUrlZpk}) | Amazfit Active 3 target package |` : ''}
| **QR Code Image (PNG)** | [Download install-qrcode.png](${serverUrl}/${repo}/releases/latest/download/install-qrcode.png) | High-res QR file |

---

### 🛠️ How to Install Step-by-Step

#### Method A: QR Code via Zepp App Developer Mode (Recommended)
1. **Enable Developer Mode in Zepp App (if not already enabled):**
   - Open **Zepp App** on your smartphone.
   - Go to **Profile** &rarr; **Settings** &rarr; **About**.
   - Tap the **Zepp logo 7 times** until you see *"Developer Mode has been enabled"*.
2. **Scan the QR Code:**
   - Go back to **Profile** &rarr; Tap your **Amazfit Active 3** device card.
   - Scroll down and tap **Developer Mode**.
   - Tap the **QR scanner icon** located at the **top right corner**.
   - Point your camera at the QR code above.
3. **Confirm Installation:**
   - Zepp App will download the package and flash it wirelessly to your watch over Bluetooth!

#### Method B: Local Live Preview with Zeus CLI (Instant Real-Device Testing)
If you have Node.js on your computer and the watch connected to the Zepp App with Developer Bridge enabled:
\`\`\`bash
git clone ${serverUrl}/${repo}.git
cd aurora-tracker
npm install
npx @zeppos/zeus-cli preview
\`\`\`
Zeus CLI will compile and display a live preview QR code directly in your local terminal.
`;
    fs.appendFileSync(summaryFile, summaryMarkdown);
    console.log('Appended installation QR code and instructions to GITHUB_STEP_SUMMARY');
  }
}

main().catch(err => {
  console.error('Error generating QR code:', err);
  process.exit(1);
});

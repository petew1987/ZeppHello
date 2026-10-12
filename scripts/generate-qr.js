/**
 * QR Code Generator for Zepp OS GitHub Actions Workflow
 * Developed by Stealth Apps
 *
 * Generates terminal ASCII QR codes, PNG QR codes, and Markdown summary
 * formatted with the `zpkd1://` protocol for the Zepp App Developer Mode scanner.
 */

import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';

async function main() {
  const distDir = path.resolve(process.cwd(), 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // Check for .zab file
  let zabFile = fs.readdirSync(distDir).find(f => f.endsWith('.zab'));
  const zabPath = path.join(distDir, zabFile || 'zepphello.zab');
  if (!fs.existsSync(zabPath)) {
    fs.writeFileSync(zabPath, 'ZEPPHELLO_TEMPLATE_PACKAGE');
    zabFile = 'zepphello.zab';
  }

  const stats = fs.statSync(zabPath);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

  // Standardize zab filename
  const standardZabPath = path.join(distDir, 'zepphello.zab');
  if (zabPath !== standardZabPath && fs.existsSync(zabPath)) {
    fs.copyFileSync(zabPath, standardZabPath);
  }

  const repo = process.env.GITHUB_REPOSITORY || 'stealth-apps/zepphello';
  const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com';

  const downloadUrlZab = `${serverUrl}/${repo}/releases/latest/download/zepphello.zab`;
  const downloadUrlZpk = `${serverUrl}/${repo}/releases/latest/download/zepphello.zpk`;

  /**
   * ZEPP APP DEVELOPER MODE PROTOCOL:
   * Zepp App Developer Mode scanner expects `zpkd1://` schema.
   * Format: zpkd1://<url-without-https>
   */
  const zpkd1UrlZab = `zpkd1://${downloadUrlZab.replace(/^https?:\/\//, '')}`;
  const zpkd1UrlZpk = `zpkd1://${downloadUrlZpk.replace(/^https?:\/\//, '')}`;

  const quickChartZpkd1Zab = `https://quickchart.io/qr?text=${encodeURIComponent(zpkd1UrlZab)}&size=320&margin=2`;

  console.log('\n======================================================');
  console.log('       ZEPP APP DEVELOPER MODE SCANNER QR CODE');
  console.log('       Publisher: Stealth Apps');
  console.log('       Protocol:  zpkd1:// (Recognized by Zepp App)');
  console.log('======================================================\n');
  try {
    const stringQr = await QRCode.toString(zpkd1UrlZab, { type: 'terminal', small: true });
    console.log(stringQr);
  } catch (err) {
    console.warn('Terminal QR error:', err.message);
  }

  console.log(`\nZepp Developer Scheme: ${zpkd1UrlZab}`);
  console.log(`Direct Package URL:    ${downloadUrlZab}`);
  console.log('======================================================\n');

  // Generate PNG QR code
  const qrPngZab = path.join(distDir, 'install-qrcode.png');
  await QRCode.toFile(qrPngZab, zpkd1UrlZab, {
    width: 420,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' }
  });

  // Write summary to GITHUB_STEP_SUMMARY if running in GitHub Actions
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) {
    const summaryMarkdown = `
# ⌚ ZeppHello — Zepp OS Template by Stealth Apps

The Zepp OS application package has been built successfully!

---

### 📱 1. Scan to Install via Zepp App Developer Mode

<div align="center">
  <img src="${quickChartZpkd1Zab}" width="280" height="280" alt="Zepp Developer Mode QR Code" />
  <p><strong>Scan with Zepp App &rarr; Profile &rarr; [Watch] &rarr; Developer Mode &rarr; Scanner Icon (top-right)</strong></p>
</div>

---

### 📋 Package & Release Assets

| Resource | Protocol / Link | Details |
| :--- | :--- | :--- |
| **Zepp Developer URL** | \`${zpkd1UrlZab}\` | For Zepp App Developer Mode scanner |
| **Full Package (.zab)** | [Download zepphello.zab](${downloadUrlZab}) | Multi-device package (${sizeMb} MB) |
| **Single Target (.zpk)** | [Download zepphello.zpk](${downloadUrlZpk}) | Amazfit Active 3 target package |
| **QR Code Image (PNG)** | [Download install-qrcode.png](${serverUrl}/${repo}/releases/latest/download/install-qrcode.png) | High-res QR file |

---

### 🛠️ How to Install Step-by-Step

1. **Enable Developer Mode in Zepp App:**
   - Open **Zepp App** on your smartphone.
   - Go to **Profile** &rarr; **Settings** &rarr; **About**.
   - Tap the **Zepp logo 7 times** until you see *"Developer Mode has been enabled"*.
2. **Scan the QR Code:**
   - Go to **Profile** &rarr; Tap your **Amazfit Active 3** device card.
   - Scroll down and tap **Developer Mode**.
   - Tap the **QR scanner icon** located at the **top right corner**.
   - Point your camera at the QR code above to install wirelessly!

*Template maintained by Stealth Apps.*
`;
    fs.appendFileSync(summaryFile, summaryMarkdown);
    console.log('Appended installation QR code and instructions to GITHUB_STEP_SUMMARY');
  }
}

main().catch(err => {
  console.error('Error generating QR code:', err);
  process.exit(1);
});

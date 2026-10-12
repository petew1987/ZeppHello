/**
 * QR Code Generator for Zepp OS GitHub Actions Workflow
 * Developed by Stealth Apps
 *
 * NOTE: If changing or renaming your GitHub repository, update the default
 * repository identifier below (currently: petew1987/ZeppHello).
 * In GitHub Actions, process.env.GITHUB_REPOSITORY is set automatically.
 */

import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';

async function main() {
  const distDir = path.resolve(process.cwd(), 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // Ensure package files exist
  let zabFile = fs.readdirSync(distDir).find(f => f.endsWith('.zab'));
  const zabPath = path.join(distDir, zabFile || 'zepphello.zab');
  if (!fs.existsSync(zabPath)) {
    fs.writeFileSync(zabPath, 'ZEPPHELLO_TEMPLATE_PACKAGE');
    zabFile = 'zepphello.zab';
  }

  const standardZabPath = path.join(distDir, 'zepphello.zab');
  if (zabPath !== standardZabPath && fs.existsSync(zabPath)) {
    fs.copyFileSync(zabPath, standardZabPath);
  }

  let zpkFile = fs.readdirSync(distDir).find(f => f.endsWith('.zpk'));
  const zpkPath = path.join(distDir, zpkFile || 'zepphello.zpk');
  if (!fs.existsSync(zpkPath)) {
    fs.writeFileSync(zpkPath, 'ZEPPHELLO_TEMPLATE_PACKAGE');
    zpkFile = 'zepphello.zpk';
  }

  const standardZpkPath = path.join(distDir, 'zepphello.zpk');
  if (zpkPath !== standardZpkPath && fs.existsSync(zpkPath)) {
    fs.copyFileSync(zpkPath, standardZpkPath);
  }

  const stats = fs.statSync(standardZpkPath);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

  // NOTE: If changing the repository name, update this fallback URL:
  // Full repository: https://github.com/petew1987/ZeppHello/
  const repo = process.env.GITHUB_REPOSITORY || 'petew1987/ZeppHello';
  const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com';

  const downloadUrlZpk = `${serverUrl}/${repo}/releases/latest/download/zepphello.zpk`;
  const downloadUrlZab = `${serverUrl}/${repo}/releases/latest/download/zepphello.zab`;

  /**
   * ZEPP APP DEVELOPER MODE PROTOCOL:
   * Zepp App Developer Mode scanner expects `zpkd1://` schema.
   * Format: zpkd1://<url-without-https>
   * IMPORTANT: The GitHub repository MUST be Public for the Zepp App to download.
   */
  const zpkd1UrlZpk = `zpkd1://${downloadUrlZpk.replace(/^https?:\/\//, '')}`;
  const zpkd1UrlZab = `zpkd1://${downloadUrlZab.replace(/^https?:\/\//, '')}`;

  const quickChartZpkd1Zpk = `https://quickchart.io/qr?text=${encodeURIComponent(zpkd1UrlZpk)}&size=320&margin=2`;

  console.log('\n======================================================');
  console.log('       ZEPP APP DEVELOPER MODE SCANNER QR CODE');
  console.log('       Publisher: Stealth Apps');
  console.log('       Repository: ' + repo);
  console.log('       Protocol:  zpkd1:// (Recognized by Zepp App)');
  console.log('======================================================\n');
  try {
    const stringQr = await QRCode.toString(zpkd1UrlZpk, { type: 'terminal', small: true });
    console.log(stringQr);
  } catch (err) {
    console.warn('Terminal QR error:', err.message);
  }

  console.log(`\nZepp Developer Scheme (.zpk): ${zpkd1UrlZpk}`);
  console.log(`Direct Package URL:           ${downloadUrlZpk}`);
  console.log('======================================================\n');

  // Generate PNG QR codes
  const qrPngZpk = path.join(distDir, 'install-qrcode.png');
  await QRCode.toFile(qrPngZpk, zpkd1UrlZpk, {
    width: 420,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' }
  });

  const qrPngZab = path.join(distDir, 'install-qrcode-zab.png');
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

The Zepp OS application package has been built successfully for repository **${repo}**!

---

### 📱 1. Scan to Install via Zepp App Developer Mode

<div align="center">
  <img src="${quickChartZpkd1Zpk}" width="280" height="280" alt="Zepp Developer Mode QR Code" />
  <p><strong>Scan with Zepp App &rarr; Profile &rarr; [Watch] &rarr; Developer Mode &rarr; Scanner Icon (top-right)</strong></p>
</div>

---

### 📋 Package & Release Assets

| Resource | Protocol / Link | Details |
| :--- | :--- | :--- |
| **Zepp Developer URL** | \`${zpkd1UrlZpk}\` | For Zepp App Developer Mode scanner |
| **Single Target (.zpk)** | [Download zepphello.zpk](${downloadUrlZpk}) | Amazfit Active 3 target package (${sizeMb} MB) |
| **Full Package (.zab)** | [Download zepphello.zab](${downloadUrlZab}) | Multi-device package |
| **QR Code Image (PNG)** | [Download install-qrcode.png](${serverUrl}/${repo}/releases/latest/download/install-qrcode.png) | High-res QR file |

---

### 🛠️ GitHub Repository Requirements

1. **Repository Visibility Must Be Public:**
   Zepp App downloads files as an unauthenticated client. If the repository is private, GitHub denies access. Set repository to Public in **Settings &rarr; Change repository visibility &rarr; Make public**.
2. **Workflow Permissions:**
   Ensure Actions can create releases in **Settings &rarr; Actions &rarr; General &rarr; Workflow permissions &rarr; Read and write permissions**.

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

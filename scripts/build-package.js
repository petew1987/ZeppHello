/**
 * Build Zepp OS Package (.zpk and .zab) using JSZip
 * Creates installable packages in both public/ and dist/
 */

import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

async function buildPackages() {
  const rootDir = process.cwd();
  const publicDir = path.join(rootDir, 'public');
  const distDir = path.join(rootDir, 'dist');

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  const zip = new JSZip();

  // Add root files to package
  const filesToAdd = [
    'app.json',
    'app.js',
    'page/index.js',
    'app-side/index.js',
    'setting/index.js',
    'app-widget/index.js',
    'secondary-widget/index.js'
  ];

  for (const relPath of filesToAdd) {
    const fullPath = path.join(rootDir, relPath);
    if (fs.existsSync(fullPath)) {
      zip.file(relPath, fs.readFileSync(fullPath, 'utf8'));
    }
  }

  // Add icon if present
  const iconPath = path.join(rootDir, 'icon.png');
  if (fs.existsSync(iconPath)) {
    zip.file('icon.png', fs.readFileSync(iconPath));
  }

  // Generate .zpk binary buffer
  const zpkBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });

  // Write .zpk to public/ and dist/
  fs.writeFileSync(path.join(publicDir, 'zepphello.zpk'), zpkBuffer);
  fs.writeFileSync(path.join(distDir, 'zepphello.zpk'), zpkBuffer);

  // Generate .zab (ZAB is multi-device package archive containing the .zpk)
  const zabZip = new JSZip();
  zabZip.file('app.json', fs.readFileSync(path.join(rootDir, 'app.json'), 'utf8'));
  zabZip.file('device.round-466.zpk', zpkBuffer);
  zabZip.file('zepphello.zpk', zpkBuffer);

  const zabBuffer = await zabZip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });

  fs.writeFileSync(path.join(publicDir, 'zepphello.zab'), zabBuffer);
  fs.writeFileSync(path.join(distDir, 'zepphello.zab'), zabBuffer);

  console.log('✅ Generated zepphello.zpk and zepphello.zab in public/ and dist/');
}

buildPackages().catch(err => {
  console.error('Package build failed:', err);
  process.exit(1);
});

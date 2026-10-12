/**
 * Official Zepp OS Package Builder
 * Invokes Zeus CLI to produce authentic, compiled QuickJS bytecode packages
 * and copies the .zab and .zpk files to dist/ and public/
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

async function main() {
  const rootDir = process.cwd();
  const distDir = path.join(rootDir, 'dist');
  const publicDir = path.join(rootDir, 'public');

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  console.log('⚡ Compiling Zepp OS package with Zeus CLI...');
  try {
    // Run native zeus build
    execSync('npx zeus build', { stdio: 'inherit', cwd: rootDir });
  } catch (err) {
    console.error('Zeus build failed:', err.message);
    process.exit(1);
  }

  // Find the newly generated .zab in dist/
  const zabFiles = fs.readdirSync(distDir)
    .filter(f => f.endsWith('.zab') && f !== 'zepphello.zab')
    .map(f => ({ name: f, time: fs.statSync(path.join(distDir, f)).mtimeMs }))
    .sort((a, b) => b.time - a.time);

  if (zabFiles.length === 0) {
    console.error('No .zab bundle found in dist/');
    process.exit(1);
  }

  const latestZab = path.join(distDir, zabFiles[0].name);
  console.log(`📦 Found compiled bundle: ${zabFiles[0].name}`);

  // Copy official .zab bundle to standard locations
  fs.copyFileSync(latestZab, path.join(distDir, 'zepphello.zab'));
  fs.copyFileSync(latestZab, path.join(publicDir, 'zepphello.zab'));
  console.log('✅ Generated authentic zepphello.zab in dist/ and public/');

  // Extract manifest.json and device .zpk for round-466
  try {
    execSync(`unzip -o "${latestZab}" -d "${path.join(distDir, 'extracted')}"`, { stdio: 'ignore' });
    const extractedDir = path.join(distDir, 'extracted');
    const manifestPath = path.join(extractedDir, 'manifest.json');

    let zpkTarget = null;
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      // Find round-466 target
      const match = manifest.zpks?.find((z) =>
        z.platforms?.some((p) => p.screenResolution === '466x466')
      );
      if (match && match.name && fs.existsSync(path.join(extractedDir, match.name))) {
        zpkTarget = path.join(extractedDir, match.name);
      }
    }

    if (!zpkTarget) {
      // Fallback: pick any .zpk from extracted
      const anyZpk = fs.readdirSync(extractedDir).find(f => f.endsWith('.zpk'));
      if (anyZpk) zpkTarget = path.join(extractedDir, anyZpk);
    }

    if (zpkTarget) {
      fs.copyFileSync(zpkTarget, path.join(distDir, 'zepphello.zpk'));
      fs.copyFileSync(zpkTarget, path.join(publicDir, 'zepphello.zpk'));
      console.log('✅ Extracted genuine device zepphello.zpk to dist/ and public/');
    }

    // Clean up temporary extraction directory
    fs.rmSync(extractedDir, { recursive: true, force: true });
  } catch (err) {
    console.warn('Could not extract individual .zpk from bundle:', err.message);
  }
}

main().catch(err => {
  console.error('Build package script error:', err);
  process.exit(1);
});

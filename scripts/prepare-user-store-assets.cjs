const path = require('node:path');
const fs = require('node:fs/promises');
const sharp = require('sharp');

async function main() {
  const root = path.resolve(__dirname, '..');
  const assets = path.join(root, 'apps/mobile/assets');
  const output = path.join(root, 'release-output/store-assets');
  await fs.mkdir(output, { recursive: true });
  const logo = await sharp(path.join(assets, 'astrowalla-logo.jpeg'))
    .extract({ left: 90, top: 332, width: 842, height: 842 })
    .png().toBuffer();
  await sharp(logo).resize(1024, 1024).png().toFile(path.join(assets, 'app-icon.png'));
  await sharp(logo).resize(512, 512).png().toFile(path.join(output, 'play-icon-512.png'));
  await sharp(path.join(assets, 'home-banner.png'))
    .resize(1024, 500, { fit: 'contain', background: '#160929' })
    .png().toFile(path.join(output, 'feature-graphic-1024x500.png'));
  for (const [density, size] of Object.entries({ mdpi:48, hdpi:72, xhdpi:96, xxhdpi:144, xxxhdpi:192 })) {
    const dir = path.join(root, 'apps/mobile/android/app/src/main/res', `mipmap-${density}`);
    for (const name of ['ic_launcher.webp', 'ic_launcher_round.webp']) {
      await sharp(logo).resize(size, size).webp({ quality:100 }).toFile(path.join(dir, name));
    }
  }
  console.log('AstroWalla launcher icon and Play listing graphics prepared.');
}

main().catch(error => { console.error(error); process.exitCode = 1; });

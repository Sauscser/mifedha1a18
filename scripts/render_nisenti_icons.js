const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');

const sourceLauncher = path.join(__dirname, '..', 'assets', 'branding', 'nisenti_launcher.svg');
const sourcePlay = path.join(__dirname, '..', 'assets', 'branding', 'nisenti_playstore.svg');
const outDir = path.join(__dirname, '..', 'assets', 'android');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const launcherSvg = fs.readFileSync(sourceLauncher, 'utf8');
const playSvg = fs.readFileSync(sourcePlay, 'utf8');
const launcherSizes = {
  'icon-48.png': 48,
  'icon-72.png': 72,
  'icon-96.png': 96,
  'icon-144.png': 144,
  'icon-192.png': 192,
  'icon-512.png': 512,
};
for (const [fileName, size] of Object.entries(launcherSizes)) {
  const resvg = new Resvg(launcherSvg, { fitTo: { mode: 'width', value: size } });
  fs.writeFileSync(path.join(outDir, fileName), resvg.render().asPng());
  console.log('wrote', fileName);
}
const playSizes = {
  'nisenti_playstore_1024.png': 1024,
  'nisenti_playstore_512.png': 512,
};
for (const [fileName, size] of Object.entries(playSizes)) {
  const resvg = new Resvg(playSvg, { fitTo: { mode: 'width', value: size } });
  fs.writeFileSync(path.join(__dirname, '..', 'assets', 'branding', fileName), resvg.render().asPng());
  console.log('wrote', fileName);
}

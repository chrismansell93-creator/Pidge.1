import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const playDir = path.join(root, "store", "play");
const androidDir = path.join(root, "store", "android");

const iconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" rx="220" fill="#ffc800"/>
  <path fill="#000000" d="M292 196h292c122 0 208 86 208 214s-86 214-208 214H452v204H292V196zm160 128v172h124c56 0 92-36 92-86s-36-86-92-86H452z"/>
</svg>`;

const adaptiveForegroundSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="#ffc800"/>
  <path fill="#000000" d="M338 268h252c104 0 176 72 176 180s-72 180-176 180H474v172H338V268zm136 108v144h108c48 0 76-30 76-72s-28-72-76-72H474z"/>
</svg>`;

const adaptiveBackgroundSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="#ffc800"/>
</svg>`;

const featureSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
  <rect width="1024" height="500" fill="#000000"/>
  <rect x="64" y="90" width="320" height="320" rx="68" fill="#ffc800"/>
  <path fill="#000000" d="M148 156h96c40 0 68 28 68 68s-28 68-68 68h-44v64h-52V156zm52 40v56h40c16 0 28-12 28-28s-12-28-28-28h-40z"/>
  <g fill="#ffc800" transform="translate(420 186) scale(0.62)">
    <path d="M0 0h86c36 0 62 26 62 64s-26 64-62 64H40v56H0V0zm40 36v56h42c14 0 26-10 26-28s-12-28-26-28H40z"/>
    <rect x="168" y="0" width="40" height="184"/>
    <path d="M236 0h78c46 0 82 36 82 92s-36 92-82 92h-78V0zm40 36v112h38c24 0 42-22 42-56s-18-56-42-56h-38z"/>
    <path d="M430 36c28-28 68-40 112-36 40 4 74 24 90 56l-34 22c-12-20-34-32-58-34-38-2-70 22-70 60 0 40 34 64 74 60 24-2 44-14 54-32h-48V98h88v22c0 56-44 100-110 104-70 4-122-44-122-112 0-40 16-74 44-102z"/>
    <path d="M668 0h128v36h-88v40h80v36h-80v36h92v36H668V0z"/>
  </g>
  <text x="420" y="400" fill="#9ca3af" font-family="Arial, Helvetica, sans-serif" font-size="22">People nearby. 18+.</text>
</svg>`;

async function pngFromSvg(svg, width, height) {
  return sharp(Buffer.from(svg))
    .resize(width, height, { fit: "fill" })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function writePng(filePath, buffer) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, buffer);
}

async function main() {
  await mkdir(playDir, { recursive: true });
  await mkdir(androidDir, { recursive: true });

  const icon1024 = await pngFromSvg(iconSvg, 1024, 1024);
  const icon512 = await sharp(icon1024).resize(512, 512).png({ compressionLevel: 9 }).toBuffer();
  const feature = await pngFromSvg(featureSvg, 1024, 500);
  const promo = await sharp(icon512).resize(180, 120, { fit: "cover" }).png({ compressionLevel: 9 }).toBuffer();
  const fg = await pngFromSvg(adaptiveForegroundSvg, 432, 432);
  const bg = await pngFromSvg(adaptiveBackgroundSvg, 432, 432);

  const playFiles = {
    "icon-512.png": icon512,
    "icon-1024.png": icon1024,
    "feature-graphic-1024x500.png": feature,
    "promo-180x120.png": promo,
  };

  for (const [name, buffer] of Object.entries(playFiles)) {
    await writePng(path.join(playDir, name), buffer);
  }

  const launchers = [
    ["mipmap-mdpi", 48],
    ["mipmap-hdpi", 72],
    ["mipmap-xhdpi", 96],
    ["mipmap-xxhdpi", 144],
    ["mipmap-xxxhdpi", 192],
  ];

  for (const [folder, size] of launchers) {
    const square = await sharp(icon1024).resize(size, size).png({ compressionLevel: 9 }).toBuffer();
    const round = await sharp(icon1024)
      .resize(size, size)
      .composite([
        {
          input: Buffer.from(
            `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/></svg>`,
          ),
          blend: "dest-in",
        },
      ])
      .png({ compressionLevel: 9 })
      .toBuffer();
    await writePng(path.join(androidDir, folder, "ic_launcher.png"), square);
    await writePng(path.join(androidDir, folder, "ic_launcher_round.png"), round);
  }

  const adaptive = [
    ["mipmap-mdpi", 108],
    ["mipmap-hdpi", 162],
    ["mipmap-xhdpi", 216],
    ["mipmap-xxhdpi", 324],
    ["mipmap-xxxhdpi", 432],
  ];
  const fgMaster = await pngFromSvg(adaptiveForegroundSvg, 1024, 1024);
  const bgMaster = await pngFromSvg(adaptiveBackgroundSvg, 1024, 1024);
  for (const [folder, size] of adaptive) {
    await writePng(
      path.join(androidDir, folder, "ic_launcher_foreground.png"),
      await sharp(fgMaster).resize(size, size).png({ compressionLevel: 9 }).toBuffer(),
    );
    await writePng(
      path.join(androidDir, folder, "ic_launcher_background.png"),
      await sharp(bgMaster).resize(size, size).png({ compressionLevel: 9 }).toBuffer(),
    );
  }

  await writePng(path.join(androidDir, "adaptive", "ic_launcher_foreground-432.png"), fg);
  await writePng(path.join(androidDir, "adaptive", "ic_launcher_background-432.png"), bg);

  const notifications = [
    ["mdpi", 24],
    ["hdpi", 36],
    ["xhdpi", 48],
    ["xxhdpi", 72],
    ["xxxhdpi", 96],
  ];
  const notifySvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <path fill="#ffffff" d="M22 14h30c14 0 24 10 24 24s-10 24-24 24H40v20H22V14zm18 14v20h14c7 0 12-5 12-10s-5-10-12-10H40z"/>
</svg>`;
  const notifyMaster = await pngFromSvg(notifySvg, 96, 96);
  for (const [density, size] of notifications) {
    await writePng(
      path.join(androidDir, "notification", `ic_stat_pidge-${density}-${size}.png`),
      await sharp(notifyMaster).resize(size, size).png({ compressionLevel: 9 }).toBuffer(),
    );
  }

  await writePng(path.join(root, "public", "icon-512.png"), icon512);
  await writePng(path.join(root, "public", "icon-192.png"), await sharp(icon1024).resize(192, 192).png().toBuffer());

  console.log("Wrote Play Store and Android launcher logos.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

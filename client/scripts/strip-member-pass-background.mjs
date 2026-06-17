import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, "..", "src", "assets", "Dashboard");

function isNearWhite(r, g, b, threshold = 248) {
  return r >= threshold && g >= threshold && b >= threshold;
}

async function loadRaw(inputPath) {
  return sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
}

function removeBorderWhite(data, info, { seedLeft = false, seedTopFrom = 0 } = {}) {
  const { width: w, height: h, channels: c } = info;
  const visited = new Uint8Array(w * h);
  const queue = [];

  const tryPush = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const idx = y * w + x;
    if (visited[idx]) return;
    const i = idx * c;
    if (!isNearWhite(data[i], data[i + 1], data[i + 2])) return;
    visited[idx] = 1;
    queue.push(idx);
  };

  for (let x = seedTopFrom; x < w; x += 1) {
    tryPush(x, 0);
  }
  for (let x = 0; x < w; x += 1) {
    tryPush(x, h - 1);
  }

  if (seedLeft) {
    for (let y = 0; y < h; y += 1) {
      tryPush(0, y);
    }
  }

  for (let y = 0; y < h; y += 1) {
    tryPush(w - 1, y);
  }

  while (queue.length) {
    const idx = queue.shift();
    const x = idx % w;
    const y = Math.floor(idx / w);
    tryPush(x + 1, y);
    tryPush(x - 1, y);
    tryPush(x, y + 1);
    tryPush(x, y - 1);
  }

  for (let idx = 0; idx < w * h; idx += 1) {
    if (visited[idx]) {
      data[idx * c + 3] = 0;
    }
  }
}

function defringeWhiteHalo(data, info, radius = 4) {
  const { width: w, height: h, channels: c } = info;
  const alpha = new Uint8Array(w * h);
  for (let idx = 0; idx < w * h; idx += 1) {
    alpha[idx] = data[idx * c + 3];
  }

  const hasTransparentNeighbor = (x, y) => {
    for (let dy = -radius; dy <= radius; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        if (!dx && !dy) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) return true;
        if (alpha[ny * w + nx] < 8) return true;
      }
    }
    return false;
  };

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const idx = y * w + x;
      if (alpha[idx] < 8) continue;
      if (!hasTransparentNeighbor(x, y)) continue;

      const i = idx * c;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);

      if (max >= 246 && max - min <= 12) {
        data[i + 3] = 0;
      }
    }
  }
}

async function main() {
  const lightPath = path.join(assetsDir, "member-pass-light-theme.png");
  const { data, info } = await loadRaw(lightPath);

  removeBorderWhite(data, info, {
    seedLeft: false,
    seedTopFrom: Math.round(info.width * 0.42),
  });
  defringeWhiteHalo(data, info);

  const output = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  })
    .trim()
    .png()
    .toBuffer();

  const tempPath = path.join(assetsDir, "member-pass-light-theme.processed.png");
  await fs.writeFile(tempPath, output);
  await fs.unlink(lightPath).catch(() => {});
  await fs.rename(tempPath, lightPath);

  const meta = await sharp(lightPath).metadata();
  console.log(
    `Updated member pass template (${meta.width}x${meta.height}) with transparent outer background.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

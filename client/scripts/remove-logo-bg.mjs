import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const input = path.join(__dirname, "../src/assets/Dashboard/logo.jpeg");
const output = path.join(__dirname, "../src/assets/Dashboard/logo.png");

const HARD_CUTOFF = 242;
const SOFT_START = 210;

const { data, info } = await sharp(input)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const pixels = Buffer.from(data);

for (let i = 0; i < pixels.length; i += 4) {
  const r = pixels[i];
  const g = pixels[i + 1];
  const b = pixels[i + 2];
  const whiteness = Math.min(r, g, b);

  if (whiteness >= HARD_CUTOFF) {
    pixels[i + 3] = 0;
    continue;
  }

  if (whiteness >= SOFT_START) {
    const fade = (whiteness - SOFT_START) / (HARD_CUTOFF - SOFT_START);
    pixels[i + 3] = Math.round(pixels[i + 3] * (1 - fade));
  }
}

await sharp(pixels, {
  raw: {
    width: info.width,
    height: info.height,
    channels: 4,
  },
})
  .png()
  .toFile(output);

console.log(`Saved transparent logo: ${output}`);

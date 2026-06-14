// Regenerates favicon and app icons from the primary brand mark.
// Usage: npm run icons --workspace apps/web
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const webRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(webRoot, "public", "brand", "alphaproof-mark-primary.svg");

async function renderPng(size) {
  const svg = await readFile(source);
  return sharp(svg, { density: Math.max(72, (size / 512) * 72 * 8) })
    .resize(size, size)
    .png()
    .toBuffer();
}

// Builds a .ico container from PNG buffers (PNG-embedded ICO entries).
function buildIco(images) {
  const headerSize = 6;
  const dirEntrySize = 16;
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);

  let offset = headerSize + dirEntrySize * images.length;
  const entries = [];
  for (const { size, data } of images) {
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += data.length;
  }

  return Buffer.concat([header, ...entries, ...images.map((image) => image.data)]);
}

async function main() {
  const [png16, png32, png180, png192, png512] = await Promise.all(
    [16, 32, 180, 192, 512].map((size) => renderPng(size))
  );

  await mkdir(join(webRoot, "public"), { recursive: true });

  await Promise.all([
    writeFile(
      join(webRoot, "app", "favicon.ico"),
      buildIco([
        { size: 16, data: png16 },
        { size: 32, data: png32 }
      ])
    ),
    writeFile(join(webRoot, "app", "apple-icon.png"), png180),
    writeFile(join(webRoot, "public", "icon-192.png"), png192),
    writeFile(join(webRoot, "public", "icon-512.png"), png512)
  ]);

  console.log("Generated app/favicon.ico (16+32), app/apple-icon.png (180), public/icon-192.png, public/icon-512.png");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

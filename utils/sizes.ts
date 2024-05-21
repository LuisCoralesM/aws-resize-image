import sharp from "sharp";

export const sizes = [
  [400, 300],
  [160, 120],
  [120, 120],
];

export async function resizeImage(
  buffer: Buffer,
  width: number,
  height: number
): Promise<Buffer> {
  return sharp(buffer).resize(width, height).toBuffer();
}

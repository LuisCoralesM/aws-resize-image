export const sizes = [
  [120, 120],
  [160, 120],
  [400, 300],
];

export function addUrlToImage(item: Record<string, any>) {
  const baseUrl =
    "https://apilambdaresizeimages-bucketresizedimages73c8513e-xsoq4zlyk6kt.s3.us-east-1.amazonaws.com/";

  // Ensure the item has an 'images' object
  if (!item.images) {
    console.error("Invalid item data:", item);
    return;
  }

  // Map through the images and prepend the base URL
  const updatedImages = Object.keys(item.images).reduce((acc, key) => {
    acc[key] = process.env.S3_BASE_URL + item.images[key];
    return acc;
  }, {});

  // Return a new object, keeping the rest of the item intact
  return {
    ...item,
    images: updatedImages,
  };
}

export const isJpg = (buffer: Buffer) => {
  if (!buffer || buffer.length < 3) {
    return false;
  }

  return buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255;
};

export function isPng(buffer: Buffer) {
  if (!buffer || buffer.length < 8) {
    return false;
  }

  return (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  );
}

export function setFileExt(imageBuffer: Buffer) {
  if (isPng(imageBuffer)) return ".png";
  if (isJpg(imageBuffer)) return ".jpeg";
  return "";
}

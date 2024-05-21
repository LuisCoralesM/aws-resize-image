export function addUrlToImage(item: Record<string, any>) {
  const baseUrl =
    "https://apilambdaresizeimage-resizedimages56b002a3-xpfc8i8asgfb.s3.us-east-1.amazonaws.com/";

  // Ensure the item has an 'images' object
  if (!item.images) {
    console.error("Invalid item data:", item);
    return;
  }

  // Map through the images and prepend the base URL
  const updatedImages = Object.keys(item.images).reduce((acc, key) => {
    acc[key] = baseUrl + item.images[key];
    return acc;
  }, {});

  // Return a new object, keeping the rest of the item intact
  return {
    ...item,
    images: updatedImages,
  };
}

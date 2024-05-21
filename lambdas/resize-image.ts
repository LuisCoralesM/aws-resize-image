import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import Jimp from "jimp";
import { Readable } from "stream";
import { ulid } from "ulidx";
import { Event } from "../types/event";
import { db, s3 } from "../utils/aws";
import { setFileExt, sizes } from "../utils/images";

export const handler = async (event: Event) => {
  try {
    await Promise.all(
      event.Records.map(async (record) => {
        const id = ulid();

        const bucket = record.s3.bucket.name;
        const key = record.s3.object.key;

        const imageBuffer = await fetchImageFromS3(bucket, key);
        const fileExt = setFileExt(imageBuffer);

        if (fileExt !== ".jpeg" && fileExt !== ".png") {
          const error = "File is not an image";
          console.error("Error processing image:", error);
          throw error;
        }

        const image = await Jimp.read(imageBuffer);

        const originalImage = await uploadToS3(
          process.env.S3_BUCKET_RESIZED!,
          `${imagePrefix(id)}.${fileExt}`,
          imageBuffer,
          setContentType(fileExt)
        );

        const resizedImages = await resizeAndUploadImages(id, fileExt, image);
        console.log("Resized images uploaded:", resizedImages);

        const deleteResponse = await deleteS3Item(bucket, key);
        console.log("Success. Object deleted:", deleteResponse);

        // Example URLs and IDs
        await storeS3Url(
          id,
          originalImage,
          resizedImages[0],
          resizedImages[1],
          resizedImages[2]
        );
      })
    );
    return { statusCode: 200, body: "Images resized!" };
  } catch (error) {
    console.error("Error processing image:", error);
    return { statusCode: 500, body: JSON.stringify(error) };
  }
};

function setContentType(fileExt: string) {
  if (fileExt === "jpg" || fileExt === "jpeg") {
    return "image/jpeg";
  }
  return "image/png";
}

async function fetchImageFromS3(bucket: string, key: string): Promise<Buffer> {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const { Body } = await s3.send(command);

  return bufferizeStream(Body as Readable);
}

async function bufferizeStream(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

async function resizeAndUploadImages(
  id: string,
  fileExt: string,
  image: Jimp
): Promise<string[]> {
  const uploadPromises = sizes.map(([width, height]) =>
    resizeImageAndUpload(id, fileExt, image.clone(), width, height)
  );

  return Promise.all(uploadPromises);
}

async function resizeImageAndUpload(
  id: string,
  fileExt: string,
  image: Jimp,
  width: number,
  height: number
): Promise<string> {
  image.resize(width, height);
  const contentType = setContentType(fileExt);
  const buffer = await image.getBufferAsync(contentType);
  const bucket = process.env.S3_BUCKET_RESIZED!;
  const key = `${imagePrefix(id, width, height)}.${fileExt}`;

  return uploadToS3(bucket, key, buffer, contentType);
}

function imagePrefix(id: string, width?: number, height?: number) {
  if (!width || !height) {
    return `${id}/${id}`;
  }
  return `${id}/${width}x${height}-${id}`;
}

async function uploadToS3(
  bucket: string,
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  });
  await s3.send(command);
  return key;
}

async function deleteS3Item(bucketName: string, key: string) {
  const params = {
    Bucket: bucketName,
    Key: key,
  };
  return await s3.send(new DeleteObjectCommand(params));
}

async function storeS3Url(
  id: string,
  originalImage: string,
  imageSize1: string,
  imageSize2: string,
  imageSize3: string
) {
  const params = {
    TableName: process.env.DYNAMO_TABLE_NAME,
    Item: {
      itemId: id, // Unique identifier for the item
      images: {
        original: originalImage,
        "120x120": imageSize1,
        "160x120": imageSize2,
        "400x300": imageSize3,
      },
    },
  };

  try {
    const data = await db.put(params);
    console.log("S3 URL stored successfully:", data);
  } catch (err) {
    console.error("Error storing S3 URL:", err);
  }
}

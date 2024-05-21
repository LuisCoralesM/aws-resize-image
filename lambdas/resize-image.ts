import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import Jimp from "jimp";
import { Readable } from "stream";
import { ulid } from "ulidx";
import { Event } from "../types/event";
import { s3 } from "../utils/aws";
import { sizes } from "../utils/sizes";

const dbClient = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(dbClient);

export const handler = async (event: Event) => {
  try {
    await Promise.all(
      event.Records.map(async (record) => {
        const id = ulid();

        const bucket = record.s3.bucket.name;
        const key = record.s3.object.key;

        const imageBuffer = await fetchImageFromS3(bucket, key);
        const image = await Jimp.read(imageBuffer);

        const originalImage = await uploadToS3(
          process.env.S3_BUCKET_RESIZED!,
          id + ".jpg",
          imageBuffer,
          "image/jpeg"
        );

        const resizedImages = await resizeAndUploadImages(id, image);
        console.log("Resized images uploaded:", resizedImages);

        const deleteResponse = await deleteS3Item(bucket, key);
        console.log("Success. Object deleted:", deleteResponse);

        // Example URLs and IDs
        await storeS3Url(
          ulid(),
          originalImage,
          resizedImages[0],
          resizedImages[1],
          resizedImages[2]
        );
        console.log("Images added to database");
      })
    );
  } catch (error) {
    console.error("Error processing image:", error);
    throw error;
  }
};

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
  image: Jimp
): Promise<string[]> {
  const uploadPromises = sizes.map(([width, height]) =>
    resizeImageAndUpload(id, image.clone(), width, height)
  );

  return Promise.all(uploadPromises);
}

async function resizeImageAndUpload(
  id: string,
  image: Jimp,
  width: number,
  height: number
): Promise<string> {
  image.resize(width, height);
  const buffer = await image.getBufferAsync(Jimp.MIME_JPEG);
  const bucket = process.env.S3_BUCKET_RESIZED!;
  const key = `${id}/${width}x${height}-${id}.jpg`;

  return uploadToS3(bucket, key, buffer, "image/jpeg");
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
    const data = await docClient.send(new PutCommand(params));
    console.log("S3 URL stored successfully:", data);
  } catch (err) {
    console.error("Error storing S3 URL:", err);
  }
}

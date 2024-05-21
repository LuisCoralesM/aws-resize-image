import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { ulid } from "ulidx";
import { Event } from "../types/event";
import { s3 } from "../utils/aws";
import { resizeImage, sizes } from "../utils/sizes";

export const handler = async (event: Event) => {
  console.log(JSON.stringify(event));

  const command = new GetObjectCommand({
    Bucket: event.Records[0].s3.bucket.name,
    Key: event.Records[0].s3.object.key,
  });

  const { Body } = await s3.send(command);

  if (Body instanceof Readable) {
    const chunks: Buffer[] = [];
    Body.on("data", (chunk) => chunks.push(chunk));
    Body.on("end", async () => {
      try {
        const completeBuffer = Buffer.concat(chunks);

        // Resize the image using Sharp
        const resizedImages = await Promise.all([
          await resizeImage(completeBuffer, sizes[0][0], sizes[0][1]),
          await resizeImage(completeBuffer, sizes[1][0], sizes[1][1]),
          await resizeImage(completeBuffer, sizes[2][0], sizes[2][1]),
        ]);

        const results = await Promise.all(
          resizedImages.map(async (image) => {
            const response = await uploadToS3(
              process.env.S3_BUCKET_RESIZED!,
              ulid() + ".jpg",
              image,
              "image/jpeg"
            );
            return response;
          })
        );

        console.log("Images resized and uploaded successfully:", results);
      } catch (error) {
        console.error("Error processing images:", error);
      }
    });
  }
};

const uploadToS3 = async (
  Bucket: string,
  Key: string,
  Body: Buffer,
  ContentType: string
) => {
  const putObjectParams = {
    Bucket,
    Key,
    Body,
    ContentType, // Adjust the content type based on your image type
  };
  const command = new PutObjectCommand(putObjectParams);

  return await s3.send(command);
};

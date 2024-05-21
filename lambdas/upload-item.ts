import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { ulid } from "ulidx";
import { s3 } from "../utils/aws";

type PresignedPostParams = {
  Bucket: string;
  Key: string;
  ContentType: string;
  Expires?: number;
  ContentLengthRange?: { min: number; max: number };
};

export const handler = async (params: PresignedPostParams): Promise<any> => {
  const { Expires } = params;

  try {
    const results = await createPresignedPost(s3, {
      Bucket: process.env.S3_BUCKET!,
      Expires: Expires || 3600,
      Key: ulid() + ".jpg",
      Conditions: [
        ["content-length-range", 0, 11534336], // 11 MB limit, where 1 MB = 1,048,576 bytes
      ],
    });

    return { statusCode: 200, body: JSON.stringify(results) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify(error) };
  }
};

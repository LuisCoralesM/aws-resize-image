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
  const { Key, ContentType, ContentLengthRange, Bucket, Expires } = params;

  try {
    const results = await createPresignedPost(s3, {
      Bucket: process.env.S3_BUCKET!,
      Expires: Expires || 3600,
      Key: ulid() + ".jpg",
    });

    return { statusCode: 200, body: JSON.stringify(results) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify(error) };
  }
};

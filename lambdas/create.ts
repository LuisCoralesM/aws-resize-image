import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { ulid } from "ulidx";

const s3 = new S3Client();

type PresignedPostParams = {
  Bucket: string;
  Key: string;
  ContentType: string;
  Expires?: number;
  ContentLengthRange?: { min: number; max: number };
};

export const handler = async (params: PresignedPostParams): Promise<any> => {
  const { Key, ContentType, ContentLengthRange, Bucket, Expires } = params;

  console.log(params);

  try {
    const a = await createPresignedPost(s3, {
      Bucket: process.env.S3_BUCKET!,
      Expires: Expires || 3600,
      Key: ulid() + ".jpg",
    });

    console.log(a);

    return { statusCode: 200, body: JSON.stringify(a) };
  } catch (error) {
    console.log(error);
    return { statusCode: 500, body: JSON.stringify(error) };
  }
};

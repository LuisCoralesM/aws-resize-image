import AWS from "aws-sdk";
import { ulid } from "ulidx";

export const handler = async (event: any = {}): Promise<any> => {
  const s3 = new AWS.S3();

  const presignedGetOneURL = s3.getSignedUrl("getOneItem", {
    Bucket: "presignedurldemo",
    Key: ulid(), //filename
    Expires: 100, //time to expire in seconds
  });

  return presignedGetOneURL;
};

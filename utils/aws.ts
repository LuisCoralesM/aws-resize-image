import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { S3Client } from "@aws-sdk/client-s3";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

export const db = DynamoDBDocument.from(new DynamoDB());

export const s3 = new S3Client();

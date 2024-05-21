import { db } from "../utils/aws";
import { addUrlToImage } from "../utils/images";

export const handler = async (): Promise<any> => {
  const params = {
    TableName: process.env.DYNAMO_TABLE_NAME,
  };

  try {
    const response = await db.scan(params);

    const data = response.Items?.map((item) => addUrlToImage(item));

    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (dbError) {
    return { statusCode: 500, body: JSON.stringify(dbError) };
  }
};

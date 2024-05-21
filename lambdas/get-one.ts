import { db } from "../utils/aws";
import { addUrlToImage } from "../utils/images";

type EventParams = {
  pathParameters: { id: string };
};

export const handler = async (event: EventParams): Promise<any> => {
  const id = event.pathParameters.id;

  if (!id) {
    return {
      statusCode: 400,
      body: `Error: You are missing the path parameter id`,
    };
  }

  const params = {
    TableName: process.env.DYNAMO_TABLE_NAME,
    Key: {
      itemId: id,
    },
  };

  try {
    const response = await db.get(params);
    const data = addUrlToImage(response.Item!);
    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (dbError) {
    return { statusCode: 500, body: JSON.stringify(dbError) };
  }
};

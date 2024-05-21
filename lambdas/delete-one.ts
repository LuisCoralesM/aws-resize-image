import { db } from "../utils/aws";

export const handler = async (event: any = {}): Promise<any> => {
  const requestedItemId = event.pathParameters.id;
  if (!requestedItemId) {
    return {
      statusCode: 400,
      body: `Error: You are missing the path parameter id`,
    };
  }

  const params = {
    TableName: process.env.TABLE_NAME,
    Key: {
      [process.env.PRIMARY_KEY!]: requestedItemId,
    },
  };

  try {
    await db.delete(params);
    return { statusCode: 200, body: "" };
  } catch (dbError) {
    return { statusCode: 500, body: JSON.stringify(dbError) };
  }
};

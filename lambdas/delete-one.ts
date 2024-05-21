import { db } from "../utils/aws";

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
    await db.delete(params);
    return { statusCode: 200, body: "Item deleted successfully" };
  } catch (dbError) {
    return { statusCode: 500, body: JSON.stringify(dbError) };
  }
};

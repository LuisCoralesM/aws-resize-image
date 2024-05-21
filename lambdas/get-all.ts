import { db } from "../utils/aws";

export const handler = async (): Promise<any> => {
  const params = {
    TableName: process.env.TABLE_NAME,
  };

  try {
    const response = await db.scan(params);
    return { statusCode: 200, body: JSON.stringify(response.Items) };
  } catch (dbError) {
    return { statusCode: 500, body: JSON.stringify(dbError) };
  }
};

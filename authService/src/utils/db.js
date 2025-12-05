import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

export const saveUser = async (user) => {
  const params = {
    TableName: process.env.USERS_TABLE,
    Item: user,
  };
  await docClient.send(new PutCommand(params));
};

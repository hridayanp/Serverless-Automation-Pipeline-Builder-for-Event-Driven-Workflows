// src/config/dynamoConfig.js
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
});

export const ddbDocClient = DynamoDBDocumentClient.from(client);

// ✅ Table names (set from environment variables)
export const TABLE_PROJECTS = process.env.TABLE_PROJECTS;
export const TABLE_PROJECT_ENVS = process.env.TABLE_PROJECT_ENVS;

// src/services/dynamoService.js
import { ddbDocClient } from '../../config/dynamoConfig.js';
import {
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';

export const putItem = async (table, item) => {
  const res = await ddbDocClient.send(
    new PutCommand({ TableName: table, Item: item }),
  );
  return res;
};

export const getItem = async (table, key) => {
  const res = await ddbDocClient.send(
    new GetCommand({ TableName: table, Key: key }),
  );
  return res.Item;
};

export const scanTable = async (table) => {
  const res = await ddbDocClient.send(new ScanCommand({ TableName: table }));
  return res.Items || [];
};

export const updateItem = async (
  table,
  key,
  updateExpression,
  expressionValues,
  expressionNames,
) => {
  const res = await ddbDocClient.send(
    new UpdateCommand({
      TableName: table,
      Key: key,
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionValues,
      ExpressionAttributeNames: expressionNames,
      ReturnValues: 'ALL_NEW',
    }),
  );
  return res.Attributes;
};

export const deleteItem = async (table, key) => {
  const res = await ddbDocClient.send(
    new DeleteCommand({
      TableName: table,
      Key: key,
    }),
  );
  return res;
};

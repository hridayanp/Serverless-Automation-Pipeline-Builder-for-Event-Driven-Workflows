import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const client = new LambdaClient({
  region: process.env.AWS_REGION || 'ap-south-1',
});

/**
 * Invokes a Lambda function asynchronously
 */
export const invokeAsync = async (functionName, payload) => {
  const command = new InvokeCommand({
    FunctionName: functionName,
    InvocationType: 'Event', // Asynchronous
    Payload: JSON.stringify(payload),
  });

  return await client.send(command);
};

/**
 * Invokes a Lambda function synchronously and returns the result
 */
export const invokeSync = async (functionName, payload) => {
  const command = new InvokeCommand({
    FunctionName: functionName,
    InvocationType: 'RequestResponse',
    Payload: JSON.stringify(payload),
  });

  const response = await client.send(command);
  const result = JSON.parse(Buffer.from(response.Payload).toString());
  return result;
};

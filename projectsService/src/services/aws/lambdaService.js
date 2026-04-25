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

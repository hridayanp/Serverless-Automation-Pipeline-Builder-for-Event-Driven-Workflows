import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';

export const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
});

export const CLIENT_ID = process.env.COGNITO_CLIENT_ID;
export const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;

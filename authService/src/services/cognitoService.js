import {
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  GlobalSignOutCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import {
  cognitoClient,
  CLIENT_ID,
  USER_POOL_ID,
} from '../config/cognitoConfig.js';

export const signupUser = async (email, password) => {
  const command = new SignUpCommand({
    ClientId: CLIENT_ID,
    Username: email,
    Password: password,
    UserAttributes: [{ Name: 'email', Value: email }],
  });

  return await cognitoClient.send(command);
};

export const confirmUserCognito = async (email, confirmationCode) => {
  const command = new ConfirmSignUpCommand({
    ClientId: CLIENT_ID,
    Username: email,
    ConfirmationCode: confirmationCode,
  });

  return await cognitoClient.send(command);
};

export const loginUser = async (email, password) => {
  const command = new InitiateAuthCommand({
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: CLIENT_ID,
    AuthParameters: { USERNAME: email, PASSWORD: password },
  });

  return await cognitoClient.send(command);
};

export const signoutUser = async (accessToken) => {
  const command = new GlobalSignOutCommand({ AccessToken: accessToken });
  return await cognitoClient.send(command);
};

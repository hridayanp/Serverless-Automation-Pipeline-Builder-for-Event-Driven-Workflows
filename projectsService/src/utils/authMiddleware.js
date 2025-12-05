// src/middleware/authMiddleware.js
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { CustomResponse } from '../utils/response.js';

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  tokenUse: 'access',
  clientId: process.env.COGNITO_CLIENT_ID,
});

export const verifyToken = async (event) => {
  const response = new CustomResponse();

  try {
    const authHeader =
      event.headers?.authorization || event.headers?.Authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      response.status = 'FAILURE';
      response.message = 'Access token missing';
      return {
        isAuthorized: false,
        statusCode: 401,
        body: JSON.stringify(response),
      };
    }

    const token = authHeader.split(' ')[1];
    const payload = await verifier.verify(token);
    event.user = payload; // attach user info for downstream functions

    return { isAuthorized: true, event };
  } catch (err) {
    console.error('Token verification failed:', err);
    response.status = 'FAILURE';
    response.message = 'Invalid or expired access token';
    return {
      isAuthorized: false,
      statusCode: 401,
      body: JSON.stringify(response),
    };
  }
};

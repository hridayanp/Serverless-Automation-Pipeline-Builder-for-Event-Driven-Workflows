import * as cognitoService from '../services/cognitoService.js';
import * as userService from '../services/userService.js';
import { success, error } from '../utils/response.js';

export const signup = async (event) => {
  try {
    const { email, password } = JSON.parse(event.body);
    if (!email || !password) return error('Email and password are required');

    const response = await cognitoService.signupUser(email, password);
    return success(response, 'Signup initiated. Verify your email.');
  } catch (err) {
    console.error('Signup error:', err);
    return error(err.message);
  }
};

export const confirmUser = async (event) => {
  try {
    const { email, confirmationCode } = JSON.parse(event.body);
    if (!email || !confirmationCode)
      return error('Email and confirmationCode are required');

    await cognitoService.confirmUserCognito(email, confirmationCode);
    const user = await userService.saveUser(email);

    return success(user, 'User confirmed and stored in DynamoDB.');
  } catch (err) {
    console.error('ConfirmUser error:', err);
    return error(err.message);
  }
};

export const login = async (event) => {
  try {
    const { email, password } = JSON.parse(event.body);
    if (!email || !password) return error('Email and password are required');

    const response = await cognitoService.loginUser(email, password);
    return success(response.AuthenticationResult, 'Login successful');
  } catch (err) {
    console.error('Login error:', err);
    return error(err.message);
  }
};

export const signout = async (event) => {
  try {
    const { accessToken } = JSON.parse(event.body);
    if (!accessToken) return error('Access token is required');

    await cognitoService.signoutUser(accessToken);
    return success(null, 'User signed out successfully');
  } catch (err) {
    console.error('Signout error:', err);
    return error(err.message);
  }
};

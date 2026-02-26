// src/utils/response.js

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // change to frontend URL in prod
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,DELETE,PUT',
};

// ------------------------------------------------------------------
// Standardized API response class (USED EVERYWHERE)
// ------------------------------------------------------------------
export class CustomResponse {
  constructor() {
    this.success = true;
    this.message = '';
    this.data = null;
  }

  send(statusCode = 200) {
    return {
      statusCode,
      headers: corsHeaders,
      body: JSON.stringify({
        success: this.success,
        message: this.message,
        data: this.data,
      }),
    };
  }
}

// ------------------------------------------------------------------
// Simple helper functions (optional usage)
// ------------------------------------------------------------------
export const success = (data = null, message = 'Success') => {
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      message,
      data,
    }),
  };
};

export const error = (message = 'Something went wrong', statusCode = 400) => {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify({
      success: false,
      message,
      data: null,
    }),
  };
};

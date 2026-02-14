const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // change to frontend URL in prod
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
};

export const success = (data, message = 'Success') => {
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
    }),
  };
};

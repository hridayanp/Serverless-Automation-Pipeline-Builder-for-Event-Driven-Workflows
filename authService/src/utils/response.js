export const success = (data, message = 'Success', statusCode = 200) => ({
  statusCode,
  body: JSON.stringify({ message, data }),
});

export const error = (errorMessage, statusCode = 400) => ({
  statusCode,
  body: JSON.stringify({ error: errorMessage }),
});

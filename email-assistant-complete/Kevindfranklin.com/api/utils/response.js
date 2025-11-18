/**
 * Standardized API response helpers for Vercel serverless functions
 */

export function success(res, data, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function error(res, message = 'An error occurred', statusCode = 500, errors = null) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}

export function unauthorized(res, message = 'Unauthorized') {
  return error(res, message, 401);
}

export function forbidden(res, message = 'Forbidden') {
  return error(res, message, 403);
}

export function notFound(res, message = 'Resource not found') {
  return error(res, message, 404);
}

export function badRequest(res, message = 'Bad request', errors = null) {
  return error(res, message, 400, errors);
}

export function created(res, data, message = 'Created successfully') {
  return success(res, data, message, 201);
}

export function noContent(res) {
  return res.status(204).send();
}

// CORS helper for Vercel
export function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.APP_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  return res;
}

export function handleCors(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
}

export default {
  success,
  error,
  unauthorized,
  forbidden,
  notFound,
  badRequest,
  created,
  noContent,
  setCorsHeaders,
  handleCors,
};

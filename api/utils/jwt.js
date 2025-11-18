import jwt from 'jsonwebtoken';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
};

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate JWT token for user
 * @param {object} payload - User data to include in token
 * @returns {string} - JWT token
 */
export function generateToken(payload) {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {object|null} - Decoded payload or null if invalid
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (error) {
    console.error('JWT verification error:', error.message);
    return null;
  }
}

/**
 * Decode JWT token without verification (use cautiously)
 * @param {string} token - JWT token to decode
 * @returns {object|null} - Decoded payload
 */
export function decodeToken(token) {
  try {
    return jwt.decode(token);
  } catch (error) {
    console.error('JWT decode error:', error.message);
    return null;
  }
}

/**
 * Refresh token (generate new token with updated expiration)
 * @param {string} token - Old JWT token
 * @returns {string|null} - New JWT token or null if invalid
 */
export function refreshToken(token) {
  const payload = verifyToken(token);

  if (!payload) {
    return null;
  }

  // Remove JWT metadata before re-signing
  const { iat, exp, ...userPayload } = payload;

  return generateToken(userPayload);
}

export default {
  generateToken,
  verifyToken,
  decodeToken,
  refreshToken,
};

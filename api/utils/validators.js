/**
 * Validation utilities
 */

export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPassword(password) {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and >
    .slice(0, 10000); // Limit length
}

export function validateEmailAccount(data) {
  const errors = [];

  if (!data.email_address || !isValidEmail(data.email_address)) {
    errors.push('Valid email address is required');
  }

  if (!data.provider || !['gmail', 'outlook', 'icloud', 'spacemail'].includes(data.provider)) {
    errors.push('Invalid provider');
  }

  // IMAP/SMTP validation for iCloud and Spacemail
  if (['icloud', 'spacemail'].includes(data.provider)) {
    if (!data.password) {
      errors.push('Password is required for IMAP/SMTP providers');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validatePaginationParams(page, limit) {
  const parsedPage = parseInt(page) || 1;
  const parsedLimit = parseInt(limit) || 50;

  return {
    page: Math.max(1, parsedPage),
    limit: Math.min(100, Math.max(1, parsedLimit)),
    offset: (Math.max(1, parsedPage) - 1) * Math.min(100, Math.max(1, parsedLimit)),
  };
}

export default {
  isValidEmail,
  isValidPassword,
  isValidUrl,
  sanitizeInput,
  validateEmailAccount,
  validatePaginationParams,
};

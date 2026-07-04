import { isValidEmail, isValidPassword } from '@dauth/shared';

/**
 * Middleware validating input parameters for user registration.
 */
export function validateRegisterInput(req, res, next) {
  const { email, password, name } = req.body;

  if (!email || !isValidEmail(email)) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'A valid email address is required.',
    });
  }

  if (!password || !isValidPassword(password)) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'Password must be at least 8 characters long and contain both letters and numbers.',
    });
  }

  if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'Name must be a non-empty string.',
    });
  }

  next();
}

/**
 * Middleware validating input parameters for user login.
 */
export function validateLoginInput(req, res, next) {
  const { email, password } = req.body;

  if (!email || !isValidEmail(email)) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'A valid email address is required.',
    });
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'Password is required.',
    });
  }

  next();
}

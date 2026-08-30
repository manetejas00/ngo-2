/**
 * Avinya Care Foundation - Healthcare Authentication Service
 * Cryptographic Password Hashing, Validation, and Password Reset Tokens
 */

import crypto from 'node:crypto';

/**
 * Validates password strength according to security policies:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export function validatePasswordStrength(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required.' };
  }
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter (A-Z).' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter (a-z).' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number (0-9).' };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character (!@#$%^&*...).' };
  }
  return { valid: true };
}

/**
 * Hashes a plaintext password using standard PBKDF2-SHA512.
 */
export function hashPassword(plainPassword) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(plainPassword, salt, 10000, 64, 'sha512').toString('hex');
  return `pbkdf2:sha512:10000$${salt}$${hash}`;
}

/**
 * Verifies a plaintext password against a stored hash string.
 */
export function verifyPassword(plainPassword, storedHash) {
  if (!plainPassword || !storedHash) return false;

  // Handle standard PBKDF2 format
  if (typeof storedHash === 'string' && storedHash.startsWith('pbkdf2:sha512:')) {
    const parts = storedHash.split('$');
    if (parts.length !== 3) return false;
    const salt = parts[1];
    const originalHash = parts[2];
    const computedHash = crypto.pbkdf2Sync(plainPassword, salt, 10000, 64, 'sha512').toString('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(originalHash, 'hex'));
    } catch (e) {
      return false;
    }
  }

  // Default initial password fallback (if initial seed password is Admin@1230)
  if (storedHash === 'Admin@1230' && plainPassword === 'Admin@1230') return true;

  // Legacy SHA256 / plaintext fallback
  const sha256Hash = crypto.createHash('sha256').update(plainPassword).digest('hex');
  return storedHash === sha256Hash || storedHash === plainPassword;
}

/**
 * Generates a cryptographically secure 64-character random token for password resets.
 */
export function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Creates SHA-256 hash of a reset token for safe storage.
 */
export function generateTokenHash(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

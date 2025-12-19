/**
 * Fields that contain sensitive data and should be masked in logs
 */
const SENSITIVE_FIELDS = ['email', 'phone', 'value', 'password', 'secret', 'token', 'apiSecret', 'apiKey'];

/**
 * Mask value for redacted fields
 */
const REDACTED = '[REDACTED]';

/**
 * Base error class for all Shopier SDK errors.
 * All custom errors extend this class.
 */
export class ShopierError extends Error {
  readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(message: string, code: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ShopierError';
    this.code = code;
    this.details = details;

    // Maintains proper stack trace for where error was thrown (only in V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    // Set the prototype explicitly for proper instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Returns error details with sensitive fields masked.
   * Use this method for logging in production environments.
   * 
   * Masked fields: email, phone, value, password, secret, token, apiSecret, apiKey
   * 
   * @returns Sanitized details object or undefined if no details exist
   * 
   * @example
   * ```typescript
   * catch (error) {
   *   if (error instanceof ShopierError) {
   *     console.error('Error:', error.message, error.getSafeDetails());
   *   }
   * }
   * ```
   */
  getSafeDetails(): Record<string, unknown> | undefined {
    if (!this.details) {
      return undefined;
    }

    return Object.fromEntries(
      Object.entries(this.details).map(([key, value]) => {
        // Check if key matches any sensitive field (case-insensitive)
        const isSensitive = SENSITIVE_FIELDS.some(
          field => key.toLowerCase().includes(field.toLowerCase())
        );
        return isSensitive ? [key, REDACTED] : [key, value];
      })
    );
  }

  /**
   * Returns a safe JSON representation for logging.
   * Includes message, code, and sanitized details.
   * 
   * @returns Safe-to-log object representation
   */
  toSafeJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.getSafeDetails(),
    };
  }
}

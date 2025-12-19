import { ShopierError } from './base';

/**
 * Error thrown when input validation fails.
 */
export class ValidationError extends ShopierError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

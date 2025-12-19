import { ShopierError } from './base';

/**
 * Error thrown when signature validation fails.
 */
export class SignatureValidationError extends ShopierError {
  constructor(message: string = 'Signature validation failed', details?: Record<string, unknown>) {
    super(message, 'SIGNATURE_VALIDATION_ERROR', details);
    this.name = 'SignatureValidationError';
  }
}

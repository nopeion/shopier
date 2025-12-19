import { ShopierError } from './base';

/**
 * Error thrown when API secret is missing or invalid.
 */
export class InvalidApiSecretError extends ShopierError {
  constructor(message: string = 'API secret is missing or invalid', details?: Record<string, unknown>) {
    super(message, 'INVALID_API_SECRET', details);
    this.name = 'InvalidApiSecretError';
  }
}

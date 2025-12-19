import { ShopierError } from './base';

/**
 * Error thrown when API key is missing or invalid.
 */
export class InvalidApiKeyError extends ShopierError {
  constructor(message: string = 'API key is missing or invalid', details?: Record<string, unknown>) {
    super(message, 'INVALID_API_KEY', details);
    this.name = 'InvalidApiKeyError';
  }
}

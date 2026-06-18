import { ShopierError } from './base';

export class ShopierApiUnsupportedOperationError extends ShopierError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'SHOPIER_API_UNSUPPORTED_OPERATION', details);
    this.name = 'ShopierApiUnsupportedOperationError';
  }
}

export class ShopierApiRequestError extends ShopierError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'SHOPIER_API_REQUEST_ERROR', details);
    this.name = 'ShopierApiRequestError';
  }
}

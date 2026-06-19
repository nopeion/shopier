import { ShopierError } from './base';
import { ShopierApiRequestError } from './unsupported';

export class ShopierUnauthorizedPatError extends ShopierError {
  constructor(message = 'Shopier PAT is unauthorized or expired', details?: Record<string, unknown>) {
    super(message, 'SHOPIER_UNAUTHORIZED_PAT', details);
    this.name = 'ShopierUnauthorizedPatError';
  }
}

export class ShopierInvalidMediaUrlError extends ShopierError {
  constructor(message = 'Shopier rejected the product media URL', details?: Record<string, unknown>) {
    super(message, 'SHOPIER_INVALID_MEDIA_URL', details);
    this.name = 'ShopierInvalidMediaUrlError';
  }
}

export class ShopierRateLimitError extends ShopierError {
  constructor(message = 'Shopier API rate limit exceeded', details?: Record<string, unknown>) {
    super(message, 'SHOPIER_RATE_LIMIT', details);
    this.name = 'ShopierRateLimitError';
  }
}

export class ShopierHostedCheckoutListingError extends ShopierError {
  constructor(message = 'Shopier hosted checkout requires product listing to be active', details?: Record<string, unknown>) {
    super(message, 'SHOPIER_HOSTED_CHECKOUT_LISTING_REQUIRED', details);
    this.name = 'ShopierHostedCheckoutListingError';
  }
}

export class ShopierFetchUnavailableError extends ShopierError {
  constructor(message = 'A fetch implementation is required to call the Shopier API in this runtime', details?: Record<string, unknown>) {
    super(message, 'SHOPIER_FETCH_UNAVAILABLE', details);
    this.name = 'ShopierFetchUnavailableError';
  }
}

export function createShopierApiError(
  message: string,
  details?: Record<string, unknown>
): ShopierError {
  const status = typeof details?.status === 'number' ? details.status : undefined;
  const apiMessage = extractApiMessage(details);

  if (status === 401 || status === 403) {
    return new ShopierUnauthorizedPatError(apiMessage ?? message, details);
  }

  if (status === 429) {
    return new ShopierRateLimitError(apiMessage ?? message, details);
  }

  if (apiMessage && /invalid media url/i.test(apiMessage)) {
    return new ShopierInvalidMediaUrlError(apiMessage, details);
  }

  if (apiMessage && /(product listing|urun listelemesi|listeleme)/i.test(normalizeMessage(apiMessage))) {
    return new ShopierHostedCheckoutListingError(apiMessage, details);
  }

  return new ShopierApiRequestError(message, details);
}

function extractApiMessage(details: Record<string, unknown> | undefined): string | undefined {
  const body = details?.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return undefined;
  }

  const record = body as Record<string, unknown>;
  const message = record.message ?? record.error_description ?? record.error;
  return typeof message === 'string' && message.trim() !== '' ? message : undefined;
}

function normalizeMessage(message: string): string {
  return message
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

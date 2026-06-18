import { ShopierApiUnsupportedOperationError } from './errors';

export interface VerifyWebhookOptions {
  headers: Headers | Record<string, string | string[] | undefined>;
  body: string | Buffer | ArrayBuffer;
  secret?: string;
}

export interface ShopierWebhookEvent {
  id?: string;
  type: string;
  createdAt?: string;
  data?: unknown;
  raw: unknown;
}

export function verifyWebhook(_options: VerifyWebhookOptions): never {
  throw new ShopierApiUnsupportedOperationError(
    'Shopier webhook signature schema is not public in this package yet; verify the developer portal schema before enabling webhook verification',
    { operation: 'verifyWebhook' }
  );
}

export function parseWebhookEvent(raw: unknown): ShopierWebhookEvent {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new ShopierApiUnsupportedOperationError(
      'Shopier webhook payload schema is required before parsing events safely',
      { operation: 'parseWebhookEvent' }
    );
  }

  throw new ShopierApiUnsupportedOperationError(
    'Shopier webhook payload schema is required before parsing events safely',
    { operation: 'parseWebhookEvent' }
  );
}

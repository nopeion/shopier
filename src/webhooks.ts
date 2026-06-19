import { createHmac, timingSafeEqual } from 'crypto';
import { SignatureValidationError, ValidationError } from './errors';
import { ShopierWebhookEventType } from './api';

export type WebhookHeadersInput = Headers | Record<string, string | string[] | undefined>;

export interface VerifyWebhookOptions {
  headers: WebhookHeadersInput;
  body: string | Buffer | ArrayBuffer;
  secret?: string;
  webhookToken?: string;
}

export interface ShopierWebhookHeaders {
  event?: ShopierWebhookEventType | string;
  webhookId?: string;
  timestamp?: string;
  signature?: string;
  accountId?: string;
  apiVersion?: string;
}

export interface VerifyWebhookResult extends ShopierWebhookHeaders {
  verified: true;
}

export interface ShopierWebhookEvent<TBody = unknown> {
  id?: string;
  type: ShopierWebhookEventType | string;
  createdAt?: string;
  data: TBody;
  headers?: ShopierWebhookHeaders;
  raw: TBody;
}

export type ShopierWebhookHandler<TBody = unknown> = (
  event: ShopierWebhookEvent<TBody>
) => void | Promise<void>;

export interface ShopierWebhookRouterOptions {
  webhookToken?: string;
  secret?: string;
}

export interface ShopierWebhookDispatchResult<TBody = unknown> {
  event: ShopierWebhookEvent<TBody>;
  handled: boolean;
  handlerCount: number;
}

export function verifyWebhook(options: VerifyWebhookOptions): VerifyWebhookResult {
  const token = resolveWebhookToken(options);
  const signature = getHeader(options.headers, 'shopier-signature');

  if (!signature) {
    throw new SignatureValidationError('Webhook signature header is missing');
  }

  const body = normalizeBody(options.body);

  if (!matchesSignature(token, body, signature)) {
    throw new SignatureValidationError('Webhook signature verification failed');
  }

  return {
    verified: true,
    event: getHeader(options.headers, 'shopier-event'),
    webhookId: getHeader(options.headers, 'shopier-webhook-id'),
    timestamp: getHeader(options.headers, 'shopier-timestamp'),
    signature,
    accountId: getHeader(options.headers, 'shopier-account-id'),
    apiVersion: getHeader(options.headers, 'shopier-api-version'),
  };
}

export function parseWebhookEvent<TBody = unknown>(
  raw: TBody,
  headers?: WebhookHeadersInput
): ShopierWebhookEvent<TBody> {
  if (raw === undefined || raw === null) {
    throw new ValidationError('Webhook payload is empty');
  }

  const normalizedHeaders = headers ? normalizeWebhookHeaders(headers) : undefined;
  const record = isRecord(raw) ? raw : undefined;
  const type = normalizedHeaders?.event ?? getString(record, ['event', 'type']);

  if (!type) {
    throw new ValidationError('Webhook event type is missing');
  }

  return {
    id: normalizedHeaders?.webhookId ?? getString(record, ['id', 'webhookId']),
    type,
    createdAt: normalizedHeaders?.timestamp ?? getString(record, ['createdAt', 'dateCreated']),
    data: raw,
    headers: normalizedHeaders,
    raw,
  };
}

export function verifyAndParseWebhook<TBody = unknown>(
  options: VerifyWebhookOptions
): ShopierWebhookEvent<TBody> {
  const headers = verifyWebhook(options);
  const rawBody = normalizeBody(options.body);
  let payload: TBody;

  try {
    payload = JSON.parse(rawBody) as TBody;
  } catch {
    throw new ValidationError('Webhook payload is not valid JSON');
  }

  return parseWebhookEvent(payload, {
    'shopier-event': headers.event,
    'shopier-webhook-id': headers.webhookId,
    'shopier-timestamp': headers.timestamp,
    'shopier-signature': headers.signature,
    'shopier-account-id': headers.accountId,
    'shopier-api-version': headers.apiVersion,
  });
}

export class ShopierWebhookVerifier {
  private readonly token: string;

  constructor(token?: string) {
    const resolvedToken = resolveToken(token);

    if (!resolvedToken) {
      throw new ValidationError('Webhook token is required', {
        credentialType: 'webhookToken',
      });
    }

    this.token = resolvedToken;
  }

  verify(headers: WebhookHeadersInput, body: string | Buffer | ArrayBuffer): VerifyWebhookResult {
    return verifyWebhook({ headers, body, webhookToken: this.token });
  }

  parse<TBody = unknown>(
    headers: WebhookHeadersInput,
    body: string | Buffer | ArrayBuffer
  ): ShopierWebhookEvent<TBody> {
    return verifyAndParseWebhook<TBody>({ headers, body, webhookToken: this.token });
  }
}

export class ShopierWebhookRouter {
  private readonly verifier: ShopierWebhookVerifier;
  private readonly handlers = new Map<string, ShopierWebhookHandler[]>();
  private readonly anyHandlers: ShopierWebhookHandler[] = [];

  constructor(options: ShopierWebhookRouterOptions | string = {}) {
    const token = typeof options === 'string' ? options : options.webhookToken ?? options.secret;
    this.verifier = new ShopierWebhookVerifier(token);
  }

  on<TBody = unknown>(eventType: ShopierWebhookEventType | string, handler: ShopierWebhookHandler<TBody>): this {
    const handlers = this.handlers.get(eventType) ?? [];
    handlers.push(handler as ShopierWebhookHandler);
    this.handlers.set(eventType, handlers);
    return this;
  }

  onAny<TBody = unknown>(handler: ShopierWebhookHandler<TBody>): this {
    this.anyHandlers.push(handler as ShopierWebhookHandler);
    return this;
  }

  async dispatch<TBody = unknown>(
    headers: WebhookHeadersInput,
    body: string | Buffer | ArrayBuffer
  ): Promise<ShopierWebhookDispatchResult<TBody>> {
    const event = this.verifier.parse<TBody>(headers, body);
    const eventHandlers = this.handlers.get(event.type) ?? [];
    const handlers = [...eventHandlers, ...this.anyHandlers];

    for (const handler of handlers) {
      await handler(event);
    }

    return {
      event,
      handled: handlers.length > 0,
      handlerCount: handlers.length,
    };
  }

  handle<TBody = unknown>(
    headers: WebhookHeadersInput,
    body: string | Buffer | ArrayBuffer
  ): Promise<ShopierWebhookDispatchResult<TBody>> {
    return this.dispatch<TBody>(headers, body);
  }
}

function resolveWebhookToken(options: VerifyWebhookOptions): string {
  const token = resolveToken(options.webhookToken ?? options.secret);

  if (!token) {
    throw new ValidationError('Webhook token is required', {
      credentialType: 'webhookToken',
    });
  }

  return token;
}

function resolveToken(token?: string): string | undefined {
  const resolved =
    token ??
    process.env.SHOPIER_WEBHOOK_TOKEN ??
    process.env.SHOPIER_WEBHOOK_SECRET;

  return typeof resolved === 'string' && resolved.trim() !== '' ? resolved.trim() : undefined;
}

function normalizeWebhookHeaders(headers: WebhookHeadersInput): ShopierWebhookHeaders {
  return {
    event: getHeader(headers, 'shopier-event'),
    webhookId: getHeader(headers, 'shopier-webhook-id'),
    timestamp: getHeader(headers, 'shopier-timestamp'),
    signature: getHeader(headers, 'shopier-signature'),
    accountId: getHeader(headers, 'shopier-account-id'),
    apiVersion: getHeader(headers, 'shopier-api-version'),
  };
}

function getHeader(headers: WebhookHeadersInput, name: string): string | undefined {
  if (typeof Headers !== 'undefined' && headers instanceof Headers) {
    return headers.get(name) ?? undefined;
  }

  const record = headers as Record<string, string | string[] | undefined>;
  const lowerName = name.toLowerCase();
  const found = Object.entries(record).find(([key]) => key.toLowerCase() === lowerName)?.[1];

  if (Array.isArray(found)) {
    return found[0];
  }

  return found;
}

function normalizeBody(body: string | Buffer | ArrayBuffer): string {
  if (typeof body === 'string') {
    return body;
  }

  if (Buffer.isBuffer(body)) {
    return body.toString('utf8');
  }

  return Buffer.from(body).toString('utf8');
}

function matchesSignature(token: string, body: string, receivedSignature: string): boolean {
  const expectedHex = createHmac('sha256', token).update(body).digest('hex');
  const expectedBase64 = createHmac('sha256', token).update(body).digest('base64');

  return timingSafeCompare(expectedHex, receivedSignature) ||
    timingSafeCompare(expectedBase64, receivedSignature);
}

function timingSafeCompare(expected: string, received: string): boolean {
  try {
    const expectedBuffer = Buffer.from(expected);
    const receivedBuffer = Buffer.from(received);

    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getString(record: Record<string, unknown> | undefined, keys: string[]): string | undefined {
  if (!record) {
    return undefined;
  }

  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'string' && value.trim() !== '') {
      return value;
    }
  }

  return undefined;
}

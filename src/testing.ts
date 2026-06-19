import { createHmac } from 'crypto';
import { ShopierProduct, ShopierWebhookEventType } from './api';

export interface MockShopierFetchCall {
  input: Parameters<typeof fetch>[0];
  init?: Parameters<typeof fetch>[1];
}

export interface MockShopierFetchResponse {
  body?: unknown;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
}

export type MockShopierFetch = typeof fetch & {
  calls: MockShopierFetchCall[];
  queueJson: (body: unknown, status?: number) => void;
  queueResponse: (response: MockShopierFetchResponse) => void;
};

export interface ShopierWebhookFixtureOptions {
  token?: string;
  event?: ShopierWebhookEventType | string;
  body?: unknown;
  webhookId?: string;
  timestamp?: string;
}

export interface ShopierWebhookFixture {
  token: string;
  body: string;
  headers: Record<string, string>;
  signature: string;
}

export interface OsbFixtureOptions {
  username?: string;
  password?: string;
  payload?: Record<string, unknown>;
}

export interface OsbFixture {
  username: string;
  password: string;
  res: string;
  hash: string;
  payload: Record<string, unknown>;
}

export function createMockShopierFetch(responses: MockShopierFetchResponse[] = []): MockShopierFetch {
  const queue = [...responses];
  const calls: MockShopierFetchCall[] = [];

  const mockFetch = (async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    calls.push({ input, init });
    const response = queue.shift() ?? {};
    return createMockResponse(response);
  }) as MockShopierFetch;

  mockFetch.calls = calls;
  mockFetch.queueJson = (body: unknown, status = 200) => queue.push({ body, status });
  mockFetch.queueResponse = (response: MockShopierFetchResponse) => queue.push(response);

  return mockFetch;
}

export function createMockProduct(overrides: Partial<ShopierProduct> = {}): ShopierProduct {
  return {
    id: 'product-1',
    title: 'Test Product',
    type: 'digital',
    url: 'https://www.shopier.com/product-1',
    ...overrides,
  };
}

export function createShopierWebhookFixture(options: ShopierWebhookFixtureOptions = {}): ShopierWebhookFixture {
  const token = options.token ?? 'webhook-token';
  const body = typeof options.body === 'string'
    ? options.body
    : JSON.stringify(options.body ?? { id: 'order-1' });
  const signature = createHmac('sha256', token).update(body).digest('hex');
  const event = options.event ?? 'order.created';
  const webhookId = options.webhookId ?? 'webhook-1';
  const timestamp = options.timestamp ?? new Date(0).toISOString();

  return {
    token,
    body,
    signature,
    headers: {
      'shopier-event': event,
      'shopier-webhook-id': webhookId,
      'shopier-timestamp': timestamp,
      'shopier-signature': signature,
    },
  };
}

export function createOsbFixture(options: OsbFixtureOptions = {}): OsbFixture {
  const username = options.username ?? 'osb-user';
  const password = options.password ?? 'osb-password';
  const payload = options.payload ?? {
    orderid: 'order-1',
    email: 'buyer@example.com',
    currency: '0',
    price: '10.00',
  };
  const res = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');
  const hash = createHmac('sha256', password).update(`${res}${username}`).digest('hex');

  return {
    username,
    password,
    payload,
    res,
    hash,
  };
}

function createMockResponse(response: MockShopierFetchResponse): Response {
  const status = response.status ?? 200;
  const body = response.body === undefined ? null : JSON.stringify(response.body);
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...response.headers,
  };

  if (typeof Response === 'undefined') {
    return {
      ok: status >= 200 && status < 300,
      status,
      statusText: response.statusText ?? '',
      headers: {
        get: (name: string) => headers[Object.keys(headers).find((key) => key.toLowerCase() === name.toLowerCase()) ?? ''] ?? null,
      },
      text: async () => body ?? '',
    } as Response;
  }

  return new Response(body, {
    status,
    statusText: response.statusText,
    headers,
  });
}

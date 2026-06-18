import {
  ShopierApiRequestError,
  ShopierApiUnsupportedOperationError,
  ValidationError,
} from './errors';

export interface ShopierApiConfig {
  personalAccessToken: string;
  baseUrl?: string;
  fetch?: typeof fetch;
}

export interface ShopierApiRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

export interface ShopierApiErrorBody {
  status: number;
  statusText: string;
  body?: unknown;
}

export class ShopierApiClient {
  readonly baseUrl: string;
  readonly orders: {
    get: (orderId: string) => Promise<never>;
    list: (params?: Record<string, unknown>) => Promise<never>;
  };

  private readonly personalAccessToken: string;
  private readonly fetcher?: typeof fetch;

  constructor(config: ShopierApiConfig) {
    if (!config.personalAccessToken || config.personalAccessToken.trim() === '') {
      throw new ValidationError('Personal access token is required', {
        credentialType: 'personalAccessToken',
      });
    }

    this.personalAccessToken = config.personalAccessToken.trim();
    this.baseUrl = config.baseUrl ?? 'https://api.shopier.com';
    this.fetcher = config.fetch ?? globalThis.fetch;
    this.orders = {
      get: async () => this.unsupported('orders.get'),
      list: async () => this.unsupported('orders.list'),
    };
  }

  async request<T>(path: string, options: ShopierApiRequestOptions = {}): Promise<T> {
    if (!this.fetcher) {
      throw new ShopierApiRequestError(
        'A fetch implementation is required to call the Shopier API in this runtime',
        { runtime: 'fetch_missing' }
      );
    }

    const response = await this.fetcher(`${this.baseUrl}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        Authorization: `Bearer ${this.personalAccessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });

    if (!response.ok) {
      throw new ShopierApiRequestError('Shopier API response was not successful', {
        status: response.status,
        statusText: response.statusText,
        body: await safeReadResponseBody(response),
      });
    }

    return response.json() as Promise<T>;
  }

  private unsupported(operation: string): never {
    throw new ShopierApiUnsupportedOperationError(
      'Shopier API developer portal schema is required before this operation can be implemented safely',
      { operation }
    );
  }
}

async function safeReadResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

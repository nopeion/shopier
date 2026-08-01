import { randomUUID } from 'crypto';
import {
  createShopierApiError,
  ShopierError,
  ShopierFetchUnavailableError,
  ShopierApiRequestError,
  ValidationError,
} from '../errors';
import {
  ShopierHttpMethod,
  ShopierCurrencyCode,
  ShopierSortDirection,
  ShopierProductType,
  ShopierShippingPayer,
  ShopierStockStatus,
  ShopierShippingCompany,
  ShopierWebhookEventType,
  ShopierQueryParams,
  ShopierFailureReason,
  ShopierRetryContext,
  ShopierRetryOptions,
  ShopierApiConfig,
  ShopierApiRequestOptions,
  ShopierApiErrorBody,
  ShopierApiResource,
  ShopierListParams,
  ShopierDateRangeParams,
  ShopierBalance,
  ShopierTransaction,
  ShopierCategory,
  ShopierCategoryInput,
  ShopierCategoryUpdateInput,
  ShopierDiscountType,
  ShopierAutomaticDiscountScope,
  ShopierAutomaticDiscountRequirement,
  ShopierDiscountCode,
  ShopierCreateDiscountCodeInput,
  ShopierUpdateDiscountCodeInput,
  ShopierAutomaticDiscount,
  ShopierCreateAutomaticDiscountInput,
  ShopierUpdateAutomaticDiscountInput,
  ShopierAddressInfo,
  ShopierOrderTotals,
  ShopierOrderLineItem,
  ShopierOrder,
  ShopierListOrdersParams,
  ShopierFulfillmentInput,
  ShopierUpdateOrderInput,
  ShopierPayout,
  ShopierProductMedia,
  ShopierProductMediaResult,
  ShopierProductPriceData,
  ShopierProductVariantInput,
  ShopierProductOptionInput,
  ShopierCreateProductInput,
  ShopierUpdateProductInput,
  ShopierProduct,
  ShopierListProductsParams,
  ShopierRefund,
  ShopierCreateRefundInput,
  ShopierListRefundsParams,
  ShopierSelection,
  ShopierCreateSelectionInput,
  ShopierUpdateSelectionInput,
  ShopierListSelectionsParams,
  ShopierShipping,
  ShopierCreateShippingInput,
  ShopierListShippingsParams,
  ShopierShopOwner,
  ShopierShopSettings,
  ShopierUpdateShopSettingsInput,
  ShopierVariation,
  ShopierCreateVariationInput,
  ShopierUpdateVariationInput,
  ShopierWebhookSubscription,
  ShopierCreateWebhookInput,
  ShopierBalanceApi,
  ShopierCreateOptions,
  ShopierCrudApi,
  ShopierDiscountsApi,
  ShopierOrdersApi,
  ShopierPayoutsApi,
  ShopierProductsApi,
  ShopierRefundsApi,
  ShopierShippingsApi,
  ShopierShopApi,
  ShopierWebhooksApi,
  DEFAULT_BASE_URL,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_MAX_RETRIES,
  DEFAULT_RETRY_BASE_DELAY_MS,
  DEFAULT_RETRY_MAX_DELAY_MS,
  IDEMPOTENT_METHODS,
  RETRYABLE_STATUSES,
  QueryPrimitive
} from './types';
export class ShopierApiClient {
  readonly baseUrl: string;
  readonly timeoutMs: number;
  readonly balance: ShopierBalanceApi;
  readonly categories: ShopierCrudApi<ShopierCategory, ShopierCategoryInput, ShopierCategoryUpdateInput>;
  readonly discounts: ShopierDiscountsApi;
  readonly orders: ShopierOrdersApi;
  readonly payouts: ShopierPayoutsApi;
  readonly products: ShopierProductsApi;
  readonly refunds: ShopierRefundsApi;
  readonly selections: ShopierCrudApi<
    ShopierSelection,
    ShopierCreateSelectionInput,
    ShopierUpdateSelectionInput,
    ShopierListSelectionsParams
  >;
  readonly shippings: ShopierShippingsApi;
  readonly shop: ShopierShopApi;
  readonly variations: ShopierCrudApi<ShopierVariation, ShopierCreateVariationInput, ShopierUpdateVariationInput>;
  readonly webhooks: ShopierWebhooksApi;

  private readonly accessToken: string;
  private readonly fetcher?: typeof fetch;
  private readonly retry: ShopierRetryOptions;

  constructor(config: ShopierApiConfig) {
    const accessToken = resolveAccessToken(config);

    if (!accessToken) {
      throw new ValidationError('Personal access token is required', {
        credentialType: 'personalAccessToken',
      });
    }

    this.accessToken = accessToken;
    this.baseUrl = normalizeBaseUrl(config.baseUrl ?? DEFAULT_BASE_URL);
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fetcher = config.fetch ?? globalThis.fetch;
    this.retry = { ...config.retry };

    this.balance = {
      get: () => this.request<ShopierBalance>('/balance'),
      transactions: {
        list: (params) => this.request<ShopierTransaction[]>('/balance/transactions', { query: params }),
        get: (orderId) => this.request<ShopierTransaction>(`/balance/transactions/${pathSegment(orderId)}`),
      },
    };

    this.categories = {
      list: (params) => this.request<ShopierCategory[]>('/categories', { query: params }),
      create: (input, options) => this.request<ShopierCategory>('/categories', {
        method: 'POST',
        body: input,
        idempotencyKey: options?.idempotencyKey,
      }),
      get: (id) => this.request<ShopierCategory>(`/categories/${pathSegment(id)}`),
      update: (id, input) => this.request<ShopierCategory>(`/categories/${pathSegment(id)}`, { method: 'PUT', body: input }),
      delete: async (id) => {
        await this.request<void>(`/categories/${pathSegment(id)}`, { method: 'DELETE' });
      },
    };

    this.discounts = {
      codes: {
        list: (params) => this.request<ShopierDiscountCode[]>('/discounts/codes', { query: params }),
        create: (input, options) => this.request<ShopierDiscountCode>('/discounts/codes', {
          method: 'POST',
          body: input,
          idempotencyKey: options?.idempotencyKey,
        }),
        get: (id) => this.request<ShopierDiscountCode>(`/discounts/codes/${pathSegment(id)}`),
        update: (id, input) => this.request<ShopierDiscountCode>(`/discounts/codes/${pathSegment(id)}`, { method: 'PUT', body: input }),
        delete: async (id) => {
          await this.request<void>(`/discounts/codes/${pathSegment(id)}`, { method: 'DELETE' });
        },
      },
      automatic: {
        list: (params) => this.request<ShopierAutomaticDiscount[]>('/discounts/automatic', { query: params }),
        create: (input, options) => this.request<ShopierAutomaticDiscount>('/discounts/automatic', {
          method: 'POST',
          body: input,
          idempotencyKey: options?.idempotencyKey,
        }),
        get: (id) => this.request<ShopierAutomaticDiscount>(`/discounts/automatic/${pathSegment(id)}`),
        update: (id, input) => this.request<ShopierAutomaticDiscount>(`/discounts/automatic/${pathSegment(id)}`, { method: 'PUT', body: input }),
        delete: async (id) => {
          await this.request<void>(`/discounts/automatic/${pathSegment(id)}`, { method: 'DELETE' });
        },
      },
    };

    this.orders = {
      list: (params) => this.request<ShopierOrder[]>('/orders', { query: requireOrderDateRange(params) }),
      get: (orderId) => this.request<ShopierOrder>(`/orders/${pathSegment(orderId)}`),
      update: (orderId, input) => this.request<ShopierOrder>(`/orders/${pathSegment(orderId)}`, { method: 'PUT', body: input }),
      fulfill: (orderId, input) => this.request<ShopierOrder>(`/orders/${pathSegment(orderId)}`, {
        method: 'PUT',
        body: { fulfillments: input },
      }),
      getTransaction: (orderId) => this.request<ShopierTransaction>(`/orders/transactions/${pathSegment(orderId)}`),
    };

    this.payouts = {
      list: (params) => this.request<ShopierPayout[]>('/payouts', { query: params }),
      get: (payoutId) => this.request<ShopierPayout>(`/payouts/${pathSegment(payoutId)}`),
      transactions: {
        list: (payoutId, params) => this.request<ShopierTransaction[]>(
          `/payouts/transactions/${pathSegment(payoutId)}`,
          { query: params }
        ),
      },
    };

    this.products = {
      list: (params) => this.request<ShopierProduct[]>('/products', { query: params }),
      create: (input, options) => this.request<ShopierProduct>('/products', {
        method: 'POST',
        body: input,
        idempotencyKey: options?.idempotencyKey,
      }),
      get: (id) => this.request<ShopierProduct>(`/products/${pathSegment(id)}`),
      update: (id, input) => this.request<ShopierProduct>(`/products/${pathSegment(id)}`, { method: 'PUT', body: input }),
      delete: async (id) => {
        await this.request<void>(`/products/${pathSegment(id)}`, { method: 'DELETE' });
      },
    };

    this.refunds = {
      list: (params) => this.request<ShopierRefund[]>('/refunds', { query: params }),
      create: (input, options) => this.request<ShopierRefund>('/refunds', {
        method: 'POST',
        body: input,
        idempotencyKey: options?.idempotencyKey,
      }),
      get: (refundId) => this.request<ShopierRefund>(`/refunds/${pathSegment(refundId)}`),
    };

    this.selections = {
      list: (params) => this.request<ShopierSelection[]>('/selections', { query: params }),
      create: (input, options) => this.request<ShopierSelection>('/selections', {
        method: 'POST',
        body: input,
        idempotencyKey: options?.idempotencyKey,
      }),
      get: (id) => this.request<ShopierSelection>(`/selections/${pathSegment(id)}`),
      update: (id, input) => this.request<ShopierSelection>(`/selections/${pathSegment(id)}`, { method: 'PUT', body: input }),
      delete: async (id) => {
        await this.request<void>(`/selections/${pathSegment(id)}`, { method: 'DELETE' });
      },
    };

    this.shippings = {
      list: (params) => this.request<ShopierShipping[]>('/shippings', { query: params }),
      create: (input, options) => this.request<ShopierShipping>('/shippings', {
        method: 'POST',
        body: input,
        idempotencyKey: options?.idempotencyKey,
      }),
      get: (code) => this.request<ShopierShipping>(`/shippings/${pathSegment(code)}`),
      delete: async (code) => {
        await this.request<void>(`/shippings/${pathSegment(code)}`, { method: 'DELETE' });
      },
    };

    this.shop = {
      getOwner: () => this.request<ShopierShopOwner>('/shop/owner'),
      getSettings: () => this.request<ShopierShopSettings>('/shop/settings'),
      updateSettings: (input) => this.request<ShopierShopSettings>('/shop/settings', { method: 'PUT', body: input }),
    };

    this.variations = {
      list: (params) => this.request<ShopierVariation[]>('/variations', { query: params }),
      create: (input, options) => this.request<ShopierVariation>('/variations', {
        method: 'POST',
        body: input,
        idempotencyKey: options?.idempotencyKey,
      }),
      get: (id) => this.request<ShopierVariation>(`/variations/${pathSegment(id)}`),
      update: (id, input) => this.request<ShopierVariation>(`/variations/${pathSegment(id)}`, { method: 'PUT', body: input }),
      delete: async (id) => {
        await this.request<void>(`/variations/${pathSegment(id)}`, { method: 'DELETE' });
      },
    };

    this.webhooks = {
      list: (params) => this.request<ShopierWebhookSubscription[]>('/webhooks', { query: params }),
      create: (input, options) => this.request<ShopierWebhookSubscription>('/webhooks', {
        method: 'POST',
        body: input,
        idempotencyKey: options?.idempotencyKey,
      }),
      delete: async (webhookId) => {
        await this.request<void>(`/webhooks/${pathSegment(webhookId)}`, { method: 'DELETE' });
      },
    };
  }

  getBalance(): Promise<ShopierBalance> {
    return this.balance.get();
  }

  listOrders(params?: ShopierListOrdersParams): Promise<ShopierOrder[]> {
    return this.orders.list(params);
  }

  getOrder(orderId: string): Promise<ShopierOrder> {
    return this.orders.get(orderId);
  }

  fulfillOrder(orderId: string, input: ShopierFulfillmentInput): Promise<ShopierOrder> {
    return this.orders.fulfill(orderId, input);
  }

  listProducts(params?: ShopierListProductsParams): Promise<ShopierProduct[]> {
    return this.products.list(params);
  }

  createProduct(input: ShopierCreateProductInput, options?: ShopierCreateOptions): Promise<ShopierProduct> {
    return this.products.create(input, options);
  }

  getProduct(productId: string): Promise<ShopierProduct> {
    return this.products.get(productId);
  }

  deleteProduct(productId: string): Promise<void> {
    return this.products.delete(productId);
  }

  createRefund(input: ShopierCreateRefundInput, options?: ShopierCreateOptions): Promise<ShopierRefund> {
    return this.refunds.create(input, options);
  }

  listRefunds(params?: ShopierListRefundsParams): Promise<ShopierRefund[]> {
    return this.refunds.list(params);
  }

  createWebhook(input: ShopierCreateWebhookInput, options?: ShopierCreateOptions): Promise<ShopierWebhookSubscription> {
    return this.webhooks.create(input, options);
  }

  async request<T>(path: string, options: ShopierApiRequestOptions = {}): Promise<T> {
    if (!this.fetcher) {
      throw new ShopierFetchUnavailableError(undefined, { runtime: 'fetch_missing' });
    }

    const method = options.method ?? 'GET';
    const url = buildUrl(this.baseUrl, path, options.query);
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.accessToken}`,
      Accept: 'application/json',
      ...options.headers,
    };

    if (options.body !== undefined && headers['Content-Type'] === undefined) {
      headers['Content-Type'] = 'application/json';
    }

    if (options.idempotencyKey && headers['Idempotency-Key'] === undefined) {
      headers['Idempotency-Key'] = options.idempotencyKey;
    }

    const body = options.body === undefined ? undefined : JSON.stringify(options.body);
    const retry: ShopierRetryOptions = { ...this.retry, ...options.retry };
    const maxRetries = Math.max(0, retry.maxRetries ?? DEFAULT_MAX_RETRIES);
    const baseDelayMs = retry.baseDelayMs ?? DEFAULT_RETRY_BASE_DELAY_MS;
    const maxDelayMs = retry.maxDelayMs ?? DEFAULT_RETRY_MAX_DELAY_MS;

    for (let attempt = 1; ; attempt += 1) {
      try {
        return await this.attempt<T>(url, method, headers, body, options.signal);
      } catch (error) {
        if (!(error instanceof ShopierError) || attempt > maxRetries) {
          throw error;
        }

        const reason = failureReason(error);
        const status = numberDetail(error, 'status');

        // A caller cancellation is a decision, not a failure. Never retry it.
        if (reason === 'aborted' || options.signal?.aborted) {
          throw error;
        }

        const retryAfterMs = numberDetail(error, 'retryAfterMs');
        const delayMs = Math.min(
          retryAfterMs ?? backoffDelay(attempt, baseDelayMs, maxDelayMs),
          maxDelayMs
        );
        const context: ShopierRetryContext = {
          attempt,
          maxRetries,
          method,
          path,
          status,
          reason,
          error,
          delayMs,
          retryable: isRetryable(reason, status, method, retry.retryNonIdempotent === true),
        };

        if (!(retry.shouldRetry ? retry.shouldRetry(context) : context.retryable)) {
          throw error;
        }

        retry.onRetry?.(context);
        await sleep(delayMs, options.signal);
      }
    }
  }

  private async attempt<T>(
    url: string,
    method: ShopierHttpMethod,
    headers: Record<string, string>,
    body: string | undefined,
    externalSignal: AbortSignal | undefined
  ): Promise<T> {
    const { signal, cleanup } = createRequestSignal(this.timeoutMs, externalSignal);

    try {
      const response = await this.fetcher!(url, { method, headers, body, signal });
      const responseBody = await readResponseBody(response);

      if (!response.ok) {
        const retryAfterMs = parseRetryAfter(response.headers.get('retry-after'));

        throw createShopierApiError('Shopier API response was not successful', {
          status: response.status,
          statusText: response.statusText,
          body: responseBody,
          reason: 'http',
          ...(retryAfterMs === undefined ? {} : { retryAfterMs }),
        });
      }

      return responseBody as T;
    } catch (error) {
      if (error instanceof ShopierError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        if (externalSignal?.aborted) {
          throw new ShopierApiRequestError('Shopier API request was aborted', {
            reason: 'aborted',
          });
        }

        throw new ShopierApiRequestError('Shopier API request timed out', {
          reason: 'timeout',
          timeoutMs: this.timeoutMs,
        });
      }

      throw new ShopierApiRequestError('Shopier API request failed', {
        reason: 'network',
        cause: error instanceof Error ? error.message : String(error),
      });
    } finally {
      cleanup();
    }
  }
}

/**
 * The default retry policy.
 *
 * 429 is retried for every method: a rate limited request was rejected before
 * it was processed, so repeating it cannot duplicate an effect. Every other
 * retryable failure is gated on idempotency, because a POST that timed out or
 * returned a 500 may still have been applied on Shopier's side.
 * `treatAsIdempotent` lifts that gate only when the caller explicitly opts in
 * via `retryNonIdempotent`.
 *
 * `idempotencyKey` does NOT lift this gate. Verified live against Shopier's
 * API: two identical `products.create()` calls with the same
 * `Idempotency-Key` header created two separate products. Shopier does not
 * deduplicate on it, so it cannot be trusted to make a POST retry safe.
 */
function isRetryable(
  reason: ShopierFailureReason,
  status: number | undefined,
  method: ShopierHttpMethod,
  treatAsIdempotent: boolean
): boolean {
  if (status === 429) {
    return true;
  }

  if (!IDEMPOTENT_METHODS.includes(method) && !treatAsIdempotent) {
    return false;
  }

  if (reason === 'timeout' || reason === 'network') {
    return true;
  }

  return status !== undefined && RETRYABLE_STATUSES.includes(status);
}

function failureReason(error: ShopierError): ShopierFailureReason {
  const reason = error.details?.reason;

  if (reason === 'http' || reason === 'timeout' || reason === 'aborted' || reason === 'network') {
    return reason;
  }

  return typeof error.details?.status === 'number' ? 'http' : 'network';
}

function numberDetail(error: ShopierError, key: string): number | undefined {
  const value = error.details?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/** Exponential backoff with jitter, so retrying clients do not resynchronize. */
function backoffDelay(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  const exponential = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
  return Math.round(exponential * (0.5 + Math.random() * 0.5));
}

/** Accepts both forms RFC 9110 allows for `Retry-After`: seconds, or an HTTP date. */
function parseRetryAfter(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  const seconds = Number(trimmed);

  if (trimmed !== '' && Number.isFinite(seconds)) {
    return seconds > 0 ? seconds * 1000 : 0;
  }

  const timestamp = Date.parse(trimmed);

  if (Number.isNaN(timestamp)) {
    return undefined;
  }

  return Math.max(0, timestamp - Date.now());
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    function onAbort(): void {
      clearTimeout(timer);
      reject(new ShopierApiRequestError('Shopier API request was aborted', { reason: 'aborted' }));
    }

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * Generates a random key suitable for `idempotencyKey` / `ShopierCreateOptions`.
 * Shopier does not deduplicate on this key (verified live), so it is not a
 * retry-safety mechanism — use it for your own request correlation/logging.
 * If you do reuse it across your own retries, call this once per logical
 * operation rather than once per attempt.
 */
export function createIdempotencyKey(): string {
  return randomUUID();
}

function resolveAccessToken(config: ShopierApiConfig): string | undefined {
  const token =
    config.personalAccessToken ??
    config.pat ??
    config.accessToken ??
    process.env.SHOPIER_PAT ??
    process.env.SHOPIER_PERSONAL_ACCESS_TOKEN ??
    process.env.SHOPIER_ACCESS_TOKEN;

  return typeof token === 'string' && token.trim() !== '' ? token.trim() : undefined;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

function buildUrl(baseUrl: string, path: string, query?: ShopierQueryParams): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const queryString = buildQueryString(query);
  return `${baseUrl}${normalizedPath}${queryString}`;
}

function buildQueryString(query?: ShopierQueryParams): string {
  if (!query) {
    return '';
  }

  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(query as Record<string, QueryPrimitive | QueryPrimitive[]>)) {
    const values = Array.isArray(value) ? value : [value];

    for (const item of values) {
      if (item === undefined || item === null) {
        continue;
      }

      search.append(key, item instanceof Date ? item.toISOString() : String(item));
    }
  }

  const serialized = search.toString();
  return serialized ? `?${serialized}` : '';
}

/**
 * Shopier's `GET /orders` returns an empty array, not an error, when neither
 * dateStart nor dateEnd is given - confirmed live, including with other
 * filters set. There is no legitimate reason to omit both, so this fails
 * fast instead of returning a silently useless result.
 */
function requireOrderDateRange(params: ShopierListOrdersParams | undefined): ShopierListOrdersParams | undefined {
  if (!params?.dateStart && !params?.dateEnd) {
    throw new ValidationError(
      'orders.list() requires dateStart and/or dateEnd. Shopier returns an empty array, not an error, ' +
      'when both are omitted, which is easy to mistake for "no orders" rather than "no filter".',
      { field: 'dateStart/dateEnd' }
    );
  }

  return params;
}

function pathSegment(value: string): string {
  if (!value || value.trim() === '') {
    throw new ValidationError('Path parameter is required');
  }

  return encodeURIComponent(value);
}

function createRequestSignal(timeoutMs: number, externalSignal?: AbortSignal): {
  signal?: AbortSignal;
  cleanup: () => void;
} {
  if (timeoutMs <= 0 && !externalSignal) {
    return { signal: undefined, cleanup: () => undefined };
  }

  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const forwardAbort = (): void => controller.abort();

  if (timeoutMs > 0) {
    timeout = setTimeout(forwardAbort, timeoutMs);
  }

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', forwardAbort, { once: true });
    }
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      if (timeout) {
        clearTimeout(timeout);
      }

      // Each retry attempt registers its own listener; without this the
      // caller's signal accumulates one per attempt.
      externalSignal?.removeEventListener('abort', forwardAbort);
    },
  };
}

async function readResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined;
  }

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

import { randomUUID } from 'crypto';
import {
  createShopierApiError,
  ShopierError,
  ShopierFetchUnavailableError,
  ShopierApiRequestError,
  ValidationError,
} from './errors';

const DEFAULT_BASE_URL = 'https://api.shopier.com/v1';
const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_RETRY_BASE_DELAY_MS = 500;
const DEFAULT_RETRY_MAX_DELAY_MS = 8000;

/**
 * Methods that HTTP defines as idempotent. Repeating one of these cannot
 * create a second resource or move money twice, so they are safe to retry
 * after a transport failure or a server error.
 */
const IDEMPOTENT_METHODS: readonly string[] = ['GET', 'PUT', 'DELETE'];

/**
 * Status codes worth retrying for an idempotent request. 429 is handled
 * separately because it is safe for every method.
 */
const RETRYABLE_STATUSES: readonly number[] = [408, 500, 502, 503, 504];

export type ShopierHttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
export type ShopierCurrencyCode = 'TRY' | 'USD' | 'EUR';
export type ShopierSortDirection = 'dateAsc' | 'dateDesc';
export type ShopierProductType = 'physical' | 'digital';
export type ShopierShippingPayer = 'sellerPays' | 'buyerPays';
export type ShopierStockStatus = 'inStock' | 'outOfStock';
export type ShopierShippingCompany =
  | 'yurtici'
  | 'mng'
  | 'ptt'
  | 'aras'
  | 'surat'
  | 'ups'
  | 'fedex'
  | 'dhl'
  | 'tnt'
  | 'pts'
  | 'aramex'
  | 'interGlobal'
  | 'other';
export type ShopierWebhookEventType =
  | 'product.created'
  | 'product.updated'
  | 'order.created'
  | 'order.addressUpdated'
  | 'order.fulfilled'
  | 'refund.requested'
  | 'refund.updated';

type QueryPrimitive = string | number | boolean | Date | null | undefined;
export type ShopierQueryParams = object;

/**
 * Why a request failed, as recorded on `error.details.reason`.
 *
 * - `http` - the API answered with a non-2xx status.
 * - `timeout` - `timeoutMs` elapsed before the response arrived.
 * - `aborted` - the caller's own `AbortSignal` fired. Never retried.
 * - `network` - the fetch call itself rejected (DNS, TLS, socket).
 */
export type ShopierFailureReason = 'http' | 'timeout' | 'aborted' | 'network';

export interface ShopierRetryContext {
  /** 1-based number of the attempt that just failed. */
  attempt: number;
  maxRetries: number;
  method: ShopierHttpMethod;
  path: string;
  /** HTTP status, when the failure came from a response rather than the transport. */
  status?: number;
  reason: ShopierFailureReason;
  error: ShopierError;
  /** The delay the client would wait before the next attempt, in milliseconds. */
  delayMs: number;
  /** The decision the default policy reached, so a custom `shouldRetry` can build on it. */
  retryable: boolean;
}

export interface ShopierRetryOptions {
  /** Retries after the first attempt. Defaults to 2. Set to 0 to disable retrying. */
  maxRetries?: number;
  /** First backoff delay, doubled on each subsequent attempt. Defaults to 500ms. */
  baseDelayMs?: number;
  /**
   * Upper bound for any single wait, including a server-sent `Retry-After`.
   * Defaults to 8000ms. Raise it if your rate limit window is longer.
   */
  maxDelayMs?: number;
  /**
   * Allow retrying POST after a server error or transport failure.
   *
   * Off by default, and deliberately so: a POST that failed may still have
   * been processed, so retrying `refunds.create` or `products.create` can
   * refund twice or create a duplicate. Only enable this when you know the
   * endpoint you are calling is safe to repeat.
   */
  retryNonIdempotent?: boolean;
  /**
   * Replaces the default decision. The attempt budget and caller cancellation
   * are still enforced first, so this is only consulted for failures that
   * still have retries left.
   */
  shouldRetry?: (context: ShopierRetryContext) => boolean;
  /** Called before each wait. Useful for logging and metrics. */
  onRetry?: (context: ShopierRetryContext) => void;
}

export interface ShopierApiConfig {
  personalAccessToken?: string;
  pat?: string;
  accessToken?: string;
  baseUrl?: string;
  fetch?: typeof fetch;
  /** Timeout for a single attempt, not for the retried sequence. Defaults to 15000ms. */
  timeoutMs?: number;
  retry?: ShopierRetryOptions;
}

export interface ShopierApiRequestOptions {
  method?: ShopierHttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  query?: ShopierQueryParams;
  signal?: AbortSignal;
  /** Per-request retry overrides, merged over the client-level options. */
  retry?: ShopierRetryOptions;
  /**
   * Sent as the `Idempotency-Key` header. Shopier does not appear to
   * deduplicate on it (verified live), so it does NOT make a POST eligible
   * for retry by itself. See `ShopierCreateOptions`.
   */
  idempotencyKey?: string;
}

export interface ShopierApiErrorBody {
  status: number;
  statusText: string;
  body?: unknown;
}

export interface ShopierApiResource {
  [key: string]: unknown;
}

export interface ShopierListParams {
  limit?: number;
  page?: number;
  sort?: ShopierSortDirection;
}

export interface ShopierDateRangeParams extends ShopierListParams {
  dateStart?: string;
  dateEnd?: string;
}

export interface ShopierBalance extends ShopierApiResource {
  currency?: ShopierCurrencyCode;
  total?: string;
  available?: string;
  unavailable?: string;
}

export interface ShopierTransaction extends ShopierApiResource {
  id?: string;
  orderId?: string;
  dateCreated?: string;
  type?: string;
  amount?: string;
  currency?: ShopierCurrencyCode;
}

export interface ShopierCategory extends ShopierApiResource {
  id: string;
  title: string;
  placement?: number;
}

export interface ShopierCategoryInput {
  title: string;
  placement?: number;
}

export interface ShopierCategoryUpdateInput {
  title?: string;
  placement?: number;
}

export type ShopierDiscountType = 'amount' | 'percent';
export type ShopierAutomaticDiscountScope = 'all' | 'selectedProducts' | 'selectedCategories';
export type ShopierAutomaticDiscountRequirement = 'amount' | 'quantity';

export interface ShopierDiscountCode extends ShopierApiResource {
  id: string;
  code: string;
  dateCreated?: string;
  type: ShopierDiscountType;
  amountOff?: string;
  percentOff?: string;
  amountMinimum: string;
  currency: ShopierCurrencyCode;
  numAvailable: number;
  numUsed?: number;
  expiresAt: string;
}

export interface ShopierCreateDiscountCodeInput {
  code: string;
  type: ShopierDiscountType;
  amountOff?: string;
  percentOff?: string;
  amountMinimum: string;
  currency: ShopierCurrencyCode;
  numAvailable: number;
  expiresAt: string;
}

export interface ShopierUpdateDiscountCodeInput {
  numAvailable?: number;
  expiresAt?: string;
}

export interface ShopierAutomaticDiscount extends ShopierApiResource {
  id: string;
  title: string;
  scope: ShopierAutomaticDiscountScope;
  productIds?: string[];
  categoryIds?: string[];
  dateCreated?: string;
  type: ShopierDiscountType;
  amountOff?: string;
  percentOff?: string;
  requirement: ShopierAutomaticDiscountRequirement;
  amountMinimum?: string;
  quantityMinimum?: number;
  currency: ShopierCurrencyCode;
  startsAt: string;
  expiresAt: string;
}

export interface ShopierCreateAutomaticDiscountInput {
  title: string;
  scope: ShopierAutomaticDiscountScope;
  productIds?: string[];
  categoryIds?: string[];
  type: ShopierDiscountType;
  amountOff?: string;
  percentOff?: string;
  currency: ShopierCurrencyCode;
  requirement: ShopierAutomaticDiscountRequirement;
  amountMinimum?: string;
  quantityMinimum?: number;
  startsAt: string;
  expiresAt: string;
}

export interface ShopierUpdateAutomaticDiscountInput {
  startsAt?: string;
  expiresAt?: string;
}

export interface ShopierAddressInfo extends ShopierApiResource {
  firstName?: string;
  lastName?: string;
  nationalId?: string;
  email?: string;
  phone?: string;
  company?: string;
  taxOffice?: string;
  taxNumber?: string;
  address?: string;
  district?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

export interface ShopierOrderTotals {
  subtotal?: string;
  shipping?: string;
  discount?: string;
  total?: string;
}

export interface ShopierOrderLineItem extends ShopierApiResource {
  productId?: string;
  title?: string;
  type?: ShopierProductType;
  selection?: Array<{ id?: string; title?: string; variationTitle?: string }>;
  options?: Array<{ id?: string; title?: string }>;
  quantity?: number;
  price?: string;
  total?: string;
}

export interface ShopierOrder extends ShopierApiResource {
  id: string;
  status?: 'fulfilled' | 'unfulfilled';
  paymentStatus?: 'paid' | 'unpaid';
  installments?: boolean;
  dateCreated?: string;
  currency?: ShopierCurrencyCode;
  paymentMethod?: 'debitCard' | 'creditCard';
  totals?: ShopierOrderTotals;
  discounts?: Array<{ id?: string; method?: 'discountCode' | 'automaticDiscount' }>;
  shippingInfo?: ShopierAddressInfo;
  billingInfo?: ShopierAddressInfo;
  note?: string;
  lineItems?: ShopierOrderLineItem[];
  fulfillments?: ShopierShipping[];
  returns?: ShopierShipping[];
  refunds?: Array<Pick<ShopierRefund, 'id' | 'type' | 'status' | 'dateCreated' | 'dateRefunded' | 'total'>>;
}

export interface ShopierListOrdersParams extends ShopierDateRangeParams {
  fulfillmentStatus?: 'unfulfilled' | 'fulfilled';
  refundType?: 'none' | 'partial' | 'full';
  customerEmail?: string;
  customerPhone?: string;
  productId?: string;
}

export interface ShopierFulfillmentInput {
  productType?: ShopierProductType;
  shippingCompany?: ShopierShippingCompany;
  trackingNumber?: string;
  note?: string;
}

export interface ShopierUpdateOrderInput {
  fulfillments?: ShopierFulfillmentInput;
  shippingInfo?: ShopierAddressInfo;
}

export interface ShopierPayout extends ShopierApiResource {
  id: string;
  status?: string;
  dateCreated?: string;
  datePaid?: string;
  total?: string;
  currency?: ShopierCurrencyCode;
}

export interface ShopierProductMedia {
  type: 'image';
  url: string;
  placement: 1 | 2 | 3 | 4 | 5;
}

export interface ShopierProductMediaResult {
  type: 'image';
  url: string;
  id?: string;
  placement: number;
}

export interface ShopierProductPriceData {
  currency: ShopierCurrencyCode;
  price: string;
  discount?: boolean;
  discountedPrice?: string;
  shippingPrice?: string;
}

export interface ShopierProductVariantInput {
  selectionId?: string[];
  stockQuantity?: number;
  media?: Array<{
    type: 'image';
    url: string;
  }>;
  priceData?: Pick<ShopierProductPriceData, 'currency' | 'price'>;
  primary?: boolean;
}

export interface ShopierProductOptionInput {
  optionId?: string;
  optionTitle?: string;
  optionPrice?: string;
}

export interface ShopierCreateProductInput {
  title: string;
  description?: string;
  type: ShopierProductType;
  media: ShopierProductMedia[];
  priceData: ShopierProductPriceData;
  stockQuantity?: number;
  shippingPayer: ShopierShippingPayer;
  categories?: Array<{ categoryId: string }>;
  variants?: ShopierProductVariantInput[];
  options?: ShopierProductOptionInput[];
  singleOption?: boolean;
  customListing?: boolean;
  customNote?: string;
  placementScore?: number;
  dispatchDuration?: 1 | 2 | 3;
}

export type ShopierUpdateProductInput = Partial<ShopierCreateProductInput>;

export interface ShopierProduct extends ShopierApiResource {
  id: string;
  title: string;
  description?: string;
  type: ShopierProductType;
  dateCreated?: string;
  dateUpdated?: string;
  url?: string;
  media?: ShopierProductMediaResult[];
  priceData?: ShopierProductPriceData;
  stockStatus?: ShopierStockStatus;
  stockQuantity?: number;
  shippingPayer?: ShopierShippingPayer;
  categories?: Array<{ id?: string; title?: string }>;
  variants?: Array<ShopierApiResource>;
  options?: Array<{ id?: string; title?: string; price?: string }>;
  singleOption?: boolean;
  customListing?: boolean;
  customNote?: string;
  placementScore?: number;
  dispatchDuration?: number;
}

export interface ShopierListProductsParams extends ShopierDateRangeParams {
  productType?: ShopierProductType;
  shippingPayer?: ShopierShippingPayer;
  stockStatus?: ShopierStockStatus;
  categoryId?: string;
  selectionId?: string;
  discount?: boolean;
  customListing?: boolean;
}

export interface ShopierRefund extends ShopierApiResource {
  id: string;
  type?: 'full' | 'partial';
  status?: 'pending' | 'failed' | 'succeeded';
  orderId?: string;
  dateCreated?: string;
  dateRefunded?: string;
  currency?: ShopierCurrencyCode;
  total?: string;
  note?: string;
}

export interface ShopierCreateRefundInput {
  orderId: string;
  amount: string;
  note?: string;
}

export interface ShopierListRefundsParams extends ShopierDateRangeParams {
  orderId?: string;
  status?: 'pending' | 'failed' | 'succeeded';
}

export interface ShopierSelection extends ShopierApiResource {
  id: string;
  variationId?: string;
  title: string;
}

export interface ShopierCreateSelectionInput {
  variationId: string;
  title: string;
}

export interface ShopierUpdateSelectionInput {
  title?: string;
}

export interface ShopierListSelectionsParams {
  variationId?: string;
  limit?: number;
  page?: number;
}

export interface ShopierShipping extends ShopierApiResource {
  orderId?: string;
  status?: 'shipped' | 'notShipped';
  method?: 'standard' | 'contracted';
  type?: 'firstShipment' | 'secondShipment' | 'returnShipment';
  dateCreated?: string;
  dateDispatched?: string;
  company?: ShopierShippingCompany;
  code?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  size?: string;
  sizeUnit?: 'deci';
  weight?: string;
  weightUnit?: 'gram' | 'kilogram';
  cost?: string;
  currency?: ShopierCurrencyCode;
}

export interface ShopierCreateShippingInput {
  orderId: string;
  company: ShopierShippingCompany;
  type?: 'firstShipment' | 'secondShipment' | 'returnShipment';
}

export interface ShopierListShippingsParams extends ShopierListParams {
  status?: 'shipped' | 'notShipped';
  type?: 'firstShipment' | 'secondShipment' | 'returnShipment';
  company?: ShopierShippingCompany;
  dateCreatedStart?: string;
  dateCreatedEnd?: string;
  dateDispatchedStart?: string;
  dateDispatchedEnd?: string;
}

export interface ShopierShopOwner extends ShopierApiResource {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface ShopierShopSettings extends ShopierApiResource {
  title?: string;
  slogan?: string;
  announcement?: string;
  confirmation?: string;
  email?: string;
  phone?: string;
  access?: boolean;
  cart?: boolean;
  mobileView?: string;
  filter?: boolean;
  stockOutProducts?: boolean;
  language?: string;
  vacation?: boolean;
}

export type ShopierUpdateShopSettingsInput = ShopierShopSettings;

export interface ShopierVariation extends ShopierApiResource {
  id: string;
  title: string;
}

export interface ShopierCreateVariationInput {
  title: string;
}

export interface ShopierUpdateVariationInput {
  title?: string;
}

export interface ShopierWebhookSubscription extends ShopierApiResource {
  id: string;
  event: ShopierWebhookEventType;
  url: string;
  token?: string;
}

export interface ShopierCreateWebhookInput {
  event: ShopierWebhookEventType;
  url: string;
}

export interface ShopierBalanceApi {
  get: () => Promise<ShopierBalance>;
  transactions: {
    list: (params?: ShopierDateRangeParams) => Promise<ShopierTransaction[]>;
    get: (orderId: string) => Promise<ShopierTransaction>;
  };
}

/**
 * Options for a create call. `idempotencyKey` is sent as the `Idempotency-Key`
 * header, but does NOT make the call safe to retry: tested live against
 * Shopier's API, two identical create calls with the same key produced two
 * separate resources, so Shopier does not deduplicate on it. Use it for your
 * own request tracing/correlation, not as a retry-safety mechanism. This
 * client never retries POST on the strength of a supplied key alone; use
 * `retry: { retryNonIdempotent: true }` if you've independently confirmed a
 * specific endpoint is safe to repeat. See `createIdempotencyKey()`.
 */
export interface ShopierCreateOptions {
  idempotencyKey?: string;
}

export interface ShopierCrudApi<T, CreateInput, UpdateInput, ListParams = ShopierListParams> {
  list: (params?: ListParams) => Promise<T[]>;
  create: (input: CreateInput, options?: ShopierCreateOptions) => Promise<T>;
  get: (id: string) => Promise<T>;
  update: (id: string, input: UpdateInput) => Promise<T>;
  delete: (id: string) => Promise<void>;
}

export interface ShopierDiscountsApi {
  codes: ShopierCrudApi<
    ShopierDiscountCode,
    ShopierCreateDiscountCodeInput,
    ShopierUpdateDiscountCodeInput
  >;
  automatic: ShopierCrudApi<
    ShopierAutomaticDiscount,
    ShopierCreateAutomaticDiscountInput,
    ShopierUpdateAutomaticDiscountInput
  >;
}

export interface ShopierOrdersApi {
  list: (params?: ShopierListOrdersParams) => Promise<ShopierOrder[]>;
  get: (orderId: string) => Promise<ShopierOrder>;
  update: (orderId: string, input: ShopierUpdateOrderInput) => Promise<ShopierOrder>;
  fulfill: (orderId: string, input: ShopierFulfillmentInput) => Promise<ShopierOrder>;
  getTransaction: (orderId: string) => Promise<ShopierTransaction>;
}

export interface ShopierPayoutsApi {
  list: (params?: ShopierDateRangeParams) => Promise<ShopierPayout[]>;
  get: (payoutId: string) => Promise<ShopierPayout>;
  transactions: {
    list: (payoutId: string, params?: ShopierListParams) => Promise<ShopierTransaction[]>;
  };
}

export interface ShopierProductsApi extends ShopierCrudApi<
  ShopierProduct,
  ShopierCreateProductInput,
  ShopierUpdateProductInput,
  ShopierListProductsParams
> {}

export interface ShopierRefundsApi {
  list: (params?: ShopierListRefundsParams) => Promise<ShopierRefund[]>;
  create: (input: ShopierCreateRefundInput, options?: ShopierCreateOptions) => Promise<ShopierRefund>;
  get: (refundId: string) => Promise<ShopierRefund>;
}

export interface ShopierShippingsApi {
  list: (params?: ShopierListShippingsParams) => Promise<ShopierShipping[]>;
  create: (input: ShopierCreateShippingInput, options?: ShopierCreateOptions) => Promise<ShopierShipping>;
  get: (code: string) => Promise<ShopierShipping>;
  delete: (code: string) => Promise<void>;
}

export interface ShopierShopApi {
  getOwner: () => Promise<ShopierShopOwner>;
  getSettings: () => Promise<ShopierShopSettings>;
  updateSettings: (input: ShopierUpdateShopSettingsInput) => Promise<ShopierShopSettings>;
}

export interface ShopierWebhooksApi {
  list: (params?: ShopierListParams) => Promise<ShopierWebhookSubscription[]>;
  create: (input: ShopierCreateWebhookInput, options?: ShopierCreateOptions) => Promise<ShopierWebhookSubscription>;
  delete: (webhookId: string) => Promise<void>;
}

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

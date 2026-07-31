import { ShopierError } from '../errors';

export const DEFAULT_BASE_URL = 'https://api.shopier.com/v1';
export const DEFAULT_TIMEOUT_MS = 15000;
export const DEFAULT_MAX_RETRIES = 2;
export const DEFAULT_RETRY_BASE_DELAY_MS = 500;
export const DEFAULT_RETRY_MAX_DELAY_MS = 8000;

/**
 * Methods that HTTP defines as idempotent. Repeating one of these cannot
 * create a second resource or move money twice, so they are safe to retry
 * after a transport failure or a server error.
 */
export const IDEMPOTENT_METHODS: readonly string[] = ['GET', 'PUT', 'DELETE'];

/**
 * Status codes worth retrying for an idempotent request. 429 is handled
 * separately because it is safe for every method.
 */
export const RETRYABLE_STATUSES: readonly number[] = [408, 500, 502, 503, 504];

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

export type QueryPrimitive = string | number | boolean | Date | null | undefined;
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


import {
  createShopierApiError,
  ShopierError,
  ShopierFetchUnavailableError,
  ShopierApiRequestError,
  ValidationError,
} from './errors';

const DEFAULT_BASE_URL = 'https://api.shopier.com/v1';
const DEFAULT_TIMEOUT_MS = 15000;

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

export interface ShopierApiConfig {
  personalAccessToken?: string;
  pat?: string;
  accessToken?: string;
  baseUrl?: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
}

export interface ShopierApiRequestOptions {
  method?: ShopierHttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  query?: ShopierQueryParams;
  signal?: AbortSignal;
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

export interface ShopierCrudApi<T, CreateInput, UpdateInput, ListParams = ShopierListParams> {
  list: (params?: ListParams) => Promise<T[]>;
  create: (input: CreateInput) => Promise<T>;
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
  create: (input: ShopierCreateRefundInput) => Promise<ShopierRefund>;
  get: (refundId: string) => Promise<ShopierRefund>;
}

export interface ShopierShippingsApi {
  list: (params?: ShopierListShippingsParams) => Promise<ShopierShipping[]>;
  create: (input: ShopierCreateShippingInput) => Promise<ShopierShipping>;
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
  create: (input: ShopierCreateWebhookInput) => Promise<ShopierWebhookSubscription>;
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

    this.balance = {
      get: () => this.request<ShopierBalance>('/balance'),
      transactions: {
        list: (params) => this.request<ShopierTransaction[]>('/balance/transactions', { query: params }),
        get: (orderId) => this.request<ShopierTransaction>(`/balance/transactions/${pathSegment(orderId)}`),
      },
    };

    this.categories = {
      list: (params) => this.request<ShopierCategory[]>('/categories', { query: params }),
      create: (input) => this.request<ShopierCategory>('/categories', { method: 'POST', body: input }),
      get: (id) => this.request<ShopierCategory>(`/categories/${pathSegment(id)}`),
      update: (id, input) => this.request<ShopierCategory>(`/categories/${pathSegment(id)}`, { method: 'PUT', body: input }),
      delete: async (id) => {
        await this.request<void>(`/categories/${pathSegment(id)}`, { method: 'DELETE' });
      },
    };

    this.discounts = {
      codes: {
        list: (params) => this.request<ShopierDiscountCode[]>('/discounts/codes', { query: params }),
        create: (input) => this.request<ShopierDiscountCode>('/discounts/codes', { method: 'POST', body: input }),
        get: (id) => this.request<ShopierDiscountCode>(`/discounts/codes/${pathSegment(id)}`),
        update: (id, input) => this.request<ShopierDiscountCode>(`/discounts/codes/${pathSegment(id)}`, { method: 'PUT', body: input }),
        delete: async (id) => {
          await this.request<void>(`/discounts/codes/${pathSegment(id)}`, { method: 'DELETE' });
        },
      },
      automatic: {
        list: (params) => this.request<ShopierAutomaticDiscount[]>('/discounts/automatic', { query: params }),
        create: (input) => this.request<ShopierAutomaticDiscount>('/discounts/automatic', { method: 'POST', body: input }),
        get: (id) => this.request<ShopierAutomaticDiscount>(`/discounts/automatic/${pathSegment(id)}`),
        update: (id, input) => this.request<ShopierAutomaticDiscount>(`/discounts/automatic/${pathSegment(id)}`, { method: 'PUT', body: input }),
        delete: async (id) => {
          await this.request<void>(`/discounts/automatic/${pathSegment(id)}`, { method: 'DELETE' });
        },
      },
    };

    this.orders = {
      list: (params) => this.request<ShopierOrder[]>('/orders', { query: params }),
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
      create: (input) => this.request<ShopierProduct>('/products', { method: 'POST', body: input }),
      get: (id) => this.request<ShopierProduct>(`/products/${pathSegment(id)}`),
      update: (id, input) => this.request<ShopierProduct>(`/products/${pathSegment(id)}`, { method: 'PUT', body: input }),
      delete: async (id) => {
        await this.request<void>(`/products/${pathSegment(id)}`, { method: 'DELETE' });
      },
    };

    this.refunds = {
      list: (params) => this.request<ShopierRefund[]>('/refunds', { query: params }),
      create: (input) => this.request<ShopierRefund>('/refunds', { method: 'POST', body: input }),
      get: (refundId) => this.request<ShopierRefund>(`/refunds/${pathSegment(refundId)}`),
    };

    this.selections = {
      list: (params) => this.request<ShopierSelection[]>('/selections', { query: params }),
      create: (input) => this.request<ShopierSelection>('/selections', { method: 'POST', body: input }),
      get: (id) => this.request<ShopierSelection>(`/selections/${pathSegment(id)}`),
      update: (id, input) => this.request<ShopierSelection>(`/selections/${pathSegment(id)}`, { method: 'PUT', body: input }),
      delete: async (id) => {
        await this.request<void>(`/selections/${pathSegment(id)}`, { method: 'DELETE' });
      },
    };

    this.shippings = {
      list: (params) => this.request<ShopierShipping[]>('/shippings', { query: params }),
      create: (input) => this.request<ShopierShipping>('/shippings', { method: 'POST', body: input }),
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
      list: () => this.request<ShopierVariation[]>('/variations'),
      create: (input) => this.request<ShopierVariation>('/variations', { method: 'POST', body: input }),
      get: (id) => this.request<ShopierVariation>(`/variations/${pathSegment(id)}`),
      update: (id, input) => this.request<ShopierVariation>(`/variations/${pathSegment(id)}`, { method: 'PUT', body: input }),
      delete: async (id) => {
        await this.request<void>(`/variations/${pathSegment(id)}`, { method: 'DELETE' });
      },
    };

    this.webhooks = {
      list: (params) => this.request<ShopierWebhookSubscription[]>('/webhooks', { query: params }),
      create: (input) => this.request<ShopierWebhookSubscription>('/webhooks', { method: 'POST', body: input }),
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

  createProduct(input: ShopierCreateProductInput): Promise<ShopierProduct> {
    return this.products.create(input);
  }

  getProduct(productId: string): Promise<ShopierProduct> {
    return this.products.get(productId);
  }

  deleteProduct(productId: string): Promise<void> {
    return this.products.delete(productId);
  }

  createRefund(input: ShopierCreateRefundInput): Promise<ShopierRefund> {
    return this.refunds.create(input);
  }

  listRefunds(params?: ShopierListRefundsParams): Promise<ShopierRefund[]> {
    return this.refunds.list(params);
  }

  createWebhook(input: ShopierCreateWebhookInput): Promise<ShopierWebhookSubscription> {
    return this.webhooks.create(input);
  }

  async request<T>(path: string, options: ShopierApiRequestOptions = {}): Promise<T> {
    if (!this.fetcher) {
      throw new ShopierFetchUnavailableError(undefined, { runtime: 'fetch_missing' });
    }

    const { signal, cleanup } = createRequestSignal(this.timeoutMs, options.signal);
    const url = buildUrl(this.baseUrl, path, options.query);
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.accessToken}`,
      Accept: 'application/json',
      ...options.headers,
    };

    if (options.body !== undefined && headers['Content-Type'] === undefined) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await this.fetcher(url, {
        method: options.method ?? 'GET',
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal,
      });

      const body = await readResponseBody(response);

      if (!response.ok) {
        throw createShopierApiError('Shopier API response was not successful', {
          status: response.status,
          statusText: response.statusText,
          body,
        });
      }

      return body as T;
    } catch (error) {
      if (error instanceof ShopierError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new ShopierApiRequestError('Shopier API request timed out', {
          timeoutMs: this.timeoutMs,
        });
      }

      throw new ShopierApiRequestError('Shopier API request failed', {
        cause: error instanceof Error ? error.message : String(error),
      });
    } finally {
      cleanup();
    }
  }
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

  if (timeoutMs > 0) {
    timeout = setTimeout(() => controller.abort(), timeoutMs);
  }

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      if (timeout) {
        clearTimeout(timeout);
      }
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

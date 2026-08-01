import {
  ShopierApiClient,
  ShopierApiConfig,
  ShopierCreateProductInput,
  ShopierCurrencyCode,
  ShopierOrder,
  ShopierOrderLineItem,
  ShopierProduct,
  ShopierProductMedia,
  ShopierProductOptionInput,
  ShopierProductType,
  ShopierProductVariantInput,
  ShopierShippingPayer,
} from './api';
import { ValidationError } from './errors';
import { escapeHtml } from './utils';
import {
  ShopierWebhookEvent,
  WebhookHeadersInput,
  verifyAndParseWebhook,
} from './webhooks';

export interface ShopierPaymentFlowConfig {
  client?: ShopierApiClient;
  api?: ShopierApiConfig;
  webhookToken?: string;
  shopSlug?: string;
  defaultImageUrl?: string;
  autoDeleteProduct?: boolean;
}

export interface CreatePaymentLinkOptions {
  title: string;
  amount: number | string;
  currency?: ShopierCurrencyCode;
  description?: string;
  imageUrl?: string;
  media?: ShopierProductMedia[];
  productType?: ShopierProductType;
  shippingPayer?: ShopierShippingPayer;
  stockQuantity?: number;
  customListing?: boolean;
  customNote?: string;
  categories?: Array<{ categoryId: string }>;
  variants?: ShopierProductVariantInput[];
  options?: ShopierProductOptionInput[];
  singleOption?: boolean;
  placementScore?: number;
  dispatchDuration?: 1 | 2 | 3;
  orderId?: string;
  hostedCheckout?: boolean;
  /**
   * @deprecated Use hostedCheckout instead.
   */
  fastPay?: boolean;
  shopSlug?: string;
}

export interface PaymentLinkResult {
  productId: string;
  paymentUrl: string;
  product: ShopierProduct;
  productInput: ShopierCreateProductInput;
  orderId?: string;
  checkoutHtml?: string;
  hostedCheckoutHtml?: string;
  /**
   * @deprecated Use hostedCheckoutHtml instead.
   */
  fastPayHtml?: string;
}

export interface CreateEphemeralPaymentOptions extends CreatePaymentLinkOptions {
  ttlMs?: number;
  expiresAt?: Date | string;
}

export interface EphemeralPaymentResult extends PaymentLinkResult {
  ephemeral: true;
  createdAt: string;
  expiresAt?: string;
  productIds: string[];
  cleanup: () => Promise<void>;
  deleteProduct: () => Promise<void>;
}

export interface HandlePaymentWebhookOptions {
  webhookToken?: string;
  autoDeleteProduct?: boolean;
}

export interface PaymentCompletedInfo {
  event: ShopierWebhookEvent<ShopierOrder>;
  order: ShopierOrder;
  productId: string;
  lineItem: ShopierOrderLineItem;
}

export interface HandlePaymentWebhookResult {
  event: ShopierWebhookEvent<ShopierOrder>;
  processed: boolean;
  productIds: string[];
}

export type PaymentCompletedHandler = (info: PaymentCompletedInfo) => void | Promise<void>;

export class ShopierPaymentFlow {
  private readonly client: ShopierApiClient;
  private readonly webhookToken?: string;
  private readonly shopSlug?: string;
  private readonly defaultImageUrl?: string;
  private readonly autoDeleteProduct: boolean;

  constructor(config: ShopierPaymentFlowConfig | ShopierApiClient = {}) {
    if (config instanceof ShopierApiClient) {
      this.client = config;
      this.autoDeleteProduct = true;
      return;
    }

    this.client = config.client ?? new ShopierApiClient(config.api ?? {});
    this.webhookToken = config.webhookToken;
    this.shopSlug = config.shopSlug;
    this.defaultImageUrl = config.defaultImageUrl;
    this.autoDeleteProduct = config.autoDeleteProduct ?? true;
  }

  async create(options: CreatePaymentLinkOptions): Promise<PaymentLinkResult> {
    return this.createPaymentLink(options);
  }

  async createPaymentLink(options: CreatePaymentLinkOptions): Promise<PaymentLinkResult> {
    const hostedCheckout = shouldBuildHostedCheckout(options);
    const productInput = this.buildProductInput(options);
    const shopSlug = hostedCheckout ? requireShopSlug(options.shopSlug ?? this.shopSlug) : undefined;
    const product = await this.client.products.create(productInput);

    if (!product.id) {
      throw new ValidationError('Shopier product response did not include an id');
    }

    if (!product.url) {
      throw new ValidationError('Shopier product response did not include a payment URL');
    }

    const checkoutHtml = hostedCheckout ? buildHostedCheckoutHtml({
      productId: product.id,
      shopSlug: shopSlug as string,
    }) : undefined;

    return {
      productId: product.id,
      paymentUrl: product.url,
      product,
      productInput,
      orderId: options.orderId,
      checkoutHtml,
      hostedCheckoutHtml: checkoutHtml,
      fastPayHtml: checkoutHtml,
    };
  }

  async createEphemeralPayment(options: CreateEphemeralPaymentOptions): Promise<EphemeralPaymentResult> {
    const createdAt = new Date();
    const result = await this.createPaymentLink(options);
    let cleaned = false;

    const cleanup = async () => {
      if (cleaned) {
        return;
      }

      await this.client.products.delete(result.productId);
      cleaned = true;
    };

    return {
      ...result,
      ephemeral: true,
      createdAt: createdAt.toISOString(),
      expiresAt: resolveExpiresAt(options, createdAt),
      productIds: [result.productId],
      cleanup,
      deleteProduct: cleanup,
    };
  }

  buildProductInput(options: CreatePaymentLinkOptions): ShopierCreateProductInput {
    const title = requiredText(options.title, 'title');
    const media = resolveMedia(options, this.defaultImageUrl);

    return {
      title,
      description: options.description ?? title,
      type: options.productType ?? 'digital',
      shippingPayer: options.shippingPayer ?? 'sellerPays',
      priceData: {
        currency: options.currency ?? 'TRY',
        price: formatAmount(options.amount),
      },
      media,
      stockQuantity: options.stockQuantity ?? 1,
      customListing: options.customListing ?? true,
      ...(options.customNote ? { customNote: options.customNote } : {}),
      ...(options.categories ? { categories: options.categories } : {}),
      ...(options.variants ? { variants: options.variants } : {}),
      ...(options.options ? { options: options.options } : {}),
      ...(options.singleOption !== undefined ? { singleOption: options.singleOption } : {}),
      ...(options.placementScore !== undefined ? { placementScore: options.placementScore } : {}),
      ...(options.dispatchDuration !== undefined ? { dispatchDuration: options.dispatchDuration } : {}),
    };
  }

  async handleWebhookPayload(
    rawBody: string | Buffer | ArrayBuffer,
    headers: WebhookHeadersInput,
    onPayment: PaymentCompletedHandler,
    options: HandlePaymentWebhookOptions = {}
  ): Promise<HandlePaymentWebhookResult> {
    const event = verifyAndParseWebhook<ShopierOrder>({
      body: rawBody,
      headers,
      webhookToken: options.webhookToken ?? this.webhookToken,
    });

    if (event.type !== 'order.created') {
      return {
        event,
        processed: false,
        productIds: [],
      };
    }

    const productIds: string[] = [];
    const order = event.data;

    for (const lineItem of order.lineItems ?? []) {
      if (!lineItem.productId) {
        continue;
      }

      productIds.push(lineItem.productId);
      await onPayment({
        event,
        order,
        productId: lineItem.productId,
        lineItem,
      });

      if (options.autoDeleteProduct ?? this.autoDeleteProduct) {
        await this.client.products.delete(lineItem.productId);
      }
    }

    return {
      event,
      processed: productIds.length > 0,
      productIds,
    };
  }

  async cleanupProducts(products: string | string[] | PaymentLinkResult | HandlePaymentWebhookResult): Promise<string[]> {
    const productIds = normalizeProductIds(products);

    // Limit concurrency to avoid hitting rate limits, using simple chunks of 5
    const chunkSize = 5;
    for (let i = 0; i < productIds.length; i += chunkSize) {
      const chunk = productIds.slice(i, i + chunkSize);
      await Promise.all(chunk.map(productId => this.client.products.delete(productId)));
    }

    return productIds;
  }
}

export interface BuildHostedCheckoutHtmlOptions {
  productId: string;
  shopSlug: string;
  quantity?: number;
}

export type BuildFastPayHtmlOptions = BuildHostedCheckoutHtmlOptions;

export function buildHostedCheckoutHtml(options: BuildHostedCheckoutHtmlOptions): string {
  const productId = requiredText(options.productId, 'productId');
  const shopSlug = requiredText(options.shopSlug, 'shopSlug');
  const quantity = options.quantity ?? 1;

  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new ValidationError('quantity must be a positive integer');
  }

  const escapedProductId = escapeHtml(productId);
  const escapedShopSlug = escapeHtml(encodeURIComponent(shopSlug));

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Shopier checkout yonlendirmesi</title>
</head>
<body>
  <form id="shopier-hosted-checkout" method="POST" action="https://www.shopier.com/s/shipping/${escapedShopSlug}">
    <input type="hidden" name="product_id" value="${escapedProductId}">
    <input type="hidden" name="quantity" value="${quantity}">
    <noscript>
      <button type="submit">Odemeye devam et</button>
    </noscript>
  </form>
  <script>
    document.getElementById('shopier-hosted-checkout').submit();
  </script>
</body>
</html>`;
}

/**
 * @deprecated Use buildHostedCheckoutHtml instead.
 */
export function buildFastPayHtml(options: BuildFastPayHtmlOptions): string {
  return buildHostedCheckoutHtml(options);
}

function resolveMedia(
  options: CreatePaymentLinkOptions,
  defaultImageUrl?: string
): ShopierProductMedia[] {
  if (options.media && options.media.length > 0) {
    return options.media;
  }

  const imageUrl = options.imageUrl ?? defaultImageUrl;

  if (!imageUrl) {
    throw new ValidationError('imageUrl or media is required for Shopier product payment links');
  }

  return [{
    type: 'image',
    url: imageUrl,
    placement: 1,
  }];
}

function formatAmount(amount: number | string): string {
  const raw = typeof amount === 'number' ? amount : Number(amount.trim().replace(',', '.'));

  if (!Number.isFinite(raw) || raw <= 0) {
    throw new ValidationError('amount must be a positive number');
  }

  return raw.toFixed(2);
}

function requiredText(value: string | undefined, field: string): string {
  if (!value || value.trim() === '') {
    throw new ValidationError(`${field} is required`);
  }

  return value.trim();
}

function shouldBuildHostedCheckout(options: CreatePaymentLinkOptions): boolean {
  return options.hostedCheckout ?? options.fastPay ?? false;
}

function resolveExpiresAt(options: CreateEphemeralPaymentOptions, createdAt: Date): string | undefined {
  if (options.expiresAt instanceof Date) {
    return options.expiresAt.toISOString();
  }

  if (typeof options.expiresAt === 'string' && options.expiresAt.trim() !== '') {
    return new Date(options.expiresAt).toISOString();
  }

  if (options.ttlMs !== undefined) {
    if (!Number.isFinite(options.ttlMs) || options.ttlMs <= 0) {
      throw new ValidationError('ttlMs must be a positive number');
    }

    return new Date(createdAt.getTime() + options.ttlMs).toISOString();
  }

  return undefined;
}

function normalizeProductIds(products: string | string[] | PaymentLinkResult | HandlePaymentWebhookResult): string[] {
  if (typeof products === 'string') {
    return [requiredText(products, 'productId')];
  }

  if (Array.isArray(products)) {
    return products.map((productId) => requiredText(productId, 'productId'));
  }

  if ('productIds' in products) {
    return products.productIds.map((productId) => requiredText(productId, 'productId'));
  }

  return [requiredText(products.productId, 'productId')];
}

function requireShopSlug(shopSlug: string | undefined): string {
  if (!shopSlug || shopSlug.trim() === '') {
    throw new ValidationError('shopSlug is required when hostedCheckout is enabled');
  }

  return shopSlug.trim();
}

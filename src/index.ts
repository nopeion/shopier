/**
 * Shopier SDK - TypeScript SDK for Shopier Payment Integration
 *
 * This is the main entry point for the SDK.
 * All public APIs are exported from this file.
 *
 * @packageDocumentation
 */

export { ShopierOsbClient, verifyOsb, parseOsbPayload, handleOsb } from './osb';
export { ShopierApiClient, createIdempotencyKey } from './api';
export { verifyWebhook, parseWebhookEvent, verifyAndParseWebhook, ShopierWebhookVerifier, ShopierWebhookRouter } from './webhooks';
export { ShopierPaymentFlow, buildHostedCheckoutHtml, buildFastPayHtml } from './payments';
export { runShopierDiagnostics, formatShopierDiagnostics } from './diagnostics';
export {
  createHtmlResponse,
  createJsonResponse,
  createRedirectResponse,
  createPaymentResponse,
  sendHtml,
  sendJson,
  handleWebhookRequest,
} from './frameworks';
export {
  createMockShopierFetch,
  createMockProduct,
  createShopierWebhookFixture,
  createOsbFixture,
} from './testing';

// Core utilities
export {
  generateSignature,
  verifySignature,
} from './core/signature';

export {
  resolveOsbCredentials,
  resolvePatCredentials,
} from './core/credentials';

export type {
  ShopierOsbCredentials,
  ShopierPatCredentials,
  ResolveOsbCredentialsOptions,
  ResolvePatCredentialsOptions,
} from './core/credentials';

// Types
export type {
  OsbCredentials,
  OsbClientConfig,
  VerifyOsbOptions,
  ParseOsbPayloadOptions,
  OsbCurrency,
  OsbPayload,
  VerifyOsbResult,
  HandleOsbResult,
} from './osb';

export type {
  ShopierApiConfig,
  ShopierApiRequestOptions,
  ShopierApiErrorBody,
  ShopierRetryOptions,
  ShopierRetryContext,
  ShopierFailureReason,
  ShopierCreateOptions,
  ShopierBalance,
  ShopierTransaction,
  ShopierCategory,
  ShopierCategoryInput,
  ShopierCategoryUpdateInput,
  ShopierDiscountCode,
  ShopierCreateDiscountCodeInput,
  ShopierUpdateDiscountCodeInput,
  ShopierAutomaticDiscount,
  ShopierCreateAutomaticDiscountInput,
  ShopierUpdateAutomaticDiscountInput,
  ShopierOrder,
  ShopierListOrdersParams,
  ShopierUpdateOrderInput,
  ShopierFulfillmentInput,
  ShopierPayout,
  ShopierProduct,
  ShopierCreateProductInput,
  ShopierUpdateProductInput,
  ShopierListProductsParams,
  ShopierRefund,
  ShopierCreateRefundInput,
  ShopierListRefundsParams,
  ShopierSelection,
  ShopierCreateSelectionInput,
  ShopierUpdateSelectionInput,
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
  ShopierWebhookEventType,
  ShopierCurrencyCode,
  ShopierProductType,
  ShopierShippingPayer,
  ShopierShippingCompany,
} from './api';

export type {
  VerifyWebhookOptions,
  ShopierWebhookEvent,
  VerifyWebhookResult,
  ShopierWebhookHeaders,
  ShopierWebhookHandler,
  ShopierWebhookRouterOptions,
  ShopierWebhookDispatchResult,
} from './webhooks';

export type {
  ShopierPaymentFlowConfig,
  CreatePaymentLinkOptions,
  CreateEphemeralPaymentOptions,
  PaymentLinkResult,
  EphemeralPaymentResult,
  HandlePaymentWebhookOptions,
  PaymentCompletedInfo,
  HandlePaymentWebhookResult,
  PaymentCompletedHandler,
  BuildHostedCheckoutHtmlOptions,
  BuildFastPayHtmlOptions,
} from './payments';

export type {
  ShopierDiagnosticStatus,
  ShopierDiagnosticRequirement,
  ShopierDiagnosticCheck,
  ShopierDiagnosticsOptions,
  ShopierDiagnosticsResult,
} from './diagnostics';

export type {
  NodeLikeResponse,
  WebhookRequestLike,
} from './frameworks';

export type {
  MockShopierFetchCall,
  MockShopierFetchResponse,
  MockShopierFetch,
  ShopierWebhookFixtureOptions,
  ShopierWebhookFixture,
  OsbFixtureOptions,
  OsbFixture,
} from './testing';

// Errors
export {
  ShopierError,
  ValidationError,
  SignatureValidationError,
  ShopierApiUnsupportedOperationError,
  ShopierApiRequestError,
  ShopierUnauthorizedPatError,
  ShopierInvalidMediaUrlError,
  ShopierRateLimitError,
  ShopierHostedCheckoutListingError,
  ShopierFetchUnavailableError,
  createShopierApiError,
} from './errors';

// Utilities
export { escapeHtml } from './utils';

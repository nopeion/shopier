/**
 * Shopier SDK - TypeScript SDK for Shopier Payment Integration
 *
 * This is the main entry point for the SDK.
 * All public APIs are exported from this file.
 *
 * @packageDocumentation
 */

// Main Shopier class
export { Shopier } from './core/shopier';
export { ShopierWebhook } from './webhook';
export { ShopierOsbClient, verifyOsb, parseOsbPayload, handleOsb } from './osb';
export { ShopierApiClient } from './api';
export { verifyWebhook, parseWebhookEvent, verifyAndParseWebhook, ShopierWebhookVerifier } from './webhooks';
export { ShopierPaymentFlow, buildFastPayHtml } from './payments';

// Core utilities
export {
  generateSignature,
  verifySignature,
  generatePaymentSignature,
  generateCallbackSignature,
} from './core/signature';

export {
  validateConfig,
  validateBuyer,
  validateAmount,
  validateEmail,
  validatePhone,
  validateInstallment,
} from './core/validator';

export {
  ConfigManager,
  resolveConfig,
  resolveApiKey,
  resolveApiSecret,
} from './core/config';

export {
  ShopierCredentialManager,
  resolveCheckoutCredentials,
  resolveOsbCredentials,
  resolvePatCredentials,
} from './core/credentials';

export type { ResolvedConfig } from './core/config';
export type {
  ShopierCheckoutCredentials,
  ShopierOsbCredentials,
  ShopierPatCredentials,
  ResolveCheckoutCredentialsOptions,
  ResolveOsbCredentialsOptions,
  ResolvePatCredentialsOptions,
  ShopierCredentialManagerOptions,
} from './core/credentials';

// Types
export type {
  BuyerInfo,
  BillingAddress,
  ShippingAddress,
  CallbackBody,
  CallbackResult,
  ShopierConfig,
  FormData,
  FormDataResult,
  PaymentOptions,
  PaymentResult,
} from './types';

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
} from './webhooks';

export type {
  ShopierPaymentFlowConfig,
  CreatePaymentLinkOptions,
  PaymentLinkResult,
  HandlePaymentWebhookOptions,
  PaymentCompletedInfo,
  HandlePaymentWebhookResult,
  PaymentCompletedHandler,
  BuildFastPayHtmlOptions,
} from './payments';

// Enums
export {
  Currency,
  Language,
  ProductType,
  PlatformType,
  WebsiteIndex,
} from './enums';

// Errors
export {
  ShopierError,
  InvalidApiKeyError,
  InvalidApiSecretError,
  ValidationError,
  SignatureValidationError,
  ShopierApiUnsupportedOperationError,
  ShopierApiRequestError,
} from './errors';

// Renderers
export {
  renderHiddenInputs,
  renderAutoSubmitHTML,
  renderButton,
  getFormDataObject,
} from './renderers';

// Utilities
export { escapeHtml, generateRandomNumber } from './utils';

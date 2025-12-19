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

export type { ResolvedConfig } from './core/config';

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

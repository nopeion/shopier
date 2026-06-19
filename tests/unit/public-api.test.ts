/**
 * Unit tests for Public API exports
 * Validates that all expected exports are available from the main entry point
 *
 * Requirements: 1.2 - Export all public APIs from a single entry point
 */

import * as ShopierSDK from '../../src';

describe('Public API Exports', () => {
  describe('Main Class', () => {
    it('should export Shopier class', () => {
      expect(ShopierSDK.Shopier).toBeDefined();
      expect(typeof ShopierSDK.Shopier).toBe('function');
    });

    it('should keep exporting legacy callback helper', () => {
      expect(ShopierSDK.ShopierWebhook).toBeDefined();
      expect(typeof ShopierSDK.ShopierWebhook).toBe('function');
    });
  });

  describe('New module surfaces', () => {
    it('should export OSB helpers', () => {
      expect(ShopierSDK.ShopierOsbClient).toBeDefined();
      expect(typeof ShopierSDK.ShopierOsbClient).toBe('function');
      expect(ShopierSDK.verifyOsb).toBeDefined();
      expect(typeof ShopierSDK.verifyOsb).toBe('function');
      expect(ShopierSDK.parseOsbPayload).toBeDefined();
      expect(typeof ShopierSDK.parseOsbPayload).toBe('function');
      expect(ShopierSDK.handleOsb).toBeDefined();
      expect(typeof ShopierSDK.handleOsb).toBe('function');
    });

    it('should export PAT API client and webhook guards', () => {
      expect(ShopierSDK.ShopierApiClient).toBeDefined();
      expect(typeof ShopierSDK.ShopierApiClient).toBe('function');
      expect(ShopierSDK.ShopierWebhookVerifier).toBeDefined();
      expect(typeof ShopierSDK.ShopierWebhookVerifier).toBe('function');
      expect(ShopierSDK.verifyWebhook).toBeDefined();
      expect(typeof ShopierSDK.verifyWebhook).toBe('function');
      expect(ShopierSDK.parseWebhookEvent).toBeDefined();
      expect(typeof ShopierSDK.parseWebhookEvent).toBe('function');
      expect(ShopierSDK.verifyAndParseWebhook).toBeDefined();
      expect(typeof ShopierSDK.verifyAndParseWebhook).toBe('function');
    });

    it('should export PAT payment link flow helpers', () => {
      expect(ShopierSDK.ShopierPaymentFlow).toBeDefined();
      expect(typeof ShopierSDK.ShopierPaymentFlow).toBe('function');
      expect(ShopierSDK.buildHostedCheckoutHtml).toBeDefined();
      expect(typeof ShopierSDK.buildHostedCheckoutHtml).toBe('function');
      expect(ShopierSDK.buildFastPayHtml).toBeDefined();
      expect(typeof ShopierSDK.buildFastPayHtml).toBe('function');
    });

    it('should export integration helper modules', () => {
      expect(ShopierSDK.runShopierDiagnostics).toBeDefined();
      expect(typeof ShopierSDK.runShopierDiagnostics).toBe('function');
      expect(ShopierSDK.ShopierWebhookRouter).toBeDefined();
      expect(typeof ShopierSDK.ShopierWebhookRouter).toBe('function');
      expect(ShopierSDK.createPaymentResponse).toBeDefined();
      expect(typeof ShopierSDK.createPaymentResponse).toBe('function');
      expect(ShopierSDK.createMockShopierFetch).toBeDefined();
      expect(typeof ShopierSDK.createMockShopierFetch).toBe('function');
    });
  });

  describe('Signature Functions', () => {
    it('should export generateSignature', () => {
      expect(ShopierSDK.generateSignature).toBeDefined();
      expect(typeof ShopierSDK.generateSignature).toBe('function');
    });

    it('should export verifySignature', () => {
      expect(ShopierSDK.verifySignature).toBeDefined();
      expect(typeof ShopierSDK.verifySignature).toBe('function');
    });

    it('should export generatePaymentSignature', () => {
      expect(ShopierSDK.generatePaymentSignature).toBeDefined();
      expect(typeof ShopierSDK.generatePaymentSignature).toBe('function');
    });

    it('should export generateCallbackSignature', () => {
      expect(ShopierSDK.generateCallbackSignature).toBeDefined();
      expect(typeof ShopierSDK.generateCallbackSignature).toBe('function');
    });
  });

  describe('Validator Functions', () => {
    it('should export validateConfig', () => {
      expect(ShopierSDK.validateConfig).toBeDefined();
      expect(typeof ShopierSDK.validateConfig).toBe('function');
    });

    it('should export validateBuyer', () => {
      expect(ShopierSDK.validateBuyer).toBeDefined();
      expect(typeof ShopierSDK.validateBuyer).toBe('function');
    });

    it('should export validateAmount', () => {
      expect(ShopierSDK.validateAmount).toBeDefined();
      expect(typeof ShopierSDK.validateAmount).toBe('function');
    });

    it('should export validateEmail', () => {
      expect(ShopierSDK.validateEmail).toBeDefined();
      expect(typeof ShopierSDK.validateEmail).toBe('function');
    });

    it('should export validatePhone', () => {
      expect(ShopierSDK.validatePhone).toBeDefined();
      expect(typeof ShopierSDK.validatePhone).toBe('function');
    });

    it('should export validateInstallment', () => {
      expect(ShopierSDK.validateInstallment).toBeDefined();
      expect(typeof ShopierSDK.validateInstallment).toBe('function');
    });
  });

  describe('Config Functions', () => {
    it('should export ConfigManager', () => {
      expect(ShopierSDK.ConfigManager).toBeDefined();
      expect(typeof ShopierSDK.ConfigManager).toBe('function');
    });

    it('should export ShopierCredentialManager', () => {
      expect(ShopierSDK.ShopierCredentialManager).toBeDefined();
      expect(typeof ShopierSDK.ShopierCredentialManager).toBe('function');
    });

    it('should export resolveConfig', () => {
      expect(ShopierSDK.resolveConfig).toBeDefined();
      expect(typeof ShopierSDK.resolveConfig).toBe('function');
    });

    it('should export resolveApiKey', () => {
      expect(ShopierSDK.resolveApiKey).toBeDefined();
      expect(typeof ShopierSDK.resolveApiKey).toBe('function');
    });

    it('should export resolveApiSecret', () => {
      expect(ShopierSDK.resolveApiSecret).toBeDefined();
      expect(typeof ShopierSDK.resolveApiSecret).toBe('function');
    });

    it('should export credential resolvers', () => {
      expect(ShopierSDK.resolveCheckoutCredentials).toBeDefined();
      expect(typeof ShopierSDK.resolveCheckoutCredentials).toBe('function');
      expect(ShopierSDK.resolveOsbCredentials).toBeDefined();
      expect(typeof ShopierSDK.resolveOsbCredentials).toBe('function');
      expect(ShopierSDK.resolvePatCredentials).toBeDefined();
      expect(typeof ShopierSDK.resolvePatCredentials).toBe('function');
    });
  });

  describe('Enums', () => {
    it('should export Currency enum', () => {
      expect(ShopierSDK.Currency).toBeDefined();
      expect(ShopierSDK.Currency.TL).toBe(0);
      expect(ShopierSDK.Currency.USD).toBe(1);
      expect(ShopierSDK.Currency.EUR).toBe(2);
    });

    it('should export Language enum', () => {
      expect(ShopierSDK.Language).toBeDefined();
      expect(ShopierSDK.Language.TR).toBe(0);
      expect(ShopierSDK.Language.EN).toBe(1);
    });

    it('should export ProductType enum', () => {
      expect(ShopierSDK.ProductType).toBeDefined();
      expect(ShopierSDK.ProductType.REAL_OBJECT).toBe(0);
      expect(ShopierSDK.ProductType.DOWNLOADABLE_VIRTUAL).toBe(1);
      expect(ShopierSDK.ProductType.DEFAULT).toBe(2);
    });

    it('should export PlatformType enum', () => {
      expect(ShopierSDK.PlatformType).toBeDefined();
      expect(ShopierSDK.PlatformType.IN_FRAME).toBe(0);
      expect(ShopierSDK.PlatformType.NOT_IN_FRAME).toBe(1);
    });

    it('should export WebsiteIndex enum', () => {
      expect(ShopierSDK.WebsiteIndex).toBeDefined();
      expect(ShopierSDK.WebsiteIndex.SITE_1).toBe(1);
      expect(ShopierSDK.WebsiteIndex.SITE_5).toBe(5);
    });
  });

  describe('Error Classes', () => {
    it('should export ShopierError', () => {
      expect(ShopierSDK.ShopierError).toBeDefined();
      expect(typeof ShopierSDK.ShopierError).toBe('function');
    });

    it('should export InvalidApiKeyError', () => {
      expect(ShopierSDK.InvalidApiKeyError).toBeDefined();
      expect(typeof ShopierSDK.InvalidApiKeyError).toBe('function');
    });

    it('should export InvalidApiSecretError', () => {
      expect(ShopierSDK.InvalidApiSecretError).toBeDefined();
      expect(typeof ShopierSDK.InvalidApiSecretError).toBe('function');
    });

    it('should export ValidationError', () => {
      expect(ShopierSDK.ValidationError).toBeDefined();
      expect(typeof ShopierSDK.ValidationError).toBe('function');
    });

    it('should export SignatureValidationError', () => {
      expect(ShopierSDK.SignatureValidationError).toBeDefined();
      expect(typeof ShopierSDK.SignatureValidationError).toBe('function');
    });

    it('should export ShopierApiUnsupportedOperationError', () => {
      expect(ShopierSDK.ShopierApiUnsupportedOperationError).toBeDefined();
      expect(typeof ShopierSDK.ShopierApiUnsupportedOperationError).toBe('function');
    });

    it('should export ShopierApiRequestError', () => {
      expect(ShopierSDK.ShopierApiRequestError).toBeDefined();
      expect(typeof ShopierSDK.ShopierApiRequestError).toBe('function');
    });

    it('should export specific API error classes', () => {
      expect(ShopierSDK.ShopierUnauthorizedPatError).toBeDefined();
      expect(typeof ShopierSDK.ShopierUnauthorizedPatError).toBe('function');
      expect(ShopierSDK.ShopierInvalidMediaUrlError).toBeDefined();
      expect(typeof ShopierSDK.ShopierInvalidMediaUrlError).toBe('function');
      expect(ShopierSDK.ShopierRateLimitError).toBeDefined();
      expect(typeof ShopierSDK.ShopierRateLimitError).toBe('function');
      expect(ShopierSDK.ShopierHostedCheckoutListingError).toBeDefined();
      expect(typeof ShopierSDK.ShopierHostedCheckoutListingError).toBe('function');
      expect(ShopierSDK.ShopierFetchUnavailableError).toBeDefined();
      expect(typeof ShopierSDK.ShopierFetchUnavailableError).toBe('function');
    });
  });

  describe('Renderer Functions', () => {
    it('should export renderHiddenInputs', () => {
      expect(ShopierSDK.renderHiddenInputs).toBeDefined();
      expect(typeof ShopierSDK.renderHiddenInputs).toBe('function');
    });

    it('should export renderAutoSubmitHTML', () => {
      expect(ShopierSDK.renderAutoSubmitHTML).toBeDefined();
      expect(typeof ShopierSDK.renderAutoSubmitHTML).toBe('function');
    });

    it('should export renderButton', () => {
      expect(ShopierSDK.renderButton).toBeDefined();
      expect(typeof ShopierSDK.renderButton).toBe('function');
    });

    it('should export getFormDataObject', () => {
      expect(ShopierSDK.getFormDataObject).toBeDefined();
      expect(typeof ShopierSDK.getFormDataObject).toBe('function');
    });
  });

  describe('Utility Functions', () => {
    it('should export escapeHtml', () => {
      expect(ShopierSDK.escapeHtml).toBeDefined();
      expect(typeof ShopierSDK.escapeHtml).toBe('function');
    });

    it('should export generateRandomNumber', () => {
      expect(ShopierSDK.generateRandomNumber).toBeDefined();
      expect(typeof ShopierSDK.generateRandomNumber).toBe('function');
    });
  });
});

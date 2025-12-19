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

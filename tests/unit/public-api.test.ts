import * as ShopierSDK from '../../src';

describe('Public API Exports', () => {
  it('should not expose the removed classic checkout surface', () => {
    expect((ShopierSDK as Record<string, unknown>).Shopier).toBeUndefined();
    expect((ShopierSDK as Record<string, unknown>).ShopierWebhook).toBeUndefined();
    expect((ShopierSDK as Record<string, unknown>).generatePaymentSignature).toBeUndefined();
    expect((ShopierSDK as Record<string, unknown>).generateCallbackSignature).toBeUndefined();
    expect((ShopierSDK as Record<string, unknown>).resolveCheckoutCredentials).toBeUndefined();
    expect((ShopierSDK as Record<string, unknown>).renderAutoSubmitHTML).toBeUndefined();
    expect((ShopierSDK as Record<string, unknown>).renderHiddenInputs).toBeUndefined();
    expect((ShopierSDK as Record<string, unknown>).renderButton).toBeUndefined();
    expect((ShopierSDK as Record<string, unknown>).Currency).toBeUndefined();
    expect((ShopierSDK as Record<string, unknown>).ProductType).toBeUndefined();
    expect((ShopierSDK as Record<string, unknown>).PlatformType).toBeUndefined();
    expect((ShopierSDK as Record<string, unknown>).WebsiteIndex).toBeUndefined();
    expect((ShopierSDK as Record<string, unknown>).InvalidApiKeyError).toBeUndefined();
    expect((ShopierSDK as Record<string, unknown>).InvalidApiSecretError).toBeUndefined();
  });

  it('should export OSB helpers', () => {
    expect(ShopierSDK.ShopierOsbClient).toBeDefined();
    expect(typeof ShopierSDK.ShopierOsbClient).toBe('function');
    expect(typeof ShopierSDK.verifyOsb).toBe('function');
    expect(typeof ShopierSDK.parseOsbPayload).toBe('function');
    expect(typeof ShopierSDK.handleOsb).toBe('function');
  });

  it('should export PAT API client and REST webhook guards', () => {
    expect(typeof ShopierSDK.ShopierApiClient).toBe('function');
    expect(typeof ShopierSDK.ShopierWebhookVerifier).toBe('function');
    expect(typeof ShopierSDK.verifyWebhook).toBe('function');
    expect(typeof ShopierSDK.parseWebhookEvent).toBe('function');
    expect(typeof ShopierSDK.verifyAndParseWebhook).toBe('function');
  });

  it('should export PAT payment flow helpers', () => {
    expect(typeof ShopierSDK.ShopierPaymentFlow).toBe('function');
    expect(typeof ShopierSDK.buildHostedCheckoutHtml).toBe('function');
    expect(typeof ShopierSDK.buildFastPayHtml).toBe('function');
  });

  it('should export integration helper modules', () => {
    expect(typeof ShopierSDK.runShopierDiagnostics).toBe('function');
    expect(typeof ShopierSDK.ShopierWebhookRouter).toBe('function');
    expect(typeof ShopierSDK.createPaymentResponse).toBe('function');
    expect(typeof ShopierSDK.createMockShopierFetch).toBe('function');
  });

  it('should export generic signature helpers', () => {
    expect(typeof ShopierSDK.generateSignature).toBe('function');
    expect(typeof ShopierSDK.verifySignature).toBe('function');
  });

  it('should export current credential resolvers', () => {
    expect(typeof ShopierSDK.resolveOsbCredentials).toBe('function');
    expect(typeof ShopierSDK.resolvePatCredentials).toBe('function');
  });

  it('should export shared error classes', () => {
    expect(typeof ShopierSDK.ShopierError).toBe('function');
    expect(typeof ShopierSDK.ValidationError).toBe('function');
    expect(typeof ShopierSDK.SignatureValidationError).toBe('function');
    expect(typeof ShopierSDK.ShopierApiRequestError).toBe('function');
  });

  it('should export specific API error classes', () => {
    expect(typeof ShopierSDK.ShopierUnauthorizedPatError).toBe('function');
    expect(typeof ShopierSDK.ShopierInvalidMediaUrlError).toBe('function');
    expect(typeof ShopierSDK.ShopierRateLimitError).toBe('function');
    expect(typeof ShopierSDK.ShopierHostedCheckoutListingError).toBe('function');
    expect(typeof ShopierSDK.ShopierFetchUnavailableError).toBe('function');
  });
});

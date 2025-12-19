import {
  ConfigManager,
  resolveConfig,
  resolveApiKey,
  resolveApiSecret,
} from '../../src/core/config';
import { InvalidApiKeyError, InvalidApiSecretError } from '../../src/errors';
import { Language, WebsiteIndex } from '../../src/enums';

describe('Config Manager', () => {
  // Store original env vars to restore after tests
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clear relevant env vars before each test
    delete process.env.SHOPIER_API_KEY;
    delete process.env.SHOPIER_API_SECRET;
  });

  afterAll(() => {
    // Restore original env vars
    process.env = originalEnv;
  });

  describe('resolveApiKey', () => {
    it('should return config value when provided', () => {
      const result = resolveApiKey('config-api-key');
      expect(result).toBe('config-api-key');
    });

    it('should return env var when config is not provided', () => {
      process.env.SHOPIER_API_KEY = 'env-api-key';
      const result = resolveApiKey();
      expect(result).toBe('env-api-key');
    });

    it('should return env var when config is empty string', () => {
      process.env.SHOPIER_API_KEY = 'env-api-key';
      const result = resolveApiKey('');
      expect(result).toBe('env-api-key');
    });

    it('should return env var when config is whitespace only', () => {
      process.env.SHOPIER_API_KEY = 'env-api-key';
      const result = resolveApiKey('   ');
      expect(result).toBe('env-api-key');
    });

    it('should prioritize config over env var (Requirement 7.3)', () => {
      process.env.SHOPIER_API_KEY = 'env-api-key';
      const result = resolveApiKey('config-api-key');
      expect(result).toBe('config-api-key');
    });

    it('should return undefined when neither config nor env var is set', () => {
      const result = resolveApiKey();
      expect(result).toBeUndefined();
    });

    it('should trim whitespace from config value', () => {
      const result = resolveApiKey('  trimmed-key  ');
      expect(result).toBe('trimmed-key');
    });

    it('should trim whitespace from env var value', () => {
      process.env.SHOPIER_API_KEY = '  trimmed-env-key  ';
      const result = resolveApiKey();
      expect(result).toBe('trimmed-env-key');
    });
  });

  describe('resolveApiSecret', () => {
    it('should return config value when provided', () => {
      const result = resolveApiSecret('config-api-secret');
      expect(result).toBe('config-api-secret');
    });

    it('should return env var when config is not provided', () => {
      process.env.SHOPIER_API_SECRET = 'env-api-secret';
      const result = resolveApiSecret();
      expect(result).toBe('env-api-secret');
    });

    it('should return env var when config is empty string', () => {
      process.env.SHOPIER_API_SECRET = 'env-api-secret';
      const result = resolveApiSecret('');
      expect(result).toBe('env-api-secret');
    });

    it('should prioritize config over env var (Requirement 7.3)', () => {
      process.env.SHOPIER_API_SECRET = 'env-api-secret';
      const result = resolveApiSecret('config-api-secret');
      expect(result).toBe('config-api-secret');
    });

    it('should return undefined when neither config nor env var is set', () => {
      const result = resolveApiSecret();
      expect(result).toBeUndefined();
    });
  });

  describe('resolveConfig', () => {
    it('should resolve config with all values from config object', () => {
      const config = {
        apiKey: 'my-api-key',
        apiSecret: 'my-api-secret',
        language: Language.EN,
        moduleVersion: '2.0.0',
        websiteIndex: WebsiteIndex.SITE_3,
      };

      const result = resolveConfig(config);

      expect(result.apiKey).toBe('my-api-key');
      expect(result.apiSecret).toBe('my-api-secret');
      expect(result.language).toBe(Language.EN);
      expect(result.moduleVersion).toBe('2.0.0');
      expect(result.websiteIndex).toBe(WebsiteIndex.SITE_3);
    });

    it('should use default values for optional fields', () => {
      const config = {
        apiKey: 'my-api-key',
        apiSecret: 'my-api-secret',
      };

      const result = resolveConfig(config);

      expect(result.language).toBe(Language.TR);
      expect(result.moduleVersion).toBe('1.0.4');
      expect(result.websiteIndex).toBe(WebsiteIndex.SITE_1);
    });

    it('should fall back to env vars for credentials (Requirements 7.1, 7.2)', () => {
      process.env.SHOPIER_API_KEY = 'env-api-key';
      process.env.SHOPIER_API_SECRET = 'env-api-secret';

      const result = resolveConfig({});

      expect(result.apiKey).toBe('env-api-key');
      expect(result.apiSecret).toBe('env-api-secret');
    });

    it('should throw InvalidApiKeyError when API key is missing', () => {
      process.env.SHOPIER_API_SECRET = 'env-api-secret';

      expect(() => resolveConfig({})).toThrow(InvalidApiKeyError);
      expect(() => resolveConfig({})).toThrow('API key is missing or empty');
    });

    it('should throw InvalidApiSecretError when API secret is missing', () => {
      process.env.SHOPIER_API_KEY = 'env-api-key';

      expect(() => resolveConfig({})).toThrow(InvalidApiSecretError);
      expect(() => resolveConfig({})).toThrow('API secret is missing or empty');
    });

    it('should work with empty config object when env vars are set', () => {
      process.env.SHOPIER_API_KEY = 'env-key';
      process.env.SHOPIER_API_SECRET = 'env-secret';

      const result = resolveConfig({});

      expect(result.apiKey).toBe('env-key');
      expect(result.apiSecret).toBe('env-secret');
    });

    it('should work with no config argument when env vars are set', () => {
      process.env.SHOPIER_API_KEY = 'env-key';
      process.env.SHOPIER_API_SECRET = 'env-secret';

      const result = resolveConfig();

      expect(result.apiKey).toBe('env-key');
      expect(result.apiSecret).toBe('env-secret');
    });
  });

  describe('ConfigManager class', () => {
    it('should create instance with valid config', () => {
      const manager = new ConfigManager({
        apiKey: 'test-key',
        apiSecret: 'test-secret',
      });

      expect(manager.getApiKey()).toBe('test-key');
      expect(manager.getApiSecret()).toBe('test-secret');
    });

    it('should create instance using env vars', () => {
      process.env.SHOPIER_API_KEY = 'env-key';
      process.env.SHOPIER_API_SECRET = 'env-secret';

      const manager = new ConfigManager();

      expect(manager.getApiKey()).toBe('env-key');
      expect(manager.getApiSecret()).toBe('env-secret');
    });

    it('should return default language', () => {
      const manager = new ConfigManager({
        apiKey: 'test-key',
        apiSecret: 'test-secret',
      });

      expect(manager.getLanguage()).toBe(Language.TR);
    });

    it('should return configured language', () => {
      const manager = new ConfigManager({
        apiKey: 'test-key',
        apiSecret: 'test-secret',
        language: Language.EN,
      });

      expect(manager.getLanguage()).toBe(Language.EN);
    });

    it('should return default module version', () => {
      const manager = new ConfigManager({
        apiKey: 'test-key',
        apiSecret: 'test-secret',
      });

      expect(manager.getModuleVersion()).toBe('1.0.4');
    });

    it('should return default website index', () => {
      const manager = new ConfigManager({
        apiKey: 'test-key',
        apiSecret: 'test-secret',
      });

      expect(manager.getWebsiteIndex()).toBe(WebsiteIndex.SITE_1);
    });

    it('should return complete config via getConfig()', () => {
      const manager = new ConfigManager({
        apiKey: 'test-key',
        apiSecret: 'test-secret',
        language: Language.EN,
      });

      const config = manager.getConfig();

      expect(config.apiKey).toBe('test-key');
      expect(config.apiSecret).toBe('test-secret');
      expect(config.language).toBe(Language.EN);
      expect(config.moduleVersion).toBe('1.0.4');
      expect(config.websiteIndex).toBe(WebsiteIndex.SITE_1);
    });

    it('should update config values', () => {
      const manager = new ConfigManager({
        apiKey: 'test-key',
        apiSecret: 'test-secret',
      });

      manager.updateConfig({ language: Language.EN });

      expect(manager.getLanguage()).toBe(Language.EN);
    });

    it('should update API key', () => {
      const manager = new ConfigManager({
        apiKey: 'old-key',
        apiSecret: 'test-secret',
      });

      manager.updateConfig({ apiKey: 'new-key' });

      expect(manager.getApiKey()).toBe('new-key');
    });

    it('should throw when updating with empty API key', () => {
      const manager = new ConfigManager({
        apiKey: 'test-key',
        apiSecret: 'test-secret',
      });

      expect(() => manager.updateConfig({ apiKey: '' })).toThrow(InvalidApiKeyError);
    });

    it('should throw when updating with empty API secret', () => {
      const manager = new ConfigManager({
        apiKey: 'test-key',
        apiSecret: 'test-secret',
      });

      expect(() => manager.updateConfig({ apiSecret: '' })).toThrow(InvalidApiSecretError);
    });

    it('should throw InvalidApiKeyError when created without API key', () => {
      expect(() => new ConfigManager({})).toThrow(InvalidApiKeyError);
    });

    it('should throw InvalidApiSecretError when created without API secret', () => {
      process.env.SHOPIER_API_KEY = 'env-key';

      expect(() => new ConfigManager({})).toThrow(InvalidApiSecretError);
    });
  });
});

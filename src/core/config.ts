import { ShopierConfig } from '../types';
import { Language, WebsiteIndex } from '../enums';
import { InvalidApiKeyError, InvalidApiSecretError } from '../errors';

/**
 * Default configuration values for Shopier SDK
 */
const DEFAULT_CONFIG = {
  language: Language.TR,
  moduleVersion: '1.0.4',
  websiteIndex: WebsiteIndex.SITE_1,
} as const;

/**
 * Environment variable names for Shopier credentials
 */
const ENV_VARS = {
  API_KEY: 'SHOPIER_API_KEY',
  API_SECRET: 'SHOPIER_API_SECRET',
} as const;

/**
 * Resolved configuration with all values populated
 */
export interface ResolvedConfig {
  apiKey: string;
  apiSecret: string;
  language: Language;
  moduleVersion: string;
  websiteIndex: WebsiteIndex;
}

/**
 * Resolves API key from config or environment variable.
 * Config value takes priority over environment variable.
 * 
 * @param configValue - API key from config (optional)
 * @returns Resolved API key or undefined if not found
 */
export function resolveApiKey(configValue?: string): string | undefined {
  // Config value takes priority (Requirement 7.3)
  if (configValue && configValue.trim() !== '') {
    return configValue.trim();
  }
  
  // Fall back to environment variable (Requirement 7.1)
  const envValue = process.env[ENV_VARS.API_KEY];
  if (envValue && envValue.trim() !== '') {
    return envValue.trim();
  }
  
  return undefined;
}

/**
 * Resolves API secret from config or environment variable.
 * Config value takes priority over environment variable.
 * 
 * @param configValue - API secret from config (optional)
 * @returns Resolved API secret or undefined if not found
 */
export function resolveApiSecret(configValue?: string): string | undefined {
  // Config value takes priority (Requirement 7.3)
  if (configValue && configValue.trim() !== '') {
    return configValue.trim();
  }
  
  // Fall back to environment variable (Requirement 7.2)
  const envValue = process.env[ENV_VARS.API_SECRET];
  if (envValue && envValue.trim() !== '') {
    return envValue.trim();
  }
  
  return undefined;
}

/**
 * Resolves and validates the complete Shopier configuration.
 * Merges provided config with defaults and environment variables.
 * 
 * Priority order (highest to lowest):
 * 1. Explicitly provided config values
 * 2. Environment variables (for credentials only)
 * 3. Default values
 * 
 * @param config - Partial configuration provided by user
 * @returns Fully resolved configuration with all required values
 * @throws InvalidApiKeyError if API key cannot be resolved
 * @throws InvalidApiSecretError if API secret cannot be resolved
 */
export function resolveConfig(config: ShopierConfig = {}): ResolvedConfig {
  const apiKey = resolveApiKey(config.apiKey);
  const apiSecret = resolveApiSecret(config.apiSecret);
  
  // Validate credentials
  if (!apiKey) {
    throw new InvalidApiKeyError('API key is missing or empty');
  }
  
  if (!apiSecret) {
    throw new InvalidApiSecretError('API secret is missing or empty');
  }
  
  return {
    apiKey,
    apiSecret,
    language: config.language ?? DEFAULT_CONFIG.language,
    moduleVersion: config.moduleVersion ?? DEFAULT_CONFIG.moduleVersion,
    websiteIndex: config.websiteIndex ?? DEFAULT_CONFIG.websiteIndex,
  };
}

/**
 * Creates a config manager instance for managing Shopier configuration.
 * Provides methods to get resolved values and update configuration.
 */
export class ConfigManager {
  private config: ResolvedConfig;
  
  /**
   * Creates a new ConfigManager instance.
   * 
   * @param config - Initial configuration (optional)
   * @throws InvalidApiKeyError if API key cannot be resolved
   * @throws InvalidApiSecretError if API secret cannot be resolved
   */
  constructor(config: ShopierConfig = {}) {
    this.config = resolveConfig(config);
  }
  
  /**
   * Gets the resolved API key.
   */
  getApiKey(): string {
    return this.config.apiKey;
  }
  
  /**
   * Gets the resolved API secret.
   */
  getApiSecret(): string {
    return this.config.apiSecret;
  }
  
  /**
   * Gets the configured language.
   */
  getLanguage(): Language {
    return this.config.language;
  }
  
  /**
   * Gets the module version.
   */
  getModuleVersion(): string {
    return this.config.moduleVersion;
  }
  
  /**
   * Gets the website index.
   */
  getWebsiteIndex(): WebsiteIndex {
    return this.config.websiteIndex;
  }
  
  /**
   * Gets the complete resolved configuration.
   */
  getConfig(): Readonly<ResolvedConfig> {
    return { ...this.config };
  }
  
  /**
   * Updates the configuration with new values.
   * Only updates provided values, keeps existing values for undefined properties.
   * 
   * @param updates - Partial configuration updates
   */
  updateConfig(updates: Partial<ShopierConfig>): void {
    if (updates.apiKey !== undefined) {
      const apiKey = resolveApiKey(updates.apiKey);
      if (!apiKey) {
        throw new InvalidApiKeyError('API key is missing or empty');
      }
      this.config.apiKey = apiKey;
    }
    
    if (updates.apiSecret !== undefined) {
      const apiSecret = resolveApiSecret(updates.apiSecret);
      if (!apiSecret) {
        throw new InvalidApiSecretError('API secret is missing or empty');
      }
      this.config.apiSecret = apiSecret;
    }
    
    if (updates.language !== undefined) {
      this.config.language = updates.language;
    }
    
    if (updates.moduleVersion !== undefined) {
      this.config.moduleVersion = updates.moduleVersion;
    }
    
    if (updates.websiteIndex !== undefined) {
      this.config.websiteIndex = updates.websiteIndex;
    }
  }
}

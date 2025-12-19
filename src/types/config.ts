import { Language, WebsiteIndex } from '../enums';

/**
 * Configuration options for Shopier SDK
 */
export interface ShopierConfig {
  /** API key (falls back to SHOPIER_API_KEY env var) */
  apiKey?: string;
  /** API secret (falls back to SHOPIER_API_SECRET env var) */
  apiSecret?: string;
  /** Language for payment page (default: Language.TR) */
  language?: Language;
  /** Module version (default: '1.0.4') */
  moduleVersion?: string;
  /** Website index for multi-site support (default: WebsiteIndex.SITE_1) */
  websiteIndex?: WebsiteIndex;
}

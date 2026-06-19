import { Language, WebsiteIndex } from '../enums';

/**
 * Configuration options for Shopier SDK
 */
export interface ShopierConfig {
  /** API key (falls back to SHOPIER_API_KEY env var) */
  apiKey?: string;
  /** API secret (falls back to SHOPIER_API_SECRET env var) */
  apiSecret?: string;
  /** Named checkout credential set, e.g. "primary" maps to SHOPIER_CHECKOUT_PRIMARY_* */
  credentialName?: string;
  /** Custom env prefix, e.g. "SHOPIER_CHECKOUT_PRIMARY" maps to *_API_KEY and *_API_SECRET */
  envPrefix?: string;
  /** Language for payment page (default: Language.TR) */
  language?: Language;
  /** Module version (default: '1.0.4') */
  moduleVersion?: string;
  /** Website index for multi-site support (default: WebsiteIndex.SITE_1) */
  websiteIndex?: WebsiteIndex;
}

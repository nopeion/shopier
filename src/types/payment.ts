import { Currency, Language, ProductType, PlatformType, WebsiteIndex } from '../enums';
import { BuyerInfo } from './buyer';
import { BillingAddress, ShippingAddress } from './address';

/**
 * Options for creating a payment
 */
export interface PaymentOptions {
    /** Payment amount (must be positive) */
    amount: number;

    /** Buyer information (required) */
    buyer: BuyerInfo;

    /** Billing address (optional, defaults to buyer info placeholder) */
    billing?: BillingAddress;

    /** Shipping address (optional, defaults to billing address) */
    shipping?: ShippingAddress;

    /** Currency (optional, default: TL) */
    currency?: Currency;

    /** Maximum installment (0-12, optional, default: 0) */
    maxInstallment?: number;

    /** Language (optional, default: TR) */
    language?: Language;

    /** Product type (optional, default: REAL_OBJECT) */
    productType?: ProductType;

    /** Platform type (optional, default: WEB) */
    platformType?: PlatformType;

    /** Website index 1-5 (optional, default: 1) */
    websiteIndex?: WebsiteIndex;

    /** Display in iframe (optional, default: false) */
    isInFrame?: boolean;

    /** Override random number for testing (optional) */
    randomNr?: number;
}

/**
 * Result of createPayment method
 */
export interface PaymentResult {
    /** Auto-submit HTML page */
    html: string;

    /** Form data object for custom rendering */
    formData: import('./form').FormData;

    /** Shopier action URL */
    actionUrl: string;

    /** Hidden inputs HTML for custom forms */
    hiddenInputs: string;
}

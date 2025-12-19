import {
  ShopierConfig,
  BuyerInfo,
  BillingAddress,
  ShippingAddress,
  FormData,
  CallbackBody,
  CallbackResult,
  PaymentOptions,
  PaymentResult,
} from '../types';
import {
  Currency,
  Language,
  ProductType,
  PlatformType,
} from '../enums';
import { SignatureValidationError, ValidationError } from '../errors';
import { resolveConfig, ResolvedConfig } from './config';
import { verifySignature } from './signature';
import { generatePaymentSignature, generateSignature } from './signature';
import { validateBuyer, validateAmount, validateInstallment } from './validator';
import { generateRandomNumber } from '../utils';
import {
  renderAutoSubmitHTML as renderAutoSubmit,
  renderHiddenInputs as renderInputs,
} from '../renderers';

/**
 * Default Shopier action URL
 */
const SHOPIER_ACTION_URL = 'https://www.shopier.com/ShowProduct/api_pay4.php';

/**
 * Main Shopier SDK class for payment integration.
 * 
 * @example
 * ```typescript
 * const shopier = new Shopier({ apiKey, apiSecret });
 * 
 * const { html } = shopier.createPayment({
 *   amount: 99.99,
 *   buyer: { id: '123', firstName: 'John', ... },
 *   billing: { address: '...', city: '...' }
 * });
 * ```
 */
export class Shopier {
  private config: ResolvedConfig;

  /**
   * Creates a new Shopier instance.
   * 
   * @param config - Configuration options (optional, falls back to env vars)
   * @throws InvalidApiKeyError if API key is missing
   * @throws InvalidApiSecretError if API secret is missing
   */
  constructor(config?: ShopierConfig) {
    this.config = resolveConfig(config);
  }

  /**
   * Creates a payment and returns all necessary data for rendering.
   * 
   * @param options - Payment options including amount, buyer, and billing info
   * @returns PaymentResult with HTML, form data, action URL, and hidden inputs
   * @throws ValidationError if buyer info is missing or invalid
   * @throws ValidationError if amount is invalid
   * 
   * @example
   * ```typescript
   * const { html, formData, actionUrl } = shopier.createPayment({
   *   amount: 99.99,
   *   currency: Currency.TL,
   *   buyer: {
   *     id: '12345',
   *     firstName: 'Ahmet',
   *     lastName: 'Yılmaz',
   *     email: 'ahmet@example.com',
   *     phone: '05551234567',
   *     productName: 'Premium Üyelik'
   *   },
   *   billing: {
   *     address: 'Test Sokak No:1',
   *     city: 'İstanbul',
   *     country: 'Türkiye',
   *     postcode: '34000'
   *   }
   * });
   * ```
   */
  createPayment(options: PaymentOptions): PaymentResult {
    const formData = this.buildFormData(options);
    const html = renderAutoSubmit(formData, SHOPIER_ACTION_URL, options.language ?? this.config.language);
    const hiddenInputs = renderInputs(formData);

    return {
      html,
      formData,
      actionUrl: SHOPIER_ACTION_URL,
      hiddenInputs,
    };
  }

  /**
   * Verifies the signature of an incoming callback from Shopier.
   * 
   * @param body - The raw body of the POST request received from Shopier
   * @returns The verified callback result containing status and order details
   * @throws {SignatureValidationError} If the signature verification fails
   * 
   * @example
   * ```typescript
   * const result = shopier.verifyCallback(req.body);
   * if (result.success) {
   *   // Payment successful
   * }
   * ```
   */
  verifyCallback(body: CallbackBody): CallbackResult {
    const data = `${body.random_nr}${body.platform_order_id}`;

    if (!verifySignature(this.config.apiSecret, data, body.signature)) {
      throw new SignatureValidationError('Callback signature verification failed');
    }

    return {
      success: body.status === 'success',
      orderId: body.platform_order_id,
      paymentId: body.payment_id,
      installment: parseInt(body.installment, 10) || 0,
      platformOrderId: body.platform_order_id,
      status: body.status,
    };
  }

  /**
   * Generates a signature for the given data.
   * Exposed for testing and debugging purposes.
   * 
   * @param data - Data to sign
   * @returns Base64-encoded HMAC-SHA256 signature
   */
  generateSignature(data: string): string {
    return generateSignature(this.config.apiSecret, data);
  }

  /**
   * Builds the form data object for payment submission.
   */
  private buildFormData(options: PaymentOptions): FormData {
    const {
      amount,
      buyer,
      billing,
      shipping,
      currency = Currency.TL,
      maxInstallment = 0,
      language = this.config.language,
      productType = ProductType.REAL_OBJECT,
      platformType = PlatformType.NOT_IN_FRAME,
      websiteIndex = this.config.websiteIndex,
      isInFrame = false,
      randomNr: randomNrOverride,
    } = options;

    // Validate inputs
    validateAmount(amount);
    validateBuyer(buyer);
    if (maxInstallment !== 0) {
      validateInstallment(maxInstallment);
    }

    // Use override or generate random number
    const randomNr = randomNrOverride ?? generateRandomNumber();

    // Generate order ID
    const orderId = buyer.platformOrderId || buyer.id;

    // Generate signature
    const signature = generatePaymentSignature(
      this.config.apiSecret,
      randomNr,
      orderId,
      amount,
      currency
    );

    // Get product type from buyer or default
    const finalProductType = buyer.productType ?? productType;

    // Build billing address (use empty strings if not provided)
    const billingAddr = billing || {
      address: '',
      city: '',
      country: '',
      postcode: '',
    };

    // Build shipping address (use billing if not provided)
    const shippingAddr = shipping || billing || {
      address: '',
      city: '',
      country: '',
      postcode: '',
    };

    return {
      API_key: this.config.apiKey,
      website_index: websiteIndex,
      platform_order_id: orderId,
      product_name: buyer.productName,
      product_type: finalProductType,
      buyer_name: buyer.firstName,
      buyer_surname: buyer.lastName,
      buyer_email: buyer.email,
      buyer_account_age: buyer.accountAge ?? 0,
      buyer_id_nr: buyer.id,
      buyer_phone: buyer.phone,
      billing_address: billingAddr.address,
      billing_city: billingAddr.city,
      billing_country: billingAddr.country,
      billing_postcode: billingAddr.postcode,
      shipping_address: shippingAddr.address,
      shipping_city: shippingAddr.city,
      shipping_country: shippingAddr.country,
      shipping_postcode: shippingAddr.postcode,
      total_order_value: amount,
      currency,
      platform: maxInstallment,
      is_in_frame: isInFrame ? PlatformType.IN_FRAME : platformType,
      current_language: language,
      modul_version: this.config.moduleVersion,
      random_nr: randomNr,
      signature,
    };
  }
}

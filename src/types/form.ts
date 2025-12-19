/**
 * Form data to be submitted to Shopier
 */
export interface PaymentBuilder {
  /** The complete auto-submit HTML page */
  html: string;
  /** The form data object */
  formData: FormData;
  /** The Shopier action URL */
  actionUrl: string;
}

export interface FormData {
  /** API key */
  API_key: string;
  /** Website index (1-5) */
  website_index: number;
  /** Platform order ID */
  platform_order_id: string;
  /** Product name */
  product_name: string;
  /** Product type (0, 1, or 2) */
  product_type: number;
  /** Buyer first name */
  buyer_name: string;
  /** Buyer last name */
  buyer_surname: string;
  /** Buyer email */
  buyer_email: string;
  /** Buyer account age in days */
  buyer_account_age: number;
  /** Buyer ID number */
  buyer_id_nr: string;
  /** Buyer phone number */
  buyer_phone: string;
  /** Billing street address */
  billing_address: string;
  /** Billing city */
  billing_city: string;
  /** Billing country */
  billing_country: string;
  /** Billing postal code */
  billing_postcode: string;
  /** Shipping street address */
  shipping_address: string;
  /** Shipping city */
  shipping_city: string;
  /** Shipping country */
  shipping_country: string;
  /** Shipping postal code */
  shipping_postcode: string;
  /** Total order value */
  total_order_value: number;
  /** Currency (0=TL, 1=USD, 2=EUR) */
  currency: number;
  /** Platform identifier */
  platform: number;
  /** Whether displayed in iframe (0 or 1) */
  is_in_frame: number;
  /** Current language (0=TR, 1=EN) */
  current_language: number;
  /** Module version */
  modul_version: string;
  /** Random number for signature */
  random_nr: number;
  /** HMAC-SHA256 signature */
  signature: string;
}

/**
 * Result of getFormData method
 */
export interface FormDataResult {
  /** Form data object */
  formData: FormData;
  /** Shopier action URL */
  actionUrl: string;
}

/**
 * Options for button renderer
 */
export interface ButtonOptions {
  /** Button text (default: "Pay with Shopier") */
  buttonText?: string;
  /** Custom CSS class for button */
  className?: string;
  /** Custom inline styles */
  style?: string;
}

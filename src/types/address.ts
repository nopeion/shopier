/**
 * Billing address information
 */
export interface BillingAddress {
  /** Street address */
  address: string;
  /** City */
  city: string;
  /** Country */
  country: string;
  /** Postal code */
  postcode: string;
}

/**
 * Shipping address information
 */
export interface ShippingAddress {
  /** Street address */
  address: string;
  /** City */
  city: string;
  /** Country */
  country: string;
  /** Postal code */
  postcode: string;
}

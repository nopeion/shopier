import { ProductType } from '../enums';

/**
 * Buyer information for Shopier payment
 */
export interface BuyerInfo {
  /** Unique buyer ID */
  id: string;
  /** Custom order ID (optional) */
  platformOrderId?: string;
  /** Product name */
  productName: string;
  /** Product type (optional, defaults to REAL_OBJECT) */
  productType?: ProductType;
  /** Buyer first name */
  firstName: string;
  /** Buyer last name */
  lastName: string;
  /** Valid email address */
  email: string;
  /** Phone number */
  phone: string;
  /** Account age in days (optional) */
  accountAge?: number;
}

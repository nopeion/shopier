/**
 * Callback body received from Shopier after payment
 */
export interface CallbackBody {
  /** Random number used for signature verification */
  random_nr: string;
  /** Platform order ID */
  platform_order_id: string;
  /** Shopier payment ID */
  payment_id?: string;
  /** Number of installments */
  installment?: string;
  /** Payment status */
  status: 'success' | 'failed' | string;
  /** Signature for verification */
  signature: string;
  /** Additional callback fields returned by Shopier */
  [key: string]: unknown;
}

/**
 * Result of callback verification
 */
export interface CallbackResult {
  /** Whether verification was successful */
  success: boolean;
  /** Order ID */
  orderId: string;
  /** Shopier payment ID */
  paymentId?: string;
  /** Number of installments */
  installment: number;
  /** Original platform order ID */
  platformOrderId: string;
  /** Payment status */
  status: 'success' | 'failed' | string;
  /** Raw callback body */
  raw: CallbackBody;
}
